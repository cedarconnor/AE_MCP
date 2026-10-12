import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";

import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";
import { HEARTBEAT_FILENAME, RUNTIME_DIR, RUNTIME_ROOT, instanceDirFor } from "../src/config.js";
import "../src/operations/index.js";
import { getOp } from "../src/registry.js";
import { FileIpcTransport } from "../src/transport/FileIpcTransport.js";
import type { AeTransport } from "../src/transport/AeTransport.js";
import { jsxAgentHost } from "./helpers/jsx-agent-host.js";
import { resolveTarget } from "../src/transport/instances.js";

vi.mock("../src/config.js", async (importOriginal) => {
  const config = await importOriginal<typeof import("../src/config.js")>();
  const { isolatedTransportConfig } = await import("./helpers/isolated-transport-config.js");
  return isolatedTransportConfig(config);
});

const name = "stop-worker";
const dir = instanceDirFor(name);
const heartbeat = (ts: number) =>
  fs.writeFile(path.join(dir, HEARTBEAT_FILENAME), JSON.stringify({ id: name, ts }));
beforeEach(async () => {
  await fs.mkdir(dir, { recursive: true });
  await heartbeat(Date.now());
});
afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(RUNTIME_DIR, { recursive: true, force: true });
});
afterAll(async () => {
  await fs.rm(RUNTIME_ROOT, { recursive: true, force: true });
});

it("stopping and reusing an instance name preserves earlier retained request results", async () => {
  const id = randomUUID();
  await fs.mkdir(path.join(RUNTIME_DIR, "outcomes"), { recursive: true });
  await fs.writeFile(
    path.join(RUNTIME_DIR, "outcomes", `${id}.json`),
    JSON.stringify({ instance: name, submitted: true }),
  );
  await fs.writeFile(
    path.join(dir, `executing-${id}.json`),
    JSON.stringify({ id, code: "return 42;" }),
  );
  await fs.writeFile(
    path.join(dir, `response-${id}.json`),
    JSON.stringify({ id, ok: true, result: 42, logs: [] }),
  );
  const lookup = new FileIpcTransport({ instance: name, scanDialogs: async () => [] });
  const before = await lookup.requestStatus(id);
  const transport: AeTransport = {
    async execute() {
      await heartbeat(0);
      return {
        ok: true,
        result: { ok: true, file: "worker.aep" },
        error: null,
        errorCode: null,
        stack: null,
        logs: [],
        durationMs: 0,
      };
    },
  };
  expect(
    await getOp("instance.stop")!.run!({ name, discardChanges: true }, transport),
  ).toMatchObject({ ok: true });
  expect(await lookup.requestStatus(id)).toEqual(before);
  await heartbeat(Date.now());
  expect(await new FileIpcTransport({ instance: name }).requestStatus(id)).toEqual(before);
  expect(before).toMatchObject({ state: "completed", mayStillRun: false, result: { result: 42 } });
});

it("an unacknowledged quit retains its recovery metadata even if the heartbeat becomes quiet", async () => {
  const requestId = randomUUID();
  const transport: AeTransport = {
    async execute() {
      await heartbeat(0);
      return {
        ok: false,
        result: null,
        requestId,
        state: "running",
        mayStillRun: true,
        error: "quit request timed out",
        errorCode: "TIMEOUT",
        stack: null,
        logs: [],
        durationMs: 0,
      };
    },
  };
  expect(await getOp("instance.stop")!.run!({ name }, transport)).toMatchObject({
    ok: false,
    requestId,
    state: "running",
    mayStillRun: true,
    quitAcknowledged: false,
    exitConfirmed: false,
  });
});

