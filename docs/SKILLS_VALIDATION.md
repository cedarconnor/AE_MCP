# Motion design library validation

Work date: 2026-10-10 (user timezone). Initial validation covered the bundled
instruction/data package and MCP delivery. A subsequent native style lab on the
same local date built, rendered, reviewed and revised all six style demonstrations.

## Recorded checks

- Skill-creator frontmatter and scaffold validation: passed.
- In-memory MCP resource test: failed before implementation because the manifest
  resource did not exist; passed after integration. Every listed file was readable,
  the motion prompt linked the skill, and an unregistered traversal URI was rejected.
- Real stdio skill check: passed with native writes disabled and a restricted
  category policy. All 20 skill files/resources matched their packaged bytes.
- Data checks: 75 unique parameters in 11 groups, six profiles, three strict v1
  motion specs, ten schema-checked operation examples and 20 portable local links.
- Invalid parameter types, unknown parameter names and invalid enum choices were
  rejected by the checker. Mapped operation names were resolved against the current
  implementation, and example native JSX was generated without executing it.
- Full `npm run check`: passed; 38 suites, 470 passing tests and two platform skips,
  with production/test typechecks, build, protocol and generated-reference checks.
  The default MCP still exposes 16 tools and 218 operations; it now lists 22
  resources, including the 20 skill files, and one workflow prompt.
- Scoped lint for the new resource module, test and checker: passed.
- Clean npm archive install outside the checkout, with lifecycle scripts disabled:
  skill checks, real stdio discovery/resource reads and documentation checks passed.
  All 20 skill files were included in the archive.

## Behavioral review of the instructions

| Scenario | Required behavior captured in the package |
|---|---|
| Quiet editorial title | Stillness, flat color and a locked camera remain valid; no mandatory drift, bounce or grain |
| Existing artist composition | Inspect targets, preserve unrelated layers and existing animation; key replacement is explicitly scoped |
| Bold portrait metric | Reflow for portrait, use approved figures, retain units/source, and protect reading time |
| Browser animation reference | Separate design intent from engine syntax; no false direct conversion of springs, CSS or shader effects |
| Beat-synced animation at fractional fps | Compute absolute cue frames and avoid accumulated rounded-beat drift |
| Request for a style beyond v1 | Explain the supported native-operation route rather than inventing motion-spec fields |
| Schema check passes but no preview is available | Report native/frame/playback/artist evidence as pending |

This is a structured review of the written guidance, not an independent model
benchmark or proof that every future agent will follow it.

## Native style lab

All six style profiles were exercised in separate editable native compositions on
Windows/AE 26.2.1x2: 81 layers and 599 keyframes, with six final H.264 movies at
1280×720, 30 fps, eight seconds each. The six native structural audits passed.
All 1,440 final encoded frames were decoded for continuity measurements; selected
ordered entrance/exit frames and native hold captures were visually inspected.
The playful label/carrier transforms matched at all 240 frames, chart growth matched
linear timing, and the real camera's move and settled position were sampled.

The review led to fixes in the scene builder and skill guidance. See the
[native style report](STYLE_LAB_REPORT.md) for observations, exact coverage and
reproduction. This is separate evidence from the earlier three-preset smoke test.

## Remaining qualification

These six demonstrations exercise selected parameters with explicit layout/font
overrides. They do not validate all 75 parameters, every recipe, other formats,
cross-engine conversions or the three unchanged portable motion-spec example files.
Real-time playback, audio, alpha delivery, managed-color delivery and artist acceptance
remain unqualified. Numerical continuity and ordered-frame inspection do not establish
full-speed perceptual judgment or production acceptance.
