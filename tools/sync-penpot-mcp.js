#!/usr/bin/env node
/**
 * Elementum -> Penpot Design System MCP Synchronizer (v2: Multi-Page + Full Variants)
 *
 * Connects to Penpot's hosted or local MCP stream (`execute_code`) to generate:
 *  - W3C DTCG token sets (`Elementum Core`, `Elementum Light`, `Elementum Dark`) & library colors
 *  - `00 · Foundations` visual palette & spacing/radius showcase page
 *  - 8 dedicated category pages (`01 · Actions & Buttons` .. `08 · AI & Specialist`)
 *  - Recognizable, anatomy-accurate Master Components for all 113 elements + full variant matrices
 *    (color/semantic variants, sizes, and interactive states) with generous spacing so Penpot's
 *    component labels never collide.
 *
 * Usage:
 *   node tools/sync-penpot-mcp.js --url "<PENPOT_MCP_URL>"
 *   PENPOT_MCP_URL="<PENPOT_MCP_URL>" npm run penpot:mcp
 *   node tools/sync-penpot-mcp.js --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, components } from '../examples/catalog-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const opts = {
    url: process.env.PENPOT_MCP_URL || '',
    token: process.env.PENPOT_MCP_TOKEN || '',
    dryRun: false,
    onlyCategory: '',
    skipTokens: false,
    fromIndex: 1,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--url' && argv[i + 1]) opts.url = argv[++i];
    else if (arg === '--token' && argv[i + 1]) opts.token = argv[++i];
    else if (arg === '--category' && argv[i + 1]) opts.onlyCategory = argv[++i];
    else if (arg === '--from' && argv[i + 1]) opts.fromIndex = Math.max(1, Number(argv[++i]) || 1);
    else if (arg === '--skip-tokens') opts.skipTokens = true;
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
    clientInfo: { name: 'elementum-penpot-sync', version: '0.8.7' },
  });
  await rpc('notifications/initialized', {}, true);

  return {
    async executeCode(code) {
      return await rpc('tools/call', { name: 'execute_code', arguments: { code } });
    },
  };
}

function loadTokensPalette() {
  const tokensPath = path.join(rootDir, 'tokens', 'penpot-tokens.json');
  const raw = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

  const normalizeHex = (v) => (typeof v === 'string' && v.startsWith('#') ? v.toUpperCase() : v);

  const flattenColors = (node, prefix = '') => {
    const out = {};
    for (const [k, v] of Object.entries(node || {})) {
      const nextKey = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && '$value' in v) {
        out[nextKey] = normalizeHex(v.$value);
      } else if (v && typeof v === 'object') {
        Object.assign(out, flattenColors(v, nextKey));
      }
    }
    return out;
  };

  const lightColors = flattenColors(raw.color);
  const darkColors = {
    'brand.warning': '#F59E0B',
    'brand.info': '#38BDF8',
    'brand.accent': '#A78BFA',
    'surface.base': '#0F172A',
    'surface.muted': '#1E293B',
    'surface.border': '#334155',
    'text.primary': '#F8FAFC',
    'text.secondary': '#94A3B8',
    'step.1': '#0B1120',
    'step.2': '#111827',
    'step.3': '#1E293B',
    'step.4': '#273449',
    'step.5': '#334155',
    'step.6': '#475569',
    'step.7': '#64748B',
    'step.8': '#94A3B8',
    'step.9': '#3B82F6',
    'step.10': '#60A5FA',
    'step.11': '#94A3B8',
    'step.12': '#F8FAFC',
  };

  const dimensions = {
    spacing: Object.fromEntries(
      Object.entries(raw.spacing || {}).map(([k, v]) => [`spacing.${k}`, v.$value])
    ),
    borderRadius: Object.fromEntries(
      Object.entries(raw.radius || {}).map(([k, v]) => [`radius.${k}`, v.$value])
    ),
  };

  return { lightColors, darkColors, dimensions };
}

export function buildTokensScript() {
  const { lightColors, darkColors, dimensions } = loadTokensPalette();
  const payload = JSON.stringify({ lightColors, darkColors, dimensions });

  return `
const data = ${payload};
const lib = penpot.library.local;
const catalog = lib.tokens;

function getOrCreateSet(name, active) {
  let set = catalog.sets.find(s => s.name === name);
  if (!set) set = catalog.addSet({ name });
  if (typeof active === 'boolean' && set.active !== active) {
    set.toggleActive();
  }
  return set;
}

function upsertToken(set, type, name, value) {
  if (set.tokens.some(t => t.name === name)) return 0;
  set.addToken({ type, name, value });
  return 1;
}

const coreSet = getOrCreateSet('Elementum Core', true);
const lightSet = getOrCreateSet('Elementum Light', true);
const darkSet = getOrCreateSet('Elementum Dark', false);

let tokensAdded = 0;
for (const [k, v] of Object.entries(data.dimensions.spacing)) {
  tokensAdded += upsertToken(coreSet, 'spacing', k, v);
}
for (const [k, v] of Object.entries(data.dimensions.borderRadius)) {
  tokensAdded += upsertToken(coreSet, 'borderRadius', k, v);
}
for (const [k, v] of Object.entries(data.lightColors)) {
  tokensAdded += upsertToken(lightSet, 'color', 'color.' + k, v);
}
for (const [k, v] of Object.entries(data.darkColors)) {
  tokensAdded += upsertToken(darkSet, 'color', 'color.' + k, v);
}

let colorsAdded = 0;
for (const [k, hex] of Object.entries(data.lightColors)) {
  const colorName = 'Elementum/' + k.replace(/\\./g, '/');
  if (!lib.colors.some(c => c.name === colorName)) {
    const lc = lib.createColor();
    lc.name = colorName;
    lc.color = hex;
    colorsAdded++;
  }
}

// Build "00 · Foundations" swatch page so designers can browse all colors & radii visually
let page = penpotUtils.getPageByName('00 · Foundations');
if (!page) {
  page = penpot.createPage();
  page.name = '00 · Foundations';
}
await penpot.openPage(page);
for (const ch of [...page.root.children]) ch.remove();

function mkBoard(parent, name, x, y, w, h, fill, radius = 10, stroke = '#E2E8F0') {
  const b = penpot.createBoard();
  b.name = name;
  b.resize(w, h);
  b.fills = [{ fillColor: fill, fillOpacity: 1 }];
  b.borderRadius = radius;
  if (stroke) b.strokes = [{ strokeColor: stroke, strokeWidth: 1, strokeOpacity: 1, strokeAlignment: 'inner' }];
  parent.appendChild(b);
  penpotUtils.setParentXY(b, x, y);
  return b;
}
function mkRect(parent, name, x, y, w, h, fill, radius = 6, stroke = null) {
  const r = penpot.createRectangle();
  r.name = name;
  r.resize(w, h);
  r.fills = [{ fillColor: fill, fillOpacity: 1 }];
  r.borderRadius = radius;
  if (stroke) r.strokes = [{ strokeColor: stroke, strokeWidth: 1, strokeOpacity: 1, strokeAlignment: 'inner' }];
  parent.appendChild(r);
  penpotUtils.setParentXY(r, x, y);
  return r;
}
function mkText(parent, name, txt, x, y, w, size, weight, color) {
  const t = penpot.createText(String(txt || ' '));
  if (!t) return null;
  t.name = name;
  t.resize(w, size + 8);
  t.fontSize = String(size);
  t.fontWeight = String(weight);
  t.fills = [{ fillColor: color, fillOpacity: 1 }];
  parent.appendChild(t);
  penpotUtils.setParentXY(t, x, y);
  return t;
}

const lightEntries = Object.entries(data.lightColors);
const lightBoard = mkBoard(page.root, 'Foundations / Light Mode Colors', 0, 0, 1280, Math.ceil(lightEntries.length / 6) * 108 + 90, '#FFFFFF', 14);
mkText(lightBoard, 'Heading', 'Elementum Light Palette (' + lightEntries.length + ' tokens)', 24, 20, 600, 20, '700', '#0F172A');
lightEntries.forEach(([k, hex], idx) => {
  const col = idx % 6;
  const row = Math.floor(idx / 6);
  const sx = 24 + col * 206;
  const sy = 64 + row * 104;
  mkRect(lightBoard, 'Swatch_' + k, sx, sy, 190, 56, hex, 8, '#CBD5E1');
  mkText(lightBoard, 'Name_' + k, k, sx, sy + 62, 190, 11, '600', '#0F172A');
  mkText(lightBoard, 'Hex_' + k, hex, sx, sy + 78, 190, 10, '400', '#64748B');
});

const darkEntries = Object.entries(data.darkColors);
const darkY = lightBoard.height + 56;
const darkBoard = mkBoard(page.root, 'Foundations / Dark Mode Overrides', 0, darkY, 1280, Math.ceil(darkEntries.length / 6) * 108 + 90, '#0F172A', 14, '#334155');
mkText(darkBoard, 'Heading', 'Elementum Dark Overrides (' + darkEntries.length + ' tokens)', 24, 20, 600, 20, '700', '#F8FAFC');
darkEntries.forEach(([k, hex], idx) => {
  const col = idx % 6;
  const row = Math.floor(idx / 6);
  const sx = 24 + col * 206;
  const sy = 64 + row * 104;
  mkRect(darkBoard, 'DarkSwatch_' + k, sx, sy, 190, 56, hex, 8, '#475569');
  mkText(darkBoard, 'DarkName_' + k, k, sx, sy + 62, 190, 11, '600', '#F8FAFC');
  mkText(darkBoard, 'DarkHex_' + k, hex, sx, sy + 78, 190, 10, '400', '#94A3B8');
});

await penpot.waitForLayoutUpdate();
return {
  file: penpot.currentFile?.name,
  page: page.name,
  tokensAdded,
  colorsAdded,
  totalLibraryColors: lib.colors.length
};
`;
}

/**
 * Expands a catalog component into 1 or more Penpot variant specs based on its
 * catalog-data.js select props (`variant`, `status`) and key interactive states.
 */
