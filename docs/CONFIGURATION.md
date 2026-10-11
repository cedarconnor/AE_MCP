# Configuration

[README](../README.md) · [Setup](SETUP.md) · [Troubleshooting](TROUBLESHOOTING.md)

Configuration is read from the MCP server process environment. Set variables in
the client configuration or in the shell launching the server, then restart
that server connection. There is no project config file, HTTP listener, API
key, port or authentication token for this implementation.

## Environment variables

| Variable | Default | Actual behavior |
|---|---|---|
| `AE_MCP_EXE` | Probe AE 2026, 2025, then 2024 default install paths | Existing AfterFX.exe path on Windows or .app bundle on macOS. Checked before the legacy variable. A nonexistent override is skipped, so check the actual running version. |
| `AE_EXE` | Unset | Legacy executable override, checked after `AE_MCP_EXE` and before default paths. |
| `AE_MCP_RUNTIME_DIR` | `os.tmpdir()/ae-uber-mcp/runtime` | Custom file mailbox, resolved to an absolute path. A pointer under `os.tmpdir()/ae-uber-mcp/runtime-dir.txt` makes it discoverable by the dispatcher. Use a private local directory. |
| `AE_MCP_INSTANCE` | Automatic | Target a resident instance by ID or its project filename. Per-call `instance` overrides this. Named/ambiguous targets fail closed. Also used when launching AE to name its resident agent. |
| `AE_MCP_READONLY` | Off | Only the exact string `1` enables project read-only policy. Withholds three tools and blocks mutating operations. |
| `AE_MCP_ALLOW_CATEGORIES` | All | Comma-separated, trimmed allowlist. Empty/whitespace means all. Names are case-sensitive; unknown names are not rejected at startup and may leave no permitted operations. |
| `AE_MCP_ENABLE_EVAL` | Off | Only `1` registers `eval.run`, adding one optional operation. Read-only mode still forbids it. Restart after changing. |

These are all seven custom environment variable names used by the code. Normal
OS variables still affect temporary directories and user profile discovery.
Node 24+ is required. Windows/AE 2026 has bounded native test evidence; inherited
macOS support and multi-instance operation have not been qualified by that test.
Linux is not a supported AE host.

Example session settings in PowerShell:

```powershell
$env:AE_MCP_EXE = 'C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/AfterFX.exe'
$env:AE_MCP_READONLY = '1'
node dist/index.js
```

These apply to that shell/process, not automatically to a separately launched
desktop client's server. Put the same keys under its MCP server `env` object.

## Policy boundaries

| Policy | Enforced behavior | What it does not mean |
|---|---|---|
| Read-only | Withholds `ae_save_project`, `ae_project_import_json`, `ae_motion_build`; filters catalog and each operation by its `readOnly` flag | No file writes, no UI effects or an OS sandbox |
| Category allowlist | Filters `ae_catalog`/`ae_do`, including batch children; motion tools check their required tags | Automatic filtering of every standalone inspection, export or frame tool |
| Application configuration | Operations marked `appConfig` require boolean `confirm:true`; caller must have explicit authorization for that configuration change | Generic authorization to change preferences or application state for unrelated work |
| Eval opt-in | Adds arbitrary ExtendScript only when explicitly enabled; normal policy still applies | A constrained scripting environment |

Read-only retains JSON export, frame capture and review files. Native frame
capture in read-only mode disables the write-mode color probes, so its color
results/warnings can differ. Some operations classified as read-only alter
viewer/UI state or temporarily inspect render templates. Classification is a
project-mutation policy, not a promise of zero side effects.

Motion-specific category requirements:

| Tool | Required tags |
|---|---|
| `ae_motion_plan` | None; offline |
| `ae_motion_build` | `comp,layer,text,shape,keyframe` and write mode |
| `ae_motion_audit` | `inspect` |
| `ae_motion_review` | `inspect,render` |

`inspect` is a high-level policy tag, not one of the 23 operation categories.
For a constrained motion session, a useful starting allowlist is
`comp,layer,text,shape,keyframe,inspect,render,batch`. Add `property`, `effect`,
`expression`, `font`, `project`, etc. only when needed by the intended workflow.
The default unrestricted catalog has 218 operations; policy can reduce that
number. Raw eval makes it 219 in an otherwise unrestricted write session.

## One instance and multiple instances

The normal single-instance path dispatches a script into an already running AE.
It needs the scripting file/network preference enabled, but no startup agent or
CEP extension. Keep the intended project open and inspect `ae_context` first.

