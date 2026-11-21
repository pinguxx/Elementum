#!/usr/bin/env node
/**
 * Penpot -> Elementum Web Components Generator (MCP Codegen)
 *
 * Connects to a live Penpot file via the Penpot MCP server, inspects a target
 * page's layer tree, validates discovered `el-*` component annotations against
 * Elementum's catalog, exports a PNG snapshot of the Penpot artboard, and
 * generates a working, zero-dependency, signal-driven Elementum HTML application.
 *
 * Usage:
 *   node tools/penpot-to-elementum.js --url "<PENPOT_MCP_URL>" --page "LedgerFlow App" --out examples/ledgerflow.html --export-png docs/assets/ledgerflow-penpot.png
 *   node tools/penpot-to-elementum.js --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { components as catalogComponents } from '../examples/catalog-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const CATALOG_LIST = Array.isArray(catalogComponents)
  ? catalogComponents
  : Object.values(catalogComponents);
const CATALOG_BY_TAG = new Map(CATALOG_LIST.map((c) => [c.tag, c]));
const KNOWN_ELEMENTUM_TAGS = new Set(CATALOG_BY_TAG.keys());

const STANDARD_HTML_ATTRS = new Set([
  'id', 'class', 'slot', 'style', 'title', 'href', 'target',
  'type', 'name', 'value', 'placeholder', 'role', 'tabindex',
]);
const INTERNAL_CODEGEN_PROPS = new Set(['section', 'kpi', 'action']);

function parseArgs(argv) {
  const opts = {
    url: process.env.PENPOT_MCP_URL || '',
    token: process.env.PENPOT_MCP_TOKEN || '',
    page: 'LedgerFlow App',
    out: 'examples/ledgerflow.html',
    exportPng: 'docs/assets/ledgerflow-penpot.png',
    mode: 'auto',
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--url' && argv[i + 1]) opts.url = argv[++i];
    else if (arg === '--token' && argv[i + 1]) opts.token = argv[++i];
    else if (arg === '--page' && argv[i + 1]) opts.page = argv[++i];
    else if (arg === '--out' && argv[i + 1]) opts.out = argv[++i];
    else if (arg === '--export-png' && argv[i + 1]) opts.exportPng = argv[++i];
    else if (arg === '--mode' && argv[i + 1]) opts.mode = argv[++i];
    else if (arg === '--dry-run') opts.dryRun = true;
  }
  if (!opts.url && opts.token) {
    opts.url = `https://design.penpot.app/mcp/stream?userToken=${encodeURIComponent(opts.token)}`;
  }
  return opts;
}

function parseSseOrJson(raw) {
  const trimmed = raw.trim();
  const dataLines = trimmed
    .split(/\r?\n/)
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).trim())
    .filter(Boolean);
  const payload = dataLines.length > 0 ? dataLines.at(-1) : trimmed;
  return JSON.parse(payload);
}

async function createMcpClient(url) {
  let sessionId = null;

  async function rpc(method, params = {}, isNotification = false) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };
    if (sessionId) headers['mcp-session-id'] = sessionId;

    let res;
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(
            isNotification
              ? { jsonrpc: '2.0', method }
              : { jsonrpc: '2.0', id: Date.now() + Math.floor(Math.random() * 1000), method, params }
          ),
        });
        break;
      } catch (err) {
        lastErr = err;
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
    if (!res) throw lastErr;

    const sid = res.headers.get('mcp-session-id');
    if (sid) sessionId = sid;

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    if (isNotification) return null;

    const text = await res.text();
    const parsed = parseSseOrJson(text);
    if (parsed.error) throw new Error(parsed.error.message || JSON.stringify(parsed.error));
    return parsed.result;
  }

  await rpc('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'elementum-penpot-codegen', version: '0.6.0' },
  });
  await rpc('notifications/initialized', {}, true);

  return {
    async executeCode(code) {
      const result = await rpc('tools/call', { name: 'execute_code', arguments: { code } });
      const contentText = result?.content?.[0]?.text || '';
      if (contentText.startsWith('Tool execution failed:')) throw new Error(contentText);
      return JSON.parse(contentText).result;
    },
    async exportShape(shapeId, format = 'png') {
      const result = await rpc('tools/call', {
        name: 'export_shape',
        arguments: { shapeId, format, mode: 'shape' },
      });
      const img = result?.content?.find((c) => c.type === 'image');
      if (!img?.data) {
        throw new Error(`export_shape did not return image data for shape ${shapeId}`);
      }
      return Buffer.from(img.data, 'base64');
    },
  };
}

/**
 * Parses a Penpot layer name like `el-button | variant="primary" label="+ Add Expense"`,
 * `el-code-block | language="js" copyable`, or Penpot library path `Actions & Buttons / el-button / danger`
 * into `{ tag, props, isValidElementum }`.
 */
