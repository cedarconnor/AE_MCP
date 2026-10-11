import { describe, it, expect } from 'vitest';
import { measureCaptureTransfer } from '../src/color/calibration.js';
import { renderFrameTool } from '../src/tools/render-frame.js';
import { nullTransport } from './helpers/null-transport.js';
import type { EvalResult } from '../src/transport/AeTransport.js';

const late:EvalResult={ok:false,result:null,error:'host may still be running',errorCode:'TIMEOUT',stack:null,logs:[],durationMs:60000,
  requestId:'9d3153b0-0321-44d0-aead-66160686f8de',state:'running',mayStillRun:true};

describe('secondary capture request recovery',()=>{
  it('retains calibration transport recovery identity',async()=>{
    const r=await measureCaptureTransfer(nullTransport(late),'uncached-calibration-recovery');
    expect(r).toMatchObject({transportResult:{requestId:late.requestId,state:'running',mayStillRun:true}});
  });
  it('does not report successful capture after calibration times out',async()=>{
    let count=0;
    const transport={async execute():Promise<EvalResult>{
      count++;
      if(count===1)return {...late,ok:true,error:null,errorCode:null,requestId:'first-completed-capture',state:'completed',mayStillRun:false,
        result:{ok:true,compName:'Demo',workingSpace:'ACEScg',bitsPerChannel:32,projectFile:'recovery-test-project',captureKind:'ocio',frames:[{ok:true,writtenTo:'C:/capture-fixture.png',time:1,size:[4,4]}]}};
      return late;
    }};
    const r=await renderFrameTool.handler({compNameOrId:1,time:1,outPath:'C:/capture-fixture.png'},transport);
    expect(r.isError).toBe(true);
    expect(r.structuredContent?.error).toMatchObject({code:'TIMEOUT',details:{requestId:late.requestId,state:'running',mayStillRun:true}});
  });
});
