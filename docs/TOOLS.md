# MCP tool reference

Generated from the tool registry and Zod input schemas by `npm run docs:generate`. Do not edit directly. [Guide](../README.md) · [Operations](OPERATIONS.md) · [Examples](EXAMPLES.md)

16 default tools. Each entry includes an example, all declared parameters, exact JSON Schema, result location and implementation notes. Descriptions are copied from code; notes distinguish handler behavior and known limits. JSON Schema alone does not express every handler refinement.

Examples use a six-second composition named Main, a text layer named Title and a shape layer named Panel. Replace example IDs, UUIDs and paths with your own. These are MCP tools/call payloads, not terminal commands. Only the bounded motion smoke in [VALIDATION.md](VALIDATION.md) was live-qualified.

| Tool | Effect hint | Withheld in read-only mode |
|---|---|---|
| [ae_project_info](#ae_project_info) | read | No |
| [ae_comp_info](#ae_comp_info) | read | No |
| [ae_layer_info](#ae_layer_info) | read | No |
| [ae_render_frame](#ae_render_frame) | write | No |
| [ae_save_project](#ae_save_project) | destructive | Yes |
| [ae_project_export_json](#ae_project_export_json) | write | No |
| [ae_project_import_json](#ae_project_import_json) | destructive | Yes |
| [ae_version_info](#ae_version_info) | read | No |
| [ae_catalog](#ae_catalog) | read | No |
| [ae_do](#ae_do) | destructive | No |
| [ae_context](#ae_context) | read | No |
| [ae_motion_plan](#ae_motion_plan) | read | No |
| [ae_motion_build](#ae_motion_build) | write | Yes |
| [ae_motion_audit](#ae_motion_audit) | read | No |
| [ae_motion_review](#ae_motion_review) | write | No |
| [ae_request_status](#ae_request_status) | read | No |

<a id="ae_project_info"></a>

## ae_project_info

Project-level info: file path, dirty flag, all items with type/summary, active item. Start here.

Source: [src/tools/project-info.ts](../src/tools/project-info.ts). Group: `inspect`. Effect hint: **read**. Available in read-only mode; operation/category policy may still restrict execution.



**Result:** result: file, dirty, numItems, bitsPerChannel, timeDisplayType, activeItem and items.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

```json
{
  "name": "ae_project_info",
  "arguments": {}
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  }
}
```

</details>

<a id="ae_comp_info"></a>

## ae_comp_info

Detailed comp info: size, fps, duration, work area, motion blur, layer summaries. Pass a comp name or item id — or an ARRAY of them to fetch several comps in one call.

Source: [src/tools/comp-info.ts](../src/tools/comp-info.ts). Group: `inspect`. Effect hint: **read**. Available in read-only mode; operation/category policy may still restrict execution.

Create or locate Main first. Numeric identifiers here are project item IDs, not project-panel row numbers.

**Result:** result: composition information; array input returns a batch of comp results.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `nameOrId` | string \| number \| array<string \| number> | Yes | Composition name (exact match) or numeric item id — or an array of either to batch several comps into one round trip. If you don't know any, call ae_project_info first. |
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

```json
{
  "name": "ae_comp_info",
  "arguments": {
    "nameOrId": "Main"
  }
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "nameOrId": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "minItems": 1,
          "type": "array",
          "items": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "number"
              }
            ]
          }
        }
      ],
      "description": "Composition name (exact match) or numeric item id — or an array of either to batch several comps into one round trip. If you don't know any, call ae_project_info first."
    },
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  },
  "required": [
    "nameOrId"
  ]
}
```

</details>

<a id="ae_layer_info"></a>

## ae_layer_info

Full layer info: transform, effects, masks, text, shape contents, keyframes (incl. interpolation names and bezier ease speed/influence). layerIndex accepts one index, an ARRAY of indices, or 'all' — auditing a whole comp is one call. detail:'summary' drops properties still at their default value (unkeyed, no expression) — start there for audits; the full tree is often 100KB+ per comp. Set includeProperties=false to skip the property tree walk entirely.

Source: [src/tools/layer-info.ts](../src/tools/layer-info.ts). Group: `inspect`. Effect hint: **read**. Available in read-only mode; operation/category policy may still restrict execution.

This tool accepts 1-based layer indices, arrays of indices or all. For stable layer IDs use ae_do with layer.info. Summary omits default-valued properties; it is not a complete serialization.

**Result:** result: native layer data, including property trees when includeProperties is not false.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `compNameOrId` | string \| number | Yes | Composition name (exact match) or numeric item id. |
| `layerIndex` | integer \| array<integer> \| "all" | Yes | 1-based layer index — or an array of indices, or 'all' for every layer in the comp, returned together in one round trip. |
| `includeProperties` | boolean | No | Include the full property tree (Transform/Effects/Masks/Text). Default true. |
| `detail` | "full" \| "summary" | No | 'summary' omits properties still at their default value (no keyframes, no expression, never touched) — typically 5-10x smaller. Group skeletons are kept, so effects/masks still show. Default 'full'. |
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

```json
{
  "name": "ae_layer_info",
  "arguments": {
    "compNameOrId": "Main",
    "layerIndex": "all",
    "detail": "summary"
  }
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "compNameOrId": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        }
      ],
      "description": "Composition name (exact match) or numeric item id."
    },
    "layerIndex": {
      "anyOf": [
        {
          "type": "integer",
          "exclusiveMinimum": 0,
          "maximum": 9007199254740991
        },
        {
          "minItems": 1,
          "type": "array",
          "items": {
            "type": "integer",
            "exclusiveMinimum": 0,
            "maximum": 9007199254740991
          }
        },
        {
          "type": "string",
          "const": "all"
        }
      ],
      "description": "1-based layer index — or an array of indices, or 'all' for every layer in the comp, returned together in one round trip."
    },
    "includeProperties": {
      "description": "Include the full property tree (Transform/Effects/Masks/Text). Default true.",
      "type": "boolean"
    },
    "detail": {
      "description": "'summary' omits properties still at their default value (no keyframes, no expression, never touched) — typically 5-10x smaller. Group skeletons are kept, so effects/masks still show. Default 'full'.",
      "type": "string",
      "enum": [
        "full",
        "summary"
      ]
    },
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  },
  "required": [
    "compNameOrId",
    "layerIndex"
  ]
}
```

</details>

<a id="ae_render_frame"></a>

## ae_render_frame

Render one or more frames to PNG. Use to visually verify edits. The agent's 'eyes' — pair with mutations for a visual feedback loop. Headless and deterministic. Pass `time` for one frame, or `times` for several in ONE call (motion checks): files land at <outPath stem>_<index>.png and are listed in `frames`. `contactSheet` tiles every frame into one labelled PNG (<stem>_sheet.png) so a motion check is one image; `analyze` measures each capture (uniform edge bands = black bars / transparent margins, content bounds, coverage) so off-frame elements and letterboxing are caught numerically. In color-managed projects (workingSpace != None) the capture applies AE's own display transform via a transient OCIO Display Transform adjustment layer, and the PNG comes back viewer-accurate and sRGB-tagged. Where that layer cannot be used — read-only mode, an AE without the OCIO effect, or a failed capture calibration — the result falls back to a pure-math ACES conversion or to raw values with an explicit colorWarning; check colorPipeline / colorWarning on the response.

Source: [src/tools/render-frame.ts](../src/tools/render-frame.ts). Group: `render`. Effect hint: **write**. Available in read-only mode; operation/category policy may still restrict execution.

Main must be longer than every sample time. Provide time XOR times; this additional condition is checked in the handler. Returned metadata identifies written PNGs; this tool itself does not append inline MCP image content. ae_motion_review can append its contact sheet. Color-managed write-mode capture can create and remove temporary AE objects, dirty the project and add undo history. Read-only mode disables those probes. Capture descriptions state intended color behavior, not universal color/alpha qualification.

**Result:** result: frames (or single-frame writtenTo/time/size), colorPipeline/colorWarning, optional analysis and contactSheet metadata.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `compNameOrId` | string \| number | Yes | Composition name or numeric item id. |
| `time` | number | No | Time in seconds to render. Give exactly one of `time` or `times`. |
| `times` | array<number> | No | Several times in seconds, rendered in ONE call. Files are written as <outPath stem>_<index><ext> and reported in `frames` (index-aligned). |
| `outPath` | string | Yes | Absolute path to write the PNG. Parent directory is created if missing. With `times`, used as the naming stem for every frame. |
| `useDisplayStartTime` | boolean | No | If true, times are interpreted relative to comp.displayStartTime. Default false. |
| `colorManaged` | "auto" \| "off" | No | 'auto' (default): detect the working space and return a viewer-accurate, 8-bit sRGB-tagged PNG. 'off': raw legacy output (16-bit, untagged, working-space values — dark/wrong-looking in color-managed projects). |
| `analyze` | boolean | No | Measure each capture: uniform bands at every edge (width + transparent/color — black bars, letterboxing, empty margins), the bounding box of non-background pixels, coverage, mean RGB. Reported per frame as `analysis` (measured on the capture before color conversion). |
| `contactSheet` | object | No | Tile all rendered frames into ONE labelled PNG (#index + time above each tile). Pass {} for defaults. |
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

```json
{
  "name": "ae_render_frame",
  "arguments": {
    "compNameOrId": "Main",
    "times": [
      0.1,
      1.3,
      3,
      5.6
    ],
    "outPath": "C:/AE-output/review/frame.png",
    "contactSheet": {
      "columns": 2,
      "thumbWidth": 480
    },
    "analyze": true
  }
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "compNameOrId": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        }
      ],
      "description": "Composition name or numeric item id."
    },
    "time": {
      "description": "Time in seconds to render. Give exactly one of `time` or `times`.",
      "type": "number",
      "minimum": 0
    },
    "times": {
      "description": "Several times in seconds, rendered in ONE call. Files are written as <outPath stem>_<index><ext> and reported in `frames` (index-aligned).",
      "minItems": 1,
      "maxItems": 32,
      "type": "array",
      "items": {
        "type": "number",
        "minimum": 0
      }
    },
    "outPath": {
      "type": "string",
      "description": "Absolute path to write the PNG. Parent directory is created if missing. With `times`, used as the naming stem for every frame."
    },
    "useDisplayStartTime": {
      "description": "If true, times are interpreted relative to comp.displayStartTime. Default false.",
      "type": "boolean"
    },
    "colorManaged": {
      "description": "'auto' (default): detect the working space and return a viewer-accurate, 8-bit sRGB-tagged PNG. 'off': raw legacy output (16-bit, untagged, working-space values — dark/wrong-looking in color-managed projects).",
      "type": "string",
      "enum": [
        "auto",
        "off"
      ]
    },
    "analyze": {
      "description": "Measure each capture: uniform bands at every edge (width + transparent/color — black bars, letterboxing, empty margins), the bounding box of non-background pixels, coverage, mean RGB. Reported per frame as `analysis` (measured on the capture before color conversion).",
      "type": "boolean"
    },
    "contactSheet": {
      "description": "Tile all rendered frames into ONE labelled PNG (#index + time above each tile). Pass {} for defaults.",
      "type": "object",
      "properties": {
        "columns": {
          "description": "Tiles per row (default ceil(sqrt(n))).",
          "type": "integer",
          "exclusiveMinimum": 0,
          "maximum": 9007199254740991
        },
        "thumbWidth": {
          "description": "Tile width in px, never upscaled (default 480).",
          "type": "integer",
          "minimum": 16,
          "maximum": 2048
        },
        "outPath": {
          "description": "Sheet path (default <outPath stem>_sheet.png).",
          "type": "string"
        }
      }
    },
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  },
  "required": [
    "compNameOrId",
    "outPath"
  ]
}
```

</details>

<a id="ae_save_project"></a>

## ae_save_project

Save the project. Pass `path` for Save As.

Source: [src/tools/save-project.ts](../src/tools/save-project.ts). Group: `document`. Effect hint: **destructive**. Withheld in read-only mode; operation/category policy may still restrict execution.

Create the parent directory first. An existing target may be overwritten; Save As changes the current project path. Omit path only after the project has a save location. Filesystem writes cannot be undone with Ctrl+Z.

**Result:** result: saved and path.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `path` | string | No | Optional absolute path to save the project to (Save As). If omitted, save to the existing path — errors if the project has never been saved. |
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

```json
{
  "name": "ae_save_project",
  "arguments": {
    "path": "C:/AE-output/Motion-Example.aep"
  }
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "path": {
      "description": "Optional absolute path to save the project to (Save As). If omitted, save to the existing path — errors if the project has never been saved.",
      "type": "string"
    },
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  }
}
```

</details>

<a id="ae_project_export_json"></a>

## ae_project_export_json

Serialize the entire project to JSON (folders, comps, layers, keyframes, effects, shapes, markers, time remap, solids, file refs). Write to `outPath` or return inline.

Source: [src/tools/project-export.ts](../src/tools/project-export.ts). Group: `document`. Effect hint: **write**. Available in read-only mode; operation/category policy may still restrict execution.

Export timeout is 300000 ms. File mode creates parent directories. pretty defaults to true for disk output and false inline. This is schema-version-2 structural data, not a lossless substitute for an AEP or a media archive.

**Result:** File mode: writtenTo, bytes, itemCount, durationMs at the envelope root. Inline mode: doc and durationMs at the root.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `outPath` | string | No | If set, write the exported JSON to this absolute path on disk. If omitted, the JSON is returned inline in the tool response (can get large). |
| `pretty` | boolean | No | Pretty-print the JSON (2-space indent). Default: true when writing to disk, false otherwise. |
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

```json
{
  "name": "ae_project_export_json",
  "arguments": {
    "outPath": "C:/AE-output/project.json",
    "pretty": true
  }
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "outPath": {
      "description": "If set, write the exported JSON to this absolute path on disk. If omitted, the JSON is returned inline in the tool response (can get large).",
      "type": "string"
    },
    "pretty": {
      "description": "Pretty-print the JSON (2-space indent). Default: true when writing to disk, false otherwise.",
      "type": "boolean"
    },
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  }
}
```

</details>

<a id="ae_project_import_json"></a>

## ae_project_import_json

Rebuild the project from JSON (produced by ae_project_export_json). Supports `clearFirst`, `dryRun` (validate-only), `skipValidation`.

Source: [src/tools/project-import.ts](../src/tools/project-import.ts). Group: `document`. Effect hint: **destructive**. Withheld in read-only mode; operation/category policy may still restrict execution.

First export the referenced file. Supply either inPath or json. Although field descriptions say mutually exclusive, the handler currently prefers truthy inPath if both are supplied. clearFirst defaults to false (append); true deletes existing project items before rebuilding. dryRun does not touch AE, but the tool is still withheld in read-only mode. skipValidation bypasses structural validation; dryRun plus skipValidation returns valid:false. Real import timeout is 600000 ms.

**Result:** Dry run: dryRun, valid, itemCount, warnings and summary at the root. Real import: native import result under result.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `inPath` | string | No | Absolute path to a JSON document produced by ae_project_export_json. Mutually exclusive with `json`. |
| `json` | any | No | Inline JSON document (object, not string). Mutually exclusive with `inPath`. |
| `clearFirst` | boolean | No | Remove all existing items from the current project before importing. Default: false (appends). |
| `dryRun` | boolean | No | If true, validate the document and return a plan without touching AE. Useful for debugging malformed exports. |
| `skipValidation` | boolean | No | Skip Node-side schema validation. Only use if you trust the input and want to hand broken data to AE for diagnosis. |
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

```json
{
  "name": "ae_project_import_json",
  "arguments": {
    "inPath": "C:/AE-output/project.json",
    "dryRun": true
  }
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "inPath": {
      "description": "Absolute path to a JSON document produced by ae_project_export_json. Mutually exclusive with `json`.",
      "type": "string"
    },
    "json": {
      "description": "Inline JSON document (object, not string). Mutually exclusive with `inPath`."
    },
    "clearFirst": {
      "description": "Remove all existing items from the current project before importing. Default: false (appends).",
      "type": "boolean"
    },
    "dryRun": {
      "description": "If true, validate the document and return a plan without touching AE. Useful for debugging malformed exports.",
      "type": "boolean"
    },
    "skipValidation": {
      "description": "Skip Node-side schema validation. Only use if you trust the input and want to hand broken data to AE for diagnosis.",
      "type": "boolean"
    },
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  }
}
```

</details>

<a id="ae_version_info"></a>

## ae_version_info

AE version, build, capabilities (saveFrameToPng, app.effects, Socket). Call at session start to know what APIs are available.

Source: [src/tools/version-info.ts](../src/tools/version-info.ts). Group: `inspect`. Effect hint: **read**. Available in read-only mode; operation/category policy may still restrict execution.



**Result:** result: native app/build details, capabilities, project state, agent and export schema information.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

```json
{
  "name": "ae_version_info",
  "arguments": {}
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  }
}
```

</details>

<a id="ae_catalog"></a>

## ae_catalog

Discover available atomic operations for ae_do. Without args: all categories with their operation names. With a category: detailed params per operation. Only operations this server will actually execute are listed.

Source: [src/tools/catalog.ts](../src/tools/catalog.ts). Group: `operations`. Effect hint: **read**. Available in read-only mode; operation/category policy may still restrict execution.

Offline operation discovery. Results are filtered by read-only/category/eval policy. Query {} first to learn category names.

**Result:** Root fields describing operations and their parameters for a category, or categories/counts when omitted.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `category` | string | No | Filter by category. Omit to list all categories with operation counts, then drill into a specific category. |

### Example call

```json
{
  "name": "ae_catalog",
  "arguments": {
    "category": "keyframe"
  }
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "category": {
      "description": "Filter by category. Omit to list all categories with operation counts, then drill into a specific category.",
      "type": "string"
    }
  }
}
```

</details>

<a id="ae_do"></a>

## ae_do

Execute an atomic operation by name (from ae_catalog). Arguments are validated against the operation's declared parameters before anything reaches AE. Have more than one operation to run? Wrap them in ONE batch.run instead of several ae_do calls — read/verify steps (comp.info, layer.info, render.frame) can ride in the same batch. Every call is automatically wrapped in ONE undo group: a single Ctrl+Z (or project.undo) reverts the entire call, and a batch.run counts as one call. Never call app.beginUndoGroup/endUndoGroup in eval.run code — the wrapper already did. The exception is undo/redo itself (project.undo, command.execute id 16/2035): those run outside the group and cannot ride inside a batch.run. Response includes ambient context (active comp, selected layers, project state) at zero extra round trips. Example: ae_do({ operation: 'keyframe.add', args: { comp: 'Main', layer: 1, property: ['Transform','Position'], time: 2, value: [960,540] } })

Source: [src/tools/do.ts](../src/tools/do.ts). Group: `operations`. Effect hint: **destructive**. Available in read-only mode; operation/category policy may still restrict execution.

Main and its Title text layer must exist. JSX calls normally form one undo group. Undo/redo and project boundaries run ungrouped; node-side operations do not enter the JSX wrapper. File writes and application changes are not transactional or necessarily undoable. Default timeout is 60000 ms. Unknown operation keys/types fail before host dispatch.

**Result:** Normally result, context, requestId/state/mayStillRun, logs and durationMs. Node-side instance operations have no native ambient context.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `operation` | string | Yes | Operation name from ae_catalog (e.g. 'layer.create_solid', 'keyframe.add'). |
| `args` | object | No | Arguments for the operation. Validated against ae_catalog's declared params: missing required args, wrong types, and unknown keys are rejected before AE is contacted. Omit for zero-param operations. |
| `timeoutMs` | integer | No | Per-call timeout in milliseconds (default 60000). Raise for long operations like render.start or big batch.run calls. |
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

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

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "description": "Operation name from ae_catalog (e.g. 'layer.create_solid', 'keyframe.add')."
    },
    "args": {
      "description": "Arguments for the operation. Validated against ae_catalog's declared params: missing required args, wrong types, and unknown keys are rejected before AE is contacted. Omit for zero-param operations.",
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {}
    },
    "timeoutMs": {
      "description": "Per-call timeout in milliseconds (default 60000). Raise for long operations like render.start or big batch.run calls.",
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  },
  "required": [
    "operation"
  ]
}
```

</details>

<a id="ae_context"></a>

## ae_context

Ambient context: project state, active comp, selected layers, item list, AE.* helpers, ES3 rules, and the undo contract (every call = one auto undo group). Call at session start; then rely on ae_do response context.

Source: [src/tools/context.ts](../src/tools/context.ts). Group: `inspect`. Effect hint: **read**. Available in read-only mode; operation/category policy may still restrict execution.

Contacts AE. A server startup or offline catalog response alone does not establish an AE connection.

**Result:** result: current project/active composition/selection and native scripting guidance, with instance discovery added by the handler.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

```json
{
  "name": "ae_context",
  "arguments": {}
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  }
}
```

</details>

<a id="ae_motion_plan"></a>

## ae_motion_plan

Create a portable version-1 native motion specification offline. Presets are starting layouts: title-card, lower-third, statistic-card. Edit the returned spec for custom text/rectangle/ellipse layouts, then pass it to ae_motion_build. No AE mutation.

Source: [src/tools/motion.ts](../src/tools/motion.ts). Group: `operations`. Effect hint: **read**. Available in read-only mode; operation/category policy may still restrict execution.

Offline. Defaults: 1920 x 1080, 6 seconds, 30 fps, ArialMT. Preset entry bounds are narrower than custom-spec bounds. It does not verify installed fonts, text fit or rendered quality.

**Result:** Root fields spec, specHash and next.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `template` | "title-card" \| "lower-third" \| "statistic-card" | Yes | See exact schema constraints and implementation notes. |
| `title` | string | Yes | See exact schema constraints and implementation notes. |
| `subtitle` | string | No | See exact schema constraints and implementation notes. |
| `name` | string | No | See exact schema constraints and implementation notes. |
| `width` | integer | No | See exact schema constraints and implementation notes. |
| `height` | integer | No | See exact schema constraints and implementation notes. |
| `duration` | number | No | See exact schema constraints and implementation notes. |
| `fps` | number | No | See exact schema constraints and implementation notes. |
| `font` | string | No | See exact schema constraints and implementation notes. |

### Example call

```json
{
  "name": "ae_motion_plan",
  "arguments": {
    "template": "title-card",
    "title": "Ideas in motion",
    "subtitle": "Native editable layers",
    "width": 1280,
    "height": 720,
    "duration": 6,
    "fps": 30
  }
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "template": {
      "type": "string",
      "enum": [
        "title-card",
        "lower-third",
        "statistic-card"
      ]
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 2000
    },
    "subtitle": {
      "type": "string",
      "maxLength": 4000
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "width": {
      "type": "integer",
      "minimum": 64,
      "maximum": 16384
    },
    "height": {
      "type": "integer",
      "minimum": 64,
      "maximum": 16384
    },
    "duration": {
      "type": "number",
      "minimum": 1,
      "maximum": 600
    },
    "fps": {
      "type": "number",
      "minimum": 1,
      "maximum": 99
    },
    "font": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    }
  },
  "required": [
    "template",
    "title"
  ]
}
```

</details>

<a id="ae_motion_build"></a>

## ae_motion_build

Validate a version-1 motion spec and create a NEW composition with native editable text/shapes and eased position/opacity keyframes. Existing compositions stay intact. Returns IDs for subsequent edits. Requires comp,layer,text,shape,keyframe categories. Partial failure reports created objects. Never automatically retry a timeout.

Source: [src/tools/motion.ts](../src/tools/motion.ts). Group: `operations`. Effect hint: **write**. Withheld in read-only mode; operation/category policy may still restrict execution.

Always creates a NEW comp, even for an identical spec/name. It does not update, reconcile or roll back an earlier build. Requires comp,layer,text,shape,keyframe categories and write mode. Default timeout 120000 ms. Strict spec and timing validation occur in the handler beyond the broad spec input schema.

**Result:** result: ok, compId, layers[{key,id,name}], specHash and warnings. Partial errors preserve created IDs under error.details.result.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `spec` | any | Yes | Version-1 spec from ae_motion_plan or examples; strict validation runs before AE. |
| `timeoutMs` | integer | No | See exact schema constraints and implementation notes. |
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

```json
{
  "name": "ae_motion_build",
  "arguments": {
    "spec": {
      "version": 1,
      "comp": {
        "name": "Motion Example",
        "width": 1280,
        "height": 720,
        "duration": 6,
        "fps": 30,
        "background": [
          0.012,
          0.018,
          0.035
        ]
      },
      "layers": [
        {
          "key": "title",
          "name": "Title",
          "type": "text",
          "text": "Ideas in motion",
          "font": "ArialMT",
          "fontSize": 54,
          "position": [
            640,
            360
          ],
          "color": [
            1,
            1,
            1
          ],
          "timing": {
            "start": 0,
            "in": 0.9,
            "hold": 4.2,
            "out": 0.9
          }
        }
      ]
    }
  }
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "spec": {
      "description": "Version-1 spec from ae_motion_plan or examples; strict validation runs before AE."
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1000,
      "maximum": 600000
    },
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  },
  "required": [
    "spec"
  ]
}
```

</details>

<a id="ae_motion_audit"></a>

## ae_motion_audit

Check native layer timing, keyframe counts, missing footage and current expression errors. Bounded to 1000 layers/20000 properties. Does not judge aesthetics, clipping, full animation or artist acceptance. IDs are scoped to the active project; inspect after project changes.

Source: [src/tools/motion.ts](../src/tools/motion.ts). Group: `inspect`. Effect hint: **read**. Available in read-only mode; operation/category policy may still restrict execution.

Replace 13 with the returned compId. Requires inspect category. Bounded to 1000 layers and 20000 visited properties. Does not judge clipping, font aesthetics, interpolation quality or whole-animation correctness.

**Result:** result: composition facts, per-layer facts/keyframe counts, issues, technicalStatus, visualAcceptance and spec provenance.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `compId` | integer | Yes | See exact schema constraints and implementation notes. |
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

```json
{
  "name": "ae_motion_audit",
  "arguments": {
    "compId": 13
  }
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "compId": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  },
  "required": [
    "compId"
  ]
}
```

</details>

<a id="ae_motion_review"></a>

## ae_motion_review

Inspect composition, capture 2–16 requested times, return contact sheet image and save a review manifest containing frame hashes, actual times, spec provenance and notes. This is sampled visual evidence; artist acceptance remains pending. Writes a unique review directory. Color/alpha limitations are reported by the native capture path.

Source: [src/tools/motion.ts](../src/tools/motion.ts). Group: `render`. Effect hint: **write**. Available in read-only mode; operation/category policy may still restrict execution.

Replace 13 with a six-second composition ID. Requires inspect and render categories. directory must be absolute. Each time must be less than comp duration. Creates a unique motion-review-UUID directory; stores actual frame times, byte hashes, audit, capture metadata and notes. artistAcceptance stays pending. A contact sheet is appended only when readable and at most 8 MiB. Partial capture files can remain on failure.

**Result:** Root fields reviewPath and review; content may additionally include an image/png contact sheet.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `compId` | integer | Yes | See exact schema constraints and implementation notes. |
| `times` | array<number> | Yes | See exact schema constraints and implementation notes. |
| `directory` | string | Yes | See exact schema constraints and implementation notes. |
| `notes` | string | No | See exact schema constraints and implementation notes. |
| `instance` | string | No | After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live. |

### Example call

```json
{
  "name": "ae_motion_review",
  "arguments": {
    "compId": 13,
    "times": [
      0.1,
      0.45,
      1.3,
      3,
      5.6,
      5.95
    ],
    "directory": "C:/AE-output/reviews",
    "notes": "Review entrance, hold and exit."
  }
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "compId": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
    "times": {
      "minItems": 2,
      "maxItems": 16,
      "type": "array",
      "items": {
        "type": "number",
        "minimum": 0
      }
    },
    "directory": {
      "type": "string",
      "minLength": 1
    },
    "notes": {
      "type": "string",
      "maxLength": 20000
    },
    "instance": {
      "description": "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.",
      "type": "string"
    }
  },
  "required": [
    "compId",
    "times",
    "directory"
  ]
}
```

</details>

<a id="ae_request_status"></a>

## ae_request_status

Look up a retained request by UUID after a timeout, without executing or retrying host code. Works for push and targeted instance requests. A running or unknown outcome may still mutate the project; do not retry it.

Source: [src/tools/request-status.ts](../src/tools/request-status.ts). Group: `inspect`. Effect hint: **read**. Available in read-only mode; operation/category policy may still restrict execution.

Use the UUID from YOUR response, not this historical example. Does not launch or re-execute AE code. Does not accept instance: the persisted request route locates the mailbox. completed means the host returned, not that its nested application result succeeded.

**Result:** Root fields requestId, state, mayStillRun and, when known, retained result/error details.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `requestId` | string | Yes | See exact schema constraints and implementation notes. |

### Example call

```json
{
  "name": "ae_request_status",
  "arguments": {
    "requestId": "63d6f13c-9fc6-4f74-a3d4-6a15272db848"
  }
}
```

<details>
<summary>Exact input JSON Schema</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "requestId": {
      "type": "string",
      "format": "uuid",
      "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
    }
  },
  "required": [
    "requestId"
  ]
}
```

</details>
