---
name: after-effects-motion-design
description: Design, animate, and critique editable After Effects motion graphics using the After Effects Uber MCP. Use for visual direction, typography, composition, timing, easing, choreography, logo reveals, titles, lower thirds, data graphics, or improving motion quality in an existing AE project.
---

# After Effects motion design

Turn a creative brief into a deliberate visual hierarchy and a readable sequence of
actions, built as editable AE layers. Preserve the user's references, brand, scope,
and existing animation. Defaults below are adjustable starting points, not taste laws.

## Choose the relevant reference

| Task | Read |
|---|---|
| Establish a look or refine a vague brief | [Direction](references/direction.md), [style profiles](references/profiles.json) |
| Layout, type, color, graphic hierarchy | [Aesthetics](references/aesthetics.md) |
| Easing, timing, rhythm, overshoot, stagger | [Animation](references/animation.md) |
| Titles, logo stings, lower thirds, charts, transitions | [Recipes](references/recipes.md) |
| Camera, depth, blur, grain, glow | [Depth and finish](references/depth-and-finish.md) |
| Voiceover, beats, sound cues | [Sound and rhythm](references/sound-and-rhythm.md) |
| Translate design intent into this server | [AE mapping](references/ae-mapping.md) |
| Review or rescue an existing piece | [Review](references/review.md) |
| Exact parameter meanings, units and suggested ranges | [Parameter reference](references/parameters.md), [machine-readable catalog](references/parameters.json) |

Only load the references needed for the task. For MCP-only access, every packaged
file is available at `ae-uber://skills/after-effects-motion-design/<relative-path>`.
Read `ae-uber://skills/after-effects-motion-design/manifest.json` for the file list.

## Working sequence

1. Read the brief, reference frames and any existing style decisions. If the task
   is clear, proceed. Ask only for missing information that materially changes the
   result. Otherwise state assumptions for format, copy, font, duration and look.
2. Inspect `ae_context` and the intended comp. Use `ae_catalog` to verify available
   operations. Preserve the active project and unrelated layers. Discover installed
   fonts and actual property paths rather than substituting silently.
3. Define the focal message, layout, palette, type roles and motion personality in
   a small design brief. Use [the example](examples/editorial-brief.json) as a shape,
   not as extra fields for `ae_motion_build`. Record which tokens you override.
4. Solve the principal hold frame before refining motion. Give each element a
   role and a reason to move or remain still. Map start, arrival, readable hold,
   exit and any audio cues to a shared frame clock.
5. Build with native text, shapes and a small set of meaningful keyframes. The
   portable v1 spec has fixed slide/fade motion; custom easing, static backgrounds,
   masks, text animators and rigs need `ae_do`. Read the mapping before promising
   them. Record returned IDs; not every operation accepts an `{id}` selector.
6. Capture actual AE frames at critical beats, inspect them and revise the largest
   visible problem first. Re-capture affected beats after edits. Watch a rendered
   sequence for temporal quality when playback is available; stills do not prove it.
7. Deliver the editable AEP when requested, the design brief, source spec and edit
   notes, plus the evidence reviewed and remaining limitations. Artist acceptance
   stays pending until the user provides it.

## Decision rules

- Prefer the user's brand or reference over any shipped style profile. Linear
  motion, hard cuts, flat color and stillness are valid choices with a clear purpose.
- Spend movement on the hierarchy: lead action first, supporting response next;
  ambient movement is optional. Do not add perpetual drift to fill a hold.
- Read text at delivery size. Give dense or unfamiliar copy more time; changing a
  duration token never substitutes for inspecting the rendered type.
- A numerical audit is separate from aesthetic judgment. State the frame/time,
  observed problem, proposed parameter change and recheck result.
- Make one bounded revision pass at a time. If an operation times out, reconcile
  its request ID with `ae_request_status` before retrying any mutation.
- This skill neither installs another renderer/bridge nor enables raw JSX. External
  libraries are research references; their tool names are not this server's API.

The package contains original guidance and examples synthesized from the source
survey. See [sources](references/sources.md) for provenance and limits.
