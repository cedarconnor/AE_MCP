# Source review: vision, continuity, motion authoring

Review date: 2026-10-10. Scope: five assigned repositories at the exact commits below. Upstream was read only. No upstream code, installer, dependency installation, tests, native binary, or AE operation was executed. Findings are source-supported; upstream live-validation claims are identified separately and are not local runtime qualification. Paths below are relative to `.research/upstream/<repository>/`.

## Recommendation

Use **Engine Room as the strongest bounded, typed motion-authoring reference**, **JUNKDOGE-JOE as the continuity/recovery and write-coordination reference**, **VolksRat71 as the compact discovery/verb-dispatch reference**, and **Solomon as the template and mechanical motion-analysis reference**. Do not merge their servers wholesale: identity, timeout, undo, preview, and state models conflict. A consolidated implementation should own one canonical project/session identity and one AE-side writer gate, then port bounded capabilities behind it.

JUNKDOGE is the deepest engineering effort in this set and could be a base if the product intentionally accepts its much larger CEP/native/provider architecture. Engine Room is a simpler motion-focused base, but its process-local writer coordination requires correction before multiple Codex sessions use the same AE instance. Solomon's name/index identity and partial-write handling make it an unsuitable unchanged foundation. GUNMIN is useful workflow thinking, not an MCP implementation; its documentation has no explicit reuse grant in this checkout.

## Inventory and legal provenance

| Repository | Reviewed HEAD | License in checkout | Main contribution |
|---|---|---|---|
| JUNKDOGE-JOE/after-effects-mcp | `f1f4e65954536b655073dcf7b7e854a44d15382f` | MIT; copyright 2026 ae-mcp contributors (`LICENSE:1-12`) | CEP-hosted 16-tool MCP; general JSX; checkpoints/recovery; workspace ownership; frozen AEGP primitives; previews/diffs; reusable tools |
| VolksRat71/after-effects-mcp-vision | `e0d010f1df2356c8eef55a1280b2bc74a7cb0c64` | MIT; copyrights 2025 Dakkshin, 2026 Nate Ryan (`LICENSE:1-13`) | 16 AE verb tools, stable item/layer IDs, live property discovery, capture/contact sheets, animated masks, layout; separate Illustrator profile |
| Engine-Room-Games/after-effects-mcp | `97ec53c6e7749bf878914742b8c2c8972c133283` | MIT; copyright 2026 Engine Room (`LICENSE:1-12`) | Typed MCP/CEP/JSX workspace, motion authoring, jobs, contact sheets, scoped snapshots/diffs, style guides, issue journal |
| solomondivyananth/aftereffects-mcp | `2ed42650a435f7401bce25e69df6880894d68bcb` | MIT; copyright 2026 Solomon Divyananth (`LICENSE:1-12`) | Zero npm dependencies, templates, motion proof rules, note-to-tweak plan, aerender jobs, broad AE editing |
| GUNMIN-KIM/after-effects-codex-agent | `d1ca448962be9e37cb62385b68a9d35aed7d6a35` | No LICENSE file or explicit reuse grant found; README points to trademark/third-party notices which contain no grant (`README.md:26`, `THIRD_PARTY_NOTICES.md:1-5`) | Korean Codex workflow and QC documentation only |

MIT notices must accompany copied source. This is a source-license inventory, not a transitive dependency or released binary license clearance. In particular JUNKDOGE's packaged OpenCode runtime and Adobe SDK/native packaging need their own artifact-level review before redistribution.

## Severity-ranked findings

### P1 — Engine Room's writer lease does not cover multiple MCP clients/processes

`packages/mcp-server/src/server.ts:106-123` constructs a new `WriteQueue` for every server. Its own comment at `packages/mcp-server/src/bridge/writeQueue.ts:3-26` explains that the panel mutex serializes individual evalScript calls but leaves gaps between chunks of a long batch. `packages/ae-panel/client/main.js:539-548` drives those chunks and yields between them. Consequently, independent stdio server processes connected to the same AE panel each have their own free writer queue and can interleave changes during another client's batch. The queue's stated scope, "whole After Effects session," is wider than its implemented scope.

