# Bridge and motion-graphics source review

Reviewed 2026-10-10 from local pinned clones. Static source review only: no upstream code, installers, tests, or dependencies were executed. A test described below is present source, not a passing result. Paths in each section are relative to that repository under `.research/upstream/`.

## Recommendation

Use **kumoproductions/mcp-aftereffects** as the strongest foundation in this group for typed motion-graphics operations and host transport. Preserve its MIT attribution if adapting source. Add durable request outcomes, fail-closed command consumption, explicit operation state, and independent visual validation before calling the consolidated product reliable. Borrow **designs**, not the whole stack, from Aodaruma for retained request results and instance routing. Port bounded, tested helpers from a-y-ibrahim for audio/data animation and RTL localization. Treat HeroicSwan as a product-workflow reference, not the transport or render core.

All four root licenses are MIT, requiring inclusion of their copyright and permission notices in copied/substantial code. This is root-license inspection, not a dependency license audit.

| Repository | Reviewed commit | Exact root license attribution | Architecture and fit |
|---|---|---|---|
| HeroicSwan/after-effects-mcp | `e38b2609cde262822b888e815684117b35447b11` | MIT; Copyright (c) 2026 ae-mcp contributors | TypeScript MCP, in-process broker, single-slot file bridge, ExtendScript startup engine; ambitious motion blueprint and editorial workflows |
| kumoproductions/mcp-aftereffects | `d0b910c00656559583aeede310b7fb80c25d2cce` | MIT; Copyright (c) 2026 kumo.productions, Inc. | TypeScript catalog/operation registry, generated ES3, per-request file IPC, resident multi-instance agent plus push fallback; strongest typed AE surface |
| Aodaruma/adobe-mcp-rs | `5ac9623bcd95cbb15c053bffcb129cf2d8815c0a` | MIT; Copyright (c) 2025 Dakkshin | Rust stdio frontend, shared TCP daemon broker, per-instance host bridge, retained request registry; five Adobe host adapters, raw scripting emphasis |
| a-y-ibrahim/after-effects-mcp | `e9ffbed9f675a3ac31a4295c83abfd1fb4a7b3f5` | MIT; Copyright (c) 2025 Dakkshin (original work); Copyright (c) 2026 Abdelrahman Youssef (enhanced multilingual / Arabic edition) | TypeScript MCP monolith, panel-based ExtendScript, in-process mutex around single shared command/result files; useful localization and data/audio helpers |

## kumoproductions/mcp-aftereffects

### Useful implemented capabilities

- `src/tools/do.ts:64-183` resolves registry operations, enforces policy, rejects malformed/unknown arguments, handles Node-side operations separately, generates host scripts, and dispatches with undo/dialog policy. `src/operations/batch.ts:46-146` independently validates and gates children. Catalog discovery avoids exposing hundreds of full tool schemas at once.
- Actual operation modules cover compositions, layers, text animators, shape contents, masks, effects, property paths, keyframes/easing, expressions, parenting/layout, essential graphics, markers, timeline and render queue. These are implemented code generators, not just README promises. See `src/operations/text.ts`, `shape.ts`, `shape-contents.ts`, `keyframe.ts`, `property.ts`, `layout.ts`, `egp.ts`, and `render.ts`.
- `src/transport/FileIpcTransport.ts:267-310` uses UUID request/response filenames. The resident agent handles its instance mailbox serially. `src/transport/instances.ts:179-210` refuses to guess when several instances are alive. Push mode additionally has a cross-process lock (`FileIpcTransport.ts:638-664`).
- `src/policy.ts:33-74` supplies read-only/category policy and disabled-by-default raw eval. The source correctly states this is not a sandbox: command execution and enabled writes remain powerful. `src/config.ts:41-57` documents mailbox filesystem access as the real trust boundary.
- Project JSON import/export and frame/contact-sheet rendering are implemented, including PNG/color handling (`jsx/export.jsx`, `jsx/import.jsx`, `src/tools/render-frame.ts`, `src/color/`). They need real AE round-trip and color qualification; a serialized project should not be described as complete AEP fidelity.

### Findings, ranked