export function parsePenpotLayerName(name = '') {
  const trimmed = String(name || '').trim();
  let tag = '';
  let variantKey = '';
  let propsStr = '';

  const libMatch = trimmed.match(/^[^/|\n]+\/\s*(el-[a-z0-9-]+)(?:\s*\/\s*([^|\n]+?))?(?:\s*\|\s*(.*))?$/i);
  if (libMatch) {
    tag = libMatch[1].toLowerCase();
    variantKey = (libMatch[2] || '').trim();
    propsStr = libMatch[3] || '';
  } else {
    const directMatch = trimmed.match(/^(el-[a-z0-9-]+)(?:\s*\|\s*(.*))?$/i);
    if (!directMatch) return null;
    tag = directMatch[1].toLowerCase();
    propsStr = directMatch[2] || '';
  }

  const meta = CATALOG_BY_TAG.get(tag);
  const props = {};

  if (variantKey && variantKey !== 'default') {
    if (variantKey === 'checked') {
      props.checked = true;
    } else if (variantKey === 'disabled') {
      props.disabled = true;
    } else if (variantKey !== 'unchecked') {
      const hasSize = meta?.props?.some((p) => p.name === 'size');
      const hasStatus = meta?.props?.some((p) => p.name === 'status');
      const hasVariant = meta?.props?.some((p) => p.name === 'variant');
      if (hasSize && ['sm', 'md', 'lg'].includes(variantKey)) {
        props.size = variantKey;
      } else if (hasStatus && !hasVariant) {
        props.status = variantKey;
      } else {
        props.variant = variantKey;
      }
    }
  }

  const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = attrRegex.exec(propsStr)) !== null) {
    props[m[1]] = m[2];
  }

  const remaining = propsStr.replace(/([a-zA-Z0-9_-]+)\s*=\s*"([^"]*)"/g, ' ').trim();
  if (remaining) {
    for (const token of remaining.split(/\s+/)) {
      if (/^[a-z][a-z0-9-]*$/i.test(token) && !(token in props)) {
        props[token] = true;
      }
    }
  }

  return {
    tag,
    props,
    isValidElementum: KNOWN_ELEMENTUM_TAGS.has(tag),
  };
}

/**
 * Walks an extracted Penpot page tree and produces a normalized Elementum App Spec IR.
 */
