import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { renderComponentToDSD, renderTemplateToString } from '../src/ssr.js';
import { html } from '../src/template.js';
import { ElButton, ElBadge, ElNavbar } from '../src/index.js';
import { renderSsrPage, startServer } from '../examples/ssr-server.js';
import vercelSsrHandler from '../api/ssr.js';

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

test('DSD SSR: pure Node.js subprocess (zero happy-dom) imports @wcomp/elementum and renders DSD cleanly', () => {
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

test('DSD SSR: Vercel serverless handler api/ssr.js serves /ssr in hydrated and zero-JS modes', () => {
  const callHandler = (url) => {
    const headers = {};
    let body = '';
    const res = {
      statusCode: 0,
      setHeader(k, v) { headers[k.toLowerCase()] = v; },
      end(chunk) { body = String(chunk || ''); },
    };
    vercelSsrHandler({ url }, res);
    return { statusCode: res.statusCode, headers, body };
  };

  const zeroJs = callHandler('/ssr?hydrate=0');
  assert.equal(zeroJs.statusCode, 200);
  assert.match(zeroJs.headers['content-type'], /text\/html/);
  assert.ok(zeroJs.body.includes('<template shadowrootmode="open">'));
  assert.ok(zeroJs.body.includes('href="/ssr?hydrate=1"'));
  assert.ok(!zeroJs.body.includes("import '/src/index.js'"));

  const hydrated = callHandler('/ssr?hydrate=1');
  assert.equal(hydrated.statusCode, 200);
  assert.ok(hydrated.body.includes("import '/src/index.js'"));
  assert.ok(hydrated.body.includes('<html lang="en" data-dsd>'));
  assert.ok(hydrated.body.includes(':root:not([data-dsd])'));
  assert.ok(zeroJs.body.includes('<html lang="en" data-dsd>'));
  assert.ok(zeroJs.body.includes(':root:not([data-dsd])'));
});

test('DSD SSR: quotes unquoted HTML attributes inside tags without quoting text expressions', () => {
  const attrTpl = html`<div style=${() => 'width: 96%;'}></div>`;
  const attrOut = renderTemplateToString(attrTpl);
  assert.ok(attrOut.includes('style="width: 96%;"'), `Expected quoted style attr, got: ${attrOut}`);

  const textTpl = html`<p>let x=${() => 42}</p>`;
  const textOut = renderTemplateToString(textTpl);
  assert.equal(textOut, '<p>let x=42</p>');
});

test('DSD SSR: pure Node attribute shim enables getAttribute/hasAttribute inside custom class render()', () => {
  class PureNodeAttrComponent {
    static styles = '';
    render() {
      const label = this.getAttribute('aria-label') || 'default';
      const active = this.hasAttribute('active') ? 'yes' : 'no';
      return html`<span data-active=${active}>${label}</span>`;
    }
  }
  const out = renderComponentToDSD('x-pure-node', PureNodeAttrComponent, { 'aria-label': 'Status', active: true });
  assert.ok(out.includes('data-active="yes"'), `Expected data-active="yes", got: ${out}`);
  assert.ok(out.includes('>Status</span>'), `Expected Status text, got: ${out}`);

  const inactiveOut = renderComponentToDSD('x-pure-node', PureNodeAttrComponent, { active: false });
  assert.ok(inactiveOut.includes('data-active="no"'), `Expected data-active="no", got: ${inactiveOut}`);
});

test('DSD SSR: data-dsd and :root:not([data-dsd]) are present across rendered pages and static snapshot', () => {
  const hydrated = renderSsrPage({ hydrate: true });
  const zeroJs = renderSsrPage({ hydrate: false });
  const staticSnapshot = fs.readFileSync(new URL('../examples/ssr-demo.html', import.meta.url), 'utf8');

  for (const [label, doc] of [
    ['hydrated SSR', hydrated],
    ['zero-JS SSR', zeroJs],
    ['static examples/ssr-demo.html', staticSnapshot],
  ]) {
    assert.ok(doc.includes('<html lang="en" data-dsd>'), `${label} missing <html lang="en" data-dsd>`);
    assert.ok(doc.includes(':root:not([data-dsd]) :not(:defined)'), `${label} missing :root:not([data-dsd]) :not(:defined)`);
    assert.ok(doc.includes(':root:not([data-dsd]) :defined'), `${label} missing :root:not([data-dsd]) :defined`);
  }
});
