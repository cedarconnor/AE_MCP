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

## Native boundary

After Effects 2026 is installed. The saved AE 26.2 preference has scripting
file/network access disabled. Enabling it was requested explicitly because it
is an application security setting. No native smoke result is claimed while
that decision is pending.

`scripts/smoke-live.mjs` is the bounded reproduction entry: it requires an empty
project, builds three native motion examples, verifies eight animation keys
per generated layer, changes title text by layer ID, captures six times per
composition, and saves a new demonstration AEP. It does not close or replace
an existing project. This script has not yet been native-qualified.

## Limits

- No current AE runtime, rendered frame or artist acceptance claim until live
  validation is recorded. Installed software and green mocks are insufficient.
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
