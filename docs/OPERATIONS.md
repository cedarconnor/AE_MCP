# Operation reference

Generated from `src/operations` and `src/registry.ts` by `npm run docs:generate`. [Guide](../README.md) · [Tools](TOOLS.md) · [Examples](EXAMPLES.md)

**218 default operations in 23 categories**, reached through `ae_do`. Optional `eval.run` is separate from that count. Every operation has its parameter table, source link, policy classification and call template. 48 operations also have concrete schema-checked examples. Remaining templates use placeholders rather than inventing scene objects or valid effect/property values.

## Calling and interpreting operations

Use `ae_catalog({category: "keyframe"})` for the active policy-filtered catalog. Then call `ae_do` with `operation`, `args`, optional `timeoutMs` and optional top-level `instance`. An instance parameter inside operation args is only valid if that operation declares it.

Comp selectors are generally exact names or numeric item IDs. Shared single-layer lookup accepts 1-based index, name or `{id: layerId}`; only operations advertising collections support all/selected/arrays. Property paths are arrays of names, matchNames or 1-based indices passed to native property lookup. Duplicate effect/mask/group matchNames are ambiguous: inspect the tree and use an appropriate index. IDs are project-scoped; refresh after opening/importing/replacing a project.

Validation rejects missing required fields, unknown keys, wrong top-level types and non-finite numbers. It does not deeply validate every array/object or ensure referenced layers, fonts, effects and templates exist. Native code performs additional checks. Metadata defaults are shown when declared; descriptions/code may define additional defaults. Defaults are applied by each operation, not filled by the generic validator.

Read-only classification describes project-mutation policy, not zero filesystem/application side effects. App-configuration operations require explicitly authorized `confirm:true`. Normal JSX calls are undo-grouped; exceptions and file writes are not transactional. `batch.run` checks children, can stop on errors, and does not roll back successful earlier children. Descriptions below are implementation declarations, not proof of universal AE-version or visual correctness. See [validation limits](VALIDATION.md).

## Category index

| Category | Operations |
|---|---:|
| [batch](#category-batch) | 1 |
| [command](#category-command) | 3 |
| [comp](#category-comp) | 17 |
| [effect](#category-effect) | 7 |
| [egp](#category-egp) | 7 |
| [expression](#category-expression) | 4 |
| [font](#category-font) | 11 |
| [footage](#category-footage) | 7 |
| [instance](#category-instance) | 5 |
| [item](#category-item) | 5 |
| [keyframe](#category-keyframe) | 13 |
| [layer](#category-layer) | 36 |
| [marker](#category-marker) | 5 |
| [mask](#category-mask) | 4 |
| [pref](#category-pref) | 5 |
| [project](#category-project) | 27 |
| [property](#category-property) | 8 |
| [render](#category-render) | 15 |
| [shape](#category-shape) | 22 |
| [text](#category-text) | 10 |
| [timeline](#category-timeline) | 3 |
| [transform](#category-transform) | 1 |
| [viewer](#category-viewer) | 2 |

<a id="category-batch"></a>

## batch

[batch.run](#batch-run)

<a id="batch-run"></a>

### batch.run

Execute multiple operations in a single IPC call (~400ms total instead of 400ms × N). Operations run sequentially inside ONE undo group — a single Ctrl+Z reverts the whole batch, however many ops it contained. That group is also why undo/redo children (project.undo, command.execute id 16/2035) are rejected here: call those as their own ae_do. If one fails, subsequent ops still run unless stopOnError. Results array matches input order; the response reports how many failed. Mix in read/verify children — comp.info, layer.info, render.frame — to mutate AND verify in the same call, e.g. [...mutations, { operation: 'render.frame', args: { … } }].

Source: [src/operations/batch.ts](../src/operations/batch.ts). Category: `batch`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `ops` | array | Yes | — | Array of { operation, args } objects, e.g. [{ "operation": "layer.create_solid", "args": { "comp": "Main", "color": [1,0,0] } }] |
| `stopOnError` | boolean | No | — | Stop executing remaining ops if one fails (default false) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "batch.run",
    "args": {
      "ops": "<ops: array>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "batch.run",
    "args": {
      "ops": [
        {
          "operation": "text.set_content",
          "args": {
            "comp": "Main",
            "layer": "Title",
            "text": "A revised title"
          }
        },
        {
          "operation": "layer.info",
          "args": {
            "comp": "Main",
            "layer": "Title",
            "detail": "summary"
          }
        }
      ],
      "stopOnError": true
    }
  }
}
```

<a id="category-command"></a>

## command

[command.execute](#command-execute) · [command.find](#command-find) · [command.list](#command-list)

<a id="command-execute"></a>

### command.execute

Execute an AE menu command by its numeric ID. Use command.list to discover common IDs. Undo (16) and Redo (2035) run outside this call's undo group, so they revert/replay the PREVIOUS call.

Source: [src/operations/command.ts](../src/operations/command.ts). Category: `command`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `id` | number | Yes | — | Menu command ID |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "command.execute",
    "args": {
      "id": "<id: number>"
    }
  }
}
```

<a id="command-find"></a>

### command.find

Find a menu command ID by name (AE's app.findMenuCommandId). Note: not reliable across languages.

Source: [src/operations/command.ts](../src/operations/command.ts). Category: `command`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `name` | string | Yes | — | Menu command name (English) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "command.find",
    "args": {
      "name": "<name: string>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "command.find",
    "args": {
      "name": "Create Shapes from Vector Layer"
    }
  }
}
```

<a id="command-list"></a>

### command.list

Return a curated list of commonly-used menu command IDs.

Source: [src/operations/command.ts](../src/operations/command.ts). Category: `command`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "command.list",
    "args": {}
  }
}
```

<a id="category-comp"></a>

## comp

[comp.add_guide](#comp-add_guide) · [comp.create](#comp-create) · [comp.delete](#comp-delete) · [comp.duplicate](#comp-duplicate) · [comp.info](#comp-info) · [comp.list_guides](#comp-list_guides) · [comp.list_renderers](#comp-list_renderers) · [comp.precompose](#comp-precompose) · [comp.remove_guide](#comp-remove_guide) · [comp.resize](#comp-resize) · [comp.sample](#comp-sample) · [comp.set_guide](#comp-set_guide) · [comp.set_label](#comp-set_label) · [comp.set_layer_order](#comp-set_layer_order) · [comp.set_props](#comp-set_props) · [comp.set_renderer](#comp-set_renderer) · [comp.set_work_area](#comp-set_work_area)

<a id="comp-add_guide"></a>

### comp.add_guide

Add a horizontal or vertical guide line to a comp (AE 16.1+).

Source: [src/operations/comp.ts](../src/operations/comp.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `orientation` | string | Yes | — | horizontal\|vertical |
| `position` | number | Yes | — | Position in px (y for horizontal, x for vertical) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.add_guide",
    "args": {
      "comp": "<comp: any>",
      "orientation": "<orientation: string>",
      "position": "<position: number>"
    }
  }
}
```

<a id="comp-create"></a>

### comp.create

Create a new composition.

Source: [src/operations/comp.ts](../src/operations/comp.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `name` | string | Yes | — | Composition name |
| `width` | number | Yes | — | Width in px |
| `height` | number | Yes | — | Height in px |
| `fps` | number | Yes | — | Frame rate |
| `duration` | number | Yes | — | Duration in seconds |
| `bgColor` | array | No | — | [r,g,b] 0-1 |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.create",
    "args": {
      "name": "<name: string>",
      "width": "<width: number>",
      "height": "<height: number>",
      "fps": "<fps: number>",
      "duration": "<duration: number>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.create",
    "args": {
      "name": "Main",
      "width": 1280,
      "height": 720,
      "fps": 30,
      "duration": 6,
      "bgColor": [
        0.012,
        0.018,
        0.035
      ]
    }
  }
}
```

<a id="comp-delete"></a>

### comp.delete

Delete a composition from the project.

Source: [src/operations/comp.ts](../src/operations/comp.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.delete",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="comp-duplicate"></a>

### comp.duplicate

Duplicate a composition.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id to duplicate |
| `newName` | string | No | — | Name for the duplicate |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.duplicate",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="comp-info"></a>

### comp.info

Comp details + per-layer summaries (same payload as ae_comp_info). As a batch.run child, lets the same call verify what a preceding mutation did.

Source: [src/operations/inspect.ts](../src/operations/inspect.ts). Category: `comp`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.info",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.info",
    "args": {
      "comp": "Main"
    }
  }
}
```

<a id="comp-list_guides"></a>

### comp.list_guides

List all guides on a comp with orientation and position (AE 16.1+).

Source: [src/operations/comp.ts](../src/operations/comp.ts). Category: `comp`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.list_guides",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="comp-list_renderers"></a>

### comp.list_renderers

List the comp's available 3D renderer matchNames, the current one, and the friendly-name mapping used by comp.set_renderer.

Source: [src/operations/comp.ts](../src/operations/comp.ts). Category: `comp`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.list_renderers",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="comp-precompose"></a>

### comp.precompose

Pre-compose selected layers into a new nested composition.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Source comp name or id |
| `layerIndices` | array | Yes | — | Array of 1-based layer indices to precompose |
| `newName` | string | Yes | — | Name for the new comp |
| `moveAll` | boolean | No | true | Move all attributes into new comp (default true) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.precompose",
    "args": {
      "comp": "<comp: any>",
      "layerIndices": "<layerIndices: array>",
      "newName": "<newName: string>"
    }
  }
}
```

<a id="comp-remove_guide"></a>

### comp.remove_guide

Remove a guide from a comp by its 0-based index (see comp.list_guides).

Source: [src/operations/comp.ts](../src/operations/comp.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `guideIndex` | number | Yes | — | 0-based guide index |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.remove_guide",
    "args": {
      "comp": "<comp: any>",
      "guideIndex": "<guideIndex: number>"
    }
  }
}
```

<a id="comp-resize"></a>

### comp.resize

Change a comp's size and keep its content where it was: every unparented layer's Position (keyframes included, separated dimensions handled) is offset so the content stays pinned to `anchor` — 'center' keeps it centred, 'topLeft' keeps the top-left corner, etc. Children follow their parents. Comp accepts a name, id, pattern, or array.

Source: [src/operations/layout.ts](../src/operations/layout.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name/id, pattern ('shot_*'), or array of those |
| `width` | number | No | — | New width in px |
| `height` | number | No | — | New height in px |
| `anchor` | string | No | "center" | Where the existing content stays pinned: center \| topLeft \| topCenter \| topRight \| centerLeft \| centerRight \| bottomLeft \| bottomCenter \| bottomRight (default center) |
| `offset` | array | No | — | [dx, dy] explicit offset applied to every unparented layer instead of `anchor` |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.resize",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="comp-sample"></a>

### comp.sample

Sample property values at several times across layers of one or more comps in ONE call. Each row says whether the layer is active at that time (enabled and inside its in/out span) and gives the post-expression value of every requested property (default: the five transform properties). Use it to verify motion, list what is visible when, or compare two comps for a match cut.

Source: [src/operations/sample.ts](../src/operations/sample.ts). Category: `comp`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name/id, pattern ('shot_*'), or array of those |
| `times` | array | Yes | — | Times in seconds to sample |
| `layer` | any | No | "all" | Layer filter: index \| name \| { id } \| 'selected' \| 'all' \| array (default 'all') |
| `properties` | array | No | — | Property paths to read, e.g. [["Transform","Position"], ["Effects","Slider Control","Slider"]] (default: the five transform properties) |
| `activeOnly` | boolean | No | false | Omit layers that are not active at the sampled time (default false) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.sample",
    "args": {
      "comp": "<comp: any>",
      "times": "<times: array>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.sample",
    "args": {
      "comp": "Main",
      "times": [
        0,
        1,
        3,
        5.9
      ],
      "layer": "Title",
      "properties": [
        [
          "ADBE Transform Group",
          "ADBE Opacity"
        ]
      ]
    }
  }
}
```

<a id="comp-set_guide"></a>

### comp.set_guide

Move an existing guide to a new position (Item.setGuide). Orientation cannot be changed after creation — remove and re-add instead.

Source: [src/operations/comp.ts](../src/operations/comp.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `guideIndex` | number | Yes | — | 0-based guide index |
| `position` | number | Yes | — | New position in px (y for horizontal, x for vertical) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.set_guide",
    "args": {
      "comp": "<comp: any>",
      "guideIndex": "<guideIndex: number>",
      "position": "<position: number>"
    }
  }
}
```

<a id="comp-set_label"></a>

### comp.set_label

Set label color on comps. Can target by name, id, or pattern (e.g. 'review_id_*').

Source: [src/operations/comp.ts](../src/operations/comp.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name/id, or pattern with '*' wildcard |
| `label` | number | Yes | — | Label index (0=None, 1=Red, 2=Yellow, 3=Aqua, 4=Pink, 5=Lavender, 6=Peach, 7=Sea Foam, 8=Blue, 9=Green, 10=Purple, 11=Orange, 12=Brown, 13=Fuchsia, 14=Cyan, 15=Sandstone, 16=Dark Green) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.set_label",
    "args": {
      "comp": "<comp: any>",
      "label": "<label: number>"
    }
  }
}
```

<a id="comp-set_layer_order"></a>

### comp.set_layer_order

Arrange layers by listing them top to bottom. The listed layers occupy startIndex.. in that order; unlisted layers keep their relative order below (or above) them.

Source: [src/operations/layout.ts](../src/operations/layout.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layers` | array | Yes | — | Layer references (index \| name \| { id }), top first |
| `startIndex` | number | No | 1 | 1-based index the first listed layer lands on (default 1 = top) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.set_layer_order",
    "args": {
      "comp": "<comp: any>",
      "layers": "<layers: array>"
    }
  }
}
```

<a id="comp-set_props"></a>

### comp.set_props

Set composition properties (bgColor, workAreaStart, workAreaDuration, shutterAngle, motionBlur, etc.).

Source: [src/operations/comp.ts](../src/operations/comp.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `props` | object | Yes | — | Object with keys to set |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.set_props",
    "args": {
      "comp": "<comp: any>",
      "props": "<props: object>"
    }
  }
}
```

<a id="comp-set_renderer"></a>

### comp.set_renderer

Switch a comp's 3D renderer: classic3d | advanced3d | cinema4d (or a raw matchName from comp.list_renderers). Advanced 3D is required for 3D model layers, parametric meshes, and environment lights to render.

Source: [src/operations/comp.ts](../src/operations/comp.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `renderer` | string | Yes | — | classic3d\|advanced3d\|cinema4d, or an exact renderer matchName |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.set_renderer",
    "args": {
      "comp": "<comp: any>",
      "renderer": "<renderer: string>"
    }
  }
}
```

<a id="comp-set_work_area"></a>

### comp.set_work_area

Set the work area start and duration on a composition.

Source: [src/operations/comp.ts](../src/operations/comp.ts). Category: `comp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `start` | number | Yes | — | Work area start in seconds |
| `duration` | number | Yes | — | Work area duration in seconds |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.set_work_area",
    "args": {
      "comp": "<comp: any>",
      "start": "<start: number>",
      "duration": "<duration: number>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "comp.set_work_area",
    "args": {
      "comp": "Main",
      "start": 0,
      "duration": 6
    }
  }
}
```

<a id="category-effect"></a>

## effect

[effect.add](#effect-add) · [effect.get_dropdown_items](#effect-get_dropdown_items) · [effect.list_on_layer](#effect-list_on_layer) · [effect.move](#effect-move) · [effect.remove](#effect-remove) · [effect.set_dropdown_items](#effect-set_dropdown_items) · [effect.set_property](#effect-set_property)

<a id="effect-add"></a>

### effect.add

Add an effect to a layer by matchName. Use ae_do project.list_effects (or effect.list_on_layer on a reference layer) to find matchNames.

Source: [src/operations/effect.ts](../src/operations/effect.ts). Category: `effect`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `matchName` | string | Yes | — | Effect matchName (e.g. 'ADBE Gaussian Blur 2') |
| `name` | string | No | — | Custom display name for the effect |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "effect.add",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "matchName": "<matchName: string>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "effect.add",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "matchName": "ADBE Gaussian Blur 2",
      "name": "Softness"
    }
  }
}
```

<a id="effect-get_dropdown_items"></a>

### effect.get_dropdown_items

Read a Dropdown Menu Control's items (Property.propertyParameters, AE 26.0+), current 1-based selection, and its text (valueText).

Source: [src/operations/effect.ts](../src/operations/effect.ts). Category: `effect`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `effect` | any | Yes | — | 1-based effect index or effect name (a Dropdown Menu Control) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "effect.get_dropdown_items",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "effect": "<effect: any>"
    }
  }
}
```

<a id="effect-list_on_layer"></a>

### effect.list_on_layer

List all effects currently applied to a layer with their matchNames and properties.

Source: [src/operations/effect.ts](../src/operations/effect.ts). Category: `effect`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "effect.list_on_layer",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "effect.list_on_layer",
    "args": {
      "comp": "Main",
      "layer": "Title"
    }
  }
}
```

<a id="effect-move"></a>

### effect.move

Reorder an effect within a layer's effect stack (PropertyBase.moveTo). Effect order changes the render result.

Source: [src/operations/effect.ts](../src/operations/effect.ts). Category: `effect`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `effectIndex` | number | Yes | — | 1-based index of the effect to move |
| `toIndex` | number | Yes | — | 1-based target position in the stack |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "effect.move",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "effectIndex": "<effectIndex: number>",
      "toIndex": "<toIndex: number>"
    }
  }
}
```

<a id="effect-remove"></a>

### effect.remove

Remove an effect by its 1-based index within the layer's Effects group.

Source: [src/operations/effect.ts](../src/operations/effect.ts). Category: `effect`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `effectIndex` | number | Yes | — | 1-based effect index |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "effect.remove",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "effectIndex": "<effectIndex: number>"
    }
  }
}
```

<a id="effect-set_dropdown_items"></a>

### effect.set_dropdown_items

Set the menu items of a Dropdown Menu Control effect (Property.setPropertyParameters, AE 17.0.1+) — the key API for MOGRT dropdowns. Item strings must be unique; "-" inserts a separator. AE re-creates the control (references from earlier calls become invalid); this op preserves the effect's display name across that re-creation.

Source: [src/operations/effect.ts](../src/operations/effect.ts). Category: `effect`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `effect` | any | Yes | — | 1-based effect index or effect name (a Dropdown Menu Control) |
| `items` | array | Yes | — | Menu item strings, e.g. ["Red", "Green", "-", "Custom"] |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "effect.set_dropdown_items",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "effect": "<effect: any>",
      "items": "<items: array>"
    }
  }
}
```

<a id="effect-set_property"></a>

### effect.set_property

Set a property value on an effect. Property path is relative to the effect (e.g. ['Blurriness'] for Gaussian Blur).

Source: [src/operations/effect.ts](../src/operations/effect.ts). Category: `effect`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `effectIndex` | number | Yes | — | 1-based effect index |
| `property` | array | Yes | — | Property path within the effect |
| `value` | any | Yes | — | Value to set |
| `time` | number | No | — | If set, creates a keyframe at this time |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "effect.set_property",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "effectIndex": "<effectIndex: number>",
      "property": "<property: array>",
      "value": "<value: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "effect.set_property",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "effectIndex": 1,
      "property": [
        1
      ],
      "value": 12
    }
  }
}
```

<a id="category-egp"></a>

## egp

[egp.add_layer](#egp-add_layer) · [egp.add_property](#egp-add_property) · [egp.export_mogrt](#egp-export_mogrt) · [egp.list_controllers](#egp-list_controllers) · [egp.open_in_panel](#egp-open_in_panel) · [egp.set_alternate_source](#egp-set_alternate_source) · [egp.set_name](#egp-set_name)

<a id="egp-add_layer"></a>

### egp.add_layer

Expose a whole LAYER in a comp's Essential Graphics panel as a Media Replacement controller (AVLayer.addToMotionGraphicsTemplate, AE 18.0+). For single properties use egp.add_property.

Source: [src/operations/egp.ts](../src/operations/egp.ts). Category: `egp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp containing the layer |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `masterComp` | any | No | — | Template master comp (default: same as comp) |
| `controllerName` | string | No | — | Display name in the Essential Graphics panel (default: layer name) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "egp.add_layer",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="egp-add_property"></a>

### egp.add_property

Expose a layer property in the Essential Graphics panel of a comp (Property.addToMotionGraphicsTemplateAs). The comp becomes the template master.

Source: [src/operations/egp.ts](../src/operations/egp.ts). Category: `egp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id (holds the property) |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `controllerName` | string | No | — | Display name in the Essential Graphics panel (default: property name) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "egp.add_property",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "egp.add_property",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "property": [
        "ADBE Text Properties",
        "ADBE Text Document"
      ],
      "controllerName": "Headline"
    }
  }
}
```

<a id="egp-export_mogrt"></a>

### egp.export_mogrt

Export a comp as a Motion Graphics Template (.mogrt) file for Premiere Pro (CompItem.exportAsMotionGraphicsTemplate).

Source: [src/operations/egp.ts](../src/operations/egp.ts). Category: `egp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `path` | string | No | — | Absolute destination FOLDER (the filename comes from the template name). Omit to save into the user's Motion Graphics Templates folder. Save the project first — a dirty project triggers a save prompt. |
| `overwrite` | boolean | No | true | Overwrite an existing file without asking (default true) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "egp.export_mogrt",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "egp.export_mogrt",
    "args": {
      "comp": "Main",
      "path": "C:/AE-output/templates",
      "overwrite": false
    }
  }
}
```

<a id="egp-list_controllers"></a>

### egp.list_controllers

List the Essential Graphics controllers exposed on a comp (AE 16.1+ for controller names).

Source: [src/operations/egp.ts](../src/operations/egp.ts). Category: `egp`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "egp.list_controllers",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "egp.list_controllers",
    "args": {
      "comp": "Main"
    }
  }
}
```

<a id="egp-open_in_panel"></a>

### egp.open_in_panel

Open a comp in the Essential Graphics panel as the template master (CompItem.openInEssentialGraphics, AE 15.0+).

Source: [src/operations/egp.ts](../src/operations/egp.ts). Category: `egp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "egp.open_in_panel",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="egp-set_alternate_source"></a>

### egp.set_alternate_source

Set a Media Replacement alternate source on an Essential Properties source (Property.setAlternateSource, AE 18.0+). Works on layers of a template comp opened from Essential Graphics.

Source: [src/operations/egp.ts](../src/operations/egp.ts). Category: `egp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path to the media-replacement essential property |
| `item` | any | Yes | — | Replacement source: project item id (number) or name (string) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "egp.set_alternate_source",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "item": "<item: any>"
    }
  }
}
```

<a id="egp-set_name"></a>

### egp.set_name

Set the Motion Graphics Template name of a comp (Essential Graphics panel title).

Source: [src/operations/egp.ts](../src/operations/egp.ts). Category: `egp`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `name` | string | Yes | — | Template name |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "egp.set_name",
    "args": {
      "comp": "<comp: any>",
      "name": "<name: string>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "egp.set_name",
    "args": {
      "comp": "Main",
      "name": "Motion Title"
    }
  }
}
```

<a id="category-expression"></a>

## expression

[expression.disable_all](#expression-disable_all) · [expression.remove](#expression-remove) · [expression.restore_all](#expression-restore_all) · [expression.set](#expression-set)

<a id="expression-disable_all"></a>

### expression.disable_all

Disable all expressions in a comp (all layers, all properties). Returns a manifest that can be used to re-enable them later via expression.restore_all. Manifest paths use numeric property indices; manifests produced by older versions of this operation (matchName-based paths) are not compatible.

Source: [src/operations/expression.ts](../src/operations/expression.ts). Category: `expression`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "expression.disable_all",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="expression-remove"></a>

### expression.remove

Remove (disable) the expression on a property.

Source: [src/operations/expression.ts](../src/operations/expression.ts). Category: `expression`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "expression.remove",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>"
    }
  }
}
```

<a id="expression-restore_all"></a>

### expression.restore_all

Re-enable expressions from a manifest produced by expression.disable_all. Optionally transform the expressions before restoring (e.g. replace content variable). Only manifests in the current format (numeric property-index paths) are supported; manifests from older versions are not compatible.

Source: [src/operations/expression.ts](../src/operations/expression.ts). Category: `expression`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `manifest` | array | Yes | — | Manifest array from expression.disable_all |
| `replacements` | object | No | — | Optional string replacements to apply to each expression before restoring, e.g. { "old": "new" } |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "expression.restore_all",
    "args": {
      "comp": "<comp: any>",
      "manifest": "<manifest: array>"
    }
  }
}
```

<a id="expression-set"></a>

### expression.set

Apply an expression to a property.

Source: [src/operations/expression.ts](../src/operations/expression.ts). Category: `expression`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `expression` | string | Yes | — | Expression code string |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "expression.set",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "expression": "<expression: string>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "expression.set",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "property": [
        "ADBE Transform Group",
        "ADBE Rotation"
      ],
      "expression": "Math.sin(time * 2) * 5"
    }
  }
}
```

<a id="category-font"></a>

## font

[font.check_glyphs](#font-check_glyphs) · [font.get_default_for_script](#font-get_default_for_script) · [font.get_lists](#font-get_lists) · [font.info](#font-info) · [font.list](#font-list) · [font.list_duplicates](#font-list_duplicates) · [font.list_missing](#font-list_missing) · [font.list_used](#font-list_used) · [font.set_default_for_script](#font-set_default_for_script) · [font.set_favorites](#font-set_favorites) · [font.set_substitution](#font-set_substitution)

<a id="font-check_glyphs"></a>

### font.check_glyphs

Check whether a font has glyphs for every character of a string (FontObject.hasGlyphsFor, AE 25.1+). Essential before setting CJK or symbol text on a Latin-only font.

Source: [src/operations/font.ts](../src/operations/font.ts). Category: `font`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `postScriptName` | string | Yes | — | Font PostScript name |
| `text` | string | Yes | — | Characters to check |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "font.check_glyphs",
    "args": {
      "postScriptName": "<postScriptName: string>",
      "text": "<text: string>"
    }
  }
}
```

<a id="font-get_default_for_script"></a>

### font.get_default_for_script

Read the default font for a writing script (FontsObject.getDefaultFontForCTScript, AE 25.1+): roman|japanese|arabic|cyrillic|greek|hebrew|thai|devanagari, or a raw CTScript member name like CT_HANGUL_SCRIPT.

Source: [src/operations/font.ts](../src/operations/font.ts). Category: `font`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `script` | string | Yes | — | Writing script (see description) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "font.get_default_for_script",
    "args": {
      "script": "<script: string>"
    }
  }
}
```

<a id="font-get_lists"></a>

### font.get_lists

Read the Character panel's Favorites and most-recently-used font family lists (AE 24.6+).

Source: [src/operations/font.ts](../src/operations/font.ts). Category: `font`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "font.get_lists",
    "args": {}
  }
}
```

<a id="font-info"></a>

### font.info

Full FontObject details for a font (AE 24.0+): names, location, Adobe Fonts / substitute flags, and variable-font design axes (designAxesData/designVector). Look up by postScriptName, or by family (+ optional style).

Source: [src/operations/font.ts](../src/operations/font.ts). Category: `font`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `postScriptName` | string | No | — | PostScript name (preferred lookup) |
| `family` | string | No | — | Family name (used when postScriptName omitted) |
| `style` | string | No | — | Style name for family lookup (default 'Regular') |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "font.info",
    "args": {}
  }
}
```

<a id="font-list"></a>

### font.list

List installed fonts with postScriptName/family/style (app.fonts, AE 24.0+). Use postScriptName with text.set_style. Filter with familyContains.

Source: [src/operations/font.ts](../src/operations/font.ts). Category: `font`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `familyContains` | string | No | — | Case-insensitive substring match on family name |
| `limit` | number | No | — | Max results (default 200) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "font.list",
    "args": {}
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "font.list",
    "args": {
      "familyContains": "Arial",
      "limit": 20
    }
  }
}
```

<a id="font-list_duplicates"></a>

### font.list_duplicates

List groups of installed fonts that share a PostScript name (FontsObject.fontsDuplicateByPostScriptName, AE 24.6+) — the usual cause of 'wrong font picked' surprises.

Source: [src/operations/font.ts](../src/operations/font.ts). Category: `font`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "font.list_duplicates",
    "args": {}
  }
}
```

