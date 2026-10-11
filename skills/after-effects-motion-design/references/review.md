# Review

## Evidence before praise

Inspect actual captured AE images. A spec, code listing, generated HTML mockup or
successful tool response is not a frame from the final composition. Use
`ae_motion_audit` for bounded structural facts and `ae_motion_review` for images and
hash-bound manifests. The two answer different questions.

Choose frames from events, not only an evenly spaced grid: initial frame, mid-arrival,
arrival, overshoot extremum, settled reading hold, exit midpoint, transition boundary
and last visible frame. Include one frame before/after risky boundaries. Use multiple
review calls when needed; each accepts 2–16 times strictly below comp duration.
The last frame index is `ceil(duration * fps) - 1` (time must remain below duration).

| Dimension | What to inspect | Typical correction |
|---|---|---|
| Hierarchy | First-read message and competing focal points | Lower support contrast or delay its entrance |
| Typography | Actual font, wrapping, spacing, glyphs at output size | Fix line breaks, leading or layout before shrinking |
| Composition | Safe area, alignment, intended overlap, motion extremes | Reflow and measure transformed bounds |
| Motion | Speed changes, overshoot, spatial kinks, settle | Adjust a named key or duration, then replay |
| Rhythm | Reading time, group reveal length, dead or crowded beats | Change holds and stagger as a group |
| Continuity | Unwanted blanks, abrupt visibility changes, cut seams | Inspect adjacent frames and trim/extend deliberately |
| Finish | Blur, glow, aliasing, texture, color consistency | Reduce treatment or verify output transform |
| Editability | Native text/shapes, meaningful names, sparse keys, controls | Replace unnecessary rasterization or baked keys |
| Delivery | Correct format, duration, audio and alpha behavior | Verify the actual exported file separately |

Record each finding as `{timeOrFrame, element, observation, proposedChange,
evidencePath, status}`. Status is `pass`, `revise` or `uncertain`; a score is not a
substitute for the observation. Do not call a visual fix verified before recapture.

Revise the largest visible problem first. After a bounded pass, report what improved
and what remains. When missing fonts, effect failures or capture limitations prevent
aesthetic judgment, fix or disclose that obstacle rather than adjusting unrelated style.

## Qualification levels

- **Schema checked:** data and operation examples fit the current code.
- **Native checked:** operations ran on the stated AE version and their results were inspected.
- **Frame reviewed:** named images were inspected at specified times and resolution.
- **Playback reviewed:** an actual rendered sequence was watched; audio separately listened to.
- **Artist accepted:** the user accepted the piece. Neither the agent nor an audit supplies this.

Do not promote one level into another. The server's RGB captures do not qualify final
alpha or high-bit-depth color. Source spec hashes identify the original spec, not
manual edits made afterward; save an edit record with IDs and parameter changes.

The shipped examples are schema-checked starting points. They have not been rendered
or artist-approved as part of the skill-library research.
