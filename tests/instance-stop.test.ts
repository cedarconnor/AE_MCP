import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
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