<a id="font-list_missing"></a>

### font.list_missing

List fonts that are missing or substituted in the current project (app.fonts, AE 24.0+). Pair with project.replace_font to fix.

Source: [src/operations/font.ts](../src/operations/font.ts). Category: `font`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "font.list_missing",
    "args": {}
  }
}
```

<a id="font-list_used"></a>

### font.list_used

List every font used in the project with its usage references (Project.usedFonts, AE 24.5+). The reverse of font.list_missing: answers 'which fonts does this project depend on'.

Source: [src/operations/font.ts](../src/operations/font.ts). Category: `font`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "font.list_used",
    "args": {}
  }
}
```

<a id="font-set_default_for_script"></a>

### font.set_default_for_script

Set the default font AE uses for a writing script (FontsObject.setDefaultFontForCTScript, AE 25.1+). Script names as in font.get_default_for_script; font by PostScript name.

Source: [src/operations/font.ts](../src/operations/font.ts). Category: `font`. Read-only classification: **false**. Execution: **ExtendScript**. Requires explicitly authorized **confirm: true**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `script` | string | Yes | — | Writing script |
| `postScriptName` | string | Yes | — | Font PostScript name |
| `confirm` | boolean | Yes | — | Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "font.set_default_for_script",
    "args": {
      "script": "<script: string>",
      "postScriptName": "<postScriptName: string>",
      "confirm": "<confirm: boolean>"
    }
  }
}
```

<a id="font-set_favorites"></a>

### font.set_favorites

Replace the Character panel's Favorites font family list (FontsObject.favoriteFontFamilyList, AE 24.6+).

Source: [src/operations/font.ts](../src/operations/font.ts). Category: `font`. Read-only classification: **false**. Execution: **ExtendScript**. Requires explicitly authorized **confirm: true**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `families` | array | Yes | — | Font family names, in display order |
| `confirm` | boolean | Yes | — | Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "font.set_favorites",
    "args": {
      "families": "<families: array>",
      "confirm": "<confirm: boolean>"
    }
  }
}
```

<a id="font-set_substitution"></a>

### font.set_substitution

Configure automatic replacement of substituted (missing) fonts (AE 24.6+): matchPolicy postScriptName|ctfiEqual|disabled, and freezeSync to stop Adobe Fonts auto-sync on project open.

Source: [src/operations/font.ts](../src/operations/font.ts). Category: `font`. Read-only classification: **false**. Execution: **ExtendScript**. Requires explicitly authorized **confirm: true**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `matchPolicy` | string | No | — | postScriptName\|ctfiEqual\|disabled |
| `freezeSync` | boolean | No | — | Suppress Adobe Fonts auto-sync of substituted fonts |
| `confirm` | boolean | Yes | — | Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "font.set_substitution",
    "args": {
      "confirm": "<confirm: boolean>"
    }
  }
}
```

<a id="category-footage"></a>

## footage

[footage.interpret](#footage-interpret) · [footage.list_missing](#footage-list_missing) · [footage.reload](#footage-reload) · [footage.replace](#footage-replace) · [footage.replace_with_placeholder](#footage-replace_with_placeholder) · [footage.replace_with_solid](#footage-replace_with_solid) · [footage.set_proxy](#footage-set_proxy)

<a id="footage-interpret"></a>

### footage.interpret

Set footage interpretation: alpha mode, frame rate conform, looping, fields, pixel aspect (FootageItem.mainSource).

Source: [src/operations/footage.ts](../src/operations/footage.ts). Category: `footage`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `item` | any | Yes | — | Footage item id (number) or name (string) |
| `alphaMode` | string | No | — | ignore\|straight\|premultiplied |
| `premulColor` | array | No | — | [r,g,b] 0-1 matte color for premultiplied alpha |
| `invertAlpha` | boolean | No | — | Invert the alpha channel |
| `guessAlpha` | boolean | No | — | Auto-detect the alpha interpretation first |
| `conformFrameRate` | number | No | — | Conform to this frame rate (0 = native) |
| `loop` | number | No | — | Number of times to loop the footage |
| `fieldSeparation` | string | No | — | off\|upper\|lower |
| `highQualityFields` | boolean | No | — | High-quality field separation |
| `pixelAspect` | number | No | — | Pixel aspect ratio (e.g. 1, 0.9091, 1.4587) |
| `guessPulldown` | string | No | — | Auto-detect pulldown first: '3:2' or '24Pa' (runs guessPulldown) |
| `removePulldown` | string | No | — | off\|WSSWW\|SSWWW\|SWWWS\|WWWSS\|WWSSW (needs field separation on) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "footage.interpret",
    "args": {
      "item": "<item: any>"
    }
  }
}
```

<a id="footage-list_missing"></a>

### footage.list_missing

List footage items whose source file is missing (footageMissing), with the last-known path. The footage counterpart of font.list_missing.

Source: [src/operations/footage.ts](../src/operations/footage.ts). Category: `footage`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "footage.list_missing",
    "args": {}
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "footage.list_missing",
    "args": {}
  }
}
```

<a id="footage-reload"></a>

### footage.reload

Reload a footage item from its source file (FileSource.reload) — picks up external edits to the file without relinking.

Source: [src/operations/footage.ts](../src/operations/footage.ts). Category: `footage`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `item` | any | Yes | — | Footage item id (number) or name (string) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "footage.reload",
    "args": {
      "item": "<item: any>"
    }
  }
}
```

<a id="footage-replace"></a>

### footage.replace

Relink a footage item to a different file (FootageItem.replace). Layers using the item keep keyframes/effects. Pass sequence=true to relink to an image sequence.

Source: [src/operations/footage.ts](../src/operations/footage.ts). Category: `footage`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `item` | any | Yes | — | Footage item id (number) or name (string) |
| `path` | string | Yes | — | Absolute path to the new file |
| `sequence` | boolean | No | false | Treat path as the first file of an image sequence (default false) |
| `forceAlphabetical` | boolean | No | — | Sequence only: force alphabetical order (default false) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "footage.replace",
    "args": {
      "item": "<item: any>",
      "path": "<path: string>"
    }
  }
}
```

<a id="footage-replace_with_placeholder"></a>

### footage.replace_with_placeholder

Replace a footage item's source with a placeholder (FootageItem.replaceWithPlaceholder) — e.g. to stand in for footage that will arrive later. Layers keep keyframes/effects.

Source: [src/operations/footage.ts](../src/operations/footage.ts). Category: `footage`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `item` | any | Yes | — | Footage item id (number) or name (string) |
| `name` | string | No | — | Placeholder name |
| `width` | number | No | — | Width in px (default: keep) |
| `height` | number | No | — | Height in px (default: keep) |
| `frameRate` | number | No | 30 | Frame rate (default 30) |
| `duration` | number | No | — | Duration in seconds (default: keep, or 1) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "footage.replace_with_placeholder",
    "args": {
      "item": "<item: any>"
    }
  }
}
```

<a id="footage-replace_with_solid"></a>

### footage.replace_with_solid

Replace a footage item's source with a solid color (FootageItem.replaceWithSolid). Layers using the item keep keyframes/effects.

Source: [src/operations/footage.ts](../src/operations/footage.ts). Category: `footage`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `item` | any | Yes | — | Footage item id (number) or name (string) |
| `color` | array | Yes | — | [r,g,b] 0-1 |
| `name` | string | No | — | New source name |
| `width` | number | No | — | Width in px (default: keep) |
| `height` | number | No | — | Height in px (default: keep) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "footage.replace_with_solid",
    "args": {
      "item": "<item: any>",
      "color": "<color: array>"
    }
  }
}
```

<a id="footage-set_proxy"></a>

### footage.set_proxy

Set or clear a proxy on any project item (comp or footage): a file, an image sequence, a solid color, or a placeholder. Omit path/solidColor/placeholder to remove the proxy.

Source: [src/operations/footage.ts](../src/operations/footage.ts). Category: `footage`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `item` | any | Yes | — | Project item id (number) or name (string) |
| `path` | string or null | No | — | Absolute path to the proxy file — omit to remove the proxy |
| `sequence` | boolean | No | — | Treat path as the first file of an image sequence (default false) |
| `solidColor` | array | No | — | [r,g,b] 0-1 — set a solid proxy instead of a file (setProxyWithSolid) |
| `placeholder` | boolean | No | — | Set a placeholder proxy sized like the item (setProxyWithPlaceholder) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "footage.set_proxy",
    "args": {
      "item": "<item: any>"
    }
  }
}
```

