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

  // 7. All 113 tags in custom-elements.json have complete separated metadata
  const allDecls = manifest.modules.flatMap((m) => m.declarations || []);
  assert.equal(allDecls.length, 113);
  for (const decl of allDecls) {
    assert.ok(metadata[decl.tagName], `Missing metadata for ${decl.tagName}`);
    const doc = handleToolCall('get_component_doc', { tag: decl.tagName });
    assert.ok(Array.isArray(doc.variants), `${decl.tagName} missing variants`);
    assert.ok(Array.isArray(doc.states), `${decl.tagName} missing states`);
    assert.ok(Array.isArray(doc.props), `${decl.tagName} missing props`);
    assert.ok(doc.constraints && typeof doc.constraints === 'object', `${decl.tagName} missing constraints`);
    assert.ok(Array.isArray(doc.examples), `${decl.tagName} missing examples`);
  }

  // 8. Multi-format generate_snippet (html, react, vue, a2ui) & validate_a2ui_messages
  const reactSnippet = handleToolCall('generate_snippet', { tag: 'el-button', variant: 'primary', label: 'Deploy', format: 'react' });
  assert.equal(reactSnippet.format, 'react');
  assert.ok(reactSnippet.snippet.includes("from '@wcomp/elementum/react'"));
  assert.ok(reactSnippet.snippet.includes('<ElButton variant="primary">Deploy</ElButton>'));

  const vueSnippet = handleToolCall('generate_snippet', { tag: 'el-button', variant: 'secondary', label: 'Save', format: 'vue' });
  assert.equal(vueSnippet.format, 'vue');
  assert.ok(vueSnippet.snippet.includes('<script setup>'));

  const a2uiSnippet = handleToolCall('generate_snippet', { tag: 'el-button', variant: 'primary', label: 'Run', format: 'a2ui' });
  assert.equal(a2uiSnippet.format, 'a2ui');
  const parsedA2ui = JSON.parse(a2uiSnippet.snippet);
  const validA2uiCheck = handleToolCall('validate_a2ui_messages', { messages: parsedA2ui });
  assert.equal(validA2uiCheck.valid, true);
  assert.equal(validA2uiCheck.componentCount, 1);

  const invalidA2uiCheck = handleToolCall('validate_a2ui_messages', {
    messages: [
      { unknownEnvelope: {} },
      {
        surfaceUpdate: {
          surfaceId: 's1',
          components: [
            { id: 'bad1', type: 'EvilScript', props: { onclick: 'alert(1)', href: 'javascript:alert(1)' } },
          ],
        },
      },
    ],
  });
  assert.equal(invalidA2uiCheck.valid, false);
  assert.ok(invalidA2uiCheck.issues.length >= 3);
});