Resident agents are useful for explicitly targeted instances, especially those
launched with `AfterFX.exe -m`. Without a resident agent, `-r` cannot reliably
address those separate instances. Routing chooses the only live agent when one
exists, falls back to push when none exists, and refuses ambiguous targets.

The optional `instance` argument is available on 13 tools: all except
`ae_catalog`, `ae_motion_plan` and `ae_request_status`. It belongs at the top
level of tool arguments, beside `operation`/`args` for `ae_do`. Request status
finds the stored route from the request UUID instead.

```json
{"name":"ae_context","arguments":{"instance":"motion-worker"}}
```

Do not install the upstream Kumo resident agent alongside this derivative's
agent in the same process: inherited global agent symbol names are shared.

## Maintenance CLI

With no arguments, `node dist/index.js` starts stdio MCP. With arguments it is
the maintenance CLI. The installed package binary is `ae-uber-mcp`; some
inherited help/log text still says `mcp-aftereffects`.

| Command | Purpose |
|---|---|
| `help`, `--help`, `-h` | Show usage |
| `agent-status` | Report whether startup stubs exist and match this package |
| `install-agent` | Write startup stubs; restart AE afterwards |
| `uninstall-agent` | Remove startup stubs; restart AE to unload a running agent |
| `instances` | List registered resident instances and their liveness |

`install-agent`, `uninstall-agent` and `agent-status` accept `--version
<major.minor>`, `--dir <startup-folder>` and `--dry-run`. Omit version/directory
to inspect existing AE user profile version folders. `--version` is a profile
folder selector, not the MCP package version flag.

```powershell
node dist/index.js agent-status
node dist/index.js install-agent --version 26.2 --dry-run
node dist/index.js install-agent --version 26.2
node dist/index.js instances
```

Use the version folder actually present on your machine. The default stub is:

- Windows: `%APPDATA%/Adobe/After Effects/<major.minor>/Scripts/Startup/ae-uber-mcp-agent.jsx`
- macOS: `~/Library/Preferences/Adobe/After Effects/<major.minor>/Scripts/Startup/ae-uber-mcp-agent.jsx`

The stub records absolute package and mailbox locations. Reinstall it and
restart AE after moving the package or changing the runtime location. Exit code
0 means the CLI action completed, 1 indicates an error or no profile folders
for status, and 2 indicates invalid arguments/unknown command. An empty
`instances` listing is not an error for normal push mode.

## Timeouts and dispatch

| Call | Native wait budget |
|---|---|
| Ordinary native calls, `ae_do` | 60,000 ms default; `ae_do.timeoutMs` can override |
| `ae_motion_build` | 120,000 ms default; accepts 1,000–600,000 ms override |
| `ae_render_frame` | 120,000 ms plus 30,000 ms for each additional frame |
| `ae_project_export_json` | 300,000 ms |
| `ae_project_import_json` | 600,000 ms for real import |
| `ae_motion_review` | Audit followed by the multi-frame capture budget; no public timeout override |

The MCP client may impose a shorter timeout of its own. Increase its request
budget when appropriate; changing a server timeout does not change the client.
Polling is every 80 ms. Push dispatch may relaunch an **unconsumed** request up
to three launches with 2.5-second linear backoff. Atomic claim prevents a second
launch from executing that same claimed request. This is not permission to
submit a new mutation after a timeout.

Request outcomes and locks do not expire merely because they are old. There is
no automatic request-history garbage collection or force-unlock command. See
[recovery](TROUBLESHOOTING.md#recovering-a-timeout) before manual maintenance.

## Filesystem and host access

The bridge executes native code with the privileges of AE and the current user.
Mailbox write access is equivalent to script execution; keep both its directory
and the pointer directory private. POSIX permissions are checked where possible;
custom Windows mailbox ACLs are reported as unverified. Do not use a shared or
synced mailbox. Multiple different custom mailbox configurations share a default
pointer location and should not be treated as isolated security domains.

Frame/export/review output guards reject paths inside the mailbox, including
existing symlink/junction aliases. They do not sandbox all native file APIs or
defend against a hostile concurrent filesystem change. Prefer absolute output
paths outside the mailbox. Create a save target's parent folder before calling
`ae_save_project`; other tools may create output folders themselves.

Source: [config](../src/config.ts), [policy](../src/policy.ts),
[tool routing](../src/tools/index.ts), [CLI](../src/cli.ts).
