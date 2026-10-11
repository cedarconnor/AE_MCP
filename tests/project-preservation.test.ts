import { describe, expect, it } from "vitest";

import { getOp } from "../src/registry.js";
import "../src/operations/project.js";

type HostOptions = {
  dirty?: boolean | "unavailable" | "throws";
  numItems?: number;
  saved?: boolean;
  targetExists?: boolean;
  saveFailure?: "throw" | "false" | "stillDirty";
  closeFailure?: boolean;
};

function run(name: string, args: Record<string, unknown> = {}, options: HostOptions = {}) {
  const calls: string[] = [];
  let dirty = options.dirty ?? true;
  const project = {
    file: options.saved ? { fsName: "C:/artist.aep" } : null,
    numItems: options.numItems ?? 2,
    get dirty() {
      if (dirty === "throws") throw new Error("unsupported property");
      return dirty === "unavailable" ? undefined : dirty;
    },
    save() {
      calls.push("save");
      if (options.saveFailure === "throw") throw new Error("disk full");
      if (options.saveFailure === "false") return false;
      if (options.saveFailure !== "stillDirty") dirty = false;
    },
    close() {
      calls.push("close");
      return !options.closeFailure;
    },
  };
  const app = {
    project,
    newProject() {
      calls.push("new");
      return { numItems: 0 };
    },
    open(file: { fsName: string }) {
      calls.push("open");
      project.file = file;
      return project;
    },
  };
  class File {
    exists = options.targetExists !== false;
    constructor(readonly fsName: string) {}
  }
  const execute = new Function(
    "app",
    "File",
    "CloseOptions",
    "AE",
    getOp(name)!.toJsx({ path: "C:/target.aep", ...args }),
  );
  const result = execute(app, File, { DO_NOT_SAVE_CHANGES: 0 }, { errText: String });
  return { result, calls };
}

describe.each(["project.new", "project.open"])("%s preserves artist work", (name) => {
  it.each([{}, { save: false }])("refuses an untitled populated project with %j", (args) => {
    const { result, calls } = run(name, args);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/unsaved/i);
    expect(calls).toEqual([]);
  });

  it.each([true, "unavailable", "throws"] as const)(
    "refuses a saved project when dirty is %s",
    (dirty) => {
      const { result, calls } = run(name, {}, { saved: true, dirty });
      expect(result.ok).toBe(false);
      expect(calls).toEqual([]);
    },
  );

  it("protects untitled content even if dirty reports false", () => {
    expect(run(name, {}, { dirty: false }).result.ok).toBe(false);
  });

  it("protects dirty project settings even when there are no items", () => {
    expect(run(name, {}, { numItems: 0 }).result.ok).toBe(false);
  });

  it.each([false, "unavailable"] as const)(
    "allows a fresh blank project when dirty is %s",
    (dirty) => {
      expect(run(name, {}, { dirty, numItems: 0 }).result.ok).toBe(true);
    },
  );

  it("allows a saved clean project", () => {
    expect(run(name, {}, { saved: true, dirty: false }).result.ok).toBe(true);
  });

  it("allows an explicit discard", () => {
    const { result, calls } = run(name, { discardUnsaved: true });
    expect(result.ok).toBe(true);
    expect(calls).toEqual(["close", name === "project.new" ? "new" : "open"]);
  });

  it("saves before replacing when requested", () => {
    const { result, calls } = run(name, { save: true }, { saved: true });
    expect(result.ok).toBe(true);
    expect(calls).toEqual(["save", "close", name === "project.new" ? "new" : "open"]);
  });

  it("refuses save=true for an untitled project", () => {
    const { result, calls } = run(name, { save: true });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/file path/);
    expect(calls).toEqual([]);
  });

  it.each(["throw", "false", "stillDirty"] as const)(
    "does not replace after a %s save failure",
    (saveFailure) => {
      const { result, calls } = run(
        name,
        { save: true, discardUnsaved: true },
        { saved: true, saveFailure },
      );
      expect(result.ok).toBe(false);
      expect(calls).toEqual(["save"]);
    },
  );

  it("does not replace when close fails", () => {
    const { result, calls } = run(name, { discardUnsaved: true }, { closeFailure: true });
    expect(result.ok).toBe(false);
    expect(calls).toEqual(["close"]);
  });

  it("advertises explicit discard as opt-in", () => {
    expect(getOp(name)!.params.find((param) => param.name === "discardUnsaved")).toMatchObject({
      type: "boolean",
      default: false,
    });
  });
});

it("project.open checks target existence before saving or closing", () => {
  const { result, calls } = run(
    "project.open",
    { save: true },
    { saved: true, targetExists: false },
  );
  expect(result.error).toMatch(/file not found/);
  expect(calls).toEqual([]);
});