test('MCP Edge & Core security hardening: headers, Origin DNS-rebinding guard, Content-Type 415, batch limits, and pure-JS runtime', async () => {
  const fs = await import('node:fs');
  const { handleJsonRpcLine, handleToolCall } = await import('../mcp/server.js');
  const { createEdgeMcpHandler, SECURITY_HEADERS, isAllowedOrigin } = await import('../mcp/edge.js');

  const coreSrc = fs.readFileSync(new URL('../mcp/core.js', import.meta.url), 'utf8');
  const edgeSrc = fs.readFileSync(new URL('../mcp/edge.js', import.meta.url), 'utf8');
  for (const [label, src] of [['mcp/core.js', coreSrc], ['mcp/edge.js', edgeSrc]]) {
    assert.equal(/(?:from|import\s*\()\s*['"]node:/.test(src), false, `${label} must use zero Node built-ins`);
    assert.equal(/\bBuffer\b/.test(src), false, `${label} must not reference Node Buffer`);
    assert.equal(/\bprocess\./.test(src), false, `${label} must not reference Node process`);
  }

  const manifest = JSON.parse(fs.readFileSync(new URL('../custom-elements.json', import.meta.url), 'utf8'));
  const tokens = JSON.parse(fs.readFileSync(new URL('../tokens/figma-tokens.json', import.meta.url), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const metadata = JSON.parse(fs.readFileSync(new URL('../mcp/component-metadata.json', import.meta.url), 'utf8'));

  // 1. Public edge handler checks headers across all status codes + Origin & Content-Type guards
  const edgeHandler = createEdgeMcpHandler({ manifest, tokens, pkg, metadata });
  const assertSecurityHeaders = (res) => {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      assert.equal(res.headers.get(k), v, `Missing/mismatched security header ${k}`);
    }
  };

  const optionsRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', {
    method: 'OPTIONS',
    headers: { origin: 'https://claude.ai' },
  }));
  assert.equal(optionsRes.status, 204);
  assertSecurityHeaders(optionsRes);
  assert.equal(optionsRes.headers.get('access-control-allow-origin'), '*');

  const getRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', { method: 'GET' }));
  assert.equal(getRes.status, 405);
  assert.equal(getRes.headers.get('allow'), 'POST, DELETE, OPTIONS');
  assertSecurityHeaders(getRes);

  // Blocked origins (DNS rebinding / opaque null / non-HTTPS remote)
  for (const badOrigin of ['null', 'not-a-valid-url', 'http://evil.example.com', 'file:///etc/passwd', '']) {
    const res403 = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', {
      method: 'POST',
      headers: { origin: badOrigin, 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    }));
    assert.equal(res403.status, 403, `Expected 403 for Origin: "${badOrigin}"`);
    assertSecurityHeaders(res403);
  }
  assert.equal(isAllowedOrigin('https://app.example.com').allowed, true);
  assert.equal(isAllowedOrigin('http://localhost:3000').allowed, true);
  assert.equal(isAllowedOrigin('http://127.0.0.1:8080').allowed, true);
  assert.equal(isAllowedOrigin('http://[::1]:5173').allowed, true);
  assert.equal(isAllowedOrigin(null).allowed, false);

  // Allowed loopback origin over POST JSON
  const loopbackOk = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', {
    method: 'POST',
    headers: { origin: 'http://localhost:3000', 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'ping' }),
  }));
  assert.equal(loopbackOk.status, 200);
  assertSecurityHeaders(loopbackOk);

  // 415 CSRF Content-Type guard (form types & cross-origin non-JSON)
  for (const badType of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', 'text/html']) {
    const res415 = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', {
      method: 'POST',
      headers: { 'content-type': badType },
      body: '{}',
    }));
    assert.equal(res415.status, 415, `Expected 415 for Content-Type: ${badType}`);
    assertSecurityHeaders(res415);
  }
  const crossOriginXml = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', {
    method: 'POST',
    headers: { origin: 'https://claude.ai', 'content-type': 'application/xml' },
    body: '<ping/>',
  }));
  assert.equal(crossOriginXml.status, 415);

  // 413 Payload limit via declared content-length and actual body size
  const largeHeaderRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'content-length': String(200 * 1024) },
    body: '{}',
  }));
  assert.equal(largeHeaderRes.status, 413);
  assertSecurityHeaders(largeHeaderRes);

  const largeBodyRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, pad: 'x'.repeat(130 * 1024) }),
  }));
  assert.equal(largeBodyRes.status, 413);

  // 2. Explicit allowlist mode + Vary: Origin
  const restrictedHandler = createEdgeMcpHandler({
    manifest,
    tokens,
    pkg,
    metadata,
    allowedOrigins: new Set(['https://trusted.example.com']),
  });
  const allowedOriginRes = await restrictedHandler(new Request('https://elementum-sage.vercel.app/mcp', {
    method: 'POST',
    headers: { origin: 'https://trusted.example.com', 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'ping' }),
  }));
  assert.equal(allowedOriginRes.status, 200);
  assert.equal(allowedOriginRes.headers.get('access-control-allow-origin'), 'https://trusted.example.com');
  assert.equal(allowedOriginRes.headers.get('vary'), 'Origin');

  const blockedAllowlistRes = await restrictedHandler(new Request('https://elementum-sage.vercel.app/mcp', {
    method: 'POST',
    headers: { origin: 'https://other.example.com', 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'ping' }),
  }));
  assert.equal(blockedAllowlistRes.status, 403);

  const noOriginAllowlistRes = await restrictedHandler(new Request('https://elementum-sage.vercel.app/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'ping' }),
  }));
  assert.equal(noOriginAllowlistRes.status, 200);
  assert.equal(noOriginAllowlistRes.headers.get('access-control-allow-origin'), null);
  assert.equal(noOriginAllowlistRes.headers.get('vary'), 'Origin');

  // 3. Core MCP batch limit & suggest_component term cap & A2UI prototype-key rejection
  const oversizeBatch = Array.from({ length: 21 }, (_, idx) => ({ jsonrpc: '2.0', id: idx + 1, method: 'ping' }));
  const batchErr = handleJsonRpcLine(JSON.stringify(oversizeBatch));
  assert.equal(batchErr.error.code, -32600);
  assert.match(batchErr.error.message, /Batch size exceeds maximum/);

  const longQuery = handleToolCall('suggest_component', {
    query: Array.from({ length: 30 }, (_, i) => (i === 25 ? 'button' : `kw${i}`)).join(' '),
  });
  assert.ok(Array.isArray(longQuery.suggestions));

  const protoProps = JSON.parse('{"__proto__":{"polluted":true},"constructor":{},"prototype":{}}');
  const a2uiProtoRes = handleToolCall('validate_a2ui_messages', {
    messages: [
      {
        surfaceUpdate: {
          surfaceId: 's1',
          components: [{ id: 'p1', type: 'Button', props: protoProps }],
        },
      },
    ],
  });
  assert.equal(a2uiProtoRes.valid, false);
  assert.equal(
    a2uiProtoRes.issues.filter((i) => i.message.includes('Forbidden prototype key')).length,
    3
  );

  // Fallback getResolvedMetadata (no precomputed metadata), list_components & list_tokens
  const { createMcpHandler } = await import('../mcp/core.js');
  const bareMcp = createMcpHandler({ manifest, tokens, pkg });
  const compList = bareMcp.handleToolCall('list_components', {});
  assert.equal(compList.count, 113);
  const allTokens = bareMcp.handleToolCall('list_tokens', {});
  assert.ok(allTokens && typeof allTokens === 'object');
  const colorTokens = bareMcp.handleToolCall('list_tokens', { category: 'color' });
  assert.ok(colorTokens && !colorTokens.error);
  const missingTokens = bareMcp.handleToolCall('list_tokens', { category: 'nonexistent-category' });
  assert.ok(typeof missingTokens.error === 'string');
  const bareBtnDoc = bareMcp.handleToolCall('get_component_doc', { tag: 'el-button' });
  assert.ok(bareBtnDoc.variants.some((v) => v.name === 'variant'));
  assert.ok(bareBtnDoc.states.some((s) => s.name === 'disabled'));
  assert.ok(Array.isArray(bareBtnDoc.props));
});

