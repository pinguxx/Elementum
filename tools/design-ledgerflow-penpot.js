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
  primarySoft: '#DBEAFE',
  success: '#10B981',
  successSoft: '#D1FAE5',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  text: '#0F172A',
  textSec: '#475569',
  textMuted: '#64748B',
};

function makeBoard(parent, name, x, y, w, h, fill, radius = 0, strokeColor = null) {
  const b = penpot.createBoard();
  b.name = name;
  b.resize(w, h);
  b.fills = [{ fillColor: fill, fillOpacity: 1 }];
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
// 1. MAIN DESKTOP ARTBOARD (1440 x 980)
// =========================================================================
const app = makeBoard(page.root, 'LedgerFlow / App Shell', 0, 0, 1440, 980, C.canvas, 16, C.border);

// 1A. Top Navbar (<el-navbar>)
const navbar = makeBoard(app, 'el-navbar | brand="LedgerFlow" badge="Finance" sticky="true"', 0, 0, 1440, 68, C.white, 0, C.border);
makeRect(navbar, 'BrandIcon', 32, 20, 28, 28, C.primary, 8);
makeText(navbar, 'BrandMark', 'L', 41, 24, 16, 20, 15, '700', C.white);
makeText(navbar, 'BrandTitle', 'LedgerFlow', 70, 22, 130, 24, 18, '700', C.text);
const navBadge = makeBoard(navbar, 'el-badge | variant="primary" label="Finance"', 186, 23, 68, 22, C.primarySoft, 11);
makeText(navBadge, 'BadgeText', 'Finance', 12, 3, 50, 16, 11, '600', C.primary);

makeText(navbar, 'NavLinkOverview', 'Overview', 310, 24, 72, 20, 13, '600', C.primary);
makeText(navbar, 'NavLinkTx', 'Transactions', 402, 24, 92, 20, 13, '500', C.textSec);
makeText(navbar, 'NavLinkBudgets', 'Budgets', 514, 24, 72, 20, 13, '500', C.textSec);
makeText(navbar, 'NavLinkReports', 'Reports', 600, 24, 72, 20, 13, '500', C.textSec);

const themeBtn = makeBoard(navbar, 'el-theme-switch | label="Theme"', 1168, 18, 86, 32, C.muted, 8, C.border);
makeText(themeBtn, 'ThemeText', 'Light / Dark', 12, 8, 66, 16, 11, '600', C.textSec);

const addBtn = makeBoard(navbar, 'el-button | variant="primary" label="+ Add Expense" action="open-add-dialog"', 1268, 16, 140, 36, C.primary, 8);
makeText(addBtn, 'AddBtnText', '+ Add Expense', 22, 9, 100, 18, 13, '600', C.white);

// 1B. Page Header & Period Filter
makeText(app, 'PageHeading', 'Monthly Cashflow & Expenses', 40, 96, 460, 34, 26, '700', C.text);
makeText(app, 'PageSubtitle', 'Real-time treasury overview synced from Penpot MCP into Elementum Web Components.', 40, 132, 640, 20, 14, '400', C.textSec);

const seg = makeBoard(app, 'el-segmented-control | options="All,Income,Expenses" value="All"', 1100, 104, 300, 38, C.muted, 10, C.border);
const segActive = makeRect(seg, 'SegActive', 4, 4, 94, 30, C.white, 7, C.border);
makeText(seg, 'SegOpt1', 'All', 42, 10, 30, 18, 13, '600', C.text);
makeText(seg, 'SegOpt2', 'Income', 126, 10, 60, 18, 13, '500', C.textSec);
makeText(seg, 'SegOpt3', 'Expenses', 218, 10, 70, 18, 13, '500', C.textSec);

// 1C. 4 KPI Cards (<el-card> + <el-number-flow> + <el-badge>)
const kpis = [
  { key: 'balance', title: 'Total Balance', value: '48290', prefix: '$', delta: '+12.4%', variant: 'success', bg: C.successSoft, fg: C.success },
  { key: 'spend', title: 'Monthly Spend', value: '6420', prefix: '$', delta: '-4.2%', variant: 'primary', bg: C.primarySoft, fg: C.primary },
  { key: 'budget', title: 'Budget Utilization', value: '64', suffix: '%', delta: 'On Track', variant: 'warning', bg: C.warningSoft, fg: C.warning },
  { key: 'savings', title: 'Net Cashflow', value: '14850', prefix: '$', delta: '+18.9%', variant: 'success', bg: C.successSoft, fg: C.success },
];

kpis.forEach((k, idx) => {
  const x = 40 + idx * 344;
  const card = makeBoard(app, 'el-card | section="kpi" kpi="' + k.key + '" title="' + k.title + '"', x, 176, 324, 126, C.white, 12, C.border);
  makeText(card, 'KpiLabel', k.title, 20, 18, 180, 18, 13, '600', C.textSec);
  const badge = makeBoard(card, 'el-badge | variant="' + k.variant + '" label="' + k.delta + '"', 232, 16, 72, 22, k.bg, 11);
  makeText(badge, 'KpiDelta', k.delta, 12, 3, 54, 16, 11, '600', k.fg);
  const displayVal = (k.prefix || '') + Number(k.value).toLocaleString('en-US') + (k.suffix || '');
  makeText(card, 'el-number-flow | value="' + k.value + '" prefix="' + (k.prefix || '') + '" suffix="' + (k.suffix || '') + '"', displayVal, 20, 50, 260, 40, 30, '700', C.text);
  makeText(card, 'KpiCaption', 'vs. previous 30 days', 20, 96, 200, 16, 12, '400', C.textMuted);
});

// 1D. Middle Row: Spending Chart (left) + Budget Meters (right)
const chartCard = makeBoard(app, 'el-card | section="chart" title="6-Month Spend vs Budget"', 40, 326, 860, 286, C.white, 12, C.border);
makeText(chartCard, 'ChartTitle', '6-Month Spend vs Budget', 24, 20, 280, 24, 16, '700', C.text);
makeText(chartCard, 'ChartSub', 'Live SVG visualization rendered by <el-chart type="area">', 24, 44, 420, 18, 12, '400', C.textMuted);
const chartCanvas = makeBoard(chartCard, 'el-chart | type="area" height="190" show-grid="true" show-dots="true"', 24, 76, 812, 190, C.canvas, 8, C.border);
const months = [
  { m: 'Jun', h: 78 },
  { m: 'Jul', h: 102 },
  { m: 'Aug', h: 92 },
  { m: 'Sep', h: 126 },
  { m: 'Oct', h: 112 },
  { m: 'Nov', h: 142 },
];
months.forEach((pt, idx) => {
  const bx = 46 + idx * 128;
  makeRect(chartCanvas, 'Bar_' + pt.m, bx, 160 - pt.h, 58, pt.h, idx === 5 ? C.primary : '#93C5FD', 6);
  makeText(chartCanvas, 'Label_' + pt.m, pt.m, bx + 16, 166, 36, 16, 11, '600', C.textMuted);
});

const budgetCard = makeBoard(app, 'el-card | section="budgets" title="Department Budgets"', 924, 326, 476, 286, C.white, 12, C.border);
makeText(budgetCard, 'BudgetTitle', 'Department Budgets', 24, 20, 240, 24, 16, '700', C.text);
makeText(budgetCard, 'BudgetSub', 'Category thresholds via <el-meter>', 24, 44, 280, 18, 12, '400', C.textMuted);

const budgets = [
  { name: 'Cloud & Infrastructure', pct: 78, spent: '$3,120 / $4,000', color: C.primary },
  { name: 'Product & Design Tools', pct: 46, spent: '$920 / $2,000', color: C.success },
  { name: 'Marketing & Growth', pct: 88, spent: '$1,760 / $2,000', color: C.warning },
  { name: 'Travel & Operations', pct: 31, spent: '$620 / $2,000', color: C.success },
];
budgets.forEach((b, idx) => {
  const by = 82 + idx * 48;
  makeText(budgetCard, 'BudgetName_' + idx, b.name, 24, by, 230, 18, 13, '600', C.text);
  makeText(budgetCard, 'BudgetVal_' + idx, b.spent, 320, by, 132, 18, 12, '500', C.textSec);
  const track = makeBoard(budgetCard, 'el-meter | label="' + b.name + '" value="' + b.pct + '" max="100"', 24, by + 22, 428, 10, C.muted, 5);
  makeRect(track, 'Fill', 0, 0, Math.round(428 * (b.pct / 100)), 10, b.color, 5);
});

// 1E. Bottom Row: Filterable Transactions Table (<el-table>)
const txCard = makeBoard(app, 'el-card | section="transactions" title="Recent Transactions"', 40, 636, 1360, 312, C.white, 12, C.border);
makeText(txCard, 'TxTitle', 'Recent Transactions', 24, 20, 240, 24, 16, '700', C.text);
const searchInput = makeBoard(txCard, 'el-input | name="search" placeholder="Search merchant or category..."', 1020, 16, 316, 36, C.canvas, 8, C.border);
makeText(searchInput, 'SearchPlaceholder', 'Search merchant or category...', 12, 9, 260, 18, 13, '400', C.textMuted);

const tableBoard = makeBoard(txCard, 'el-table | hover="true" striped="true" selectable="true"', 24, 68, 1312, 224, C.white, 8, C.border);
const headerRow = makeBoard(tableBoard, 'TableHeader', 0, 0, 1312, 38, C.muted, 0, C.border);
makeText(headerRow, 'ColMerchant', 'MERCHANT', 20, 11, 240, 16, 11, '700', C.textMuted);
makeText(headerRow, 'ColCategory', 'CATEGORY', 360, 11, 200, 16, 11, '700', C.textMuted);
makeText(headerRow, 'ColDate', 'DATE', 640, 11, 140, 16, 11, '700', C.textMuted);
makeText(headerRow, 'ColStatus', 'STATUS', 860, 11, 120, 16, 11, '700', C.textMuted);
makeText(headerRow, 'ColAmount', 'AMOUNT', 1120, 11, 160, 16, 11, '700', C.textMuted);

const rows = [
  { merchant: 'Cloudflare Enterprise', category: 'Cloud & Infrastructure', date: '2026-11-18', status: 'Cleared', amount: '-$1,240.00', bg: C.successSoft, fg: C.success },
  { merchant: 'Stripe Payout #4821', category: 'Revenue', date: '2026-11-17', status: 'Cleared', amount: '+$8,450.00', bg: C.successSoft, fg: C.success },
  { merchant: 'Penpot Cloud Team', category: 'Product & Design Tools', date: '2026-11-16', status: 'Cleared', amount: '-$180.00', bg: C.successSoft, fg: C.success },
  { merchant: 'Linear Workspace', category: 'Product & Design Tools', date: '2026-11-15', status: 'Pending', amount: '-$240.00', bg: C.warningSoft, fg: C.warning },
  { merchant: 'Delta Air Lines', category: 'Travel & Operations', date: '2026-11-14', status: 'Flagged', amount: '-$620.00', bg: C.dangerSoft, fg: C.danger },
];
rows.forEach((row, idx) => {
  const ry = 38 + idx * 37;
  const rBoard = makeBoard(tableBoard, 'TxRow_' + idx, 0, ry, 1312, 37, idx % 2 === 1 ? C.canvas : C.white, 0, C.border);
  makeText(rBoard, 'Merchant', row.merchant, 20, 10, 300, 18, 13, '600', C.text);
  makeText(rBoard, 'Category', row.category, 360, 10, 240, 18, 13, '400', C.textSec);
  makeText(rBoard, 'Date', row.date, 640, 10, 140, 18, 13, '400', C.textMuted);
  const stBadge = makeBoard(rBoard, 'el-badge | label="' + row.status + '"', 860, 8, 76, 21, row.bg, 10);
  makeText(stBadge, 'StText', row.status, 12, 3, 56, 15, 11, '600', row.fg);
  makeText(rBoard, 'Amount', row.amount, 1120, 10, 160, 18, 13, '700', row.amount.startsWith('+') ? C.success : C.text);
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
makeBoard(dialog, 'el-input | name="merchant" label="Merchant" placeholder="e.g. Figma, AWS"', 24, 92, 392, 42, C.canvas, 8, C.border);
makeBoard(dialog, 'el-input | name="amount" type="number" label="Amount (USD)" placeholder="0.00"', 24, 154, 392, 42, C.canvas, 8, C.border);
makeBoard(dialog, 'el-select | name="category" label="Category"', 24, 216, 392, 42, C.canvas, 8, C.border);
makeBoard(dialog, 'el-select | name="type" label="Type"', 24, 278, 392, 42, C.canvas, 8, C.border);
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
