# Motion-focused upstream source review

Reviewed 2026-10-10. Scope: four local upstream snapshots, read-only source inspection; no dependency installation, upstream code execution, AE launch, builds, or tests. Findings below are source-confirmed control-flow defects; native AE consequences are not runtime-qualified. File paths are relative to each named repository under `.research/upstream/`.

## Snapshot and license inventory

| Repository | Commit reviewed | Actual license file | Implementation and reuse value |
|---|---|---|---|
| Dakkshin/after-effects-mcp | `88d5fbf08b7ae9f015ee98e5f8c4904095cf8202` | MIT, copyright 2025 Dakkshin (`LICENSE:1-12`) | TypeScript stdio server + ScriptUI file bridge, 13 directly registered tools plus a predefined-command dispatcher; composition/layer creation, shapes/text, keyframes, expressions, effect templates, camera, masks, batching. Small and understandable but transport and destructive mutation issues make it unsuitable as an unmodified foundation. |
| TheLlamainator/after-effects-mcp | `e4a462098d28acc22a128ec20a9091ae47422915` | MIT, retains copyright 2025 Dakkshin (`LICENSE:1-12`) | Expanded Dakkshin-derived server: 30 directly registered tools, effect inventory/property/keyframe editing, `.ffx` discovery/apply, adjustment layers, centering, audio info/levels, PCM WAV peak analysis and bulk markers. Useful effect/preset/audio donor. |
| ishu86/after-effects-mcp | `5223c17a8e8c1273b25c6a9d306839259ad35143` | MIT, copyright 2024 Ishant Kohar (`LICENSE:1-12`) | Distinct modular TypeScript script-generator architecture + CEP host + per-command files. Broad motion surface: project/composition/layers, advanced text, shape paths/operators, masks, cameras/materials/renderer, retiming/easing, expressions, reusable templates, render queue/AME, markers/assets. Strongest motion-specific donor in this subset and only one with checked-in automated tests. |
| tzdwindows/after-effects-mcp | `0ab27bff0959577a569fa7e263547bb4dac6d4e7` | MIT, copyright 2026 tzdwindows (`LICENSE:1-12`) | TypeScript modules for bridge/config/history/snippets/tools + ScriptUI panel. 57 direct registrations. Camera moves/rigs, text animators, fonts, masks/lights/3D materials, easing, frame/video export, AME, history and AI layer modification. Useful feature concepts, substantial lifecycle and rollback defects. |

Counts describe registration source, not successful native behavior. All four licenses require preserving notices when copying substantial portions. No other license was inferred from README badges or package metadata.

## Fork overlap and originality

Dakkshin and TheLlamainator are one implementation family: same MIT notice, same source layout, `ae_command.json`/`ae_mcp_result.json`, exact same command writer/result waiter, and duplicated inline-plus-included JSX handlers. `git diff --no-index --stat` across `src` shows all 12 source files differ, so Llamainator is a substantive extension, not merely a rename. Its unique additions are effect discovery/editing, bounded preset filesystem search and audio-driven marker tools. Do not count their shared bridge as independent evidence of reliability.

ishu86 uses a materially different structure (`src/ae-integration/generators`, CEP host, `client_PID_timestamp_commandId` filenames, schema-dispatch tests). Its Oct 8 commit contains many specific fixes and explicit native-render limitations; its freshness does not remove the remaining gaps below.

tzdwindows shares many command names and the ScriptUI polling approach, but source is reorganized into `BridgeManager`, `HistoryManager`, config, snippet builders and optional AI service; source similarity alone does not prove Git ancestry. Its camera, export, history and AI additions deserve separate evaluation, while single-slot IPC retains the same architectural hazard.

## Severity-ranked findings

### P1 — ishu86: creating a project unconditionally discards the open project

`src/ae-integration/generators/projectGenerators.ts:17-22` emits `app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES)` before `app.newProject()`. The public `create_project` schema only has optional `name` (`src/stdio-server.ts:80-87`), so there is no explicit discard/save contract. A routine setup request can lose unsaved artist work. Require an explicit project replacement policy, saved checkpoint or refusal when dirty; do not use global dialog suppression as the policy.

### P1 — Dakkshin: ordinary position edits delete the complete position animation

`src/scripts/mcp-bridge-auto.jsx:608-611` removes every position key before setting a static position. The batch variant repeats this behavior around `:708`. An agent trying to move an animated layer erases its timing and path without a destructive option. Define separate static-at-time, offset-animation and replace-animation modes; preserve animation by default and return before/after evidence.

### P1 — tzdwindows: snapshots change the active project path; autosave happens before the operation

`src/scripts/mcp-bridge-auto.jsx:145-161` calls `app.project.save(snapFile)` and then `app.project.save()`; the mutation only runs at `:174`. Saving to a file is Save As semantics, so the active document moves to the snapshot path and subsequent save targets that snapshot. The returned `saved: true` at `:190` describes the pre-operation state, not persistence of the changes just requested. This occurs by default (`src/config/index.ts:11-16`, `autoSave: true`, `saveMode: 'both'`), even for inspection requests using `execute`. Preserve the document's authoritative path and perform explicit post-mutation save; keep pre-operation checkpoint evidence separately.

