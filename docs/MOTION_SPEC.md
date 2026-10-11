# Portable motion specification

[README](../README.md) · [Examples](EXAMPLES.md) · [Tools](TOOLS.md)

The version-1 spec describes timed, editable text and shape layers. It is plain
JSON that can be saved independently of AE. It is a source plan; subsequent AE
edits are not automatically written back into it. A build always creates a new
composition, even if an identical name/spec already exists.

The [generated JSON Schema](reference/motion-spec.schema.json) and MCP resource
`ae-uber://motion-spec-schema` describe the fields. Cross-field timing and unique
key rules are additionally enforced by [the validator](../src/motion/spec.ts).
Unknown keys are rejected at every strict spec object level.

## Complete example

```json
{
  "version": 1,
  "comp": {
    "name": "Motion Example",
    "width": 1280,
    "height": 720,
    "duration": 6,
    "fps": 30,
    "background": [0.012, 0.018, 0.035]
  },
  "layers": [
    {
      "key": "title",
      "name": "Title",
      "type": "text",
      "text": "Ideas in motion",
      "font": "ArialMT",
      "fontSize": 54,
      "position": [640, 360],
      "color": [1, 1, 1],
      "timing": {"start": 0, "in": 0.9, "hold": 4.2, "out": 0.9}
    }
  ]
}
```

Pass the entire object under `ae_motion_build.arguments.spec`. Complete preset
files are in [examples](../examples/). Use `ae_motion_plan` to create a preset
at another resolution before customizing it.

## Field contract

All fields shown below are required for custom specs. Numbers must be finite.

| Field | Contract |
|---|---|
| `version` | Exactly `1` |
| `comp.name` | Trimmed string, 1–255 characters |
| `comp.width`, `comp.height` | Integers, 4–30,000 pixels |
| `comp.duration` | 0.1–10,800 seconds |
| `comp.fps` | 1–99 frames/second; fractional rates allowed |
| `comp.background` | Three RGB numbers, each 0–1 |
| `layers` | 1–200 layers, ordered back to front |
| `layers[].key` | Unique string matching `^[A-Za-z][A-Za-z0-9_-]{0,63}$` |
| `layers[].name` | Trimmed string, 1–255 characters |
| `layers[].type` | `text`, `rect` or `ellipse` |
| `layers[].position` | Two numbers, each −30,000 to 60,000 pixels; visual center |
| `layers[].color` | Three RGB numbers, each 0–1 |
| `layers[].timing.start` | Nonnegative seconds |
| `layers[].timing.in`, `.hold`, `.out` | Strictly positive seconds |
| Text: `text` | 1–20,000 characters |
| Text: `font` | Trimmed PostScript font name, 1–255 characters |
| Text: `fontSize` | 1–1,296 pixels |
| Rect/ellipse: `size` | Two strictly positive numbers, each at most 30,000 pixels |

For each layer, `start + in + hold + out` must fit the composition duration
(validator tolerance 1e-8), and the four resulting key times must be strictly
increasing. A zero hold, a zero-length entrance or exit, and duplicate layer
keys are invalid. Timing is in seconds, not frame numbers. The current schema
does not accept arbitrary effects, masks, parenting, asset imports, rotations,
3D layers, per-key easing controls or extra metadata. Apply those through
operations after building.

## Native compilation

The compiler creates native text layers and shape groups, with fills for rects
and ellipses. Position is the visual center. Text anchor placement uses the
native text bounds at build time; changing text later may require measuring and
recentering it again. The layer order follows the spec's back-to-front order.

Each layer gets four opacity and four position keys:

| Time | Opacity | Position |
|---|---:|---|
| `start` | 0 | Center Y plus entrance offset |
| `start + in` | 100 | Requested center |
| `start + in + hold` | 100 | Requested center |
| `start + in + hold + out` | 0 | Center Y minus exit offset |

Offset is `min(60, comp.height * 0.04)` pixels. Temporal interpolation is Bezier
with `KeyframeEase(0, 66)`; native spatial tangents are set using the property's
dimension. The result is an entrance/hold/exit animation, not a general
keyframe interchange format. Opacity at the exact start is zero, so a first
frame at time 0 is expected to be empty. Capture late exit samples before the
composition duration, not at the duration itself.

`comp.background` sets the composition background color. It does not create a
full-frame solid and does not guarantee opaque render output. Add a full-frame
native background layer with operations when the deliverable requires it.

## Preset behavior

`ae_motion_plan` is deterministic and offline. Defaults are 1920×1080, six
seconds, 30 fps, ArialMT and the template name. Its input bounds are narrower
than the custom spec: width/height 64–16,384, duration 1–600, title 1–2,000
characters, subtitle at most 4,000, name/font at most 200. The resulting spec
must still pass the strict spec limits; extreme preset sizes can exceed the
font-size cap and be rejected.

| Preset | Layout |
|---|---|
| `title-card` | Central panel, title and optional subtitle |
| `lower-third` | Panel and text near the lower-left region |
| `statistic-card` | Central panel, large title/statistic, accent ellipse and optional subtitle |

All layers use 15% of duration for entrance, 70% hold and 15% exit, starting at
zero. They animate together; the preset does not stagger layers. Title and
subtitle strings are not automatically wrapped, truncated or fitted. There is
no numeric counting expression in the statistic preset: its value is editable
text, and counting behavior can be added separately through expressions.

The panel uses normalized width/height proportions: 0.82×0.6 for title/statistic
and 0.5×0.23 for lower thirds. Main title size is 0.075×height for title cards,
0.11×height for statistics and 0.045×height for lower thirds. These are starting
layouts, not safe-area or typography guarantees for every aspect ratio.

## Build results and revisions

Successful `ae_motion_build` returns `result.compId`, a list of
`{key,id,name}` layer records, `specHash` and warnings. Save those identifiers
with the source spec. Names are convenient for examples, but IDs avoid
ambiguity between duplicate names in the same project. Refresh IDs after
opening, importing or replacing projects.

The source hash records the validated plan used to build, not a hash of the
entire current native composition. A revised layer can retain the original
spec provenance. Revise with `ae_do` rather than repeatedly building. A failed
build can leave a partial comp/layers; the error preserves created IDs under
`error.details.result`. Inspect them before deciding whether to repair or
remove them. An undo group is not an automatic rollback.

Font lookup and layout checks continue inside AE. Builds can warn about font
substitution or measured bounds outside the composition. They do not auto-fit
or guarantee collision-free typography. Use `font.list`, `text.measure`, a
motion audit and rendered samples after significant text/layout changes.

## Audit and review

`ae_motion_audit` inspects layer timings, keyframe counts, missing footage and
current expression errors. It is bounded to 1,000 layers, 20,000 visited
properties, property depth 16 and 200 recorded issues. Check `truncated` and
`technicalStatus` if limits are reached. It does not compare every
native detail to the original spec or judge clipping/aesthetics.

`ae_motion_review` accepts 2–16 nonnegative sample times, each less than the
composition duration, and an absolute output directory. It creates a unique
`motion-review-UUID` folder with frames, contact sheet and a JSON manifest.
That record preserves audit facts, actual capture times, SHA-256 hashes of
frame bytes, source provenance and notes. Artist acceptance remains pending.
The contact sheet is appended as MCP image content only when available and at
most 8 MiB. Partial capture files can remain on failure.

These are sampled checks. Inspect animation playback and intended delivery
renders separately for frame-to-frame defects, color, transparency and final
artist approval. See [recorded native evidence](VALIDATION.md).
