# Depth and finish

Use depth to organize attention. A quiet title can remain fully 2D. A 2.5D scene
needs foreground/midground/background relationships, an intentional camera move and
enough overlap to make depth visible. A flat scale-up is not a camera dolly.

Keep type within the readable focal region. Camera and object animation should not
both dominate the same beat unless that conflict is deliberate. Give camera moves
an arrival and hold; slow perpetual movement can still distract from reading.

`layer.create_camera`, `transform.set` with `threeDLayer`, parenting and inspected
camera properties provide building blocks. Camera zoom is an AE property value;
do not paste focal millimeters into it. Establish the filmback/field of view before
converting a lens specification. Depth of field, light/material properties and
renderer support need host inspection. These are outside the portable v1 spec.

Motion blur describes movement during exposure; Gaussian Blur describes spatial
softness. They are not substitutes. Configure the layer switch and comp switch
deliberately and inspect shutter properties through `comp.set_props`. A starting
shutter angle of 180 degrees is optional; reduce it for crisp type or a staccato
look, and disable it for a no-blur delivery. Inspect high-speed edges and hold frames.

For glow, shadows, grain and distortion, discover the installed effect matchName,
add it, then inspect its properties before setting values. The normalized finish
intensities in the catalog express creative intent, not values to paste into
arbitrary plugins. Parameter scales differ. Do not globally change bit depth,
working space, preferences or install effects as an unannounced styling step.

Layer order matters: a grade after compositing changes text as well as footage;
grain after text can damage small labels. Inspect the actual stack. Use a native
adjustment layer only when a comp-wide treatment is wanted.

The default profiles keep grain, glow and shake at zero. Increase one treatment
when it serves the brief and compare against an untreated frame. A reduced-motion
version can retain the same typography/color with stationary framing and short
opacity transitions. A rendered video cannot respond to `prefers-reduced-motion`;
deliver a separate variant or poster when needed.
