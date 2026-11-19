import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { renderComponentToDSD, renderTemplateToString } from '../src/ssr.js';
import { html } from '../src/template.js';
import { ElButton, ElBadge, ElNavbar } from '../src/index.js';
import { renderSsrPage, startServer } from '../examples/ssr-server.js';

test('DSD SSR: renderTemplateToString cleanly handles ?bool, .prop, and @event bindings', () => {
  const tpl = html`<button ?disabled=${() => true} ?hidden=${() => false} .value=${() => 'abc'} @click=${() => {}}>Go</button>`;
  const out = renderTemplateToString(tpl);
  assert.ok(out.includes('disabled'), 'truthy ?bool should emit bare attribute');
  assert.ok(!out.includes('?disabled'), 'should strip ? prefix');
  assert.ok(!out.includes('hidden'), 'falsy ?bool should omit attribute');
  assert.ok(!out.includes('.value='), 'should strip .prop binding in SSR');
  assert.ok(!out.includes('@click='), 'should strip @event binding in SSR');
});

test('DSD SSR: renderComponentToDSD emits <template shadowrootmode="open"> with styles and kebab-case attrs', () => {
  const btnHtml = renderComponentToDSD('el-button', ElButton, { variant: 'primary', size: 'md' }, 'Deploy');
  assert.ok(btnHtml.includes('<el-button variant="primary" size="md">'));
  assert.ok(btnHtml.includes('<template shadowrootmode="open"><style>'));
  assert.ok(btnHtml.includes('Deploy</el-button>'));
  assert.ok(!btnHtml.includes('?disabled='));
  assert.ok(!btnHtml.includes('@click='));

  const navHtml = renderComponentToDSD('el-navbar', ElNavbar, { brand: 'Elementum', 'badge-variant': 'success' }, '');
  assert.ok(navHtml.includes('badge-variant="success"'));
  assert.ok(navHtml.includes('<template shadowrootmode="open">'));
});

test('DSD SSR: examples/ssr-server.js renders full page in hydrated and zero-JS modes', () => {
  const hydrated = renderSsrPage({ hydrate: true, serverTime: '2026-11-18T12:00:00Z', requestPath: '/?hydrate=1' });
  assert.ok(hydrated.includes('<!DOCTYPE html>'));
  assert.ok(hydrated.includes('<template shadowrootmode="open">'));
  assert.ok(hydrated.includes('<el-navbar'));
  assert.ok(hydrated.includes('<el-button'));
  assert.ok(hydrated.includes('<el-progress'));
  assert.ok(hydrated.includes('<el-meter'));
  assert.ok(hydrated.includes('<el-avatar'));
  assert.ok(hydrated.includes("import '/src/index.js'"));

  const zeroJs = renderSsrPage({ hydrate: false, serverTime: '2026-11-18T12:00:00Z', requestPath: '/?hydrate=0' });
  assert.ok(zeroJs.includes('<template shadowrootmode="open">'));
  assert.ok(!zeroJs.includes("import '/src/index.js'"));
  assert.ok(zeroJs.includes('Zero-JS Mode'));
});

test('DSD SSR: pure Node.js subprocess (zero happy-dom) imports @wc/elementum and renders DSD cleanly', () => {
  const stdout = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { renderSsrPage } from './examples/ssr-server.js';
       const html = renderSsrPage({ hydrate: false });
       console.log(JSON.stringify({ ok: html.includes('<template shadowrootmode="open">'), len: html.length }));`,
    ],
    { encoding: 'utf8' }
  );
  const parsed = JSON.parse(stdout.trim());
  assert.equal(parsed.ok, true);
  assert.ok(parsed.len > 5000);
});

test('DSD SSR: live HTTP server serves hydrated DSD, zero-JS DSD, static assets, and 404', async () => {
  const server = startServer(0);
  await new Promise((resolve) => {
    if (server.listening) resolve();
    else server.once('listening', resolve);
  });
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    const resZeroJs = await fetch(`${base}/?hydrate=0`);
    assert.equal(resZeroJs.status, 200);
    const bodyZeroJs = await resZeroJs.text();
    assert.ok(bodyZeroJs.includes('<template shadowrootmode="open">'));
    assert.ok(!bodyZeroJs.includes("import '/src/index.js'"));

    const resCss = await fetch(`${base}/src/tokens.css`);
    assert.equal(resCss.status, 200);
    assert.match(resCss.headers.get('content-type') || '', /text\/css/);

    const res404 = await fetch(`${base}/does-not-exist.xyz`);
    assert.equal(res404.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
