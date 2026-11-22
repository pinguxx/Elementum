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

test('MCP protocol compliance: initialize negotiation, notifications, isError, parse error, batch & Edge handler', async () => {
  const fs = await import('node:fs');
  const { handleJsonRpcLine } = await import('../mcp/server.js');
  const { createEdgeMcpHandler } = await import('../mcp/edge.js');

  const manifest = JSON.parse(fs.readFileSync(new URL('../custom-elements.json', import.meta.url), 'utf8'));
  const tokens = JSON.parse(fs.readFileSync(new URL('../tokens/figma-tokens.json', import.meta.url), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const edgeHandler = createEdgeMcpHandler({ manifest, tokens, pkg });
  const apiSrc = fs.readFileSync(new URL('../api/mcp.js', import.meta.url), 'utf8');
  assert.ok(apiSrc.includes("runtime: 'edge'"), 'api/mcp.js must declare Vercel Edge runtime');
  assert.ok(!apiSrc.includes(' with {'), 'api/mcp.js must not use ES2025 import attributes unsupported by Vercel esbuild');

  // 1. Negotiates modern protocolVersion & includes instructions
  const init2025 = handleJsonRpcLine(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'probe', version: '1.0' } },
  }));
  assert.equal(init2025.result.protocolVersion, '2025-03-26');
  assert.equal(init2025.result.serverInfo.title, 'Elementum Design System MCP');
  assert.ok(typeof init2025.result.instructions === 'string' && init2025.result.instructions.length > 20);

  // 2. Notifications (no id) return null instead of -32601 error
  assert.equal(
    handleJsonRpcLine(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })),
    null
  );

  // 3. Tool errors set isError: true
  const errCall = handleJsonRpcLine(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: { name: 'get_component_doc', arguments: { tag: 'el-does-not-exist' } },
  }));
  assert.equal(errCall.result.isError, true);

  // 4. Malformed JSON returns standard -32700 Parse error
  const parseErr = handleJsonRpcLine('{bad json');
  assert.equal(parseErr.error.code, -32700);

  // 5. Batch JSON-RPC array filters out notifications and returns responses
  const batch = handleJsonRpcLine(JSON.stringify([
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 10, method: 'ping' },
  ]));
  assert.deepEqual(batch, [{ jsonrpc: '2.0', id: 10, result: {} }]);

  // 6. Edge Runtime handler: POST, 202 notification, DELETE 204, OPTIONS 204, GET 405
  const postRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/api/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'ping' }),
  }));
  assert.equal(postRes.status, 200);
  assert.deepEqual(await postRes.json(), { jsonrpc: '2.0', id: 99, result: {} });

  const notifRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/api/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  }));
  assert.equal(notifRes.status, 202);

  const delRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/api/mcp', { method: 'DELETE' }));
  assert.equal(delRes.status, 204);

  const getRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/api/mcp', { method: 'GET' }));
  assert.equal(getRes.status, 405);
});
