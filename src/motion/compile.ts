import { hashMotionSpec, motionSpecSchema, type MotionSpec } from "./spec.js";

function jsxData(value: unknown): string {
  return JSON.stringify(value)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** An ES3 function body; run through the existing bridge, never eval in Node. */
export function compileMotionSpec(spec: MotionSpec): string {
  const parsed = motionSpecSchema.parse(spec);
  return `
var spec = ${jsxData(parsed)};
var result = {ok:false, compId:null, layers:[], specHash:${jsxData(hashMotionSpec(parsed))}, warnings:[]};
function errorText(e) {
  try { if (e && typeof e.message === "string") return e.message; } catch (ignored) {}
  return "Native After Effects operation failed";
}
function animate(prop, times, values, spatial) {
  var k;
  for (k = 0; k < times.length; k++) prop.setValueAtTime(times[k], values[k]);
  for (k = 1; k <= times.length; k++) {
    prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    prop.setTemporalEaseAtKey(k, [new KeyframeEase(0, 66)], [new KeyframeEase(0, 66)]);
    if (spatial) {
      prop.setSpatialAutoBezierAtKey(k, false);
      var tangent = prop.value.length === 3 ? [0,0,0] : [0,0];
      prop.setSpatialTangentsAtKey(k, tangent, tangent);
    }
  }
}
try {
  if (!app.project) throw new Error("Open or create an After Effects project first");
  var c = spec.comp;
  var comp = app.project.items.addComp(c.name, c.width, c.height, 1, c.duration, c.fps);
  result.compId = comp.id;
  comp.comment = "ae-uber-mcp:motion:v1:" + result.specHash;
  comp.bgColor = c.background;
  var i;
  for (i = 0; i < spec.layers.length; i++) {
    var s = spec.layers[i];
    var layer;
    if (s.type === "text") layer = comp.layers.addText(s.text);
    else layer = comp.layers.addShape();
    var identity = {key:s.key, id:layer.id, name:layer.name};
    result.layers.push(identity);
    layer.name = s.name;
    identity.name = layer.name;
    layer.comment = "ae-uber-mcp:layer:" + s.key;
    var tr = layer.property("ADBE Transform Group");
    var width, height;
    if (s.type === "text") {
      var source = layer.property("ADBE Text Properties").property("ADBE Text Document");
      var doc = source.value;
      doc.text = s.text;
      doc.font = s.font;
      doc.fontSize = s.fontSize;
      doc.applyFill = true;
      doc.applyStroke = false;
      doc.fillColor = s.color;
      doc.justification = ParagraphJustification.CENTER_JUSTIFY;
      source.setValue(doc);
      var actualDoc = source.value;
      if (actualDoc.font !== s.font) result.warnings.push(s.key + ": requested font substituted with " + actualDoc.font);
      try {
        var bounds = layer.sourceRectAtTime(s.timing.start + s.timing["in"], false);
        width = bounds.width; height = bounds.height;
        if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) throw new Error("Invalid text bounds");
        tr.property("ADBE Anchor Point").setValue([bounds.left + width/2, bounds.top + height/2]);
      } catch (boundsError) {
        width = 0; height = 0;
        result.warnings.push(s.key + ": sourceRectAtTime layout unavailable; review text anchor manually: " + errorText(boundsError));
      }
    } else {
      var vectors = layer.property("ADBE Root Vectors Group");
      var geometry;
      if (s.type === "rect") {
        geometry = vectors.addProperty("ADBE Vector Shape - Rect");
        geometry.property("ADBE Vector Rect Size").setValue(s.size);
      } else {
        geometry = vectors.addProperty("ADBE Vector Shape - Ellipse");
        geometry.property("ADBE Vector Ellipse Size").setValue(s.size);
      }
      var fill = vectors.addProperty("ADBE Vector Graphic - Fill");
      fill.property("ADBE Vector Fill Color").setValue(s.color);
      tr.property("ADBE Anchor Point").setValue([0,0]);
      width = s.size[0]; height = s.size[1];
    }
    var x = s.position[0], y = s.position[1];
    if (x-width/2 < 0 || x+width/2 > c.width || y-height/2 < 0 || y+height/2 > c.height) {
      result.warnings.push(s.key + ": measured hold bounds extend outside composition; review layout");
    }
    var t = s.timing;
    var times = [t.start, t.start+t["in"], t.start+t["in"]+t.hold, Math.min(c.duration,t.start+t["in"]+t.hold+t.out)];
    layer.inPoint = t.start;
    layer.outPoint = times[3];
    var offset = Math.min(60, c.height * 0.04);
    animate(tr.property("ADBE Position"), times, [[x,y+offset],[x,y],[x,y],[x,y-offset]], true);
    animate(tr.property("ADBE Opacity"), times, [0,100,100,0], false);
  }
  result.ok = true;
} catch (buildError) {
  result.error = errorText(buildError);
}
return result;`;
}