Reproduction to add: connect two independent clients, start a >500-op batch from A, submit a reorder/delete/property edit from B while A is running, inspect interleaving and final state. Move writer ownership into the common panel/host, include project generation and operation ID, and hold it through the whole job.

### P1 — Engine Room releases uncertain batch ownership merely because time passes

`packages/mcp-server/src/bridge/writeQueue.ts:113-120,200-217` sets a ceiling of twice the queue wait, then calls `handOff()` when it expires or the held promise rejects. `packages/mcp-server/src/server.ts:454-457` attaches `jobs.waitFor(...holdCeilingMs)` rather than a proven AE completion signal. The comment that all queued writers must already have expired only applies to writers enqueued at the batch's start; a writer arriving shortly before the ceiling is still waiting and receives the lease while the old batch may continue. A lost completion signal also permits this path. Reconcile or confirm termination before admitting the next writer; timeout is not cancellation.

### P1 — VolksRat's discovered property paths are ambiguous for repeated effects/groups

`cep/host/ae/ops-query.jsx:201-217` builds paths from `p.matchName` only. `cep/host/ae/util.jsx:89-105` resolves each segment with `node.property(seg)`. Two copies of the same effect, multiple masks, shape groups, or text animators can have identical matchNames, so discovery emits identical addresses and a returned path can resolve to the first instance rather than the intended one. Stable layer IDs do not fix property identity. Port a selector containing matchName plus occurrence/index and an expected identity/fingerprint; re-resolve and reject stale/ambiguous paths after structural edits. Include duplicate Gaussian Blur, masks, and nested shape-group tests.

### P1 — Solomon's layer addressing can silently target another layer after an edit

`panel/jsx/bridge.jsx:407-424` treats numeric layer references as current indices and string references as the first matching name. Layer creation/reordering changes indices; duplicate names are accepted without ambiguity rejection. This is central to motion-graphics work where templates duplicate layers and agents revisit them across turns. `_findComp` can use an item ID, but layer operations do not offer equivalent stable layer identity. Replace the public layer selector with project-scoped `Layer.id` and reject ambiguous names; compatibility aliases should resolve once and return the stable selector.

### P1 — Solomon's ordinary write errors can leave partial changes; batch atomicity misses first-step partial failure

`panel/jsx/bridge.jsx:107-128` groups writes but catches failures and closes the group without restoring it. `aeAddKeyframes` removes existing keys before validating/writing all replacement keys (`:1432-1455`); a later invalid key/ease can therefore leave deleted or partly replaced animation. `aeBatch` rolls back only when `done > 0` (`:2174-2197`), but `done` increases only after an entire step returns. If the first step mutates and then fails, no rollback is attempted. The README's "There is no half-applied state to clean up" (`README.md:38-40`) is stronger than implementation.

Prevalidate requests before mutation, distinguish per-step errors from thrown failures, checkpoint irreversible operations, and return `applied/partial/unknown` evidence. Test the first batch step deleting/replacing keys and then throwing. An undo group alone is not a transaction.

### P2 — Solomon's review MP4 does not preserve sampled timeline speed

`mcp/ae-mcp.js:875-878` chooses a bounded sample count and independent default `fps=12`. `:913-920` encodes the sample images at that rate, irrespective of the AE time spacing. Sixteen samples of a ten-second interval play in roughly 1.33 seconds. Missing frames are also compacted in `collectFrames` (`:856-862`) rather than represented by their original timestamps, though the returned metadata does warn about missing samples. The video is explicitly labelled sampled playback, but the tool description (`:318`) recommends it to judge timing/easing. Derive presentation timestamps from actual frame times, preserve gaps, distinguish real-time playback from a time-compressed contact-sheet video, and qualify sparse sampling separately from full-motion review.

### P2 — VolksRat and Solomon do not reconcile writes after request timeout

