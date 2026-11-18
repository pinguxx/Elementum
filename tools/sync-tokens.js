#!/usr/bin/env node
/**
 * Unified Design Tokens Sync Utility
 * Supports both Penpot (W3C DTCG JSON) and Figma Variables JSON formats.
 * Compiles into src/tokens.css with light/dark modes and physical motion tokens.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Check CLI argument or fallback to penpot-tokens.json or figma-tokens.json
const customInput = process.argv[2];
let tokensPath;
if (customInput && fs.existsSync(path.resolve(process.cwd(), customInput))) {
  tokensPath = path.resolve(process.cwd(), customInput);
} else {
  const penpotPath = path.join(rootDir, 'tokens', 'penpot-tokens.json');
  const figmaPath = path.join(rootDir, 'tokens', 'figma-tokens.json');
  tokensPath = fs.existsSync(penpotPath) ? penpotPath : figmaPath;
}

const outputPath = path.join(rootDir, 'src', 'tokens.css');
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

// Helper to extract value from either W3C DTCG ($value) or generic/Penpot (value)
function val(node, fallback = '') {
  if (node === null || node === undefined) return fallback;
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return String(node.$value ?? node.value ?? fallback);
}

const colorBrand = tokens.color?.brand || {};
const colorSurface = tokens.color?.surface || {};
const colorText = tokens.color?.text || {};
const spacing = tokens.spacing || {};
const radius = tokens.radius || {};

let cssContent = `/**
 * Elementum Design Tokens
 * Auto-generated from ${path.basename(tokensPath)} (Unified Penpot & Figma parser)
 */

:root,
:root[data-theme="light"] {
  /* Brand Colors */
  --el-color-primary: ${val(colorBrand.primary, '#2563eb')};
  --el-color-primary-hover: ${val(colorBrand['primary-hover'], '#1d4ed8')};
  --el-color-secondary: ${val(colorBrand.secondary, '#4b5563')};
  --el-color-danger: ${val(colorBrand.danger, '#dc2626')};
  --el-color-success: ${val(colorBrand.success, '#16a34a')};

  /* Surfaces & Elevation */
  --el-surface-base: ${val(colorSurface.base, '#ffffff')};
  --el-surface-card: #ffffff;
  --el-surface-elevated: #ffffff;
  --el-surface-muted: ${val(colorSurface.muted, '#f8fafc')};
  --el-surface-border: ${val(colorSurface.border, '#e2e8f0')};
  --el-border-translucent: rgba(15, 23, 42, 0.08);

  /* Subtle Ambient Shadows (Ban the AI look) */
  --el-shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --el-shadow-card: 0 1px 3px rgba(0, 0, 0, 0.06), 0 8px 16px -4px rgba(0, 0, 0, 0.04);
  --el-shadow-popover: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  --el-shadow-glow: 0 0 20px -5px rgba(37, 99, 235, 0.25);

  /* Physical Motion & Natural Easing Curves */
  --el-ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --el-ease-in-fast: cubic-bezier(0.7, 0, 0.84, 0);
  --el-transition-snappy: 150ms var(--el-ease-in-fast);
  --el-transition-fluid: 280ms var(--el-ease-out-expo);

  /* Typography Colors */
  --el-text-base: ${val(colorText.base, '#111827')};
  --el-text-primary: #0f172a;
  --el-text-secondary: #475569;
  --el-text-muted: ${val(colorText.muted, '#64748b')};
  --el-text-inverse: ${val(colorText.inverse, '#ffffff')};

  /* Font Families */
  --el-font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --el-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Spacing */
  --el-spacing-xs: ${val(spacing.xs, '4px')};
  --el-spacing-sm: ${val(spacing.sm, '8px')};
  --el-spacing-md: ${val(spacing.md, '16px')};
  --el-spacing-lg: ${val(spacing.lg, '24px')};
  --el-spacing-xl: ${val(spacing.xl, '32px')};

  /* Radii */
  --el-radius-sm: ${val(radius.sm, '4px')};
  --el-radius-md: ${val(radius.md, '8px')};
  --el-radius-lg: ${val(radius.lg, '12px')};
  --el-radius-full: ${val(radius.full, '9999px')};

  /* Chart Data Series Tokens */
  --el-chart-1: #2563eb;
  --el-chart-2: #10b981;
  --el-chart-3: #f59e0b;
  --el-chart-4: #8b5cf6;
  --el-chart-5: #ec4899;

  /* Typographic Rhythm Tokens */
  --el-typeset-size: 1rem;
  --el-typeset-leading: 1.75;
  --el-typeset-flow: 1.25em;
  --el-typeset-font-body: var(--el-font-sans);

  /* Radix Colors 12-Step Accessible Scale (Light Theme) */
  --el-step-1: #fbfcfd;
  --el-step-2: #f8fafc;
  --el-step-3: #f1f5f9;
  --el-step-4: #e2e8f0;
  --el-step-5: #cbd5e1;
  --el-step-6: #e2e8f0;
  --el-step-7: #cbd5e1;
  --el-step-8: #94a3b8;
  --el-step-9: #2563eb;
  --el-step-10: #1d4ed8;
  --el-step-11: #475569;
  --el-step-12: #0f172a;
  --el-typeset-font-heading: var(--el-font-sans);

  color-scheme: light;
}

