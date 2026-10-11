# Local setup

## Build and connect

Run `npm ci --ignore-scripts` then `npm run build` in this checkout. Node 24+ is
required. Start AE normally with one instance open. Enable its scripting file
and network preference. The MCP bridge uses files; it does not open a public
network server or require a CEP panel for this configuration.

Generic stdio MCP configuration for this machine:

```json
{
  "mcpServers": {
    "after-effects-uber": {
      "command": "C:/Program Files/nodejs/node.exe",
      "args": ["C:/Users/Cedar/Documents/AE_MCP/dist/index.js"],
      "env": {
        "AE_MCP_EXE": "C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/AfterFX.exe"
      }
    }
  }
}
```

Codex CLI registration:

```powershell
codex mcp add after-effects-uber --env "AE_MCP_EXE=C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/AfterFX.exe" -- "C:/Program Files/nodejs/node.exe" "C:/Users/Cedar/Documents/AE_MCP/dist/index.js"
```

Equivalent Codex TOML:

```toml
[mcp_servers.after-effects-uber]
command = "C:/Program Files/nodejs/node.exe"
args = ["C:/Users/Cedar/Documents/AE_MCP/dist/index.js"]

[mcp_servers.after-effects-uber.env]
AE_MCP_EXE = "C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/AfterFX.exe"
```

Reload the MCP client/start a new chat after registration. The current chat's
tool discovery may not refresh dynamically. Validate with `ae_context`, then
`ae_catalog`; configuration presence alone does not establish an AE connection.

## Diagnostics

- `npm run check:protocol`: real MCP stdio handshake/discovery/offline plan.
- `node dist/index.js instances`: registered resident AE instances, if any.
- `node dist/index.js agent-status`: optional resident-agent installation state.
- `AE_MCP_EXE`: explicit AfterFX executable (or inherited macOS .app path).
- `AE_MCP_RUNTIME_DIR`: custom mailbox; keep it private to this user.
- `AE_MCP_INSTANCE`: explicit resident instance; missing/ambiguous targets fail.

The derivative uses a separate `ae-uber-mcp` temporary-directory namespace.
Do not install an upstream resident agent alongside this derivative's agent in
the same AE process: their inherited global symbol names are not isolated.
Multi-instance support is inherited and is not part of the local smoke qualification.

The optional `install-agent` CLI writes a startup stub for resident-instance
control. The usual one-instance push bridge does not need it. Do not install a
resident agent merely to pass the ordinary smoke test.

## Timeout recovery

Inspect error details for `requestId`, `state`, and `mayStillRun`, then call
`ae_request_status`. It reads retained evidence and never reruns the command.
When status is still unknown, inspect AE and the intended project before any
manual recovery. Never delete the mailbox lock while AE may still be running
the old command. Request history currently has no automatic garbage collection.

## Demonstration

`npm run smoke:live` builds an editable demo, checks native keys, revises title
text by stable ID, captures frames and saves a new AEP under `artifacts/`.
It refuses to run if AE already contains project items, preventing an automatic
Save As of an artist's working project. It does not close/reset an existing project.
