# Animation

## One clock

Use integer frame indices for the design timeline. Convert to seconds as `frame/fps`
at the AE boundary; use the actual comp fps, including fractional rates. When choosing
durations from seconds, round endpoints once, then derive durations from their frame
differences. Repeatedly rounding one beat duration accumulates sync error.

At 30 fps, 12 frames is 0.4 seconds; at 24 fps it is 0.5 seconds. The profiles are
defined at a reference rate of 30 fps. To preserve real duration, scale each absolute
endpoint by `targetFps/30` and round. To preserve an intentional frame-stepped look,
retain the frame count instead and document that choice.

Separate **timing** (when events occur), **spacing** (positions/values across time),
**spatial path** (where the object travels) and **temporal easing** (speed along it).
Changing one does not automatically fix the others.

## Motion grammar

| Action | Starting approach | Review question |
|---|---|---|
| Arrival | Decelerate toward a clear rest pose | Does the eye find the destination? |
| Departure | Accelerate away, often shorter than arrival | Is the message finished before exit? |
| Reposition | Ease both ends when the object stops at both | Does identity remain clear? |
| Mechanical travel or quantitative sweep | Deliberate linear movement | Does it accurately convey rate? |
| Anticipation | Small reverse move before a forceful action | Does it clarify rather than delay? |
| Overshoot | Cross the destination, then decay to rest | Is the amount compatible with material? |
| Emphasis | One short change, then restore the baseline | Is it competing with the main reveal? |
| Loop | Match position and velocity at the seam | Is the repeated endpoint duplicated? |

Overshoot in this package is a percent of the **travel distance**, not the destination
coordinate. For a 100-pixel travel and 5%, pass 5 pixels beyond the target. Scale
overshoot needs its own definition: 105% scale is 5 percentage points above 100%.
Never use the two interchangeably. Repeated bounce is optional, not a quality marker.

## AE easing

`keyframe.apply` supports native key values, interpolation, speed and influence.
The parameter catalog supplies zero endpoint speed and influence starting points for
stop-to-stop motion. Speed has the property's native units per second; influence is a
percentage, not a CSS control-point coordinate. AE accepts influences in 0.1–100;
avoid zero even if a broad operation description says 0–100.

CSS `cubic-bezier(x1,y1,x2,y2)` and GSAP/Remotion springs are not AE `KeyframeEase`
parameters. Match the curve by deriving velocities/handles or sampling and fitting;
label an approximation and inspect it. Spring stiffness and damping alone do not
define a portable visual result across engines. Prefer measurable arrival, overshoot
and settle times when transferring a reference.

For stationary reading holds, use equal values at arrival and hold-end. Keep position
paths straight with `spatialTangents:'linear'` when a curved path is not intended.
For an arc, use explicit spatial tangents and inspect the path. `interp:'hold'` in
`keyframe.apply` holds the outgoing segment; `keyframe.set_easing` preset `hold`
affects both sides and can unintentionally eliminate an incoming fade.

## Choreography

Use stagger to establish reading order. Calculate the last sibling's arrival as
`firstStart + (count - 1) * stagger + entrance`; its hold must still fit. Cap the
whole group reveal, not just each member's duration. Multiple objects may move
together when they are one semantic unit. Parent a shared gesture to a null where
appropriate instead of separately drifting every child.

Hold duration starts when essential information is actually readable. As an initial
estimate use `max(minimumHold, wordCount / readingWordsPerSecond)`, then check the
actual copy and audience. This is a production heuristic, not a universal reading
speed. Dense diagrams need additional exploration time beyond words alone.

At cuts, check the outgoing frame, cut frame and next frame. A transition should
preserve a subject, direction, shape or idea where continuity is intended. A hard
cut is often the clearest transition; effects are not mandatory connective tissue.
