# Motion design parameter reference

These 75 parameters form a **design sidecar**, not extra fields accepted by
`ae_motion_build`. They guide an agent translating intent into the existing API.
No automatic profile-to-AE compiler is supplied. Defaults and suggested bands are
original package recommendations, not measured laws or copied upstream presets.

`spec` means a value can inform an existing v1 field after conversion; `ae-do`
requires explicit native operations and inspection; `design` requires a creative
decision or derived mapping; `external` requires supplied media/analysis. An operation
listed beside a design value is a building block, not an automatic setter.

Frame tokens use `timing.referenceFps`; convert absolute endpoints once to the target
fps. Fractions refer to the dimension named in the unit. Colors are sRGB design
swatches, not a declaration of the AE project working space. See [AE mapping](ae-mapping.md).

## layout

| Parameter | Default | Unit / choices | Suggested band | Route / building blocks | Meaning |
|---|---|---|---|---|---|
| `layout.marginX` | `0.06` | fraction of width | 0.03 to 0.12 | design / `comp.add_guide` | Horizontal breathing room; convert to pixels, then verify delivery overlays. |
| `layout.marginY` | `0.07` | fraction of height | 0.04 to 0.15 | design / `comp.add_guide` | Vertical breathing room; independent of platform UI exclusion zones. |
| `layout.columns` | `12` | count | 4 to 16 | design | Conceptual grid; align a small number of blocks, not every object to every column. |
| `layout.gutter` | `0.018` | fraction of width | 0.01 to 0.04 | design | Spacing between conceptual columns. |
| `layout.spacingUnit` | `0.012` | fraction of height | 0.006 to 0.025 | design | Base spacing increment; optical adjustments remain possible. |
| `layout.heroX` | `0.5` | fraction of width | 0.1 to 0.9 | spec | Maps to a layer position X after multiplying by comp width. |
| `layout.heroY` | `0.46` | fraction of height | 0.15 to 0.85 | spec | Maps to a layer position Y after multiplying by comp height. |
| `layout.heroWidth` | `0.78` | fraction of width | 0.45 to 0.9 | spec | Shape width or text layout target; text requires measured fit, not a v1 width field. |
| `layout.alignment` | `"center"` | choice (left, center, right) | Contextual | ae-do / `text.set_style`, `layer.set_anchor` | Text justification and anchor placement must agree. |

## type

| Parameter | Default | Unit / choices | Suggested band | Route / building blocks | Meaning |
|---|---|---|---|---|---|
| `type.font` | `"ArialMT"` | PostScript font name | Contextual | spec / `font.list`, `font.check_glyphs` | Fallback example only; resolve the actual brand font and glyph coverage. |
| `type.displaySize` | `0.08` | fraction of height | 0.05 to 0.16 | spec | Convert to fontSize pixels; check the actual longest string. |
| `type.supportSize` | `0.032` | fraction of height | 0.025 to 0.055 | spec | Supporting-copy size; reflow for output aspect ratio. |
| `type.metaSize` | `0.024` | fraction of height | 0.018 to 0.035 | spec | Metadata size starting point; actual legibility can require larger type. |
| `type.leading` | `1.12` | multiple of font size | 1 to 1.4 | ae-do / `text.set_style` | Set leading in pixels and autoLeading false; distinct values per type role may be needed. |
| `type.tracking` | `0` | thousandths of em | -30 to 80 | ae-do / `text.set_style` | AE tracking units; do not pass a CSS em number unchanged. |
| `type.maxLines` | `2` | count | 1 to 4 | design / `text.measure` | Composition constraint to check against actual copy; no automatic line-count enforcement. |
| `type.revealUnit` | `"line"` | choice (layer, line, word, character) | Contextual | ae-do / `text.add_animator` | Inspect selector properties for word/character grouping or use separate text layers. |
| `type.wordStagger` | `3` | frames at reference fps | 1 to 8 | ae-do / `text.add_animator`, `keyframe.apply` | Offset between words or lines after resolving the chosen grouping. |

## color

| Parameter | Default | Unit / choices | Suggested band | Route / building blocks | Meaning |
|---|---|---|---|---|---|
| `color.ground` | `"#F4F1E9"` | sRGB hex | Contextual | spec / `layer.create_solid` | Opaque output needs an actual solid/background layer; comp.background is only viewer color. |
| `color.surface` | `"#E1DDD2"` | sRGB hex | Contextual | spec / `shape.add_fill` | Surface fill; swatch byte conversion is not a color-management transform. |
| `color.text` | `"#17242D"` | sRGB hex | Contextual | spec / `text.set_style` | Primary text color against the actual visible ground. |
| `color.muted` | `"#56626B"` | sRGB hex | Contextual | spec / `text.set_style` | Secondary text; inspect contrast rather than assuming this swatch always works. |
| `color.accent` | `"#C45D3A"` | sRGB hex | Contextual | spec / `shape.add_fill`, `text.set_style_range` | Use to identify a meaningful feature or word. |
| `color.accentArea` | `0.08` | approximate area fraction | 0 to 0.25 | design | Visual allocation heuristic, not a computed pixel mask or compliance rule. |
| `color.interpolation` | `"native"` | choice (native, perceptual-sampled) | Contextual | design / `keyframe.apply` | Native AE interpolation or externally computed perceptual samples; never inferred from a name. |

