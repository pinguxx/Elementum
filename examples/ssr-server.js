#!/usr/bin/env node
/**
 * Real Declarative Shadow DOM (DSD) Server-Side Rendering Example for @wcomp/elementum
 *
 * Runs in pure Node.js with ZERO runtime dependencies and ZERO DOM emulation (no happy-dom).
 * Emits standard <template shadowrootmode="open"> HTML for instant zero-CLS first paint,
 * then optionally hydrates progressively on the client.
 *
 * Usage:
 *   npm run ssr                                      # Starts live SSR server at http://localhost:3333
 *   node examples/ssr-server.js --port 4000          # Custom port
 *   node examples/ssr-server.js --static examples/ssr-demo.html  # Pre-render static DSD snapshot
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ElNavbar,
  ElBadge,
  ElButton,
  ElCallout,
  ElAlert,
  ElCard,
  ElProgress,
  ElMeter,
  ElAvatar,
  ElCodeBlock,
  ElThemeSwitch,
} from '../src/index.js';
import { renderComponentToDSD } from '../src/ssr.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const tokensCss = fs.readFileSync(path.join(rootDir, 'src', 'tokens.css'), 'utf8');

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders a full HTML document with Declarative Shadow DOM (<template shadowrootmode="open">)
 * for every Elementum Web Component on the page.
 */