export function extractElementumSpec(penpotTree) {
  const discoveredTags = new Set();
  const unknownTags = new Set();
  const kpis = [];
  const budgets = [];
  const transactions = [];
  let brand = 'LedgerFlow';
  let badge = 'Finance';
  let heading = 'Monthly Cashflow & Expenses';
  let subtitle = 'Real-time treasury overview generated from Penpot MCP into Elementum Web Components.';
  let chartTitle = '6-Month Spend vs Budget';
  let drawerHeading = 'Transaction Details';
  let dialogHeading = 'Add New Expense';
  let primaryCta = '+ Add Expense';

  const discoveredNodes = [];

  function walk(node) {
    if (!node) return;
    const parsed = parsePenpotLayerName(node.name);
    if (parsed) {
      if (parsed.isValidElementum) {
        discoveredTags.add(parsed.tag);
        discoveredNodes.push({ tag: parsed.tag, props: parsed.props });
      } else {
        unknownTags.add(parsed.tag);
      }

      if (parsed.tag === 'el-navbar') {
        if (parsed.props.brand) brand = parsed.props.brand;
        if (parsed.props.badge) badge = parsed.props.badge;
      } else if (parsed.tag === 'el-button' && parsed.props.action === 'open-add-dialog') {
        if (parsed.props.label) primaryCta = parsed.props.label;
      } else if (parsed.tag === 'el-drawer' && parsed.props.heading) {
        drawerHeading = parsed.props.heading;
      } else if (parsed.tag === 'el-dialog' && parsed.props.heading) {
        dialogHeading = parsed.props.heading;
      } else if (parsed.tag === 'el-card' && parsed.props.section === 'kpi') {
        const numNode = (node.children || []).find((c) => c.name?.startsWith('el-number-flow'));
        const badgeNode = (node.children || []).find((c) => c.name?.startsWith('el-badge'));
        const numMeta = numNode ? parsePenpotLayerName(numNode.name) : null;
        const badgeMeta = badgeNode ? parsePenpotLayerName(badgeNode.name) : null;
        kpis.push({
          key: parsed.props.kpi || `kpi-${kpis.length}`,
          title: parsed.props.title || 'Metric',
          value: Number(numMeta?.props.value ?? 0),
          prefix: numMeta?.props.prefix || '',
          suffix: numMeta?.props.suffix || '',
          delta: badgeMeta?.props.label || '',
          variant: badgeMeta?.props.variant || 'default',
        });
      } else if (parsed.tag === 'el-card' && parsed.props.section === 'chart') {
        if (parsed.props.title) chartTitle = parsed.props.title;
      } else if (parsed.tag === 'el-meter') {
        budgets.push({
          label: parsed.props.label || 'Category',
          value: Number(parsed.props.value ?? 0),
          max: Number(parsed.props.max ?? 100),
        });
      }
    }

    if (node.name === 'PageHeading' && node.text) heading = node.text;
    if (node.name === 'PageSubtitle' && node.text) subtitle = node.text;

    if (node.name?.startsWith('TxRow_') && Array.isArray(node.children)) {
      const getText = (n) => node.children.find((c) => c.name === n)?.text || '';
      const badgeChild = node.children.find((c) => c.name?.startsWith('el-badge'));
      const badgeParsed = badgeChild ? parsePenpotLayerName(badgeChild.name) : null;
      const amountRaw = getText('Amount');
      const numericAmount = Number(amountRaw.replace(/[^0-9.-]/g, '')) || 0;
      transactions.push({
        id: `tx-${transactions.length + 1}`,
        merchant: getText('Merchant') || 'Transaction',
        category: getText('Category') || 'Operations',
        date: getText('Date') || '2026-11-18',
        status: badgeParsed?.props.label || 'Cleared',
        amount: numericAmount,
      });
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child);
    }
  }

  for (const rootChild of penpotTree.children || []) {
    walk(rootChild);
  }

  // Ensure toaster is included for interactive form feedback
  discoveredTags.add('el-toaster');

  return {
    sourceFile: penpotTree.fileName || 'Penpot File',
    sourcePage: penpotTree.pageName || 'LedgerFlow App',
    appShellId: penpotTree.appShellId || null,
    brand,
    badge,
    heading,
    subtitle,
    primaryCta,
    chartTitle,
    drawerHeading,
    dialogHeading,
    discoveredTags: [...discoveredTags].sort(),
    unknownTags: [...unknownTags].sort(),
    nodes: discoveredNodes,
    kpis:
      kpis.length > 0
        ? kpis
        : [
            { key: 'balance', title: 'Total Balance', value: 48290, prefix: '$', suffix: '', delta: '+12.4%', variant: 'success' },
            { key: 'spend', title: 'Monthly Spend', value: 6420, prefix: '$', suffix: '', delta: '-4.2%', variant: 'primary' },
            { key: 'budget', title: 'Budget Utilization', value: 64, prefix: '', suffix: '%', delta: 'On Track', variant: 'warning' },
            { key: 'savings', title: 'Net Cashflow', value: 14850, prefix: '$', suffix: '', delta: '+18.9%', variant: 'success' },
          ],
    budgets:
      budgets.length > 0
        ? budgets
        : [
            { label: 'Cloud & Infrastructure', value: 78, max: 100 },
            { label: 'Product & Design Tools', value: 46, max: 100 },
            { label: 'Marketing & Growth', value: 88, max: 100 },
            { label: 'Travel & Operations', value: 31, max: 100 },
          ],
    transactions:
      transactions.length > 0
        ? transactions
        : [
            { id: 'tx-1', merchant: 'Cloudflare Enterprise', category: 'Cloud & Infrastructure', date: '2026-11-18', status: 'Cleared', amount: -1240 },
            { id: 'tx-2', merchant: 'Stripe Payout #4821', category: 'Revenue', date: '2026-11-17', status: 'Cleared', amount: 8450 },
            { id: 'tx-3', merchant: 'Penpot Cloud Team', category: 'Product & Design Tools', date: '2026-11-16', status: 'Cleared', amount: -180 },
            { id: 'tx-4', merchant: 'Linear Workspace', category: 'Product & Design Tools', date: '2026-11-15', status: 'Pending', amount: -240 },
            { id: 'tx-5', merchant: 'Delta Air Lines', category: 'Travel & Operations', date: '2026-11-14', status: 'Flagged', amount: -620 },
          ],
  };
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Recursively compiles any Penpot layer node into clean, escaped Elementum HTML
 * supporting all 109 catalog components, boolean attributes, slots, and structural helpers.
 */