it("the real resident agent cannot claim another mutation between quit acknowledgement and scheduled quit", async () => {
  const host = jsxAgentHost();
  let mutationResponse: unknown;
  let shutdownHeartbeat: unknown;
  const transport: AeTransport = {
    async execute(req) {
      host.submit("stop", req.code);
      host.tick();
      const response = host.response("stop");
      shutdownHeartbeat = host.heartbeat();
      host.submit("competing", "app.mutations++; return 42;");
      host.tick();
      mutationResponse = host.response("competing");
      expect(host.app.quitCalls).toBe(0);
      host.runQuit();
      await heartbeat(0);
      return { ...response, errorCode: null, durationMs: 0 };
    },
  };
  const result = await getOp("instance.stop")!.run!({ name, discardChanges: true }, transport);
  expect(result).toMatchObject({ ok: true, quitAcknowledged: true, exitConfirmed: false });
  expect(shutdownHeartbeat).toMatchObject({ busy: false, stopping: true });
  expect(mutationResponse).toBeNull();
  expect(host.app.mutations).toBe(0);
  expect(host.app.quitCalls).toBe(1);
});

it("a stopping instance is excluded from named routing and does not trigger push fallback", async () => {
  for (const ts of [Date.now(), 0]) {
    await fs.writeFile(
      path.join(dir, HEARTBEAT_FILENAME),
      JSON.stringify({ id: name, ts, stopping: true }),
    );
    expect(await resolveTarget(name)).toMatchObject({ mode: "error" });
    expect(await resolveTarget(null)).toMatchObject({ mode: "error" });
  }
});

for (const fault of ["close", "schedule"] as const)
  it(`restores agent availability when ${fault} fails before quit is scheduled`, async () => {
    const host = jsxAgentHost();
    if (fault === "close")
      host.app.project.close = () => {
        throw new Error("close failed");
      };
    else
      host.app.scheduleTask = () => {
        throw new Error("schedule failed");
      };
    const transport: AeTransport = {
      async execute(req) {
        host.submit("stop", req.code);
        host.tick();
        return { ...host.response("stop"), errorCode: "JSX_THROW", durationMs: 0 };
      },
    };
    expect(await getOp("instance.stop")!.run!({ name }, transport)).toMatchObject({
      ok: false,
      quitAcknowledged: false,
    });
    expect(host.heartbeat()).toMatchObject({ stopping: false, busy: false });
    host.submit("next", "app.mutations++; return 42;");
    host.tick();
    expect(host.response("next")).toMatchObject({ ok: true, result: 42 });
    expect(host.app.quitCalls).toBe(0);
  });

it("an older resident agent refuses shutdown without closing the project", async () => {
  const host = jsxAgentHost();
  host.submit("legacy", "$.global.AE_MCP_AGENT.prepareQuit = null; return 1;");
  host.tick();
  let closed = false;
  host.app.project.close = () => {
    closed = true;
  };
  const transport: AeTransport = {
    async execute(req) {
      host.submit("stop", req.code);
      host.tick();
      return { ...host.response("stop"), errorCode: null, durationMs: 0 };
    },
  };
  const result = await getOp("instance.stop")!.run!({ name }, transport);
  expect(result).toMatchObject({ ok: false, quitAcknowledged: false });
  expect(closed).toBe(false);
  expect(host.app.quitCalls).toBe(0);
  expect(Array.from(host.tasks.values()).some((task) => !task.repeat)).toBe(false);
});

it("a deferred quit exception restores the resident agent and reports the error in its heartbeat", () => {
  const host = jsxAgentHost();
  host.submit(
    "prepare",
    "$.global.AE_MCP_AGENT.prepareQuit(); app.scheduleTask('$.global.AE_MCP_AGENT.finishQuit();', 100, false); return 1;",
  );
  host.tick();
  host.app.quit = () => {
    throw new Error("native quit refused");
  };
  host.runQuit();
  expect(host.heartbeat()).toMatchObject({ stopping: false, lastError: "native quit refused" });
  host.submit("next", "app.mutations++; return 42;");
  host.tick();
  expect(host.app.mutations).toBe(1);
});