1. **P1 — failed request deletion can execute the same mutation repeatedly.** `jsx/serve.jsx:224-233` reads a request, attempts removal, logs removal failure, and proceeds to execution anyway. `jsx/agent.jsx:222-234` selects the oldest remaining request on every tick, with no completed-ID ledger. If Windows sharing/ACL problems prevent deletion while allowing reads, the operation runs, remains in the queue, and runs again on later ticks. Layer creation, duplication and destructive calls are not idempotent. Fix before adoption: atomically claim the request under an executing name, fail closed when claiming fails, and retain an execution/result record keyed by request ID. Never retry an already-started mutation just because publication or cleanup failed. Test a readable-but-unremovable request and verify exactly one execution or zero with an explicit error.

2. **P2 — timeout after consumption loses the caller's recovery handle.** `src/transport/FileIpcTransport.ts:349-362` distinguishes reclaimed versus consumed requests, but returns only a timeout message; the generated request ID is not included in that failure and no result-recovery API is exposed. The host can still complete, leaving a result that the agent cannot query through the API. Retrying a create/import is then ambiguous and can duplicate work. Fix before adoption: return `requestId`, `state` and `mayStillRun`, retain outcomes, and add a status/result lookup. Test timeout while the host is executing, late result publication, and a subsequent request without rerunning the first.

3. **P2 — cancellation can be reported as definitive despite a read/delete race.** At `src/transport/FileIpcTransport.ts:349-354`, successful unlink is treated as proof the request was never picked up. The host reads before deleting (`jsx/serve.jsx:224-233`). If the client deletes after the host has read but before the host's deletion, unlink succeeds and the client says the request was discarded, while the host logs its failed deletion and executes it. The stale-heartbeat branch at transport lines 321-335 makes the same claim. The claim/ledger fix for finding 1 should also define cancelled-before-claim versus execution-unknown and prevent false cancellation reporting.

4. **P2 — mailbox output rejection only checks lexical paths.** `src/config.ts:101-116` uses `path.resolve`/`path.relative`; `src/tools/project-export.ts:34-39,60-63` then writes using normal filesystem path resolution. An existing symlink/junction outside the mailbox pointing into it bypasses this guard and permits overwriting mailbox files. This is a conditional local-filesystem issue, not a claim of remote exploitability. Canonicalize existing parent components, reject aliases of protected roots, and cover symlinks/junctions in tests. The current mailbox tests exercise lexical traversal but do not establish canonical-path containment.

5. **P2 design caveat — a batch is not a transaction.** The implementation intentionally leaves completed children applied and continues unless `stopOnError` (`src/operations/batch.ts:118-146`). Undo grouping is valuable, but does not guarantee rollback on failure, filesystem reversal, or transactional render behavior. The consolidated high-level builder should preflight all inputs, return partial-completion data, and avoid calling batches atomic transactions. This is a contract constraint, not an undocumented upstream defect.

### Tests and adoption scope

Broadest test source of the group: operation schemas/policy, hostile JSON/codegen, mailbox paths, offline and pull transports, project fixtures, color/PNG, undo handling and live suites. `tests/transport-pull.test.ts:202-356` covers routing, liveness and reclaiming queued requests; it does not by itself qualify the consume race above. `tests/e2e/harness.ts:43-58,78-97` explicitly skips unavailable AE; `tests/e2e/timeout-recovery.test.ts:90-106` includes a destructive hang/restart experiment. Do not casually run the full upstream suite against an artist's working session. `vitest.config.ts` includes E2E tests and serializes execution.

Reuse registry/schema/codegen conventions, per-request mailboxes, fail-on-ambiguous instance selection, explicit raw-eval policy and meaningful transport fixtures. Add the first three fixes before a consolidated builder relies on this bridge. Start with an isolated test project and bounded motion operations; retain the broader catalog for discovery without promising every operation has live coverage.

## Aodaruma/adobe-mcp-rs

### Useful implemented capabilities

