# After Effects Uber MCP

A local MCP server for **editable motion graphics in After Effects**. It combines
an attributed Kumo editing foundation with new motion specifications, native
template builds, captured review evidence, and request recovery safeguards.

The [thirteen-repository review](docs/UPSTREAM_REVIEW.md) explains what was adopted
and what was excluded. This is an independent derivative, not an official Adobe
or Kumo release. The original MIT notice is retained in [LICENSE](LICENSE).

## Documentation

This README is the starting guide. The detailed references cover **all 16 MCP
tools and all 218 default operations in 23 categories**. The optional raw-code
operation is documented separately. Reference tables and tool schemas are
generated from the implementation, with drift checks and validated examples.

| Guide | Contents |
|---|---|
| [Setup](docs/SETUP.md) | Local installation, MCP client connection and first native check |
| [Tool reference](docs/TOOLS.md) | Every tool, parameters, exact input schema, result location and examples |
| [Operation reference](docs/OPERATIONS.md) | Every operation, defaults, policy flags, source links and call templates |
| [Examples and recipes](docs/EXAMPLES.md) | Motion graphics, manual editing, keyframes, effects, rendering and MOGRT |
| [Motion specification](docs/MOTION_SPEC.md) | Portable JSON contract, limits, presets and native animation behavior |
| [Configuration](docs/CONFIGURATION.md) | All environment variables, policies, CLI, instances and timeouts |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Error codes, request recovery, capture and installation problems |
| [Architecture](docs/ARCHITECTURE.md) | MCP responses, native bridge, persistence and trust boundaries |
| [Development](docs/DEVELOPMENT.md) | Build, test, documentation generation and packaging |
| [Validation](docs/VALIDATION.md) | Recorded offline and native results, sampled images and limits |

## Install and connect

Requires Node.js 24+ and After Effects. This build targets Windows with AE 2026;
inherited macOS paths have not been qualified here.

```powershell
npm ci --ignore-scripts
npm run build
npm run check:protocol
node dist/index.js
```

Run these commands from the project folder. The last command starts the stdio MCP server and waits for an MCP client. Keep
After Effects open and enable **Preferences → Scripting & Expressions → Allow
Scripts to Write Files and Access Network**. See [setup](docs/SETUP.md) for Codex
and other clients. No CEP panel is required for a single running AE instance.

To connect a generic MCP client, use absolute paths appropriate to your machine:

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

Restart the client connection, discover tools, then call `ae_context`. That is
the first check that reaches AE. `ae_catalog` and `ae_motion_plan` work offline;
their success alone does not prove the bridge is connected. The server uses
stdio and local files; there is no HTTP port or API key to configure. Write
access is on by default. Set `AE_MCP_READONLY=1` for an inspection session.

For a supplied local release archive, install with
`npm install --ignore-scripts ./after-effects-uber-mcp-0.1.0.tgz` in a separate
folder and point the client at
`node_modules/after-effects-uber-mcp/dist/index.js`. The archive contains compiled
code and native JSX assets. Building or regenerating docs is a source-checkout
workflow. No public npm publication is assumed by these instructions.

## What it can do

| Area | Features | Boundary |
|---|---|---|
| Motion graphics | Title cards, lower thirds, statistic cards; custom text, rectangles and ellipses | Native editable 2D layers; presets need layout and font review |
| Animation | Property/keyframe inspection, keyframe edits, easing, expressions, text animators | Values and property dimensions must match native AE properties |
| Scene editing | Compositions, layers, parenting, cameras, masks, shape operators and effects | Plugins, effect matchNames and AE-version capabilities depend on the host |
| Project management | Items, footage, missing-media inspection, settings, save, JSON export/import | JSON is structural interchange, not a complete AEP/media archive |
| Preview and QA | Sampled PNGs, contact sheets, technical audit, hashed review records | Sampled evidence; no automatic artist approval or whole-animation guarantee |
| Delivery | Render queue, render/output templates, Essential Graphics and MOGRT operations | Codec/template/font availability and downstream rendering need verification |
| Host control | Context, preferences, menu commands, optional resident instances | Application changes require explicit intent; policy is not an OS sandbox |
| Recovery | Request IDs, retained outcomes, serialized dispatch, status lookup | Unknown outcomes require reconciliation; a timeout does not cancel native work |

## Tool map

