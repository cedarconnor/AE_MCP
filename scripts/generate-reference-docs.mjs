#!/usr/bin/env node
// Source-derived reference; never launches AE or executes generated JSX.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';
import { sampleSpec, toolExamples, operationExamples } from './doc-examples.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Generate the canonical catalog regardless of the shell's active policy.
delete process.env.AE_MCP_ENABLE_EVAL;
delete process.env.AE_MCP_READONLY;
delete process.env.AE_MCP_ALLOW_CATEGORIES;
const load = p => import(pathToFileURL(path.join(root, 'dist', p)).href);
await load('operations/index.js');
const { listOps, getOp } = await load('registry.js');
const { ALL_TOOLS } = await load('tools/index.js');
const { validateOpArgs } = await load('opschema.js');
const { motionSpecSchema } = await load('motion/spec.js');
const ops = listOps().toSorted((a,b)=>a.name.localeCompare(b.name));
await load('operations/eval.js');
const optionalEval = getOp('eval.run');
const check = process.argv.includes('--check');
const cell = v => String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const json = v => JSON.stringify(v, null, 2);
const fence = v => '```json\n'+json(v)+'\n```\n';
const slug = name => name.replace(/[^a-zA-Z0-9_-]/g, '-');
const sourceIndex = [];
for (const dir of ['src/tools','src/operations']) {
  for (const file of await readdir(path.join(root,dir))) {
    if (file.endsWith('.ts')) sourceIndex.push({file:`${dir}/${file}`,text:await readFile(path.join(root,dir,file),'utf8')});
  }
}
function source(name) {
  const found=sourceIndex.find(s=>new RegExp(`name:\\s*["']${name.replace(/\./g,'\\.')}["']`).test(s.text));
  assert(found,`Missing source declaration for ${name}`);
  return `[${found.file}](../${found.file})`;
}
function validateCall(name,args) {
  const tool=ALL_TOOLS.find(t=>t.name===name);assert(tool,`Unknown tool ${name}`);
  z.object(tool.inputShape).parse(args);
  if(name==='ae_motion_build')motionSpecSchema.parse(args.spec);
  if(name==='ae_do')validateOperation(args.operation,args.args??{});
}
function validateOperation(name,args) {
  const op=getOp(name);assert(op,`Unknown operation ${name}`);
  const result=validateOpArgs(op,args);assert(result.ok,`${name}: ${json(result.issues)}`);
  assert.equal(typeof op.toJsx(args),'string');
  if(name==='batch.run') for(const child of args.ops)validateOperation(child.operation,child.args??{});
}
for(const t of ALL_TOOLS){assert(toolExamples[t.name],`Missing tool example ${t.name}`);validateCall(t.name,toolExamples[t.name].args);}
for(const [name,args] of Object.entries(operationExamples))validateOperation(name,args);
motionSpecSchema.parse(sampleSpec);
function type(s) {
  if(s.const!==undefined)return json(s.const);
  if(s.enum)return s.enum.map(v=>JSON.stringify(v)).join(' | ');
  if(s.anyOf)return s.anyOf.map(type).join(' | ');
  return s.type==='array'?`array<${type(s.items??{})}>`:s.type??'any';
}
const toolsData=ALL_TOOLS.map(t=>({name:t.name,title:t.title,description:t.description,group:t.group,effect:t.effect,blockedInReadOnly:t.blockedInReadOnly,inputSchema:z.toJSONSchema(z.object(t.inputShape),{target:'draft-7',io:'input'}),example:{name:t.name,arguments:toolExamples[t.name].args}}));
let toolDoc=`# MCP tool reference\n\nGenerated from the tool registry and Zod input schemas by \`npm run docs:generate\`. Do not edit directly. [Guide](../README.md) · [Operations](OPERATIONS.md) · [Examples](EXAMPLES.md)\n\n${ALL_TOOLS.length} default tools. Each entry includes an example, all declared parameters, exact JSON Schema, result location and implementation notes. Descriptions are copied from code; notes distinguish handler behavior and known limits. JSON Schema alone does not express every handler refinement.\n\nExamples use a six-second composition named Main, a text layer named Title and a shape layer named Panel. Replace example IDs, UUIDs and paths with your own. These are MCP tools/call payloads, not terminal commands. Only the bounded motion smoke in [VALIDATION.md](VALIDATION.md) was live-qualified.\n\n| Tool | Effect hint | Withheld in read-only mode |\n|---|---|---|\n`;
for(const t of toolsData)toolDoc+=`| [${t.name}](#${t.name}) | ${t.effect} | ${t.blockedInReadOnly?'Yes':'No'} |\n`;
for(const t of toolsData){
  const ex=toolExamples[t.name];const required=t.inputSchema.required??[];
  toolDoc+=`\n<a id="${t.name}"></a>\n\n## ${t.name}\n\n${t.description}\n\nSource: ${source(t.name)}. Group: \`${t.group}\`. Effect hint: **${t.effect}**. ${t.blockedInReadOnly?'Withheld':'Available'} in read-only mode; operation/category policy may still restrict execution.\n\n${ex.note??''}\n\n**Result:** ${ex.returns}\n\n### Parameters\n\n| Name | Type | Required | Description |\n|---|---|---|---|\n`;
  const entries=Object.entries(t.inputSchema.properties??{});
  for(const [key,schema] of entries)toolDoc+=`| \`${key}\` | ${cell(type(schema))} | ${required.includes(key)?'Yes':'No'} | ${cell(schema.description??'See exact schema constraints and implementation notes.')} |\n`;
  if(!entries.length)toolDoc+='| — | — | — | No parameters. |\n';
  toolDoc+='\n### Example call\n\n'+fence({name:t.name,arguments:ex.args});
  toolDoc+='\n<details>\n<summary>Exact input JSON Schema</summary>\n\n'+fence(t.inputSchema)+'\n</details>\n';
}
const opData=ops.map(o=>({name:o.name,category:o.category,description:o.description,readOnly:!!o.readOnly,appConfig:!!o.appConfig,execution:o.run?'node':'jsx',params:o.params}));
const categories=[...new Set(ops.map(o=>o.category))].toSorted();
let opDoc=`# Operation reference\n\nGenerated from \`src/operations\` and \`src/registry.ts\` by \`npm run docs:generate\`. [Guide](../README.md) · [Tools](TOOLS.md) · [Examples](EXAMPLES.md)\n\n**${ops.length} default operations in ${categories.length} categories**, reached through \`ae_do\`. Optional \`eval.run\` is separate from that count. Every operation has its parameter table, source link, policy classification and call template. ${Object.keys(operationExamples).length} operations also have concrete schema-checked examples. Remaining templates use placeholders rather than inventing scene objects or valid effect/property values.\n\n## Calling and interpreting operations\n\nUse \`ae_catalog({category: "keyframe"})\` for the active policy-filtered catalog. Then call \`ae_do\` with \`operation\`, \`args\`, optional \`timeoutMs\` and optional top-level \`instance\`. An instance parameter inside operation args is only valid if that operation declares it.\n\nComp selectors are generally exact names or numeric item IDs. Shared single-layer lookup accepts 1-based index, name or \`{id: layerId}\`; only operations advertising collections support all/selected/arrays. Property paths are arrays of names, matchNames or 1-based indices passed to native property lookup. Duplicate effect/mask/group matchNames are ambiguous: inspect the tree and use an appropriate index. IDs are project-scoped; refresh after opening/importing/replacing a project.\n\nValidation rejects missing required fields, unknown keys, wrong top-level types and non-finite numbers. It does not deeply validate every array/object or ensure referenced layers, fonts, effects and templates exist. Native code performs additional checks. Metadata defaults are shown when declared; descriptions/code may define additional defaults. Defaults are applied by each operation, not filled by the generic validator.\n\nRead-only classification describes project-mutation policy, not zero filesystem/application side effects. App-configuration operations require explicitly authorized \`confirm:true\`. Normal JSX calls are undo-grouped; exceptions and file writes are not transactional. \`batch.run\` checks children, can stop on errors, and does not roll back successful earlier children. Descriptions below are implementation declarations, not proof of universal AE-version or visual correctness. See [validation limits](VALIDATION.md).\n\n## Category index\n\n| Category | Operations |\n|---|---:|\n`;
for(const c of categories)opDoc+=`| [${c}](#category-${c}) | ${ops.filter(o=>o.category===c).length} |\n`;
function renderOp(op,optional=false){
  let out=`\n<a id="${slug(op.name)}"></a>\n\n### ${op.name}\n\n${op.description}\n\nSource: ${source(op.name)}. Category: \`${op.category}\`. Read-only classification: **${!!op.readOnly}**. Execution: **${op.run?'Node-side':'ExtendScript'}**.${op.appConfig?' Requires explicitly authorized **confirm: true**.':''}${optional?' Requires AE_MCP_ENABLE_EVAL=1 and write mode.':''}\n\n| Parameter | Type | Required | Declared default | Description |\n|---|---|---|---|---|\n`;
  for(const p of op.params)out+=`| \`${p.name}\` | ${p.type}${p.nullable?' or null':''} | ${p.required?'Yes':'No'} | ${p.default===undefined?'—':cell(JSON.stringify(p.default))} | ${cell(p.description)} |\n`;
  if(!op.params.length)out+='| — | — | — | — | No operation arguments. |\n';
  const template={name:'ae_do',arguments:{operation:op.name,args:Object.fromEntries(op.params.filter(p=>p.required).map(p=>[p.name,`<${p.name}: ${p.type}${p.nullable?' or null':''}>`]))}};
  out+='\n**Call template** (replace placeholders with correctly typed values; not executable as shown):\n\n```text\n'+json(template)+'\n```\n';
  if(operationExamples[op.name])out+='\n**Concrete example** (requires the example scene/resources in [EXAMPLES.md](EXAMPLES.md)):\n\n'+fence({name:'ae_do',arguments:{operation:op.name,args:operationExamples[op.name]}});
  return out;
}
for(const c of categories){opDoc+=`\n<a id="category-${c}"></a>\n\n## ${c}\n\n`+ops.filter(o=>o.category===c).map(o=>`[${o.name}](#${slug(o.name)})`).join(' · ')+'\n';for(const op of ops.filter(o=>o.category===c))opDoc+=renderOp(op);}
opDoc+='\n## Optional raw-code operation (not in the default count)\n'+renderOp(optionalEval,true);
const outputs=new Map([
  ['docs/TOOLS.md',toolDoc],['docs/OPERATIONS.md',opDoc],
  ['docs/reference/tools.json',json(toolsData)+'\n'],['docs/reference/operations.json',json(opData)+'\n'],
  ['docs/reference/motion-spec.schema.json',json(z.toJSONSchema(motionSpecSchema))+'\n'],
]);
for(const [name,content] of outputs){
  const target=path.join(root,name);
  if(check){const current=await readFile(target,'utf8').catch(()=> '');assert(current.replace(/\r\n/g,'\n')===content,`Stale generated documentation: ${name}. Run npm run docs:generate.`);}
  else{await mkdir(path.dirname(target),{recursive:true});await writeFile(target,content);}
}
console.log(`${check?'Verified':'Generated'} ${ALL_TOOLS.length} tools, ${ops.length} default operations, ${categories.length} categories, optional eval appendix, ${ALL_TOOLS.length} tool examples and ${Object.keys(operationExamples).length} concrete operation examples.`);
