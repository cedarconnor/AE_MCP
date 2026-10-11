import { randomUUID } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { rejectedOutputPath } from '../config.js';
import { errorResult } from '../errors.js';
import { allowedCategories, readOnlyMode } from '../policy.js';
import { motionSpecSchema, hashMotionSpec } from '../motion/spec.js';
import { createMotionPreset } from '../motion/templates.js';
import { compileMotionSpec } from '../motion/compile.js';
import { compileMotionAudit } from '../motion/qa.js';
import { writeReviewManifest, type CapturedFrame } from '../motion/review.js';
import { defineTool, jsonResult, toMcpResult } from './define-tool.js';
import { renderFrameTool } from './render-frame.js';

function deniedCategories(categories:string[]):string|null {
  const allowed=allowedCategories();
  const missing=allowed?categories.filter(c=>!allowed.has(c)):[];
  return missing.length?'Required operation categories are disabled: '+missing.join(', '):null;
}

export const motionPlanTool=defineTool({
  name:'ae_motion_plan',title:'Plan editable motion graphics',group:'operations',effect:'read',blockedInReadOnly:false,
  description:'Create a portable version-1 native motion specification offline. Presets are starting layouts: title-card, lower-third, statistic-card. Edit the returned spec for custom text/rectangle/ellipse layouts, then pass it to ae_motion_build. No AE mutation.',
  inputShape:{template:z.enum(['title-card','lower-third','statistic-card']),title:z.string().min(1).max(2000),
    subtitle:z.string().max(4000).optional(),name:z.string().min(1).max(200).optional(),
    width:z.number().int().min(64).max(16384).optional(),height:z.number().int().min(64).max(16384).optional(),
    duration:z.number().min(1).max(600).optional(),fps:z.number().min(1).max(99).optional(),font:z.string().min(1).max(200).optional()},
  handler:async(args)=>{
    try {const spec=createMotionPreset(args);return jsonResult({spec,specHash:hashMotionSpec(spec),next:'Review/edit spec, then ae_motion_build. Font and layout validation continue in AE.'});}
    catch(e){return errorResult('VALIDATION',e instanceof Error?e.message:String(e));}
  }
});

export const motionBuildTool=defineTool({
  name:'ae_motion_build',title:'Build an editable motion composition',group:'operations',effect:'write',blockedInReadOnly:true,
  description:'Validate a version-1 motion spec and create a NEW composition with native editable text/shapes and eased position/opacity keyframes. Existing compositions stay intact. Returns IDs for subsequent edits. Requires comp,layer,text,shape,keyframe categories. Partial failure reports created objects. Never automatically retry a timeout.',
  inputShape:{spec:z.unknown().describe('Version-1 spec from ae_motion_plan or examples; strict validation runs before AE.'),timeoutMs:z.number().int().min(1000).max(600000).optional()},
  handler:async(args,transport)=>{
    const denial=readOnlyMode()?'AE_MCP_READONLY=1 blocks motion builds':deniedCategories(['comp','layer','text','shape','keyframe']);
    if(denial)return errorResult('FORBIDDEN',denial);
    const parsed=motionSpecSchema.safeParse(args.spec);
    if(!parsed.success)return errorResult('VALIDATION','Invalid motion specification',{details:{issues:parsed.error.issues}});
    return toMcpResult(await transport.execute({code:compileMotionSpec(parsed.data),label:'Uber MCP motion build',timeoutMs:args.timeoutMs??120000}));
  }
});

export const motionAuditTool=defineTool({
  name:'ae_motion_audit',title:'Inspect motion composition facts',group:'inspect',effect:'read',blockedInReadOnly:false,
  description:'Check native layer timing, keyframe counts, missing footage and current expression errors. Bounded to 1000 layers/20000 properties. Does not judge aesthetics, clipping, full animation or artist acceptance. IDs are scoped to the active project; inspect after project changes.',
  inputShape:{compId:z.number().int().positive()},
  handler:async(args,transport)=>{
    const denial=deniedCategories(['inspect']);if(denial)return errorResult('FORBIDDEN',denial);
    if(!Number.isInteger(args.compId)||args.compId<1)return errorResult('INVALID_ARGS','compId must be positive');
    return toMcpResult(await transport.execute({code:compileMotionAudit(args.compId),label:'motion audit',undoGroup:false}));
  }
});

export const motionReviewTool=defineTool({
  name:'ae_motion_review',title:'Capture a durable motion review',group:'render',effect:'write',blockedInReadOnly:false,
  description:'Inspect composition, capture 2–16 requested times, return contact sheet image and save a review manifest containing frame hashes, actual times, spec provenance and notes. This is sampled visual evidence; artist acceptance remains pending. Writes a unique review directory. Color/alpha limitations are reported by the native capture path.',
  inputShape:{compId:z.number().int().positive(),times:z.array(z.number().nonnegative()).min(2).max(16),
    directory:z.string().min(1),notes:z.string().max(20000).optional()},
  handler:async(args,transport)=>{
    const denial=deniedCategories(['inspect','render']);if(denial)return errorResult('FORBIDDEN',denial);
    if(!path.isAbsolute(args.directory))return errorResult('INVALID_ARGS','directory must be absolute');
    const rejection=rejectedOutputPath(args.directory);if(rejection)return errorResult('IO',rejection);
    const inspected=await motionAuditTool.handler({compId:args.compId},transport);
    if(inspected.isError)return inspected;
    const audit=inspected.structuredContent?.result as Record<string,unknown>;
    if(!audit || typeof audit.duration!=='number')return errorResult('OPERATION_FAILED','Audit did not return a composition duration');
    if(args.times.some(t=>!Number.isFinite(t)||t<0||t>=Number(audit.duration)))return errorResult('INVALID_ARGS','Each sample time must be within [0, comp duration)');
    const dir=path.join(args.directory,'motion-review-'+randomUUID());
    try {
      await mkdir(dir,{recursive:true});
      const captures=await renderFrameTool.handler({compNameOrId:args.compId,times:args.times,outPath:path.join(dir,'frame.png'),
        analyze:true,contactSheet:{columns:Math.min(4,args.times.length),thumbWidth:480}},transport);
      if(captures.isError)return captures;
      const capture=captures.structuredContent?.result as Record<string,unknown>;
      const frames=capture?.frames as CapturedFrame[]|undefined;
      if(!frames||frames.length!==args.times.length)return errorResult('OPERATION_FAILED','Capture returned an incomplete frame set',{details:{directory:dir,capture}});
      const saved=await writeReviewManifest({directory:dir,compId:args.compId,specHash:typeof audit.specHash==='string'?audit.specHash:null,
        frames,audit,notes:args.notes,capture});
      const result=jsonResult({reviewPath:saved.path,review:saved.manifest});
      const sheet=path.join(dir,'frame_sheet.png');
      try{const bytes=await readFile(sheet);if(bytes.length<=8*1024*1024)result.content.push({type:'image',data:bytes.toString('base64'),mimeType:'image/png'});}catch{/* Manifest remains useful if contact sheet was unavailable. */}
      return result;
    }catch(e){return errorResult('IO',e instanceof Error?e.message:String(e),{details:{directory:dir}});}
  }
});

export const MOTION_TOOLS=[motionPlanTool,motionBuildTool,motionAuditTool,motionReviewTool];
