import { describe, expect, it } from "vitest";
import { motionSpecSchema, hashMotionSpec } from "../src/motion/spec.js";
import { createMotionPreset } from "../src/motion/templates.js";

const fixture = () => ({
  version: 1,
  comp: { name: "Custom", width: 1920, height: 1080, duration: 6, fps: 30, background: [0, 0, 0] },
  layers: [
    {
      key: "title",
      name: "Title",
      type: "text",
      text: "Hello",
      font: "ArialMT",
      fontSize: 90,
      position: [960, 540],
      color: [1, 1, 1],
      timing: { start: 0, in: 1, hold: 4, out: 1 },
    },
  ],
});

describe("motion specification", () => {
  it("retains a portable custom layout", () => {
    expect(motionSpecSchema.parse(fixture())).toEqual(fixture());
  });
  it.each([
    [
      "nonfinite",
      (s: any) => {
        s.comp.fps = Infinity;
      },
    ],
    [
      "dimensions",
      (s: any) => {
        s.comp.width = 0;
      },
    ],
    [
      "oversize",
      (s: any) => {
        s.comp.height = 40000;
      },
    ],
    [
      "color",
      (s: any) => {
        s.layers[0].color[0] = 2;
      },
    ],
    [
      "duplicate key",
      (s: any) => {
        s.layers.push(s.layers[0]);
      },
    ],
    [
      "timing overflow",
      (s: any) => {
        s.layers[0].timing.out = 2;
      },
    ],
    [
      "zero entrance",
      (s: any) => {
        s.layers[0].timing.in = 0;
      },
    ],
    [
      "negative start",
      (s: any) => {
        s.layers[0].timing.start = -1;
      },
    ],
    [
      "unknown field",
      (s: any) => {
        s.layers[0].expression = "unsafe";
      },
    ],
  ])("rejects %s before host execution", (_label, change) => {
    const spec = fixture();
    change(spec);
    expect(motionSpecSchema.safeParse(spec).success).toBe(false);
  });
  it("hashes key order canonically but preserves meaningful layer order and values", () => {
    const spec = motionSpecSchema.parse(fixture());
    const reordered = { layers: spec.layers, comp: spec.comp, version: spec.version };
    expect(hashMotionSpec(spec)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashMotionSpec(reordered)).toBe(hashMotionSpec(spec));
    expect(hashMotionSpec({ ...spec, comp: { ...spec.comp, name: "Changed" } })).not.toBe(
      hashMotionSpec(spec),
    );
  });
  it("rejects timings whose key times collapse at numeric precision", () => {
    const spec = fixture();
    spec.layers[0].timing = { start: 1, in: Number.MIN_VALUE, hold: 1, out: 1 };
    expect(motionSpecSchema.safeParse(spec).success).toBe(false);
  });
  it.each(["title-card", "lower-third", "statistic-card"] as const)(
    "creates valid %s with supplied typography and dimensions",
    (template) => {
      const spec = createMotionPreset({
        template,
        title: "42%",
        subtitle: "Growth",
        width: 1280,
        height: 720,
        duration: 3,
        fps: 24,
        font: "Verdana",
        name: "Campaign",
      });
      expect(motionSpecSchema.safeParse(spec).success).toBe(true);
      expect(spec.comp).toMatchObject({
        width: 1280,
        height: 720,
        duration: 3,
        fps: 24,
        name: "Campaign",
      });
      expect(
        spec.layers.some((l: any) => l.type === "text" && l.text === "42%" && l.font === "Verdana"),
      ).toBe(true);
      expect(spec.layers.some((l: any) => l.type === "text" && l.text === "Growth")).toBe(true);
    },
  );
});