export function expandComponentVariants(comp) {
  const props = comp.props || [];
  const baseMeta = {
    tag: comp.tag,
    name: comp.name,
    propsCount: props.length,
    propPreview: props.slice(0, 4).map((p) => p.name).join(', ') || 'slotted',
  };

  if (comp.tag === 'el-button') {
    return [
      { ...baseMeta, variantKey: 'primary', variant: 'primary', size: 'md', disabled: false },
      { ...baseMeta, variantKey: 'secondary', variant: 'secondary', size: 'md', disabled: false },
      { ...baseMeta, variantKey: 'danger', variant: 'danger', size: 'md', disabled: false },
      { ...baseMeta, variantKey: 'ghost', variant: 'ghost', size: 'md', disabled: false },
      { ...baseMeta, variantKey: 'sm', variant: 'primary', size: 'sm', disabled: false },
      { ...baseMeta, variantKey: 'lg', variant: 'primary', size: 'lg', disabled: false },
      { ...baseMeta, variantKey: 'disabled', variant: 'primary', size: 'md', disabled: true },
    ];
  }

  if (comp.tag === 'el-switch' || comp.tag === 'el-checkbox' || comp.tag === 'el-radio') {
    return [
      { ...baseMeta, variantKey: 'unchecked', checked: false },
      { ...baseMeta, variantKey: 'checked', checked: true },
    ];
  }

  const variantProp = props.find((p) => p.type === 'select' && (p.name === 'variant' || p.name === 'status'));
  if (variantProp && Array.isArray(variantProp.options) && variantProp.options.length > 1) {
    return variantProp.options.map((opt) => ({
      ...baseMeta,
      variantKey: opt,
      variant: opt,
      status: opt,
    }));
  }

  return [{ ...baseMeta, variantKey: 'default', variant: 'primary', status: 'default' }];
}