The client exposes 16 tools. `ae_do` is the gateway to the larger operation
registry, keeping normal tool discovery compact.

| Tool | Use |
|---|---|
| [`ae_context`](docs/TOOLS.md#ae_context) | Inspect active project, composition, selection and instance routing |
| [`ae_project_info`](docs/TOOLS.md#ae_project_info) | Inspect project items and project state |
| [`ae_comp_info`](docs/TOOLS.md#ae_comp_info) | Inspect compositions by name or item ID |
| [`ae_layer_info`](docs/TOOLS.md#ae_layer_info) | Inspect layers and optional property trees |
| [`ae_version_info`](docs/TOOLS.md#ae_version_info) | Inspect AE version and native capabilities |
| [`ae_catalog`](docs/TOOLS.md#ae_catalog) | Discover permitted operation categories and parameters |
| [`ae_do`](docs/TOOLS.md#ae_do) | Execute one operation or a sequential batch |
| [`ae_motion_plan`](docs/TOOLS.md#ae_motion_plan) | Produce an editable motion spec offline |
| [`ae_motion_build`](docs/TOOLS.md#ae_motion_build) | Build a new native composition from a spec |
| [`ae_motion_audit`](docs/TOOLS.md#ae_motion_audit) | Inspect native motion facts and technical issues |
| [`ae_motion_review`](docs/TOOLS.md#ae_motion_review) | Capture frames and save a review manifest |
| [`ae_render_frame`](docs/TOOLS.md#ae_render_frame) | Capture one or several frames and optional contact sheet |
| [`ae_save_project`](docs/TOOLS.md#ae_save_project) | Save the current project or Save As |
| [`ae_project_export_json`](docs/TOOLS.md#ae_project_export_json) | Export structural project data inline or to disk |
| [`ae_project_import_json`](docs/TOOLS.md#ae_project_import_json) | Validate or import structural project data |
| [`ae_request_status`](docs/TOOLS.md#ae_request_status) | Recover a retained request outcome without rerunning it |

## Motion workflow

1. Inspect `ae_context` / `ae_project_info`.
2. Call `ae_motion_plan` with a title-card, lower-third, or statistic-card brief.
3. Edit the portable JSON spec for custom native text, rectangles or ellipses.
4. Call `ae_motion_build`. Each build creates a new composition and returns IDs.
5. Inspect `ae_motion_audit`, then call `ae_motion_review` at entrance, hold and
   exit times. It returns a contact sheet and writes a review manifest with
   captured file hashes and timestamps.
6. Revise with `ae_do` using stable layer IDs. Save a new `.aep` with
   `ae_save_project` and discover render/Essential Graphics operations through
   `ae_catalog`.

```json
{"template":"title-card","title":"Ideas in motion","subtitle":"Native. Editable. Reviewable.","width":1280,"height":720,"duration":6,"fps":30}
```

Pass that to `ae_motion_plan`, then pass its returned `spec` to `ae_motion_build`.
The [examples](examples/) are complete specifications. Layers are ordered back
to front. Positions are visual centers; timing is `start` seconds plus positive
`in`, `hold`, and `out` durations. Colors are RGB values from 0 to 1. Fonts use
PostScript names and substitutions are reported.

The MCP resource `ae-uber://motion-spec-schema` publishes the JSON schema;
`ae-uber://workflow` and the `motion-graphics` prompt guide continuation.

## Editing coverage

The foundation supplies 218 discoverable operations (raw eval disabled), including
compositions, layers, text animators, shapes, masks, properties, effects, keyframes,
expressions, fonts, footage, layout, cameras, render queue and Essential Graphics.
Use `ae_catalog` to discover the actual parameters. These inherited operations
are implemented and offline-tested to varying degrees; they are not all live
qualified by the motion smoke test.

Operations cover `batch`, `command`, `comp`, `effect`, `egp`, `expression`, `font`,
`footage`, `instance`, `item`, `keyframe`, `layer`, `marker`, `mask`, `pref`,
`project`, `property`, `render`, `shape`, `text`, `timeline`, `transform` and
`viewer`. The [operation index](docs/OPERATIONS.md#category-index) gives counts
and links for every category. There are 48 concrete operation examples spanning
all 23 categories, plus typed call templates for every operation.

For example, after creating a comp named Main with a text layer named Title:

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.set_content",
    "args": {"comp": "Main", "layer": "Title", "text": "A revised title"}
  }
}
```

This is an MCP `tools/call` payload, not a shell command. Comp IDs and layer IDs
are scoped to the active project. Use IDs returned by the build for revisions;
do not assume the sample IDs in the reference identify your scene. Property
paths can use native matchNames and 1-based indices. Inspect the property tree
before editing plugin-specific values.

`AE_MCP_READONLY=1` withholds project-mutating tools. `AE_MCP_ALLOW_CATEGORIES`
restricts operation categories; high-level builds require `comp,layer,text,shape,keyframe`
and review requires `inspect,render`. `AE_MCP_ENABLE_EVAL=1` enables arbitrary
ExtendScript; it is disabled by default. These controls are not a filesystem or
AE sandbox.

The category allowlist filters `ae_do` and `ae_catalog`; it does not hide every
standalone tool of a similar name. Motion audit additionally requires the
`inspect` policy tag, which is not an operation-registry category. Read-only mode
still permits filesystem exports and frame captures. See the exact
[policy boundaries](docs/CONFIGURATION.md#policy-boundaries).

## Outputs and continued work

| Artifact | How to produce it | What it preserves |
|---|---|---|
| Version-1 motion JSON | Save `spec` from `ae_motion_plan`, or edit an example | Portable source intent and timed layer layout |
| Native `.aep` | `ae_save_project` | The editable AE project; external footage still needs asset management |
| Version-2 project JSON | `ae_project_export_json` | Supported structural project data for inspection/interchange |
| PNGs/contact sheet | `ae_render_frame` | Selected times through the capture pipeline |
| Review directory | `ae_motion_review` | Audit, frame files/hashes, capture metadata, source hash and notes |
| Movie/MOGRT | Render/Essential Graphics operations | Host-dependent delivery output requiring downstream review |

Keep the spec, returned IDs, review directory and AEP together. Rebuilding the
same spec creates another comp; revise an existing comp through operations.
For full-frame opaque delivery, add a native background layer: a composition's
background color alone is not an opaque background layer.

Most native responses put data in `structuredContent.result`. Offline planning,
catalog, review manifests and some export/import modes return fields at the
root instead. Consult each tool's result section. Check both MCP `isError` and
the structured error; retain `requestId`, `state` and `mayStillRun` on failures.

## Reliability and evidence

- Requests have IDs and are claimed before execution. Do not retry a mutation
  after a timeout; query `ae_request_status` using its returned `requestId`.
- Unknown outcomes keep the mailbox blocked until a retained result resolves
  them. A crashed host or lost result may require manual inspection; elapsed
  time is not proof that a script stopped.
- Builds are undo-grouped, but partial failures can leave created objects.
  Returned errors preserve those IDs. Undo grouping is not a transaction.
- Project replacement refuses implicit loss of unsaved work. Explicit destructive
  primitives still exist and should be used only for the intended task.
- Review manifests record **sampled frames**, not full-animation quality.
  Native QA checks timing, keyframe counts, missing footage and expression
  errors; visual/artist acceptance remains separate and pending.
- Spec hashes identify the source plan; after manual edits they do not describe
  the whole current AE state. Refresh IDs after opening/replacing a project.
- Color processing, alpha and guide-layer behavior have limitations. Preserve
  capture warnings and inspect final intended output separately.

## Validation

```powershell
npm run check
```

Default `npm test` runs offline tests only. `npm run test:live` exposes inherited
AE integration suites, some of which replace projects or interrupt AE; do not
run them against artist work. The bounded smoke entry is `npm run smoke:live`
and requires an empty AE project before creating a demonstration.

See [VALIDATION.md](docs/VALIDATION.md) for actual results and outstanding limits.
The bounded live smoke passed on Windows / AE 26.2.1: three presets, ten editable
layers, eighty native keyframes, a title revision, eighteen sampled frames and
an AEP save. Sampled contact sheets were inspected; artist acceptance remains
separate.
Review history is in [docs/research](docs/research/), source notices in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

To verify that reference files and examples still match the current build:

```powershell
npm run docs:check
```

This checks registry coverage, tool schemas against actual MCP discovery,
example inputs and documentation links without sending native AE commands.
The [documentation verification record](docs/DOCUMENTATION_VALIDATION.md)
explains what the check covers and its limits.