<a id="category-instance"></a>

## instance

[instance.dialogs](#instance-dialogs) · [instance.dismiss_dialog](#instance-dismiss_dialog) · [instance.list](#instance-list) · [instance.start](#instance-start) · [instance.stop](#instance-stop)

<a id="instance-dialogs"></a>

### instance.dialogs

List the modal dialogs every running After Effects is showing — the message text, the owning process and its window title, and an id for instance.dismiss_dialog. While a dialog is open no script runs (calls fail with DIALOG_OPEN, or an instance stops ticking), and the dialog is often hidden behind the main window. Windows and macOS. On macOS the text is read only with Accessibility permission for the app running this server; without it dialogs are still listed, with empty text (`accessibility: false`).

Source: [src/operations/instance.ts](../src/operations/instance.ts). Category: `instance`. Read-only classification: **true**. Execution: **Node-side**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "instance.dialogs",
    "args": {}
  }
}
```

<a id="instance-dismiss_dialog"></a>

### instance.dismiss_dialog

Close a modal dialog After Effects is showing by its cancel action (what Escape does). A warning (missing files or fonts, a script alert) is acknowledged; a question is cancelled, never answered: "Save changes before closing?" leaves the project open and unsaved. Take `id` from instance.dialogs or from a DIALOG_OPEN error's details.dialogs. When the user wants a dialog answered some other way (Save, Replace…), ask them to click it. Windows and macOS; on macOS it needs Accessibility permission. A dialog Escape does not close is left open unless it has a single button (an OK-only warning), which is pressed.

Source: [src/operations/instance.ts](../src/operations/instance.ts). Category: `instance`. Read-only classification: **false**. Execution: **Node-side**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `id` | string | Yes | — | The dialog's id, as listed by instance.dialogs |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "instance.dismiss_dialog",
    "args": {
      "id": "<id: string>"
    }
  }
}
```

<a id="instance-list"></a>

### instance.list

List the After Effects instances whose resident agent is live — id, open project, busy state — and which one this call would address. Instances are separate After Effects processes (AfterFX.exe -m), each with its own project; address one on any tool with `instance: <id or project name>`. Stale entries are instances that quit or stopped ticking (a modal dialog blocks scripting).

Source: [src/operations/instance.ts](../src/operations/instance.ts). Category: `instance`. Read-only classification: **true**. Execution: **Node-side**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "instance.list",
    "args": {}
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "instance.list",
    "args": {}
  }
}
```

<a id="instance-start"></a>

### instance.start

Start a NEW After Effects instance (AfterFX.exe -m) named `name`, wait until its agent registers, and optionally open a project in it — or a COPY of one (`copyFrom`), which is the safe way to work on a project another instance already has open (two instances saving one file overwrite each other). Returns when the instance can be addressed with `instance: name` on every tool. Cold starts take 10–40 s. Parallel workflow: instance.start { name: 'w1', copyFrom: <main .aep> } → work with instance: 'w1' → ae_save_project (instance: 'w1') → project.merge { path: <the copy> } on the main instance → instance.stop { name: 'w1' }. Requires the resident agent (npx @kumoproductions/mcp-aftereffects install-agent) — every instance loads it at launch.

Source: [src/operations/instance.ts](../src/operations/instance.ts). Category: `instance`. Read-only classification: **false**. Execution: **Node-side**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `name` | string | Yes | — | Instance id — becomes AE_MCP_INSTANCE for the new process. Letters, digits, '.', '_', '-'. Must not be live already. |
| `project` | string | No | — | Absolute .aep path to open in the new instance once it is up. |
| `copyFrom` | string | No | — | Absolute .aep path to COPY first; the copy is what gets opened. Use for a project the main instance has open. |
| `copyTo` | string | No | — | Where `copyFrom` is copied to (default: next to the original as <stem>__<name>.aep). Overwritten if present. |
| `timeoutMs` | number | No | — | How long to wait for the instance to register (default 120000). |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "instance.start",
    "args": {
      "name": "<name: string>"
    }
  }
}
```

<a id="instance-stop"></a>

### instance.stop

Quit an After Effects instance by name. Refuses while the project has unsaved changes unless `save: true` (save in place — the project must have a file) or `discardChanges: true`. Returns once the instance has gone quiet. Use on workers you started with instance.start; it works on any live instance, so check instance.list before stopping one you did not start.

Source: [src/operations/instance.ts](../src/operations/instance.ts). Category: `instance`. Read-only classification: **false**. Execution: **Node-side**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `name` | string | Yes | — | Instance id (as in instance.list) |
| `save` | boolean | No | — | Save the project to its existing file before quitting (default false) |
| `discardChanges` | boolean | No | — | Quit even if the project has unsaved changes (default false) |
| `timeoutMs` | number | No | — | How long to wait for the instance to go quiet (default 30000). |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "instance.stop",
    "args": {
      "name": "<name: string>"
    }
  }
}
```

<a id="category-item"></a>

## item

[folder.create](#folder-create) · [item.list](#item-list) · [item.move_to_folder](#item-move_to_folder) · [item.set_props](#item-set_props) · [item.usages](#item-usages)

<a id="folder-create"></a>

### folder.create

Create a folder in the project panel, optionally inside another folder.

Source: [src/operations/item.ts](../src/operations/item.ts). Category: `item`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `name` | string | Yes | — | Folder name |
| `parent` | any | No | — | Parent folder id or name (default: project root) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "folder.create",
    "args": {
      "name": "<name: string>"
    }
  }
}
```

<a id="item-list"></a>

### item.list

List project items, optionally filtered by folder, type, or name substring. Lighter than ae_project_info for targeted lookups.

Source: [src/operations/item.ts](../src/operations/item.ts). Category: `item`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `folder` | any | No | — | Only items directly inside this folder (id or name) |
| `type` | string | No | — | CompItem\|FootageItem\|FolderItem |
| `nameContains` | string | No | — | Case-insensitive substring match on item name |
| `limit` | number | No | — | Max results (default 200) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "item.list",
    "args": {}
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "item.list",
    "args": {}
  }
}
```

<a id="item-move_to_folder"></a>

### item.move_to_folder

Move a project item (comp, footage, or folder) into a folder. Pass folder=null for the project root.

Source: [src/operations/item.ts](../src/operations/item.ts). Category: `item`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `item` | any | Yes | — | Item id (number) or name (string) |
| `folder` | any or null | No | — | Target folder id or name — null for project root |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "item.move_to_folder",
    "args": {
      "item": "<item: any>"
    }
  }
}
```

<a id="item-set_props"></a>

### item.set_props

Set project-item properties: name, label color (0-16), comment, selected. Works on comps, footage, and folders.

Source: [src/operations/item.ts](../src/operations/item.ts). Category: `item`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `item` | any | Yes | — | Item id (number) or name (string) |
| `name` | string | No | — | New name |
| `label` | number | No | — | Label color index (0-16) |
| `comment` | string | No | — | Comment text |
| `selected` | boolean | No | — | Select/deselect in project panel |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "item.set_props",
    "args": {
      "item": "<item: any>"
    }
  }
}
```

<a id="item-usages"></a>

### item.usages

Reverse lookup: list every comp that uses a footage item or comp (AVItem.usedIn), with the layer indices that reference it.

Source: [src/operations/item.ts](../src/operations/item.ts). Category: `item`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `item` | any | Yes | — | Item id (number) or name (string) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "item.usages",
    "args": {
      "item": "<item: any>"
    }
  }
}
```

<a id="category-keyframe"></a>

## keyframe

[keyframe.add](#keyframe-add) · [keyframe.apply](#keyframe-apply) · [keyframe.copy](#keyframe-copy) · [keyframe.remove](#keyframe-remove) · [keyframe.set_batch](#keyframe-set_batch) · [keyframe.set_easing](#keyframe-set_easing) · [keyframe.set_interpolation](#keyframe-set_interpolation) · [keyframe.set_label](#keyframe-set_label) · [keyframe.set_roving](#keyframe-set_roving) · [keyframe.set_selected](#keyframe-set_selected) · [keyframe.set_spatial](#keyframe-set_spatial) · [keyframe.set_value](#keyframe-set_value) · [keyframe.shift](#keyframe-shift)

<a id="keyframe-add"></a>

### keyframe.add

Add a keyframe at a specific time with a value.

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path, e.g. ["Transform","Position"] |
| `time` | number | Yes | — | Time in seconds |
| `value` | any | Yes | — | Value at this keyframe |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.add",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "time": "<time: number>",
      "value": "<value: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.add",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "property": [
        "ADBE Transform Group",
        "ADBE Opacity"
      ],
      "time": 0,
      "value": 0
    }
  }
}
```

<a id="keyframe-apply"></a>

### keyframe.apply

Write a whole keyframe list to a property in ONE call, easing included: keys = [{ time, value, interp?, inType?, outType?, inInfluence?, outInfluence?, inSpeed?, outSpeed? }]. interp: linear | ease (both sides bezier) | easeIn (in bezier, out linear) | easeOut | hold (OUT side only — the incoming segment keeps evaluating, unlike keyframe.set_easing's symmetric 'hold') | keep. Handles separated dimensions (X/Y Position followers) and __kind values (Shape, TextDocument). replace=true clears existing keys first. Applies the same list to every matched layer.

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | Layer index, name, { id }, 'selected', 'all', or an array of those |
| `property` | array | Yes | — | Property path, e.g. ["Transform","Position"] |
| `keys` | array | Yes | — | [{ time, value, interp?, inType?, outType?, inInfluence?, outInfluence?, inSpeed?, outSpeed? }, …] |
| `interp` | string | No | — | Default interp for keys that do not set their own (default: AE's default, i.e. keep) |
| `replace` | boolean | No | false | Remove the property's existing keys first (default false) |
| `spatialTangents` | string | No | "auto" | auto \| linear — 'linear' zeroes the spatial tangents on Position/Anchor keys so the motion path is straight between keys (default auto = AE's auto-bezier) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.apply",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "keys": "<keys: array>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.apply",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "property": [
        "ADBE Transform Group",
        "ADBE Opacity"
      ],
      "keys": [
        {
          "time": 0,
          "value": 0,
          "interp": "ease"
        },
        {
          "time": 1,
          "value": 100,
          "interp": "ease"
        },
        {
          "time": 5,
          "value": 100,
          "interp": "ease"
        },
        {
          "time": 6,
          "value": 0,
          "interp": "ease"
        }
      ],
      "replace": false
    }
  }
}
```

<a id="keyframe-copy"></a>

### keyframe.copy

Copy all keyframes from one property to another (same or different layer/comp). Value types must be compatible. Existing target keys are kept.

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Source comp name or id |
| `layer` | any | Yes | — | Source layer (1-based index or name) |
| `property` | array | Yes | — | Source property path |
| `targetComp` | any | No | — | Target comp (default: same as source) |
| `targetLayer` | any | Yes | — | Target layer (1-based index or name) |
| `targetProperty` | array | No | — | Target property path (default: same as source) |
| `timeOffset` | number | No | 0 | Seconds to add to every copied key time (default 0) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.copy",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "targetLayer": "<targetLayer: any>"
    }
  }
}
```

<a id="keyframe-remove"></a>

### keyframe.remove

Remove a keyframe by its 1-based index.

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `keyIndex` | number | Yes | — | 1-based keyframe index to remove |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.remove",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "keyIndex": "<keyIndex: number>"
    }
  }
}
```

<a id="keyframe-set_batch"></a>

### keyframe.set_batch

Set many keyframes on one property in a single call (Property.setValuesAtTimes). times and values must have the same length.

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `times` | array | Yes | — | Times in seconds |
| `values` | array | Yes | — | Values, one per time (same order) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.set_batch",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "times": "<times: array>",
      "values": "<values: array>"
    }
  }
}
```

<a id="keyframe-set_easing"></a>

### keyframe.set_easing

Apply easing to a keyframe. Preset: 'linear', 'ease', 'easeIn', 'easeOut', 'hold'. Or custom bezier with inSpeed/outSpeed/inInfluence/outInfluence. NOTE: 'hold' here sets BOTH sides to HOLD, which also freezes the segment BEFORE the key (a fade ending in such a key never fades). For the timeline's Toggle-Hold behaviour (out side only) use keyframe.set_interpolation outType:'hold' or keyframe.apply interp:'hold'.

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `keyIndex` | number | Yes | — | 1-based keyframe index |
| `preset` | string | No | — | linear\|ease\|easeIn\|easeOut\|hold (overrides custom params) |
| `inSpeed` | number | No | — | Custom in speed |
| `outSpeed` | number | No | — | Custom out speed |
| `inInfluence` | number | No | 33 | Custom in influence (0-100) |
| `outInfluence` | number | No | 33 | Custom out influence (0-100) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.set_easing",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "keyIndex": "<keyIndex: number>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.set_easing",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "property": [
        "ADBE Transform Group",
        "ADBE Opacity"
      ],
      "keyIndex": 1,
      "preset": "ease"
    }
  }
}
```

<a id="keyframe-set_interpolation"></a>

### keyframe.set_interpolation

Set a keyframe's in/out interpolation types directly (linear|bezier|hold — asymmetric combinations allowed, e.g. bezier in / hold out), and the temporal continuous / auto-bezier flags. For speed/influence curves use keyframe.set_easing.

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `keyIndex` | number | Yes | — | 1-based keyframe index |
| `inType` | string | No | — | linear\|bezier\|hold (default: keep current) |
| `outType` | string | No | — | linear\|bezier\|hold (default: keep current) |
| `temporalContinuous` | boolean | No | — | Temporal continuity flag |
| `temporalAutoBezier` | boolean | No | — | Temporal auto-bezier flag (true also enables continuity) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.set_interpolation",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "keyIndex": "<keyIndex: number>"
    }
  }
}
```

<a id="keyframe-set_label"></a>

### keyframe.set_label

Set a keyframe's label color (Property.setLabelAtKey, AE 22.6+).

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `keyIndex` | number | Yes | — | 1-based keyframe index |
| `label` | number | Yes | — | Label color index 0-16 (0 = none) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.set_label",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "keyIndex": "<keyIndex: number>",
      "label": "<label: number>"
    }
  }
}
```

<a id="keyframe-set_roving"></a>

### keyframe.set_roving

Set a keyframe to rove across time (smooth speed on a spatial path). First and last keyframes cannot rove.

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `keyIndex` | number | Yes | — | 1-based keyframe index |
| `roving` | boolean | Yes | — | true=roving, false=fixed |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.set_roving",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "keyIndex": "<keyIndex: number>",
      "roving": "<roving: boolean>"
    }
  }
}
```

<a id="keyframe-set_selected"></a>

### keyframe.set_selected

Select or deselect keyframes on a property (Property.setSelectedAtKey) - e.g. to stage keys for a user-facing copy/paste in the UI.

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `keyIndex` | any | Yes | — | 1-based keyframe index, or 'all' |
| `selected` | boolean | Yes | — | true=select, false=deselect |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.set_selected",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "keyIndex": "<keyIndex: any>",
      "selected": "<selected: boolean>"
    }
  }
}
```

<a id="keyframe-set_spatial"></a>

### keyframe.set_spatial

Set spatial tangents / continuity on a keyframe of a spatial property (Position, Anchor Point). Tangents are [x,y] or [x,y,z] offsets.

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `keyIndex` | number | Yes | — | 1-based keyframe index |
| `inTangent` | array | No | — | Incoming spatial tangent (default: keep current) |
| `outTangent` | array | No | — | Outgoing spatial tangent (default: keep current) |
| `continuous` | boolean | No | — | Spatial continuity flag |
| `autoBezier` | boolean | No | — | Spatial auto-bezier flag |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.set_spatial",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "keyIndex": "<keyIndex: number>"
    }
  }
}
```

<a id="keyframe-set_value"></a>

### keyframe.set_value

Change the value of an existing keyframe without changing its time.

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `keyIndex` | number | Yes | — | 1-based keyframe index |
| `value` | any | Yes | — | New value |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.set_value",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "keyIndex": "<keyIndex: number>",
      "value": "<value: any>"
    }
  }
}
```

<a id="keyframe-shift"></a>

### keyframe.shift

Retime all keyframes on a property: newTime = (time - pivot) * scale + pivot + offset. Preserves interpolation, ease, and spatial tangents best-effort.

Source: [src/operations/keyframe.ts](../src/operations/keyframe.ts). Category: `keyframe`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `offset` | number | No | 0 | Seconds to shift by (default 0) |
| `scale` | number | No | 1 | Time scale factor around pivot (default 1) |
| `pivot` | number | No | 0 | Pivot time in seconds for scaling (default 0) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "keyframe.shift",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>"
    }
  }
}
```

<a id="category-layer"></a>

## layer

[layer.add_guide](#layer-add_guide) · [layer.apply_preset](#layer-apply_preset) · [layer.bounds](#layer-bounds) · [layer.calculate_transform](#layer-calculate_transform) · [layer.convert_point](#layer-convert_point) · [layer.convert_to_shapes](#layer-convert_to_shapes) · [layer.copy_to_comp](#layer-copy_to_comp) · [layer.create_adjustment](#layer-create_adjustment) · [layer.create_camera](#layer-create_camera) · [layer.create_footage](#layer-create_footage) · [layer.create_light](#layer-create_light) · [layer.create_null](#layer-create_null) · [layer.create_parametric_mesh](#layer-create_parametric_mesh) · [layer.create_shape](#layer-create_shape) · [layer.create_solid](#layer-create_solid) · [layer.create_text](#layer-create_text) · [layer.delete](#layer-delete) · [layer.duplicate](#layer-duplicate) · [layer.info](#layer-info) · [layer.list_guides](#layer-list_guides) · [layer.move](#layer-move) · [layer.move_guide](#layer-move_guide) · [layer.remove_guide](#layer-remove_guide) · [layer.replace_source](#layer-replace_source) · [layer.scene_edit_detection](#layer-scene_edit_detection) · [layer.set_anchor](#layer-set_anchor) · [layer.set_blend_mode](#layer-set_blend_mode) · [layer.set_enabled](#layer-set_enabled) · [layer.set_guide](#layer-set_guide) · [layer.set_parent](#layer-set_parent) · [layer.set_props](#layer-set_props) · [layer.set_timing](#layer-set_timing) · [layer.set_track_matte](#layer-set_track_matte) · [layer.set_visibility_schedule](#layer-set_visibility_schedule) · [layer.split](#layer-split) · [layer.split_groups](#layer-split_groups)

<a id="layer-add_guide"></a>

### layer.add_guide

Add a ruler guide to a layer's Layer panel view (Layer.addGuide, AE 16.1+). Comp-panel guides live under comp.add_guide.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `orientation` | string | Yes | — | horizontal\|vertical |
| `position` | number | Yes | — | Position in px (y for horizontal, x for vertical) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.add_guide",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "orientation": "<orientation: string>",
      "position": "<position: number>"
    }
  }
}
```

