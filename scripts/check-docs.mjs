#!/usr/bin/env node
// Checks documentation contracts without dispatching any native AE request.
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const key of ['AE_MCP_READONLY', 'AE_MCP_ENABLE_EVAL', 'AE_MCP_ALLOW_CATEGORIES']) delete process.env[key];
const load = name => import(pathToFileURL(path.join(root, 'dist', name)).href);
await load('operations/index.js');
const { ALL_TOOLS } = await load('tools/index.js');
const { getOp, listOps } = await load('registry.js');
const { validateOpArgs } = await load('opschema.js');
const { motionSpecSchema } = await load('motion/spec.js');
const { operationExamples } = await import('./doc-examples.mjs');
const defaultOps = listOps();
const categories = [...new Set(defaultOps.map(op => op.category))].toSorted();
assert.deepEqual([...new Set(Object.keys(operationExamples).map(name => getOp(name).category))].toSorted(), categories, 'Every category needs a concrete example');

function validateOperation(name, args) {
  const op = getOp(name);
  assert(op, `Unknown documented operation: ${name}`);
  const result = validateOpArgs(op, args);
  assert(result.ok, `${name}: ${JSON.stringify(result.issues)}`);
  assert.equal(typeof op.toJsx(args), 'string');
  if (name === 'batch.run') for (const child of args.ops) validateOperation(child.operation, child.args ?? {});
}
function validateCall(value) {
  const tool = ALL_TOOLS.find(t => t.name === value.name);
  assert(tool, `Unknown documented tool: ${value.name}`);
  // Be stricter than the SDK's stripping behavior so typos cannot silently pass.
  z.strictObject(tool.inputShape).parse(value.arguments);
  if (value.name === 'ae_motion_build') motionSpecSchema.parse(value.arguments.spec);
  if (value.name === 'ae_do') validateOperation(value.arguments.operation, value.arguments.args ?? {});
}
assert.throws(() => validateCall({name: 'ae_motion_plan', arguments: {template: 'not-a-preset', title: 'x'}}));
assert.throws(() => validateOperation('comp.create', {name: 'x', unknownField: true}));

const guides = ['README.md', ...['TOOLS','OPERATIONS','SETUP','CONFIGURATION','EXAMPLES','MOTION_SPEC','TROUBLESHOOTING','ARCHITECTURE','DEVELOPMENT','DOCUMENTATION_VALIDATION'].map(n => `docs/${n}.md`)];
const cache = new Map();
const read = async p => { if (!cache.has(p)) cache.set(p, await readFile(p, 'utf8')); return cache.get(p); };
const slug = s => s.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/ /g, '-');
let linkCount = 0, callCount = 0, specCount = 0, jsonCount = 0;
for (const guide of guides) {
  const file = path.join(root, guide);
  const source = await read(file);
  for (const match of source.matchAll(/```json\s*\r?\n([\s\S]*?)\r?\n```/g)) {
    const value = JSON.parse(match[1]);
    jsonCount++;
    if (typeof value.name === 'string' && value.arguments) { validateCall(value); callCount++; }
    else if (value.version === 1 && value.comp && value.layers) { motionSpecSchema.parse(value); specCount++; }
    else if (value.template && value.title) validateCall({name:'ae_motion_plan',arguments:value});
  }
  const prose = source.replace(/```[\s\S]*?```/g, '');
  for (const match of prose.matchAll(/\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
    const url = match[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) continue;
    const [relative, fragment] = url.split('#');
    const target = relative ? path.resolve(path.dirname(file), decodeURIComponent(relative)) : file;
    const info = await stat(target).catch(() => null);
    assert(info, `${guide}: missing local link ${url}`);
    if (fragment && target.endsWith('.md') && info.isFile()) {
      const targetText = await read(target);
      const anchors = new Set([...targetText.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m => slug(m[1].trim())));
      for (const id of targetText.matchAll(/<a id="([^"]+)">/g)) anchors.add(id[1]);
      assert(anchors.has(decodeURIComponent(fragment)), `${guide}: missing anchor ${url}`);
    }
    linkCount++;
  }
}
for (const name of await readdir(path.join(root, 'examples'))) {
  if (name.endsWith('.json')) { motionSpecSchema.parse(JSON.parse(await readFile(path.join(root,'examples',name),'utf8'))); specCount++; }
}
const readme = await read(path.join(root, 'README.md'));
assert(readme.includes(`all ${ALL_TOOLS.length} MCP`));
assert(readme.includes(`all ${defaultOps.length} default operations in ${categories.length} categories`));

const documentedTools = JSON.parse(await readFile(path.join(root,'docs/reference/tools.json'),'utf8'));
const documentedOps = JSON.parse(await readFile(path.join(root,'docs/reference/operations.json'),'utf8'));
const client = new Client({name:'ae-docs-verifier',version:'1.0.0'});
try {
  // Only discovery, resource reads and the offline catalog are called below.
  const env = Object.fromEntries(Object.entries(process.env).filter(([,value]) => typeof value === 'string'));
  await client.connect(new StdioClientTransport({command:process.execPath,args:[path.join(root,'dist/index.js')],stderr:'pipe',env}));
  const discovered = (await client.listTools()).tools;
  assert.deepEqual(discovered.map(t=>t.name).toSorted(), documentedTools.map(t=>t.name).toSorted());
  for (const tool of discovered) {
    const doc = documentedTools.find(d=>d.name===tool.name);
    assert.deepEqual(tool.inputSchema,doc.inputSchema,`${tool.name}: documented schema differs from MCP discovery`);
    assert.equal(tool.description,doc.description);
  }
  const catalog = await client.callTool({name:'ae_catalog',arguments:{}});
  assert(!catalog.isError);
  assert.equal(catalog.structuredContent.totalOperations,documentedOps.length);
  for (const category of categories) {
    const response = await client.callTool({name:'ae_catalog',arguments:{category}});
    assert(!response.isError);
    const expected = documentedOps.filter(o=>o.category===category).map(o=>{
      const definition={name:o.name,description:o.description,readOnly:o.readOnly,
        params:o.params.map(p=>{
        const param={name:p.name,type:p.type,required:p.required??false,description:p.description};
        if(p.nullable)param.nullable=true;
        if(p.default!==undefined)param.default=p.default;
        return param;
        })
      };
      if(o.appConfig)definition.appConfig=true;
      return definition;
    });
    assert.deepEqual(response.structuredContent.operations.toSorted((a,b)=>a.name.localeCompare(b.name)),expected);
  }
  const schema = await client.readResource({uri:'ae-uber://motion-spec-schema'});
  assert.deepEqual(JSON.parse(schema.contents[0].text),JSON.parse(await readFile(path.join(root,'docs/reference/motion-spec.schema.json'),'utf8')));
} finally { await client.close(); }
console.log(`Documentation verified: ${guides.length} guides, ${linkCount} local links, ${jsonCount} JSON blocks, ${callCount} example calls, ${specCount} complete specs; MCP schemas/catalog match ${documentedTools.length} tools and ${documentedOps.length} operations. No native AE commands executed.`);
