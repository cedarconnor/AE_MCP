# Aesthetics

## Composition

Use normalized design coordinates for decisions and comp pixels for execution.
`xPx = xNormalized * width`, `yPx = yNormalized * height`. A 0.06 margin means 6%
of the corresponding dimension, not 6% of the diagonal. Platform UI exclusion
zones are separate from this aesthetic margin and must come from the delivery brief.

Establish one dominant block, an alignment system, a repeatable spacing unit and
room for entrances and exits. Group by proximity before adding panels. Negative
space can be asymmetric. Inspect actual glyph bounds, not just layer positions.
Optical alignment may differ from mathematical centering; record intentional offsets.

Use `text.measure`, `layer.bounds` and `shape.group_bounds` where useful. Text source
bounds, transformed comp bounds and group bounds are different spaces; camera and
parent transforms can make a bounding rectangle insufficient. Verify the captured image.

## Typography

Define display, support and metadata roles. Choose installed PostScript font names
with `font.list`, `font.info`, and `font.check_glyphs` for the actual copy. Glyph
coverage does not prove correct shaping, fallback or pleasing typography: render it.
Check long names, accents, punctuation, CJK/RTL text and changing numbers if relevant.

Sizes in the parameter catalog are fractions of comp height, converted to pixels.
These are starting points, not platform accessibility certifications. Measure longest
expected strings. Reflow line breaks or composition before making everything tiny.
Set `autoLeading:false` when explicitly setting leading. AE tracking is thousandths
of an em: a design value of `-0.02 em` corresponds to `-20` tracking units.

Whole-layer entrances are often enough. Use word/line choreography when reading order
is the idea. Per-character motion has a larger attention cost; it should not destroy
word shapes during the entire hold. Prefer native text animators for long strings.
For changing statistics, keep units and labels stable and avoid rebuilding Source
Text at every frame unless the effect actually requires it.

## Color and surface

Assign palette roles: ground, surface, text, muted text and accent. Values in the
catalog are display-referred sRGB hex design swatches. Converting bytes to 0–1 gives
AE input numbers; it is not color-management conversion. Record the project working
space and output transform before matching rendered color to a brand target.

Choose contrast based on the actual rendered relationship, especially over moving
footage. An accent should identify meaning, not merely increase saturation everywhere.
Black, white, gradients and flat fills are all available; no universal ban applies.
If perceptual color interpolation is needed, compute or sample it deliberately and
verify AE output. Native color keys do not promise OKLCH interpolation.

Stroke thickness, corner radius and shadows should describe the same material.
Inspect thin rules and small text at final output resolution. Grain and glow cannot
repair weak spacing, insufficient contrast or an unclear reading order.

## Multi-format

Recompute margins and size limits for landscape, square and portrait. Preserve the
hierarchy rather than all coordinates. Reserve platform overlays only when the
delivery specification calls for them, and verify the current template. Capture
the longest-copy hold and the widest-moving frame separately for each format.
