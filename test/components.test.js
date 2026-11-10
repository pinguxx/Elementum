import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverScript = path.resolve(__dirname, '..', 'mcp', 'server.js');

test('MCP server exposes new datepicker, calendar, dropdown, and input components', async () => {
  const proc = spawn('node', [serverScript], { stdio: ['pipe', 'pipe', 'inherit'] });

  const send = (msg) => {
    proc.stdin.write(JSON.stringify(msg) + '\n');
  };

  const readResponse = () =>
    new Promise((resolve) => {
      proc.stdout.once('data', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });

  // 1. List tools and verify all new components are listed
  send({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'list_components', arguments: {} } });
  const listRes = await readResponse();
  const listData = JSON.parse(listRes.result.content[0].text);
  const tags = listData.components.map((c) => c.tag);

  assert.ok(tags.includes('el-button'));
  assert.ok(tags.includes('el-badge'));
  assert.ok(tags.includes('el-input'));
  assert.ok(tags.includes('el-dropdown'));
  assert.ok(tags.includes('el-calendar'));
  assert.ok(tags.includes('el-datepicker'));

  // 2. Query documentation for <el-datepicker>
  send({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'get_component_doc',
      arguments: { tag: 'el-datepicker' },
    },
  });
  const docRes = await readResponse();
  const docData = JSON.parse(docRes.result.content[0].text);
  assert.equal(docData.tagName, 'el-datepicker');
  assert.ok(docData.attributes.some((a) => a.name === 'value'));
  assert.ok(docData.events.some((e) => e.name === 'change'));

  // 3. Generate snippet for <el-datepicker>
  send({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'generate_snippet',
      arguments: { tag: 'el-datepicker', variant: '', size: '', label: '' },
    },
  });
  const snippetRes = await readResponse();
  const snippetData = JSON.parse(snippetRes.result.content[0].text);
  assert.equal(snippetData.snippet, '<el-datepicker></el-datepicker>');

  proc.kill();
});
