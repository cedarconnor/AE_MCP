import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";
import { HEARTBEAT_FILENAME, RUNTIME_DIR, RUNTIME_ROOT, instanceDirFor } from "../src/config.js";
import { FileIpcTransport } from "../src/transport/FileIpcTransport.js";

vi.mock("../src/config.js", async (importOriginal) => {
  const config = await importOriginal<typeof import("../src/config.js")>();
  const { isolatedTransportConfig } = await import("./helpers/isolated-transport-config.js");
  return isolatedTransportConfig(config);
});

const instance = "faults";
const dir = instanceDirFor(instance);
const createTransport = () => new FileIpcTransport({ instance, scanDialogs: async () => [] });
beforeEach(async () => {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, HEARTBEAT_FILENAME), JSON.stringify({ id: instance, ts: Date.now() }));
});
afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(RUNTIME_DIR, { recursive: true, force: true });
});
afterAll(async () => { await fs.rm(RUNTIME_ROOT, { recursive: true, force: true }); });

it("a failed request publication is recoverably cancelled and does not block the next caller", async () => {
  const rename = fs.rename.bind(fs);
  vi.spyOn(fs, "rename").mockImplementation(async (from, to) => {
    if (path.basename(String(to)).startsWith("request-"))
      throw Object.assign(new Error("publication denied"), { code: "EPERM" });
    return rename(from, to);
  });
  const result = await createTransport().execute({ code: "app.mutate();", timeoutMs: 100 });
  expect(result).toMatchObject({ ok: false, errorCode: "TRANSPORT", state: "cancelled", mayStillRun: false });
  expect(result.error).toContain("publication denied");
  expect(await createTransport().requestStatus(result.requestId!)).toMatchObject({ state: "cancelled", mayStillRun: false });
  expect((await fs.readdir(dir)).some((name) => name.endsWith(".tmp"))).toBe(false);
  vi.restoreAllMocks();
  const next = await createTransport().execute({ code: "return 2;", timeoutMs: 80 });
  expect(next.requestId).not.toBe(result.requestId);
  expect(next).toMatchObject({ errorCode: "TIMEOUT", state: "cancelled", mayStillRun: false });
});

it("pending cancellation remains terminal when outcome JSON updates fail", async () => {
  const writeFile = fs.writeFile.bind(fs);
  vi.spyOn(fs, "writeFile").mockImplementation(async (...args: Parameters<typeof fs.writeFile>) => {
    if (String(args[0]).includes("outcomes") && String(args[1]).includes('"cancelled":true'))
      throw Object.assign(new Error("outcome update denied"), { code: "EACCES" });
    return writeFile(...args);
  });
  const result = await createTransport().execute({ code: "app.mutate();", timeoutMs: 80 });
  expect(result).toMatchObject({ errorCode: "TIMEOUT", state: "cancelled", mayStillRun: false });
  expect(result.error).not.toContain("WAS picked up");
  expect(await createTransport().requestStatus(result.requestId!)).toMatchObject({ state: "cancelled", mayStillRun: false });
  expect((await fs.readdir(dir)).some((name) => name.startsWith("request-"))).toBe(false);
  const next = await createTransport().execute({ code: "return 2;", timeoutMs: 80 });
  expect(next.requestId).not.toBe(result.requestId);
  expect(next.mayStillRun).toBe(false);
});

it("cancellation losing the claim race never reports that the edit cannot run", async () => {
  const rename = fs.rename.bind(fs);
  const unlink = fs.unlink.bind(fs);
  const claim = async (source: string) => {
    await rename(source, path.join(dir, path.basename(source).replace("request-", "executing-")));
  };
  vi.spyOn(fs, "rename").mockImplementation(async (from, to) => {
    if (path.basename(String(from)).startsWith("request-")) await claim(String(from));
    return rename(from, to);
  });
  // Also exercise the old unlink-based implementation before the fix.
  vi.spyOn(fs, "unlink").mockImplementation(async (source) => {
    if (path.basename(String(source)).startsWith("request-")) await claim(String(source));
    return unlink(source);
  });
  const result = await createTransport().execute({ code: "app.mutate();", timeoutMs: 80 });
  expect(result).toMatchObject({ state: "running", mayStillRun: true });
  expect(await createTransport().requestStatus(result.requestId!)).toMatchObject({ state: "running", mayStillRun: true });
});

it("missing request, claim and response evidence remains unknown", async () => {
  const id = randomUUID();
  await fs.mkdir(path.join(RUNTIME_DIR, "outcomes"), { recursive: true });
  await fs.writeFile(path.join(RUNTIME_DIR, "outcomes", `${id}.json`), JSON.stringify({ instance, submitted: true }));
  expect(await createTransport().requestStatus(id)).toMatchObject({ state: "unknown", mayStillRun: true });
});
