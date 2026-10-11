# Troubleshooting

[README](../README.md) · [Configuration](CONFIGURATION.md) · [Tool reference](TOOLS.md)

Start by separating MCP connection, native dispatch and application results.
`npm run check:protocol` checks a real stdio MCP handshake, discovery and offline
planning. `ae_context` reaches AE. A successful connection does not guarantee
that a requested comp/property exists or that the visual output is correct.

## Server will not connect

| Symptom | Check and resolution |
|---|---|
| Process exits immediately | Use Node 24+, run `npm ci --ignore-scripts` and `npm run build` in the checkout; inspect client stderr |
| Cannot find `dist/index.js` | Use an absolute path and build first; a package install uses its own `node_modules/after-effects-uber-mcp/dist/index.js` |
| Server appears to wait forever in a terminal | With no CLI arguments it waits for MCP on stdin; connect a client rather than expecting an interactive shell |
| Protocol JSON cannot be parsed | Do not redirect stderr into stdout or add shell banners to stdout; stdout belongs to MCP |
| Client lists old/missing tools | Restart the MCP server connection/new chat; verify the configured path, package version and read-only policy |
| Exactly three tools missing | `AE_MCP_READONLY=1` withholds save, import and motion build by design |
| Catalog has fewer than 218 operations | Check category/read-only policy; eval is excluded from the default 218 |
| Missing JSX/assets after copying files | Install the complete package, not just `dist`; native helpers live in `jsx` |
| `agent-status` says stale | Reinstall the startup stub from the current package location and restart AE |

## Native connection problems

Open AE normally and close modal dialogs intentionally. Confirm **Preferences →
Scripting & Expressions → Allow Scripts to Write Files and Access Network** is
enabled. It is an AE security preference; enabling it should be an explicit
setup decision. A script may be unable to change that preference itself.

`AE_NOT_FOUND` usually needs a corrected `AE_MCP_EXE`. Verify the executable
actually exists; a nonexistent override falls through to other defaults.
`NO_INSTANCE` can indicate an absent named agent, ambiguity between agents, or
a push launch that would otherwise start a throwaway AE instance. Choose the
intended resident instance explicitly or use one normally launched AE instance.

For `DIALOG_OPEN`, inspect the reported dialog and its context before dismissing
it. Save/discard prompts may concern unsaved work. `instance.dialogs` and
`instance.dismiss_dialog` are available for supported platforms, but a button
click is an intentional application action, not automatic timeout recovery.
On macOS, dialog text discovery may require Accessibility permission.

An empty `node dist/index.js instances` listing is normal without a resident
agent. It does not prove the ordinary single-instance bridge is unavailable.
Do not install an agent solely to silence that message.

## Recovering a timeout

1. Preserve the failed response, including `error.details.requestId`, `state`,
   `mayStillRun`, logs and message. Stop submitting dependent mutations.
2. Call `ae_request_status` with that request UUID. It performs no native work.
3. If a retained result exists, inspect its transport `ok` and nested native
   result. A `completed` request can still contain an operation failure or
   partial created objects.
4. If the outcome is unresolved, inspect AE, dialogs, project state and intended
   output. A client timeout or silent heartbeat does not establish that AE
   stopped executing.
5. Continue only after reconciling what actually happened. Do not send another
   build/import/create just because its first response was late.

| State | Meaning and next step |
|---|---|
| `queued` | Submission is recorded; host completion is not established |
| `running` | Claimed request without established completion; it may still run |
| `unknown` | Evidence is insufficient; preserve it and inspect the host |
| `cancelled` | Removal before claim, or proof of non-submission; inspect context before a new attempt |
| `completed` | Host returned; inspect the retained native result |
| `failed` | Retained terminal failure; inspect error and partial effects |
| `not_found` | No usable record found; this is not proof that nothing ran |

Unknown outcomes keep a per-mailbox gate blocked. Subsequent calls can release
it when retained terminal evidence appears. There is no force-unlock tool and
no age-based lock stealing. If a host crash, lost response or corrupt gate
requires manual repair, first establish that execution has stopped and inspect
the project. Preserve the mailbox as diagnostic evidence before any repair;
never delete locks while AE may be executing the old request. See
[transport outcomes](transport-outcomes.md) for filenames and limitations.

All current structured error codes report `retryable:false`. Earlier inherited
source comments about retrying timeouts are not the active behavior.

## Error-code reference

These codes are defined by [errors.ts](../src/errors.ts). The MCP SDK can also
reject malformed tool arguments before a handler creates this envelope.

