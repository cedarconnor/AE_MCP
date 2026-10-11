# Validation record

Build date: 2026-10-10 (user's America/Los_Angeles date).

## Verified results

- All thirteen requested source repositories inspected at pinned commits; see
  [UPSTREAM_REVIEW.md](UPSTREAM_REVIEW.md) and the detailed source reports.
- Node.js v24.6.0 on Windows. TypeScript source/test typechecks and build passed.
- Actual MCP stdio initialization and calls passed: 16 tools, 218 operations,
  two resources, one prompt. Offline plan generation and JSON schema retrieval
  were exercised through the SDK client.
- Motion compiler/spec tests exercise strict input validation, hostile strings,
  generated ES3 against a simulated host, native-editable object intent,
  source-rect warnings and partial-result identity. They do not replace AE tests.
- QA review found and fixed named Transform-group traversal and disabled
  expression-error detection. Both regressions were observed failing, then passing.
- Project preservation tests cover dirty/saved/untitled projects, explicit
  discard/save, save failures, and absent target files before side effects.
- Transport tests exercise claim failure, retained results, late recovery,
  shared uncertain-outcome gates and symlink/junction output aliases.

- `npm run check` passed: both TypeScript checks, build, **469 passing tests**
  across 37 files, and the actual stdio protocol check. Two POSIX
  world-writable-directory checks are explicitly skipped on Windows.
- `npm run lint` passed with 16 non-blocking warnings. Host ExtendScript is
  covered separately by the eight ES3/code-generation lint tests in the suite;
  it is not parsed as browser JSX by oxlint.
- `npm audit` reported **zero vulnerabilities**, including development
  dependencies. The MCP SDK minimum is now 1.32.1. Vulnerable inherited
  transitive versions were updated; Vitest is 4.1.11 and oxfmt is 0.72.0.
- The packaged `.tgz` was installed with lifecycle scripts disabled in a fresh
  directory outside the checkout. Its own included protocol client successfully
  exercised the installed server: 16 tools, 218 operations, two resources and
  one prompt. That clean installation also reported zero audit vulnerabilities.
- Independent final source review found two remaining defects: lost request
  metadata after transport finalization failure and swallowed secondary
  calibration failures. Both were fixed with failing-then-passing regressions;
  the scoped re-review reported both resolved.

Recorded outputs: [offline checks](validation/offline-check.txt),
[lint](validation/lint.txt), [dependency audit](validation/dependency-audit.json),
and [packed protocol check](validation/packed-protocol.json).

The installed npm 11.5.1 encountered an internal optional-peer resolver error
while updating development tools. A one-off npm 11.21.0 invocation completed
that update; no global npm installation was changed. The locked tree and packed
runtime then passed the checks above.

## Native AE result

The user approved enabling scripting file/network access and running the live
test. The setting was enabled in the saved AE 26.2 preferences while AE was
closed, after a native guard verified an empty, unchanged, untitled project
with an empty render queue. The original preference file is backed up under
`artifacts/native-setup/`. AE was reopened and its own scripting API verified
the setting is 1. It remains enabled as requested.

`npm run smoke:live` passed against **AE 26.2.1x2 on Windows**, using the real
MCP stdio server and AfterFX file bridge. It started from an empty project:

| Preset | Native layers | Native keyframes | Captured frames | Audit |
|---|---:|---:|---:|---|
| Title card | 3 | 24 | 6 | checks_passed |
| Lower third | 3 | 24 | 6 | checks_passed |
| Statistic card | 4 | 32 | 6 | checks_passed |

All compositions are 1280 x 720, 30 fps, six seconds long. Samples were captured
at 0.1, 0.45, 1.3, 3.0, 5.6 and 5.95 seconds. Build warnings were empty. The title
was revised to `IDEAS. IN MOTION.` through its native layer ID and read back.
The run saved `artifacts/live-2026-10-11T03-42-33-572Z/` containing the editable
`Uber-MCP-Motion-Demo.aep` (320,388 bytes), specs, 18 PNGs, three contact sheets,
hash-bound review manifests and complete call evidence. Run timestamps are UTC;
the local test date is October 10, 2026.

The first live build revealed that AE layer Position requires three-component
spatial tangents even on a 2D layer. The compiler now derives tangent length
from the native property value; the host double reproduces this requirement.
The regression failed before the fix and passed afterward. That partial build
was saved separately before starting a fresh empty project; it was not silently
discarded. The successful run used the corrected compiler.

All three six-frame contact sheets were visually inspected: sampled layout,
title revision, entrance/hold/exit opacity and position changes are visible,
with no obvious text clipping. This is assistant inspection of sampled frames,
not continuous playback or artist acceptance. The capture used working space
`None`, 16-bit native data converted to 8-bit sRGB-tagged PNG with values unchanged.

Evidence: [native call record](validation/native-evidence.json),
[title contact sheet](validation/title-card-sheet.png),
[lower-third contact sheet](validation/lower-third-sheet.png),
[statistic contact sheet](validation/statistic-card-sheet.png).
The AEP and full-resolution frames remain in the local artifacts directory and
are not included in the npm package.

## Limits

- Native runtime and sampled-frame checks passed for this bounded smoke;
  artist acceptance remains pending.
- Mac, multiple AE instances, third-party effects, RTL shaping, full-animation
  playback, color-critical/HDR/alpha export and universal AEP round-trip fidelity
  are not qualified by this build.
- Inherited operation breadth is larger than the targeted motion smoke.
- Review manifests describe sampled captures and source-spec provenance, not
  full current-project hashes or automatic aesthetic approval.
- Request history is retained without automatic cleanup. Lost results/crashed
  hosts can require careful manual reconciliation; there is no timed force-unlock.
- Mailbox containment checks do not prevent hostile concurrent link swapping.
  Local mailbox write access is full AE scripting authority.