:root[data-theme="dark"] {
  /* Brand Colors */
  --el-color-primary: #3b82f6;
  --el-color-primary-hover: #60a5fa;
  --el-color-secondary: #9ca3af;
  --el-color-danger: #ef4444;
  --el-color-success: #22c55e;

  /* Surfaces (Dark Mode) */
  --el-surface-base: #0b0f19;
  --el-surface-card: #111827;
  --el-surface-elevated: #1e293b;
  --el-surface-muted: #1e293b;
  --el-surface-border: #334155;
  --el-border-translucent: rgba(255, 255, 255, 0.08);

  --el-shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --el-shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4);
  --el-shadow-popover: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
  --el-shadow-glow: 0 0 25px -5px rgba(59, 130, 246, 0.35);

  /* Typography Colors (Dark Mode) */
  --el-text-base: #f9fafb;
  --el-text-primary: #f8fafc;
  --el-text-secondary: #94a3b8;
  --el-text-muted: #64748b;
  --el-text-inverse: #0f172a;

  /* Chart Colors (Dark Mode) */
  --el-chart-1: #3b82f6;
  --el-chart-2: #34d399;
  --el-chart-3: #fbbf24;
  --el-chart-4: #a78bfa;
  --el-chart-5: #f472b6;

  /* Radix Colors 12-Step Accessible Scale (Dark Theme) */
  --el-step-1: #090d16;
  --el-step-2: #0f172a;
  --el-step-3: #1e293b;
  --el-step-4: #334155;
  --el-step-5: #475569;
  --el-step-6: #1e293b;
  --el-step-7: #334155;
  --el-step-8: #64748b;
  --el-step-9: #3b82f6;
  --el-step-10: #2563eb;
  --el-step-11: #94a3b8;
  --el-step-12: #f8fafc;

  color-scheme: dark;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="dark"]) {
    --el-color-primary: #3b82f6;
    --el-color-primary-hover: #60a5fa;
    --el-color-secondary: #9ca3af;
    --el-color-danger: #ef4444;
    --el-color-success: #22c55e;

    --el-surface-base: #0b0f19;
    --el-surface-card: #111827;
    --el-surface-elevated: #1e293b;
    --el-surface-muted: #1e293b;
    --el-surface-border: #334155;
    --el-border-translucent: rgba(255, 255, 255, 0.08);

    --el-shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --el-shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4);
    --el-shadow-popover: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    --el-shadow-glow: 0 0 25px -5px rgba(59, 130, 246, 0.35);

    --el-text-base: #f9fafb;
    --el-text-primary: #f8fafc;
    --el-text-secondary: #94a3b8;
    --el-text-muted: #64748b;
    --el-text-inverse: #0f172a;

    --el-chart-1: #3b82f6;
    --el-chart-2: #34d399;
    --el-chart-3: #fbbf24;
    --el-chart-4: #a78bfa;
    --el-chart-5: #f472b6;

    /* Radix Colors 12-Step Accessible Scale (Dark Theme) */
    --el-step-1: #090d16;
    --el-step-2: #0f172a;
    --el-step-3: #1e293b;
    --el-step-4: #334155;
    --el-step-5: #475569;
    --el-step-6: #1e293b;
    --el-step-7: #334155;
    --el-step-8: #64748b;
    --el-step-9: #3b82f6;
    --el-step-10: #2563eb;
    --el-step-11: #94a3b8;
    --el-step-12: #f8fafc;

    color-scheme: dark;
  }
}