export function buildCategoryComponentsScript(category, catIndex) {
  const catComponents = Object.values(components).filter((c) => c.category === category.id);
  const expanded = catComponents.flatMap((c) => expandComponentVariants(c));
  const pageNum = String(catIndex + 1).padStart(2, '0');
  const pageName = `${pageNum} · ${category.title}`;

  const payload = JSON.stringify({
    pageName,
    catTitle: category.title,
    catDesc: category.description,
    componentCount: catComponents.length,
    items: expanded,
  });

  return `
const cfg = ${payload};
const COLS = 3;
const CARD_W = 328;
const CARD_H = 152;
const GAP_X = 32;
const GAP_Y = 56;
const HEADER_H = 68;
const SECTION_W = COLS * CARD_W + (COLS - 1) * GAP_X;

let targetPage = penpotUtils.getPageByName(cfg.pageName);
if (!targetPage) {
  targetPage = penpot.createPage();
  targetPage.name = cfg.pageName;
}
await penpot.openPage(targetPage);

// Clean existing boards on this category page so re-runs stay spotless & idempotent
for (const ch of [...targetPage.root.children]) {
  ch.remove();
}

const PAL = {
  primary:   { bg: '#2563EB', soft: '#DBEAFE', fg: '#FFFFFF', text: '#1D4ED8', border: '#93C5FD' },
  secondary: { bg: '#F1F5F9', soft: '#F1F5F9', fg: '#0F172A', text: '#334155', border: '#CBD5E1' },
  success:   { bg: '#10B981', soft: '#D1FAE5', fg: '#FFFFFF', text: '#047857', border: '#6EE7B7' },
  warning:   { bg: '#F59E0B', soft: '#FEF3C7', fg: '#FFFFFF', text: '#B45309', border: '#FCD34D' },
  danger:    { bg: '#EF4444', soft: '#FEE2E2', fg: '#FFFFFF', text: '#B91C1C', border: '#FCA5A5' },
  error:     { bg: '#EF4444', soft: '#FEE2E2', fg: '#FFFFFF', text: '#B91C1C', border: '#FCA5A5' },
  rejected:  { bg: '#EF4444', soft: '#FEE2E2', fg: '#FFFFFF', text: '#B91C1C', border: '#FCA5A5' },
  info:      { bg: '#0EA5E9', soft: '#E0F2FE', fg: '#FFFFFF', text: '#0369A1', border: '#7DD3FC' },
  ghost:     { bg: '#FFFFFF', soft: '#F8FAFC', fg: '#0F172A', text: '#334155', border: '#E2E8F0' },
  outline:   { bg: '#FFFFFF', soft: '#FFFFFF', fg: '#0F172A', text: '#0F172A', border: '#94A3B8' },
  muted:     { bg: '#E2E8F0', soft: '#F1F5F9', fg: '#475569', text: '#475569', border: '#CBD5E1' },
  white:     { bg: '#0F172A', soft: '#1E293B', fg: '#FFFFFF', text: '#FFFFFF', border: '#334155' },
  default:   { bg: '#F1F5F9', soft: '#F1F5F9', fg: '#0F172A', text: '#334155', border: '#CBD5E1' },
  running:   { bg: '#2563EB', soft: '#DBEAFE', fg: '#FFFFFF', text: '#1D4ED8', border: '#93C5FD' },
  'awaiting-approval': { bg: '#F59E0B', soft: '#FEF3C7', fg: '#FFFFFF', text: '#B45309', border: '#FCD34D' },
  completed: { bg: '#10B981', soft: '#D1FAE5', fg: '#FFFFFF', text: '#047857', border: '#6EE7B7' },
  active:    { bg: '#2563EB', soft: '#DBEAFE', fg: '#FFFFFF', text: '#1D4ED8', border: '#93C5FD' },
  pending:   { bg: '#F59E0B', soft: '#FEF3C7', fg: '#FFFFFF', text: '#B45309', border: '#FCD34D' },
  online:    { bg: '#10B981', soft: '#D1FAE5', fg: '#FFFFFF', text: '#047857', border: '#6EE7B7' },
  offline:   { bg: '#94A3B8', soft: '#F1F5F9', fg: '#FFFFFF', text: '#475569', border: '#CBD5E1' },
  busy:      { bg: '#EF4444', soft: '#FEE2E2', fg: '#FFFFFF', text: '#B91C1C', border: '#FCA5A5' },
  away:      { bg: '#F59E0B', soft: '#FEF3C7', fg: '#FFFFFF', text: '#B45309', border: '#FCD34D' },
};

function palFor(key) {
  return PAL[key] || PAL.primary;
}

function addRect(parent, name, x, y, w, h, fillHex, radius = 6, strokeHex = null, opacity = 1) {
  const r = penpot.createRectangle();
  r.name = name;
  r.resize(Math.max(2, w), Math.max(2, h));
  r.fills = [{ fillColor: fillHex, fillOpacity: opacity }];
  r.borderRadius = radius;
  if (strokeHex) {
    r.strokes = [{ strokeColor: strokeHex, strokeWidth: 1, strokeOpacity: opacity, strokeAlignment: 'inner' }];
  }
  parent.appendChild(r);
  penpotUtils.setParentXY(r, x, y);
  return r;
}

function addText(parent, name, content, x, y, w, size, weight, colorHex, opacity = 1) {
  const safeText = String(content || '').trim() || name || 'Text';
  const t = penpot.createText(safeText);
  if (!t) return null;
  t.name = name;
  t.resize(Math.max(16, w), size + 8);
  t.fontSize = String(size);
  t.fontWeight = String(weight === '500' ? '400' : weight);
  t.fills = [{ fillColor: colorHex, fillOpacity: opacity }];
  parent.appendChild(t);
  penpotUtils.setParentXY(t, x, y);
  return t;
}

function drawPreview(board, item) {
  const tag = item.tag;
  const p = palFor(item.variant || item.status || 'primary');
  const px = 16;
  const py = 56;
  const pw = CARD_W - 32;

  // --- ACTIONS & BUTTONS ---
  if (tag === 'el-button') {
    const h = item.size === 'sm' ? 28 : item.size === 'lg' ? 42 : 34;
    const w = item.size === 'sm' ? 96 : item.size === 'lg' ? 142 : 118;
    const op = item.disabled ? 0.45 : 1;
    const stroke = item.variant === 'ghost' ? '#E2E8F0' : (item.variant === 'secondary' ? '#CBD5E1' : null);
    addRect(board, 'ButtonShape', px, py + (42 - h) / 2, w, h, p.bg, 8, stroke, op);
    addText(board, 'ButtonLabel', item.variantKey, px + 14, py + (42 - h) / 2 + Math.round((h - 16) / 2), w - 24, item.size === 'sm' ? 11 : 12, '600', p.fg, op);
    return;
  }
  if (tag === 'el-toggle' || tag === 'el-toggle-group') {
    addRect(board, 'Toggle1', px, py + 4, 88, 32, p.soft, 8, p.border);
    addText(board, 'Toggle1Txt', item.variantKey === 'default' ? 'Bold' : item.variantKey, px + 14, py + 12, 64, 11, '600', p.text);
    addRect(board, 'Toggle2', px + 96, py + 4, 72, 32, '#FFFFFF', 8, '#CBD5E1');
    addText(board, 'Toggle2Txt', 'Italic', px + 114, py + 12, 44, 11, '400', '#475569');
    return;
  }
  if (tag === 'el-segmented-control') {
    addRect(board, 'SegTrack', px, py + 4, pw, 36, '#F1F5F9', 9, '#E2E8F0');
    addRect(board, 'SegActive', px + 4, py + 8, 92, 28, '#FFFFFF', 6, '#CBD5E1');
    addText(board, 'Seg1', 'Day', px + 36, py + 14, 40, 11, '600', '#0F172A');
    addText(board, 'Seg2', 'Week', px + 128, py + 14, 48, 11, '400', '#64748B');
    addText(board, 'Seg3', 'Month', px + 218, py + 14, 54, 11, '400', '#64748B');
    return;
  }
  if (tag === 'el-toolbar') {
    addRect(board, 'ToolbarBg', px, py + 4, pw, 36, '#F8FAFC', 8, '#E2E8F0');
    ['B', 'I', 'U', 'Link', 'Code'].forEach((lbl, idx) => {
      const bx = px + 8 + idx * 54;
      addRect(board, 'Tool_' + idx, bx, py + 9, 46, 26, idx === 0 ? '#DBEAFE' : '#FFFFFF', 6, idx === 0 ? '#93C5FD' : '#E2E8F0');
      addText(board, 'ToolTxt_' + idx, lbl, bx + 10, py + 15, 34, 11, '600', idx === 0 ? '#1D4ED8' : '#334155');
    });
    return;
  }

  // --- NAVIGATION ---
  if (tag === 'el-navbar') {
    addRect(board, 'NavShell', px, py + 2, pw, 42, '#FFFFFF', 8, '#CBD5E1');
    addRect(board, 'BrandDot', px + 10, py + 13, 18, 18, '#2563EB', 5);
    addText(board, 'Brand', 'Elementum', px + 34, py + 14, 72, 11, '700', '#0F172A');
    addText(board, 'Links', 'Home   Docs   Catalog', px + 114, py + 15, 118, 10, '400', '#475569');
    addRect(board, 'NavCta', px + pw - 54, py + 10, 44, 24, '#2563EB', 6);
    addText(board, 'NavCtaTxt', 'Start', px + pw - 44, py + 15, 32, 10, '600', '#FFFFFF');
    return;
  }
  if (tag === 'el-tabs' || tag === 'el-tab') {
    addRect(board, 'TabsDivider', px, py + 34, pw, 2, '#E2E8F0', 1);
    addText(board, 'Tab1', 'Overview', px + 6, py + 10, 66, 12, '700', '#2563EB');
    addRect(board, 'TabUnderline', px + 4, py + 33, 62, 3, '#2563EB', 2);
    addText(board, 'Tab2', 'Analytics', px + 88, py + 10, 66, 12, '400', '#64748B');
    addText(board, 'Tab3', 'Settings', px + 172, py + 10, 66, 12, '400', '#64748B');
    return;
  }
  if (tag === 'el-breadcrumb' || tag === 'el-breadcrumb-item') {
    addText(board, 'Crumb1', 'Home', px + 2, py + 12, 42, 12, '400', '#64748B');
    addText(board, 'Sep1', '/', px + 48, py + 12, 14, 12, '400', '#94A3B8');
    addText(board, 'Crumb2', 'Components', px + 64, py + 12, 84, 12, '400', '#64748B');
    addText(board, 'Sep2', '/', px + 150, py + 12, 14, 12, '400', '#94A3B8');
    addText(board, 'Crumb3', 'Button', px + 166, py + 12, 72, 12, '700', '#0F172A');
    return;
  }
  if (tag === 'el-pagination') {
    const pages = ['<', '1', '2', '3', '...', '10', '>'];
    pages.forEach((lbl, idx) => {
      const bx = px + idx * 38;
      const active = lbl === '2';
      addRect(board, 'Pg_' + idx, bx, py + 6, 32, 32, active ? '#2563EB' : '#FFFFFF', 7, active ? '#2563EB' : '#CBD5E1');
      addText(board, 'PgTxt_' + idx, lbl, bx + 10, py + 14, 20, 11, active ? '700' : '400', active ? '#FFFFFF' : '#334155');
    });
    return;
  }
  if (tag === 'el-menubar' || tag === 'el-navigation-menu') {
    addRect(board, 'MenuShell', px, py + 4, pw, 36, '#F8FAFC', 8, '#E2E8F0');
    ['File', 'Edit', 'View', 'Window'].forEach((lbl, idx) => {
      const bx = px + 8 + idx * 66;
      const active = idx === 1;
      if (active) addRect(board, 'MenuActive', bx, py + 8, 56, 28, '#DBEAFE', 6);
      addText(board, 'Menu_' + idx, lbl, bx + 12, py + 14, 48, 11, active ? '600' : '400', active ? '#1D4ED8' : '#334155');
    });
    return;
  }
  if (tag.startsWith('el-sidebar')) {
    const bg = item.variant === 'floating' ? '#FFFFFF' : '#F8FAFC';
    addRect(board, 'Rail', px, py, 124, 54, bg, 8, '#CBD5E1');
    addRect(board, 'RailActive', px + 8, py + 8, 108, 18, '#DBEAFE', 5);
    addText(board, 'RailTxt1', 'Dashboard', px + 14, py + 10, 90, 10, '600', '#1D4ED8');
    addText(board, 'RailTxt2', 'Analytics', px + 14, py + 32, 90, 10, '400', '#64748B');
    addRect(board, 'ContentPane', px + 132, py, pw - 132, 54, '#FFFFFF', 8, '#E2E8F0');
    addText(board, 'PaneTxt', item.variantKey !== 'default' ? item.variantKey + ' rail' : 'Main canvas', px + 144, py + 18, 130, 11, '400', '#94A3B8');
    return;
  }
  if (tag === 'el-router' || tag === 'el-route' || tag === 'el-route-link') {
    addRect(board, 'AddrBar', px, py + 6, pw, 32, '#F8FAFC', 8, '#CBD5E1');
    addRect(board, 'RoutePill', px + 6, py + 10, 56, 24, '#DBEAFE', 5);
    addText(board, 'RouteTag', 'GET', px + 18, py + 15, 36, 10, '700', '#1D4ED8');
    addText(board, 'RoutePath', '/dashboard/settings', px + 72, py + 15, 190, 11, '600', '#0F172A');
    return;
  }

  // --- FEEDBACK & STATUS ---
  if (tag === 'el-badge' || tag === 'el-chip') {
    addRect(board, 'PillBg', px, py + 8, 108, 28, p.soft, 14, p.border);
    addText(board, 'PillTxt', item.variantKey + (tag === 'el-chip' ? '  ×' : ''), px + 16, py + 14, 84, 11, '600', p.text);
    return;
  }
  if (tag === 'el-alert' || tag === 'el-callout' || tag === 'el-toast' || tag === 'el-toaster') {
    addRect(board, 'BannerBg', px, py, pw, 48, p.soft, 8, p.border);
    addRect(board, 'BannerBar', px, py, 5, 48, p.bg, 3);
    addText(board, 'BannerTitle', item.variantKey.toUpperCase() + ' · ' + item.name, px + 16, py + 8, pw - 28, 11, '700', p.text);
    addText(board, 'BannerBody', 'Semantic feedback message with accessible contrast.', px + 16, py + 26, pw - 28, 10, '400', '#334155');
    return;
  }
  if (tag === 'el-progress' || tag === 'el-meter') {
    addRect(board, 'Track', px, py + 16, pw - 42, 12, '#E2E8F0', 6);
    addRect(board, 'Fill', px, py + 16, Math.round((pw - 42) * 0.68), 12, p.bg, 6);
    addText(board, 'Pct', '68%', px + pw - 34, py + 14, 34, 11, '700', '#334155');
    return;
  }
  if (tag === 'el-spinner') {
    const bgCard = item.variant === 'white' ? '#0F172A' : '#F8FAFC';
    addRect(board, 'SpinStage', px, py + 2, 72, 42, bgCard, 8, '#E2E8F0');
    addRect(board, 'SpinRing', px + 22, py + 9, 28, 28, item.variant === 'white' ? '#FFFFFF' : p.bg, 14);
    addRect(board, 'SpinHole', px + 28, py + 15, 16, 16, bgCard, 8);
    addText(board, 'SpinLbl', item.variantKey + ' spinner', px + 84, py + 15, 160, 11, '600', '#475569');
    return;
  }
  if (tag === 'el-skeleton') {
    if (item.variant === 'circular') {
      addRect(board, 'SkCircle', px, py + 4, 40, 40, '#E2E8F0', 20);
      addRect(board, 'SkLine1', px + 52, py + 10, 160, 10, '#E2E8F0', 5);
      addRect(board, 'SkLine2', px + 52, py + 28, 110, 10, '#F1F5F9', 5);
    } else if (item.variant === 'rectangular') {
      addRect(board, 'SkBox', px, py + 2, pw, 44, '#E2E8F0', 8);
    } else {
      addRect(board, 'SkT1', px, py + 6, pw, 10, '#E2E8F0', 5);
      addRect(board, 'SkT2', px, py + 24, pw - 64, 10, '#F1F5F9', 5);
    }
    return;
  }

  // --- FORMS & INPUTS ---
  if (tag === 'el-switch') {
    const on = Boolean(item.checked);
    addRect(board, 'SwitchTrack', px, py + 8, 52, 28, on ? '#2563EB' : '#CBD5E1', 14);
    addRect(board, 'SwitchThumb', on ? px + 27 : px + 3, py + 11, 22, 22, '#FFFFFF', 11);
    addText(board, 'SwitchLbl', on ? 'Enabled' : 'Disabled', px + 64, py + 14, 120, 12, '600', '#0F172A');
    return;
  }
  if (tag === 'el-checkbox' || tag === 'el-checkbox-card') {
    const on = Boolean(item.checked) || tag === 'el-checkbox-card';
    if (tag === 'el-checkbox-card') addRect(board, 'CardWrap', px, py, pw, 46, '#EFF6FF', 8, '#2563EB');
    addRect(board, 'CheckBox', px + (tag === 'el-checkbox-card' ? 12 : 0), py + 12, 20, 20, on ? '#2563EB' : '#FFFFFF', 5, on ? '#2563EB' : '#94A3B8');
    if (on) addText(board, 'CheckMark', '✓', px + (tag === 'el-checkbox-card' ? 16 : 4), py + 13, 16, 12, '700', '#FFFFFF');
    addText(board, 'CheckLbl', on ? 'Checked option' : 'Unchecked option', px + (tag === 'el-checkbox-card' ? 42 : 30), py + 14, 180, 12, '600', '#0F172A');
    return;
  }
  if (tag === 'el-radio' || tag === 'el-radio-card') {
    const on = Boolean(item.checked) || tag === 'el-radio-card';
    if (tag === 'el-radio-card') addRect(board, 'RadioCardWrap', px, py, pw, 46, '#EFF6FF', 8, '#2563EB');
    const rx = px + (tag === 'el-radio-card' ? 12 : 0);
    addRect(board, 'RadioOuter', rx, py + 12, 20, 20, '#FFFFFF', 10, on ? '#2563EB' : '#94A3B8');
    if (on) addRect(board, 'RadioDot', rx + 5, py + 17, 10, 10, '#2563EB', 5);
    addText(board, 'RadioLbl', on ? 'Selected choice' : 'Unselected choice', rx + 30, py + 14, 180, 12, '600', '#0F172A');
    return;
  }
  if (tag === 'el-slider') {
    addRect(board, 'SliderTrack', px, py + 20, pw, 6, '#E2E8F0', 3);
    addRect(board, 'SliderFill', px, py + 20, 168, 6, '#2563EB', 3);
    addRect(board, 'SliderThumb', px + 160, py + 12, 22, 22, '#FFFFFF', 11, '#2563EB');
    return;
  }
  if (tag === 'el-otp-input') {
    ['4', '8', '2', '9', '', ''].forEach((d, idx) => {
      const ox = px + idx * 44;
      addRect(board, 'Otp_' + idx, ox, py + 4, 36, 38, '#FFFFFF', 8, idx === 4 ? '#2563EB' : '#CBD5E1');
      if (d) addText(board, 'OtpD_' + idx, d, ox + 13, py + 14, 16, 14, '700', '#0F172A');
    });
    return;
  }
  if (tag === 'el-rating') {
    addText(board, 'Stars', '★  ★  ★  ★  ☆', px, py + 10, 180, 20, '700', '#F59E0B');
    addText(board, 'Score', '4.0 / 5', px + 188, py + 15, 70, 12, '600', '#475569');
    return;
  }
  if (tag === 'el-dropzone') {
    addRect(board, 'DropBox', px, py, pw, 48, '#F8FAFC', 8, '#94A3B8');
    addText(board, 'DropTxt', '↑ Drop files here or browse', px + 56, py + 16, 200, 11, '600', '#475569');
    return;
  }
  if (tag === 'el-calendar' || tag === 'el-datepicker') {
    addRect(board, 'CalBox', px, py, pw, 46, '#FFFFFF', 8, '#CBD5E1');
    addText(board, 'CalTxt', '2026-11-18   (Nov 2026)', px + 14, py + 15, 200, 12, '600', '#0F172A');
    addRect(board, 'CalBtn', px + pw - 36, py + 9, 28, 28, '#EFF6FF', 6);
    addText(board, 'CalIco', '18', px + pw - 29, py + 15, 20, 11, '700', '#2563EB');
    return;
  }
  if (/input|select|textarea|autocomplete|number-field|field|form/.test(tag)) {
    addRect(board, 'FieldBox', px, py + 4, pw, 36, '#FFFFFF', 8, '#CBD5E1');
    const ph = tag.includes('select') ? 'Select option...' : tag.includes('number') ? '42' : 'Enter value...';
    addText(board, 'FieldVal', ph, px + 12, py + 14, pw - 48, 12, '400', '#64748B');
    if (tag.includes('select') || tag.includes('autocomplete')) {
      addText(board, 'Chevron', '▾', px + pw - 24, py + 14, 18, 12, '700', '#64748B');
    } else if (tag.includes('number')) {
      addText(board, 'Step', '−   +', px + pw - 42, py + 14, 36, 12, '700', '#475569');
    }
    return;
  }

  // --- DATA DISPLAY ---
  if (tag === 'el-avatar' || tag === 'el-avatar-group') {
    addRect(board, 'Av1', px, py + 4, 38, 38, '#DBEAFE', 19, '#93C5FD');
    addText(board, 'AvTxt', 'EL', px + 11, py + 15, 22, 12, '700', '#1D4ED8');
    addRect(board, 'AvDot', px + 28, py + 30, 12, 12, p.bg, 6, '#FFFFFF');
    addText(board, 'AvStatus', item.variantKey !== 'default' ? item.variantKey : 'online', px + 50, py + 15, 140, 12, '600', '#334155');
    return;
  }
  if (tag === 'el-chart') {
    addRect(board, 'ChartBg', px, py, pw, 48, '#F8FAFC', 8, '#E2E8F0');
    [16, 26, 20, 34, 28, 38].forEach((bh, idx) => {
      addRect(board, 'Bar_' + idx, px + 16 + idx * 44, py + 44 - bh, 26, bh, idx === 5 ? '#2563EB' : '#93C5FD', 4);
    });
    return;
  }
  if (tag === 'el-table' || tag === 'el-data-list') {
    addRect(board, 'TblHead', px, py, pw, 16, '#F1F5F9', 4);
    addText(board, 'TblH', 'NAME            STATUS        VALUE', px + 10, py + 2, pw - 20, 9, '700', '#64748B');
    addRect(board, 'TblR1', px, py + 18, pw, 14, '#FFFFFF', 2, '#E2E8F0');
    addText(board, 'TblT1', 'Elementum UI    Active        96.9%', px + 10, py + 19, pw - 20, 9, '400', '#0F172A');
    addRect(board, 'TblR2', px, py + 34, pw, 14, '#F8FAFC', 2, '#E2E8F0');
    addText(board, 'TblT2', 'Penpot Sync     Synced        113', px + 10, py + 35, pw - 20, 9, '400', '#0F172A');
    return;
  }
  if (tag === 'el-number-flow') {
    addText(board, 'NumFlow', '$48,290.00', px, py + 8, 200, 24, '700', '#0F172A');
    addRect(board, 'NumBadge', px + 178, py + 13, 56, 20, '#D1FAE5', 10);
    addText(board, 'NumDelta', '+12.4%', px + 186, py + 16, 44, 10, '700', '#047857');
    return;
  }
  if (tag === 'el-code-block') {
    addRect(board, 'CodeBg', px, py, pw, 48, '#0F172A', 8, '#1E293B');
    addRect(board, 'CodeHdr', px, py, pw, 18, '#1E293B', 4);
    addText(board, 'CodeLang', 'JS', px + 10, py + 2, 32, 8, '700', '#94A3B8');
    addRect(board, 'CopyBtn', px + pw - 40, py + 2, 34, 14, '#334155', 4);
    addText(board, 'CopyTxt', 'Copy', px + pw - 35, py + 3, 26, 8, '600', '#E2E8F0');
    addText(board, 'CodeKw', 'import', px + 10, py + 25, 40, 10, '600', '#C084FC');
    addText(board, 'CodeFn', '{ signal }', px + 50, py + 25, 56, 10, '400', '#60A5FA');
    addText(board, 'CodeStr', '"@wcomp/elementum"', px + 108, py + 25, 136, 10, '400', '#86EFAC');
    return;
  }
  if (tag === 'el-kbd') {
    addRect(board, 'Kbd1', px, py + 8, 32, 28, '#F8FAFC', 6, '#CBD5E1');
    addText(board, 'Kbd1T', '⌘', px + 10, py + 14, 16, 12, '700', '#0F172A');
    addRect(board, 'Kbd2', px + 38, py + 8, 32, 28, '#F8FAFC', 6, '#CBD5E1');
    addText(board, 'Kbd2T', 'K', px + 49, py + 14, 16, 12, '700', '#0F172A');
    return;
  }
  if (tag === 'el-timeline' || tag === 'el-timeline-item') {
    addRect(board, 'TlLine', px + 7, py + 12, 2, 32, '#CBD5E1', 1);
    addRect(board, 'TlDot1', px + 2, py + 4, 12, 12, p.bg, 6);
    addText(board, 'TlTxt1', 'Deployment ' + item.variantKey, px + 24, py + 3, 220, 11, '600', '#0F172A');
    addRect(board, 'TlDot2', px + 2, py + 30, 12, 12, '#CBD5E1', 6);
    addText(board, 'TlTxt2', 'Build verified (100%)', px + 24, py + 29, 220, 10, '400', '#64748B');
    return;
  }

  // --- OVERLAYS & DIALOGS ---
  if (tag === 'el-tooltip') {
    addRect(board, 'TipBg', px, py + 6, 164, 30, '#0F172A', 6);
    addText(board, 'TipTxt', 'Helpful tooltip label', px + 14, py + 14, 140, 11, '600', '#FFFFFF');
    return;
  }
  if (tag === 'el-command') {
    addRect(board, 'CmdBox', px, py + 4, pw, 36, '#FFFFFF', 8, '#94A3B8');
    addText(board, 'CmdTxt', '🔍 Type a command or search...', px + 12, py + 14, 210, 11, '400', '#64748B');
    addRect(board, 'CmdKey', px + pw - 40, py + 10, 32, 22, '#F1F5F9', 5, '#CBD5E1');
    addText(board, 'CmdKeyT', '⌘K', px + pw - 33, py + 14, 24, 10, '700', '#334155');
    return;
  }
  if (/dialog|drawer|popover|dropdown|context-menu|preview-card/.test(tag)) {
    addRect(board, 'OvCard', px, py, pw, 48, '#FFFFFF', 8, '#94A3B8');
    addText(board, 'OvTitle', item.name, px + 12, py + 8, 180, 11, '700', '#0F172A');
    addText(board, 'OvClose', '×', px + pw - 22, py + 6, 16, 14, '700', '#64748B');
    addRect(board, 'OvBtn', px + pw - 74, py + 24, 62, 18, '#2563EB', 5);
    addText(board, 'OvBtnT', 'Confirm', px + pw - 66, py + 26, 48, 9, '600', '#FFFFFF');
    return;
  }

  // --- AI & SPECIALIST ---
  if (tag === 'el-tool-call') {
    addRect(board, 'TcBox', px, py, pw, 48, '#FFFFFF', 8, p.border);
    addRect(board, 'TcPill', px + 10, py + 8, 96, 18, p.soft, 9);
    addText(board, 'TcSt', item.variantKey, px + 18, py + 10, 84, 9, '700', p.text);
    addText(board, 'TcName', 'deploy_edge_worker()', px + 114, py + 10, 170, 10, '600', '#0F172A');
    if (item.variantKey === 'awaiting-approval') {
      addRect(board, 'TcApprove', px + 10, py + 29, 64, 15, '#10B981', 4);
      addText(board, 'TcAppT', 'Approve', px + 18, py + 30, 52, 9, '700', '#FFFFFF');
      addRect(board, 'TcReject', px + 80, py + 29, 54, 15, '#FEE2E2', 4);
      addText(board, 'TcRejT', 'Reject', px + 88, py + 30, 44, 9, '700', '#B91C1C');
    } else {
      addText(board, 'TcArgs', '{ "region": "us-east-1" }', px + 10, py + 30, 240, 9, '400', '#64748B');
    }
    return;
  }
  if (tag === 'el-prompt-input') {
    addRect(board, 'PrBox', px, py + 2, pw, 42, '#FFFFFF', 10, '#CBD5E1');
    addText(board, 'PrTxt', 'Ask Elementum agent anything...', px + 12, py + 15, 200, 11, '400', '#64748B');
    addRect(board, 'PrSend', px + pw - 56, py + 9, 48, 28, '#2563EB', 7);
    addText(board, 'PrSendT', 'Send', px + pw - 46, py + 15, 34, 11, '600', '#FFFFFF');
    return;
  }
  if (tag === 'el-reasoning-card') {
    addRect(board, 'RsBox', px, py + 2, pw, 42, '#F8FAFC', 8, '#CBD5E1');
    addRect(board, 'RsDot', px + 12, py + 18, 10, 10, '#2563EB', 5);
    addText(board, 'RsTxt', 'Thought for 2.4s  ▾', px + 28, py + 15, 180, 11, '600', '#0F172A');
    return;
  }
  if (tag === 'el-streaming-text') {
    addText(board, 'StTxt', 'Streaming live tokens from AG-UI', px, py + 14, 214, 12, '400', '#0F172A');
    addRect(board, 'StCursor', px + 216, py + 14, 3, 16, '#2563EB', 1);
    return;
  }
  if (tag === 'el-border-beam') {
    addRect(board, 'BeamCard', px, py + 2, pw, 42, '#FFFFFF', 10, '#2563EB');
    addText(board, 'BeamTxt', '✦ Animated perimeter beam', px + 14, py + 15, 220, 11, '600', '#1D4ED8');
    return;
  }
  if (tag === 'el-diff-viewer') {
    addRect(board, 'DiffBox', px, py, pw, 48, '#FFFFFF', 8, '#CBD5E1');
    addRect(board, 'DiffDel', px + 6, py + 4, pw - 12, 13, '#FEE2E2', 3);
    addText(board, 'DiffDelT', '- const timeout = 5000;', px + 12, py + 4, pw - 24, 9, '400', '#B91C1C');
    addRect(board, 'DiffAdd', px + 6, py + 19, pw - 12, 13, '#D1FAE5', 3);
    addText(board, 'DiffAddT', '+ const timeout = 12000;', px + 12, py + 19, pw - 24, 9, '400', '#047857');
    addRect(board, 'DiffApp', px + pw - 110, py + 34, 50, 12, '#10B981', 4);
    addText(board, 'DiffAppT', 'Approve', px + pw - 104, py + 34, 42, 8, '700', '#FFFFFF');
    addRect(board, 'DiffRej', px + pw - 54, py + 34, 48, 12, '#FEE2E2', 4);
    addText(board, 'DiffRejT', 'Reject', px + pw - 46, py + 34, 38, 8, '700', '#B91C1C');
    return;
  }
  if (tag === 'el-sources') {
    addRect(board, 'SrcP1', px, py + 2, 74, 18, '#DBEAFE', 9, '#93C5FD');
    addText(board, 'SrcP1T', '[1] Docs', px + 10, py + 4, 58, 9, '600', '#1D4ED8');
    addRect(board, 'SrcP2', px + 80, py + 2, 76, 18, '#F1F5F9', 9, '#CBD5E1');
    addText(board, 'SrcP2T', '[2] Spec', px + 90, py + 4, 60, 9, '600', '#334155');
    addRect(board, 'SrcP3', px + 162, py + 2, 74, 18, '#F1F5F9', 9, '#CBD5E1');
    addText(board, 'SrcP3T', '[3] API', px + 172, py + 4, 58, 9, '600', '#334155');
    addRect(board, 'SrcCard', px, py + 24, pw, 22, '#F8FAFC', 6, '#CBD5E1');
    addText(board, 'SrcCardT', 'elementum.dev — Declarative Shadow DOM', px + 10, py + 28, pw - 20, 9, '400', '#475569');
    return;
  }
  if (tag === 'el-task-list') {
    addRect(board, 'TaskBox', px, py, pw, 48, '#FFFFFF', 8, '#CBD5E1');
    addText(board, 'TaskHdr', 'Agent Plan  2/3 completed', px + 10, py + 4, 180, 9, '700', '#0F172A');
    addRect(board, 'TaskBar', px + 200, py + 7, pw - 210, 5, '#E2E8F0', 3);
    addRect(board, 'TaskFill', px + 200, py + 7, Math.round((pw - 210) * 0.67), 5, '#10B981', 3);
    addRect(board, 'TaskD1', px + 10, py + 20, 8, 8, '#10B981', 4);
    addText(board, 'TaskT1', 'Audit design tokens & variants', px + 24, py + 18, 220, 9, '400', '#475569');
    addRect(board, 'TaskD2', px + 10, py + 34, 8, 8, '#2563EB', 4);
    addText(board, 'TaskT2', 'Sync components to Penpot MCP', px + 24, py + 32, 220, 9, '600', '#0F172A');
    return;
  }
  if (tag === 'el-insight-card') {
    addRect(board, 'InsBox', px, py, pw, 48, '#FFFFFF', 8, p.border);
    addText(board, 'InsVal', '+24.8%', px + 10, py + 4, 72, 15, '700', '#0F172A');
    addRect(board, 'InsPill', px + 88, py + 7, 54, 15, '#D1FAE5', 7);
    addText(board, 'InsDelta', '▲ +4.2%', px + 94, py + 8, 44, 8, '700', '#047857');
    addRect(board, 'InsUp', px + pw - 44, py + 6, 18, 16, '#F1F5F9', 4, '#CBD5E1');
    addText(board, 'InsUpT', '👍', px + pw - 40, py + 7, 12, 9, '400', '#334155');
    addRect(board, 'InsDn', px + pw - 22, py + 6, 18, 16, '#F1F5F9', 4, '#CBD5E1');
    addText(board, 'InsDnT', '👎', px + pw - 18, py + 7, 12, 9, '400', '#334155');
    addText(board, 'InsSum', 'Adoption velocity across SSR & AG-UI apps', px + 10, py + 29, pw - 20, 9, '400', '#64748B');
    return;
  }

  // --- LAYOUT & PRIMITIVES ---
  if (tag === 'el-separator') {
    addRect(board, 'SepLine', px, py + 22, pw, 2, '#CBD5E1', 1);
    return;
  }
  if (tag === 'el-resizable') {
    addRect(board, 'PaneL', px, py + 2, 134, 42, '#F8FAFC', 6, '#CBD5E1');
    addRect(board, 'Handle', px + 140, py + 12, 6, 22, '#2563EB', 3);
    addRect(board, 'PaneR', px + 152, py + 2, pw - 152, 42, '#FFFFFF', 6, '#CBD5E1');
    return;
  }
  if (tag === 'el-aspect-ratio') {
    addRect(board, 'ArBox', px, py + 2, 128, 42, '#EFF6FF', 6, '#93C5FD');
    addText(board, 'ArTxt', '16 : 9', px + 44, py + 16, 48, 12, '700', '#1D4ED8');
    return;
  }

  // Fallback crisp surface preview
  addRect(board, 'SurfaceBox', px, py + 2, pw, 42, '#F8FAFC', 8, '#CBD5E1');
  addText(board, 'SurfaceTxt', item.name + (item.variantKey !== 'default' ? ' · ' + item.variantKey : ''), px + 12, py + 15, pw - 24, 11, '600', '#334155');
}

// Page header board
const headerBoard = penpot.createBoard();
headerBoard.name = 'Category / ' + cfg.catTitle;
headerBoard.resize(SECTION_W, HEADER_H);
headerBoard.fills = [{ fillColor: '#F8FAFC', fillOpacity: 1 }];
headerBoard.strokes = [{ strokeColor: '#E2E8F0', strokeWidth: 1, strokeOpacity: 1, strokeAlignment: 'inner' }];
headerBoard.borderRadius = 12;
penpot.root.appendChild(headerBoard);
headerBoard.x = 0;
headerBoard.y = 0;
addText(headerBoard, 'Title', cfg.catTitle + ' — ' + cfg.componentCount + ' components (' + cfg.items.length + ' variants)', 20, 12, SECTION_W - 40, 18, '700', '#0F172A');
addText(headerBoard, 'Description', cfg.catDesc, 20, 38, SECTION_W - 40, 12, '400', '#475569');

const lib = penpot.library.local;
let created = 0;

for (let i = 0; i < cfg.items.length; i++) {
  const item = cfg.items[i];
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const bx = col * (CARD_W + GAP_X);
  const by = HEADER_H + 56 + row * (CARD_H + GAP_Y);

  const compName = item.variantKey === 'default'
    ? cfg.catTitle + ' / ' + item.tag
    : cfg.catTitle + ' / ' + item.tag + ' / ' + item.variantKey;

  const board = penpot.createBoard();
  board.name = compName;
  board.resize(CARD_W, CARD_H);
  board.fills = [{ fillColor: '#FFFFFF', fillOpacity: 1 }];
  board.strokes = [{ strokeColor: '#E2E8F0', strokeWidth: 1, strokeOpacity: 1, strokeAlignment: 'inner' }];
  board.borderRadius = 12;
  penpot.root.appendChild(board);
  board.x = bx;
  board.y = by;

  const headerTitle = item.variantKey === 'default' ? item.name : item.name + ' · ' + item.variantKey;
  addText(board, 'Label', headerTitle, 16, 12, CARD_W - 32, 13, '700', '#0F172A');
  addText(board, 'Tag', '<' + item.tag + '>', 16, 30, CARD_W - 32, 11, '400', '#2563EB');

  drawPreview(board, item);

  addText(board, 'PropsMeta', 'props (' + item.propsCount + '): ' + item.propPreview, 16, CARD_H - 26, CARD_W - 32, 10, '400', '#64748B');

  const comp = lib.createComponent([board]);
  comp.name = compName;
  created++;
}

await penpot.waitForLayoutUpdate();
return {
  page: cfg.pageName,
  category: cfg.catTitle,
  componentsInCategory: cfg.componentCount,
  variantsCreated: created,
  totalLibraryComponents: lib.components.length
};
`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const totalBaseComponents = Object.keys(components).length;
  const totalExpandedVariants = Object.values(components).reduce(
    (sum, c) => sum + expandComponentVariants(c).length,
    0
  );

  if (opts.dryRun) {
    const tokenScript = buildTokensScript();
    const sampleCategoryScript = buildCategoryComponentsScript(categories[0], 0);
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          categoriesCount: categories.length,
          componentsCount: totalBaseComponents,
          totalVariantsCount: totalExpandedVariants,
          tokenScriptBytes: Buffer.byteLength(tokenScript, 'utf8'),
          sampleCategoryScriptBytes: Buffer.byteLength(sampleCategoryScript, 'utf8'),
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
  if (!opts.skipTokens) {
    console.log('Connected to Penpot MCP. Syncing tokens, colors, and Foundations page...');
    const tokenRes = await client.executeCode(buildTokensScript());
    console.log('Tokens & Foundations result:', tokenRes);
  } else {
    console.log('Connected to Penpot MCP. Skipping tokens/Foundations (--skip-tokens).');
  }

  for (let idx = opts.fromIndex - 1; idx < categories.length; idx++) {
    const cat = categories[idx];
    if (opts.onlyCategory && cat.id !== opts.onlyCategory && cat.title !== opts.onlyCategory) {
      continue;
    }
    console.log(`Generating Penpot page [${idx + 1}/${categories.length}]: ${cat.title}...`);
    const catRes = await client.executeCode(buildCategoryComponentsScript(cat, idx));
    console.log(' ->', catRes);
  }

  console.log('Penpot v2 multi-page design system generation complete.');
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isDirectRun) {
  main().catch((err) => {
    console.error('Penpot MCP sync failed:', err.message);
    process.exit(1);
  });
}
