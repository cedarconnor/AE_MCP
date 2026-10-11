# Thirteen-repository review and adoption decision

Reviewed 2026-10-10. This is source inspection at the pinned commits in
[the manifest](research/upstream-manifest.json), not a claim that thirteen
upstream servers were executed in After Effects. Detailed evidence, including
file/line locations and test limitations, is in the three linked reports.

## Decision

Build one attributed derivative of Kumo's TypeScript server, fix the reviewed
request-consumption and timeout-recovery defects, and add an original native
motion-spec workflow. Other repositories supply design ideas, not additional
running bridges. Existing catalogs remain useful without claiming every
operation has live validation.

| Repository | Best parts | Adoption decision / principal caveat |
|---|---|---|
| [Kumo](https://github.com/kumoproductions/mcp-aftereffects) | Broad typed operations, compact catalog, per-request IPC, inspection, color/frame helpers, tests | Foundation; claim-before-execute and recoverable outcomes required |
| [HeroicSwan](https://github.com/HeroicSwan/after-effects-mcp) | Portable motion blueprints, templates, review records | Independently implement workflow ideas; shared-slot bridge and rendering unrelated queue items excluded |
| [Dakkshin](https://github.com/Dakkshin/after-effects-mcp) | Simple approachable AE primitives | Baseline reference; position edits can erase animation and IPC has one shared slot |
| [TheLlamainator](https://github.com/TheLlamainator/after-effects-mcp) | Effect/preset discovery and amplitude-to-marker tools | Discovery principles retained through foundation; audio recipes are future work |
| [a-y-ibrahim](https://github.com/a-y-ibrahim/after-effects-mcp) | RTL/localization, audio/data helpers, frame inspection | Typography capability awareness; full localization/audio mapping deferred pending native fixtures |
| [Aodaruma](https://github.com/Aodaruma/adobe-mcp-rs) | Durable request state, result retrieval, instance queues | Reimplement outcome concepts in TypeScript; do not introduce unauthenticated TCP daemon |
| [ishu86](https://github.com/ishu86/after-effects-mcp) | Modular motion generators, native recipes, test cases | Motion decomposition/preflight ideas; discard-on-new and incomplete retiming excluded |
| [JUNKDOGE-JOE](https://github.com/JUNKDOGE-JOE/after-effects-mcp) | Uncertain-write recovery, ownership, checkpoints, capture hashes | Outcome/evidence principles; large CEP/native/provider stack deferred |
| [GUNMIN-KIM](https://github.com/GUNMIN-KIM/after-effects-codex-agent) | Inspect/build/render/revise workflow guidance | Documentation only; no explicit license, so no prose/code copied |
| [VolksRat71](https://github.com/VolksRat71/after-effects-mcp-vision) | Compact verbs, stable layer IDs, property discovery and image completion | Stable ID and preview principles; duplicate matchName ambiguity needs care |
| [Engine Room](https://github.com/Engine-Room-Games/after-effects-mcp) | Typed motion tools, PNG handling, scoped snapshots/diffs | Honest preview/diff coverage; process-local writer leases excluded |
| [Solomon](https://github.com/solomondivyananth/aftereffects-mcp) | Editable declarative templates, mechanical motion checks | Bounded templates/QA; no claim that structural checks judge taste or sparse samples prove playback |
| [tzdwindows](https://github.com/tzdwindows/after-effects-mcp) | Camera/text animator/easing/preview concepts | Existing foundation covers primitives; snapshot Save As and bare-Undo rollback excluded |

All twelve runtime repositories have MIT root licenses in the reviewed
checkouts. GUNMIN has no explicit reuse grant. This inventory is not a license
audit of every upstream dependency or packaged binary. The shipped source
attribution is in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

## Highest-impact findings

- **Project preservation:** ishu86 creates a project by discarding the open one;
  tzdwindows snapshots change the active save path. Kumo's explicit destructive
  project operations also require safeguards in the derivative.
- **Exactly-once execution cannot be assumed:** several bridges overwrite a
  single request slot; Kumo can execute after request removal fails. UUIDs alone
  do not solve ownership and timeout races.
- **Timeout is not cancellation:** a late AE mutation may still complete. Expose
  request identity and retained outcomes, and never retry automatically.
- **Animation preservation:** Dakkshin position updates remove all keys; ishu86
  retiming omits spatial keyframe metadata.
- **Visual evidence has limits:** HeroicSwan plan scores do not inspect rendered
  images; Solomon's fixed-rate sampled preview does not preserve timeline speed.
- **Stable layer IDs do not make property paths unique:** duplicated effects,
  masks and shape groups need occurrence-aware selectors.

## Detailed reports

- [Bridge/core review](research/review-bridges.md): HeroicSwan, Kumo, Aodaruma, a-y-ibrahim.
- [Motion review](research/review-motion.md): Dakkshin, TheLlamainator, ishu86, tzdwindows.
- [Vision/continuity review](research/review-vision.md): JUNKDOGE, VolksRat, Engine Room, Solomon, GUNMIN.

The consolidated implementation's actual test results belong in VALIDATION.md;
upstream source and historical test claims are kept separate from those results.