### P1 — all ScriptUI variants: one command/result slot loses parallel requests

Dakkshin and Llamainator both overwrite the one command file (`src/index.ts:108-117`) and clear the shared result file (`:125-136`). There is no process-wide queue or cross-client lock; returned results only match the command name (`:78-104`). Two calls can overwrite commands, clear another response, or attribute one same-named result to both callers. Several mutations return merely “queued,” so even sequential client calls can race before AE consumes the prior slot. tzdwindows improves result correlation with command IDs but still overwrites `commands.json` at `src/bridge/bridge-manager.ts:102`; IDs cannot recover a command that was never consumed. Use per-request files, atomic publication, single host ownership, request/project/session correlation and deduplication.

### P1 — ishu86: retiming silently changes spatial animation curves

`src/ae-integration/generators/keyframeGenerators.ts:296-306` snapshots only time/value/interpolation/temporal ease, deletes all keys (`:324-327`) then restores that subset (`:330-334`). Offset therefore drops spatial in/out tangents, spatial continuity/auto-Bezier, roving and other key metadata. Scale/reverse repeat the incomplete snapshot pattern later in the same file. This breaks motion-graphics path preservation even when key times and values remain correct. The preflight-before-delete pattern is good, but implement a complete keyframe descriptor and restore spatial/temporal metadata in a compatible order; add real curved Position fixtures and compare intermediate samples.

### P1 — tzdwindows: “rollback” is unrelated to the selected history action

`src/bridge/bridge-manager.ts:289-303` invokes AE's current Undo command; `:312` marks the chosen history item rolled back regardless of which user or tool edit was actually undone. The embedded script catches Undo errors and returns `{success:false}`, but the outer bridge treats successful script execution as success and the caller does not inspect `res.data.success`. `src/history/index.ts:104-106` selects any successful non-rolled-back action, including inspection calls. A manual artist edit or intervening read can make rollback undo unrelated work and record false success. Restore a verified checkpoint or use a guarded transaction token tied to AE document/session/undo state; never promise action-addressed rollback with bare global Undo.

### P2 — tzdwindows: ordinary AE exceptions become repeated history entries and timeouts

`src/bridge/bridge-manager.ts:118-127` records failure then throws `res.error`. Its surrounding read/parse catch only rethrows if the message includes the literal `failed in After Effects` (`:139-143`). Actual AE error messages usually do not contain that phrase, so the same failed result gets re-read, re-recorded and swallowed until timeout. Separate parse retry from host failure handling, record once and surface the native error immediately.

### P2 — ishu86: files are visible before fully written and partial commands are permanently rejected

The client writes directly to a watched `.json` filename (`src/ae-integration/file-communicator.ts:144`); the host polls `*.json` (`cep-extension/jsx/host.jsx:43`) and on parse failure writes an error and marks/renames the command as processed (`:76-83`). Polling during publication of a large script can reject or archive an incomplete command. Write to an unwatched temporary name, flush/close then rename; atomically publish responses too. Unlike the ScriptUI variants, per-request filenames are already a useful foundation here.

### P2 — ishu86 and Dakkshin family: Windows redirected Documents can split client and bridge directories

ishu86 derives Documents from `os.homedir()/Documents` (`src/ae-integration/file-communicator.ts:44-45`), while the host uses `Folder.myDocuments` (`cep-extension/jsx/host.jsx:23-24`). These differ with OneDrive/Known Folder redirection. Dakkshin family uses the same conceptual split. A panel can be alive while every command times out. Use one explicit negotiated path derived from the OS Known Folder API or bridge configuration, and validate it in the handshake.

### P2 — tzdwindows: built installer cannot find its JSX from arbitrary working directories

`package.json` build is only `tsc`; `tsconfig.json` provides no asset-copy phase. `src/scripts/installer.ts:74-80` first looks beside the compiled installer for `mcp-bridge-auto.jsx`, then falls back to `process.cwd()/src/scripts/mcp-bridge-auto.jsx`. TypeScript does not copy JSX script assets, so running the installed CLI from a client working directory fails even if the source checkout works. Package/copy the bridge and resolve via the module location; validate the packed package outside the checkout.

### Security boundary — file authority and generated code

These bridges execute trusted local instructions with AE's scripting permissions. Dakkshin/Llamainator present an allowlisted `run-script`, yet Dakkshin labels it “read-only” while the allowlist includes deletion and mutation (`src/index.ts:164-193`). This is misleading tool metadata. Their fallback JSON parsers use `eval` (Dakkshin bridge `:1244,1731`; Llamainator `:2135,2584`), so the allowlist is not an authority boundary against someone able to write the command directory. ishu86 host `:127-128` and tzdwindows host `:174` intentionally execute full scripts. These are local-file trust risks, not evidence of remote unauthenticated network exposure.