<a id="layer-apply_preset"></a>

### layer.apply_preset

Apply an animation preset (.ffx file) to a layer — applies effects/keyframes in one call.

Source: [src/operations/layer-advanced.ts](../src/operations/layer-advanced.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `path` | string | Yes | — | Absolute path to the .ffx preset |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.apply_preset",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "path": "<path: string>"
    }
  }
}
```

<a id="layer-bounds"></a>

### layer.bounds

Measure a layer's rendered bounds via sourceRectAtTime — essential for aligning/fitting text and shape layers. Returns layer-space rect and, when the host supports it, comp-space corners.

Source: [src/operations/layer-advanced.ts](../src/operations/layer-advanced.ts). Category: `layer`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `time` | number | No | — | Time in seconds (default: current comp time) |
| `includeExtents` | boolean | No | false | Include pixel extents beyond the layer edges (default false) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.bounds",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="layer-calculate_transform"></a>

### layer.calculate_transform

Calculate the transform that maps a 3D layer onto three corner points (AVLayer.calculateTransformFromPoints) - corner-pin style placement in 3D space. Calculation-only: returns anchorPoint/position/x-y-zRotation/scale without touching the layer — apply them with property.set / layer.set_props.

Source: [src/operations/layer-advanced.ts](../src/operations/layer-advanced.ts). Category: `layer`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name (3D layer) |
| `topLeft` | array | Yes | — | [x,y,z] world point for the layer's top-left |
| `topRight` | array | Yes | — | [x,y,z] world point for the top-right |
| `bottomLeft` | array | Yes | — | [x,y,z] world point for the bottom-left. The scripting guide names this pointBottomRight, but the implementation expects the bottom-left (the guide's own example passes bl): a true bottom-right returns the same placement with zScale skewed by sin(corner angle) — verified on AE 26.3. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.calculate_transform",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "topLeft": "<topLeft: array>",
      "topRight": "<topRight: array>",
      "bottomLeft": "<bottomLeft: array>"
    }
  }
}
```

<a id="layer-convert_point"></a>

### layer.convert_point

Convert a point between layer source space and comp space (sourcePointToComp / compPointToSource, AE 13.2+; designed for text layers — evaluates at the first character at the given time).

Source: [src/operations/layer-advanced.ts](../src/operations/layer-advanced.ts). Category: `layer`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `direction` | string | Yes | — | sourceToComp\|compToSource |
| `point` | array | Yes | — | [x, y] point to convert |
| `time` | number | No | — | Evaluate at this time (default: current comp time) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.convert_point",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "direction": "<direction: string>",
      "point": "<point: array>"
    }
  }
}
```

<a id="layer-convert_to_shapes"></a>

### layer.convert_to_shapes

Run 'Create Shapes from Vector Layer' on imported Illustrator/vector layers: each becomes a shape layer directly above the original (which AE switches off). By default the ' Outlines' suffix AE appends is stripped; removeSource deletes the vector layers, removeFootage also deletes their footage items when nothing else uses them. Note: the shape layers can arrive with Position dimensions SEPARATED — every write in this server handles that.

Source: [src/operations/shape-contents.ts](../src/operations/shape-contents.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | Layer index, name, { id }, 'selected', 'all', or an array of those (shape layers) |
| `stripSuffix` | boolean | No | true | Rename the new layer to the original's name (drop ' Outlines' / localized suffix). Default true |
| `removeSource` | boolean | No | false | Delete the original vector layer after conversion (default false) |
| `removeFootage` | boolean | No | false | With removeSource: also delete the footage item when no other layer uses it (default false) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.convert_to_shapes",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="layer-copy_to_comp"></a>

### layer.copy_to_comp

Copy a layer into another comp. The copy is identified by its Layer.id (never by assuming it landed on top). Options: timeOffset/startTime to place it in time, bakeAtTime to freeze every animated property at that source time and drop the keys (match-cut copies), name to rename. The copy keeps the source comp's span — use layer.set_timing outPoint:'comp' to extend it.

Source: [src/operations/layer-advanced.ts](../src/operations/layer-advanced.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Source comp name or id |
| `layer` | any | Yes | — | 1-based layer index, name, or { id } in the source comp |
| `targetComp` | any | Yes | — | Target comp name or id |
| `timeOffset` | number | No | — | Seconds added to the copy's startTime |
| `startTime` | number | No | — | Absolute startTime for the copy (applied after timeOffset) |
| `bakeAtTime` | number | No | — | Freeze every keyframed property of the copy at this SOURCE-comp time and remove its keys |
| `name` | string | No | — | Rename the copy |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.copy_to_comp",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "targetComp": "<targetComp: any>"
    }
  }
}
```

<a id="layer-create_adjustment"></a>

### layer.create_adjustment

Create an adjustment layer (a comp-sized solid with adjustmentLayer on) — the carrier for comp-wide effects such as Posterize Time or a color grade. Add effects with effect.add.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `name` | string | No | "Adjustment Layer" | Layer name |
| `width` | number | No | — | Width in px (default: comp width) |
| `height` | number | No | — | Height in px (default: comp height) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_adjustment",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="layer-create_camera"></a>

### layer.create_camera

Create a camera layer.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `name` | string | No | "Camera" | Layer name |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_camera",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_camera",
    "args": {
      "comp": "Main",
      "name": "Camera"
    }
  }
}
```

<a id="layer-create_footage"></a>

### layer.create_footage

Add an existing project item (footage or comp) as a layer in a composition.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `sourceItemId` | number | Yes | — | Project item id to use as source |
| `name` | string | No | — | Layer name |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_footage",
    "args": {
      "comp": "<comp: any>",
      "sourceItemId": "<sourceItemId: number>"
    }
  }
}
```

<a id="layer-create_light"></a>

### layer.create_light

Create a light layer.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `name` | string | No | "Light" | Layer name |
| `lightType` | string | No | "spot" | spot\|parallel\|point\|ambient\|environment (environment needs AE 24.3+ / Advanced 3D) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_light",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="layer-create_null"></a>

### layer.create_null

Create a null object layer.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `name` | string | No | — | Layer name |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_null",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_null",
    "args": {
      "comp": "Main",
      "name": "Controller"
    }
  }
}
```

<a id="layer-create_parametric_mesh"></a>

### layer.create_parametric_mesh

Create a parametric 3D mesh layer (LayerCollection.addParametricMesh, AE 26.3+): cube|sphere|plane|cylinder|cone|torus. Best rendered with the Advanced 3D renderer (comp.set_renderer).

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `name` | string | No | "Mesh" | Layer name |
| `meshType` | string | Yes | — | cube\|sphere\|plane\|cylinder\|cone\|torus |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_parametric_mesh",
    "args": {
      "comp": "<comp: any>",
      "meshType": "<meshType: string>"
    }
  }
}
```

<a id="layer-create_shape"></a>

### layer.create_shape

Create an empty shape layer.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `name` | string | No | — | Layer name |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_shape",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_shape",
    "args": {
      "comp": "Main",
      "name": "Panel"
    }
  }
}
```

<a id="layer-create_solid"></a>

### layer.create_solid

Create a solid layer in a composition.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `name` | string | No | "Solid" | Layer name |
| `color` | array | No | [1,1,1] | [r,g,b] 0-1 |
| `width` | number | No | — | Width in px (default: comp width) |
| `height` | number | No | — | Height in px (default: comp height) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_solid",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="layer-create_text"></a>

### layer.create_text

Create a text layer: point text by default, paragraph (box) text when boxSize is given, vertical when orientation='vertical' (AE 24.2+). Point<->box conversion is not scriptable, so pick the right kind here.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `text` | string | No | "" | Text content |
| `name` | string | No | — | Layer name |
| `boxSize` | array | No | — | [width, height] — creates paragraph (box) text instead of point text |
| `boxPosition` | array | No | — | [x, y] top-left of the box in layer space (box text only) |
| `orientation` | string | No | "horizontal" | horizontal\|vertical (vertical needs AE 24.2+) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_text",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.create_text",
    "args": {
      "comp": "Main",
      "name": "Title",
      "text": "Ideas in motion"
    }
  }
}
```

<a id="layer-delete"></a>

### layer.delete

Delete layers. comp supports pattern ('review_id_*'). layer supports index, name, 'selected', 'all'.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name/id/pattern (e.g. 'review_id_*') |
| `layer` | any | Yes | — | Layer index, name, 'selected', or 'all' |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.delete",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="layer-duplicate"></a>

### layer.duplicate

Duplicate a layer. Returns the new layer's index.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `newName` | string | No | — | Name for the duplicate |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.duplicate",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="layer-info"></a>

### layer.info

Full layer info incl. property trees and keyframes (same payload as ae_layer_info). Layer by 1-based index or name. detail='summary' drops default-value properties; includeProperties=false skips the tree entirely.

Source: [src/operations/inspect.ts](../src/operations/inspect.ts). Category: `layer`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index or layer name |
| `includeProperties` | boolean | No | true | Walk the full property tree (default true) |
| `detail` | string | No | "full" | full\|summary — 'summary' omits properties still at their default value (default full) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.info",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.info",
    "args": {
      "comp": "Main",
      "layer": {
        "id": 25
      },
      "detail": "summary"
    }
  }
}
```

<a id="layer-list_guides"></a>

### layer.list_guides

List a layer's Layer-panel ruler guides with orientation and position (AE 16.1+).

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.list_guides",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="layer-move"></a>

### layer.move

Move a layer to a new stacking position (1 = top).

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based current layer index, or the layer name |
| `toIndex` | number | Yes | — | 1-based target index, within 1..numLayers |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.move",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "toIndex": "<toIndex: number>"
    }
  }
}
```

<a id="layer-move_guide"></a>

### layer.move_guide

Move an existing Layer-panel ruler guide to a new position (Layer.setGuide). Named move_guide because layer.set_guide already means the guide-LAYER flag.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `guideIndex` | number | Yes | — | 0-based guide index |
| `position` | number | Yes | — | New position in px |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.move_guide",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "guideIndex": "<guideIndex: number>",
      "position": "<position: number>"
    }
  }
}
```

<a id="layer-remove_guide"></a>

### layer.remove_guide

Remove a Layer-panel ruler guide by its 0-based index (see layer.list_guides).

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `guideIndex` | number | Yes | — | 0-based guide index |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.remove_guide",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "guideIndex": "<guideIndex: number>"
    }
  }
}
```

<a id="layer-replace_source"></a>

### layer.replace_source

Replace a layer's source with another project item (footage or comp), keeping keyframes/effects. Set fixExpressions=false to skip expression rewriting.

Source: [src/operations/layer-advanced.ts](../src/operations/layer-advanced.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `item` | any | Yes | — | New source: project item id (number) or name (string) |
| `fixExpressions` | boolean | No | true | Rewrite expressions that reference the old source (default true) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.replace_source",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "item": "<item: any>"
    }
  }
}
```

<a id="layer-scene_edit_detection"></a>

### layer.scene_edit_detection

Run Scene Edit Detection on a video layer (Layer.doSceneEditDetection, AE 22.3+): find cuts in edited footage and mark or split at them.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `mode` | string | Yes | — | markers (add layer markers) \| split (split layer) \| splitPrecomp (split + precompose each) \| none (detect only) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.scene_edit_detection",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "mode": "<mode: string>"
    }
  }
}
```

<a id="layer-set_anchor"></a>

### layer.set_anchor

Move the anchor point WITHOUT moving the layer on screen (Position is compensated through Scale/Rotation; Position keyframes are all shifted). Address the anchor by preset on the layer's rendered bounds (sourceRectAtTime), by an explicit layer-space point, or by an offset from the current anchor.

Source: [src/operations/layout.ts](../src/operations/layout.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | Layer index, name, { id }, 'selected', 'all', or an array of those |
| `preset` | string | No | — | center \| topLeft \| topCenter \| topRight \| centerLeft \| centerRight \| bottomLeft \| bottomCenter \| bottomRight |
| `point` | array | No | — | [x, y] (or [x, y, z]) explicit anchor in layer space |
| `offset` | array | No | — | [dx, dy] added to the current anchor |
| `time` | number | No | — | Time at which the bounds are measured for a preset (default: current comp time) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.set_anchor",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="layer-set_blend_mode"></a>

### layer.set_blend_mode

Set blending mode on a layer.

Source: [src/operations/layer-advanced.ts](../src/operations/layer-advanced.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `mode` | string | Yes | — | normal\|add\|multiply\|screen\|overlay\|softLight\|hardLight\|difference\|exclusion\|colorDodge\|colorBurn\|darken\|lighten\|stencilAlpha\|stencilLuma\|silhouetteAlpha\|silhouetteLuma |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.set_blend_mode",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "mode": "<mode: string>"
    }
  }
}
```

<a id="layer-set_enabled"></a>

### layer.set_enabled

Enable or disable a layer by name or index. Can target all comps matching a pattern.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name/id, or '*' for all comps, or 'review_id_*' for pattern match |
| `layer` | any | Yes | — | Layer index (number) or name (string) |
| `enabled` | boolean | Yes | — | true=visible, false=hidden |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.set_enabled",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "enabled": "<enabled: boolean>"
    }
  }
}
```

<a id="layer-set_guide"></a>

### layer.set_guide

Set guideLayer on/off for a layer. Can target all comps matching a pattern.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name/id, or '*' for all comps, or 'review_id_*' for pattern match |
| `layer` | any | Yes | — | Layer index (number) or name (string) |
| `guide` | boolean | Yes | — | true=guide layer, false=normal |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.set_guide",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "guide": "<guide: boolean>"
    }
  }
}
```

<a id="layer-set_parent"></a>

### layer.set_parent

Set or clear a layer's parent. By default AE compensates the child's transform so it doesn't move; jump=true skips compensation (setParentWithJump) so the child adopts the parent's space.

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based child layer index, or the layer name |
| `parentLayer` | any or null | Yes | — | 1-based parent layer index or name. Pass null or 0 to unparent. |
| `jump` | boolean | No | false | true = no transform compensation (setParentWithJump). Default false. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.set_parent",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "parentLayer": "<parentLayer: any or null>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.set_parent",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "parentLayer": "Controller",
      "jump": true
    }
  }
}
```

<a id="layer-set_props"></a>

### layer.set_props

Set basic layer properties. layer can be index, name, 'selected', or 'all'. Enum-valued attributes accept string names: quality (best|draft|wireframe), samplingQuality (bilinear|bicubic), frameBlendingType (off|frameMix|pixelMotion), autoOrient (off|alongPath|cameraOrPointOfInterest|charactersTowardCamera), blendingMode, lightType (spot|parallel|point|ambient|environment).

Source: [src/operations/layer.ts](../src/operations/layer.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | Layer index, name, 'selected', or 'all' |
| `props` | object | Yes | — | Object with keys to set, e.g. { name: 'foo', enabled: false, label: 5, threeDLayer: true } |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.set_props",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "props": "<props: object>"
    }
  }
}
```

<a id="layer-set_timing"></a>

### layer.set_timing

Set a layer's timing in one call: shift (relative move of the whole layer), startTime, inPoint, outPoint ('comp' = comp start / comp end — e.g. to extend a layer copied out of a shorter comp), stretch. Applied in that order; AE clamps in/out to the source for footage.

Source: [src/operations/layout.ts](../src/operations/layout.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | Layer index, name, { id }, 'selected', 'all', or an array of those |
| `shift` | number | No | — | Seconds to move the layer by (in/out points follow) |
| `startTime` | number | No | — | Absolute layer start |
| `inPoint` | any | No | — | In point in seconds, or 'comp' for the comp start (0) |
| `outPoint` | any | No | — | Out point in seconds, or 'comp' for the comp end (comp.duration) |
| `stretch` | number | No | — | Time stretch in percent |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.set_timing",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.set_timing",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "inPoint": 0,
      "outPoint": 6
    }
  }
}
```

<a id="layer-set_track_matte"></a>

### layer.set_track_matte

Set (or remove) a track matte on a layer. Uses AVLayer.setTrackMatte (AE 23.0+): the matte can be ANY layer in the comp — it does not need to sit directly above the target.

Source: [src/operations/layer-advanced.ts](../src/operations/layer-advanced.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based index (or name) of the layer to apply matte TO |
| `matteLayer` | any | No | — | Matte source layer: 1-based index or name. Ignored when matteType is 'none'. |
| `matteType` | string | Yes | — | alpha\|alphaInverted\|luma\|lumaInverted\|none |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.set_track_matte",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "matteType": "<matteType: string>"
    }
  }
}
```

<a id="layer-set_visibility_schedule"></a>

### layer.set_visibility_schedule

Show layers only during given time ranges — sequential pops, material swaps, flip-books — in one call. mode 'opacity' (default) writes HOLD opacity keys (on inside each range, off outside; existing opacity keys replaced); mode 'inOut' sets in/out points (one range per layer).

Source: [src/operations/layout.ts](../src/operations/layout.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `entries` | array | Yes | — | [{ layer, ranges: [[start, end], …] }] — layer accepts the usual index \| name \| { id } \| 'selected' \| 'all' \| array |
| `mode` | string | No | "opacity" | opacity\|inOut (default opacity) |
| `onValue` | number | No | 100 | Opacity inside the ranges (default 100) |
| `offValue` | number | No | 0 | Opacity outside the ranges (default 0) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.set_visibility_schedule",
    "args": {
      "comp": "<comp: any>",
      "entries": "<entries: array>"
    }
  }
}
```

<a id="layer-split"></a>

### layer.split

Split a layer at a given time. Creates a new layer that starts at the split time.

