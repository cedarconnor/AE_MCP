import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  BUSY_LOCK_PATH,
  HEARTBEAT_FILENAME,
  RUNTIME_DIR,
  RUNTIME_ROOT,
  instanceDirFor,
} from "../src/config.js";
import { FileIpcTransport } from "../src/transport/FileIpcTransport.js";
import { toMcpResult } from "../src/tools/define-tool.js";

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
  await fs.writeFile(
    path.join(dir, HEARTBEAT_FILENAME),
    JSON.stringify({ id: instance, ts: Date.now() }),
  );
});
afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(RUNTIME_DIR, { recursive: true, force: true });
});
afterAll(async () => {
  await fs.rm(RUNTIME_ROOT, { recursive: true, force: true });
});

async function waitForRequest() {
  for (let attempt = 0; attempt < 200; attempt++) {
    const file = (await fs.readdir(dir)).find((name) => name.startsWith("request-"));
    if (file)
      return JSON.parse(await fs.readFile(path.join(dir, file), "utf8")) as {
        id: string;
        code: string;
      };
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("No request published");
}

async function complete(id: string, result: number) {
  await fs.rename(path.join(dir, `request-${id}.json`), path.join(dir, `executing-${id}.json`));
  await fs.writeFile(
    path.join(dir, `response-${id}.json`),
    JSON.stringify({ id, ok: true, result, logs: [] }),
  );
}

it("a failed request publication is recoverably cancelled and does not block the next caller", async () => {
  const rename = fs.rename.bind(fs);
  vi.spyOn(fs, "rename").mockImplementation(async (from, to) => {
    if (path.basename(String(to)).startsWith("request-"))
      throw Object.assign(new Error("publication denied"), { code: "EPERM" });
    return rename(from, to);
  });
  const result = await createTransport().execute({ code: "app.mutate();", timeoutMs: 100 });
  expect(result).toMatchObject({
    ok: false,
    errorCode: "TRANSPORT",
    state: "cancelled",
    mayStillRun: false,
  });
  expect(result.error).toContain("publication denied");
  expect(await createTransport().requestStatus(result.requestId!)).toMatchObject({
    state: "cancelled",
    mayStillRun: false,
  });
  expect((await fs.readdir(dir)).some((name) => name.endsWith(".tmp"))).toBe(false);
  vi.restoreAllMocks();
  const next = await createTransport().execute({ code: "return 2;", timeoutMs: 80 });
  expect(next.requestId).not.toBe(result.requestId);
  expect(next).toMatchObject({ errorCode: "TIMEOUT", state: "cancelled", mayStillRun: false });
});

it("a locked staging file does not strand the mailbox when both publication and staging cancellation renames fail", async () => {
  const rename = fs.rename.bind(fs);
  vi.spyOn(fs, "rename").mockImplementation(async (from, to) => {
    if (path.basename(String(from)).startsWith(".request-"))
      throw Object.assign(new Error("staging file is locked"), { code: "EPERM" });
    return rename(from, to);
  });
  const result = await createTransport().execute({ code: "app.mutate();", timeoutMs: 100 });
  expect(result).toMatchObject({ errorCode: "TRANSPORT", state: "cancelled", mayStillRun: false });
  expect(await createTransport().requestStatus(result.requestId!)).toMatchObject({
    state: "cancelled",
    mayStillRun: false,
  });
  vi.restoreAllMocks();
  const next = await createTransport().execute({ code: "return 2;", timeoutMs: 80 });
  expect(next.requestId).not.toBe(result.requestId);
  expect(next.state).toBe("cancelled");
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
  expect(await createTransport().requestStatus(result.requestId!)).toMatchObject({
    state: "cancelled",
    mayStillRun: false,
  });
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
  expect(await createTransport().requestStatus(result.requestId!)).toMatchObject({
    state: "running",
    mayStillRun: true,
  });
});

it("missing request, claim and response evidence remains unknown", async () => {
  const id = randomUUID();
  await fs.mkdir(path.join(RUNTIME_DIR, "outcomes"), { recursive: true });
  await fs.writeFile(
    path.join(RUNTIME_DIR, "outcomes", `${id}.json`),
    JSON.stringify({ instance, submitted: true }),
  );
  expect(await createTransport().requestStatus(id)).toMatchObject({
    state: "unknown",
    mayStillRun: true,
  });
});

it("a second client waits for the active request and then submits its own work", async () => {
  const first = createTransport().execute({ code: "return 1;", timeoutMs: 2500 });
  const a = await waitForRequest();
  const second = createTransport().execute({ code: "return 2;", timeoutMs: 2500 });
  let secondSettled = false;
  void second.then(() => {
    secondSettled = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 80));
  // Finish and await all work before asserting, even on the old implementation.
  const waited = !secondSettled;
  await complete(a.id, 1);
  expect(await first).toMatchObject({ ok: true, result: 1 });
  if (!waited) {
    await second;
    expect(waited).toBe(true);
    return;
  }
  const b = await waitForRequest();
  expect(b.code).toBe("return 2;");
  expect(b.id).not.toBe(a.id);
  await complete(b.id, 2);
  expect(await second).toMatchObject({ ok: true, result: 2 });
});

it("a waiting client's deadline cancels only its own work and preserves the blocker in MCP details", async () => {
  const first = createTransport().execute({ code: "app.mutate();", timeoutMs: 2500 });
  const a = await waitForRequest();
  const started = Date.now();
  const second = await createTransport().execute({ code: "app.otherMutation();", timeoutMs: 120 });
  const elapsed = Date.now() - started;
  await complete(a.id, 1);
  await first;
  expect(elapsed).toBeGreaterThanOrEqual(100);
  expect(second).toMatchObject({
    errorCode: "TIMEOUT",
    state: "cancelled",
    mayStillRun: false,
    blockingRequest: { requestId: a.id, mayStillRun: true },
  });
  expect(second.requestId).not.toBe(a.id);
  expect(await createTransport().requestStatus(second.requestId!)).toMatchObject({
    state: "cancelled",
    mayStillRun: false,
  });
  const mcp = toMcpResult(second);
  expect(JSON.stringify(mcp.structuredContent)).toContain('"blockingRequest"');
  expect((await fs.readdir(dir)).some((file) => file.startsWith("request-"))).toBe(false);
});

it("dispatcher lock permission errors are surfaced instead of being reported as contention", async () => {
  const originalExe = process.env.AE_MCP_EXE;
  process.env.AE_MCP_EXE = process.execPath;
  const open = fs.open.bind(fs);
  vi.spyOn(fs, "open").mockImplementation(async (...args: Parameters<typeof fs.open>) => {
    if (String(args[0]) === BUSY_LOCK_PATH)
      throw Object.assign(new Error("lock permission denied"), { code: "EACCES" });
    return open(...args);
  });
  try {
    const result = await new FileIpcTransport({
      instance: null,
      scanDialogs: async () => [],
      spawn: () => {
        throw new Error("must never launch");
      },
    }).execute({ code: "app.mutate();", timeoutMs: 300 });
    expect(result).toMatchObject({
      errorCode: "TRANSPORT",
      state: "cancelled",
      mayStillRun: false,
    });
    expect(result.error).toContain("lock permission denied");
    expect(result.error).not.toContain("another call");
  } finally {
    if (originalExe === undefined) delete process.env.AE_MCP_EXE;
    else process.env.AE_MCP_EXE = originalExe;
  }
});

it("does not publish work when filesystem gate creation consumes the caller deadline", async () => {
  const writeFile = fs.writeFile.bind(fs);
  const rename = fs.rename.bind(fs);
  vi.spyOn(fs, "writeFile").mockImplementation(async (...args: Parameters<typeof fs.writeFile>) => {
    if (path.basename(String(args[0])) === "pending-request.lock")
      await new Promise((resolve) => setTimeout(resolve, 150));
    return writeFile(...args);
  });
  vi.spyOn(fs, "rename").mockImplementation(async (from, to) => {
    await rename(from, to);
    const match = /^request-(.+)\.json$/.exec(path.basename(String(to)));
    if (match) await complete(match[1], 42); // Host claims immediately upon publication.
  });
  const result = await createTransport().execute({ code: "app.mutate();", timeoutMs: 80 });
  expect(result).toMatchObject({ errorCode: "TIMEOUT", state: "cancelled", mayStillRun: false });
  expect((await fs.readdir(dir)).some((name) => name.startsWith("executing-"))).toBe(false);
  expect(await createTransport().requestStatus(result.requestId!)).toMatchObject({
    state: "cancelled",
    mayStillRun: false,
  });
});

it("does not publish work when submission bookkeeping consumes the caller deadline", async () => {
  const rename = fs.rename.bind(fs);
  let records = 0;
  vi.spyOn(fs, "rename").mockImplementation(async (from, to) => {
    if (String(to).includes("outcomes") && ++records === 2)
      await new Promise((resolve) => setTimeout(resolve, 150));
    await rename(from, to);
    const match = /^request-(.+)\.json$/.exec(path.basename(String(to)));
    if (match) await complete(match[1], 42);
  });
  const result = await createTransport().execute({ code: "app.mutate();", timeoutMs: 80 });
  expect(result).toMatchObject({ errorCode: "TIMEOUT", state: "cancelled", mayStillRun: false });
  expect((await fs.readdir(dir)).some((name) => name.startsWith("executing-"))).toBe(false);
});

it("does not publish or launch when dispatcher lock creation consumes the deadline", async () => {
  const originalExe = process.env.AE_MCP_EXE;
  process.env.AE_MCP_EXE = process.execPath;
  const open = fs.open.bind(fs);
  vi.spyOn(fs, "open").mockImplementation(async (...args: Parameters<typeof fs.open>) => {
    const handle = await open(...args);
    if (String(args[0]) === BUSY_LOCK_PATH)
      await new Promise((resolve) => setTimeout(resolve, 150));
    return handle;
  });
  let launches = 0;
  try {
    const result = await new FileIpcTransport({
      instance: null,
      scanDialogs: async () => [],
      spawn: () => {
        launches++;
        throw new Error("expired call launched");
      },
    }).execute({ code: "app.mutate();", timeoutMs: 100 });
    expect(result).toMatchObject({ errorCode: "TIMEOUT", state: "cancelled", mayStillRun: false });
    expect(launches).toBe(0);
    expect((await fs.readdir(RUNTIME_DIR)).some((file) => file.startsWith("request-"))).toBe(false);
    await expect(fs.stat(BUSY_LOCK_PATH)).rejects.toMatchObject({ code: "ENOENT" });
  } finally {
    if (originalExe === undefined) delete process.env.AE_MCP_EXE;
    else process.env.AE_MCP_EXE = originalExe;
  }
});
