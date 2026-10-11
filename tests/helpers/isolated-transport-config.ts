import { mkdtempSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

/** Preserve protocol constants, but never run transport tests in a user's mailbox. */
export function isolatedTransportConfig(config: typeof import("../../src/config.js")) {
  const root = mkdtempSync(path.join(os.tmpdir(), "ae-transport-test-"));
  const runtime = path.join(root, "runtime");
  const instances = path.join(runtime, "instances");
  return {
    ...config,
    RUNTIME_ROOT: root,
    RUNTIME_DIR: runtime,
    DEFAULT_RUNTIME_DIR: runtime,
    RUNTIME_DIR_IS_CUSTOM: false,
    RUNTIME_POINTER_PATH: path.join(root, "runtime-dir.txt"),
    BUSY_LOCK_PATH: path.join(runtime, "dispatcher-busy.lock"),
    INSTANCES_DIR: instances,
    instanceDirFor: (id: string) => path.join(instances, id),
    requestPathFor: (id: string) => path.join(runtime, `request-${id}.json`),
    responsePathFor: (id: string) => path.join(runtime, `response-${id}.json`),
  };
}
