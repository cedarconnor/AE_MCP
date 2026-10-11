import { describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerWorkflow } from '../src/mcp-workflow.js';

describe('bundled motion design skill resources', () => {
  it('discovers and reads the complete portable package without AE or arbitrary file access', async () => {
    const server = new McpServer({ name: 'skills-test', version: '1.0.0' });
    registerWorkflow(server);
    const client = new Client({ name: 'skills-reader', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
      const resources = (await client.listResources()).resources;
      const uri = 'ae-uber://skills/after-effects-motion-design/manifest.json';
      expect(resources.some(r => r.uri === uri)).toBe(true);
      const response = await client.readResource({ uri });
      const manifestContent = response.contents[0];
      if (!('text' in manifestContent)) throw new Error('Expected text manifest resource');
      const manifest = JSON.parse(manifestContent.text);
      expect(manifest.id).toBe('after-effects-motion-design');
      expect(manifest.files).toContain('SKILL.md');
      for (const file of manifest.files) {
        const fileUri = `ae-uber://skills/after-effects-motion-design/${file}`;
        expect(resources.some(r => r.uri === fileUri)).toBe(true);
        const content = (await client.readResource({ uri: fileUri })).contents[0];
        if (!('text' in content)) throw new Error('Expected text skill resource');
        expect(content.text.length).toBeGreaterThan(20);
        if (file.endsWith('.json')) expect(() => JSON.parse(content.text)).not.toThrow();
      }
      await expect(client.readResource({ uri: 'ae-uber://skills/after-effects-motion-design/../../package.json' })).rejects.toThrow();
      const prompt = await client.getPrompt({ name: 'motion-graphics', arguments: { brief: 'Quiet editorial title' } });
      expect(JSON.stringify(prompt)).toContain('ae-uber://skills/after-effects-motion-design/SKILL.md');
    } finally {
      await client.close();
      await server.close();
    }
  });
});
