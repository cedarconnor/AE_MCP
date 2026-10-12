import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import vm from "node:vm";
import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";
import { HEARTBEAT_FILENAME, RUNTIME_DIR, RUNTIME_ROOT, instanceDirFor } from "../src/config.js";
import "../src/operations/index.js";
import { getOp } from "../src/registry.js";
import { FileIpcTransport } from "../src/transport/FileIpcTransport.js";
import type { AeTransport } from "../src/transport/AeTransport.js";

vi.mock("../src/config.js", async (importOriginal) => {
  const config = await importOriginal<typeof import("../src/config.js")>();
  const { isolatedTransportConfig } = await import("./helpers/isolated-transport-config.js");
  return isolatedTransportConfig(config);
});

const name = "stop-worker";
const dir = instanceDirFor(name);
const heartbeat = (ts: number) => fs.writeFile(path.join(dir, HEARTBEAT_FILENAME), JSON.stringify({ id: name, ts }));
beforeEach(async () => {
  await fs.mkdir(dir, { recursive: true });
  await heartbeat(Date.now());
});
afterEach(async () => { vi.restoreAllMocks(); await fs.rm(RUNTIME_DIR, { recursive: true, force: true }); });
afterAll(async () => { await fs.rm(RUNTIME_ROOT, { recursive: true, force: true }); });

it("stopping and reusing an instance name preserves earlier retained request results", async () => {
  const id = randomUUID();
  await fs.mkdir(path.join(RUNTIME_DIR, "outcomes"), { recursive: true });
  await fs.writeFile(path.join(RUNTIME_DIR, "outcomes", `${id}.json`), JSON.stringify({ instance: name, submitted: true }));
  await fs.writeFile(path.join(dir, `executing-${id}.json`), JSON.stringify({ id, code: "return 42;" }));
  await fs.writeFile(path.join(dir, `response-${id}.json`), JSON.stringify({ id, ok: true, result: 42, logs: [] }));
  const lookup = new FileIpcTransport({ instance: name, scanDialogs: async () => [] });
  const before = await lookup.requestStatus(id);
  const transport: AeTransport = {
    async execute() {
      await heartbeat(0);
      return { ok: true, result: { ok: true, file: "worker.aep" }, error: null, errorCode: null, stack: null, logs: [], durationMs: 0 };
    },
  };
  expect(await getOp("instance.stop")!.run!({ name, discardChanges: true }, transport)).toMatchObject({ ok: true });
  expect(await lookup.requestStatus(id)).toEqual(before);
  await heartbeat(Date.now());
  expect(await new FileIpcTransport({ instance: name }).requestStatus(id)).toEqual(before);
  expect(before).toMatchObject({ state: "completed", mayStillRun: false, result: { result: 42 } });
});

it("acknowledges the stop request before executing quit and does not claim process-exit proof", async () => {
  const events: string[] = [];
  let scheduled = "";
  const app = {
    project: { file: null, dirty: false, close() { events.push("closed"); } },
    quit() { events.push("quit"); },
    scheduleTask(code: string, _delay: number, repeat: boolean) {
      if (repeat) throw new Error("Quit must not repeat");
      scheduled = code;
      events.push("scheduled");
      return 123;
    },
  };
  const requestId = randomUUID();
  const transport: AeTransport = {
    async execute(req) {
      const result = vm.runInNewContext(`(function() { ${req.code} })()`, { app, CloseOptions: { DO_NOT_SAVE_CHANGES: 0 } });
      events.push("reply");
      await heartbeat(0);
      events.push("idle");
      if (scheduled) vm.runInNewContext(scheduled, { app });
      return { ok: true, result, requestId, state: "completed", mayStillRun: false, error: null, errorCode: null, stack: null, logs: [], durationMs: 0 };
    },
  };
  const result = await getOp("instance.stop")!.run!({ name, discardChanges: true }, transport);
  expect(events).toEqual(["closed", "scheduled", "reply", "idle", "quit"]);
  expect(result).toMatchObject({ ok: true, stopped: true, quitAcknowledged: true, exitConfirmed: false, requestId });
});

it("an unacknowledged quit retains its recovery metadata even if the heartbeat becomes quiet", async () => {
  const requestId = randomUUID();
  const transport: AeTransport = {
    async execute() {
      await heartbeat(0);
      return { ok: false, result: null, requestId, state: "running", mayStillRun: true,
        error: "quit request timed out", errorCode: "TIMEOUT", stack: null, logs: [], durationMs: 0 };
    },
  };
  expect(await getOp("instance.stop")!.run!({ name }, transport)).toMatchObject({
    ok: false, requestId, state: "running", mayStillRun: true, quitAcknowledged: false, exitConfirmed: false,
  });
});
