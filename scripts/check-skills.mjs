#!/usr/bin/env node
// Validate the portable skill and its actual stdio delivery; never dispatch to AE.
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import '../dist/operations/index.js';
import { getOp } from '../dist/registry.js';
import { validateOpArgs } from '../dist/opschema.js';
import { ALL_TOOLS } from '../dist/tools/index.js';
import { motionSpecSchema } from '../dist/motion/spec.js';
import { compileMotionSpec } from '../dist/motion/compile.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = path.join(root, 'skills/after-effects-motion-design');
const read = name => readFile(path.join(dir, name), 'utf8');
const json = async name => JSON.parse(await read(name));
const manifest = await json('manifest.json');
const files = ['manifest.json', ...manifest.files];
assert.equal(new Set(files).size, files.length, 'Duplicate manifest file');
async function walk(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const result = [];
  for (const item of entries) {
    const full = path.join(folder, item.name);
    if (item.isDirectory()) result.push(...await walk(full));
    else result.push(path.relative(dir, full).split(path.sep).join('/'));
  }
  return result;
}
assert.deepEqual(files.toSorted(), (await walk(dir)).toSorted(), 'Manifest must cover the complete portable folder');
const skill = await read('SKILL.md');
assert.match(skill, /^---\r?\nname: after-effects-motion-design\r?\ndescription: .+/);
assert(skill.length < 12000, 'Keep the entrypoint concise');
const catalog = await json(manifest.parameterCatalog);
const parameters = new Map(catalog.parameters.map(p => [p.key, p]));
assert.equal(parameters.size, catalog.parameters.length, 'Duplicate parameter');
const parameterDoc = await read('references/parameters.md');
function checkValue(key, value) {
  const parameter = parameters.get(key);
  assert(parameter, `Unknown design parameter ${key}`);
  assert.equal(typeof value, parameter.type, `${key}: wrong value type`);
  if (parameter.type === 'number') assert(Number.isFinite(value), `${key}: must be finite`);
  if (parameter.choices) assert(parameter.choices.includes(value), `${key}: invalid choice`);
  if (parameter.unit === 'sRGB hex') assert.match(value, /^#[0-9a-f]{6}$/i);
}
for (const p of parameters.values()) {
  checkValue(p.key, p.default);
  assert(p.unit && p.meaning);
  assert(['spec', 'ae-do', 'design', 'external'].includes(p.route));
  assert(parameterDoc.includes(`| \`${p.key}\` | \`${JSON.stringify(p.default)}\` |`), `${p.key}: reference drift`);
  if (p.suggested) {
    assert.equal(p.suggested.length, 2);
    assert(p.suggested.every(Number.isFinite));
    assert(p.suggested[0] <= p.default && p.default <= p.suggested[1], `${p.key}: default outside suggested band`);
  }
  for (const op of p.operations) assert(getOp(op), `${p.key}: unknown operation ${op}`);
}
const profiles = (await json(manifest.profiles)).profiles;
assert.equal(new Set(profiles.map(p => p.id)).size, profiles.length);
for (const profile of profiles) for (const [key, value] of Object.entries(profile.overrides)) checkValue(key, value);
let callCount = 0, specCount = 0, links = 0;
function checkCall(call) {
  const tool = ALL_TOOLS.find(t => t.name === call.name);
  assert(tool, `Unknown example tool ${call.name}`);
  z.strictObject(tool.inputShape).parse(call.arguments);
  if (call.name === 'ae_do') {
    const op = getOp(call.arguments.operation);
    assert(op, `Unknown example operation ${call.arguments.operation}`);
    const valid = validateOpArgs(op, call.arguments.args ?? {});
    assert(valid.ok, `${op.name}: ${JSON.stringify(valid.issues)}`);
    assert.equal(typeof op.toJsx(call.arguments.args ?? {}), 'string');
  }
  callCount++;
}
// Negative controls for the validator, independent of any native AE runtime.
assert.throws(() => checkValue('motion.overshoot', 'lots'));
assert.throws(() => checkValue('motion.unknown', 2));
assert.throws(() => checkValue('motion.direction', 'teleport'));
for (const file of files) {
  assert(!path.isAbsolute(file) && !file.split('/').includes('..'));
  const text = await read(file);
  if (file.endsWith('.json')) {
    const data = JSON.parse(text);
    if (file.endsWith('.motion.json')) {
      const parsed = motionSpecSchema.parse(data);
      assert(compileMotionSpec(parsed).includes('app.project.items.addComp'));
      specCount++;
    }
    if (data.kind === 'ae-motion-design-brief') {
      assert(profiles.some(p => p.id === data.profile));
      for (const [key, value] of Object.entries(data.parameters)) checkValue(key, value);
      for (const beat of data.beats) assert(Number.isInteger(beat.frame) && beat.frame >= 0 && beat.frame <= data.canvas.fps * data.canvas.duration);
    }
    if (file.endsWith('native-edits.json')) for (const example of data.examples) {
      assert(example.precondition && example.purpose);
      checkCall(example.call);
    }
  }
  if (!file.endsWith('.md')) continue;
  for (const block of text.matchAll(/```json\s*\r?\n([\s\S]*?)\r?\n```/g)) {
    const value = JSON.parse(block[1]);
    if (value.name && value.arguments) checkCall(value);
  }
  for (const link of text.replace(/```[\s\S]*?```/g, '').matchAll(/\[[^\]\n]+\]\(([^)\s]+)\)/g)) {
    const target = link[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    const local = path.resolve(path.dirname(path.join(dir, file)), target.split('#')[0]);
    assert(local.startsWith(dir + path.sep), `${file}: portable skill link escapes folder`);
    assert(await stat(local).catch(() => null), `${file}: missing ${target}`);
    links++;
  }
}
const client = new Client({ name: 'skill-library-check', version: '1.0.0' });
try {
  // Skill resources are available even when all native writes are withheld.
  const env = Object.fromEntries(Object.entries(process.env).filter(([,v]) => typeof v === 'string'));
  env.AE_MCP_READONLY = '1';
  env.AE_MCP_ALLOW_CATEGORIES = 'comp';
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(root, 'dist/index.js')], stderr: 'pipe', env }));
  const listed = (await client.listResources()).resources;
  for (const file of files) {
    const uri = `ae-uber://skills/after-effects-motion-design/${file}`;
    assert(listed.some(r => r.uri === uri), `Resource missing: ${file}`);
    const response = await client.readResource({ uri });
    assert.equal(response.contents[0].text, await read(file), `Resource content mismatch: ${file}`);
  }
  await assert.rejects(client.readResource({ uri: 'ae-uber://skills/after-effects-motion-design/../../package.json' }));
} finally { await client.close(); }
console.log(JSON.stringify({ ok: true, parameters: parameters.size, groups: new Set([...parameters.keys()].map(k => k.split('.')[0])).size, profiles: profiles.length, motionSpecs: specCount, operationExamples: callCount, portableLinks: links, skillResources: files.length, nativeAeExecuted: false }, null, 2));