export function renderElementumNode(node, indent = 2) {
  if (!node) return '';
  const pad = ' '.repeat(indent);
  const childPad = ' '.repeat(indent + 2);
  const parsed = parsePenpotLayerName(node.name);

  if (!parsed) {
    const childHtml = (node.children || [])
      .map((c) => renderElementumNode(c, indent + 2))
      .filter(Boolean);
    if (childHtml.length === 0) return '';
    return `${pad}<section class="pp-group" data-layer="${escapeHtml(node.name || 'group')}">\n${childHtml.join('\n')}\n${pad}</section>`;
  }

  if (!parsed.isValidElementum) return '';

  const tag = parsed.tag;
  const meta = CATALOG_BY_TAG.get(tag);
  const declaredProps = new Set((meta?.props || []).map((p) => p.name));
  const boolProps = new Set((meta?.props || []).filter((p) => p.type === 'boolean').map((p) => p.name));

  const attrs = [];
  const blockChildren = [];
  const slotTexts = [];

  for (const [k, v] of Object.entries(parsed.props)) {
    if ((tag === 'el-card' || tag === 'el-callout') && k === 'title') {
      blockChildren.push(
        tag === 'el-card'
          ? `${childPad}<el-card-header><el-card-title>${escapeHtml(v)}</el-card-title></el-card-header>`
          : `${childPad}<span slot="title">${escapeHtml(v)}</span>`
      );
      continue;
    }
    if ((k === 'label' || k === 'text' || k === 'content') && !declaredProps.has(k)) {
      if (v) slotTexts.push(escapeHtml(v));
      continue;
    }
    if (INTERNAL_CODEGEN_PROPS.has(k)) continue;
    if (!declaredProps.has(k) && !STANDARD_HTML_ATTRS.has(k) && !k.startsWith('aria-') && !k.startsWith('data-')) {
      continue;
    }

    if (boolProps.has(k) || typeof v === 'boolean') {
      if (v === true || v === '' || v === 'true') attrs.push(k);
    } else if (v !== null && v !== undefined) {
      attrs.push(`${k}="${escapeHtml(v)}"`);
    }
  }

  const textChildren = [];
  for (const child of node.children || []) {
    const rendered = renderElementumNode(child, indent + 2);
    if (rendered) {
      blockChildren.push(rendered);
    } else if (child.type === 'text' && typeof child.text === 'string' && !parsePenpotLayerName(child.name)) {
      textChildren.push(escapeHtml(child.text));
    }
  }
  if (slotTexts.length === 0 && textChildren.length > 0) {
    slotTexts.push(...textChildren);
  }

  const attrStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
  if (blockChildren.length === 0) {
    return `${pad}<${tag}${attrStr}>${slotTexts.join(' ')}</${tag}>`;
  }
  const innerLines = [...blockChildren];
  if (slotTexts.length > 0) innerLines.push(`${childPad}${slotTexts.join(' ')}`);
  return `${pad}<${tag}${attrStr}>\n${innerLines.join('\n')}\n${pad}</${tag}>`;
}

/**
 * Generates a standalone Elementum HTML document for any arbitrary Penpot page tree
 * across all 109 components.
 */
export function generatePageHtml(penpotTree) {
  const title = penpotTree?.pageName || 'Penpot Design';
  const renderedBlocks = (penpotTree?.children || [])
    .map((child) => renderElementumNode(child, 4))
    .filter(Boolean);
  const bodyContent = renderedBlocks.length > 0
    ? renderedBlocks.join('\n')
    : '    <!-- No Elementum (el-*) layers discovered on this Penpot page -->';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — Generated from Penpot MCP | @wcomp/elementum</title>
  <link rel="stylesheet" href="../src/tokens.css" />
  <script type="module" src="../src/index.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      background: var(--el-surface-base, #ffffff);
      color: var(--el-text-primary, #0f172a);
    }
    .pp-canvas {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--el-spacing-lg, 24px);
      display: flex;
      flex-direction: column;
      gap: var(--el-spacing-md, 16px);
    }
    .pp-group {
      display: flex;
      flex-direction: column;
      gap: var(--el-spacing-sm, 8px);
    }
  </style>
</head>
<body>
  <main class="pp-canvas">
${bodyContent}
  </main>
  <el-toaster id="app-toaster" position="bottom-right"></el-toaster>