VolksRat `cep/client/bridge.js:36-64` races evalScript against a timer; it neither terminates AE execution nor records an uncertain-write gate. Registry dispatch at `cep/server/tools.js:774-780` surfaces an ordinary failure. Solomon `panel/js/main.js:94-104` similarly rejects on a timer while the submitted script may still run; its message helpfully acknowledges queued calls will execute, but does not enforce reconciliation. A retry can duplicate layers or keyframes. Adopt JUNKDOGE's drain-and-reconcile distinction rather than merely increasing timers.

### P2 — GUNMIN documentation cannot safely be treated as licensed code or a universal API contract

The repository explicitly contains no runtime server (`README.md:3`). `SKILL.md:13` names tools such as `ae_comp_info` and `ae_layer_info`, while `AGENTS.md` says discover actual operations at runtime. This is guidance, not an executable abstraction across the reviewed APIs. Its notice document does not grant copyright reuse. Independently author the consolidated workflow from requirements; seek permission before copying its prose/templates.

## Repository assessments

### JUNKDOGE-JOE

**Implemented architecture:** the active service is `plugin/host`, not the retired package server. `docs/ARCHITECTURE_DIRECTION.md:43-99` maps the service and public tool families. Source confirms handler modules for read, exec/recover, preview, checkpoints/revert, workspace/instances/read jobs, expression validation, native execution, and tool-library operations. This is a general execution and recovery platform, with motion recipes layered above it, rather than a large typed motion-operation API.

**Best continuity mechanisms:** `plugin/host/jsx-bridge.js:71-81,144-207` keeps the engine lock after a timeout and drains it through a real callback/sentinel. `plugin/host/mcp/workspaces.js:129-150,238-241,277` blocks writes and ownership changes on unknown results, scopes writers and tracks reconciliation. Native locators check host, session, project and generation in `native/ae-plugin/src/aegp/plugin_entry.cpp:692-740`. Checkpoint metadata is file-backed (`plugin/host/mcp/checkpoint-store.js:67-75,170-175`); exec records recovery artifacts and blocks failed checkpoint continuation unless specifically authorized (`plugin/host/mcp/tools/exec.js:104-131`). These are concrete designs worth adapting.

**Visual evidence:** `plugin/host/mcp/tools/preview-frame.js:39-66` offers frames, ranges/grids and A/B comparisons with explicit bit-depth/guide-layer limitations. Captures report dimensions, time and SHA-256 (`:292-293`). It decodes PNGs before accepting them (`:260-263`) and verifies previously captured frames before comparing. This is stronger evidence provenance than returning only a screenshot filename.

**Limits:** preview explicitly may omit Guide Layers; 16-bit images become 8-bit and inline sizes are capped (`:39`). This cannot certify color-critical/HDR output or complete playback. Native AEGP is deliberately frozen to 23 primitives; exact time and locator guarantees should not be attributed to arbitrary JSX. `ae_exec` itself says dynamic source calls cannot be completely protected and a timeout does not stop the script (`exec.js:132-134`). Workspace process state is not an automatically durable cross-restart workflow ledger. Copy its invariants, not assumptions about recovery surviving every restart.

**Tests/qualification:** extensive unit, protocol, packaging, native, and live-MCP source exists. `plugin/host/jsx-bridge.test.js:112-208` specifically covers timeout lock retention, late callbacks and sentinel recovery. `docs/validation/active-session-undo-regression.md:4-6,64-81` preserves a historical 35-case run with 26 PASS/9 FAIL and delegates final acceptance to PR #398; that is not evidence the current HEAD still has those defects. `docs/ARCHITECTURE_DIRECTION.md:25-42` explicitly separates Windows evidence, incomplete Mac worker/unknown-result verification and later repair history. Current HEAD tests, packaged installation, binaries and PR evidence were not run/verified here. Strongest source-level validation culture in this subset, with real acceptance boundaries rather than blanket portability proof.

**Adopt:** generation-bound identity, drain gate, uncertain-write state, checkpoint/recovery envelopes, capture provenance, reusable script artifacts. **Avoid by default:** adopting the full native/provider/multi-instance architecture for an initial narrow motion MVP; native SDK packaging and three embedded provider channels are separate product costs.