Source: [src/operations/layer-advanced.ts](../src/operations/layer-advanced.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `time` | number | Yes | — | Time in seconds to split at |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.split",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "time": "<time: number>"
    }
  }
}
```

<a id="layer-split_groups"></a>

### layer.split_groups

Split a shape layer into one layer per top-level vector group (letters of a word, parts of a character), keeping every group's transform, fills and strokes. New layers stack in group order directly above the original. `anchor` re-anchors each new layer to its own artwork without moving it on screen.

Source: [src/operations/shape-contents.ts](../src/operations/shape-contents.ts). Category: `layer`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, name, or { id } (a shape layer) |
| `groups` | array | No | — | 1-based indices of the groups to split out (default: every top-level group) |
| `anchor` | string | No | "keep" | keep \| center \| topLeft \| topCenter \| topRight \| centerLeft \| centerRight \| bottomLeft \| bottomCenter \| bottomRight — anchor each new layer on its own bounds (default keep) |
| `nameTemplate` | string | No | "{group}" | Name for each new layer; tokens {group}, {layer}, {index} (default '{group}') |
| `keepOriginal` | boolean | No | false | Leave the source layer in place (default false: it is removed once split) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "layer.split_groups",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="category-marker"></a>

## marker

[marker.add_comp](#marker-add_comp) · [marker.add_layer](#marker-add_layer) · [marker.list](#marker-list) · [marker.remove](#marker-remove) · [marker.update](#marker-update)

<a id="marker-add_comp"></a>

### marker.add_comp

Add a marker to a composition at a given time.

Source: [src/operations/marker.ts](../src/operations/marker.ts). Category: `marker`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `time` | number | Yes | — | Time in seconds |
| `comment` | string | No | "" | Marker comment text |
| `label` | number | No | — | Label color index (0-16) |
| `duration` | number | No | — | Marker duration in seconds |
| `chapter` | string | No | — | Chapter link text |
| `url` | string | No | — | Web link URL |
| `frameTarget` | string | No | — | Web link frame target (used with url) |
| `cuePointName` | string | No | — | Flash Video cue point name |
| `eventCuePoint` | boolean | No | — | true = event cue point, false = navigation cue point |
| `params` | object | No | — | Cue point key/value parameters, e.g. { "speaker": "A" } (values stringified) |
| `protectedRegion` | boolean | No | — | Protected-region flag (comp markers only) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "marker.add_comp",
    "args": {
      "comp": "<comp: any>",
      "time": "<time: number>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "marker.add_comp",
    "args": {
      "comp": "Main",
      "time": 1,
      "comment": "Title fully visible"
    }
  }
}
```

<a id="marker-add_layer"></a>

### marker.add_layer

Add a marker to a layer at a given time.

Source: [src/operations/marker.ts](../src/operations/marker.ts). Category: `marker`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `time` | number | Yes | — | Time in seconds |
| `comment` | string | No | "" | Marker comment text |
| `label` | number | No | — | Label color index (0-16) |
| `duration` | number | No | — | Marker duration in seconds |
| `chapter` | string | No | — | Chapter link text |
| `url` | string | No | — | Web link URL |
| `frameTarget` | string | No | — | Web link frame target (used with url) |
| `cuePointName` | string | No | — | Flash Video cue point name |
| `eventCuePoint` | boolean | No | — | true = event cue point, false = navigation cue point |
| `params` | object | No | — | Cue point key/value parameters, e.g. { "speaker": "A" } (values stringified) |
| `protectedRegion` | boolean | No | — | Protected-region flag (comp markers only) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "marker.add_layer",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "time": "<time: number>"
    }
  }
}
```

<a id="marker-list"></a>

### marker.list

List all markers on a comp (default) or a layer (pass layer).

Source: [src/operations/marker.ts](../src/operations/marker.ts). Category: `marker`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | No | — | Layer index or name — omit for comp markers |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "marker.list",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="marker-remove"></a>

### marker.remove

Remove a marker from a comp (default) or a layer (pass layer). Target by keyIndex or nearest time.

Source: [src/operations/marker.ts](../src/operations/marker.ts). Category: `marker`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | No | — | Layer index or name — omit for comp markers |
| `keyIndex` | number | No | — | 1-based marker index |
| `time` | number | No | — | Remove the marker nearest to this time (used when keyIndex omitted) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "marker.remove",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="marker-update"></a>

### marker.update

Update fields of an existing marker on a comp (default) or a layer (pass layer). Target by keyIndex or nearest time. Only the passed fields change.

Source: [src/operations/marker.ts](../src/operations/marker.ts). Category: `marker`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | No | — | Layer index or name — omit for comp markers |
| `keyIndex` | number | No | — | 1-based marker index |
| `time` | number | No | — | Update the marker nearest to this time (used when keyIndex omitted) |
| `comment` | string | No | — | New comment |
| `label` | number | No | — | Label color index (0-16) |
| `duration` | number | No | — | Marker duration in seconds |
| `chapter` | string | No | — | Chapter link text |
| `url` | string | No | — | Web link URL |
| `frameTarget` | string | No | — | Web link frame target (used with url) |
| `cuePointName` | string | No | — | Flash Video cue point name |
| `eventCuePoint` | boolean | No | — | true = event cue point, false = navigation cue point |
| `params` | object | No | — | Cue point key/value parameters, e.g. { "speaker": "A" } (values stringified) |
| `protectedRegion` | boolean | No | — | Protected-region flag (comp markers only) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "marker.update",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

<a id="category-mask"></a>

## mask

[mask.add](#mask-add) · [mask.remove](#mask-remove) · [mask.set_path](#mask-set_path) · [mask.set_props](#mask-set_props)

<a id="mask-add"></a>

### mask.add

Add a new mask to a layer. With shape ('ellipse'|'rect') + size (+ center) the mask path is built right away — mode/inverted can be set in the same call. Returns the mask index; animate the path afterwards with mask.set_path { time }.

Source: [src/operations/mask.ts](../src/operations/mask.ts). Category: `mask`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `name` | string | No | — | Mask name |
| `shape` | string | No | — | ellipse\|rect — build the path from center/size instead of vertices |
| `center` | array | No | — | [x, y] center in layer space (default: source center for footage/solids, [0,0] for shape/text layers) |
| `size` | array | No | — | [width, height] of the ellipse/rect |
| `roundness` | number | No | 0 | Corner radius for rect (default 0) |
| `mode` | string | No | — | Add\|Subtract\|Intersect\|Lighten\|Darken\|Difference\|None |
| `inverted` | boolean | No | — | Invert the mask |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "mask.add",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "mask.add",
    "args": {
      "comp": "Main",
      "layer": "Panel",
      "name": "Reveal",
      "shape": "rect",
      "center": [
        0,
        0
      ],
      "size": [
        800,
        300
      ],
      "mode": "Add"
    }
  }
}
```

<a id="mask-remove"></a>

### mask.remove

Remove a mask from a layer by its 1-based index.

Source: [src/operations/mask.ts](../src/operations/mask.ts). Category: `mask`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `maskIndex` | number | Yes | — | 1-based mask index |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "mask.remove",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "maskIndex": "<maskIndex: number>"
    }
  }
}
```

<a id="mask-set_path"></a>

### mask.set_path

Set a mask's path — from vertices (+ tangents), or geometrically from shape ('ellipse'|'rect') + size (+ center, roundness). With `time` the path is written as a keyframe, so two calls (small size at t0, large at t1) make a wipe. Vertices/center are in layer space.

Source: [src/operations/mask.ts](../src/operations/mask.ts). Category: `mask`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `maskIndex` | number | Yes | — | 1-based mask index |
| `vertices` | array | No | — | Array of [x,y] points (omit when using shape/size) |
| `shape` | string | No | — | ellipse\|rect — build the path from center/size instead of vertices |
| `center` | array | No | — | [x, y] center in layer space (default: source center for footage/solids, [0,0] for shape/text layers) |
| `size` | array | No | — | [width, height] of the ellipse/rect |
| `roundness` | number | No | 0 | Corner radius for rect (default 0) |
| `time` | number | No | — | Write the path as a keyframe at this time instead of the static value |
| `inTangents` | array | No | — | Array of [x,y] in-tangent offsets (same length as vertices) |
| `outTangents` | array | No | — | Array of [x,y] out-tangent offsets |
| `closed` | boolean | No | true | Close the path (default true) |
| `featherSegLocs` | array | No | — | Variable-width feather: 0-based segment index per feather point |
| `featherRelSegLocs` | array | No | — | Variable-width feather: relative position (0-1) on the segment, per point |
| `featherRadii` | array | No | — | Variable-width feather: radius in px per point. Sign must match featherTypes: outer points (type 0) need radius >= 0, inner points (type 1) need radius <= 0 — AE rejects mismatches |
| `featherInterps` | array | No | — | Variable-width feather: 0=smooth, 1=hold, per point (default all 0) |
| `featherTensions` | array | No | — | Variable-width feather: tension 0-1 per point (default all 0) |
| `featherTypes` | array | No | — | Variable-width feather: 0=outer, 1=inner, per point (default all 0) |
| `featherRelCornerAngles` | array | No | — | Variable-width feather: relative corner angle % per point (default all 0) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "mask.set_path",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "maskIndex": "<maskIndex: number>"
    }
  }
}
```

<a id="mask-set_props"></a>

### mask.set_props

Set mask properties: mode, feather, opacity, expansion, inverted, locked, color, rotoBezier, motionBlur, featherFalloff.

Source: [src/operations/mask.ts](../src/operations/mask.ts). Category: `mask`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `maskIndex` | number | Yes | — | 1-based mask index |
| `mode` | string | No | — | Add\|Subtract\|Intersect\|Lighten\|Darken\|Difference\|None |
| `feather` | array | No | — | [x,y] feather in px |
| `opacity` | number | No | — | Mask opacity 0-100 |
| `expansion` | number | No | — | Mask expansion in px |
| `inverted` | boolean | No | — | Invert the mask |
| `locked` | boolean | No | — | Lock the mask against UI editing |
| `color` | array | No | — | [r,g,b] 0-1 mask outline color in the UI |
| `rotoBezier` | boolean | No | — | Treat the path as a RotoBezier (tangents auto-computed) |
| `motionBlur` | string | No | — | sameAsLayer\|on\|off (per-mask motion blur) |
| `featherFalloff` | string | No | — | smooth\|linear (feather falloff) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "mask.set_props",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "maskIndex": "<maskIndex: number>"
    }
  }
}
```

<a id="category-pref"></a>

## pref

[pref.delete](#pref-delete) · [pref.get](#pref-get) · [pref.get_setting](#pref-get_setting) · [pref.set](#pref-set) · [pref.set_setting](#pref-set_setting)

<a id="pref-delete"></a>

### pref.delete

Delete one After Effects preference (app.preferences.deletePref).

Source: [src/operations/pref.ts](../src/operations/pref.ts). Category: `pref`. Read-only classification: **false**. Execution: **ExtendScript**. Requires explicitly authorized **confirm: true**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `section` | string | Yes | — | Preference section name |
| `key` | string | Yes | — | Preference key name |
| `prefType` | string | No | — | Preferences file: machineSpecific (default) \| machineIndependent \| machineIndependentRender \| machineIndependentOutput \| machineIndependentComposition \| machineSpecificText \| machineSpecificPaint |
| `confirm` | boolean | Yes | — | Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "pref.delete",
    "args": {
      "section": "<section: string>",
      "key": "<key: string>",
      "confirm": "<confirm: boolean>"
    }
  }
}
```

<a id="pref-get"></a>

### pref.get

Read one After Effects preference (app.preferences.getPrefAs*). Section/key names match the prefs file, e.g. section "Main Pref Section v2", key "Pref_SCOPES_ENABLE_DYNAMIC_PEAK". Returns exists=false instead of failing when the pref is absent.

Source: [src/operations/pref.ts](../src/operations/pref.ts). Category: `pref`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `section` | string | Yes | — | Preference section name |
| `key` | string | Yes | — | Preference key name |
| `type` | string | No | "string" | string\|bool\|float\|long (default string) |
| `prefType` | string | No | — | Preferences file: machineSpecific (default) \| machineIndependent \| machineIndependentRender \| machineIndependentOutput \| machineIndependentComposition \| machineSpecificText \| machineSpecificPaint |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "pref.get",
    "args": {
      "section": "<section: string>",
      "key": "<key: string>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "pref.get",
    "args": {
      "section": "Main Pref Section v2",
      "key": "Pref_SCRIPTING_FILE_NETWORK_SECURITY",
      "type": "long"
    }
  }
}
```

<a id="pref-get_setting"></a>

### pref.get_setting

Read a script-scoped setting (app.settings.getSetting) — the persistent key/value store AE offers to scripts, separate from application preferences.

Source: [src/operations/pref.ts](../src/operations/pref.ts). Category: `pref`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `section` | string | Yes | — | Settings section name |
| `key` | string | Yes | — | Settings key name |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "pref.get_setting",
    "args": {
      "section": "<section: string>",
      "key": "<key: string>"
    }
  }
}
```

<a id="pref-set"></a>

### pref.set

Write one After Effects preference (app.preferences.savePrefAs*) and flush to disk. A wrong value can misconfigure AE until preferences are reset — read the current value with pref.get first.

Source: [src/operations/pref.ts](../src/operations/pref.ts). Category: `pref`. Read-only classification: **false**. Execution: **ExtendScript**. Requires explicitly authorized **confirm: true**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `section` | string | Yes | — | Preference section name |
| `key` | string | Yes | — | Preference key name |
| `value` | any | Yes | — | Value to write (matching `type`) |
| `type` | string | No | — | string\|bool\|float\|long (default: inferred from the value) |
| `prefType` | string | No | — | Preferences file: machineSpecific (default) \| machineIndependent \| machineIndependentRender \| machineIndependentOutput \| machineIndependentComposition \| machineSpecificText \| machineSpecificPaint |
| `persist` | boolean | No | true | Flush prefs to disk immediately (default true) |
| `confirm` | boolean | Yes | — | Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "pref.set",
    "args": {
      "section": "<section: string>",
      "key": "<key: string>",
      "value": "<value: any>",
      "confirm": "<confirm: boolean>"
    }
  }
}
```

<a id="pref-set_setting"></a>

### pref.set_setting

Write a script-scoped setting (app.settings.saveSetting). Values are stored as strings.

Source: [src/operations/pref.ts](../src/operations/pref.ts). Category: `pref`. Read-only classification: **false**. Execution: **ExtendScript**. Requires explicitly authorized **confirm: true**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `section` | string | Yes | — | Settings section name |
| `key` | string | Yes | — | Settings key name |
| `value` | string | Yes | — | Value to store |
| `confirm` | boolean | Yes | — | Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "pref.set_setting",
    "args": {
      "section": "<section: string>",
      "key": "<key: string>",
      "value": "<value: string>",
      "confirm": "<confirm: boolean>"
    }
  }
}
```

<a id="category-project"></a>

## project

[project.auto_fix_expressions](#project-auto_fix_expressions) · [project.clear](#project-clear) · [project.consolidate_footage](#project-consolidate_footage) · [project.delete_item](#project-delete_item) · [project.find_layers](#project-find_layers) · [project.get_settings](#project-get_settings) · [project.get_tool](#project-get_tool) · [project.get_xmp](#project-get_xmp) · [project.import_file](#project-import_file) · [project.import_placeholder](#project-import_placeholder) · [project.list_effects](#project-list_effects) · [project.merge](#project-merge) · [project.new](#project-new) · [project.open](#project-open) · [project.parse_swatch](#project-parse_swatch) · [project.purge](#project-purge) · [project.reduce](#project-reduce) · [project.remove_unused_footage](#project-remove_unused_footage) · [project.rename](#project-rename) · [project.replace_font](#project-replace_font) · [project.set_default_import_folder](#project-set_default_import_folder) · [project.set_memory_limits](#project-set_memory_limits) · [project.set_multi_frame_rendering](#project-set_multi_frame_rendering) · [project.set_settings](#project-set_settings) · [project.set_tool](#project-set_tool) · [project.set_xmp](#project-set_xmp) · [project.undo](#project-undo)

<a id="project-auto_fix_expressions"></a>

### project.auto_fix_expressions

Find and replace text in all expressions across the project. Useful after renaming layers/comps.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `oldText` | string | Yes | — | Text to find in expressions |
| `newText` | string | Yes | — | Replacement text |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.auto_fix_expressions",
    "args": {
      "oldText": "<oldText: string>",
      "newText": "<newText: string>"
    }
  }
}
```

<a id="project-clear"></a>

### project.clear

Remove ALL items from the project. Destructive — use with caution.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.clear",
    "args": {}
  }
}
```

<a id="project-consolidate_footage"></a>

### project.consolidate_footage

Merge duplicate footage items into one and update layer references (Project.consolidateFootage).

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.consolidate_footage",
    "args": {}
  }
}
```

<a id="project-delete_item"></a>

### project.delete_item

Delete a project item by id.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `itemId` | number | Yes | — | Numeric item id |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.delete_item",
    "args": {
      "itemId": "<itemId: number>"
    }
  }
}
```

<a id="project-find_layers"></a>

### project.find_layers

Search layers by name pattern and/or type across one or all comps.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | No | — | Restrict to one comp (name or id). Omit to search all. |
| `namePattern` | string | No | — | Case-insensitive substring match on layer name |
| `type` | string | No | — | AVLayer\|TextLayer\|ShapeLayer\|CameraLayer\|LightLayer\|ThreeDModelLayer\|ParametricMeshLayer |
| `limit` | number | No | 100 | Max results (default 100) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.find_layers",
    "args": {}
  }
}
```

<a id="project-get_settings"></a>

### project.get_settings

Read project-wide settings: color depth, expression engine, working color space, time display. Pass includeColorProfiles=true to list installed color profile names.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `includeColorProfiles` | boolean | No | false | Also return installed color profile names (default false) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.get_settings",
    "args": {}
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.get_settings",
    "args": {}
  }
}
```

<a id="project-get_tool"></a>

### project.get_tool

Read the active tool in the Tools panel (Project.toolType, AE 14.0+).

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.get_tool",
    "args": {}
  }
}
```

<a id="project-get_xmp"></a>

### project.get_xmp

Read the project's XMP metadata packet (Project.xmpPacket) as an RDF/XML string.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.get_xmp",
    "args": {}
  }
}
```

<a id="project-import_file"></a>

### project.import_file

