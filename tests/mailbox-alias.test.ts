import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { expect, it } from "vitest";
import { RUNTIME_DIR, rejectedOutputPath } from "../src/config.js";
it("rejects an existing junction alias into the mailbox, including nonexistent descendants", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "ae-alias-"));
  mkdirSync(RUNTIME_DIR, { recursive: true });
  try {
    symlinkSync(
      RUNTIME_DIR,
      path.join(root, "alias"),
      process.platform === "win32" ? "junction" : "dir",
    );
    expect(rejectedOutputPath(path.join(root, "alias", "future", "request-x.json"))).not.toBeNull();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