</body>
</html>
`;
}

/**
 * Generates a self-contained, zero-dependency, signal-driven Elementum HTML app
 * from the extracted Penpot App Spec IR.
 */
export function generateAppHtml(spec) {
  const chartData = [
    { label: 'Jun', value: 4950, budget: 8000 },
    { label: 'Jul', value: 5820, budget: 8000 },
    { label: 'Aug', value: 5410, budget: 8500 },
    { label: 'Sep', value: 6890, budget: 9000 },
    { label: 'Oct', value: 6150, budget: 9500 },
    { label: 'Nov', value: 6420, budget: 10000 },
  ];

  const kpiCardsHtml = spec.kpis
    .map(
      (k) => `        <el-card class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">${escapeHtml(k.title)}</span>
            <el-badge variant="${escapeHtml(k.variant)}">${escapeHtml(k.delta)}</el-badge>
          </div>
          <div class="kpi-value">
            <el-number-flow id="kpi-${escapeHtml(k.key)}" value="${k.value}" prefix="${escapeHtml(k.prefix)}" suffix="${escapeHtml(k.suffix)}"></el-number-flow>
          </div>
          <span class="kpi-caption">vs. previous 30 days</span>
        </el-card>`
    )
    .join('\n');

  const budgetMetersHtml = spec.budgets
    .map(
      (b) => `          <div class="budget-row">
            <div class="budget-row-header">
              <span>${escapeHtml(b.label)}</span>
              <span class="budget-pct">${b.value}%</span>
            </div>
            <el-meter value="${b.value}" min="0" max="${b.max}" low="50" high="80" optimum="40"></el-meter>
          </div>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(spec.brand)} — Generated from Penpot MCP | @wcomp/elementum</title>
  <link rel="stylesheet" href="../src/tokens.css" />
  <script type="module" src="../src/index.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; overflow-x: hidden; }
    body {
      font-family: var(--el-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      background: var(--el-surface-muted, #f8fafc);
      color: var(--el-text-primary, #0f172a);
      min-height: 100vh;
      padding-bottom: 56px;
      transition: background-color 0.2s ease, color 0.2s ease;
    }
    .shell {
      max-width: 1320px;
      margin: 28px auto 0;
      padding: 0 20px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;
    }
    .page-header h1 {
      margin: 0 0 6px;
      font-size: clamp(1.5rem, 2.4vw, 1.85rem);
      letter-spacing: -0.02em;
    }
    .page-header p {
      margin: 0;
      color: var(--el-text-secondary, #475569);
      font-size: 0.95rem;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .kpi-card { display: block; }
    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .kpi-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--el-text-secondary, #475569);
    }
    .kpi-value {
      font-size: 1.9rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    .kpi-caption {
      font-size: 0.78rem;
      color: var(--el-text-muted, #64748b);
    }
    .analytics-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr);
      gap: 20px;
    }
    @media (max-width: 960px) {
      .analytics-grid { grid-template-columns: minmax(0, 1fr); }
    }
    .budget-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 8px;
    }
    .budget-row-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .budget-pct { color: var(--el-text-secondary, #475569); }
    .tx-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
    }
    .tx-search { min-width: 260px; flex: 1; max-width: 360px; }
    .tx-table-wrap { width: 100%; overflow-x: auto; }
    .tx-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .tx-table th, .tx-table td {
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
    }
    .tx-table th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--el-text-muted, #64748b);
      background: var(--el-surface-muted, #f8fafc);
    }
    .tx-table tbody tr {
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .tx-table tbody tr:hover {
      background: var(--el-surface-muted, #f8fafc);
    }
    .amount-pos { color: var(--el-color-success, #10b981); font-weight: 700; }
    .amount-neg { font-weight: 700; }
    .form-stack { display: flex; flex-direction: column; gap: 14px; margin-top: 10px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
    .drawer-meta {
      background: var(--el-surface-muted, #f8fafc);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 8px);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 16px 0;
      font-size: 0.9rem;
    }
    .drawer-meta-row { display: flex; justify-content: space-between; gap: 12px; }
    .meta-k { color: var(--el-text-muted, #64748b); }
    .provenance {
      font-size: 0.82rem;
      color: var(--el-text-muted, #64748b);
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
  </style>
</head>
<body>
  <!-- Generated by tools/penpot-to-elementum.js from Penpot page "${escapeHtml(spec.sourcePage)}" (${escapeHtml(spec.sourceFile)}) -->
  <!-- Validated Elementum components: ${escapeHtml(spec.discoveredTags.join(', '))} -->

  <el-navbar sticky brand="⚡ ${escapeHtml(spec.brand)}" badge="${escapeHtml(spec.badge)}" badge-variant="primary" href="../index.html">
    <a href="../index.html">Home</a>
    <a href="./index.html">Catalog</a>
    <a href="../docs.html#penpot-mcp">Penpot Docs</a>
    <a href="./ledgerflow.html" active>LedgerFlow</a>
    <el-theme-switch slot="actions"></el-theme-switch>
    <el-button id="open-add-btn" slot="actions" variant="primary" size="sm">${escapeHtml(spec.primaryCta)}</el-button>
  </el-navbar>

  <main class="shell">
    <section class="page-header">
      <div>
        <h1>${escapeHtml(spec.heading)}</h1>
        <p>${escapeHtml(spec.subtitle)}</p>
      </div>
      <el-segmented-control id="type-filter" value="All" options="All,Income,Expenses"></el-segmented-control>
    </section>

    <el-callout variant="info">
      <span slot="title">Generated from Penpot via MCP</span>
      This live app was extracted from Penpot page <strong>${escapeHtml(spec.sourcePage)}</strong> via <code>tools/penpot-to-elementum.js</code> using <strong>${spec.discoveredTags.length}</strong> validated Elementum Web Components. Click any row to inspect in <code>&lt;el-drawer&gt;</code> or add a live expense via <code>&lt;el-dialog&gt;</code>.
    </el-callout>

    <!-- 4 KPI Cards -->
    <section class="kpi-grid">
${kpiCardsHtml}
    </section>

    <!-- Analytics + Budget Utilization -->
    <section class="analytics-grid">
      <el-card>
        <el-card-header>
          <el-card-title>${escapeHtml(spec.chartTitle)}</el-card-title>
          <el-card-description>Interactive SVG visualization powered by &lt;el-chart&gt;</el-card-description>
        </el-card-header>
        <el-card-content>
          <el-chart id="spend-chart" type="area" height="220" show-grid show-dots></el-chart>
        </el-card-content>
      </el-card>

      <el-card>
        <el-card-header>
          <el-card-title>Department Budgets</el-card-title>
          <el-card-description>Semantic threshold tracking via &lt;el-meter&gt;</el-card-description>
        </el-card-header>
        <el-card-content>
          <div class="budget-list">
${budgetMetersHtml}
          </div>
        </el-card-content>
      </el-card>
    </section>

    <!-- Filterable Transactions Ledger -->
    <section>
      <el-card>
        <el-card-header>
          <el-card-title>Recent Transactions</el-card-title>
          <el-card-description>Click any transaction row to inspect details in &lt;el-drawer&gt;</el-card-description>
        </el-card-header>
        <el-card-content>
          <div class="tx-toolbar">
            <el-input id="tx-search" class="tx-search" placeholder="Search merchant or category..."></el-input>
            <div class="provenance">
              <span>Components:</span>
              <el-badge variant="default">${spec.discoveredTags.length} Elementum Tags</el-badge>
            </div>
          </div>
          <div class="tx-table-wrap">
            <table class="tx-table" aria-label="Recent transactions">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody id="tx-tbody"></tbody>
            </table>
          </div>
        </el-card-content>
      </el-card>
    </section>
  </main>

  <!-- Slide-over Transaction Inspector -->
  <el-drawer id="tx-drawer" placement="right" heading="${escapeHtml(spec.drawerHeading)}">
    <div id="drawer-body"></div>
  </el-drawer>

  <!-- Add New Expense Modal (Native FACE Form) -->
  <el-dialog id="add-dialog" heading="${escapeHtml(spec.dialogHeading)}">
    <form id="expense-form" class="form-stack">
      <el-input id="f-merchant" name="merchant" label="Merchant" placeholder="e.g. Figma, Cloudflare" required></el-input>
      <el-input id="f-amount" name="amount" type="number" label="Amount (USD)" placeholder="250" required></el-input>
      <el-select id="f-category" name="category" label="Category" value="Cloud & Infrastructure">
        <option value="Cloud & Infrastructure">Cloud &amp; Infrastructure</option>
        <option value="Product & Design Tools">Product &amp; Design Tools</option>
        <option value="Marketing & Growth">Marketing &amp; Growth</option>
        <option value="Travel & Operations">Travel &amp; Operations</option>
        <option value="Revenue">Revenue</option>
      </el-select>
      <el-select id="f-type" name="type" label="Entry Type" value="expense">
        <option value="expense">Expense (-)</option>
        <option value="income">Income (+)</option>
      </el-select>
      <div class="dialog-actions">
        <el-button id="cancel-add-btn" type="button" variant="secondary">Cancel</el-button>
        <el-button type="submit" variant="primary">Save Entry</el-button>
      </div>
    </form>
  </el-dialog>

  <el-toaster id="app-toaster" position="bottom-right"></el-toaster>

  <script type="module">
    import { signal, computed, effect, toast } from '../src/index.js';

    const initialTransactions = ${JSON.stringify(spec.transactions, null, 2)};
    const initialChartData = ${JSON.stringify(chartData, null, 2)};

    const transactions = signal(initialTransactions);
    const filterType = signal('All');
    const searchQuery = signal('');

    const filteredTransactions = computed(() => {
      const q = searchQuery.value.trim().toLowerCase();
      const mode = filterType.value;
      return transactions.value.filter((tx) => {
        if (mode === 'Income' && tx.amount < 0) return false;
        if (mode === 'Expenses' && tx.amount >= 0) return false;
        if (q && !tx.merchant.toLowerCase().includes(q) && !tx.category.toLowerCase().includes(q)) return false;
        return true;
      });
    });

    const chartEl = document.getElementById('spend-chart');
    if (chartEl) {
      chartEl.setAttribute('data', JSON.stringify(initialChartData));
    }

    const tbody = document.getElementById('tx-tbody');
    const drawer = document.getElementById('tx-drawer');
    const drawerBody = document.getElementById('drawer-body');
    const dialog = document.getElementById('add-dialog');

    function statusVariant(status) {
      if (status === 'Cleared') return 'success';
      if (status === 'Pending') return 'warning';
      if (status === 'Flagged') return 'danger';
      return 'default';
    }

    function openInspector(tx) {
      if (!drawer || !drawerBody) return;
      const formatted = (tx.amount >= 0 ? '+$' : '-$') + Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
      drawerBody.innerHTML = \`
        <h3 style="margin:0 0 4px;">\${tx.merchant}</h3>
        <div style="font-size:1.75rem;font-weight:700;margin-bottom:12px;">\${formatted}</div>
        <el-badge variant="\${statusVariant(tx.status)}">\${tx.status}</el-badge>
        <div class="drawer-meta">
          <div class="drawer-meta-row"><span class="meta-k">Category</span><strong>\${tx.category}</strong></div>
          <div class="drawer-meta-row"><span class="meta-k">Date</span><strong>\${tx.date}</strong></div>
          <div class="drawer-meta-row"><span class="meta-k">Account</span><strong>Corporate Visa •••• 4242</strong></div>
          <div class="drawer-meta-row"><span class="meta-k">Transaction ID</span><code>\${tx.id}</code></div>
        </div>
        <el-button id="drawer-download-btn" variant="secondary" style="width:100%;">Download Receipt</el-button>
      \`;
      drawerBody.querySelector('#drawer-download-btn')?.addEventListener('click', () => {
        toast.info(\`Receipt queued for \${tx.merchant}\`);
      });
      drawer.open = true;
    }

    effect(() => {
      const list = filteredTransactions.value;
      tbody.innerHTML = '';
      for (const tx of list) {
        const tr = document.createElement('tr');
        const formatted = (tx.amount >= 0 ? '+$' : '-$') + Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
        tr.innerHTML = \`
          <td><strong>\${tx.merchant}</strong></td>
          <td>\${tx.category}</td>
          <td>\${tx.date}</td>
          <td><el-badge variant="\${statusVariant(tx.status)}">\${tx.status}</el-badge></td>
          <td class="\${tx.amount >= 0 ? 'amount-pos' : 'amount-neg'}">\${formatted}</td>
        \`;
        tr.addEventListener('click', () => openInspector(tx));
        tbody.appendChild(tr);
      }

      // Live KPI roll-up
      const spendTotal = Math.round(
        transactions.value.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
      );
      const balanceDelta = Math.round(transactions.value.reduce((s, t) => s + t.amount, 0));
      const balanceEl = document.getElementById('kpi-balance');
      const spendEl = document.getElementById('kpi-spend');
      if (balanceEl) balanceEl.setAttribute('value', String(42120 + balanceDelta));
      if (spendEl) spendEl.setAttribute('value', String(4140 + spendTotal));
    });

    document.getElementById('type-filter')?.addEventListener('change', (e) => {
      filterType.value = e.detail?.value || e.target.value || 'All';
    });

    document.getElementById('tx-search')?.addEventListener('input', (e) => {
      searchQuery.value = e.detail?.value ?? e.target.value ?? '';
    });

    document.getElementById('open-add-btn')?.addEventListener('click', () => {
      dialog?.showModal?.();
    });

    document.getElementById('cancel-add-btn')?.addEventListener('click', () => {
      dialog?.close?.();
    });

    document.getElementById('expense-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const merchant = document.getElementById('f-merchant')?.value?.trim();
      const rawAmount = Number(document.getElementById('f-amount')?.value || 0);
      const category = document.getElementById('f-category')?.value || 'Cloud & Infrastructure';
      const entryType = document.getElementById('f-type')?.value || 'expense';
      if (!merchant || !rawAmount) return;

      const signed = entryType === 'income' ? Math.abs(rawAmount) : -Math.abs(rawAmount);
      const next = {
        id: 'tx-' + (transactions.value.length + 1),
        merchant,
        category,
        date: new Date().toISOString().slice(0, 10),
        status: 'Cleared',
        amount: signed,
      };
      transactions.value = [next, ...transactions.value];
      dialog?.close?.();
      e.target.reset();
      toast.success(\`Added \${merchant} (\${signed >= 0 ? '+$' : '-$'}\${Math.abs(signed)})\`);
    });
  </script>
</body>
</html>
`;
}

function buildInspectPenpotScript(pageName) {
  return `
const page = penpotUtils.getPageByName(${JSON.stringify(pageName)});
if (!page) {
  return { error: 'Page not found: ' + ${JSON.stringify(pageName)}, availablePages: [] };
}
await penpot.openPage(page);

function serialize(shape, depth = 0) {
  if (depth > 5) return null;
  const node = {
    id: shape.id,
    name: shape.name || '',
    type: shape.type,
    x: Math.round(shape.x || 0),
    y: Math.round(shape.y || 0),
    width: Math.round(shape.width || 0),
    height: Math.round(shape.height || 0),
  };
  if (shape.type === 'text' && typeof shape.characters === 'string') {
    node.text = shape.characters;
  }
  if (Array.isArray(shape.children) && shape.children.length > 0) {
    node.children = shape.children.map((c) => serialize(c, depth + 1)).filter(Boolean);
  }
  return node;
}

const appShell = page.root.children.find((c) => c.name && c.name.includes('App Shell')) || page.root.children[0];
return {
  fileName: penpot.currentFile.name,
  pageName: page.name,
  pageId: page.id,
  appShellId: appShell ? appShell.id : null,
  children: page.root.children.map((c) => serialize(c, 0)).filter(Boolean),
};
`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.dryRun) {
    const sampleSpec = extractElementumSpec({
      fileName: 'DryRun File',
      pageName: opts.page,
      children: [
        { name: 'el-navbar | brand="LedgerFlow" badge="Finance"', children: [] },
        { name: 'el-button | variant="primary" label="+ Add Expense" action="open-add-dialog"', children: [] },
        { name: 'el-chart | type="area" height="220"', children: [] },
        { name: 'el-table | hover="true" striped="true"', children: [] },
        { name: 'el-drawer | placement="right" heading="Transaction Details"', children: [] },
        { name: 'el-dialog | heading="Add New Expense"', children: [] },
      ],
    });
    const htmlOut = opts.mode === 'generic'
      ? generatePageHtml({ pageName: opts.page, children: [{ name: 'el-code-block | language="js" copyable text="const x = 1;"' }] })
      : generateAppHtml(sampleSpec);
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          mode: opts.mode,
          supportedCatalogTags: KNOWN_ELEMENTUM_TAGS.size,
          page: opts.page,
          out: opts.out,
          discoveredTags: sampleSpec.discoveredTags,
          unknownTags: sampleSpec.unknownTags,
          generatedHtmlBytes: Buffer.byteLength(htmlOut, 'utf8'),
        },
        null,
        2
      )
    );
    return;
  }

  if (!opts.url) {
    console.error(
      'Missing Penpot MCP URL. Pass --url "<url>", --token "<jwt>", or set PENPOT_MCP_URL / PENPOT_MCP_TOKEN.'
    );
    process.exit(1);
  }

  const client = await createMcpClient(opts.url);
  console.log(`Connected to Penpot MCP. Inspecting page "${opts.page}"...`);
  const tree = await client.executeCode(buildInspectPenpotScript(opts.page));
  if (tree.error) {
    throw new Error(tree.error);
  }

  const spec = extractElementumSpec(tree);
  const useLedgerFlow =
    opts.mode === 'ledgerflow' ||
    (opts.mode === 'auto' && (/ledgerflow/i.test(opts.page) || spec.kpis.length > 0 || spec.transactions.length > 0));
  const htmlOut = useLedgerFlow ? generateAppHtml(spec) : generatePageHtml(tree);
  const outPath = path.resolve(rootDir, opts.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, htmlOut, 'utf8');

  let pngPath = null;
  if (opts.exportPng && spec.appShellId) {
    const pngBuf = await client.exportShape(spec.appShellId, 'png');
    pngPath = path.resolve(rootDir, opts.exportPng);
    fs.mkdirSync(path.dirname(pngPath), { recursive: true });
    fs.writeFileSync(pngPath, pngBuf);
  }

  console.log(
    JSON.stringify(
      {
        sourceFile: spec.sourceFile,
        sourcePage: spec.sourcePage,
        discoveredTags: spec.discoveredTags,
        unknownTags: spec.unknownTags,
        kpis: spec.kpis.length,
        budgets: spec.budgets.length,
        transactions: spec.transactions.length,
        writtenHtml: opts.out,
        exportedPng: pngPath ? opts.exportPng : null,
      },
      null,
      2
    )
  );
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isDirectRun) {
  main().catch((err) => {
    console.error('Penpot-to-Elementum generation failed:', err.message);
    process.exit(1);
  });
}
