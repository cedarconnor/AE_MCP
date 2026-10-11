# Recipes

Each recipe describes an editable native build and the visual decision it serves.
Discover current argument schemas with `ae_catalog` before executing. These are
compositions to adapt, not promises that one profile compiles every feature.

## Editorial title

Use [editorial-title.motion.json](../examples/editorial-title.motion.json) as a base.
One title, one supporting line and a short accent rule. Build through
`ae_motion_build`, then create an opaque background solid only if the delivery needs
one. The example's composition background is just a viewer color; its first frame
is intentionally transparent until you add native background/visibility edits.

Apply the [custom Position keys](ae-mapping.md) for a 38-pixel arrival with a stronger
settle than v1's fixed motion. Check the hold at 1.0 and 4.8 seconds and an entrance
midpoint near 0.3. If the title wraps or feels crowded, change composition before
adding ornament. Record the changed native keys beside the source spec.

## Product lower third

Use [product-lower-third.motion.json](../examples/product-lower-third.motion.json).
Panel, small accent, name and role arrive with short offsets. It is intentionally
center-set; left-aligned broadcast typography needs a native style/anchor pass.
Verify the longest name and a two-line role against the actual footage, not a blank
viewer. Leave the surrounding comp transparent for an overlay, and separately
verify alpha in the exported master.

For rounded corners, inspect the built rectangle property or construct a grouped
rectangle with `shape.add_rect` and roundness. V1's rectangle has no radius field.
Protect subject faces and any subtitle region in the delivery layout.

## Portrait statistic

Use [portrait-data.motion.json](../examples/portrait-data.motion.json). Its number
is explicitly fictional. Replace number, unit, label and source together with
approved information. Keep the supporting label stationary during a native counter
animation; the numeric hero should own attention. A static number is acceptable.

For counting, discover a native slider effect and apply an expression to Source Text,
or use a small number of appropriate native changes. Do not assume the portable spec
creates a counter. Audit the expression and verify the exact final displayed value,
unit, rounding and readable hold. Avoid elastic animation on a quantitative axis.

## Word or line reveal

Create live text, set typography and measure it. Add a text animator and inspect its
selector/grouping properties. Animate the selector or use one layer per short phrase.
Budget group reveal time as well as per-word stagger; the final word needs a full
reading hold. Do not animate meaningful text into illegibility for the entire shot.
Use clips/mattes only when required by the reference and check extreme frames.

## Logo draw and settle

Use the actual approved vector geometry. Build or import native paths, discover the
shape group and add Trim Paths. Animate its end property, then hold the complete
mark. Reveal filled forms with masks or transform choreography where a stroke draw
would change the mark. The no-assets fallback is an explicit wordmark study, not an
invented official logo. Preserve a static final lockup and enough hold for recognition.

## Diagram or chart

Establish values, axes, units and source before motion. Build bars/paths as shapes
and labels as text. Keep scale and zero/baseline decisions honest. Animate magnitude
or a reveal from the relevant origin; do not let ease/overshoot imply a false value.
Label motion should follow reading order, and final data must stay still long enough
to compare. Real-time graphs may warrant linear movement.

## Shape transition

For a wipe, create a shape matte sized for the comp, animate its path or transform,
and explicitly set the track-matte relationship. For morphs, match vertex topology,
winding and path correspondence before keying. Check start, middle, end and the frame
after the transition. A dissolve or cut is preferable when it carries the idea better.

## Looping accent

Use one cyclical gesture with a known period and an intentional role. Build a
seam-continuous curve or a verified expression. Inspect the last rendered frame,
the first and their neighbors; do not append a duplicate end frame that creates a
pause. Stop or omit the loop when it competes with reading. Seed any procedural
variation so review frames can be reproduced.

## Camera reveal

Use the cinematic-spatial profile only as direction. Create a null/camera rig and
native 3D layers, inspect camera properties and renderer support, then establish
framing before keying the move. A small change in angle or occlusion should justify
the move. Keep essential type readable and record what remains 2D. This recipe
requires native operations; none of the shipped v1 examples implements a camera.

## Reduced-motion alternate

Retain the same color and type hierarchy, lock the camera, remove shake/overshoot
and use stationary opacity changes or cuts. Keep the same information and hold
duration. With a v1 build, replacing only Position is insufficient if Scale,
expressions or camera movement were later added: inspect the entire active rig.

## Example data for operation validation

[native-edits.json](../examples/native-edits.json) contains concrete operation calls
for a prepared comp. Its comp ID and layer names are fixtures to replace after
inspection. The file is data for the agent, not an auto-executing script. Read each
precondition; property writes can replace artist work if applied to the wrong layer.
