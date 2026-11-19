import test from 'node:test';
import assert from 'node:assert/strict';
import '../test-helpers/setup.js';
import { html, render } from '../src/template.js';
import { renderTemplateToString, renderComponentToDSD } from '../src/ssr.js';
import { applyJsonPatch } from '../src/ag-ui.js';
import { ElBadge } from '../src/components/el-badge.js';
import '../src/components/el-sources.js';
import { handleToolCall, handleJsonRpcLine } from '../mcp/server.js';

test('Security 1: template interpolation renders untrusted HTML as inert text (XSS safe)', () => {
  const host = document.createElement('div');
  const payload = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
  render(html`<p>${payload}</p>`, host);

  assert.equal(host.querySelector('img'), null);
  assert.equal(host.querySelector('script'), null);
  assert.equal(host.querySelector('p').textContent, payload);
});

test('Security 2: SSR renderTemplateToString & renderComponentToDSD escape untrusted text and attributes', () => {
  const xssText = '<script>alert(1)</script>';
  const ssrHtml = renderTemplateToString(html`<div title=${'" onclick="alert(1)'}>${xssText}</div>`);
  assert.ok(!ssrHtml.includes('<script>alert(1)</script>'), 'raw <script> must be escaped');
  assert.ok(ssrHtml.includes('&lt;script&gt;'), 'text must be HTML-escaped');

  const dsd = renderComponentToDSD('el-badge', ElBadge, { count: '"><script>alert(1)</script>' }, '');
  assert.ok(!dsd.includes('<script>alert(1)</script>'), 'DSD attribute must not inject raw script');
});

test('Security 3: <el-sources> neutralizes javascript: and data: URLs', () => {
  const el = document.createElement('el-sources');
  el.setAttribute('expanded', '');
  el.sources.value = [
    { id: '1', title: 'Bad JS', url: 'javascript:alert(1)' },
    { id: '2', title: 'Bad Data', url: 'data:text/html,<script>alert(1)</script>' },
    { id: '3', title: 'Good HTTPS', url: 'https://example.com/docs' },
  ];
  document.body.appendChild(el);
  const links = [...el.shadowRoot.querySelectorAll('a')];
  for (const a of links) {
    const href = (a.getAttribute('href') || '').toLowerCase();
    assert.ok(!href.startsWith('javascript:'), `unsafe javascript: href leaked: ${href}`);
    assert.ok(!href.startsWith('data:'), `unsafe data: href leaked: ${href}`);
  }
  el.remove();
});

test('Security 4: applyJsonPatch blocks prototype pollution attempts', () => {
  const target = { safe: 1 };
  const next = applyJsonPatch(target, [
    { op: 'add', path: '/__proto__/polluted', value: true },
    { op: 'replace', path: '/constructor/prototype/polluted', value: true },
  ]);
  assert.equal(({}).polluted, undefined);
  assert.equal(next.safe, 1);
});

test('Security 5: MCP server rejects oversized, malformed, and hostile inputs cleanly', () => {
  // 1. Oversized payload (> 128 KB)
  const hugeLine = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', pad: 'x'.repeat(140 * 1024) });
  const hugeRes = handleJsonRpcLine(hugeLine);
  assert.equal(hugeRes.error.code, -32600);

  // 2. Malformed JSON
  const badJson = handleJsonRpcLine('{not valid json');
  assert.equal(badJson.error.code, -32603);

  // 3. Unknown JSON-RPC method
  const badMethod = handleJsonRpcLine(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'evil/exec' }));
  assert.equal(badMethod.error.code, -32601);

  // 4. Hostile tag injection in generate_snippet & scaffold_component
  const hostileSnippet = handleToolCall('generate_snippet', {
    tag: 'el-x"><script>alert(1)</script>',
    label: '<script>x</script>',
  });
  assert.ok(hostileSnippet.error);

  const safeSnippet = handleToolCall('generate_snippet', {
    tag: 'el-button',
    variant: 'primary" onclick="alert(1)',
    label: '<img src=x>',
  });
  assert.ok(!safeSnippet.snippet.includes('<img src=x>'));
  assert.ok(safeSnippet.snippet.includes('&quot;'));

  const hostileScaffold = handleToolCall('scaffold_component', {
    tag: 'bad;process.exit(1)',
  });
  assert.ok(hostileScaffold.error);

  // 5. New honest MCP tools: lint_accessibility, suggest_component, validate_component_usage, get_component_maturity
  const lint = handleToolCall('lint_accessibility', { markup: '<el-input></el-input>' });
  assert.equal(lint.scope, 'static-html-lint');
  assert.ok(lint.disclaimer.includes('axe-core'));
  assert.equal(lint.valid, false);

  const suggest = handleToolCall('suggest_component', { query: 'date picker' });
  assert.ok(suggest.suggestions.some((s) => s.tag === 'el-datepicker'));

  const usage = handleToolCall('validate_component_usage', {
    markup: '<el-button variant="primary" fake-prop="1">Go</el-button><el-nonexistent></el-nonexistent>',
  });
  assert.equal(usage.valid, false);
  assert.ok(usage.issues.some((i) => i.tag === 'el-nonexistent' && i.severity === 'error'));
  assert.ok(usage.issues.some((i) => i.tag === 'el-button' && i.attribute === 'fake-prop'));

  const maturity = handleToolCall('get_component_maturity', {});
  assert.equal(maturity.package, '@wcomp/elementum');
  assert.equal(maturity.zeroRuntimeDependencies, true);
  assert.ok(maturity.componentCount >= 100);
});
