import { motionSpecSchema, type MotionSpec } from "./spec.js";

export function createMotionPreset(input: {
  template: "title-card" | "lower-third" | "statistic-card";
  title: string;
  subtitle?: string;
  name?: string;
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  font?: string;
}): MotionSpec {
  const width = input.width ?? 1920;
  const height = input.height ?? 1080;
  const duration = input.duration ?? 6;
  const font = input.font ?? "ArialMT";
  const timing = { start: 0, in: duration * 0.15, hold: duration * 0.7, out: duration * 0.15 };
  const layers: MotionSpec["layers"] = [];
  const lower = input.template === "lower-third";
  const stat = input.template === "statistic-card";
  const x = lower ? width * 0.3 : width * 0.5;
  const y = lower ? height * 0.8 : height * 0.46;
  layers.push({
    key: "panel",
    name: "Panel",
    type: "rect",
    position: [x, lower ? height * 0.81 : height * 0.5],
    size: [width * (lower ? 0.5 : 0.82), height * (lower ? 0.23 : 0.6)],
    color: [0.055, 0.08, 0.14],
    timing,
  });
  if (stat)
    layers.push({
      key: "accent",
      name: "Accent",
      type: "ellipse",
      position: [width * 0.25, height * 0.45],
      size: [height * 0.08, height * 0.08],
      color: [0.2, 0.8, 0.85],
      timing,
    });
  layers.push({
    key: "title",
    name: "Title",
    type: "text",
    text: input.title,
    font,
    fontSize: Math.max(1, height * (lower ? 0.045 : stat ? 0.11 : 0.075)),
    position: [x, y],
    color: [1, 1, 1],
    timing,
  });
  if (input.subtitle)
    layers.push({
      key: "subtitle",
      name: "Subtitle",
      type: "text",
      text: input.subtitle,
      font,
      fontSize: Math.max(1, height * (lower ? 0.028 : 0.032)),
      position: [x, y + height * (lower ? 0.06 : 0.12)],
      color: [0.65, 0.8, 0.9],
      timing,
    });
  return motionSpecSchema.parse({
    version: 1,
    comp: {
      name: input.name ?? input.template,
      width,
      height,
      duration,
      fps: input.fps ?? 30,
      background: [0.012, 0.018, 0.035],
    },
    layers,
  });
}
