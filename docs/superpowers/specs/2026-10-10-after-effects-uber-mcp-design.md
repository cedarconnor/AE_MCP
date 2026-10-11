# After Effects Uber MCP: motion graphics

## Intent

The user requested review of thirteen named After Effects MCP repositories and a consolidated MCP built from their best parts. The user's stated first use is **motion graphics**. This workspace was empty at the start. Adobe After Effects 2026 and Node 24 are installed on Windows; AE was not running at initial inspection.

## Proposed implementation decisions

These are builder recommendations, not preferences already stated by the user.

## Required source inventory

The review covers these user-specified repositories; exact checked-out revisions are recorded in `.research/upstream-manifest.json` and will be included in the review deliverable:

- https://github.com/HeroicSwan/after-effects-mcp
- https://github.com/Dakkshin/after-effects-mcp
- https://github.com/TheLlamainator/after-effects-mcp
- https://github.com/kumoproductions/mcp-aftereffects
- https://github.com/a-y-ibrahim/after-effects-mcp
- https://github.com/Aodaruma/adobe-mcp-rs
- https://github.com/ishu86/after-effects-mcp
- https://github.com/JUNKDOGE-JOE/after-effects-mcp
- https://github.com/GUNMIN-KIM/after-effects-codex-agent
- https://github.com/VolksRat71/after-effects-mcp-vision
- https://github.com/Engine-Room-Games/after-effects-mcp
- https://github.com/solomondivyananth/aftereffects-mcp
- https://github.com/tzdwindows/after-effects-mcp

## Foundation and architecture

Use a pinned, attributed fork of the MIT-licensed `kumoproductions/mcp-aftereffects` TypeScript implementation as the editing and transport foundation. Keep its compact MCP tool surface, discoverable operation catalog, native ExtendScript execution, batch operations, inspection, layer selectors including stable IDs, effects, expressions, masks, shape paths, typography, easing, Essential Graphics, project import/export, rendering, and optional resident agent. Fix material issues found in the adopted paths before relying on them.

Add an original motion-graphics layer inspired by the useful patterns reviewed across the other repositories. Do not concatenate thirteen servers or copy code without an explicit compatible license. Retain the foundation's MIT notice and record the exact imported revision and local changes.

The default connection is a local stdio MCP server. After Effects remains the execution host. No hosted service, credentials, cloud inference, CEP chat application, or native Rust plugin is required. Windows/AE 2026 is the live validation target; inherited macOS paths remain available but are not claimed tested here.

## Deliverables

1. A source-based comparison of all thirteen repositories, pinned to commits, with license information, adoption decisions, and concrete correctness/reliability findings.
2. A buildable local MCP package with the foundation's broad editing capabilities and a focused, discoverable motion-graphics workflow.
3. A versioned JSON motion specification supporting editable native text and shapes, named layers, frame rate, composition dimensions, duration, palette, and explicit entrance/hold/exit timing. Provide title-card, lower-third, and statistic-card presets as starting points, alongside custom text/shape layouts.
4. Plan/validate/build tools: generate and inspect a specification without AE, validate it before mutation, and build an editable composition with native keyframes and deliberate easing. Return composition/layer IDs and the spec identity for subsequent edits. Rebuilding creates a new revision composition; it does not silently replace an artist's work.
5. Multi-frame preview through the foundation's PNG capture, plus a motion QA tool that checks native composition/layer/keyframe/expression facts and returns explicit issues. Technical QA does not declare visual or artist acceptance. A review manifest ties sampled images, times, spec identity, and notes together for continuation.
6. MCP workflow guidance/resources describing discovery, plan/build/inspect/capture/revise/export, and examples for real motion tasks. Advanced operations remain available through the catalog and operation dispatcher.
7. Setup documentation, generic MCP and Codex configuration examples, a reproducible live smoke script, and a validation report. An editable `.aep` demonstration and sampled previews are produced if the installed AE can be driven successfully.

## Behavior and boundaries

- Prefer composition IDs and `{id}` layer references after creation. Avoid relying on layer indices across insertions and reordering.
- Validate template/custom motion specifications structurally and semantically before requesting an AE mutation. Reject non-finite numbers, invalid colors, impossible timing, duplicate layer keys, and out-of-range dimensions.
- Encode user strings as data when producing ExtendScript, including quotes, backslashes, Unicode and line separators.
- Keep native AE edits undo-grouped, but never describe undo grouping as automatic transaction rollback. Partial failures must identify what was executed. Never automatically retry a mutation with an unknown timeout outcome.
- Respect read-only mode and capability policy on new tools as well as inherited dispatch. Arbitrary JSX remains an explicit opt-in escape hatch.
- Do not close, discard, overwrite, or save over an unrelated project during demonstration. Use a new named composition and new output files. If a current user project is present, inspect it before choosing a safe test path.
- Keep generated artifacts out of the IPC mailbox. Local file access is not advertised as a sandbox.
- Font availability, third-party effects, AE-version support, host scripting preferences, and color management are observable constraints. Surface warnings/errors instead of silently claiming success.
- New high-level motion tools create native editable layers; a frame render is visual evidence at that time, not proof of the full animation's quality.

## Alternatives considered

- Build a fresh bridge from scratch: cleaner ownership, but discards the most developed handling of instance routing, keyframes, typed values, and inspection.
- Use HeroicSwan wholesale: useful blueprint/review concepts, but its broader editorial workflow adds unrelated complexity and its transport needs independent hardening.
- Combine multiple running upstream servers: retains inconsistent selectors, mutation semantics, transport contention, and a large agent-facing tool inventory.

The proposed fork plus focused additions gives the broadest practical editing coverage while leaving one transport and one set of operation semantics to validate.

## Acceptance evidence

- All thirteen sources reviewed; adopted code and licenses explicitly attributed.
- Typecheck, build, inherited offline tests, and meaningful new tests for specification validation, JSX encoding, policy gating, and partial/error handling.
- MCP initialization, tool discovery, and invocation tested through a real stdio client.
- Live AE smoke: inspect host, build a small motion graphic, inspect native layers/keyframes, capture several distinct animation times, revise a property using an ID, and save a new demonstration project.
- Check preview artifacts visually and report remaining issues separately from technical checks.
- Report untested paths and unresolved defects. Do not equate offline tests with live AE qualification or sampled stills with complete animation acceptance.

## Scope limits for this build

No promise to merge every feature from every repository. No autonomous visual-quality scoring, universal project round-trip fidelity, arbitrary third-party effect qualification, professional broadcast/color certification, or cross-platform runtime qualification. Existing lower-level capabilities may support more than the demonstration covers; the validation report will distinguish them.

## Review status

The independent builder check identified only the missing thirteen-repository inventory, now supplied above. Pending user approval. Research and implementation details can be refined from source findings without expanding the promised product scope.

The local AE 26.2 preferences currently record `Pref_SCRIPTING_FILE_NETWORK_SECURITY = 0`. Live bridge validation requires enabling AE's scripting file/network access. The implementation can be built and tested offline first; native validation must report this prerequisite explicitly if it remains disabled.
