# Six-style native After Effects review

Work date: 2026-10-10, America/Los_Angeles. Host: Windows, After Effects **26.2.1x2**.
The current project was empty at preflight. No existing artist project was replaced.
All artwork was created through the MCP's normal operations, without raw JSX or
external footage. The output contains editable text, shapes, solids and a native camera.

## Delivered study

Six eight-second compositions at 1280×720, 30 fps; **81 layers, 599 keyframes**.
The final native render queue completed all six H.264 outputs. Each movie decodes to
240 frames, for 1,440 final frames in total. The project uses the existing 16-bit,
untagged working-space configuration; this review does not qualify managed color.

| Profile | Native behavior exercised | Layers / keys | Visual assessment of reviewed frames |
|---|---|---|---|
| Editorial calm | Modest slide/fade, staggered lines, fine rule, stationary hold | 10 / 68 | Clear left hierarchy, breathing room and restrained accent; support copy arrives after the headline |
| Product precise | Rounded panel, offset shadow, linear progress, delayed status cue | 17 / 122 | Panel is readable; shadow is subordinate; READY now follows completed progress |
| Kinetic bold | Large heavy type, short stagger, long travel, 120° motion blur | 10 / 68 | Strong three-line hierarchy; fast arrivals remain separated and the departure is cleaner |
| Playful tactile | Visible anticipation, 6% travel overshoot, scale/rotation settle | 11 / 128 | Reverse gesture is visible; label stays centered in its moving base; hold is stable |
| Technical data | Shared bar scale, linear growth, stable units and final labels | 22 / 150 | Three values remain comparable; no bar overshoot; illustrative data is clearly identified |
| Cinematic spatial | Native 3D planes, 1800 px camera zoom, restrained camera move and hold | 11 / 63 | Revised projected outlines are distinct; centered typography stays readable |

This is an agent critique of the specified evidence, not artist acceptance. These
are deliberate landscape studies, not automatic renderings of all catalog defaults.
Each resolves the shipped palette/timing/motion profile, then uses role-specific Arial
fonts, bespoke pixel layouts, copy and sizes. The builder records the resolved token
catalog and actual native operation arguments separately. In the spatial study the
camera moves from `[655,360,-1800]` to `[640,360,-1755]`, arriving at 3.5 seconds.
All examples have opaque stationary grounds and deliberate ground-only opening/tail
frames. No sound, glow, grain, shake or third-party effects were added.

## Findings and corrections

| Observation in the first render | Correction | Recheck |
|---|---|---|
| Product hold at 3 s: pale displaced silhouette reads as a second card | Black 12% hard shadow; shadow position now follows the panel | Final native hold and rendered entrance inspected |
| Playful frames 8–21: anticipation occurs while opacity is low | Four-frame reveal finishes before anticipation starts | Ordered rendered entrance frames show the reverse gesture visibly |
| Playful frames 26–36: HELLO label arrives after its base and slips along its lower edge | Match label and base position, scale, rotation and opacity timelines | Native values equal at all 240 frames; recaptured entrance/exit inspected |
| Spatial hold at 3 s: projected portal borders bunch together | Redesign native rectangle sizes to 1120×570, 850×420 and 620×260 while retaining distinct depths | Native and encoded hold show three separated outlines |
| Departures reuse strong arrival deceleration and lose visibility early | Exit-side influence 70%, incoming influence 25%, zero endpoint speed | Ordered exit frames reviewed for all six movies; change peaks move later in the exit |
| Product at 1.5 s: READY and completion copy precede the completed fill | Use “Stay in sync.” and reveal the READY badge at frame 72, after fill finishes at frame 70 | Native samples and captures at 2.3, 2.4, 2.7 and 3 s confirm ordering |

The written skill now explains anticipation visibility, attached-label choreography,
departure easing, state-cue timing, shadow color and post-projection spacing. The
server operation surface itself needed no change for these demonstrations.

## Evidence and limits

- All six final `ae_motion_audit` results: `checks_passed`, zero reported issues.
  That audit checks bounded structural facts, not pixel quality.
- Final movies were fully decoded. Per-frame RGB difference measurements were
  calculated at 640×360; ordered entrance samples every three frames through frame
  54 and exit samples every two frames from 210–238 were inspected visually.
- Native 1280×720 captures include starts, intermediate entrances, holds, exits and
  frame 239. The product state correction has an additional event-specific review.
- Playful label and base: identical sampled Position, Scale, Rotation and Opacity
  across all 240 frame times. Chart X scale matched its clamped linear schedule
  to less than 0.001 percentage point across 45 times for each of three bars.
- Camera position and zoom were sampled at seven times, including arrival and hold.
- Real-time playback was not watched through a continuous video-viewing tool.
  The animation critique uses ordered rendered frames and native temporal samples.
  Audio, alpha, other aspect ratios/fps/fonts, color-managed delivery, all 75
  parameters and artist acceptance remain separate qualification work.
- The original three portable v1 `.motion.json` examples were not changed or newly
  qualified by this study; the six native studies live in the reproducible builder.

Local evidence folder: `artifacts/styles-2026-10-11T06-39-08-230Z`.
It contains `Six-Styles.aep`, `plans.json`, `final-plans.json`, request/response logs,
before/after movies, hash-bound native review manifests, numerical checks and the
review gallery. Media is deliberately excluded from Git by the artifact rule.
The compact [evidence summary](validation/style-lab-2026-10-10.json) retains output
hashes and measurements in the repository.

## Reproduce

See [the style-lab instructions](SKILLS.md#verification-and-maintenance). The
checked-in [builder](../scripts/render-style-lab.mjs) validates operation arguments
against the built registry before execution. Without `--execute` it writes plans
only. With `--execute` it refuses a populated project, verifies fonts, builds and
audits the six scenes, captures native frames, saves the AEP and renders the movies.
New renders still require visual review; successful execution never claims acceptance.

Repository verification after the changes: `npm run check` passed (38 suites,
470 tests passed, two platform skips); protocol, generated references, 15 documentation
guides and skill-resource checks passed. The builder's dry run validated all generated
operation arguments and JSX against the current registry. Package inspection confirms
the builder, report and compact evidence summary are included; generated media stays local.