test('MCP v2: resources, prompts, completions, setup, bundle planning, filtered list_components, and edge compatibility', async () => {
  const fs = await import('node:fs');
  const { createMcpHandler } = await import('../mcp/core.js');
  const { createEdgeMcpHandler } = await import('../mcp/edge.js');

  const loadJson = (rel) => JSON.parse(fs.readFileSync(new URL(rel, import.meta.url), 'utf8'));
  const manifest = loadJson('../custom-elements.json');
  const metadata = loadJson('../mcp/component-metadata.json');
  const tokens = loadJson('../tokens/figma-tokens.json');
  const pkg = loadJson('../package.json');
  const sizeBudgets = loadJson('../size-budget.json');

  const handler = createMcpHandler({ manifest, metadata, tokens, pkg, sizeBudgets });
  const rpc = (method, params) =>
    handler.handleJsonRpcLine(JSON.stringify({ jsonrpc: '2.0', id: 10, method, params }));

  // 1. initialize exposes resources, prompts, completions, websiteUrl, icons, and valid 5-step workflow
  const initRes = rpc('initialize', { protocolVersion: '2025-03-26' }).result;
  assert.ok(initRes.capabilities.tools);
  assert.ok(initRes.capabilities.resources);
  assert.ok(initRes.capabilities.prompts);
  assert.ok(initRes.capabilities.completions);
  assert.equal(initRes.serverInfo.websiteUrl, 'https://elementum-sage.vercel.app/');
  assert.ok(Array.isArray(initRes.serverInfo.icons) && initRes.serverInfo.icons.length > 0);
  assert.ok(initRes.instructions.includes('lint_accessibility'));
  assert.ok(initRes.instructions.includes('validate_component_usage'));

  // 2. list_components filters
  const actionsList = handler.handleToolCall('list_components', { category: 'actions' });
  assert.ok(actionsList.components.some((c) => c.tag === 'el-hold-button'));
  assert.ok(actionsList.components.every((c) => c.category === 'actions'));

  const faceList = handler.handleToolCall('list_components', { formAssociated: true });
  assert.equal(faceList.count, 18);
  assert.ok(faceList.components.some((c) => c.tag === 'el-button'));
  assert.ok(faceList.components.every((c) => c.formAssociated === true));

  const motionList = handler.handleToolCall('list_components', { hasMotion: true });
  for (const tag of ['el-hold-button', 'el-shimmer-text', 'el-tabs', 'el-segmented-control']) {
    assert.ok(motionList.components.some((c) => c.tag === tag), `Expected motion tag ${tag}`);
  }

  // 3. get_setup
  const allSetup = handler.handleToolCall('get_setup', {});
  assert.ok(allSetup.frameworks?.react && allSetup.frameworks?.vanilla);
  assert.equal(allSetup.themeContract?.darkModeAttribute, 'data-theme="dark"');
  const reactSetup = handler.handleToolCall('get_setup', { framework: 'react' });
  assert.equal(reactSetup.framework, 'react');
  assert.ok(reactSetup.imports.some((i) => i.includes('@wcomp/elementum/react')));
  const badSetup = handler.handleToolCall('get_setup', { framework: 'ember' });
  assert.ok(typeof badSetup.error === 'string');

  // 4. get_bundle_plan + Edge HTTP roundtrip
  const plan = handler.handleToolCall('get_bundle_plan', {
    tags: ['el-button', 'el-hold-button', 'el-button'],
    framework: 'react',
  });
  assert.equal(plan.componentCount, 2);
  assert.deepEqual(plan.tags, ['el-button', 'el-hold-button']);
  assert.ok(plan.totalEstimatedGzipKb > 0);
  assert.ok(plan.imports.some((i) => i.includes('ElButton') && i.includes('ElHoldButton')));
  assert.ok(handler.handleToolCall('get_bundle_plan', { tags: [] }).error);
  assert.ok(handler.handleToolCall('get_bundle_plan', { tags: ['el-does-not-exist'] }).error);

  const edgeHandler = createEdgeMcpHandler({ manifest, metadata, tokens, pkg, sizeBudgets });
  const edgePlanRes = await edgeHandler(new Request('https://elementum-sage.vercel.app/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 77,
      method: 'tools/call',
      params: { name: 'get_bundle_plan', arguments: { tags: ['el-usage-ring'], framework: 'html' } },
    }),
  }));
  assert.equal(edgePlanRes.status, 200);
  const edgePlan = JSON.parse((await edgePlanRes.json()).result.content[0].text);
  assert.equal(edgePlan.framework, 'html');
  assert.ok(edgePlan.totalEstimatedGzipKb > 0);

  // 5. resources/list, resources/templates/list, and resources/read
  const resList = rpc('resources/list').result.resources;
  assert.deepEqual(resList.map((r) => r.uri), [
    'elementum://catalog',
    'elementum://setup',
    'elementum://tokens',
  ]);
  const tmplList = rpc('resources/templates/list').result.resourceTemplates;
  assert.equal(tmplList[0].uriTemplate, 'elementum://components/{tag}');

  const catalogMd = rpc('resources/read', { uri: 'elementum://catalog' }).result.contents[0].text;
  assert.ok(catalogMd.includes('113'));
  assert.ok(rpc('resources/read', { uri: 'elementum://setup' }).result.contents[0].text.includes('data-theme="dark"'));
  assert.ok(rpc('resources/read', { uri: 'elementum://tokens' }).result.contents[0].text.includes('color'));
  const tabsMd = rpc('resources/read', { uri: 'elementum://components/el-tabs' }).result.contents[0].text;
  assert.ok(tabsMd.includes('`variant`: underline, pill'));
  assert.equal(tabsMd.includes('`undefined`:'), false);
  assert.equal(rpc('resources/read', { uri: 'elementum://unknown' }).error.code, -32602);
  assert.equal(rpc('resources/read', {}).error.code, -32602);

  // 6. prompts/list & prompts/get
  const promptsList = rpc('prompts/list').result.prompts;
  assert.deepEqual(promptsList.map((p) => p.name), ['add_component', 'build_screen', 'audit_markup']);
  const addPrompt = rpc('prompts/get', {
    name: 'add_component',
    arguments: { tag: 'el-hold-button', framework: 'react' },
  }).result.messages[0].content.text;
  assert.ok(addPrompt.includes('lint_accessibility') && addPrompt.includes('validate_component_usage'));
  assert.ok(rpc('prompts/get', { name: 'build_screen', arguments: { goal: 'Analytics dashboard' } }).result.messages[0].content.text.includes('Analytics dashboard'));
  const auditPrompt = rpc('prompts/get', { name: 'audit_markup', arguments: { html: '<el-button>OK</el-button>' } }).result.messages[0].content.text;
  assert.ok(auditPrompt.includes('lint_accessibility') && auditPrompt.includes('validate_component_usage'));
  assert.equal(rpc('prompts/get', { name: 'nope' }).error.code, -32602);
  assert.equal(rpc('prompts/get', { name: 'add_component', arguments: {} }).error.code, -32602);
  const protoPromptArgs = JSON.parse('{"tag":"el-button","__proto__":{}}');
  assert.equal(rpc('prompts/get', { name: 'add_component', arguments: protoPromptArgs }).error.code, -32602);

  // 7. completion/complete
  assert.deepEqual(
    rpc('completion/complete', { argument: { name: 'tag', value: 'el-ho' } }).result.completion.values,
    ['el-hold-button']
  );
  assert.deepEqual(
    rpc('completion/complete', { argument: { name: 'framework', value: 're' } }).result.completion.values,
    ['react']
  );
  assert.deepEqual(
    rpc('completion/complete', { argument: { name: 'category', value: 'act' } }).result.completion.values,
    ['actions']
  );
  assert.equal(rpc('completion/complete', { argument: {} }).error.code, -32602);

  // 8. Vercel Edge purity checks
  const coreSrc = fs.readFileSync(new URL('../mcp/core.js', import.meta.url), 'utf8');
  const edgeSrc = fs.readFileSync(new URL('../mcp/edge.js', import.meta.url), 'utf8');
  const resourcesSrc = fs.readFileSync(new URL('../mcp/resources.js', import.meta.url), 'utf8');
  const promptsSrc = fs.readFileSync(new URL('../mcp/prompts.js', import.meta.url), 'utf8');
  const apiMcpSrc = fs.readFileSync(new URL('../api/mcp.js', import.meta.url), 'utf8');
  for (const src of [coreSrc, edgeSrc, resourcesSrc, promptsSrc]) {
    assert.equal(/from\s+['"]node:|\brequire\s*\(|\bBuffer\b|\bprocess\./.test(src), false);
  }
  assert.equal(/with\s*\{\s*type:\s*['"]json['"]/.test(apiMcpSrc), false);
});

test('MCP lint_accessibility flags deterministic UI anti-slop patterns as warnings', async () => {
  const { createMcpHandler } = await import('../mcp/core.js');
  const { handleToolCall } = createMcpHandler({
    manifest: {
      modules: [{ path: 'src/components/el-button.js', declarations: [{ kind: 'class', name: 'ElButton', tagName: 'el-button' }] }],
    },
    metadata: {},
    tokens: {},
    pkg: { version: '0.8.7' },
  });
  const sloppy = `
    <style>
      .btn { transition: all 0.2s ease; }
      :host-context([data-theme="dark"]):host([variant="primary"]) { color: white; }
    </style>
    <el-card>
      <div style="color: #334155;">Hardcoded hex</div>
      <el-card><el-button variant="primary">Nested</el-button></el-card>
    </el-card>
  `;
  const res = handleToolCall('lint_accessibility', { markup: sloppy });
  assert.equal(res.valid, true);
  const criteria = res.warnings.map((w) => w.criterion);
  assert.ok(criteria.includes('UI Craft (Motion)'));
  assert.ok(criteria.includes('UI Craft (Tokens & Dark Mode)'));
  assert.ok(criteria.includes('UI Craft (Visual Hierarchy)'));
  assert.ok(criteria.includes('UI Craft (Shadow DOM CSS)'));

  const ngSetup = handleToolCall('get_setup', { framework: 'angular' });
  assert.equal(ngSetup.framework, 'angular');
  assert.ok(ngSetup.imports.some((i) => i.includes('CUSTOM_ELEMENTS_SCHEMA')));

  const ngPlan = handleToolCall('get_bundle_plan', { tags: ['el-button'], framework: 'angular' });
  assert.equal(ngPlan.framework, 'angular');
  assert.ok(Array.isArray(ngPlan.imports) && ngPlan.imports.length > 0);
});
