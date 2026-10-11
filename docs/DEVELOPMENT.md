# Development and documentation maintenance

[README](../README.md) · [Architecture](ARCHITECTURE.md) · [Validation](VALIDATION.md)

## Build a checkout

Use Node 24+ and npm. From the project root:

```powershell
npm ci --ignore-scripts
npm run build
npm run check
```

`--ignore-scripts` avoids dependency lifecycle scripts. Compilation produces
`dist`; native JSX helpers remain in `jsx` and must accompany it. The package
uses ESM. The `ae-uber-mcp` binary maps to `dist/index.js`.

Runtime MCP SDK and Zod versions are pinned to the tested versions. Their schema
conversion behavior affects the published API description; update them
deliberately, regenerate references and repeat clean-package verification.

## Commands

| Command | Purpose |
|---|---|
| `npm run build` | Compile TypeScript |
| `npm start` | Run the stdio MCP server |
| `npm run dev` | Watch/recompile TypeScript; does not start AE |
| `npm run clean` | Remove generated `dist` |
| `npm run typecheck` | Check production TypeScript |
| `npm run typecheck:test` | Check test TypeScript |
| `npm test` | Offline Vitest suites; excludes `tests/e2e` |
| `npm run test:watch` | Vitest watch mode; select suites deliberately |
| `npm run lint` | Oxlint diagnostics |
| `npm run lint:fix` | Apply supported lint fixes; changes files |
| `npm run lint:jsx` | Check generated JSX compatibility rules |
| `npm run check:protocol` | Real stdio handshake, discovery, resources/prompt and offline plan |
| `npm run skills:check` | Portable skill data, examples, operation mappings, links and real stdio resource delivery; no native AE writes |
| `npm run docs:generate` | Build and regenerate source-derived Markdown/JSON references |
| `npm run docs:tools` | Compatibility alias for complete reference generation |
| `npm run docs:check` | Build, detect stale generated files, check guide examples/links and compare MCP schemas |
| `npm run check` | Typechecks, build, offline tests, protocol, documentation and skill-library verification |
| `npm run smoke:live` | Bounded native demo; requires an empty AE project |
| `npm run test:live` | Inherited native integration suites; can replace projects/interrupt AE |
| `npm pack` | Create a local distribution archive using existing built output |

Offline checks do not establish native visual quality. The inherited live suites
are not safe to run indiscriminately against artist work. The bounded smoke
refuses a nonempty project, builds the three presets, revises native text,
captures samples and saves an AEP. Keep artist work saved elsewhere before
intentionally preparing a scratch project for native testing.

## Reference generation

[generate-reference-docs.mjs](../scripts/generate-reference-docs.mjs) loads the
compiled tool registry and operation declarations, not an independently
maintained list. It normalizes policy variables in its own process to generate
the canonical unrestricted catalog and documents optional eval separately.

It produces:

- [TOOLS.md](TOOLS.md): every tool's description, policy hints, parameters,
  result notes, example and exact MCP input schema.
- [OPERATIONS.md](OPERATIONS.md): all default operations by category, parameter
  metadata/defaults, source pointers and call templates, plus optional eval.
- [tools.json](reference/tools.json) and [operations.json](reference/operations.json):
  machine-readable reference data.
- [motion-spec.schema.json](reference/motion-spec.schema.json): strict field
  schema; timing sums/uniqueness remain code-level refinements.

Edit [doc-examples.mjs](../scripts/doc-examples.mjs) for curated examples, result
notes and handler caveats. Edit operation/tool implementation metadata when its
declaration is wrong. Then run `npm run docs:generate`; do not hand-edit generated
reference files. Manual guides remain separate so they can explain context and
limitations without being overwritten by regeneration.

`docs:check` compares generated output to files byte-for-byte after CRLF
normalization. It validates all curated example parameters, nested batch
children and strict motion specs, and calls operation code generators without
executing JSX. The guide checker parses runnable JSON fences, verifies local
links/anchors, and starts a real MCP server to compare documented schemas and
the catalog against actual discovery. No native tool call is submitted.

Schema/code-generation validity is not proof a scene exists, an effect is
installed or an output is visually correct. Examples with IDs and paths still
require their documented substitutions. The check deliberately distinguishes
typed templates from concrete examples.

## Adding features

For a new operation, add a declaration under `src/operations` and register its
module in the operation index. Declare parameters, category, read-only and
application-configuration behavior accurately. Generate ES3-compatible JSX;
use the existing escaping/selector helpers instead of concatenating untrusted
values into native source. Validate extra native constraints explicitly.

For a tool, define its schema/handler under `src/tools`, add it to `ALL_TOOLS`
and declare its policy effect. Shared instance routing is applied centrally.
Add a concrete documentation example and result notes. Choose tests that cover
meaningful validation, policy, native generation and failure/partial-result
behavior. New registry metadata must regenerate the docs; stale checked-in
references fail the combined check.

Preserve unknown-outcome behavior. Never make a timeout automatically replay a
mutation, steal old locks or discard recovery evidence. Native application
failure must remain an MCP error with useful partial results.

## Packaging

```powershell
npm run check
npm pack
```

`npm pack` packages existing `dist`; build/check first. The package includes
native JSX, fixtures, examples, documentation, source used by reference links,
the portable motion-design skill, validation/helper scripts and notices. Source-checkout development commands
still require development dependencies, tests and TypeScript configuration.
Installing the archive as a dependency does not provide a full contributor
checkout.

For a clean installed-package check, install the local archive in a temporary
folder and run its included protocol checker:

```powershell
npm install --ignore-scripts C:/path/to/after-effects-uber-mcp-0.1.0.tgz
node node_modules/after-effects-uber-mcp/scripts/check-protocol.mjs
```

Do not claim npm publication or remote delivery just because a local archive
exists. Retain [LICENSE](../LICENSE) and
[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). The
[upstream review](UPSTREAM_REVIEW.md) records adoption and exclusions; upstream
feature claims do not substitute for this derivative's tests.
