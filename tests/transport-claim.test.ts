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
  const context = vm.createContext({ File, app, JSON });
  vm.runInContext(source, context);
  const serve = () => context.AE_MCP.serveRequest(new File(request), "/mail", "/mail/log");
  return { files, app, serve };
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
});