/* ========================================================
   Typographic Rhythm Container (.el-typeset)
   ======================================================== */
.el-typeset {
  font-family: var(--el-typeset-font-body, var(--el-font-sans));
  font-size: var(--el-typeset-size, 1rem);
  line-height: var(--el-typeset-leading, 1.75);
  color: var(--el-text-primary, #0f172a);
}

.el-typeset :is(h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, pre, table) {
  margin-block: 0;
}

.el-typeset :is(h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, pre, table) + * {
  margin-top: var(--el-typeset-flow, 1.25em);
}

.el-typeset h1 {
  font-family: var(--el-typeset-font-heading, var(--el-font-sans));
  font-size: 2.25em;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.2;
  color: var(--el-text-base, #111827);
}

.el-typeset h2 {
  font-family: var(--el-typeset-font-heading, var(--el-font-sans));
  font-size: 1.5em;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: var(--el-text-base, #111827);
  border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
  padding-bottom: 0.3em;
}

.el-typeset h3 {
  font-family: var(--el-typeset-font-heading, var(--el-font-sans));
  font-size: 1.25em;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.4;
  color: var(--el-text-base, #111827);
}

.el-typeset p {
  color: var(--el-text-secondary, #475569);
}

.el-typeset blockquote {
  border-left: 3px solid var(--el-color-primary, #2563eb);
  padding-left: 1em;
  font-style: italic;
  color: var(--el-text-muted, #64748b);
}

.el-typeset ul, .el-typeset ol {
  padding-left: 1.5em;
  color: var(--el-text-secondary, #475569);
}

.el-typeset li + li {
  margin-top: calc(var(--el-typeset-flow, 1.25em) * 0.35);
}

.el-typeset code {
  font-family: var(--el-font-mono);
  background: var(--el-surface-muted, #f1f5f9);
  padding: 0.2em 0.4em;
  border-radius: var(--el-radius-sm, 4px);
  font-size: 0.875em;
  color: var(--el-text-primary, #0f172a);
}

.el-typeset pre {
  background: var(--el-surface-elevated, #1e293b);
  color: #f8fafc;
  padding: 1em 1.25em;
  border-radius: var(--el-radius-md, 8px);
  overflow-x: auto;
  font-family: var(--el-font-mono);
  font-size: 0.875em;
  line-height: 1.6;
}

.el-typeset pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: inherit;
}

/* ========================================================
   FOUC & Layout-Shift Prevention for Custom Elements
   ======================================================== */
el-command:not(:defined),
el-dialog:not(:defined),
el-drawer:not(:defined),
el-toaster:not(:defined),
el-dropdown:not(:defined) {
  display: none !important;
}

:not(:defined):is(
  el-button,
  el-badge,
  el-input,
  el-calendar,
  el-datepicker,
  el-tabs,
  el-tab,
  el-select,
  el-switch,
  el-tooltip,
  el-accordion,
  el-accordion-item,
  el-table,
  el-progress,
  el-spinner,
  el-avatar,
  el-avatar-group,
  el-segmented-control,
  el-pagination,
  el-chip,
  el-autocomplete,
  el-number-flow,
  el-otp-input,
  el-prompt-input,
  el-reasoning-card,
  el-border-beam,
  el-streaming-text,
  el-chart,
  el-theme-switch
) {
  opacity: 0;
}

:defined {
  animation: el-defined-in 120ms var(--el-ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
}

@keyframes el-defined-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

fs.writeFileSync(outputPath, cssContent, 'utf8');
console.log(`✓ Successfully synchronized tokens from ${path.basename(tokensPath)} to src/tokens.css`);