## timing

| Parameter | Default | Unit / choices | Suggested band | Route / building blocks | Meaning |
|---|---|---|---|---|---|
| `timing.referenceFps` | `30` | frames per second | 24 to 60 | design | Rate defining the frame-valued design tokens; convert absolute endpoints to target fps. |
| `timing.entrance` | `18` | frames at reference fps | 6 to 36 | spec / `keyframe.apply` | Start to arrival duration, exclusive of anticipation when anticipation is separately added. |
| `timing.exit` | `12` | frames at reference fps | 4 to 24 | spec / `keyframe.apply` | Hold-end to departure duration. |
| `timing.minimumHold` | `54` | frames at reference fps | 30 to 150 | spec | Minimum readable hold, extended for copy and visual complexity. |
| `timing.stagger` | `3` | frames at reference fps | 0 to 10 | spec / `keyframe.apply` | Delay sibling starts; ensure the last sibling still has its full hold. |
| `timing.groupRevealMax` | `36` | frames at reference fps | 12 to 60 | design | Suggested maximum elapsed group entrance; shorten stagger if necessary. |
| `timing.readingWordsPerSecond` | `2.6` | words per second | 1.5 to 3.5 | design | Planning heuristic; validate with audience, language and actual playback. |
| `timing.transition` | `10` | frames at reference fps | 0 to 24 | ae-do / `keyframe.apply`, `layer.set_timing` | Zero means an intentional hard cut; otherwise reserve overlap time. |

## motion

| Parameter | Default | Unit / choices | Suggested band | Route / building blocks | Meaning |
|---|---|---|---|---|---|
| `motion.travel` | `0.035` | fraction of height | 0 to 0.15 | ae-do / `keyframe.apply` | Distance along the selected direction; not a motion-spec-v1 parameter. |
| `motion.direction` | `"up"` | choice (up, down, left, right, still) | Contextual | ae-do / `keyframe.apply` | Arrival direction. Still means no position animation. |
| `motion.anticipation` | `0` | frames at reference fps | 0 to 8 | ae-do / `keyframe.apply` | Optional preparation before entrance; include it in total scene duration. |
| `motion.anticipationDistance` | `0.06` | fraction of main travel | 0 to 0.2 | ae-do / `keyframe.apply` | Small reverse move; zero travel means no positional anticipation. |
| `motion.overshoot` | `0` | percent of travel distance | 0 to 12 | ae-do / `keyframe.apply` | Distance past destination, not percent of screen coordinate or scale. |
| `motion.settle` | `6` | frames at reference fps | 3 to 18 | ae-do / `keyframe.apply` | Time after first arrival to final rest for an overshooting gesture. |
| `motion.scaleFrom` | `100` | percent scale | 85 to 105 | ae-do / `keyframe.apply` | Optional start scale. Final baseline is normally 100 percent. |
| `motion.rotationFrom` | `0` | degrees | -8 to 8 | ae-do / `keyframe.apply` | Optional start angle; use sparingly with moving type. |
| `motion.path` | `"straight"` | choice (straight, arc) | Contextual | ae-do / `keyframe.apply`, `keyframe.set_spatial` | Temporal easing does not define this spatial path. |
| `motion.entryOutInfluence` | `25` | percent | 10 to 60 | ae-do / `keyframe.apply` | Outgoing temporal influence on the first key; 0.1–100 native valid range. |
| `motion.entryInInfluence` | `70` | percent | 40 to 90 | ae-do / `keyframe.apply` | Incoming temporal influence at arrival, tuned with speeds and duration. |
| `motion.endpointSpeed` | `0` | property units per second | 0 to 0 | ae-do / `keyframe.apply` | Zero for stop-to-stop endpoints; continuous motion needs separately calculated speeds. |

## choreography

| Parameter | Default | Unit / choices | Suggested band | Route / building blocks | Meaning |
|---|---|---|---|---|---|
| `choreography.maxDominantActions` | `1` | count | 1 to 3 | design | Concurrent attention-demanding actions; this is a review target, not automatic enforcement. |
| `choreography.supportDelay` | `4` | frames at reference fps | 0 to 12 | spec / `keyframe.apply` | Offset support relative to the lead beat, independent of internal sibling stagger. |
| `choreography.ambientMotion` | `false` | boolean | Contextual | design | Add background motion only when it has a role. |
| `choreography.overlap` | `0.2` | fraction of preceding entrance | 0 to 0.6 | design | How much two related gestures overlap; resolve to actual start frames. |
| `choreography.transition` | `"cut"` | choice (cut, dissolve, wipe, match-move) | Contextual | ae-do / `keyframe.apply`, `layer.set_track_matte` | Choose a continuity mechanism deliberately. |

## shape