export function renderSsrPage({
  hydrate = true,
  staticMode = false,
  basePath = '/',
  serverTime = new Date().toISOString(),
  requestPath = '/',
} = {}) {
  const assetPrefix = staticMode ? '..' : '';
  const homeHref = staticMode ? '../index.html' : '/index.html';
  const docsHref = staticMode ? '../docs.html' : '/docs.html';
  const catalogHref = staticMode ? './index.html' : '/examples/index.html';
  const registryHref = staticMode ? './registry.html' : '/examples/registry.html';
  const aiStudioHref = staticMode ? './agent-studio.html' : '/examples/agent-studio.html';
  const agUiHref = staticMode ? './ag-ui.html' : '/examples/ag-ui.html';
  const a2UiHref = staticMode ? './a2ui.html' : '/examples/a2ui.html';
  const webMcpHref = staticMode ? './webmcp.html' : '/examples/webmcp.html';
  const showcaseHref = staticMode ? '../showcase.html' : '/showcase.html';

  const themeSwitchDsd = renderComponentToDSD('el-theme-switch', ElThemeSwitch, { slot: 'actions' }, '');

  const navbarDsd = renderComponentToDSD(
    'el-navbar',
    ElNavbar,
    { sticky: true, brand: '⚡ Elementum', badge: 'DSD SSR', 'badge-variant': 'success', href: homeHref },
    `
      <a href="${homeHref}">Home</a>
      <a href="${docsHref}">Docs</a>
      <a href="${catalogHref}">Catalog</a>
      <a href="${registryHref}">Registry</a>
      <a href="${aiStudioHref}">AI Studio</a>
      <a href="${agUiHref}">AG-UI</a>
      <a href="${a2UiHref}">A2UI</a>
      <a href="${webMcpHref}">WebMCP</a>
      <a href="${showcaseHref}">Showcase</a>
      ${themeSwitchDsd}
    `
  );

  const heroBadges = [
    renderComponentToDSD('el-badge', ElBadge, { variant: 'success' }, 'Declarative Shadow DOM'),
    renderComponentToDSD('el-badge', ElBadge, { variant: 'primary' }, 'Zero Runtime Deps'),
    renderComponentToDSD('el-badge', ElBadge, { variant: 'info' }, hydrate ? 'Hydration: ON' : 'Zero-JS Mode'),
  ].join('\n        ');

  const calloutDsd = renderComponentToDSD(
    'el-callout',
    ElCallout,
    { variant: 'success' },
    `<span slot="title">Rendered on the Server at ${escapeHtml(serverTime)}</span>
     Every component below was serialized in pure Node.js via <code>renderComponentToDSD()</code> into standard
     <code>&lt;template shadowrootmode="open"&gt;</code>. Even with JavaScript disabled (<code>?hydrate=0</code>),
     Shadow DOM styles and slots paint immediately with zero FOUC or layout shift.`
  );

  const primaryBtnDsd = renderComponentToDSD(
    'el-button',
    ElButton,
    { id: 'ssr-counter-btn', variant: 'primary', size: 'md' },
    'Interactive Hydrated Clicks: 0'
  );
  const secondaryBtnDsd = renderComponentToDSD(
    'el-button',
    ElButton,
    { variant: 'secondary', size: 'md' },
    'Secondary Action'
  );
  const dangerBtnDsd = renderComponentToDSD(
    'el-button',
    ElButton,
    { variant: 'danger', size: 'md' },
    'Destructive Action'
  );

  const avatarDsd = renderComponentToDSD(
    'el-avatar',
    ElAvatar,
    { name: 'Node Edge', size: 'lg', status: 'online' },
    ''
  );
  const progressDsd = renderComponentToDSD(
    'el-progress',
    ElProgress,
    { value: '96', variant: 'success' },
    ''
  );
  const meterDsd = renderComponentToDSD(
    'el-meter',
    ElMeter,
    { value: '72', min: '0', max: '100', low: '50', high: '85', optimum: '40' },
    ''
  );

  const sampleDsdSnippet = renderComponentToDSD(
    'el-button',
    ElButton,
    { variant: 'primary', size: 'md' },
    'Deploy Now'
  );
  const snippetPreview =
    sampleDsdSnippet.length > 420
      ? sampleDsdSnippet.slice(0, 260) + '\n  /* ...encapsulated shadow styles... */\n' + sampleDsdSnippet.slice(-140)
      : sampleDsdSnippet;

  const codeBlockDsd = renderComponentToDSD(
    'el-code-block',
    ElCodeBlock,
    { language: 'html', copyable: true, code: snippetPreview },
    ''
  );

  const alertDsd = renderComponentToDSD(
    'el-alert',
    ElAlert,
    { variant: 'info' },
    `Request path: <code>${escapeHtml(requestPath)}</code> · Mode: <strong>${hydrate ? 'DSD + Progressive Hydration' : 'Pure Zero-JS DSD'}</strong>`
  );

  const card1Dsd = renderComponentToDSD(
    'el-card',
    ElCard,
    {},
    `<div class="card-pad">
      <h3>1. Server-Painted Actions</h3>
      <p class="muted">Buttons render with full Shadow DOM styling before client JS downloads. When hydrated, the primary button becomes reactive.</p>
      <div class="btn-row">
        ${primaryBtnDsd}
        ${secondaryBtnDsd}
        ${dangerBtnDsd}
      </div>
    </div>`
  );

  const card2Dsd = renderComponentToDSD(
    'el-card',
    ElCard,
    {},
    `<div class="card-pad">
      <h3>2. Telemetry &amp; Status Primitives</h3>
      <div class="profile-row">
        ${avatarDsd}
        <div>
          <strong>Pure Node.js Edge Worker</strong>
          <div class="muted">Zero happy-dom · Zero bundler · Native ESM</div>
        </div>
      </div>
      <div class="metric">
        <div class="metric-head"><span>Test Coverage</span><strong>96%</strong></div>
        ${progressDsd}
      </div>
      <div class="metric">
        <div class="metric-head"><span>Edge Memory Headroom</span><strong>72%</strong></div>
        ${meterDsd}
      </div>
    </div>`
  );

  const modeSwitcher = staticMode
    ? `<p class="muted">Static DSD snapshot pre-rendered by <code>node examples/ssr-server.js --static examples/ssr-demo.html</code>. Run <code>npm run ssr</code> to test live <code>?hydrate=0</code> vs <code>?hydrate=1</code> on <code>http://localhost:3333</code>.</p>`
    : `<div class="mode-links">
        <a href="${basePath}?hydrate=1" class="${hydrate ? 'active' : ''}">Hydrated Mode (?hydrate=1)</a>
        <a href="${basePath}?hydrate=0" class="${!hydrate ? 'active' : ''}">Pure Zero-JS Mode (?hydrate=0)</a>
      </div>`;

  const hydrationScripts = hydrate
    ? `<script type="module">
    import '${assetPrefix}/src/index.js';
    const btn = document.getElementById('ssr-counter-btn');
    let clicks = 0;
    btn?.addEventListener('click', () => {
      clicks += 1;
      btn.textContent = 'Interactive Hydrated Clicks: ' + clicks;
    });
  </script>`
    : '<!-- Zero-JS mode (?hydrate=0): No client scripts loaded; Shadow DOM rendered purely via DSD! -->';

  return `<!DOCTYPE html>
<html lang="en" data-dsd>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Declarative Shadow DOM (DSD) SSR Example — @wcomp/elementum</title>
  <style>
${tokensCss}
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--el-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      background: var(--el-surface-muted, #f8fafc);
      color: var(--el-text-primary, #0f172a);
      min-height: 100vh;
      padding-bottom: 56px;
    }
    .shell {
      max-width: 1080px;
      margin: 28px auto 0;
      padding: 0 20px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .hero h1 {
      margin: 12px 0 8px;
      font-size: clamp(1.6rem, 3vw, 2.2rem);
      letter-spacing: -0.02em;
    }
    .hero p { margin: 0; color: var(--el-text-secondary, #475569); max-width: 65ch; }
    .badges { display: flex; flex-wrap: wrap; gap: 8px; }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }
    .card-pad { padding: 4px; display: flex; flex-direction: column; gap: 14px; }
    .card-pad h3 { margin: 0; font-size: 1.05rem; }
    .muted { color: var(--el-text-secondary, #475569); font-size: 0.9rem; margin: 0; }
    .btn-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .profile-row { display: flex; align-items: center; gap: 12px; }
    .metric { display: flex; flex-direction: column; gap: 6px; }
    .metric-head { display: flex; justify-content: space-between; font-size: 0.85rem; }
    .mode-links { display: flex; gap: 12px; flex-wrap: wrap; }
    .mode-links a {
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-base, #ffffff);
      color: var(--el-text-primary, #0f172a);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .mode-links a.active {
      background: var(--el-color-primary, #2563eb);
      color: #ffffff;
      border-color: var(--el-color-primary, #2563eb);
    }
  </style>
</head>
<body>
  ${navbarDsd}

  <main class="shell">
    <header class="hero">
      <div class="badges">
        ${heroBadges}
      </div>
      <h1>Declarative Shadow DOM (DSD) SSR</h1>
      <p>
        Server-rendered in pure Node.js using <code>renderComponentToDSD()</code>. Inspect Page Source to see real
        <code>&lt;template shadowrootmode="open"&gt;</code> markup emitted before any client JavaScript runs.
      </p>
    </header>

    ${modeSwitcher}
    ${calloutDsd}

    <section class="grid-2">
      ${card1Dsd}
      ${card2Dsd}
    </section>

    <section>
      <h2 style="font-size: 1.15rem; margin: 0 0 10px;">Emitted Declarative Shadow DOM Output</h2>
      ${codeBlockDsd}
    </section>

    ${alertDsd}
  </main>

  ${hydrationScripts}
</body>
</html>
`;
}