| Code | Meaning | Useful next step |
|---|---|---|
| `AE_NOT_FOUND` | Executable/bundle could not be located | Check installed path and override |
| `NO_INSTANCE` | Intended running target cannot be resolved | Inspect resident targets and launch mode |
| `DIALOG_OPEN` | Modal dialog prevents scripting | Inspect dialog content and deliberately resolve it |
| `TIMEOUT` | No response before wait deadline | Query request status; do not replay |
| `TRANSPORT` | Node/launch/filesystem or unexpected handler failure | Preserve details/stack and reconcile submitted request |
| `DISPATCHER` | Native dispatcher failed before requested code | Check packaged JSX assets, permissions and diagnostic response |
| `JSX_THROW` | Generated native code threw | Inspect error/stack/logs and partial native effects |
| `OPERATION_FAILED` | Native result returned `ok:false` | Inspect `error.details.result`, selectors and native prerequisites |
| `UNKNOWN_OPERATION` | No matching registered operation | Query active catalog; correct spelling or configuration |
| `UNKNOWN_CATEGORY` | Unknown catalog category | List categories with `ae_catalog({})` |
| `INVALID_ARGS` | Invalid operation parameters/handler conditions | Use reference schema; remove unknown keys, fix types and selectors |
| `VALIDATION` | Invalid motion spec or structural project document | Read issues; fix the document instead of bypassing validation |
| `FORBIDDEN` | Read-only, category, eval or application-configuration policy | Check intended access and explicitly configured policy |
| `IO` | Caller-supplied path read/write failed or was rejected | Check absolute path, parent folder, access and mailbox exclusion |

## Layers, properties and fonts

- Refresh project-scoped IDs after project replacement/open/import. A numeric
  comp selector is an item ID, while a numeric layer selector is generally a
  1-based layer index. Use `{id:...}` for stable layer selection in supported
  operations. The standalone `ae_layer_info` tool uses indices, arrays or all.
- Duplicate names/matchNames can select an unintended object. Inspect the tree
  and use returned IDs or explicit indices at the ambiguous level.
- Top-level operation schema validation is not deep native property validation.
  Vectors, shapes, text documents, easing values and plugin parameters must
  match the selected native property's type.
- Font names in specs are PostScript names. Inspect `font.list` results and
  build substitution warnings. Offline planning cannot prove the font exists.
- Long text is not auto-fitted or wrapped by the presets. Shorten it, reduce
  font size, change layout or apply text operations; measure and capture again.
- Repeated builds create repeated comps. Use returned IDs for revisions.
- A partial build or batch error is not a rollback. Inspect created IDs and
  successful children before undoing, repairing or removing anything.

## Capture and color

| Symptom | Explanation or action |
|---|---|
| Empty first frame | Motion layers have zero opacity at their entrance start; choose a later sample |
| Last sample rejected | Motion review requires every time to be strictly less than comp duration |
| No inline image from `ae_render_frame` | That tool returns file metadata; open the files or use `ae_motion_review` |
| Review has no inline sheet | The file may be unavailable or exceed 8 MiB; the manifest/frames remain useful |
| Different color in read-only mode | Color probes requiring temporary AE objects are disabled; inspect warnings |
| Project becomes dirty after capture | Write-mode color handling may create/remove temporary native objects and affect undo history |
| Transparency is wrong | Composition background is not an opaque layer; current 8-bit capture encoding is RGB-only and not qualified for preserving alpha |
| Guide layers or color differ from final output | Preview capture and final render paths have limits; compare the intended output module and actual deliverable |
| Incomplete review directory | Captures can fail midway; partial files are retained, and no complete review should be claimed |

`colorManaged:"auto"` attempts display-oriented color processing and may
report a fallback/warning. `colorManaged:"off"` follows the raw capture path;
it is not equivalent to calibrated sRGB. Untagged high-bit-depth output and
working-space behavior need interpretation in the image viewer. A calibration
request with an unknown outcome is propagated rather than silently replaced by
another native request. Keep `colorPipeline` and `colorWarning` with reviews.

## Files, imports and rendering

Use absolute output paths outside the mailbox. Project Save As needs an
existing parent directory; JSON export and motion review create theirs. If an
output path is rejected through a junction/symlink, choose a path genuinely
outside the mailbox rather than another alias.

JSON import validation is structural and does not prove faithful native
reconstruction. Missing footage, unsupported native features and effects can
still need repair. `clearFirst:true` deletes current items; it is not required
for append import. Keep the original AEP/assets.

Render queue operations use native render settings and output modules. Filename
extensions do not choose codecs. Inspect available templates and existing queue
jobs before starting; `render.start` can run unrelated enabled jobs. MOGRT
export takes a directory, may require a saved project, and must be tested in
the intended receiving application.

## Reporting a reproducible problem

Include package/Node/AE versions, OS, exact tool arguments with sensitive paths
redacted as needed, policy variables, error envelope, request status and whether
the issue happens in a minimal project. Preserve relevant response files,
capture warnings and sample images. Mailbox files can contain scripts, payloads
and private project data: inspect them before sharing. State whether the issue
is a native execution failure, numerical discrepancy, visual defect or artist
preference so those observations remain distinguishable.
