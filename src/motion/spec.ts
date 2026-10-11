import { createHash } from "node:crypto";
import { z } from "zod";

const finite = () => z.number().finite();
const color = z.tuple([finite().min(0).max(1), finite().min(0).max(1), finite().min(0).max(1)]);
const position = z.tuple([finite().min(-30000).max(60000), finite().min(-30000).max(60000)]);
const name = z.string().trim().min(1).max(255);
const timing = z.strictObject({
  start: finite().min(0),
  in: finite().positive(),
  hold: finite().positive(),
  out: finite().positive(),
});
const base = {
  key: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/),
  name,
  position,
  color,
  timing,
};
const textLayer = z.strictObject({
  ...base,
  type: z.literal("text"),
  text: z.string().min(1).max(20000),
  font: name,
  fontSize: finite().min(1).max(1296),
});
const size = z.tuple([finite().positive().max(30000), finite().positive().max(30000)]);

/** Layer order is back to front; positions identify the visual center. Times are seconds. */
export const motionSpecSchema = z
  .strictObject({
    version: z.literal(1),
    comp: z.strictObject({
      name,
      width: finite().int().min(4).max(30000),
      height: finite().int().min(4).max(30000),
      duration: finite().min(0.1).max(10800),
      fps: finite().min(1).max(99),
      background: color,
    }),
    layers: z
      .array(
        z.discriminatedUnion("type", [
          textLayer,
          z.strictObject({ ...base, type: z.literal("rect"), size }),
          z.strictObject({ ...base, type: z.literal("ellipse"), size }),
        ]),
      )
      .min(1)
      .max(200),
  })
  .superRefine((spec, ctx) => {
    const keys = new Set<string>();
    spec.layers.forEach((layer, index) => {
      if (keys.has(layer.key))
        ctx.addIssue({
          code: "custom",
          path: ["layers", index, "key"],
          message: "Layer keys must be unique",
        });
      keys.add(layer.key);
      const t = layer.timing;
      const times = [
        t.start,
        t.start + t.in,
        t.start + t.in + t.hold,
        Math.min(spec.comp.duration, t.start + t.in + t.hold + t.out),
      ];
      if (times.some((time, i) => i > 0 && time <= times[i - 1]))
        ctx.addIssue({
          code: "custom",
          path: ["layers", index, "timing"],
          message: "Key times must be distinct and increasing",
        });
      if (t.start + t.in + t.hold + t.out > spec.comp.duration + 1e-8)
        ctx.addIssue({
          code: "custom",
          path: ["layers", index, "timing"],
          message: "Entrance, hold and exit must fit composition duration",
        });
    });
  });
export type MotionSpec = z.infer<typeof motionSpecSchema>;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      "{" +
      Object.keys(record)
        .sort()
        .map((key) => JSON.stringify(key) + ":" + canonical(record[key]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(value);
}

export function hashMotionSpec(spec: MotionSpec): string {
  return createHash("sha256")
    .update(canonical(motionSpecSchema.parse(spec)))
    .digest("hex");
}
