import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { afterAll, afterEach, expect, it, vi } from "vitest";
import {
  RUNTIME_ROOT,
  RUNTIME_DIR,
  BUSY_LOCK_PATH,
  instanceDirFor,
  HEARTBEAT_FILENAME,
} from "../src/config.js";
import { FileIpcTransport, type SpawnFn } from "../src/transport/FileIpcTransport.js";
// Private mailbox prevents tests from racing another suite or a user's bridge.
vi.mock("../src/config.js", async (importOriginal) => {
  const config = await importOriginal<typeof import("../src/config.js")>();
  const io = await import("node:fs");
  const os = await import("node:os");
  const paths = await import("node:path");
  const root = io.mkdtempSync(paths.join(os.tmpdir(), "ae-recovery-test-"));
  const runtime = paths.join(root, "runtime");
  const instances = paths.join(runtime, "instances");
  return {
    ...config,
    RUNTIME_ROOT: root,
    RUNTIME_DIR: runtime,
    DEFAULT_RUNTIME_DIR: runtime,
    RUNTIME_DIR_IS_CUSTOM: false,
    RUNTIME_POINTER_PATH: paths.join(root, "runtime-dir.txt"),
    BUSY_LOCK_PATH: paths.join(runtime, "dispatcher-busy.lock"),
    INSTANCES_DIR: instances,
    instanceDirFor: (id: string) => paths.join(instances, id),
    requestPathFor: (id: string) => paths.join(runtime, `request-${id}.json`),
    responsePathFor: (id: string) => paths.join(runtime, `response-${id}.json`),
  };
});
afterAll(async () => {
  await fs.rm(RUNTIME_ROOT, { recursive: true, force: true });
});
const cleanup: string[] = [];
afterEach(async () => {
  for (const p of cleanup.splice(0)) await fs.rm(p, { recursive: true, force: true });
});
for (const mode of ["push", "pull"] as const)
  it(`${mode}: retains late results and blocks a second request until completion across transports`, async () => {
    const instance = "test-recovery-" + randomUUID();
    const dir = mode === "pull" ? instanceDirFor(instance) : RUNTIME_DIR;
    await fs.mkdir(dir, { recursive: true });
    if (mode === "pull") {
      cleanup.push(dir);
      await fs.writeFile(
        path.join(dir, HEARTBEAT_FILENAME),
        JSON.stringify({ id: instance, ts: Date.now(), busy: false }),
      );
    }
    const old = process.env.AE_MCP_EXE;
    process.env.AE_MCP_EXE = process.execPath;
    const spawn: SpawnFn = () => {
      const child = new EventEmitter() as EventEmitter & { kill(): void };
      child.kill = () => {};
      setTimeout(() => child.emit("exit", 0), 0);
      return child;
    };
    const transport = new FileIpcTransport({
      instance: mode === "pull" ? instance : null,
      spawn,
      scanDialogs: async () => [],
    });
    let requestId = "";
    const timer = setInterval(async () => {
      for (const name of await fs.readdir(dir))
        if (name.startsWith("request-") && name.endsWith(".json")) {
          const req = JSON.parse(await fs.readFile(path.join(dir, name), "utf8"));
          if (req.label !== instance) continue;
          requestId = req.id;
          await fs.rename(path.join(dir, name), path.join(dir, `executing-${req.id}.json`));
          // A mismatched response must never satisfy this request's poller.
          await fs.writeFile(
            path.join(dir, `response-${req.id}.json`),
            JSON.stringify({ id: randomUUID(), ok: true, result: "wrong request" }),
          );
        }
    }, 10);
    try {
      const result = await transport.execute({
        code: "app.mutate();",
        label: instance,
        timeoutMs: 150,
      });
      clearInterval(timer);
      expect(result).toMatchObject({
        ok: false,
        errorCode: "TIMEOUT",
        requestId,
        state: "running",
        mayStillRun: true,
      });
      const another = new FileIpcTransport({
        instance: mode === "pull" ? instance : null,
        spawn,
        scanDialogs: async () => [],
      });
      // Age the gate; time is never evidence that execution stopped.
      const gate = path.join(dir, "pending-request.lock");
      await fs.utimes(gate, new Date(0), new Date(0));
      const blocked = await another.execute({ code: "app.mutateAgain();", timeoutMs: 50 });
      expect(blocked.ok).toBe(false);
      expect(blocked.requestId).toBe(requestId);
      await fs.writeFile(
        path.join(dir, `response-${requestId}.json`),
        JSON.stringify({ id: requestId, ok: true, result: 42, logs: [], error: null, stack: null }),
      );
      const recovered = await another.requestStatus(requestId);
      expect(recovered).toMatchObject({
        requestId,
        state: "completed",
        mayStillRun: false,
        result: { ok: true, result: 42 },
      });
      expect(await transport.requestStatus(requestId)).toEqual(recovered);
      const subsequent = await another.execute({
        code: "return 2;",
        label: "subsequent",
        timeoutMs: 80,
      });
      expect(subsequent.requestId).not.toBe(requestId);
      expect(subsequent).toMatchObject({ state: "cancelled", mayStillRun: false });
      cleanup.push(path.join(RUNTIME_DIR, "outcomes", `${subsequent.requestId}.json`));
    } finally {
      clearInterval(timer);
      if (old === undefined) delete process.env.AE_MCP_EXE;
      else process.env.AE_MCP_EXE = old;
      if (requestId)
        for (const name of [
          `executing-${requestId}.json`,
          `response-${requestId}.json`,
          `request-${requestId}.json`,
        ])
          cleanup.push(path.join(dir, name));
      cleanup.push(
        path.join(RUNTIME_DIR, "outcomes", `${requestId}.json`),
        path.join(dir, "pending-request.lock"),
      );
      if (mode === "push") cleanup.push(BUSY_LOCK_PATH);
    }
  });
it("status rejects caller paths", async () => {
  const transport = new FileIpcTransport();
  await expect(transport.requestStatus("../other")).rejects.toThrow(/requestId/);
});