const MIME = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

export function startServer(port = 3333) {
  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', `http://localhost:${port}`);
    if (reqUrl.pathname === '/' || reqUrl.pathname === '/ssr') {
      const hydrate = reqUrl.searchParams.get('hydrate') !== '0';
      const html = renderSsrPage({
        hydrate,
        staticMode: false,
        requestPath: reqUrl.pathname + reqUrl.search,
      });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // Serve static workspace files (/src/*, /docs.html, /examples/*) safely
    const safeRel = path.normalize(reqUrl.pathname).replace(/^([/\\])+/, '');
    const filePath = path.resolve(rootDir, safeRel);
    if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(port, () => {
    console.log(`Elementum DSD/SSR server running at http://localhost:${port}`);
    console.log(`  Hydrated mode: http://localhost:${port}/?hydrate=1`);
    console.log(`  Zero-JS mode:  http://localhost:${port}/?hydrate=0`);
  });
  return server;
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());

if (isDirectRun) {
  const args = process.argv.slice(2);
  const staticIdx = args.indexOf('--static');
  if (staticIdx !== -1) {
    const outRel = args[staticIdx + 1] || 'examples/ssr-demo.html';
    const outPath = path.resolve(rootDir, outRel);
    const html = renderSsrPage({ hydrate: true, staticMode: true });
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`Pre-rendered static DSD snapshot -> ${outRel} (${Buffer.byteLength(html, 'utf8')} bytes)`);
  } else {
    const portIdx = args.indexOf('--port');
    const port = portIdx !== -1 ? Number(args[portIdx + 1]) || 3333 : Number(process.env.PORT) || 3333;
    startServer(port);
  }
}
