#!/usr/bin/env node
/**
 * Designs the "LedgerFlow" Fintech Expense & Budget Dashboard inside a connected
 * Penpot file via the Penpot MCP server (`execute_code`).
 *
 * Every artboard and component group is named using Elementum tag annotations
 * (e.g. `el-navbar | brand="LedgerFlow"`) so `tools/penpot-to-elementum.js` can
 * inspect the live Penpot tree and generate a working Elementum Web Components app.
 *
 * Usage:
 *   node tools/design-ledgerflow-penpot.js --url "<PENPOT_MCP_URL>"
 *   node tools/design-ledgerflow-penpot.js --dry-run
 */

function parseArgs(argv) {
  const opts = {
    url: process.env.PENPOT_MCP_URL || '',
    token: process.env.PENPOT_MCP_TOKEN || '',
    page: 'LedgerFlow App',
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--url' && argv[i + 1]) opts.url = argv[++i];
    else if (arg === '--token' && argv[i + 1]) opts.token = argv[++i];
    else if (arg === '--page' && argv[i + 1]) opts.page = argv[++i];
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
    const contentText = parsed.result?.content?.[0]?.text || '';
    if (contentText.startsWith('Tool execution failed:')) throw new Error(contentText);
    return contentText;
  }

  await rpc('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'elementum-ledgerflow-designer', version: '0.1.0' },
  });
  await rpc('notifications/initialized', {}, true);

  return {
    async executeCode(code) {
      return await rpc('tools/call', { name: 'execute_code', arguments: { code } });
    },
  };
}

