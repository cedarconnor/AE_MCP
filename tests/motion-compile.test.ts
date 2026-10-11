import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { compileMotionSpec } from "../src/motion/compile.js";
import { createMotionPreset } from "../src/motion/templates.js";
import { hashMotionSpec } from "../src/motion/spec.js";

// AE is an external GUI host: execute the real emitted program with a small native-object double.
class Property {
  value: any = {};
  children: Record<string, Property> = {};
  keys: { time: number; value: any }[] = [];
  eases: any[] = [];
  interpolation: any[] = [];
  property(name: string): Property {
    return (this.children[name] ??= new Property());
  }
  addProperty(name: string): Property {
    return this.property(name);
  }
  setValue(value: any) {
    this.value = value;
  }
  setValueAtTime(time: number, value: any) {
    this.keys.push({ time, value });
  }
  setTemporalEaseAtKey(...args: any[]) {
    this.eases.push(args);
  }
  setInterpolationTypeAtKey(...args: any[]) {
    this.interpolation.push(args);
  }
  setSpatialAutoBezierAtKey() {}
  setSpatialTangentsAtKey() {}
  get numKeys() {
    return this.keys.length;
  }
}
class Layer extends Property {
  name = "New layer";
  comment = "";
  inPoint = 0;
  outPoint = 0;
  constructor(
    public id: number,
    public kind: string,
    private fail = false,
    private wide = false,
  ) {
    super();
  }
  sourceRectAtTime() {
    if (this.fail) throw new Error("source bounds unavailable");
    return { left: -5, top: -40, width: this.wide ? 5000 : 200, height: 60 };
  }
}
function host(options: { failAt?: number; noBounds?: boolean; wide?: boolean } = {}) {
  const comps: any[] = [];
  let undoDepth = 0;
  const app = {
    beginUndoGroup() {
      throw new Error("Transport owns the undo scope");
    },
    endUndoGroup() {
      undoDepth--;
    },
    project: {
      items: {
        addComp(
          name: string,
          width: number,
          height: number,
          pixelAspect: number,
          duration: number,
          fps: number,
        ) {
          const created: Layer[] = [];
          const add = (kind: string, text?: string) => {
            if (options.failAt === created.length) throw new Error("Native layer creation failed");
            const l = new Layer(100 + created.length, kind, options.noBounds, options.wide);
            if (text !== undefined)
              l.property("ADBE Text Properties").property("ADBE Text Document").value = {
                text,
                font: "ArialMT",
              };
            created.push(l);
            return l;
          };
          const comp = {
            id: comps.length + 1,
            name,
            width,
            height,
            pixelAspect,
            duration,
            fps,
            created,
            comment: "",
            bgColor: [],
            layers: { addText: (text: string) => add("text", text), addShape: () => add("shape") },
          };
          comps.push(comp);
          return comp;
        },
      },
    },
  };
  const context = vm.createContext({
    app,
    ParagraphJustification: { CENTER_JUSTIFY: "center" },
    KeyframeInterpolationType: { BEZIER: "bezier" },
    KeyframeEase: class {
      constructor(
        public speed: number,
        public influence: number,
      ) {}
    },
  });
  return {
    comps,
    run: (body: string) => vm.runInContext("(function(){" + body + "})()", context),
    undoDepth: () => undoDepth,
  };
}

describe("motion compiler", () => {
  it("builds editable native layers, deterministic timing and eased animation", () => {
    const spec = createMotionPreset({
      template: "statistic-card",
      title: "42%",
      subtitle: "Growth",
    });
    const native = host();
    const result = native.run(compileMotionSpec(spec));
    expect(result).toMatchObject({ ok: true, compId: 1, specHash: hashMotionSpec(spec) });
    expect(result.layers.map((l: any) => l.key)).toEqual(["panel", "accent", "title", "subtitle"]);
    const comp = native.comps[0];
    expect(comp.comment).toBe("ae-uber-mcp:motion:v1:" + hashMotionSpec(spec));
    expect(
      comp.created[0]
        .property("ADBE Root Vectors Group")
        .property("ADBE Vector Shape - Rect")
        .property("ADBE Vector Rect Size").value,
    ).toEqual([1574.3999999999999, 648]);
    const title = comp.created[2];
    expect(title.comment).toBe("ae-uber-mcp:layer:title");
    expect(title.property("ADBE Text Properties").property("ADBE Text Document").value.text).toBe(
      "42%",
    );
    expect(title.property("ADBE Transform Group").property("ADBE Anchor Point").value).toEqual([
      95, -10,
    ]);
    const opacity = title.property("ADBE Transform Group").property("ADBE Opacity");
    expect(opacity.keys.map((k: any) => k.value)).toEqual([0, 100, 100, 0]);
    expect(opacity.keys.map((k: any) => k.time)).toEqual([0, 0.8999999999999999, 5.1, 6]);
    expect(opacity.eases).toHaveLength(4);
    expect(opacity.eases[0][1][0]).toMatchObject({ speed: 0, influence: 66 });
    const position = title.property("ADBE Transform Group").property("ADBE Position");
    expect(position.keys[1].value).toEqual(spec.layers[2].position);
    expect(position.keys[0].value).not.toEqual(position.keys[1].value);
    expect(position.keys[3].value).not.toEqual(position.keys[2].value);
    expect(native.undoDepth()).toBe(0);
    expect(native.run(compileMotionSpec(spec)).compId).toBe(2);
    expect(native.comps).toHaveLength(2);
  });
  it("round trips user text including code, quotes and Unicode line separators as data", () => {
    const title = '"; throw new Error("injected"); // \\ \u2028\u2029 ♥';
    const spec = createMotionPreset({ template: "title-card", title });
    const native = host();
    const result = native.run(compileMotionSpec(spec));
    expect(result.ok).toBe(true);
    expect(
      native.comps[0].created[1].property("ADBE Text Properties").property("ADBE Text Document")
        .value.text,
    ).toBe(title);
  });
  it("retains created IDs on a partial native failure without nesting transport undo scopes", () => {
    const spec = createMotionPreset({ template: "title-card", title: "Title" });
    const native = host({ failAt: 1 });
    const result = native.run(compileMotionSpec(spec));
    expect(result).toMatchObject({
      ok: false,
      compId: 1,
      layers: [{ key: "panel", id: 100 }],
      error: "Native layer creation failed",
    });
    expect(native.undoDepth()).toBe(0);
  });
  it.each([{ noBounds: true }, { wide: true }])(
    "reports measured layout uncertainty without claiming clean visuals: %j",
    (options) => {
      const result = host(options).run(
        compileMotionSpec(createMotionPreset({ template: "title-card", title: "Title" })),
      );
      expect(result.ok).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    },
  );
  it("rejects invalid custom specs before returning executable code", () => {
    const spec = createMotionPreset({ template: "title-card", title: "Title" });
    spec.comp.width = -1;
    expect(() => compileMotionSpec(spec)).toThrow();
  });
});
