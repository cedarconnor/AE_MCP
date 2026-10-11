import { jsxVal } from '../registry.js';

/** Bounded native inspection. This deliberately makes no claim about taste or pixels. */
export function compileMotionAudit(compId: number): string {
  if (!Number.isInteger(compId) || compId < 1) throw new Error('compId must be a positive integer');
  return `
    var c = AE.findCompByNameOrId(${jsxVal(compId)});
    if (!c) return {ok:false,error:'composition not found'};
    var issues=[], layers=[], visited=0, truncated=false;
    function issue(code, layerId, message) {
      if (issues.length < 200) issues.push({code:code,layerId:layerId,message:message});
      else truncated=true;
    }
    function walk(node, summary, depth) {
      if (depth>16 || visited>=20000) {truncated=true;return;}
      visited++;
      try { if (node.numKeys) summary.keyframes+=node.numKeys; } catch(eKeys) {}
      try {if (node.expressionError) issue('EXPRESSION_ERROR',summary.id,String(node.expressionError)+' (enabled: '+String(node.expressionEnabled)+')');} catch(eExpr) {}
      var count=0; try {count=node.numProperties||0;} catch(eCount) {}
      for(var p=1;p<=count;p++) { if(visited>=20000){truncated=true;break;} try{walk(node.property(p),summary,depth+1);}catch(eProp){issue('UNREADABLE_PROPERTY',summary.id,AE.errText(eProp));} }
    }
    for(var i=1;i<=c.numLayers && i<=1000;i++) {
      var l=c.layer(i);
      var row={id:l.id,name:l.name,comment:l.comment||'',inPoint:l.inPoint,outPoint:l.outPoint,enabled:l.enabled,keyframes:0};
      if(l.outPoint<=l.inPoint) issue('EMPTY_LAYER_RANGE',l.id,'Layer has no visible duration');
      if(l.inPoint>=c.duration || l.outPoint<=0) issue('OUTSIDE_TIMELINE',l.id,'Layer does not intersect the composition timeline');
      try {if(l.source && l.source.footageMissing) issue('MISSING_FOOTAGE',l.id,'Source footage is missing');} catch(eFootage) {}
      var seenRoots={};
      function visitRoot(node) {
        if(!node)return;
        var rootKey=node.matchName||node.name||'';
        if(rootKey && seenRoots['$'+rootKey])return;
        if(rootKey)seenRoots['$'+rootKey]=true;
        walk(node,row,0);
      }
      for(var ri=1;ri<=l.numProperties;ri++) {try{visitRoot(l.property(ri));}catch(eRoot){issue('UNREADABLE_PROPERTY',l.id,AE.errText(eRoot));}}
      var named=['ADBE Transform Group','ADBE Text Properties','ADBE Root Vectors Group','ADBE Audio Group','ADBE Material Options Group','ADBE Camera Options Group','ADBE Light Options Group','ADBE Time Remapping'];
      for(var ni=0;ni<named.length;ni++) {try{visitRoot(l.property(named[ni]));}catch(eNamed){/* Group is not applicable to this layer type. */}}
      layers.push(row);
    }
    if(c.numLayers>1000) truncated=true;
    if(c.numLayers===0) issue('EMPTY_COMPOSITION',null,'Composition contains no layers');
    var marker='ae-uber-mcp:motion:v1:';
    var comment=c.comment||'';
    return {ok:true,compId:c.id,name:c.name,width:c.width,height:c.height,duration:c.duration,fps:c.frameRate,
      specHash:comment.indexOf(marker)===0?comment.substring(marker.length):null,
      projectFile:app.project.file?app.project.file.fsName:null,layers:layers,issues:issues,truncated:truncated,
      technicalStatus:truncated?'incomplete':(issues.length?'issues_found':'checks_passed'),
      coverage:'layer timing, missing footage, keyframe counts, current expression errors; no pixel/layout or full-animation judgement',
      visualAcceptance:'not_assessed'};
  `;
}
