import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// This is packaged application data, never a user-supplied filesystem root.
const base = new URL('../skills/after-effects-motion-design/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', base), 'utf8')) as {
  id: string;
  files: string[];
};

export function registerSkillLibrary(server: McpServer): void {
  for (const file of ['manifest.json', ...manifest.files]) {
    // Register exact resource URIs, with no dynamic file/path template.
    if (!/^[A-Za-z0-9_./-]+$/.test(file) || file.startsWith('/') || file.split('/').includes('..')) {
      throw new Error(`Invalid packaged skill path: ${file}`);
    }
    const mimeType = file.endsWith('.json') ? 'application/json'
      : file.endsWith('.md') ? 'text/markdown' : 'text/plain';
    server.registerResource(
      `motion-design-${file.replace(/[/.]/g, '-')}`,
      `ae-uber://skills/after-effects-motion-design/${file}`,
      { title: `Motion design: ${file}`, mimeType },
      async uri => ({ contents: [{
        uri: uri.href,
        mimeType,
        text: await readFile(new URL(file, base), 'utf8'),
      }] }),
    );
  }
}
