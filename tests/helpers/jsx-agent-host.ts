import { readFileSync } from "node:fs";
import vm from "node:vm";

/** Run the actual agent and serving scripts with an in-memory ExtendScript filesystem. */
export function jsxAgentHost() {
  const files = new Map<string, string>();
  const tasks = new Map<number, { code: string; repeat: boolean }>();
  let taskId = 0;
  class File {
    error = "";
    encoding = "";
    constructor(public fsName: string) {}
    get name() {
      return this.fsName.slice(this.fsName.lastIndexOf("/") + 1);
    }
    get exists() {
      return files.has(this.fsName);
    }
    get modified() {
      return Array.from(files.keys()).indexOf(this.fsName);
    }
    open(mode: string) {
      return mode !== "r" || this.exists;
    }
    close() {
      return true;
    }
    read() {
      return files.get(this.fsName);
    }
    write(text: string) {
      files.set(this.fsName, text);
      return true;
    }
    writeln(text: string) {
      return this.write(text);
    }
    remove() {
      return files.delete(this.fsName);
    }
    rename(name: string) {
      const dest = this.fsName.slice(0, this.fsName.lastIndexOf("/") + 1) + name;
      if (!this.exists || files.has(dest)) return false;
      files.set(dest, files.get(this.fsName)!);
      files.delete(this.fsName);
      this.fsName = dest;
      return true;
    }
  }
  class Folder {
    static temp = { fsName: "/tmp" };
    exists = true;
    constructor(public fsName: string) {}
    create() {
      return true;
    }
    getFiles() {
      return Array.from(files.keys())
        .filter((p) => p.startsWith(this.fsName + "/request-"))
        .map((p) => new File(p));
    }
  }
  const app = {
    version: "simulated",
    mutations: 0,
    quitCalls: 0,
    project: { file: null, dirty: false, numItems: 0, close() {} },
    quit() {
      this.quitCalls++;
    },
    scheduleTask(code: string, _delay: number, repeat: boolean) {
      tasks.set(++taskId, { code, repeat });
      return taskId;
    },
    cancelTask(id: number) {
      tasks.delete(id);
    },
    beginUndoGroup() {},
    endUndoGroup() {},
    beginSuppressDialogs() {},
    endSuppressDialogs() {},
  };
  const context = vm.createContext({
    File,
    Folder,
    app,
    JSON,
    CloseOptions: { DO_NOT_SAVE_CHANGES: 0 },
    $: { global: { AE_MCP_AGENT_MAILBOX: "/mail" }, getenv: () => "worker" },
  });
  vm.runInContext(readFileSync(new URL("../../jsx/serve.jsx", import.meta.url), "utf8"), context);
  vm.runInContext(
    readFileSync(new URL("../../jsx/agent.jsx", import.meta.url), "utf8").replace(
      /^#include.*$/gm,
      "",
    ),
    context,
  );
  const dir = "/mail/instances/worker";
  return {
    files,
    app,
    tasks,
    tick: () => context.$.global.AE_MCP_AGENT.tick(),
    submit: (id: string, code: string) =>
      files.set(`${dir}/request-${id}.json`, JSON.stringify({ id, code })),
    response: (id: string) => {
      const raw = files.get(`${dir}/response-${id}.json`);
      return raw ? JSON.parse(raw) : null;
    },
    heartbeat: () => JSON.parse(files.get(`${dir}/heartbeat.json`)!),
    runQuit: () => {
      const task = Array.from(tasks.values()).find((candidate) => !candidate.repeat);
      if (!task) throw new Error("No deferred quit scheduled");
      vm.runInContext(task.code, context);
    },
  };
}