Import a file (image, video, audio) into the project as footage. Pass sequence=true with the first file of an image sequence to import the whole sequence.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `path` | string | Yes | — | Absolute file path |
| `name` | string | No | — | Rename the imported item |
| `sequence` | boolean | No | false | Import as image sequence starting at path (default false) |
| `forceAlphabetical` | boolean | No | — | Sequence only: force alphabetical order (default false) |
| `importAs` | string | No | — | footage\|comp\|compRetainLayerSizes\|project — for layered files like .psd/.ai (default footage) |
| `rangeStart` | number | No | — | Sequence only: first frame number to import (ImportOptions.rangeStart) |
| `rangeEnd` | number | No | — | Sequence only: last frame number to import (ImportOptions.rangeEnd) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.import_file",
    "args": {
      "path": "<path: string>"
    }
  }
}
```

<a id="project-import_placeholder"></a>

### project.import_placeholder

Create a placeholder footage item (Project.importPlaceholder) to build comps before the real footage exists. Relink later with footage.replace.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `name` | string | Yes | — | Placeholder name |
| `width` | number | Yes | — | Width in px |
| `height` | number | Yes | — | Height in px |
| `frameRate` | number | Yes | — | Frame rate |
| `duration` | number | Yes | — | Duration in seconds |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.import_placeholder",
    "args": {
      "name": "<name: string>",
      "width": "<width: number>",
      "height": "<height: number>",
      "frameRate": "<frameRate: number>",
      "duration": "<duration: number>"
    }
  }
}
```

<a id="project-list_effects"></a>

### project.list_effects

List available effect matchNames in the running AE. Uses app.effects if available, otherwise a curated list.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.list_effects",
    "args": {}
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.list_effects",
    "args": {}
  }
}
```

<a id="project-merge"></a>

### project.merge

Import another .aep into the current project as a folder (After Effects' own project import): every comp, footage item and folder of `path` lands under one new folder with names preserved, and nothing already in the project is touched. This is how work done in another instance comes back — save there, merge here, then move or swap comps as needed (project.delete_item / item ops). Returns the folder and the comps and items it now holds.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `path` | string | Yes | — | Absolute .aep path (saved by the other instance) |
| `folderName` | string | No | — | Rename the imported folder (default: the .aep's file name) |
| `parentFolder` | any | No | — | Folder (id or name) to put the imported folder into (default: project root) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.merge",
    "args": {
      "path": "<path: string>"
    }
  }
}
```

<a id="project-new"></a>

### project.new

Create a NEW empty project (app.newProject). Refuses to replace unsaved work unless save=true succeeds or discardUnsaved=true is explicit.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `save` | boolean | No | false | Save the current project before closing (default false; needs a file path) |
| `discardUnsaved` | boolean | No | false | Explicitly discard current unsaved work (default false) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.new",
    "args": {}
  }
}
```

<a id="project-open"></a>

### project.open

Open a .aep project file. Refuses to replace unsaved work unless save=true succeeds or discardUnsaved=true is explicit.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `path` | string | Yes | — | Absolute path to .aep file |
| `save` | boolean | No | false | Save current project before closing (requires an existing file path; default false) |
| `discardUnsaved` | boolean | No | false | Explicitly discard current unsaved work (default false) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.open",
    "args": {
      "path": "<path: string>"
    }
  }
}
```

<a id="project-parse_swatch"></a>

### project.parse_swatch

Parse an Adobe swatch file (.ase) and return its colors (app.parseSwatchFile) - feed brand palettes to fills, solids, and text colors.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `path` | string | Yes | — | Absolute path to the .ase file |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.parse_swatch",
    "args": {
      "path": "<path: string>"
    }
  }
}
```

<a id="project-purge"></a>

### project.purge

Purge AE memory/disk caches. Use when AE is consuming too much RAM.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `target` | string | No | "all" | all\|image\|undo (default 'all') |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.purge",
    "args": {}
  }
}
```

<a id="project-reduce"></a>

### project.reduce

Reduce the project to only the given comps and everything they use (Project.reduceProject). Removes all other items — save a copy first.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comps` | array | Yes | — | Comp names or ids to keep |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.reduce",
    "args": {
      "comps": "<comps: array>"
    }
  }
}
```

<a id="project-remove_unused_footage"></a>

### project.remove_unused_footage

Remove all footage items that are not used in any comp (Project.removeUnusedFootage).

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.remove_unused_footage",
    "args": {}
  }
}
```

<a id="project-rename"></a>

### project.rename

Rename project items and/or layers in bulk: an exact `map` ({ from: to }) or a regex `pattern` + `replacement` ($1 works). scope 'items' covers comps, footage and folders; 'layers' covers layers in every comp (or the comps matched by `comp`). dryRun previews without renaming.

Source: [src/operations/layout.ts](../src/operations/layout.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `scope` | string | No | "all" | items\|layers\|all (default all) |
| `map` | object | No | — | { 'old name': 'new name', … } |
| `pattern` | string | No | — | Regular expression (JavaScript syntax) applied to each name |
| `replacement` | string | No | — | Replacement for `pattern` matches ($1… for groups) |
| `flags` | string | No | "g" | Regex flags: any of g, i, m (default 'g') |
| `comp` | any | No | — | Restrict layer renames to these comps (name/id/pattern/array; default all) |
| `itemTypes` | array | No | — | Restrict item renames to these types: CompItem\|FootageItem\|FolderItem |
| `dryRun` | boolean | No | false | Report what would change without renaming (default false) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.rename",
    "args": {}
  }
}
```

<a id="project-replace_font"></a>

### project.replace_font

Replace a font throughout the entire project. Useful for font substitution.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `fromFont` | string | Yes | — | Current font postscript name to replace |
| `toFont` | string | Yes | — | New font postscript name |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.replace_font",
    "args": {
      "fromFont": "<fromFont: string>",
      "toFont": "<toFont: string>"
    }
  }
}
```

<a id="project-set_default_import_folder"></a>

### project.set_default_import_folder

Set the folder shown by default in the file import dialog (Project.setDefaultImportFolder).

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**. Requires explicitly authorized **confirm: true**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `path` | string | Yes | — | Absolute folder path |
| `confirm` | boolean | Yes | — | Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.set_default_import_folder",
    "args": {
      "path": "<path: string>",
      "confirm": "<confirm: boolean>"
    }
  }
}
```

<a id="project-set_memory_limits"></a>

### project.set_memory_limits

Set AE memory usage limits (app.setMemoryUsageLimits): image cache percent and maximum memory percent. Percentages over 100 are allowed (AE interprets them against installed RAM).

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**. Requires explicitly authorized **confirm: true**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `imageCachePercent` | number | Yes | — | Image cache size as % of installed RAM |
| `maxMemoryPercent` | number | Yes | — | Maximum AE memory as % of installed RAM |
| `confirm` | boolean | Yes | — | Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.set_memory_limits",
    "args": {
      "imageCachePercent": "<imageCachePercent: number>",
      "maxMemoryPercent": "<maxMemoryPercent: number>",
      "confirm": "<confirm: boolean>"
    }
  }
}
```

<a id="project-set_multi_frame_rendering"></a>

### project.set_multi_frame_rendering

Configure Multi-Frame Rendering (app.setMultiFrameRenderingConfig, AE 22.0+): on/off and the maximum CPU percentage MFR may use.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**. Requires explicitly authorized **confirm: true**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `enabled` | boolean | Yes | — | Enable MFR |
| `maxCpuPercent` | number | No | 90 | Max CPU % for MFR (1-100, default 90) |
| `confirm` | boolean | Yes | — | Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.set_multi_frame_rendering",
    "args": {
      "enabled": "<enabled: boolean>",
      "confirm": "<confirm: boolean>"
    }
  }
}
```

<a id="project-set_settings"></a>

### project.set_settings

Set project-wide settings: color depth, expression engine, working color space, time display.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `bitsPerChannel` | number | No | — | Color depth: 8, 16, or 32 |
| `expressionEngine` | string | No | — | 'javascript-1.0' or 'extendscript' |
| `workingSpace` | string | No | — | Working color space name (see project.get_settings includeColorProfiles), or '' for None |
| `workingGamma` | number | No | — | Working gamma: 2.2 or 2.4 |
| `linearBlending` | boolean | No | — | Blend colors using 1.0 gamma |
| `timeDisplayType` | string | No | — | timecode\|frames |
| `framesUseFeetFrames` | boolean | No | — | Use feet+frames for frame display |
| `framesCountType` | string | No | — | start0\|start1\|timecode |
| `transparencyGridThumbnails` | boolean | No | — | Show checkerboard in thumbnails |
| `gpuAccelType` | string | No | — | software\|opencl\|cuda\|metal |
| `linearizeWorkingSpace` | boolean | No | — | Linearize the working color space (AE 16.0+) |
| `compensateForSceneReferredProfiles` | boolean | No | — | Compensate for scene-referred profiles (AE 16.0+) |
| `displayStartFrame` | number | No | — | Frame count starts at 0 or 1 (when counting frames) |
| `feetFramesFilmType` | string | No | — | mm16\|mm35 (film type for feet+frames display) |
| `footageTimecodeDisplayStartType` | string | No | — | start0\|useSourceMedia (footage timecode start) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.set_settings",
    "args": {}
  }
}
```

<a id="project-set_tool"></a>

### project.set_tool

Set the active tool in the Tools panel (Project.toolType, AE 14.0+): selection|rotate|hand|zoom|panBehind|rect|roundedRect|ellipse|polygon|star|textHorizontal|textVertical|pen|maskFeather|brush|cloneStamp|eraser|puppetPin|puppetStarch|puppetBend|puppetAdvanced|puppetOverlap|cameraUnified|cameraOrbit|cameraTrackXY|cameraTrackZ|cameraOrbitCursor|cameraOrbitScene|cameraOrbitCamera|cameraPanCursor.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**. Requires explicitly authorized **confirm: true**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `tool` | string | Yes | — | Tool name (see description) |
| `confirm` | boolean | Yes | — | Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.set_tool",
    "args": {
      "tool": "<tool: string>",
      "confirm": "<confirm: boolean>"
    }
  }
}
```

<a id="project-set_xmp"></a>

### project.set_xmp

Replace the project's XMP metadata packet (Project.xmpPacket). Pass a complete, well-formed RDF/XML packet - AE does not validate fragments.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `xmp` | string | Yes | — | Complete XMP packet (RDF/XML) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.set_xmp",
    "args": {
      "xmp": "<xmp: string>"
    }
  }
}
```

<a id="project-undo"></a>

### project.undo

Undo the last action. Equivalent to Ctrl+Z. Each prior ae_do call is ONE undo step (its automatic undo group), so count=1 reverts the whole previous call, batch included.

Source: [src/operations/project.ts](../src/operations/project.ts). Category: `project`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `count` | number | No | 1 | Number of undos (default 1) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "project.undo",
    "args": {}
  }
}
```

<a id="category-property"></a>

## property

[property.add](#property-add) · [property.get](#property-get) · [property.list](#property-list) · [property.move](#property-move) · [property.remove](#property-remove) · [property.select](#property-select) · [property.separate_dimensions](#property-separate_dimensions) · [property.set](#property-set)

<a id="property-add"></a>

### property.add

Add a property to an indexed group by matchName (PropertyGroup.addProperty). Unlocks text animators ('ADBE Text Animator' on ["Text","Animators"]), layer styles, shape contents, etc. Use property.list to discover group paths.

Source: [src/operations/property.ts](../src/operations/property.ts). Category: `property`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Path to the group to add into, e.g. ["Text","Animators"]. Use [] for layer root. |
| `matchName` | string | Yes | — | Match name (or display name) of the property to add, e.g. "ADBE Text Animator". NOTE: adding to an indexed group re-creates it, invalidating prior property references. |
| `name` | string | No | — | Rename the new property |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "property.add",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "matchName": "<matchName: string>"
    }
  }
}
```

<a id="property-get"></a>

### property.get

Get the current value of any layer property by path.

Source: [src/operations/property.ts](../src/operations/property.ts). Category: `property`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `time` | number | No | — | If set, get value at this time (for animated properties) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "property.get",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "property.get",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "property": [
        "ADBE Transform Group",
        "ADBE Opacity"
      ],
      "time": 1
    }
  }
}
```

<a id="property-list"></a>

### property.list

List child properties/groups at a given path. Useful for discovering what's inside a property group.

Source: [src/operations/property.ts](../src/operations/property.ts). Category: `property`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path to a group. Use [] for the layer root. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "property.list",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>"
    }
  }
}
```

<a id="property-move"></a>

### property.move

Reorder a property within its parent INDEXED group (PropertyBase.moveTo): masks, shape contents, text animators. For effects use effect.move.

Source: [src/operations/property.ts](../src/operations/property.ts). Category: `property`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Path to the property to move (a member of an indexed group) |
| `toIndex` | number | Yes | — | 1-based target position within the parent group |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "property.move",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "toIndex": "<toIndex: number>"
    }
  }
}
```

<a id="property-remove"></a>

### property.remove

Remove a property or group by path (Property.remove). Works on members of indexed groups: effects, masks, shape contents, text animators, layer styles.

Source: [src/operations/property.ts](../src/operations/property.ts). Category: `property`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Path to the property to remove |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "property.remove",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>"
    }
  }
}
```

<a id="property-select"></a>

### property.select

Select or deselect a property in the timeline (PropertyBase.selected) - stages it for UI-side actions and makes it visible with the U-shortcut workflow.

Source: [src/operations/property.ts](../src/operations/property.ts). Category: `property`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path |
| `selected` | boolean | No | true | true=select, false=deselect (default true) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "property.select",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>"
    }
  }
}
```

<a id="property-separate_dimensions"></a>

### property.separate_dimensions

Separate (or rejoin) the dimensions of a multi-dimensional property such as Position. When separated, animate the followers (e.g. X Position) individually.

Source: [src/operations/property.ts](../src/operations/property.ts). Category: `property`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `property` | array | Yes | — | Property path (e.g. Position) |
| `separated` | boolean | Yes | — | true=separate, false=rejoin |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "property.separate_dimensions",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "separated": "<separated: boolean>"
    }
  }
}
```

<a id="property-set"></a>

### property.set

Set any layer property by path. layer can be index, name, 'selected', or 'all'.

Source: [src/operations/property.ts](../src/operations/property.ts). Category: `property`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | Layer index, name, 'selected', or 'all' |
| `property` | array | Yes | — | Property path, e.g. ["Transform","Position"] |
| `value` | any | Yes | — | Value to set |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "property.set",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "property": "<property: array>",
      "value": "<value: any>"
    }
  }
}
```

<a id="category-render"></a>

## render

[render.add_to_queue](#render-add_to_queue) · [render.clear_queue](#render-clear_queue) · [render.duplicate_item](#render-duplicate_item) · [render.frame](#render-frame) · [render.get_settings](#render-get_settings) · [render.list_templates](#render-list_templates) · [render.queue_in_ame](#render-queue_in_ame) · [render.remove_item](#render-remove_item) · [render.save_template](#render-save_template) · [render.set_om_settings](#render-set_om_settings) · [render.set_output](#render-set_output) · [render.set_settings](#render-set_settings) · [render.start](#render-start) · [render.status](#render-status) · [render.variants](#render-variants)

<a id="render-add_to_queue"></a>

### render.add_to_queue

Add a composition to the render queue. Optionally set output path.

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `outputPath` | string | No | — | Output file path (optional, sets on the first output module) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.add_to_queue",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.add_to_queue",
    "args": {
      "comp": "Main",
      "outputPath": "C:/AE-output/Main.mov"
    }
  }
}
```

<a id="render-clear_queue"></a>

### render.clear_queue

Remove all items from the render queue.

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.clear_queue",
    "args": {}
  }
}
```

<a id="render-duplicate_item"></a>

### render.duplicate_item

Duplicate a render-queue item (RenderQueueItem.duplicate) — e.g. to render the same comp with a second settings/output combination.

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `queueIndex` | number | No | — | 1-based queue item index (default: last item) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.duplicate_item",
    "args": {}
  }
}
```

<a id="render-frame"></a>

### render.frame

Render one frame to PNG (raw saveFrameToPng). As the LAST child of a batch.run, one call mutates and hands back visual proof. outPath must be absolute; raise ae_do's timeoutMs for slow renders. CAUTION: in color-managed projects (project.get_settings workingSpace != 'None') this writes raw working-space values that look dark/wrong — use the ae_render_frame TOOL there, which converts to display sRGB.

Source: [src/operations/inspect.ts](../src/operations/inspect.ts). Category: `render`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `time` | number | Yes | — | Time in seconds to render |
| `outPath` | string | Yes | — | Absolute path for the PNG (parent directories are created) |
| `useDisplayStartTime` | boolean | No | — | Interpret `time` relative to comp.displayStartTime (default false) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.frame",
    "args": {
      "comp": "<comp: any>",
      "time": "<time: number>",
      "outPath": "<outPath: string>"
    }
  }
}
```

<a id="render-get_settings"></a>

### render.get_settings

Read the raw render settings of a queue item and the settings of each of its output modules (getSettings, AE 13.0+). format 'settable' returns only keys accepted by render.set_settings / render.set_om_settings.

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `queueIndex` | number | No | — | 1-based queue item index (default: last item) |
| `format` | string | No | "settable" | settable\|all (default settable) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.get_settings",
    "args": {}
  }
}
```

<a id="render-list_templates"></a>

### render.list_templates

List available render-settings templates and output-module templates. The render queue must have at least one item (templates are read from a queue item).

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.list_templates",
    "args": {}
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.list_templates",
    "args": {}
  }
}
```

<a id="render-queue_in_ame"></a>

### render.queue_in_ame

Send the render queue to Adobe Media Encoder (for H.264/HEVC etc.). Requires AME installed. renderImmediately=true starts the AME queue.

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `renderImmediately` | boolean | No | false | Start rendering in AME right away (default false) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.queue_in_ame",
    "args": {}
  }
}
```

<a id="render-remove_item"></a>

### render.remove_item

Remove ONE item from the render queue by its 1-based index (render.clear_queue removes all).

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `queueIndex` | number | Yes | — | 1-based queue item index (explicit — no default for a destructive op) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.remove_item",
    "args": {
      "queueIndex": "<queueIndex: number>"
    }
  }
}
```

<a id="render-save_template"></a>

### render.save_template

