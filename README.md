# After Effects Uber MCP

A local MCP server for **editable motion graphics in After Effects**. It combines
an attributed Kumo editing foundation with new motion specifications, native
template builds, captured review evidence, and request recovery safeguards.

The [thirteen-repository review](docs/UPSTREAM_REVIEW.md) explains what was adopted
and what was excluded. This is an independent derivative, not an official Adobe
or Kumo release. The original MIT notice is retained in [LICENSE](LICENSE).

## Start

Requires Node.js 24+ and After Effects. This build targets Windows with AE 2026;
inherited macOS paths have not been qualified here.

```powershell
npm ci --ignore-scripts
npm run build
npm run check:protocol
node dist/index.js
```

The last command starts the stdio MCP server and waits for an MCP client. Keep
After Effects open and enable **Preferences → Scripting & Expressions → Allow
Scripts to Write Files and Access Network**. See [setup](docs/SETUP.md) for Codex
and other clients. No CEP panel is required for a single running AE instance.

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

`AE_MCP_READONLY=1` withholds project-mutating tools. `AE_MCP_ALLOW_CATEGORIES`
restricts operation categories; high-level builds require `comp,layer,text,shape,keyframe`
and review requires `inspect,render`. `AE_MCP_ENABLE_EVAL=1` enables arbitrary
ExtendScript; it is disabled by default. These controls are not a filesystem or
AE sandbox.

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
Review history is in [docs/research](docs/research/), source notices in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
