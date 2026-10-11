# Documentation verification

The documentation set covers 16 default tools, 218 default operations across
23 categories and the optional `eval.run` operation separately. Each tool has
a parameter table, exact input schema, result notes and a concrete call. Each
operation has its declared parameters/defaults, policy flags, source link and
call template. There are also 48 concrete operation examples spanning every
category, with scene prerequisites in [EXAMPLES.md](EXAMPLES.md).

## Reproduce the checks

```powershell
npm run docs:generate
npm run docs:check
```

The generator loads the actual compiled registry and validates curated inputs.
The checker compares schemas with real MCP `tools/list`, compares every
category's operations/parameters with `ae_catalog`, and compares the motion
schema resource with the checked-in schema. It also parses handbook JSON
examples, validates nested batches/specs and verifies local handbook/reference
links and anchors. These calls are offline; none dispatches work into AE.

Generated-file comparison detects missing/stale references. Checks normalize
CRLF line endings but otherwise compare content exactly. Documentation scripts
set an unrestricted policy in their own processes so a developer's read-only
or category-filtered shell does not accidentally generate an incomplete manual.

## Verified run: October 10, 2026 (America/Los_Angeles)

- `npm run check` passed: production/test typechecks, build, 469 offline tests
  across 37 suites (two platform-specific skips), MCP protocol and docs checks.
- The documentation checker passed for 11 guides, 649 local links, 107 JSON
  blocks, 86 example calls and four complete motion specs (including files).
- Actual MCP discovery matched all 16 documented input schemas and every
  default operation/parameter in all 23 catalog categories.
- Deliberately altering a generated reference made the drift check fail;
  inserting a broken guide link made the link check fail. Both files were
  restored and the full documentation check passed afterwards.
- All four documentation scripts passed scoped lint without warnings.
- Clean-install checking exposed Zod schema-output drift through the original
  semver range. Runtime dependencies are now pinned to the verified SDK 1.32.1
  and Zod 4.4.3 so this release and its reference use the same converters.
- The rebuilt archive was installed outside the checkout with lifecycle scripts
  disabled. Its own protocol check, generated-reference drift check and full
  handbook/schema/catalog check all passed, including packaged source links.

## Limits

- Every operation's declared API is documented; this is not a claim that all
  218 operations have been executed in native AE.
- Concrete calls pass tool/operation schema checks and operation code generation.
  The check does not create the example scene, verify installed fonts/effects
  or write example deliverables.
- Handwritten behavior notes were checked against handlers and helper code;
  prose is not exhaustively proven by schema comparison.
- Call templates with typed placeholders are intentionally not executable and
  are excluded from concrete-example validation.
- Local links in the current handbook/reference set are checked. Historical
  research/planning documents and external URLs are not recursively audited.
- Native evidence and visual qualification are recorded separately in
  [VALIDATION.md](VALIDATION.md). This documentation task does not rerun AE or
  convert sampled evidence into whole-animation/artist acceptance.

See [DEVELOPMENT.md](DEVELOPMENT.md) for maintaining examples and regenerated
files when an API changes.