tzdwindows also sends scene context and optional screenshots to a configured model (`src/ai/ai-service.ts:138-208`) and executes the returned code (`src/tools/index.ts:1394-1402`; panel `src/scripts/mcp-bridge-auto.jsx:571`). No semantic validation confines it to the requested layer. Keep this optional and explicitly scoped, expose the generated changes before application, redact credentials from context/logs, and prefer typed scene operations over a second unconstrained code-writing agent. The API key is stored as ordinary JSON (`src/ai/ai-service.ts:67-75`); do not inherit that storage pattern into a consolidated product.

## Test and qualification assessment

- Dakkshin and Llamainator: no checked-in automated test suite or test script. A `test-animation`/bridge-test user tool is a scene mutation, not a regression suite. Dakkshin bundles with esbuild; Llamainator uses `tsc`; both copy script assets.
- ishu86: four `.test.ts` files cover generator formatting, source dispatch/schema validation, mocked CEP-host cleanup and generator regressions; `scripts/test.mjs` discovers tests explicitly across platforms. Particularly valuable cases: undo scope cleanup, reentrancy, variable isolation, preflight retiming, mask lock restoration and rejection of native render stop/pause/resume. These tests were inspected, not run. Most use mocked AE objects or generated-script syntax checks; they cannot establish AE API correctness, fonts/plugin availability, visual quality, or spatial path fidelity.
- tzdwindows: no test script or checked-in test suite found; history/rollback/camera/render features have no automated evidence in this snapshot.
- None of these four was exercised in AE by this review. No source feature count should be called runtime qualified or production ready.

## Best motion-graphics patterns to adapt

1. **ishu86 modular generators and one host-owned undo scope.** Keep project/layer/keyframe/expression/shape/mask/render responsibilities separated. `helpers.ts:223` delegates undo ownership to the CEP host; `host.jsx:135-153` balances opened scopes with `finally`, even when execution or cleanup fails. This is a stronger basis than nested undo groups scattered through snippets.
2. **ishu86 preflight before mutation.** Retiming validates every destination time before deleting keys (`keyframeGenerators.ts:309-324`); mask/path generators validate vertices/tangents and restore locks. Extend this to full batches and provide explicit partial-application outcomes where rollback is impossible.
3. **ishu86 reusable creative recipes.** Lower thirds, title cards, transitions, logo reveals, text animators, expression controls, wiggle/loop/spring/bounce presets form a useful composition vocabulary. Treat them as parameterized recipes built from typed primitives. Existing lower thirds contain fixed heights/margins/fonts (`templateGenerators.ts:95-120,158-162`) and bottomRight currently puts a full-width precomp's left anchor at `compW-margin` (`:102-107,197-199`), placing most content beyond the right edge. Responsive layout and text measurement are necessary before adopting recipes as polished templates.
4. **Llamainator effect discovery before mutation.** Inspect installed effects and layer effect properties, then address effect/property paths rather than guessing UI names. Its preset search has maximum result/depth limits (`src/index.ts:188-204`) and supports real artist `.ffx` libraries. Preserve and restore AE selection when applying selection-sensitive presets; add a native multi-selected-layer fixture before qualifying the feature.
5. **Llamainator audio-to-marker workflow.** PCM WAV waveform bins and peaks (`src/index.ts:1670-1763`) plus bulk markers are useful for rhythm-driven graphics. This is amplitude peak analysis, not beat/tempo inference. Add sample-boundary checks, correct source-to-layer time mapping, bounds on input bytes/work and tests for long/short/silent audio before reuse.
6. **tzdwindows native preview as tool output.** Frame export, preview video and AME queue provide the right feedback-loop concepts. Adopt them with artifact IDs, verified completion, frame/time/color metadata and readback; do not carry over snapshots-as-autosave or synchronous render assumptions.

## Consolidation recommendation

Use ishu86's domain decomposition and tested generator/host cleanup ideas as the primary motion reference, Llamainator's effect/preset/audio discovery as focused additions, and tzdwindows's camera/preview concepts as specifications to reimplement. Dakkshin remains a concise baseline but offers little unique advantage over its richer derivative. Do not merge all command catalogs or retain four bridge transports.

The consolidated contract should have stable document/item/layer/property identities; negotiated capabilities and host/session identity; serialized atomic command publication; explicit read/mutate/destructive metadata; complete animation-preserving keyframe operations; layout recipes with measurable bounds; typed batch operations; durable requests/history without replay after timeout; safe project/save/checkpoint rules; and native readback + rendered preview evidence.

Highest-value native acceptance fixtures: unsaved-project create/open refusal; parallel clients with same-named operations; bridge restart without replay; Unicode/large payload publication; OneDrive Documents; curved/roving spatial keyframe offset/scale/reverse; shape/mask path animation; font fallback and long titles at 16:9/9:16/1:1; effect discovery across locales; multi-selection `.ffx`; preview completion; and rollback after an intervening artist edit. Separate host correctness, image/frame evidence and artist acceptance.
