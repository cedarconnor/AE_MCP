# Examples and recipes

[README](../README.md) · [Tools](TOOLS.md) · [Operations](OPERATIONS.md)

JSON blocks with `name` and `arguments` are MCP `tools/call` payloads. Send them
through an MCP client; do not paste them into PowerShell or AE's script editor.
Run dependent steps sequentially and inspect each result. The documentation
check validates inputs and generates JSX without executing it in AE.

The [tool reference](TOOLS.md) contains one concrete call per tool. The
[operation reference](OPERATIONS.md) contains 48 concrete examples covering all
23 categories and a parameterized template for every operation. Templates are
marked as text and contain typed placeholders; they are not executable JSON
examples. The recipes below explain the scene prerequisites and ordering.

## First connection and discovery

Open the intended project and start the MCP connection as described in
[setup](SETUP.md). Then:

```json
{"name":"ae_context","arguments":{}}
```

```json
{"name":"ae_catalog","arguments":{}}
```

```json
{"name":"ae_catalog","arguments":{"category":"text"}}
```

The first call reaches AE. The catalog calls work offline and reflect the
server's current policy. Inspect the target/project before any mutation.

## Build, revise and review a motion graphic

Plan a title card:

```json
{
  "name":"ae_motion_plan",
  "arguments":{
    "template":"title-card",
    "title":"Ideas in motion",
    "subtitle":"Native editable layers",
    "width":1280,"height":720,"duration":6,"fps":30
  }
}
```