The Rust workspace separates MCP, daemon scheduling, bridge persistence, platform services and Adobe host adapters (`Cargo.toml:1-18`). Per-instance FIFO and cross-instance concurrency are implemented in `crates/daemon-core/src/lib.rs`. Requests have persistent status/results and can be recovered after a frontend timeout (`crates/bridge-core/src/lib.rs`, `crates/daemon-core/src/lib.rs:225-244,306-368`). File publication has explicit Windows replace/retry and Unix synchronization handling (`crates/bridge-core/src/lib.rs:1215-1392`). Script-file validation includes configured roots and trusted file identity; `crates/ae-mcp/src/mcp_stdio.rs:741-779` uses it before dispatch. Common capability, preflight, risk and result contracts are implemented, alongside compatibility aliases (`crates/mcp-core/src/script_contract.rs`).

The current public surface is primarily script execution plus operations/recovery/preview tools, not a comprehensive typed motion-graphics catalog. Existing typed handlers are often retained as legacy dispatch. `docs/after-effects-mcp-surface.md` lags the canonical script tools now in `crates/mcp-core/src/lib.rs:55-71`; use code as the current inventory.

### Findings, ranked

1. **P1 — unauthenticated daemon accepts arbitrary host commands outside frontend script validation.** `crates/daemon-core/src/lib.rs:127-128,174-181,206-247` binds the configured TCP address and accepts JSON requests without an authentication or peer identity check. `handle_run_command` checks payload size/time limits but dispatches caller-provided command/args at lines 251-283 and 337-345. An `executeJsx` payload only needs mode, description and code on the host (`src/scripts/mcp-bridge-auto.jsx:3428-3444,3468-3471`). Thus any process that can connect can bypass the frontend's trusted-file/approval preparation and run code as the AE user; loopback does not isolate different local accounts. A non-loopback configured address would extend exposure. Prefer a user-ACL named pipe/Unix socket or authenticated private transport and enforce command policy at the daemon boundary. Default loopback limits remote exposure but does not solve this boundary.

2. **P2 — unbounded input and thread allocation permit local denial of service before payload limits apply.** Every connection spawns an OS thread (`crates/daemon-core/src/lib.rs:148-156`); the connection reads an unbounded line with no server-side read deadline (`174-178`). The payload size check at `277-283` occurs only after the full JSON has been received and parsed. Idle sockets retain threads; an unterminated line can grow memory. Bound connection count, message bytes and read time before parsing.

3. **P2 — host cooperative cancellation is advertised but its helper always returns false.** The capability contract reports `queued-or-cooperative` (`crates/mcp-core/src/script_contract.rs:584-587`) while AE injects `mcp.shouldCancel` returning `false` unconditionally (`src/scripts/mcp-bridge-auto.jsx:3449-3455`). Registry cancellation does work for queued work (`crates/bridge-core/src/lib.rs:614-627`), but a running script cannot cooperatively observe cancellation through the supplied API. Report queued-only for this host until a cancellation marker is actually read.

4. **P2 — one stdio connection cannot service cancellation/status while its long call blocks.** The frontend awaits and writes each request sequentially (`crates/ae-mcp/src/mcp_stdio.rs:51-64`), and tool dispatch calls synchronous daemon I/O (`98`, `700-738`). A cancel request on the same connection waits behind the long request. Dispatch concurrent request tasks or make submission/status a split API, preserving mutation serialization in the daemon.

### Tests and adoption scope

Strong transport test source: FIFO, separate-instance parallelism and TCP timeout recovery (`crates/daemon-core/src/lib.rs:594-706,830-883`); late result persistence across new daemon connections (`crates/bridge-contract-tests/tests/protocol_contract.rs:428`); file/approval token/size boundary tests (`crates/mcp-core/src/script_contract.rs:817-949`). These use simulated host files and do not prove AE UI behavior, plugin correctness or rendered quality. Borrow the durable request state machine and atomic writer semantics; do not introduce Rust plus a network daemon solely to get those concepts in a TypeScript consolidated server.

## HeroicSwan/after-effects-mcp

### Useful implemented capabilities

Implemented host dispatch includes composition/layer management, keyframes, expressions, effects, previews, motion templates, render, footage/sequence import, captions and edit-from-cuts (`host-scripts/ae-mcp-methods.jsx:529-1016`). Higher-level blueprint repair and coherence/motion audits are separate pure modules (`src/workflow/`), and review records are persisted (`src/workflow/review.ts`). The Blender exchange helper is an explicit transparent-image-sequence handoff rather than falsely promising native Blender scene transfer. Deterministic scene naming, saved specs, planned beats and sampled review frames are useful product concepts.

