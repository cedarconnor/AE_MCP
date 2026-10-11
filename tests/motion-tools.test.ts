import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { motionPlanTool, motionBuildTool, motionAuditTool } from '../src/tools/motion.js';
import { writeReviewManifest } from '../src/motion/review.js';
import { compileMotionAudit } from '../src/motion/qa.js';
import { nullTransport } from './helpers/null-transport.js';

afterEach(() => { delete process.env.AE_MCP_READONLY; delete process.env.AE_MCP_ALLOW_CATEGORIES; });

describe('motion tools policy and failures', () => {
  it('plans offline without contacting AE', async () => {
    const t = nullTransport();
    const result = await motionPlanTool.handler({ template:'title-card', title:'A real motion task' },t);
    expect(result.isError).toBe(false);
    expect(result.structuredContent?.spec).toHaveProperty('version',1);
    expect(t.calls).toHaveLength(0);
  });
  it('read-only build refuses before host mutation', async () => {
    process.env.AE_MCP_READONLY='1';
    const t=nullTransport();
    const r=await motionBuildTool.handler({spec:{}},t);
    expect(r.structuredContent?.error).toMatchObject({code:'FORBIDDEN'});
    expect(t.calls).toHaveLength(0);
  });
  it('category allowlist prevents composite build bypass', async () => {
    process.env.AE_MCP_ALLOW_CATEGORIES='motion';
    const t=nullTransport();
    const r=await motionBuildTool.handler({spec:{}},t);
    expect(r.structuredContent?.error).toMatchObject({code:'FORBIDDEN'});
    expect(t.calls).toHaveLength(0);
  });
  it('invalid spec never reaches AE',async()=>{
    const t=nullTransport();
    const r=await motionBuildTool.handler({spec:{version:1}},t);
    expect(r.structuredContent?.error).toMatchObject({code:'VALIDATION'});
    expect(t.calls).toHaveLength(0);
  });
  it('native partial build is an MCP error with created object evidence',async()=>{
    const p=await motionPlanTool.handler({template:'title-card',title:'Test'},nullTransport());
    const t=nullTransport({result:{ok:false,error:'font failure',compId:42,layers:[]}});
    const r=await motionBuildTool.handler({spec:p.structuredContent!.spec},t);
    expect(r.isError).toBe(true);
    expect(r.structuredContent?.error).toMatchObject({details:{result:{compId:42}}});
  });
  it('audit refuses an invalid comp ID without executing',async()=>{
    const t=nullTransport();
    const r=await motionAuditTool.handler({compId:-1},t);
    expect(r.isError).toBe(true);
    expect(t.calls).toHaveLength(0);
  });
});

describe('audit native facts',()=>{
  it('counts keys in named Transform groups excluded by Layer.numProperties',()=>{
    const prop={numProperties:0,numKeys:4,expressionEnabled:false,expressionError:''};
    const transform={matchName:'ADBE Transform Group',numProperties:1,property:()=>prop};
    const layer={id:9,name:'Title',comment:'',inPoint:0,outPoint:5,enabled:true,numProperties:0,property:(key:unknown)=>key==='ADBE Transform Group'?transform:null};
    const comp={id:2,name:'Demo',comment:'',width:1920,height:1080,duration:5,frameRate:30,numLayers:1,layer:()=>layer};
    const r=new Function('AE','app',compileMotionAudit(2))({findCompByNameOrId:()=>comp},{project:{file:null}});
    expect(r.layers[0].keyframes).toBe(4);
  });
  it('reports an expression disabled by AE after evaluation failure',()=>{
    const prop={numProperties:0,numKeys:0,expressionEnabled:false,expressionError:'undefined value'};
    const layer={id:9,name:'Title',comment:'',inPoint:0,outPoint:5,enabled:true,numProperties:1,property:(key:unknown)=>key===1?prop:null};
    const comp={id:2,name:'Demo',comment:'',width:1920,height:1080,duration:5,frameRate:30,numLayers:1,layer:()=>layer};
    const r=new Function('AE','app',compileMotionAudit(2))({findCompByNameOrId:()=>comp},{project:{file:null}});
    expect(r.technicalStatus).toBe('issues_found');
    expect(r.issues[0].code).toBe('EXPRESSION_ERROR');
  });
  it('reports expression errors and does not claim visual acceptance',()=>{
    const prop={numProperties:0,numKeys:2,name:'Opacity',matchName:'ADBE Opacity',expressionEnabled:true,expressionError:'bad expression'};
    const layer={id:9,name:'Title',comment:'',inPoint:0,outPoint:5,enabled:true,numProperties:1,property:()=>prop};
    const comp={id:2,name:'Demo',comment:'',width:1920,height:1080,duration:5,frameRate:30,numLayers:1,layer:()=>layer};
    const r=new Function('AE','app',compileMotionAudit(2))({findCompByNameOrId:()=>comp},{project:{file:null}});
    expect(r.issues.some((i:{code:string})=>i.code==='EXPRESSION_ERROR')).toBe(true);
    expect(r.layers[0].keyframes).toBe(2);
    expect(r.visualAcceptance).toBe('not_assessed');
  });
});

describe('review evidence',()=>{
  it('hashes actual captured bytes and preserves exact sample times',async()=>{
    const dir=await mkdtemp(path.join(tmpdir(),'ae-review-'));
    try {
      const file=path.join(dir,'frame.png');
      const bytes=Buffer.from('fixture-captured-bytes');
      await writeFile(file,bytes);
      const manifest=await writeReviewManifest({directory:dir,compId:7,specHash:'abc',frames:[{writtenTo:file,time:1.25,size:[640,360]}],audit:{visualAcceptance:'not_assessed'},notes:'Check spacing'});
      const data=JSON.parse(await readFile(manifest.path,'utf8'));
      expect(data.frames[0]).toMatchObject({time:1.25,sha256:createHash('sha256').update(bytes).digest('hex')});
      expect(data.artistAcceptance).toBe('pending');
      expect(data.coverage).toBe('sampled_frames_only');
      expect(data.notes).toBe('Check spacing');
    } finally { await rm(dir,{recursive:true,force:true}); }
  });
  it('refuses a missing capture rather than writing a complete review',async()=>{
    const dir=await mkdtemp(path.join(tmpdir(),'ae-review-'));
    try {await expect(writeReviewManifest({directory:dir,compId:7,frames:[{writtenTo:path.join(dir,'missing.png'),time:0,size:[1,1]}],audit:{}})).rejects.toThrow();}
    finally {await rm(dir,{recursive:true,force:true});}
  });
});
