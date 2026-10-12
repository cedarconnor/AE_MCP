import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../jsx/serve.jsx", import.meta.url), "utf8");
function host(claimFails = false, publishFails = false) {
  const files = new Map<string, string>();
  const request = "/mail/request-test.json";
  files.set(request, JSON.stringify({ id: "test", code: "app.executed++; return 7;" }));
  class File {
    error = "";
    encoding = "";
    mode = "";
    constructor(public fsName: string) {}
    get name() {
      return this.fsName.split("/").pop()!;
    }
    get exists() {
      return files.has(this.fsName);
    }
    get modified() {
      return Array.from(files.keys()).indexOf(this.fsName);
    }
    open(mode: string) {
      this.mode = mode;
      return mode !== "r" || this.exists;
    }
    read() {
      return files.get(this.fsName);
    }
    close() {
      return true;
    }
    write(value: string) {
      files.set(this.fsName, value);
      return true;
    }
    writeln(value: string) {
      return this.write(value);
    }
    remove() {
      if (claimFails && this.name.startsWith("request-")) return false;
      return files.delete(this.fsName);
    }
    rename(name: string) {
      if (
        (claimFails && this.name.startsWith("request-")) ||
        (publishFails && name.startsWith("response-"))
      )
        return false;
      if (!this.exists) return false;
      const next = "/mail/" + name;
      if (files.has(next)) return false;
      files.set(next, files.get(this.fsName)!);
      files.delete(this.fsName);
      this.fsName = next;
      return true;
    }
  }
  const app = {
    executed: 0,
    beginUndoGroup() {},
    endUndoGroup() {},
    beginSuppressDialogs() {},
    endSuppressDialogs() {},
  };
  class Folder {
    exists = true;
    constructor(public fsName: string) {}
    getFiles() {
      return Array.from(files.keys())
        .filter((p) => p.startsWith(this.fsName + "/request-"))
        .map((p) => new File(p));
    }
  }
  const context = vm.createContext({ File, Folder, app, JSON });
  vm.runInContext(source, context);
  const serve = () => context.AE_MCP.serveRequest(new File(request), "/mail", "/mail/log");
  const next = () => context.AE_MCP.oldestRequestIn("/mail") as File | null;
  return { files, app, serve, next };
}
describe("claim before execute", () => {
  it("fails closed if rename fails, including repeated agent ticks", () => {
    const h = host(true);
    h.serve();
    h.serve();
    expect(h.app.executed).toBe(0);
  });
  it("retains the claimed request and never executes it again when response publication fails", () => {
    const h = host(false, true);
    h.serve();
    h.serve();
    expect(h.app.executed).toBe(1);
    expect(h.files.has("/mail/executing-test.json")).toBe(true);
  });

  for (const evidence of ["executing", "response", "cancelled"])
    it(`skips a duplicate queue head with ${evidence} evidence even when removing it would fail`, () => {
      const h = host(true);
      h.files.set(`/mail/${evidence}-test.json`, "{}");
      h.files.set("/mail/request-new.json", JSON.stringify({ id: "new", code: "return 2;" }));
      expect(h.next()?.name).toBe("request-new.json");
      expect(h.files.has(`/mail/${evidence}-test.json`)).toBe(true);
      expect(h.app.executed).toBe(0);
    });

  it("never executes a replayed request with retained cancellation evidence", () => {
    const h = host();
    h.files.set("/mail/cancelled-test.json", "{}");
    h.serve();
    expect(h.app.executed).toBe(0);
  });
});