### Findings, ranked

1. **P1 — render helper renders unrelated queued jobs and hides preset failure.** `host-scripts/ae-mcp-methods.jsx:518-523` adds a queue item, silently catches `applyTemplate` failure, then invokes `app.project.renderQueue.render()` without disabling other queued entries or restoring queue state. A request to render one comp can render other queued outputs and can write an extension/preset claim inconsistent with the actual output module. Isolate the intended item, validate real installed templates, and report actual render status/output; do not silently fall back.

2. **P1 — bridge is not safe for multiple clients or AE instances.** Every client overwrites `command.json` and clears `result.json` (`src/bridge/client.ts:130-140`); serialization is only an in-process map (`src/broker/broker.ts:15-42`). The host always publishes into `instances/default` with `instanceId: default` (`host-scripts/ae-mcp-engine.jsx:35-44,98-100`). Two servers or host instances can overwrite/consume each other's traffic. Use unique instance identity plus per-request files or a real cross-process broker.

3. **P1 — missing explicit target silently reroutes to another project.** `src/bridge/client.ts:86-95` attempts the preferred ID, then returns default/most-recent live instance when it is missing. A stale/mistyped explicit target can cause mutations in a different open project. Explicit selection must fail closed.

4. **P2 — timed-out unconsumed mutation remains executable.** `src/bridge/client.ts:169-173` throws without cancelling/expiring the pending file. The host later consumes any command with a request ID (`host-scripts/ae-mcp-engine.jsx:243-264`) with no deadline check. A caller may retry after a timeout and receive duplicate or delayed mutations. Adopt explicit queued/running/unknown/result states.

5. **P2 — custom data directory does not reach the host.** Node honors `AE_MCP_DATA_DIR` (`src/util/paths.ts:10-13`), while the engine hardcodes `~/.ae-mcp` (`host-scripts/ae-mcp-engine.jsx:35-44`). The override used by mock tests is not an end-to-end host contract. Use one installer-supplied config/protocol location.

6. **P2 product-contract caveat — plan scores and approvals do not prove visual acceptance.** `src/workflow/mographAudit.ts:13-28` checks blueprint counts/styles, not rendered imagery. `src/mcp/tools/index.ts:1237-1239` accepts any approved review ID without binding it to the current plan/asset and accepts an `approved` boolean. These are workflow metadata, not independent user acceptance/security gates. Bind review evidence to the exact spec and artifact hashes and keep artist acceptance distinct from numerical/structural QA.

### Tests and adoption scope

Six test files cover protocol/paths/mock bridge and pure transcript/editorial/blueprint logic. `tests/bridge-mock.test.ts:12-83` checks live-listing and one health response with a simulated filesystem host; it does not exercise actual ExtendScript or cross-process concurrency. `scripts/e2e-live.mjs` exists but was not run. Reuse high-level spec/review ideas with independent visual checks; avoid the bridge, hardcoded host lookup and render helper.

## a-y-ibrahim/after-effects-mcp

### Useful implemented capabilities

- Real RTL-aware text creation, comp localization and template population, including nested precomp duplication and source replacement (`src/scripts/mcp-bridge-auto.jsx:99-352`). This is more useful than simply assigning Arabic text into a Latin template.
- WAV analysis and pure mapping/smoothing/peak/data-to-keyframe helpers (`src/lib/wav.ts`, `audio-reactive.ts`, `data-keyframes.ts`) feed implemented animate-to-audio/from-data tools (`src/index.ts:2119,2303`). Keep amplitude-driven motion distinct from music beat understanding.
- `see-frame`, contact-sheet and reference comparison tools are implemented (`src/index.ts:3540,3721,3785`), with asynchronous PNG completeness handling (`src/lib/see-frame.ts:81-100`, `src/index.ts:3656-3680`). Host frame inspection and asset metadata improve iterative work.
- Effect/property inspection, presets, cameras, parenting/precompose/masks and render/aerender/status tools are implemented in the large server/host files. LocalAppData bridge resolution on Windows avoids redirected Documents paths (`src/lib/bridge-core.ts:147-183`).

