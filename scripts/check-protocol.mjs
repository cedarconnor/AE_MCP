import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const entry=process.argv[2]??fileURLToPath(new URL('../dist/index.js',import.meta.url));
const client=new Client({name:'uber-ae-protocol-check',version:'1.0.0'});
try {
  await client.connect(new StdioClientTransport({command:process.execPath,args:[entry],stderr:'pipe'}));
  const tools=(await client.listTools()).tools;
  for(const name of ['ae_motion_plan','ae_motion_build','ae_motion_review','ae_motion_audit','ae_catalog','ae_request_status'])assert(tools.some(t=>t.name===name),name);
  const planned=await client.callTool({name:'ae_motion_plan',arguments:{template:'title-card',title:'Protocol test'}});
  assert(!planned.isError);
  assert.equal(planned.structuredContent.spec.version,1);
  const catalog=await client.callTool({name:'ae_catalog',arguments:{}});
  assert(!catalog.isError);
  const resources=(await client.listResources()).resources;
  assert(resources.some(r=>r.uri==='ae-uber://motion-spec-schema'));
  const schema=await client.readResource({uri:'ae-uber://motion-spec-schema'});
  assert(JSON.parse(schema.contents[0].text).properties.version);
  const prompts=await client.listPrompts();
  assert(prompts.prompts.some(p=>p.name==='motion-graphics'));
  console.log(JSON.stringify({ok:true,server:await client.getServerVersion(),tools:tools.length,operations:catalog.structuredContent.totalOperations,resources:resources.length,prompts:prompts.prompts.length},null,2));
}finally{await client.close();}