| Parameter | Default | Unit / choices | Suggested band | Route / building blocks | Meaning |
|---|---|---|---|---|---|
| `shape.cornerRadius` | `0.012` | fraction of shorter comp edge | 0 to 0.04 | ae-do / `shape.add_rect` | Convert to pixels; portable v1 rectangles have no radius field. |
| `shape.strokeWidth` | `0.002` | fraction of shorter comp edge | 0.001 to 0.006 | ae-do / `shape.add_stroke` | Inspect at delivery size to avoid subpixel flicker. |
| `shape.drawDuration` | `24` | frames at reference fps | 10 to 60 | ae-do / `shape.add_trim_paths`, `keyframe.apply` | Draw-on duration; discover the trim end property after adding the operator. |
| `shape.morphTopology` | `"matched"` | choice (matched, requires-rebuild) | Contextual | design / `shape.add_path`, `keyframe.apply` | Path keys need compatible vertex count/order/winding; reconcile first. |

## depth

| Parameter | Default | Unit / choices | Suggested band | Route / building blocks | Meaning |
|---|---|---|---|---|---|
| `depth.mode` | `"flat"` | choice (flat, 2.5d) | Contextual | design / `transform.set`, `layer.create_camera` | Flat is valid; 2.5D requires native depth/camera work outside v1. |
| `depth.parallax` | `0` | fraction of height | 0 to 0.04 | ae-do / `keyframe.apply` | Target screen-space relative travel; world depth must be calibrated to the camera. |
| `depth.cameraMove` | `"locked"` | choice (locked, push, pull, pan, orbit) | Contextual | ae-do / `layer.create_camera`, `keyframe.apply` | Lock framing for reading when needed. |
| `depth.cameraTravel` | `0.025` | fraction of scene reference depth | 0 to 0.1 | design | Planning value; requires a chosen scene scale and camera transform, not direct zoom input. |
| `depth.focusOnText` | `true` | boolean | Contextual | design / `property.list`, `property.set` | When depth of field is used, prioritize the intended readable subject. |

## finish

| Parameter | Default | Unit / choices | Suggested band | Route / building blocks | Meaning |
|---|---|---|---|---|---|
| `finish.motionBlur` | `false` | boolean | Contextual | ae-do / `comp.set_props`, `layer.set_props` | Both comp and relevant layer switches must be inspected/set. |
| `finish.shutterAngle` | `180` | degrees | 90 to 270 | ae-do / `comp.set_props` | Only meaningful when motion blur is active; inspect phase and rendering behavior. |
| `finish.grain` | `0` | normalized creative intensity | 0 to 0.12 | design / `effect.add`, `effect.set_property` | Not a plugin value; map after inspecting the installed effect. |
| `finish.glow` | `0` | normalized creative intensity | 0 to 0.2 | design / `effect.add`, `effect.set_property` | Not a plugin value; protect text contrast and highlight detail. |
| `finish.shadow` | `0` | normalized creative intensity | 0 to 0.25 | design / `effect.add`, `effect.set_property` | Specify source direction, softness and opacity in the actual effect separately. |
| `finish.shake` | `0` | fraction of height | 0 to 0.008 | ae-do / `keyframe.apply`, `expression.set` | Screen-space amplitude intent; deterministic animation and reduced-motion variant as needed. |

## rhythm

| Parameter | Default | Unit / choices | Suggested band | Route / building blocks | Meaning |
|---|---|---|---|---|---|
| `rhythm.bpm` | `120` | beats per minute | 60 to 180 | external | Optional planning grid; actual music may require measured or variable beat times. |
| `rhythm.beatOffset` | `0` | seconds | 0 to 2 | external | First measured reference beat; calculate absolute frame times. |
| `rhythm.sync` | `"none"` | choice (none, beat, word, cue) | Contextual | design / `marker.add_comp` | Markers record cues; no automatic audio generation or analysis. |
| `rhythm.impactLead` | `0` | frames at reference fps | -3 to 3 | design | Visual impact offset relative to measured cue: negative is before audio peak. |

## review

| Parameter | Default | Unit / choices | Suggested band | Route / building blocks | Meaning |
|---|---|---|---|---|---|
| `review.sampleCount` | `8` | frames per review call | 2 to 16 | design | Choose event-driven times; more calls may be required. |
| `review.boundaryRadius` | `1` | frames at target fps | 1 to 3 | design | Capture neighboring frames around cuts or sudden changes. |
| `review.reducedMotion` | `false` | boolean | Contextual | design | Prepare a separate calm variant or poster when requested; no CSS media query in a video. |
| `review.nativeEvidence` | `"pending"` | choice (pending, checked) | Contextual | design | Record evidence honestly; a schema-checked example is not native proof. |
| `review.playbackEvidence` | `"pending"` | choice (pending, checked) | Contextual | design | Only change after reviewing an actual sequence; still frames are insufficient. |
| `review.artistAcceptance` | `"pending"` | choice (pending, accepted, changes-requested) | Contextual | design | Only the user can supply acceptance. |