### Engine-Room-Games

**Implemented scope:** modular JSX for comps/layers/transforms, keyframes, expressions, effects, text, shapes, masks, footage, audio, markers, MOGRT and vision; typed shared schemas and server handlers; HTTP/WS panel bridge. `packages/jsx/ids.jsx:3-22` uses real comp/layer IDs, scoped by composition, avoiding reorder errors. `packages/jsx/batch.jsx:4-28,50-97` correctly distinguishes a single-call undo group from per-chunk undo for >500 operations, and refuses oversized single-undo requests. This is an especially useful AE-specific correction to generic transaction assumptions.

**Preview/feedback:** the panel implements complete PNG reading/conversion, contact sheets, bounded retries and explicit missing/empty frame reports (`packages/ae-panel/client/main.js:800-909`). Unit files cover PNG codec, frame integrity, cache, screenshot resolution and contact-sheet behavior. Snapshot/diff is cheap and explicitly scoped: `packages/jsx/snapshot.jsx:22-30` warns it omits property values, expression source, effects parameters, masks and shape contents. Therefore a position-value edit can yield no structural diff; do not use it as proof that only approved pixels changed.

**Continuity:** `packages/mcp-server/src/snapshots/store.ts:12-17,38-59` retains only 32 in-memory snapshots for a server session. The issue journal and style guidance support the human workflow, but snapshots are not durable project checkpoints or cross-chat continuation. IDs also need a project generation wrapper before long-lived reuse across project changes. Source has token-gated loopback transport (`packages/ae-panel/client/main.js:237-285,1035`) rather than an unauthenticated listener.

**Tests/qualification:** many purpose-specific offline tests, including writer queue, progress correlation, undo grouping, packaging, transport auth and PNG corruption; `package.json:23` enumerates them. These meaningfully target known failure classes, but do not prove current AE runtime behavior. No tests or build run here. The multi-client and lease-expiry cases above need additions; source comments claiming whole-session safety should not override process boundaries.

**Adopt:** typed motion operations, operation discovery, scoped diffs with coverage disclosures, PNG handling, style guides, honest chunked-undo reporting. **Correct first:** place write leases in the shared AE-side host and reconcile uncertain jobs.

### VolksRat71

**Implemented scope:** actual host modules for query, mutation, capture, diagnostics, build and layout; 16 AE verb tools in `cep/server/tools.js`, with live describe/schema discovery. Native Item/Layer IDs and matchName-based traversal are implemented (`cep/host/ae/util.jsx:48-105`). The separate Illustrator profile is more than a README claim, but was not audited as an AE requirement.

**Preview/feedback:** frame, isolated-layer and 2–24-frame contact-sheet capture (`cep/host/ae/ops-capture.jsx:51-148`), with last-renderable-frame clamping and per-frame errors. Node waits for PNG IEND (`cep/server/png-ready.js:16-39`), addressing asynchronous partial output. Isolated previews restore prior solo state in finally. Capture temporarily changes resolution and/or solo states, and is classified as mutating for undo (`cep/host/ae/ops.jsx:68-79`); it should not be advertised as a completely non-mutating observation path.

**Continuity:** IDs survive layer reordering within a project, but property paths lack unique repeated-instance selectors, no generation-bound long-lived project reference or checkpoint/workflow ledger was found in the inspected transport/query layers, and timeout outcomes are untracked. Captured files are deleted after image return (`cep/server/tools.js:788-821`), so durable review evidence requires explicitly saving hashes/files/metadata elsewhere. Temporary names rely on `Date.now()` (`:785,794,822`), which is weaker than operation UUIDs for concurrent clients.

**Tests/qualification:** a useful offline node:test suite and host integration/capability probes. Tests cover schema routing, token isolation, destructive guards, render outputs, PNG completion and masks read from file; `test/unit/masks-keyspath.test.cjs:13-43` validates tracker format conversion with a mocked host, not AE geometry. Source provides live shell scripts; none were executed. Host native behavior remains a separate gate.