Save a queue item's current render settings, or an output module's current settings, as a named template (saveAsTemplate) for reuse via render.set_output.

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **false**. Execution: **ExtendScript**. Requires explicitly authorized **confirm: true**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `type` | string | Yes | — | render (RenderQueueItem settings) \| output (OutputModule settings) |
| `name` | string | Yes | — | Template name to save under |
| `queueIndex` | number | No | — | 1-based queue item index (default: last item) |
| `outputModuleIndex` | number | No | 1 | 1-based output module index (type=output only, default 1) |
| `confirm` | boolean | Yes | — | Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.save_template",
    "args": {
      "type": "<type: string>",
      "name": "<name: string>",
      "confirm": "<confirm: boolean>"
    }
  }
}
```

<a id="render-set_om_settings"></a>

### render.set_om_settings

Set raw output-module settings on a queue item (OutputModule.setSettings, AE 13.0+), e.g. { "Format": "QuickTime", "Channels": "RGB + Alpha" }. Discover valid keys/values with render.get_settings.

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `queueIndex` | number | No | — | 1-based queue item index (default: last item) |
| `outputModuleIndex` | number | No | 1 | 1-based output module index (default 1) |
| `settings` | object | Yes | — | Key/value map from render.get_settings format 'settable' |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.set_om_settings",
    "args": {
      "settings": "<settings: object>"
    }
  }
}
```

<a id="render-set_output"></a>

### render.set_output

Configure a render-queue item: render/output templates, output path, time span, render flag, skipFrames, logType, postRenderAction. Discover template names with render.list_templates; raw settings via render.get_settings / render.set_settings.

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `queueIndex` | number | No | — | 1-based queue item index (default: last item) |
| `renderTemplate` | string | No | — | Render settings template name (e.g. "Best Settings", "Draft Settings") |
| `outputTemplate` | string | No | — | Output module template name (e.g. "Lossless", "High Quality") |
| `outputPath` | string | No | — | Output file path |
| `timeSpanStart` | number | No | — | Render span start in seconds (comp time) |
| `timeSpanDuration` | number | No | — | Render span duration in seconds |
| `outputModuleIndex` | number | No | 1 | 1-based output module index (default 1) |
| `render` | boolean | No | — | Whether this item renders when the queue starts (the Render checkbox) |
| `skipFrames` | number | No | — | Render every Nth frame (0 = every frame) |
| `logType` | string | No | — | errorsOnly\|errorsAndSettings\|errorsAndPerFrameInfo |
| `postRenderAction` | string | No | — | none\|import\|importAndReplaceUsage\|setProxy (on the output module) |
| `includeSourceXMP` | boolean | No | — | Embed source-footage XMP metadata in the output |
| `queueItemNotify` | boolean | No | — | Per-item Notify checkbox (AE 22.0+) |
| `queueNotify` | boolean | No | — | QUEUE-WIDE Notify checkbox (RenderQueue.queueNotify, AE 22.0+) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.set_output",
    "args": {}
  }
}
```

<a id="render-set_settings"></a>

### render.set_settings

Set raw render settings on a queue item (RenderQueueItem.setSettings, AE 13.0+), e.g. { "Quality": "Best", "Resolution": "Half" }. Discover valid keys/values with render.get_settings.

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `queueIndex` | number | No | — | 1-based queue item index (default: last item) |
| `settings` | object | Yes | — | Key/value map from render.get_settings format 'settable' |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.set_settings",
    "args": {
      "settings": "<settings: object>"
    }
  }
}
```

<a id="render-start"></a>

### render.start

Start rendering the render queue. Blocks until complete. Missing output directories are created first (AE itself fails with 'Directory does not exist').

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.start",
    "args": {}
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.start",
    "args": {}
  }
}
```

<a id="render-status"></a>

### render.status

Report the render queue state: per-item status, time spans, and output paths.

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.status",
    "args": {}
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.status",
    "args": {}
  }
}
```

<a id="render-variants"></a>

### render.variants

Render the same comp several times with different property values — a slider that switches a state, a text that changes per version — in ONE call. Each variant sets its values (static properties only; keyed ones are refused), renders through a temporary queue item to outputPath with {name}/{index} substituted, then the original values are restored. Other queue items are not rendered. Blocks until done: raise timeoutMs.

Source: [src/operations/render.ts](../src/operations/render.ts). Category: `render`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `variants` | array | Yes | — | [{ name, sets: [{ layer, property, value }, …] }, …] — e.g. [{ name: "A", sets: [{ layer: "Ctrl", property: ["Effects","Slider Control","Slider"], value: 1 }] }] |
| `outputPath` | string | Yes | — | Output file path template; {name} and {index} are replaced per variant |
| `renderTemplate` | string | No | — | Render settings template name |
| `outputTemplate` | string | No | — | Output module template name |
| `timeSpanStart` | number | No | — | Render span start in seconds |
| `timeSpanDuration` | number | No | — | Render span duration in seconds |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "render.variants",
    "args": {
      "comp": "<comp: any>",
      "variants": "<variants: array>",
      "outputPath": "<outputPath: string>"
    }
  }
}
```

<a id="category-shape"></a>

## shape

[shape.add_ellipse](#shape-add_ellipse) · [shape.add_fill](#shape-add_fill) · [shape.add_gradient_fill](#shape-add_gradient_fill) · [shape.add_gradient_stroke](#shape-add_gradient_stroke) · [shape.add_group](#shape-add_group) · [shape.add_merge_paths](#shape-add_merge_paths) · [shape.add_offset_paths](#shape-add_offset_paths) · [shape.add_path](#shape-add_path) · [shape.add_polystar](#shape-add_polystar) · [shape.add_pucker_bloat](#shape-add_pucker_bloat) · [shape.add_rect](#shape-add_rect) · [shape.add_repeater](#shape-add_repeater) · [shape.add_rounded_corners](#shape-add_rounded_corners) · [shape.add_stroke](#shape-add_stroke) · [shape.add_trim_paths](#shape-add_trim_paths) · [shape.add_twist](#shape-add_twist) · [shape.add_wiggle_paths](#shape-add_wiggle_paths) · [shape.add_wiggle_transform](#shape-add_wiggle_transform) · [shape.add_zigzag](#shape-add_zigzag) · [shape.group_bounds](#shape-group_bounds) · [shape.recolor](#shape-recolor) · [shape.signature](#shape-signature)

<a id="shape-add_ellipse"></a>

### shape.add_ellipse

Add an Ellipse Path to a shape group.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `size` | array | Yes | — | [width, height] |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_ellipse",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>",
      "size": "<size: array>"
    }
  }
}
```

<a id="shape-add_fill"></a>

### shape.add_fill

Add a Fill to a shape group.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `color` | array | Yes | — | [r,g,b,a] 0-1 |
| `opacity` | number | No | 100 | Opacity 0-100 |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_fill",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>",
      "color": "<color: array>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_fill",
    "args": {
      "comp": "Main",
      "layer": "Panel",
      "groupIndex": 1,
      "color": [
        0.055,
        0.08,
        0.14,
        1
      ]
    }
  }
}
```

<a id="shape-add_gradient_fill"></a>

### shape.add_gradient_fill

Add a Gradient Fill to a shape group. Type and start/end points are scriptable; color stops are NOT scriptable in AE (defaults to white-to-black — edit stops manually or via a preset).

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `gradientType` | string | No | "linear" | linear\|radial (default linear) |
| `startPoint` | array | No | — | Gradient start [x, y] |
| `endPoint` | array | No | — | Gradient end [x, y] |
| `opacity` | number | No | — | Opacity 0-100 |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_gradient_fill",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-add_gradient_stroke"></a>

### shape.add_gradient_stroke

Add a Gradient Stroke to a shape group. Type, points, and width are scriptable; color stops are NOT scriptable in AE.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `gradientType` | string | No | "linear" | linear\|radial (default linear) |
| `startPoint` | array | No | — | Gradient start [x, y] |
| `endPoint` | array | No | — | Gradient end [x, y] |
| `width` | number | No | 2 | Stroke width |
| `opacity` | number | No | — | Opacity 0-100 |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_gradient_stroke",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-add_group"></a>

### shape.add_group

Add a Vector Group to a shape layer's Contents.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index or name (must be a shape layer) |
| `name` | string | No | — | Group name |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_group",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_group",
    "args": {
      "comp": "Main",
      "layer": "Panel",
      "name": "Card"
    }
  }
}
```

<a id="shape-add_merge_paths"></a>

### shape.add_merge_paths

Add Merge Paths to a shape group for combining/subtracting shapes.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `mode` | string | No | "merge" | merge\|add\|subtract\|intersect\|excludeIntersections |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_merge_paths",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-add_offset_paths"></a>

### shape.add_offset_paths

Add Offset Paths to a shape group (grow/shrink outlines).

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `amount` | number | No | 10 | Offset in px (positive grows, negative shrinks) |
| `lineJoin` | string | No | — | miter\|round\|bevel (default miter) |
| `miterLimit` | number | No | — | Miter limit |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_offset_paths",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-add_path"></a>

### shape.add_path

Add a custom bezier Path (vertices + tangents) to a shape group.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `vertices` | array | Yes | — | Array of [x,y] points |
| `inTangents` | array | No | — | Array of [x,y] in-tangent offsets |
| `outTangents` | array | No | — | Array of [x,y] out-tangent offsets |
| `closed` | boolean | No | true | Close the path (default true) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_path",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>",
      "vertices": "<vertices: array>"
    }
  }
}
```

<a id="shape-add_polystar"></a>

### shape.add_polystar

Add a Polystar Path (star or polygon) to a shape group.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `starType` | string | No | "star" | star\|polygon (default star) |
| `points` | number | No | 5 | Number of points |
| `position` | array | No | [0,0] | [x, y] offset from group center |
| `rotation` | number | No | — | Rotation in degrees |
| `outerRadius` | number | No | 100 | Outer radius in px |
| `innerRadius` | number | No | — | Inner radius in px (star type only) |
| `outerRoundness` | number | No | — | Outer roundness % (0-100) |
| `innerRoundness` | number | No | — | Inner roundness % (star type only) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_polystar",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-add_pucker_bloat"></a>

### shape.add_pucker_bloat

Add Pucker & Bloat to a shape group (negative = pucker, positive = bloat).

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `amount` | number | No | 0 | Amount % (-100..100) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_pucker_bloat",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-add_rect"></a>

### shape.add_rect

Add a Rectangle Path to a shape group.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `size` | array | Yes | — | [width, height] |
| `position` | array | No | [0,0] | [x, y] offset from group center |
| `roundness` | number | No | 0 | Corner roundness in px |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_rect",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>",
      "size": "<size: array>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_rect",
    "args": {
      "comp": "Main",
      "layer": "Panel",
      "groupIndex": 1,
      "size": [
        1000,
        400
      ],
      "roundness": 24
    }
  }
}
```

<a id="shape-add_repeater"></a>

### shape.add_repeater

Add a Repeater to a shape group — duplicates the group's contents with a per-copy transform offset.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `copies` | number | No | 3 | Number of copies |
| `offset` | number | No | — | Copy offset (fractional copies to skip) |
| `position` | array | No | — | Per-copy position delta [x, y] (default [100, 0]) |
| `rotation` | number | No | — | Per-copy rotation in degrees |
| `scale` | array | No | — | Per-copy scale [x, y] % (default [100, 100]) |
| `startOpacity` | number | No | — | Opacity % of first copy |
| `endOpacity` | number | No | — | Opacity % of last copy |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_repeater",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-add_rounded_corners"></a>

### shape.add_rounded_corners

Add Rounded Corners to a shape group.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `radius` | number | No | 10 | Corner radius in px |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_rounded_corners",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-add_stroke"></a>

### shape.add_stroke

Add a Stroke to a shape group.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `color` | array | Yes | — | [r,g,b,a] 0-1 |
| `width` | number | No | 2 | Stroke width |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_stroke",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>",
      "color": "<color: array>"
    }
  }
}
```

<a id="shape-add_trim_paths"></a>

### shape.add_trim_paths

Add Trim Paths to a shape group. Essential for shape animation (line draw-on effects).

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `start` | number | No | 0 | Start % (0-100) |
| `end` | number | No | 100 | End % (0-100) |
| `offset` | number | No | 0 | Offset in degrees |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_trim_paths",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-add_twist"></a>

### shape.add_twist

Add Twist to a shape group.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `angle` | number | No | 90 | Twist angle in degrees |
| `center` | array | No | — | Twist center [x, y] |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_twist",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-add_wiggle_paths"></a>

### shape.add_wiggle_paths

Add Wiggle Paths (roughen) to a shape group.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `size` | number | No | 10 | Wiggle size in px |
| `detail` | number | No | 10 | Detail (segments) |
| `pointType` | string | No | — | corner\|smooth (default corner) |
| `wigglesPerSecond` | number | No | — | Temporal frequency (0 = static) |
| `correlation` | number | No | — | Correlation % (0-100) |
| `seed` | number | No | — | Random seed |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_wiggle_paths",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-add_wiggle_transform"></a>

### shape.add_wiggle_transform

Add Wiggle Transform to a shape group - randomizes position/scale/rotation over time (the transform-space sibling of Wiggle Paths).

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `wigglesPerSecond` | number | No | 2 | Temporal frequency (default 2) |
| `correlation` | number | No | — | Correlation % (0-100) |
| `position` | array | No | — | [x,y] wiggle amount in px |
| `scale` | array | No | — | [sx,sy] wiggle amount in % |
| `rotation` | number | No | — | Rotation wiggle amount in degrees |
| `seed` | number | No | — | Random seed |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_wiggle_transform",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-add_zigzag"></a>

### shape.add_zigzag

Add Zig Zag to a shape group.

Source: [src/operations/shape.ts](../src/operations/shape.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `groupIndex` | number | Yes | — | 1-based group index within Contents |
| `size` | number | No | 10 | Zig zag size in px |
| `ridgesPerSegment` | number | No | 10 | Ridges per segment |
| `pointType` | string | No | — | corner\|smooth (default corner) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.add_zigzag",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "groupIndex": "<groupIndex: number>"
    }
  }
}
```

<a id="shape-group_bounds"></a>

### shape.group_bounds

Bounds of each top-level vector group of a shape layer, in LAYER space with the group's own transform applied — what you need to split, align, or anchor per part. Geometry-based (exact for paths/rects/ellipses; strokes padded in; stars and path modifiers such as Trim/Repeater are listed in `approximate`). Also reports the whole layer's bounds.

Source: [src/operations/shape-contents.ts](../src/operations/shape-contents.ts). Category: `shape`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | Layer index, name, { id }, 'selected', 'all', or an array of those (shape layers) |
| `time` | number | No | — | Evaluate animated paths/transforms at this time (default: current value) |
| `includeStroke` | boolean | No | true | Pad by half the widest stroke (default true) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.group_bounds",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="shape-recolor"></a>

### shape.recolor

Replace fill and/or stroke colors throughout a shape layer's contents (any nesting depth). Either `color` (paint everything one color — silhouettes) or `map` ([{ from, to }] — per-color substitution, matched within `tolerance`). Colors are [r,g,b] 0-1 (alpha optional).

Source: [src/operations/shape-contents.ts](../src/operations/shape-contents.ts). Category: `shape`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | Layer index, name, { id }, 'selected', 'all', or an array of those (shape layers) |
| `target` | string | No | "both" | fill\|stroke\|both (default both) |
| `color` | array | No | — | [r,g,b] — set every matching fill/stroke to this color |
| `map` | array | No | — | [{ from: [r,g,b], to: [r,g,b] }, …] — replace only colors that match `from` |
| `tolerance` | number | No | 0.01 | Per-channel match tolerance for `map` (default 0.01) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.recolor",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="shape-signature"></a>

### shape.signature

Structural hash of a shape layer's contents and of each top-level group — matchNames plus rounded values, NO display names — so identical artwork hashes the same even after renaming. Use it to find duplicate layers when merging comps, or to check that a copy still matches its source.

Source: [src/operations/shape-contents.ts](../src/operations/shape-contents.ts). Category: `shape`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | Layer index, name, { id }, 'selected', 'all', or an array of those (shape layers) |
| `precision` | number | No | 2 | Decimal places kept when rounding values (default 2) |
| `time` | number | No | — | Evaluate animated values at this time (default: current value) |
| `includeLayerTransform` | boolean | No | false | Also hash the layer's Transform group (default false — copies usually differ only in position) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "shape.signature",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="category-text"></a>

## text

[text.add_animator](#text-add_animator) · [text.add_font_axis](#text-add_font_axis) · [text.measure](#text-measure) · [text.paste_range](#text-paste_range) · [text.reset_style](#text-reset_style) · [text.set_box](#text-set_box) · [text.set_content](#text-set_content) · [text.set_style](#text-set_style) · [text.set_style_range](#text-set_style_range) · [text.set_variable_font](#text-set_variable_font)

<a id="text-add_animator"></a>

### text.add_animator

Add a text animator with animated properties and a selector. properties maps animator matchNames to initial values, e.g. {"ADBE Text Position 3D": [0,-50,0], "ADBE Text Opacity": 0}. Common: Position 3D, Scale 3D, Rotation, Opacity, Fill Color, Tracking Amount, Blur.

Source: [src/operations/text.ts](../src/operations/text.ts). Category: `text`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name (must be a TextLayer) |
| `name` | string | No | — | Animator name |
| `properties` | object | Yes | — | Map of animator-property matchName to initial value |
| `selector` | string | No | "range" | range\|wiggly\|expression\|none (default range) |
| `rangeStart` | number | No | — | Range selector start % (0-100) |
| `rangeEnd` | number | No | — | Range selector end % (0-100) |
| `rangeOffset` | number | No | — | Range selector offset % (-100..100) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.add_animator",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "properties": "<properties: object>"
    }
  }
}
```

<a id="text-add_font_axis"></a>

### text.add_font_axis

Add a variable-font axis property to a text animator (PropertyGroup.addVariableFontAxis, AE 26.0+) so the axis can be animated/keyframed. Targets an existing animator by 1-based index or name, or creates a new one.

Source: [src/operations/text.ts](../src/operations/text.ts). Category: `text`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `axisTag` | string | Yes | — | Four-character axis tag, e.g. 'wght' |
| `animator` | any | No | — | Existing animator (1-based index or name). Omit to create a new animator. |
| `value` | number | No | — | Initial axis value |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.add_font_axis",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "axisTag": "<axisTag: string>"
    }
  }
}
```

