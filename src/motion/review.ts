import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { rejectedOutputPath } from '../config.js';

export interface CapturedFrame { writtenTo:string; time:number; size?:number[]; [key:string]:unknown }
export interface ReviewInput {
  directory:string; compId:number; specHash?:string|null; frames:CapturedFrame[];
  audit:Record<string,unknown>; notes?:string; capture?:Record<string,unknown>;
}

export async function writeReviewManifest(input:ReviewInput):Promise<{path:string;manifest:Record<string,unknown>}> {
  const directory=path.resolve(input.directory);
  const denied=rejectedOutputPath(directory);
  if(denied) throw new Error(denied);
  if(input.frames.length===0) throw new Error('A review requires captured frames');
  const frames=[];
  for(const frame of input.frames) {
    const bytes=await readFile(frame.writtenTo);
    if(!bytes.length) throw new Error('Empty capture: '+frame.writtenTo);
    frames.push({...frame,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
  }
  const manifest={version:1,id:randomUUID(),createdAt:new Date().toISOString(),compId:input.compId,
    specHash:input.specHash??null,frames,audit:input.audit,capture:input.capture??null,
    notes:input.notes??'',coverage:'sampled_frames_only',artistAcceptance:'pending',
    identityNote:'IDs and spec tag describe this capture session. Reinspect after reopening/replacing a project; spec tag is provenance, not a hash of current AE state.'};
  await mkdir(directory,{recursive:true});
  const file=path.join(directory,`review-${manifest.id}.json`);
  await writeFile(file,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  return {path:file,manifest};
}
