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
  const postRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'ping' }),
  }));
  assert.equal(postRes.status, 200);
  assert.deepEqual(await postRes.json(), { jsonrpc: '2.0', id: 99, result: {} });

  const notifRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  }));
  assert.equal(notifRes.status, 202);

  const delRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', { method: 'DELETE' }));
  assert.equal(delRes.status, 204);

  const getRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', { method: 'GET' }));
  assert.equal(getRes.status, 405);
});

test('MCP separated component schema (variants, states, props, constraints vs examples) & strict validation', async () => {
  const fs = await import('node:fs');
  const { TOOLS, handleToolCall } = await import('../mcp/server.js');
  const { createEdgeMcpHandler } = await import('../mcp/edge.js');

  const manifest = JSON.parse(fs.readFileSync(new URL('../custom-elements.json', import.meta.url), 'utf8'));
  const tokens = JSON.parse(fs.readFileSync(new URL('../tokens/figma-tokens.json', import.meta.url), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const metadata = JSON.parse(fs.readFileSync(new URL('../mcp/component-metadata.json', import.meta.url), 'utf8'));

  // Tool schema exposes section filter
  const getDocTool = TOOLS.find((t) => t.name === 'get_component_doc');
  assert.deepEqual(getDocTool.inputSchema.properties.section.enum, ['all', 'schema', 'examples']);

  // 1. el-button: closed variant/size enums, disabled state, formAssociated constraint, separated examples
  const btnDoc = handleToolCall('get_component_doc', { tag: 'el-button' });
  assert.equal(btnDoc.tagName, 'el-button');
  const variantSpec = btnDoc.variants.find((v) => v.name === 'variant');
  assert.ok(variantSpec && variantSpec.allowedValues.includes('primary') && variantSpec.allowedValues.includes('danger'));
  assert.ok(btnDoc.states.some((s) => s.name === 'disabled' && s.type === 'boolean'));
  assert.ok(btnDoc.props.some((p) => p.name === 'label'));
  assert.equal(btnDoc.constraints.formAssociated, true);
  assert.equal(btnDoc.constraints.requiredParent, null);
  assert.ok(Array.isArray(btnDoc.examples) && btnDoc.examples.length > 0);

  // 2. el-table: complex signal/JS properties tracked explicitly
  const tableDoc = handleToolCall('get_component_doc', { tag: 'el-table' });
  assert.ok(tableDoc.constraints.jsOnlyProperties.includes('columns'));
  assert.ok(tableDoc.constraints.jsOnlyProperties.includes('data'));
  assert.ok(tableDoc.constraints.jsOnlyProperties.includes('selected'));

  // 3. el-tab: composition constraint requiredParent === 'el-tabs'
  const tabDoc = handleToolCall('get_component_doc', { tag: 'el-tab' });
  assert.equal(tabDoc.constraints.requiredParent, 'el-tabs');

  // 4. section filter cleanly isolates schema vs examples
  const schemaOnly = handleToolCall('get_component_doc', { tag: 'el-button', section: 'schema' });
  assert.ok(Array.isArray(schemaOnly.variants) && schemaOnly.constraints);
  assert.equal('examples' in schemaOnly, false);

  const examplesOnly = handleToolCall('get_component_doc', { tag: 'el-button', section: 'examples' });
  assert.ok(Array.isArray(examplesOnly.examples) && examplesOnly.examples.length > 0);
  assert.equal('variants' in examplesOnly, false);
  assert.equal('states' in examplesOnly, false);

  const badSection = handleToolCall('get_component_doc', { tag: 'el-button', section: 'unknown' });
  assert.ok(typeof badSection.error === 'string');

  // 5. validate_component_usage enforces closed variant enums, parent composition, and JS-only props
  const badVariant = handleToolCall('validate_component_usage', {
    markup: '<el-button variant="brand">Save</el-button>',
  });
  assert.equal(badVariant.valid, false);
  assert.ok(badVariant.issues.some((i) => i.severity === 'error' && i.attribute === 'variant' && i.value === 'brand'));

  const orphanTab = handleToolCall('validate_component_usage', {
    markup: '<el-tab label="One" value="one">Body</el-tab>',
  });
  assert.ok(orphanTab.issues.some((i) => i.severity === 'warning' && i.requiredParent === 'el-tabs'));

  const jsOnlyTable = handleToolCall('validate_component_usage', {
    markup: '<el-table selected="[1]" data="[object Object]"></el-table>',
  });
  assert.ok(jsOnlyTable.issues.some((i) => i.jsProperty === 'selected'));
  assert.ok(jsOnlyTable.issues.some((i) => i.jsProperty === 'data'));

  const validUsage = handleToolCall('validate_component_usage', {
    markup: '<el-tabs value="one"><el-tab label="One" value="one"><el-button variant="primary">OK</el-button></el-tab></el-tabs>',
  });
  assert.equal(validUsage.valid, true);
  assert.deepEqual(validUsage.issues, []);

  // 6. Edge handler forwards metadata identically
  const edgeHandler = createEdgeMcpHandler({ manifest, tokens, pkg, metadata });
  const edgeRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 42,
      method: 'tools/call',
      params: { name: 'get_component_doc', arguments: { tag: 'el-button', section: 'schema' } },
    }),
  }));
  assert.equal(edgeRes.status, 200);
  const edgeJson = await edgeRes.json();
  const edgeDoc = JSON.parse(edgeJson.result.content[0].text);
  assert.ok(Array.isArray(edgeDoc.variants) && edgeDoc.constraints?.formAssociated === true);
  assert.equal('examples' in edgeDoc, false);

  // 7. All 109 tags in custom-elements.json have complete separated metadata
  const allDecls = manifest.modules.flatMap((m) => m.declarations || []);
  assert.equal(allDecls.length, 109);
  for (const decl of allDecls) {
    assert.ok(metadata[decl.tagName], `Missing metadata for ${decl.tagName}`);
    const doc = handleToolCall('get_component_doc', { tag: decl.tagName });
    assert.ok(Array.isArray(doc.variants), `${decl.tagName} missing variants`);
    assert.ok(Array.isArray(doc.states), `${decl.tagName} missing states`);
    assert.ok(Array.isArray(doc.props), `${decl.tagName} missing props`);
    assert.ok(doc.constraints && typeof doc.constraints === 'object', `${decl.tagName} missing constraints`);
    assert.ok(Array.isArray(doc.examples), `${decl.tagName} missing examples`);
  }
});