export function buildLedgerFlowPenpotScript(pageName = 'LedgerFlow App') {
  const cfg = { pageName };
  return `
const cfg = ${JSON.stringify(cfg)};

// Ensure we create or open a dedicated page without touching other pages
let page = penpotUtils.getPageByName(cfg.pageName);
if (!page) {
  page = penpot.createPage();
  page.name = cfg.pageName;
}
await penpot.openPage(page);

// Clear any prior LedgerFlow boards on this dedicated page so re-runs stay idempotent
const existing = [...page.root.children];
for (const child of existing) {
  if (child.name && (child.name.startsWith('LedgerFlow') || child.name.startsWith('el-drawer') || child.name.startsWith('el-dialog'))) {
    child.remove();
  }
}

const C = {
  canvas: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#F1F5F9',
  primary: '#2563EB',
  primarySoft: '#EFF6FF',
  primaryBorder: '#BFDBFE',
  primaryDark: '#1E40AF',
  success: '#16A34A',
  successText: '#047857',
  successSoft: '#ECFDF5',
  successBorder: '#A7F3D0',
  warning: '#D97706',
  warningText: '#B45309',
  warningSoft: '#FFFBEB',
  warningBorder: '#FDE68A',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FECACA',
  text: '#0F172A',
  textSec: '#475569',
  textMuted: '#64748B',
};

function makeBoard(parent, name, x, y, w, h, fill, radius = 0, strokeColor = null) {
  const b = penpot.createBoard();
  b.name = name;
  b.resize(w, h);
  if (fill) {
    b.fills = [{ fillColor: fill, fillOpacity: 1 }];
  } else {
    b.fills = [];
  }
  if (radius > 0) b.borderRadius = radius;
  if (strokeColor) {
    b.strokes = [{ strokeColor, strokeWidth: 1, strokeOpacity: 1, strokeAlignment: 'inner' }];
  }
  parent.appendChild(b);
  penpotUtils.setParentXY(b, x, y);
  return b;
}

function makeRect(parent, name, x, y, w, h, fill, radius = 6, strokeColor = null) {
  const r = penpot.createRectangle();
  r.name = name;
  r.resize(w, h);
  r.fills = [{ fillColor: fill, fillOpacity: 1 }];
  if (radius > 0) r.borderRadius = radius;
  if (strokeColor) {
    r.strokes = [{ strokeColor, strokeWidth: 1, strokeOpacity: 1, strokeAlignment: 'inner' }];
  }
  parent.appendChild(r);
  penpotUtils.setParentXY(r, x, y);
  return r;
}

function makeText(parent, name, content, x, y, w, h, size = 14, weight = '400', color = C.text) {
  const t = penpot.createText(String(content || ' '));
  if (!t) return null;
  t.name = name;
  t.resize(w, h);
  t.fontSize = String(size);
  t.fontWeight = String(weight === '500' ? '400' : weight);
  t.fills = [{ fillColor: color, fillOpacity: 1 }];
  parent.appendChild(t);
  penpotUtils.setParentXY(t, x, y);
  return t;
}

// =========================================================================
// 1. MAIN DESKTOP ARTBOARD (1440 x 1180 — matches examples/ledgerflow.html)
// =========================================================================
const app = makeBoard(page.root, 'LedgerFlow / App Shell', 0, 0, 1440, 1180, C.canvas, 16, C.border);

// 1A. Top Navbar (<el-navbar>)
const navbar = makeBoard(app, 'el-navbar | brand="⚡ LedgerFlow" badge="Finance" sticky="true"', 0, 0, 1440, 64, C.white, 0, C.border);
makeText(navbar, 'BrandIcon', '⚡', 32, 20, 22, 24, 16, '700', C.warning);
makeText(navbar, 'BrandTitle', 'LedgerFlow', 54, 20, 116, 24, 17, '700', C.text);
const navBadge = makeBoard(navbar, 'el-badge | variant="primary" label="Finance"', 162, 21, 66, 22, C.primary, 11);
makeText(navBadge, 'BadgeText', 'Finance', 11, 4, 48, 15, 11, '700', C.white);

const navLinks = [
  { label: 'Home', x: 392, w: 50, active: false },
  { label: 'Docs', x: 462, w: 46, active: false },
  { label: 'Catalog', x: 526, w: 62, active: false },
  { label: 'Registry', x: 608, w: 64, active: false },
  { label: 'AI Studio', x: 690, w: 68, active: false },
  { label: 'LedgerFlow', x: 774, w: 96, active: true },
  { label: 'Showcase', x: 888, w: 72, active: false },
];
navLinks.forEach((lnk) => {
  if (lnk.active) {
    const pill = makeBoard(navbar, 'NavActivePill', lnk.x, 16, lnk.w, 32, C.primarySoft, 8);
    makeText(pill, 'NavLink_' + lnk.label, lnk.label, 12, 7, lnk.w - 20, 18, 13, '600', C.primary);
  } else {
    makeText(navbar, 'NavLink_' + lnk.label, lnk.label, lnk.x, 23, lnk.w, 18, 13, '600', C.textSec);
  }
});

const themeBtn = makeBoard(navbar, 'el-theme-switch | label="Light"', 1168, 16, 86, 32, C.muted, 16, C.border);
makeText(themeBtn, 'ThemeText', '☀ Light', 15, 8, 60, 16, 12, '600', C.textSec);

const addBtn = makeBoard(navbar, 'el-button | variant="primary" label="+ Add Expense" action="open-add-dialog"', 1268, 16, 132, 32, C.primary, 8);
makeText(addBtn, 'AddBtnText', '+ Add Expense', 19, 7, 100, 18, 13, '600', C.white);

// 1B. Page Header & Period Filter
makeText(app, 'PageHeading', 'Monthly Cashflow & Expenses', 40, 92, 520, 34, 28, '700', C.text);
makeText(app, 'PageSubtitle', 'Real-time treasury overview synced from Penpot MCP into Elementum Web Components.', 40, 130, 680, 20, 14, '400', C.textSec);

const seg = makeBoard(app, 'el-segmented-control | options="All,Income,Expenses" value="All"', 1138, 102, 262, 38, C.muted, 10, C.border);
makeRect(seg, 'SegActive', 4, 4, 64, 30, C.white, 7, C.border);
makeText(seg, 'SegOpt1', 'All', 26, 10, 24, 18, 13, '700', C.primary);
makeText(seg, 'SegOpt2', 'Income', 90, 10, 56, 18, 13, '600', C.textSec);
makeText(seg, 'SegOpt3', 'Expenses', 174, 10, 74, 18, 13, '600', C.textSec);

// 1C. Callout Banner (<el-callout variant="info">)
const callout = makeBoard(app, 'el-callout | variant="info" title="Generated from Penpot via MCP"', 40, 174, 1360, 82, C.primarySoft, 10, C.primaryBorder);
makeText(callout, 'CalloutIcon', 'ℹ', 20, 18, 18, 18, 14, '700', C.primary);
makeText(callout, 'CalloutTitle', 'Generated from Penpot via MCP', 46, 16, 360, 20, 14, '700', C.primaryDark);
makeText(callout, 'CalloutBody', 'This live app was extracted from Penpot page LedgerFlow App via tools/penpot-to-elementum.js using 15 validated Elementum Web Components (View original Penpot design ↗). Click any row to inspect in <el-drawer> or add a live expense via <el-dialog>.', 46, 40, 1280, 32, 13, '400', C.primaryDark);

// 1D. 4 KPI Cards (<el-card> + <el-number-flow> + <el-badge>)
const kpis = [
  { key: 'balance', title: 'Total Balance', value: '48290', prefix: '$', delta: '+12.4%', variant: 'success', bg: C.successSoft, stroke: C.successBorder, fg: C.successText },
  { key: 'spend', title: 'Monthly Spend', value: '6420', prefix: '$', delta: '-4.2%', variant: 'primary', bg: C.primary, stroke: null, fg: C.white },
  { key: 'budget', title: 'Budget Utilization', value: '64', suffix: '%', delta: 'On Track', variant: 'warning', bg: C.warningSoft, stroke: C.warningBorder, fg: C.warningText },
  { key: 'savings', title: 'Net Cashflow', value: '14850', prefix: '$', delta: '+18.9%', variant: 'success', bg: C.successSoft, stroke: C.successBorder, fg: C.successText },
];

kpis.forEach((k, idx) => {
  const x = 40 + idx * 344;
  const card = makeBoard(app, 'el-card | section="kpi" kpi="' + k.key + '" title="' + k.title + '"', x, 280, 324, 136, C.white, 12, C.border);
  makeText(card, 'KpiLabel', k.title, 20, 20, 180, 18, 13, '600', C.textSec);
  const badge = makeBoard(card, 'el-badge | variant="' + k.variant + '" label="' + k.delta + '"', 228, 18, 76, 22, k.bg, 11, k.stroke);
  makeText(badge, 'KpiDelta', k.delta, 13, 4, 54, 15, 11, '700', k.fg);
  const displayVal = (k.prefix || '') + String(k.value) + (k.suffix || '');
  makeText(card, 'el-number-flow | value="' + k.value + '" prefix="' + (k.prefix || '') + '" suffix="' + (k.suffix || '') + '"', displayVal, 20, 52, 260, 40, 30, '700', C.text);
  makeText(card, 'KpiCaption', 'vs. previous 30 days', 20, 102, 200, 16, 12, '400', C.textMuted);
});

// 1E. Middle Row: Smooth Area Chart (left) + Department Budget Meters (right)
const chartCard = makeBoard(app, 'el-card | section="chart" title="6-Month Spend vs Budget"', 40, 440, 860, 296, C.white, 12, C.border);
makeText(chartCard, 'ChartTitle', '6-Month Spend vs Budget', 24, 22, 280, 24, 18, '700', C.text);
makeText(chartCard, 'ChartSub', 'Interactive SVG visualization powered by <el-chart>', 24, 50, 420, 18, 13, '400', C.textMuted);
const chartCanvas = makeBoard(chartCard, 'el-chart | type="area" height="220" show-grid="true" show-dots="true"', 24, 84, 812, 192, C.white, 8);

const yTicks = [
  { label: '7580', y: 12 },
  { label: '5053', y: 61 },
  { label: '2527', y: 110 },
  { label: '0', y: 158 },
];
yTicks.forEach((t, idx) => {
  makeText(chartCanvas, 'YTick_' + idx, t.label, 4, t.y - 6, 36, 14, 11, '400', C.textMuted);
  makeRect(chartCanvas, 'Grid_' + idx, 48, t.y, 744, 1, '#E2E8F0', 0);
});

// Smooth SVG area + line curve matching <el-chart type="area" curve="smooth">
const chartSvg = \`<svg xmlns="http://www.w3.org/2000/svg" width="812" height="192" viewBox="0 0 812 192">
  <defs>
    <linearGradient id="lfArea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2563EB" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#2563EB" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  <path d="M 48 63 C 98 57, 147 46, 197 46 C 247 46, 296 54, 346 54 C 396 54, 445 25, 494 25 C 544 25, 593 40, 643 40 C 693 40, 742 34, 792 34 L 792 158 L 48 158 Z" fill="url(#lfArea)"/>
  <path d="M 48 63 C 98 57, 147 46, 197 46 C 247 46, 296 54, 346 54 C 396 54, 445 25, 494 25 C 544 25, 593 40, 643 40 C 693 40, 742 34, 792 34" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>\`;
try {
  const vec = penpot.createShapeFromSvg(chartSvg);
  if (vec) {
    vec.name = 'SpendAreaCurve';
    chartCanvas.appendChild(vec);
    penpotUtils.setParentXY(vec, 0, 0);
  }
} catch {}

const xPoints = [
  { m: 'Jun', x: 48, y: 63 },
  { m: 'Jul', x: 197, y: 46 },
  { m: 'Aug', x: 346, y: 54 },
  { m: 'Sep', x: 494, y: 25 },
  { m: 'Oct', x: 643, y: 40 },
  { m: 'Nov', x: 792, y: 34 },
];
xPoints.forEach((pt) => {
  const dot = penpot.createEllipse();
  dot.name = 'Dot_' + pt.m;
  dot.resize(10, 10);
  dot.fills = [{ fillColor: C.white, fillOpacity: 1 }];
  dot.strokes = [{ strokeColor: C.primary, strokeWidth: 2.5, strokeOpacity: 1, strokeAlignment: 'center' }];
  chartCanvas.appendChild(dot);
  penpotUtils.setParentXY(dot, pt.x - 5, pt.y - 5);
  makeText(chartCanvas, 'Label_' + pt.m, pt.m, Math.min(780, pt.x - 10), 170, 32, 16, 11, '400', C.textMuted);
});

const budgetCard = makeBoard(app, 'el-card | section="budgets" title="Department Budgets"', 924, 440, 476, 296, C.white, 12, C.border);
makeText(budgetCard, 'BudgetTitle', 'Department Budgets', 24, 22, 240, 24, 18, '700', C.text);
makeText(budgetCard, 'BudgetSub', 'Semantic threshold tracking via <el-meter>', 24, 50, 320, 18, 13, '400', C.textMuted);

const budgets = [
  { name: 'Cloud & Infrastructure', pct: 78, color: C.warning },
  { name: 'Product & Design Tools', pct: 46, color: C.success },
  { name: 'Marketing & Growth', pct: 88, color: C.danger },
  { name: 'Travel & Operations', pct: 31, color: C.success },
];
budgets.forEach((b, idx) => {
  const by = 92 + idx * 48;
  makeText(budgetCard, 'BudgetName_' + idx, b.name, 24, by, 240, 18, 13, '600', C.text);
  makeText(budgetCard, 'BudgetPct_' + idx, b.pct + '%', 418, by, 34, 18, 13, '600', C.textSec);
  const track = makeBoard(budgetCard, 'el-meter | label="' + b.name + '" value="' + b.pct + '" max="100"', 24, by + 23, 428, 10, C.muted, 5);
  makeRect(track, 'Fill', 0, 0, Math.round(428 * (b.pct / 100)), 10, b.color, 5);
});

// 1F. Bottom Row: Filterable Transactions Table (<el-card> + <el-input> + <el-table>)
const txCard = makeBoard(app, 'el-card | section="transactions" title="Recent Transactions"', 40, 760, 1360, 386, C.white, 12, C.border);
makeText(txCard, 'TxTitle', 'Recent Transactions', 24, 22, 260, 24, 18, '700', C.text);
makeText(txCard, 'TxSub', 'Click any transaction row to inspect details in <el-drawer>', 24, 48, 420, 18, 13, '400', C.textMuted);

const searchInput = makeBoard(txCard, 'el-input | name="search" placeholder="Search merchant or category..."', 24, 80, 340, 36, C.white, 8, C.border);
makeText(searchInput, 'SearchPlaceholder', 'Search merchant or category...', 12, 9, 260, 18, 13, '400', C.textMuted);
makeText(txCard, 'TxCompLabel', 'Components:', 1118, 89, 86, 18, 12, '400', C.textMuted);
const compBadge = makeBoard(txCard, 'el-badge | label="15 Elementum Tags"', 1204, 86, 132, 24, C.muted, 12, C.border);
makeText(compBadge, 'CompBadgeTxt', '15 Elementum Tags', 14, 5, 110, 15, 11, '600', C.text);

const tableBoard = makeBoard(txCard, 'el-table | hover="true" striped="true" selectable="true"', 24, 134, 1312, 228, C.white, 8, C.border);
const headerRow = makeBoard(tableBoard, 'TableHeader', 0, 0, 1312, 38, C.canvas, 0, C.border);
makeText(headerRow, 'ColMerchant', 'MERCHANT', 20, 11, 240, 16, 11, '700', C.textMuted);
makeText(headerRow, 'ColCategory', 'CATEGORY', 360, 11, 200, 16, 11, '700', C.textMuted);
makeText(headerRow, 'ColDate', 'DATE', 640, 11, 140, 16, 11, '700', C.textMuted);
makeText(headerRow, 'ColStatus', 'STATUS', 860, 11, 120, 16, 11, '700', C.textMuted);
makeText(headerRow, 'ColAmount', 'AMOUNT', 1140, 11, 140, 16, 11, '700', C.textMuted);

const rows = [
  { merchant: 'Cloudflare Enterprise', category: 'Cloud & Infrastructure', date: '2026-11-18', status: 'Cleared', amount: '-$1,240.00', bg: C.successSoft, stroke: C.successBorder, fg: C.successText },
  { merchant: 'Stripe Payout #4821', category: 'Revenue', date: '2026-11-17', status: 'Cleared', amount: '+$8,450.00', bg: C.successSoft, stroke: C.successBorder, fg: C.successText },
  { merchant: 'Penpot Cloud Team', category: 'Product & Design Tools', date: '2026-11-16', status: 'Cleared', amount: '-$180.00', bg: C.successSoft, stroke: C.successBorder, fg: C.successText },
  { merchant: 'Linear Workspace', category: 'Product & Design Tools', date: '2026-11-15', status: 'Pending', amount: '-$240.00', bg: C.warningSoft, stroke: C.warningBorder, fg: C.warningText },
  { merchant: 'Delta Air Lines', category: 'Travel & Operations', date: '2026-11-14', status: 'Flagged', amount: '-$620.00', bg: C.dangerSoft, stroke: C.dangerBorder, fg: C.danger },
];
rows.forEach((row, idx) => {
  const ry = 38 + idx * 38;
  const rBoard = makeBoard(tableBoard, 'TxRow_' + idx, 0, ry, 1312, 38, C.white, 0, C.border);
  makeText(rBoard, 'Merchant', row.merchant, 20, 10, 300, 18, 13, '600', C.text);
  makeText(rBoard, 'Category', row.category, 360, 10, 240, 18, 13, '400', C.textSec);
  makeText(rBoard, 'Date', row.date, 640, 10, 140, 18, 13, '400', C.textMuted);
  const stBadge = makeBoard(rBoard, 'el-badge | label="' + row.status + '"', 860, 8, 74, 22, row.bg, 11, row.stroke);
  makeText(stBadge, 'StText', row.status, 14, 4, 52, 14, 11, '600', row.fg);
  makeText(rBoard, 'Amount', row.amount, 1140, 10, 140, 18, 13, '700', row.amount.startsWith('+') ? C.success : C.text);
});

// =========================================================================
// 2. OVERLAY COMPANION ARTBOARDS (Non-overlapping to the right of App Shell)
// =========================================================================
const drawer = makeBoard(page.root, 'el-drawer | placement="right" heading="Transaction Details"', 1500, 0, 400, 520, C.white, 14, C.border);
makeText(drawer, 'DrawerTitle', 'Transaction Details', 24, 24, 260, 24, 18, '700', C.text);
makeText(drawer, 'DrawerSub', 'Slide-over inspector (<el-drawer>)', 24, 52, 300, 18, 12, '400', C.textMuted);
makeRect(drawer, 'DrawerDivider', 24, 82, 352, 1, C.border, 0);
makeText(drawer, 'DrawerMerchant', 'Cloudflare Enterprise', 24, 104, 300, 24, 16, '700', C.text);
makeText(drawer, 'DrawerAmount', '-$1,240.00', 24, 134, 200, 32, 24, '700', C.text);
makeRect(drawer, 'DrawerMetaBox', 24, 186, 352, 180, C.canvas, 10, C.border);
makeText(drawer, 'DrawerMeta', 'Category: Cloud & Infrastructure\\nStatus: Cleared\\nPayment: Corporate Visa •••• 4242\\nReceipt: Verified PDF', 40, 206, 320, 140, 13, '400', C.textSec);
const drawerBtn = makeBoard(drawer, 'el-button | variant="secondary" label="Download Receipt"', 24, 452, 352, 40, C.muted, 8, C.border);
makeText(drawerBtn, 'DrawerBtnTxt', 'Download Receipt', 112, 11, 140, 18, 13, '600', C.text);

const dialog = makeBoard(page.root, 'el-dialog | heading="Add New Expense"', 1500, 560, 440, 420, C.white, 14, C.border);
makeText(dialog, 'DialogTitle', 'Add New Expense', 24, 24, 260, 24, 18, '700', C.text);
makeText(dialog, 'DialogSub', 'Native FACE form modal (<el-dialog>)', 24, 52, 300, 18, 12, '400', C.textMuted);
makeBoard(dialog, 'el-input | name="merchant" label="Merchant" placeholder="e.g. Figma, Cloudflare"', 24, 92, 392, 42, C.canvas, 8, C.border);
makeBoard(dialog, 'el-input | name="amount" type="number" label="Amount (USD)" placeholder="250"', 24, 154, 392, 42, C.canvas, 8, C.border);
makeBoard(dialog, 'el-select | name="category" label="Category" value="Cloud & Infrastructure"', 24, 216, 392, 42, C.canvas, 8, C.border);
makeBoard(dialog, 'el-select | name="type" label="Entry Type" value="expense"', 24, 278, 392, 42, C.canvas, 8, C.border);
const dlgCancel = makeBoard(dialog, 'el-button | variant="secondary" label="Cancel"', 190, 352, 100, 38, C.muted, 8, C.border);
makeText(dlgCancel, 'CancelTxt', 'Cancel', 28, 10, 50, 18, 13, '600', C.text);
const dlgSubmit = makeBoard(dialog, 'el-button | variant="primary" type="submit" label="Save Entry"', 302, 352, 114, 38, C.primary, 8);
makeText(dlgSubmit, 'SubmitTxt', 'Save Entry', 22, 10, 76, 18, 13, '600', C.white);

await penpot.waitForLayoutUpdate();

return {
  file: penpot.currentFile.name,
  page: page.name,
  pageId: page.id,
  appShellId: app.id,
  drawerId: drawer.id,
  dialogId: dialog.id,
  rootBoards: page.root.children.length,
};
`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const script = buildLedgerFlowPenpotScript(opts.page);

  if (opts.dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          page: opts.page,
          scriptBytes: Buffer.byteLength(script, 'utf8'),
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
  console.log(`Connected to Penpot MCP. Designing "${opts.page}"...`);
  const result = await client.executeCode(script);
  console.log('Design result:', result);
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isDirectRun) {
  main().catch((err) => {
    console.error('LedgerFlow Penpot design failed:', err.message);
    process.exit(1);
  });
}
