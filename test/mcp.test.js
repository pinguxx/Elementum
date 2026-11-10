import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverScript = path.resolve(__dirname, '..', 'mcp', 'server.js');

test('MCP server responds to tools/list and tools/call', async () => {
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

  // 1. List tools
  send({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  const listRes = await readResponse();
  assert.equal(listRes.id, 1);
  assert.ok(listRes.result.tools.some((t) => t.name === 'get_component_doc'));

  // 2. Call tool: get_component_doc
  send({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'get_component_doc',
      arguments: { tag: 'el-button' },
    },
  });
  const callRes = await readResponse();
  assert.equal(callRes.id, 2);
  const doc = JSON.parse(callRes.result.content[0].text);
  assert.equal(doc.tagName, 'el-button');
  assert.ok(doc.attributes.some((a) => a.name === 'variant'));

  // 3. Call tool: generate_snippet
  send({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'generate_snippet',
      arguments: { tag: 'el-button', variant: 'danger', size: 'lg', label: 'Delete Account' },
    },
  });
  const snippetRes = await readResponse();
  const snippetData = JSON.parse(snippetRes.result.content[0].text);
  assert.equal(snippetData.snippet, '<el-button variant="danger" size="lg">Delete Account</el-button>');

  proc.kill();
});
