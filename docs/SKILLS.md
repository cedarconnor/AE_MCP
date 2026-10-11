# Motion design skill library

The bundled [After Effects motion-design skill](../skills/after-effects-motion-design/SKILL.md)
adds creative direction and practical animation guidance to the existing MCP. It is
original synthesis from a [41-repository survey](research/MOTION_SKILLS_REVIEW.md),
with pinned source evidence and explicit compatibility decisions.

## What is included

- **75 design parameters in 11 groups:** layout, typography, color, timing, motion,
  choreography, shapes, depth, finish, rhythm and review.
- **Six adjustable style profiles:** editorial-calm, product-precise, kinetic-bold,
  playful-tactile, technical-data and cinematic-spatial.
- Focused references for direction, aesthetics, animation, recipes, depth/finish,
  sound/rhythm, AE mapping and visual review.
- Three v1 motion-spec examples: editorial title, product lower third and portrait
  data card; a design-brief sidecar and nine standalone native-edit examples, plus
  a custom-easing call in the mapping reference.
- A machine-readable parameter catalog, profile overrides and portable file manifest.

The [parameter reference](../skills/after-effects-motion-design/references/parameters.md)
states units, suggested bands and implementation routes. These are design inputs for
an agent, **not 75 new fields accepted by `ae_motion_build`**. The current tools and
218 default operations are unchanged. V1 still uses its fixed slide/fade compiler;
advanced animation uses supported native operations after inspection.

## Read it through MCP

Restart the server connection after updating/building. MCP resource discovery includes:

| URI | Purpose |
|---|---|
| `ae-uber://skills/after-effects-motion-design/manifest.json` | Exact list of packaged files |
| `ae-uber://skills/after-effects-motion-design/SKILL.md` | Entry point and reference routing |
| `ae-uber://skills/after-effects-motion-design/references/parameters.json` | Parameter catalog |
| `ae-uber://skills/after-effects-motion-design/references/profiles.json` | Style overrides |

Every manifest file has its own resource URI under the same prefix. These reads are
offline and work in read-only mode. The existing `motion-graphics` prompt points to
the skill. Resources are guidance for the client; the server does not automatically
apply a profile or read every reference on each tool call.

Some MCP clients do not surface resources to their agent. In that case, install the
portable folder below or give the agent its local `SKILL.md` path. Merely connecting
an MCP server does not guarantee a client will load or discover local agent skills.

## Install the portable skill

Copy the complete `skills/after-effects-motion-design` folder into the skill location
your client uses. For Codex project-local use, `.agents/skills` is a discovery path;
for Claude Code, use `.claude/skills`. The [Codex skill documentation](https://developers.openai.com/codex/skills/)
describes project-local discovery. Keep the references, examples, manifest and
agent metadata with `SKILL.md`; it does not depend on files outside its folder.

Example from the repository root, using a PowerShell project-local Codex install:

```powershell
$skillDestination = Join-Path (Get-Location) '.agents/skills/after-effects-motion-design'
if (Test-Path -LiteralPath $skillDestination) { throw 'Skill already exists; compare before replacing it.' }
New-Item -ItemType Directory -Force -Path (Split-Path $skillDestination) | Out-Null
Copy-Item -LiteralPath './skills/after-effects-motion-design' -Destination $skillDestination -Recurse
```

For an installed npm archive, the source folder is under
`node_modules/after-effects-uber-mcp/skills/after-effects-motion-design`. No installer
runs automatically, no global agent settings are changed, and no alternate render
engine is required. Reload skill discovery in the client after copying.

Example request after installation:

> Use $after-effects-motion-design to create an editable 6-second editorial title.
> Use my brand colors, keep the camera still, make the text readable on a phone,
> and inspect entrance, hold and exit frames before delivering the AEP.

## Using a profile

Resolve catalog defaults, then profile overrides, then the user's values. Keep the
resolved design brief alongside the valid motion spec and native edit notes. Convert
frame tokens at their stated reference fps, normalized distances to pixels and sRGB
hex swatches to AE input values. This numeric conversion does not manage color space.

For example, `motion.travel:0.035` at 1080 pixels high means 37.8 pixels of travel;
it must become native Position keyframes because v1 has no travel field. A 6%
overshoot means 6% of that travel distance, not 6% of the destination coordinate.

The examples are editable starting structures, not finished visual presets. Check
fonts, actual text bounds and composition. Viewer background colors are not opaque
rendered backgrounds; create a native solid when opaque delivery is intended.

## Verification and maintenance

```powershell
npm run skills:check
npm run check
```

The skill check validates parameter values, profile keys, mapped operation names,
operation example schemas, motion specs, portable links, file coverage and exact
contents served over real stdio MCP. It also verifies resource access with native
writes withheld. These checks do not run After Effects or prove aesthetic quality.

When adding a reference, update the portable manifest and keep it linked from the
skill or another reference. Keep parameter JSON and its human reference aligned.
When changing native behavior, update the AE mapping and relevant recipes, and verify
the behavior in the target AE version before claiming native qualification.

Separate native demonstrations of all six profiles have been rendered and frame-reviewed
in AE 26.2.1 on Windows. See [validation](SKILLS_VALIDATION.md) and the
[native style test report](STYLE_LAB_REPORT.md) for findings, fixes and coverage limits.
The three portable v1 example files remain starting structures, not these finished scenes.

To reproduce the six native demonstrations, build the server and generate the operation
plans without contacting AE:

```powershell
npm run build
node scripts/render-style-lab.mjs
```

For an actual build and render, preserve your work and open an empty AE project, then run:

```powershell
node scripts/render-style-lab.mjs --execute
```

The script refuses populated projects, verifies required Arial PostScript fonts, builds
native scenes through the normal MCP operation surface, captures review frames, saves
an editable AEP, and renders six eight-second H.264 movies. It requires the host's
`H.264 - Match Render Settings - 15 Mbps` output template. It writes unique
`artifacts/styles-<timestamp>` folders containing plans, call evidence, reviews and output.
It never declares aesthetic approval automatically. A failed or timed-out run may have
partially modified the project: inspect its retained evidence and reconcile the request
before continuing; do not blindly rerun it.
