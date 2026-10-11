import assert from 'node:assert/strict';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const dir=path.join(root,'artifacts','live-'+new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(dir,{recursive:true});
const client=new Client({name:'uber-ae-live-smoke',version:'1.0.0'});
const evidence={startedAt:new Date().toISOString(),directory:dir,calls:[],compositions:[],status:'running'};
async function persist(){await writeFile(path.join(dir,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');}
async function call(name,args={}){
  console.log(name);
  const response=await client.callTool({name,arguments:args},undefined,{timeout:240000});
  const data=response.structuredContent??{};
  evidence.calls.push({name,arguments:args,isError:!!response.isError,response:data});
  await persist();
  assert(!response.isError,`${name}: ${JSON.stringify(data)}`);
  return data;
}
try {
  await client.connect(new StdioClientTransport({command:process.execPath,args:[path.join(root,'dist/index.js')],stderr:'pipe'}));
  const version=await call('ae_version_info');evidence.host=version.result;
  const before=await call('ae_project_info');
  assert.equal(before.result.numItems,0,'Live smoke requires an empty project. No existing project will be closed or replaced.');
  const tasks=[
    {template:'title-card',title:'IDEAS IN MOTION',subtitle:'Editable native layers · After Effects Uber MCP'},
    {template:'lower-third',title:'CEDAR / MOTION DESIGN',subtitle:'Native type, shapes and easing'},
    {template:'statistic-card',title:'218',subtitle:'Discoverable editing operations'}
  ];
  for(const task of tasks){
    const planned=await call('ae_motion_plan',{...task,name:'Uber MCP — '+task.template,width:1280,height:720,duration:6,fps:30});
    await writeFile(path.join(dir,task.template+'.json'),JSON.stringify(planned.spec,null,2)+'\n');
    const built=await call('ae_motion_build',{spec:planned.spec});
    assert(built.result.compId>0);
    const audit=await call('ae_motion_audit',{compId:built.result.compId});
    assert.equal(audit.result.layers.length,planned.spec.layers.length);
    for(const layer of audit.result.layers) assert.equal(layer.keyframes,8,`Native keyframe count for ${layer.name}`);
    assert.equal(audit.result.technicalStatus,'checks_passed',JSON.stringify(audit.result.issues));
    if(task.template==='title-card'){
      const title=built.result.layers.find(l=>l.key==='title');
      const revised=await call('ae_do',{operation:'text.set_content',args:{comp:built.result.compId,layer:{id:title.id},text:'IDEAS. IN MOTION.'}});
      assert.equal(revised.result.text,'IDEAS. IN MOTION.');
      const detail=await call('ae_do',{operation:'layer.info',args:{comp:built.result.compId,layer:{id:title.id},detail:'summary'}});
      evidence.revisedTitle={layerId:title.id,response:detail};
    }
    const review=await call('ae_motion_review',{compId:built.result.compId,times:[0.1,0.45,1.3,3,5.6,5.95],directory:dir,
      notes:'Automated native smoke. Captures require visual inspection; artist acceptance remains pending.'});
    evidence.compositions.push({template:task.template,compId:built.result.compId,buildWarnings:built.result.warnings,reviewPath:review.reviewPath});
  }
  const aep=path.join(dir,'Uber-MCP-Motion-Demo.aep');
  await call('ae_save_project',{path:aep});
  assert((await stat(aep)).size>0);
  evidence.project=aep;evidence.status='passed';evidence.finishedAt=new Date().toISOString();
  await persist();console.log(JSON.stringify({ok:true,directory:dir,project:aep,compositions:evidence.compositions},null,2));
}catch(error){evidence.status='failed';evidence.error=error.message;await persist();console.error(error);process.exitCode=1;}
finally{await client.close();}
