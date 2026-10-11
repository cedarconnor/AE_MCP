# Mapping design parameters to this MCP

## Three different artifacts

1. **Design brief:** profile, aesthetic tokens, beat sheet, rationale and review status.
2. **Motion spec v1:** strict `version`, `comp`, `layers` object for `ae_motion_build`.
3. **Native edit record:** operation calls and returned identities for changes beyond v1.

Keep these separate. There is no new `style`, `spring`, `camera`, `tracking`, `blur`
or `profile` field in `ae_motion_build`. The skill does not change the 16-tool,
218-default-operation surface. Its parameters guide the agent; no automatic
75-parameter compiler is claimed.

## Capability table

| Design intent | Current route | Important boundary |
|---|---|---|
| Dimensions, fps, duration | v1 `comp` | Use the intended project rate, not an arbitrary profile rate |
| Text, rectangle, ellipse geometry/color | v1 layers | Order is back-to-front; positions are visual centers |
| Font and font size | v1 text layer; `font.list`, `font.check_glyphs` | Actual font substitution and text bounds need inspection |
| Entrance, hold, exit, start offset | v1 `timing` | All phases must fit duration and produce increasing times |
| Custom travel, direction, scale, rotation, ease | `keyframe.apply` | Replaces fixed v1 motion only on explicitly targeted properties |
| Static opaque ground | `layer.create_solid`, `layer.move` | Comp background is viewer color; v1 shapes also slide/fade |
| Leading, tracking, justification | `text.set_style` | Set autoLeading false for explicit leading; remeasure and reanchor |
| Word/character reveal | `text.add_animator`, `property.list`, `keyframe.apply` | Inspect the actual selector paths and group mode |
| Rounded panels, strokes, draw-on | `shape.add_rect`, `shape.add_stroke`, `shape.add_trim_paths` | These shape operators are not fields in v1 |
| Arc or compatible path morph | `keyframe.set_spatial` or shape property keys | Path tangents and temporal easing are independent |
| Camera/null rig and parallax | `layer.create_camera`, `layer.create_null`, `layer.set_parent` | Inspect 3D properties and renderer; no v1 camera compiler |
| Effects and finishing | `effect.add`, `effect.list_on_layer`, `effect.set_property` | Discover native matchNames and child parameters; plugins vary |
| Blur | `comp.set_props`, `layer.set_props` | Both switches and shutter settings affect native motion blur |
| Cue markers and supplied audio | `marker.add_comp`, `footage.import`, `layer.create_footage` | No built-in beat detection, sound synthesis or mastering |
| Evidence | `ae_motion_audit`, `ae_motion_review`, `ae_render_frame` | Sparse RGB stills do not prove playback, alpha or final delivery color |

`ae_motion_plan` returns one of the existing three structural presets. It does not
read this library's profiles. Use a plan as a starting point, adapt a provided
`.motion.json` example, or construct a new valid spec.

## Fixed v1 animation

The compiler creates four Position and four Opacity keys per layer. Position goes
from `[x, y + offset]` to `[x,y]`, holds, then exits to `[x,y - offset]`, where
`offset = min(60, comp.height * 0.04)`. Opacity goes `0 → 100 → 100 → 0`.
All keys use Bezier interpolation with zero temporal speed and 66% influence.
Spatial tangents are zeroed. This is useful scaffolding, not a full motion language.

To use a different movement, replace only those properties' keys on the intended
new layer. Native edits do not update the original spec hash. Preserve the edit
record so another session knows why the AEP differs from the JSON.

## Concrete custom motion call

On a **newly built example**, replace the `Title` layer's Position keys in comp 42.
Replace 42 with the actual returned comp ID and resolve the intended layer. This
changes only Position, leaving the separate Opacity animation in place. `replace:true`
deletes that property's existing keys; do not use it blindly on an artist's animation.

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.apply",
    "args": {
      "comp": 42,
      "layer": "Title",
      "property": ["ADBE Transform Group", "ADBE Position"],
      "replace": true,
      "spatialTangents": "linear",
      "keys": [
        {"time": 0, "value": [960, 513], "interp": "ease", "inSpeed": 0, "outSpeed": 0, "outInfluence": 25},
        {"time": 0.6, "value": [960, 475], "interp": "ease", "inSpeed": 0, "outSpeed": 0, "inInfluence": 70},
        {"time": 5.2, "value": [960, 475], "interp": "ease", "inSpeed": 0, "outSpeed": 0},
        {"time": 6, "value": [960, 437], "interp": "ease", "inSpeed": 0, "outSpeed": 0}
      ]
    }
  }
}
```

The last key may lie at comp duration; capture times must be **less than** duration.
Discover actual property dimensions. AE spatial properties and their temporal ease
arrays have different dimensional rules; the helper handles the supported cases.
Separated dimensions and parent transforms still require inspection.

## Practical adaptation

- Hex swatch `#C45D3A` becomes `[196/255,93/255,58/255]` as AE input. Rendered color
  still depends on the project's color pipeline.
- `type.displaySize:0.08` at height 1080 becomes 86.4 px. `layout.heroY:0.46`
  becomes 496.8 px. The catalog values are not passed directly as fractions to AE.
- For a static background, create a solid, inspect its returned identity and move
  it to the bottom using the actual current layer count. Do not overwrite other layers.
- For `type.leading:1.12` and font size 86, set leading to 96.32 px with
  `autoLeading:false`. Measure after the change; a preexisting anchor may need repair.
- For a 12-frame move at 30 fps, use 0.4 seconds. For 29.97 fps, use the exact
  composition frame rate returned by inspection, not a rounded substitute.
- For imported design footage, preserve native text and shapes where feasible.
  Unsupported CSS, shaders, simulations and Lottie features need deliberate
  reconstruction or a disclosed raster/footage fallback; this skill is not a converter.

Inspect each result's `ok`, warnings and partial failures. `batch.run` is an undo
group, not rollback. Category policies still apply; a readable skill resource does
not grant permission to mutate the project or change application preferences.