<a id="text-measure"></a>

### text.measure

Measure a text layer's composed layout: line/paragraph counts and character spans, per-line baselines (baselineLocs), box overflow. Range data needs AE 24.3+; missing fields come back null.

Source: [src/operations/text.ts](../src/operations/text.ts). Category: `text`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.measure",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.measure",
    "args": {
      "comp": "Main",
      "layer": "Title"
    }
  }
}
```

<a id="text-paste_range"></a>

### text.paste_range

Paste the TEXT AND STYLING of one character range into another (CharacterRange.pasteFrom, AE 25.1+) — replaces the target range's content. Source defaults to the same layer; pass sourceLayer to copy across layers.

Source: [src/operations/text.ts](../src/operations/text.ts). Category: `text`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | TARGET text layer (1-based index or name) |
| `start` | number | Yes | — | Target range start (0-based character index) |
| `end` | number | No | — | Target range end (exclusive; default: end of text) |
| `sourceLayer` | any | No | — | SOURCE text layer (default: same as layer) |
| `sourceStart` | number | Yes | — | Source range start (0-based character index) |
| `sourceEnd` | number | No | — | Source range end (exclusive; default: end of source text) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.paste_range",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "start": "<start: number>",
      "sourceStart": "<sourceStart: number>"
    }
  }
}
```

<a id="text-reset_style"></a>

### text.reset_style

Reset a text layer's styling to the default Character and/or Paragraph panel settings (TextDocument.resetCharStyle / resetParagraphStyle).

Source: [src/operations/text.ts](../src/operations/text.ts). Category: `text`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `scope` | string | No | "both" | character\|paragraph\|both (default both) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.reset_style",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="text-set_box"></a>

### text.set_box

Resize, reposition, or configure the box of a paragraph (box) text layer, including the AE 24.6 auto-fit and alignment controls. Point<->box conversion is NOT scriptable in AE — create the layer as box text from the start (layer.create_text with boxSize).

Source: [src/operations/text.ts](../src/operations/text.ts). Category: `text`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `boxSize` | array | No | — | [width, height] of the text box |
| `boxPosition` | array | No | — | [x, y] top-left of the box in layer space (AE 14.0+) |
| `autoFitPolicy` | string | No | — | none\|heightCursor\|heightPreciseBounds\|heightBaseline (AE 24.6+) |
| `verticalAlignment` | string | No | — | top\|center\|bottom\|justify (AE 24.6+) |
| `firstBaselineAlignment` | string | No | — | ascent\|capHeight\|emBox\|leading\|xHeight\|legacyMetric\|minimumValueAsian\|minimumValueRoman\|typoAscent (AE 24.6+) |
| `firstBaselineAlignmentMinimum` | number | No | — | Manual minimum offset of the first composed line (AE 24.6+) |
| `insetSpacing` | number | No | — | Inset spacing between box bounds and text, px (AE 24.6+) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.set_box",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

<a id="text-set_content"></a>

### text.set_content

Set the text content of a text layer.

Source: [src/operations/text.ts](../src/operations/text.ts). Category: `text`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index or name (must be a TextLayer) |
| `text` | string | Yes | — | New text string |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.set_content",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "text": "<text: string>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.set_content",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "text": "A revised title"
    }
  }
}
```

<a id="text-set_style"></a>

### text.set_style

Set text styling on the whole document: font, fontSize, colors, tracking, leading, justification, caps, kerning, ligatures, paragraph indents/spacing, RTL direction, vertical baselines, digit set, and more. For a sub-range use text.set_style_range.

Source: [src/operations/text.ts](../src/operations/text.ts). Category: `text`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `font` | string | No | — | Font postscript name (e.g. 'Arial-BoldMT') |
| `fontSize` | number | No | — | Font size in px |
| `fillColor` | array | No | — | [r,g,b] 0-1 |
| `strokeColor` | array | No | — | [r,g,b] 0-1 |
| `strokeWidth` | number | No | — | Stroke width in px |
| `tracking` | number | No | — | Tracking value |
| `leading` | number | No | — | Leading (line spacing) in px |
| `applyFill` | boolean | No | — | Enable fill |
| `applyStroke` | boolean | No | — | Enable stroke |
| `strokeOverFill` | boolean | No | — | Render stroke over fill |
| `justification` | string | No | — | left\|center\|right\|fullLeft\|fullCenter\|fullRight\|fullLastLineFull |
| `baselineShift` | number | No | — | Baseline shift in px |
| `autoLeading` | boolean | No | — | Use auto leading |
| `allCaps` | boolean | No | — | All caps via fontCapsOption (setter needs AE 24.0+) |
| `smallCaps` | boolean | No | — | Small caps via fontCapsOption (setter needs AE 24.0+) |
| `fauxBold` | boolean | No | — | Faux bold (setter needs AE 24.0+) |
| `fauxItalic` | boolean | No | — | Faux italic (setter needs AE 24.0+) |
| `horizontalScale` | number | No | — | Horizontal scale (1 = 100%, setter needs AE 24.0+) |
| `verticalScale` | number | No | — | Vertical scale (1 = 100%, setter needs AE 24.0+) |
| `tsume` | number | No | — | Tsume (normalized 0-1, CJK spacing, setter needs AE 24.0+) |
| `kerning` | number | No | — | Manual kerning amount (AE 24.0+) |
| `autoKernType` | string | No | — | none\|metric\|optical (AE 24.0+) |
| `ligature` | boolean | No | — | Enable ligatures (AE 24.0+) |
| `noBreak` | boolean | No | — | Prevent line breaks (AE 24.0+) |
| `autoHyphenate` | boolean | No | — | Paragraph auto-hyphenation (AE 24.0+) |
| `everyLineComposer` | boolean | No | — | true=Every-Line Composer, false=Single-Line (AE 24.0+) |
| `hangingRoman` | boolean | No | — | Roman hanging punctuation (burasagari, AE 24.0+) |
| `firstLineIndent` | number | No | — | Paragraph first-line indent in px (AE 24.0+) |
| `startIndent` | number | No | — | Paragraph start indent in px (AE 24.0+) |
| `endIndent` | number | No | — | Paragraph end indent in px (AE 24.0+) |
| `spaceBefore` | number | No | — | Paragraph space before in px (AE 24.0+) |
| `spaceAfter` | number | No | — | Paragraph space after in px (AE 24.0+) |
| `fontBaselineOption` | string | No | — | normal\|superscript\|subscript (AE 24.0+) |
| `baselineDirection` | string | No | — | withStream\|verticalRotated\|verticalCrossStream (tate-chu-yoko, AE 24.0+) |
| `direction` | string | No | — | leftToRight\|rightToLeft paragraph direction (AE 24.0+) |
| `leadingType` | string | No | — | roman\|japanese leading model (AE 24.0+) |
| `lineJoinType` | string | No | — | miter\|round\|bevel stroke joins (AE 24.0+) |
| `digitSet` | string | No | — | default\|arabic\|hindi\|farsi\|arabicRtl (AE 24.0+) |
| `composerEngine` | string | No | — | latinCjk\|universalType (AE 24.0+; universalType needed for RTL) |
| `lineOrientation` | string | No | — | horizontal\|verticalRtl\|verticalLtr (whole document only, AE 24.2+) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.set_style",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.set_style",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "font": "ArialMT",
      "fontSize": 54,
      "fillColor": [
        1,
        1,
        1
      ],
      "justification": "center"
    }
  }
}
```

<a id="text-set_style_range"></a>

### text.set_style_range

Style a SUB-RANGE of a text layer (AE 24.3+): same attributes as text.set_style, applied to characters, paragraphs, or composed lines. Whole-document-only attributes (lineOrientation) are rejected by AE with a warning.

Source: [src/operations/text.ts](../src/operations/text.ts). Category: `text`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `rangeType` | string | No | "characters" | characters\|paragraphs\|lines (default characters) |
| `start` | number | Yes | — | 0-based start index (character, paragraph, or composed line) |
| `end` | number | No | — | Exclusive end index. Default: characters → end of text; paragraphs/lines → start+1 |
| `font` | string | No | — | Font postscript name (e.g. 'Arial-BoldMT') |
| `fontSize` | number | No | — | Font size in px |
| `fillColor` | array | No | — | [r,g,b] 0-1 |
| `strokeColor` | array | No | — | [r,g,b] 0-1 |
| `strokeWidth` | number | No | — | Stroke width in px |
| `tracking` | number | No | — | Tracking value |
| `leading` | number | No | — | Leading (line spacing) in px |
| `applyFill` | boolean | No | — | Enable fill |
| `applyStroke` | boolean | No | — | Enable stroke |
| `strokeOverFill` | boolean | No | — | Render stroke over fill |
| `justification` | string | No | — | left\|center\|right\|fullLeft\|fullCenter\|fullRight\|fullLastLineFull |
| `baselineShift` | number | No | — | Baseline shift in px |
| `autoLeading` | boolean | No | — | Use auto leading |
| `allCaps` | boolean | No | — | All caps via fontCapsOption (setter needs AE 24.0+) |
| `smallCaps` | boolean | No | — | Small caps via fontCapsOption (setter needs AE 24.0+) |
| `fauxBold` | boolean | No | — | Faux bold (setter needs AE 24.0+) |
| `fauxItalic` | boolean | No | — | Faux italic (setter needs AE 24.0+) |
| `horizontalScale` | number | No | — | Horizontal scale (1 = 100%, setter needs AE 24.0+) |
| `verticalScale` | number | No | — | Vertical scale (1 = 100%, setter needs AE 24.0+) |
| `tsume` | number | No | — | Tsume (normalized 0-1, CJK spacing, setter needs AE 24.0+) |
| `kerning` | number | No | — | Manual kerning amount (AE 24.0+) |
| `autoKernType` | string | No | — | none\|metric\|optical (AE 24.0+) |
| `ligature` | boolean | No | — | Enable ligatures (AE 24.0+) |
| `noBreak` | boolean | No | — | Prevent line breaks (AE 24.0+) |
| `autoHyphenate` | boolean | No | — | Paragraph auto-hyphenation (AE 24.0+) |
| `everyLineComposer` | boolean | No | — | true=Every-Line Composer, false=Single-Line (AE 24.0+) |
| `hangingRoman` | boolean | No | — | Roman hanging punctuation (burasagari, AE 24.0+) |
| `firstLineIndent` | number | No | — | Paragraph first-line indent in px (AE 24.0+) |
| `startIndent` | number | No | — | Paragraph start indent in px (AE 24.0+) |
| `endIndent` | number | No | — | Paragraph end indent in px (AE 24.0+) |
| `spaceBefore` | number | No | — | Paragraph space before in px (AE 24.0+) |
| `spaceAfter` | number | No | — | Paragraph space after in px (AE 24.0+) |
| `fontBaselineOption` | string | No | — | normal\|superscript\|subscript (AE 24.0+) |
| `baselineDirection` | string | No | — | withStream\|verticalRotated\|verticalCrossStream (tate-chu-yoko, AE 24.0+) |
| `direction` | string | No | — | leftToRight\|rightToLeft paragraph direction (AE 24.0+) |
| `leadingType` | string | No | — | roman\|japanese leading model (AE 24.0+) |
| `lineJoinType` | string | No | — | miter\|round\|bevel stroke joins (AE 24.0+) |
| `digitSet` | string | No | — | default\|arabic\|hindi\|farsi\|arabicRtl (AE 24.0+) |
| `composerEngine` | string | No | — | latinCjk\|universalType (AE 24.0+; universalType needed for RTL) |
| `lineOrientation` | string | No | — | horizontal\|verticalRtl\|verticalLtr (whole document only, AE 24.2+) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.set_style_range",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "start": "<start: number>"
    }
  }
}
```

<a id="text-set_variable_font"></a>

### text.set_variable_font

Set variable-font design axes on a text layer (AE 24.0+). axes maps axis tags to values, e.g. { "wght": 700, "wdth": 85 }. Unspecified axes keep their current values. Discover a font's axes with font.info (designAxesData).

Source: [src/operations/text.ts](../src/operations/text.ts). Category: `text`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | 1-based layer index, or the layer name |
| `axes` | object | Yes | — | Axis tag -> value map, e.g. { "wght": 700 } |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "text.set_variable_font",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>",
      "axes": "<axes: object>"
    }
  }
}
```

<a id="category-timeline"></a>

## timeline

[timeline.select_layers](#timeline-select_layers) · [timeline.set_active_comp](#timeline-set_active_comp) · [timeline.set_time](#timeline-set_time)

<a id="timeline-select_layers"></a>

### timeline.select_layers

Select (or deselect) layers in a comp by index.

Source: [src/operations/timeline.ts](../src/operations/timeline.ts). Category: `timeline`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `indices` | array | Yes | — | Array of 1-based layer indices to select |
| `deselectOthers` | boolean | No | true | Deselect all other layers first (default true) |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "timeline.select_layers",
    "args": {
      "comp": "<comp: any>",
      "indices": "<indices: array>"
    }
  }
}
```

<a id="timeline-set_active_comp"></a>

### timeline.set_active_comp

Set the active (visible in UI) composition. Opens it in the viewer.

Source: [src/operations/timeline.ts](../src/operations/timeline.ts). Category: `timeline`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "timeline.set_active_comp",
    "args": {
      "comp": "<comp: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "timeline.set_active_comp",
    "args": {
      "comp": "Main"
    }
  }
}
```

<a id="timeline-set_time"></a>

### timeline.set_time

Set the current time indicator (CTI) in a composition.

Source: [src/operations/timeline.ts](../src/operations/timeline.ts). Category: `timeline`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `time` | number | Yes | — | Time in seconds |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "timeline.set_time",
    "args": {
      "comp": "<comp: any>",
      "time": "<time: number>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "timeline.set_time",
    "args": {
      "comp": "Main",
      "time": 1.3
    }
  }
}
```

<a id="category-transform"></a>

## transform

[transform.set](#transform-set)

<a id="transform-set"></a>

### transform.set

Set transform properties on one or more layers. layer can be index, name, 'selected', or 'all'. For keyframes use keyframe.add.

Source: [src/operations/transform.ts](../src/operations/transform.ts). Category: `transform`. Read-only classification: **false**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `comp` | any | Yes | — | Comp name or id |
| `layer` | any | Yes | — | Layer index (number), name (string), 'selected', or 'all' |
| `position` | array | No | — | [x,y] or [x,y,z] |
| `scale` | array | No | — | [sx,sy] or [sx,sy,sz] in percent |
| `rotation` | number | No | — | Rotation in degrees |
| `opacity` | number | No | — | Opacity 0-100 |
| `anchorPoint` | array | No | — | [x,y] or [x,y,z] |
| `threeDLayer` | boolean | No | — | Enable/disable 3D |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "transform.set",
    "args": {
      "comp": "<comp: any>",
      "layer": "<layer: any>"
    }
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "transform.set",
    "args": {
      "comp": "Main",
      "layer": "Title",
      "position": [
        640,
        360
      ]
    }
  }
}
```

<a id="category-viewer"></a>

## viewer

[viewer.get_state](#viewer-get_state) · [viewer.set_options](#viewer-set_options)

<a id="viewer-get_state"></a>

### viewer.get_state

Read the active viewer's state: type, zoom, exposure, channels.

Source: [src/operations/viewer.ts](../src/operations/viewer.ts). Category: `viewer`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| — | — | — | — | No operation arguments. |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "viewer.get_state",
    "args": {}
  }
}
```

**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):

```json
{
  "name": "ae_do",
  "arguments": {
    "operation": "viewer.get_state",
    "args": {}
  }
}
```

<a id="viewer-set_options"></a>

### viewer.set_options

Set active-viewer view options: zoom (1 = 100%), exposure (stops), checkerboard, guide/ruler visibility and lock/snap (AE 16.1+), fast-preview mode, and the displayed channels.

Source: [src/operations/viewer.ts](../src/operations/viewer.ts). Category: `viewer`. Read-only classification: **true**. Execution: **ExtendScript**.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `zoom` | number | No | — | Zoom factor (1 = 100%) |
| `exposure` | number | No | — | Exposure in stops |
| `checkerboards` | boolean | No | — | Show transparency checkerboard |
| `guidesVisibility` | boolean | No | — | Show guides (AE 16.1+) |
| `guidesLocked` | boolean | No | — | Lock guides (AE 16.1+) |
| `guidesSnap` | boolean | No | — | Snap to guides (AE 16.1+) |
| `rulers` | boolean | No | — | Show rulers (AE 16.1+) |
| `maximized` | boolean | No | — | Maximize the viewer panel |
| `fastPreview` | string | No | — | off\|adaptiveResolution\|draft\|fastDraft\|wireframe |
| `channels` | string | No | — | rgb\|red\|green\|blue\|alpha\|alphaBoundary\|alphaOverlay\|rgbStraight |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "viewer.set_options",
    "args": {}
  }
}
```

## Optional raw-code operation (not in the default count)

<a id="eval-run"></a>

### eval.run

Execute custom ExtendScript (ES3). LAST RESORT — check ae_catalog first for a dedicated operation. Code is a function body ending with `return <JSON-serializable>;`. AE.* helpers are in scope. `log(msg)` pushes breadcrumbs. The code already runs inside an automatic undo group (one Ctrl+Z reverts the call) — do NOT call app.beginUndoGroup/endUndoGroup yourself; an unbalanced group leaks past this call and corrupts undo for the whole session. Do NOT undo/redo from here either (app.executeCommand 16/2035): inside this call's group AE resolves them against it, so nothing is reverted — use the project.undo operation, which runs outside the group. Do NOT close/open/replace the project from here (app.open, app.newProject, app.project.close): the open undo group is orphaned at the project boundary, AE raises an async 'UndoGroup Mismatch' dialog, and undo stays broken for the session — use project.open / project.new, which run outside the group.

Source: [src/operations/eval.ts](../src/operations/eval.ts). Category: `eval`. Read-only classification: **false**. Execution: **ExtendScript**. Requires AE_MCP_ENABLE_EVAL=1 and write mode.

| Parameter | Type | Required | Declared default | Description |
|---|---|---|---|---|
| `code` | string | Yes | — | ExtendScript function body |

**Call template** (replace placeholders with correctly typed values; not executable as shown):

```text
{
  "name": "ae_do",
  "arguments": {
    "operation": "eval.run",
    "args": {
      "code": "<code: string>"
    }
  }
}
```
