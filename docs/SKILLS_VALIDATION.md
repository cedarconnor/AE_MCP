# Motion design library validation

Work date: 2026-10-10 (user timezone). Validation concerns the bundled instruction
and data package plus its MCP delivery, not a newly rendered motion-design reel.

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

## Remaining qualification

No new native AE build, full playback, audio mix, alpha delivery or artist acceptance
test was run for these profiles and recipes. The new examples remain schema-checked
starting structures. Previous MCP native smoke results do not qualify this library's
aesthetic choices, custom operations, camera recipes or cross-engine conversions.