**Adopt:** compact verb surface, runtime schema discovery, media inventory, file-backed bulk mask payloads, partial-image rejection and labelled contact sheets. **Correct first:** unique property selectors and uncertain-write coordination.

### solomondivyananth

**Implemented scope:** MCP stdio server to token-gated CEP HTTP bridge and a large ES3 dispatcher. Zero npm dependencies is supported by `package.json:39`. The source includes broad tools, seven JSON templates, mechanical proof analysis, motion samples, batch/undo, MOGRT, and background aerender jobs (`panel/js/main.js:372`). Motion rules are real code in `mcp/proof.js:15-60`, not just prompts: geometry/overlaps, clipping, text readability, jitter, temporal grid, speed discontinuities and integrity checks. The rule engine explicitly disclaims taste.

**Feedback:** `mcp/ae-mcp.js:935-960` turns notes into a suggested tweak plan using a sampled proof state; a TypeSafe/Jev API is optional, enabled by `TYPESAFE_API_KEY`. Without the key it returns motion descriptions for the agent. This is neither autonomous visual understanding nor measured artist acceptance. The optional external service/data route should be explicit in a consolidated product rather than silently adopted.

**Continuity and correctness:** project item IDs exist, but layers use names/indices; UI view state is restored on successful dispatch only (`bridge.jsx:118-127`). Guard/sandbox configuration is useful for limiting writes to intended files, but does not fix stale selectors or atomicity. A single large dispatcher and hand-rolled protocol have a broader maintenance surface than their small dependency count suggests.

**Tests/qualification:** `scripts/check.js:1-35` performs parsing/ES3/static contract checks, later template expansions and proof-check documentation consistency. It also exercises MCP protocol behavior; live tool/guard scripts exist under `scripts/live`. This is useful but narrower than a behavior suite for every proof rule and partial-write path. README and AGENTS claim individual recipes were live-verified; those historical claims are not revalidated here. Sparse contact sheets and mechanical analysis must remain separate from full-animation or artist review.

**Adopt:** declarative editable templates, mechanically testable motion checks, explicit confidence/doubt in geometry-derived warnings, review-note-to-proposed-edit workflow. **Do not port unchanged:** layer selectors, atomicity promises, fixed-fps sampled preview, optional external service coupling.

### GUNMIN-KIM

Documentation and templates only; no server, transport, schemas, tests or execution code. The workflow in `SKILL.md:7-43` is inspect → plan → protect → mutate → inspect → render → visual QA → repair → save. It requests stable IDs, preserved originals, repeated comparison frames, delivery metadata and source/color/matte verification. Useful design principles, but instructions cannot enforce these invariants or establish live runtime evidence. Independently write an equivalent workflow in the consolidated product and use a real durable task ledger, not chat prose alone.

## Consolidation requirements demonstrated by these sources

1. Canonical references: AE instance + project generation + comp ID + layer ID; properties carry a disambiguated path and stale-reference checks. Names are display data.
2. One writer owner at the shared AE host, including all clients and asynchronous chunks; timeouts return unknown outcome and block conflicting writes until readback/reconciliation.
3. Undo semantics declared per operation: grouped edit, per-chunk group, rollback attempt, saved checkpoint, and irreversible external effect are different outcomes.
4. Evidence records persist project/context identity, rational/frame time, render settings, output hashes, before/after state, sampled-frame coverage and user feedback. Restore/reopen must revalidate IDs.
5. Preview verifies a complete decoded PNG and labels color/bit-depth/guide-layer/alpha limitations. Contact sheets do not establish playback speed or every-frame correctness.
6. Start with bounded motion operations and editable templates. Layer in generalized JSX only with checkpoint/recovery and explicit scope. Add native primitives only for a measured limitation.
7. Validate with an AE disposable project on the actual target version: duplicate names/effects/groups, reordered layers, reopen/save-as, injected partial writes, timed-out operations, two simultaneous clients, real undo, missing frames and preserved render speed. Offline mocks and source review are supporting evidence.
