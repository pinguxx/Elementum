import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

test('Security 3: <el-sources> neutralizes javascript:, data:, and vbscript: URLs', () => {
  const el = document.createElement('el-sources');
  el.setAttribute('expanded', '');
  el.sources.value = [
    { id: '1', title: 'Bad JS', url: 'javascript:alert(1)' },
    { id: '2', title: 'Bad Data', url: 'data:text/html,<script>alert(1)</script>' },
    { id: '3', title: 'Bad VBScript', url: 'vbscript:msgbox(1)' },
    { id: '4', title: 'Good HTTPS', url: 'https://example.com/docs' },
  ];
  document.body.appendChild(el);
  const links = [...el.shadowRoot.querySelectorAll('a')];
  for (const a of links) {
    const href = (a.getAttribute('href') || '').trim().toLowerCase();
    assert.ok(!href.startsWith('javascript:'), `unsafe javascript: href leaked: ${href}`);
    assert.ok(!href.startsWith('data:'), `unsafe data: href leaked: ${href}`);
    assert.ok(!href.startsWith('vbscript:'), `unsafe vbscript: href leaked: ${href}`);
    assert.ok(href === '' || href === '#' || href.startsWith('https://') || href.startsWith('http://'), `unexpected href scheme: ${href}`);
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
  assert.equal(badJson.error.code, -32700);

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

test('Security 6: MCP server supports ping, readOnly annotations on all 13 tools, and 192x192 server.json icon metadata', () => {
  const pingRes = handleJsonRpcLine(JSON.stringify({ jsonrpc: '2.0', id: 42, method: 'ping' }));
  assert.deepEqual(pingRes, { jsonrpc: '2.0', id: 42, result: {} });

  const listRes = handleJsonRpcLine(JSON.stringify({ jsonrpc: '2.0', id: 43, method: 'tools/list' }));
  const tools = listRes?.result?.tools || [];
  assert.equal(tools.length, 13);
  for (const tool of tools) {
    assert.deepEqual(tool.annotations, {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    }, `Missing read-only annotations on tool ${tool.name}`);
    assert.equal(tool.execution?.taskSupport, 'forbidden');
  }

  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const srv = JSON.parse(fs.readFileSync(new URL('../server.json', import.meta.url), 'utf8'));
  assert.match(pkg.version, /^\d+\.\d+\.\d+/);
  assert.equal(srv.version, pkg.version);
  assert.equal(srv.packages?.[0]?.version, pkg.version);
  assert.equal(srv.remotes?.[0]?.url, 'https://elementum-sage.vercel.app/mcp');
  assert.deepEqual(srv.icons?.[0], {
    src: 'https://elementum-sage.vercel.app/icon.png',
    mimeType: 'image/png',
    sizes: ['192x192'],
  });

  const iconBuf = fs.readFileSync(new URL('../icon.png', import.meta.url));
  assert.equal(iconBuf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(iconBuf.readUInt32BE(16), 192);
  assert.equal(iconBuf.readUInt32BE(20), 192);

  const scaffold = handleToolCall('scaffold_component', {
    tag: 'el-safe-card',
    description: 'bad */\nprocess.exit(1);//',
  });
  assert.ok(scaffold.code.includes('bad * / process.exit(1);//'));
  assert.ok(!scaffold.code.includes('*/\nprocess.exit(1)'));

  const iconOnlyBtn = handleToolCall('lint_accessibility', { markup: '<el-button><svg></svg></el-button>' });
  assert.equal(iconOnlyBtn.valid, false);
  const labeledIconBtn = handleToolCall('lint_accessibility', { markup: '<el-button aria-label="Close"><svg></svg></el-button>' });
  assert.equal(labeledIconBtn.valid, true);
  const textChildBtn = handleToolCall('lint_accessibility', { markup: '<el-button><span>Save</span></el-button>' });
  assert.equal(textChildBtn.valid, true);
});

test('Security 7: Vercel SSR handler restricts methods, adds security headers, and governance/package manifests are complete', async () => {
  const { default: vercelSsrHandler, SSR_SECURITY_HEADERS } = await import('../api/ssr.js');

  const callSsr = (req) => {
    const headers = {};
    let body = '';
    const res = {
      statusCode: 0,
      setHeader(k, v) { headers[k.toLowerCase()] = String(v); },
      end(chunk) { body = chunk === undefined ? '' : String(chunk); },
    };
    vercelSsrHandler(req, res);
    return { statusCode: res.statusCode, headers, body };
  };

  const getRes = callSsr({ method: 'GET', url: '/ssr?hydrate=0' });
  assert.equal(getRes.statusCode, 200);
  for (const [k, v] of Object.entries(SSR_SECURITY_HEADERS)) {
    assert.equal(getRes.headers[k.toLowerCase()], v, `Missing/mismatched SSR header ${k}`);
  }
  assert.ok(getRes.body.includes('<html lang="en" data-dsd>'));

  const headRes = callSsr({ method: 'HEAD', url: '/ssr' });
  assert.equal(headRes.statusCode, 200);
  assert.equal(headRes.body, '');
  assert.equal(headRes.headers['x-frame-options'], 'DENY');

  const postRes = callSsr({ method: 'POST', url: '/ssr' });
  assert.equal(postRes.statusCode, 405);
  assert.equal(postRes.headers.allow, 'GET, HEAD');
  assert.equal(postRes.headers['x-content-type-options'], 'nosniff');

  // Verify package.json has zero runtime deps and ships server.json + SECURITY.md
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal('dependencies' in pkg, false);
  assert.ok(Array.isArray(pkg.files) && pkg.files.includes('server.json'));
  assert.ok(pkg.files.includes('SECURITY.md'));

  // Verify governance & security disclosure templates + Vercel header config
  const coc = fs.readFileSync(new URL('../CODE_OF_CONDUCT.md', import.meta.url), 'utf8');
  assert.ok(coc.includes('SECURITY.md') && coc.includes('security/advisories/new'));

  const issueCfg = fs.readFileSync(new URL('../.github/ISSUE_TEMPLATE/config.yml', import.meta.url), 'utf8');
  assert.ok(issueCfg.includes('blank_issues_enabled: false'));
  assert.ok(issueCfg.includes('security/advisories/new'));

  assert.equal(fs.existsSync(new URL('../.github/ISSUE_TEMPLATE/bug_report.yml', import.meta.url)), true);
  assert.equal(fs.existsSync(new URL('../.github/PULL_REQUEST_TEMPLATE.md', import.meta.url)), true);

  const vercelCfg = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const headerSources = new Set((vercelCfg.headers || []).map((h) => h.source));
  assert.ok(headerSources.has('/(.*)'));
  assert.ok(headerSources.has('/mcp'));
  assert.ok(headerSources.has('/api/mcp'));
  assert.ok(headerSources.has('/.well-known/mcp-verification.json'));
});