Save and review the returned `structuredContent.spec`. Pass that object as
`spec` to `ae_motion_build`. A complete build payload is in
[the tool reference](TOOLS.md#ae_motion_build), and the custom spec fields are
explained in [MOTION_SPEC.md](MOTION_SPEC.md). Each build creates a new comp.

Record `result.compId` and `result.layers`. For illustration only, if the new
comp ID is 13 and its title layer ID is 25, revise the text with:

```json
{"name":"ae_do","arguments":{"operation":"text.set_content","args":{"comp":13,"layer":{"id":25},"text":"Built for motion"}}}
```

Substitute your actual IDs before sending. Audit and capture the revised comp:

```json
{"name":"ae_motion_audit","arguments":{"compId":13}}
```

```json
{"name":"ae_motion_review","arguments":{"compId":13,"times":[0.1,0.45,1.3,3,5.6,5.95],"directory":"C:/AE-output/reviews","notes":"Check entrance, hold and exit after the title revision."}}
```

Open the returned images and manifest. Check the title fit, alignment, timing
and color warnings; a technical pass does not approve the appearance. Save to
a new AEP after creating its parent directory:

```powershell
New-Item -ItemType Directory -Path 'C:/AE-output' -Force
```

```json
{"name":"ae_save_project","arguments":{"path":"C:/AE-output/Motion-Example.aep"}}
```

An existing target file can be overwritten. Save As changes the active project
path. The file is not undone by undoing native layer edits.

## Prepare the manual-operation example scene

The reference's independent editing examples assume a six-second comp named
Main, a Title text layer, a Panel shape layer and a Controller null. Create
these only once in a scratch project; duplicate names make later name-based
lookup ambiguous. This batch constructs that scene and a filled panel:

```json
{
  "name":"ae_do",
  "arguments":{
    "operation":"batch.run",
    "args":{
      "stopOnError":true,
      "ops":[
        {"operation":"comp.create","args":{"name":"Main","width":1280,"height":720,"fps":30,"duration":6}},
        {"operation":"layer.create_shape","args":{"comp":"Main","name":"Panel"}},
        {"operation":"shape.add_group","args":{"comp":"Main","layer":"Panel","name":"Card"}},
        {"operation":"shape.add_rect","args":{"comp":"Main","layer":"Panel","groupIndex":1,"size":[1000,400],"roundness":24}},
        {"operation":"shape.add_fill","args":{"comp":"Main","layer":"Panel","groupIndex":1,"color":[0.055,0.08,0.14,1]}},
        {"operation":"transform.set","args":{"comp":"Main","layer":"Panel","position":[640,360]}},
        {"operation":"layer.create_text","args":{"comp":"Main","name":"Title","text":"Ideas in motion"}},
        {"operation":"text.set_style","args":{"comp":"Main","layer":"Title","font":"ArialMT","fontSize":54,"fillColor":[1,1,1],"justification":"center"}},
        {"operation":"transform.set","args":{"comp":"Main","layer":"Title","position":[640,360]}},
        {"operation":"layer.create_null","args":{"comp":"Main","name":"Controller"}}
      ]
    }
  }
}
```

Unlike the motion compiler's visual-center placement, raw transform positioning
uses the layer's anchor. Measure text and adjust its anchor/position if needed.
Inspect `ae_layer_info` or `layer.info` for returned IDs and group/property
structure. The batch has one native undo group; successful earlier children
remain if a later child fails. `stopOnError:true` stops subsequent execution,
not rollback. Node-side instance operations and ungrouped project/undo commands
must be separate calls.

## Keyframes and expressions

Animate the Title layer's opacity using its native matchName path:

```json
{"name":"ae_do","arguments":{"operation":"keyframe.apply","args":{"comp":"Main","layer":"Title","property":["ADBE Transform Group","ADBE Opacity"],"keys":[{"time":0,"value":0,"interp":"ease"},{"time":1,"value":100,"interp":"ease"},{"time":5,"value":100,"interp":"ease"},{"time":6,"value":0,"interp":"ease"}],"replace":false}}}
```

The last key sits at the duration boundary; capture before time 6. Existing
keys are retained because `replace` is false. Use replacement only when you
intend to remove that property's existing animation. Position uses vectors;
opacity uses a scalar. Property dimensions and separated position dimensions
must match the native property being edited.

Add a small rotation expression:

```json
{"name":"ae_do","arguments":{"operation":"expression.set","args":{"comp":"Main","layer":"Title","property":["ADBE Transform Group","ADBE Rotation"],"expression":"Math.sin(time * 2) * 5"}}}
```

Use audit/property inspection to check expression errors and native sampling to
check evaluated values. `comp.sample` samples properties, not rendered images.
Use `ae_render_frame` for pixels.

## Effects, masks and shapes

Discover effects with `project.list_effects` before using a matchName. For the
built-in Gaussian Blur example:

```json
{"name":"ae_do","arguments":{"operation":"effect.add","args":{"comp":"Main","layer":"Title","matchName":"ADBE Gaussian Blur 2","name":"Softness"}}}
```

```json
{"name":"ae_do","arguments":{"operation":"effect.list_on_layer","args":{"comp":"Main","layer":"Title"}}}
```

The reference's `effect.set_property` example uses effect index 1 and property
index 1. Inspect the effect tree before applying it; it is valid for the
intended blur property only if that effect occupies that position. Native
effect names, matchNames and parameter layouts are not interchangeable.

Shape examples assume the Card group is at `groupIndex:1`. Shape fills use
RGBA in that operation, while the motion spec and text fill colors use RGB.
The rectangular mask example uses Panel-local coordinates around `[0,0]`.
Masks, shape paths and layer transforms use their own coordinate spaces.

## Frames and contact sheets

```json
{"name":"ae_render_frame","arguments":{"compNameOrId":"Main","times":[0.1,1.3,3,5.6],"outPath":"C:/AE-output/review/frame.png","contactSheet":{"columns":2,"thumbWidth":480},"analyze":true}}
```

For multiple times, the stem produces `frame_0.png`, `frame_1.png`, etc., plus
`frame_sheet.png`. Supply either `time` or `times`, never both. This tool returns
paths and capture metadata; `ae_motion_review` also provides a durable manifest
and can append an inline image. Review the actual returned times and warnings.
Thumbnails do not upscale beyond the captured frame size.

Automatic color handling is intended to produce displayable output, but it is
not a universal color/alpha guarantee. In write mode it may create/remove
temporary objects, affecting project dirty state and undo history. Read-only
capture disables those probes. See [capture troubleshooting](TROUBLESHOOTING.md#capture-and-color).

## Render queue and delivery

Use `render.list_templates`, `render.status` and the render catalog to inspect
available render settings/output modules and existing queue entries. Add Main
with `render.add_to_queue`, then configure the returned queue item as needed.
The reference's `C:/AE-output/Main.mov` is an example output path; its extension
does not select a codec or guarantee a compatible output module.

`render.start` renders the configured queue, including other enabled jobs.
Review the queue first. A long render can outlast both native and client
timeouts; reconcile its request before trying again. Final movie output needs
its own playback, color and transparency checks.

For an editable MOGRT, set the comp's Essential Graphics name, add a supported
property and inspect controllers:

```json
{"name":"ae_do","arguments":{"operation":"egp.set_name","args":{"comp":"Main","name":"Motion Title"}}}
```

```json
{"name":"ae_do","arguments":{"operation":"egp.add_property","args":{"comp":"Main","layer":"Title","property":["ADBE Text Properties","ADBE Text Document"],"controllerName":"Headline"}}}
```

```json
{"name":"ae_do","arguments":{"operation":"egp.list_controllers","args":{"comp":"Main"}}}
```

Save the AEP after these changes, then use `egp.export_mogrt` with an output
**directory**, such as `C:/AE-output/templates`, and `overwrite:false`. An
unsaved/dirty project can trigger native save prompts. The receiving application
still needs compatible fonts/assets and its own usability test.

## Structural JSON export and import

```json
{"name":"ae_project_export_json","arguments":{"outPath":"C:/AE-output/project.json","pretty":true}}
```

```json
{"name":"ae_project_import_json","arguments":{"inPath":"C:/AE-output/project.json","dryRun":true}}
```

Inspect validation results before real import. `dryRun` reads/validates without
touching AE, but the import tool is withheld in read-only mode. For real import,
omit `dryRun` or set false. The default appends (`clearFirst:false`).
`clearFirst:true` deletes existing project items first and is destructive.
Choose one of `inPath` and `json`; the current handler prefers a truthy `inPath`
if both are supplied. `skipValidation` bypasses checks and is not a repair tool.

Version-2 structural JSON does not embed all media or preserve every native
feature. Dry-run validity is not a fidelity guarantee. Keep the AEP and assets.

## Remaining reference examples and prerequisites

| Examples | Prerequisite or interpretation |
|---|---|
| `font.list` | Installed fonts determine matches; use PostScript names for setting text |
| `footage.list_missing`, `item.list`, `project.get_settings` | Inspect the active project's current state |
| `layer.create_camera` | Adds a camera with the operation's native defaults; does not turn Title into a 3D layer |
| `layer.set_parent` | Controller must exist; `jump:true` can change visual placement instead of preserving it through compensation |
| `marker.add_comp`, `timeline.set_time` | Times are seconds in Main |
| `viewer.get_state` | Depends on the open viewer; no active viewer can limit returned information |
| `command.find` | Menu names depend on AE language; finding a command is separate from executing it |
| `pref.get` | Reads the specified preference; absence returns `exists:false`; it does not enable scripting |
| `instance.list` | Reports resident instances; an empty list can be normal in push mode |
| Stable-ID calls | Replace comp 13/layer 25 with your actual returned IDs |
| Request-status call | Replace the example UUID with the failed request's real UUID |

## Timeout recovery example

```json
{"name":"ae_request_status","arguments":{"requestId":"63d6f13c-9fc6-4f74-a3d4-6a15272db848"}}
```

Use the UUID from your own response. This call reads retained evidence and does
not submit a native command. `completed` means a host response exists; inspect
the nested result for application-level failure. `unknown` and `not_found`
do not authorize replay. Follow [the recovery procedure](TROUBLESHOOTING.md#recovering-a-timeout).
