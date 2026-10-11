# Sound and rhythm

Sound is optional. The MCP does not synthesize music, transcribe speech, detect
beats or master a soundtrack. External analysis or approved media can supply
timings; this skill turns them into a documented visual timing plan.

For steady tempo `bpm`, beat `n` is at `offsetSeconds + n * 60 / bpm`. Compute each
beat's absolute frame as `round(time * fps)`. At 120 BPM and 30 fps, beats are 15
frames apart. At 123 BPM, do not repeatedly add a rounded 15-frame interval: the
drift becomes visible. Real recordings may change tempo; use measured cue times.

A reveal may begin before the accent so that its arrival lands on it. Distinguish
sound start, transient peak, visual start and visual impact. A whoosh file's first
sample is not necessarily its perceptual peak. Annotate approved cues with
`marker.add_comp`; markers alone do not create audio.

For narration, map the graphic to the meaningful word or phrase and protect the
readable hold. Do not force every cut to the beat if it damages comprehension.
For a showreel, vary phrase lengths and reserve the strongest movement for a few
accents. Constant maximum energy erases contrast.

Use `footage.import` and `layer.create_footage` for supplied audio after inspecting
the intended project and asset. Layer timing and inspected audio properties can
align it, but playback and mix verification are separate tasks. Record licenses and
the user's supplied files; no external service or paid generation is implied.

Listen to the encoded delivery when possible. Check intelligibility, cue timing,
clipping and the intended destination's mix specification. No fixed LUFS number is
a universal master target. A frame contact sheet proves nothing about audibility.
