# Direction

Make the visual choices explainable before making them elaborate. Capture the
audience, one message, output format, approved copy, asset sources and references.
For an existing piece, retain its visual language unless redesign was requested.

Choose a profile as a starting point, then override it from the brief:

| Profile | Useful for | Main behavior | Avoid |
|---|---|---|---|
| editorial-calm | Titles, interviews, considered storytelling | Spacious type, stable holds, small travel | Empty atmospheric drift |
| product-precise | Product explanation, UI demonstrations | Clear hierarchy, short stagger, purposeful alignment | Fake UI or unsupported product claims |
| kinetic-bold | Campaign headlines, announcements | Large type, short punchy moves, strong contrast | Sacrificing reading time for speed |
| playful-tactile | Friendly explainers, illustrated brands | Small anticipation and damped overshoot | Every object bouncing identically |
| technical-data | Charts, metrics, diagrams | Stable axes and units, direct quantitative movement | Easing that misrepresents data |
| cinematic-spatial | Spacious product/brand scenes | Slow hierarchy, restrained depth and camera | Defocus or motion obscuring copy |

The values live in [profiles.json](profiles.json). A profile is a design proposal,
not a preset compiled by the MCP. No profile supplies licensed fonts, logos, music,
generated assets or finished animation. When directions are genuinely unresolved,
compare two materially different hold frames, then develop the chosen one.

Use explicit roles: **hero** carries the message; **support** explains it;
**context** supplies setting or data; **decoration** must earn its visual cost.
Choose a limited vocabulary of moves across a sequence. Repetition can establish
identity; variation should signal a change of thought rather than random novelty.

The brief's `parameters` are overrides against catalog defaults. Store the chosen
profile, overrides and why they changed. Record the final resolved values for a
handoff that must survive profile updates. Do not merge this object into a v1
motion spec: that schema is strict and has a different purpose.

For longer films, make a beat sheet: frame range, message, focal object, action,
settle, hold, transition, audio event. Keep shot-local time and composition time
explicit. A new aspect ratio requires reflow and renewed text measurement, not
just a uniformly scaled master.