### Findings, ranked

1. **P1 — cross-process callers still share one command and result slot.** `src/index.ts:177-209` writes fixed filenames; `215-227` serializes only one process. Two MCP client processes can overwrite pending commands/results. Timestamp-plus-process-local-sequence IDs (`src/lib/bridge-core.ts` final `makeCommandIdFactory`) can also collide across processes. Replace this transport before borrowing tools wholesale.

2. **P2 — fire-and-forget releases the lock before its command is consumed.** `run-bridge-test` calls the mutex only around write then immediately returns (`src/index.ts:1681-1686`). A subsequent normal tool can overwrite that command before the host's next poll, despite the comment claiming concurrency safety. Keep the lock until a matched result, or submit into a per-request durable queue.

3. **P2 — claimed atomic writer falls back to direct truncating writes.** `src/lib/bridge-core.ts:50-60` uses a fixed `.tmp` sibling and, on any rename failure, directly overwrites the target. On Windows sharing failures or multiple processes this reintroduces partial command/result reads and temp-file collisions. Use unique temp files, bounded replace retries, and fail without destroying the old complete file.

4. **P2 — timeout neither expires nor retracts the command.** `src/index.ts:136-174` only returns an error after polling; host polling (`src/scripts/mcp-bridge-auto.jsx:4511-4522`) executes the latest unseen command ID regardless of age. It can execute later after a modal closes. Startup seeding (`4533-4554`) reduces restart replay but does not resolve running-session late execution. Add request states and bounded queue cancellation.

5. **P2 trust-boundary caveat — JSON fallback is executable source.** The host installs `JSON.parse = eval(...)` when absent (`src/scripts/mcp-bridge-auto.jsx:2853-2856`), and uses it for command files. File-write access is therefore host code execution even when the intended command looks like data. An actual validated JSON parser and owner-only mailbox are necessary. Raw `execute-script` itself is intentionally powerful and should be explicitly opt-in in the consolidated product.

### Tests and adoption scope

Pure helper tests cover WAV/data/audio, PNG, preset scan and bridge utilities. `vitest.config.ts:5-17` explicitly excludes manual `.cjs` probes and scopes coverage only to `src/lib/**`, leaving the large tool wiring and host script outside coverage. `tests/verify-fixes.cjs:1-10` tests mocked AE behavior, including two calls through one process, not independent clients or a real AE engine. Adopt small helpers with retained tests and source attribution; port RTL/template routines behind precise native fixtures and capability checks.

## Concrete consolidated motion-graphics scope

1. Implement/repair a single TypeScript transport with UUID instance/request identity, claim-before-execute, retained outcomes, bounded payloads, user-private filesystem paths, version handshake and explicit ambiguous/cancelled/running states. Never infer that timeout stopped AE.
2. Keep Kumo-style catalog plus typed operations for comp/layer/text/shape/property/keyframes/easing/expressions/effects/parenting/masks, with schema validation and match-name property addressing. Raw scripts remain a separately enabled escape hatch.
3. Add a file-backed motion spec and bounded templates such as title cards, lower thirds, kinetic typography and shape transitions. Preflight fonts/effects/assets, set explicit duration/fps/resolution/color assumptions, return created IDs, and preserve artist edits using owned-object identifiers.
4. Add a visual loop that renders stable complete PNGs/contact sheets, reports actual output metadata, saves spec/artifact hashes and records human review separately from structural validation. Render only intended queue items and restore the previous queue configuration.
5. Add audio/data mapping and localization as optional modules after their isolated fixtures pass. Defer multi-Adobe orchestration and Blender asset generation; neither is required to make a good AE motion-graphics MCP.
6. Verification must include two independent clients, deletion/rename faults, delayed responses, timeout before/after claim, restart recovery, explicit-target mismatch, Unicode/RTL, real native keyframe/easing behavior, undo boundaries, intended-only render scope and sampled visual review. No static review or mock suite here establishes production qualification.
