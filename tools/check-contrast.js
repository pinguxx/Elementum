#!/usr/bin/env node
/**
 * Executable WCAG 2.2 AA Light & Dark Contrast Matrix + Fill-vs-Text Token Gate
 * Parses src/tokens.css for light and dark palettes, computes exact WCAG 2.2 AA
 * contrast ratios across every semantic foreground x surface pairing, and scans
 * src/components/*.js to block solid-fill brand tokens used as foreground color.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function parseTokens(block) {
  const map = {};
  for (const m of block.matchAll(/(--el-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
    let hex = m[2].toLowerCase();
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    map[m[1]] = hex;
  }
  return map;
}

function relativeLuminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const [l1, l2] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const css = fs.readFileSync(path.join(rootDir, 'src/tokens.css'), 'utf8');
const lightBlock = css.match(/:root,\s*:root\[data-theme="light"\]\s*\{([\s\S]*?)\n\s*\}/)?.[1] || '';
const darkBlock = css.match(/\[data-theme="dark"\],\s*:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\s*\}/)?.[1] || '';

if (!lightBlock || !darkBlock) {
  console.error('Could not parse light/dark token blocks in src/tokens.css');
  process.exit(1);
}

const themes = {
  light: parseTokens(lightBlock),
  dark: parseTokens(darkBlock),
};

const PAIRS = [
  ['--el-color-primary-contrast', '--el-color-primary', 4.5, 'primary-contrast on primary fill'],
  ['--el-color-primary-contrast', '--el-color-primary-hover', 4.5, 'primary-contrast on primary-hover fill'],
  ['--el-color-danger-contrast', '--el-color-danger', 4.5, 'danger-contrast on danger fill'],
  ['#ffffff', '--el-color-success', 4.5, 'white on success fill'],
  ['--el-text-primary', '--el-surface-base', 4.5, 'text-primary on surface-base'],
  ['--el-text-primary', '--el-surface-card', 4.5, 'text-primary on surface-card'],
  ['--el-text-primary', '--el-surface-elevated', 4.5, 'text-primary on surface-elevated'],
  ['--el-text-primary', '--el-surface-muted', 4.5, 'text-primary on surface-muted'],
  ['--el-text-secondary', '--el-surface-card', 4.5, 'text-secondary on surface-card'],
  ['--el-text-secondary', '--el-surface-elevated', 4.5, 'text-secondary on surface-elevated'],
  ['--el-text-muted', '--el-surface-card', 4.5, 'text-muted on surface-card'],
  ['--el-text-muted', '--el-surface-muted', 4.5, 'text-muted on surface-muted'],
  ['--el-color-primary-text', '--el-surface-card', 4.5, 'primary-text on surface-card'],
  ['--el-color-primary-text', '--el-step-3', 4.5, 'primary-text on step-3'],
  ['--el-color-success-text', '--el-surface-elevated', 4.5, 'success-text on surface-elevated'],
  ['--el-color-warning-text', '--el-surface-elevated', 4.5, 'warning-text on surface-elevated'],
  ['--el-color-danger-text', '--el-surface-elevated', 4.5, 'danger-text on surface-elevated'],
  ['--el-color-info-text', '--el-surface-elevated', 4.5, 'info-text on surface-elevated'],
  ['--el-tooltip-text', '--el-tooltip-bg', 4.5, 'tooltip-text on tooltip-bg'],
];

const failures = [];
let checked = 0;

for (const [mode, tokens] of Object.entries(themes)) {
  for (const [fgSpec, bgSpec, minRatio, label] of PAIRS) {
    const fg = fgSpec.startsWith('#') ? fgSpec : tokens[fgSpec];
    const bg = bgSpec.startsWith('#') ? bgSpec : tokens[bgSpec];
    checked++;
    if (!fg || !bg) {
      failures.push(`[${mode}] Missing token for ${label} (${fgSpec}=${fg}, ${bgSpec}=${bg})`);
      continue;
    }
    const ratio = contrastRatio(fg, bg);
    if (ratio < minRatio) {
      failures.push(`[${mode}] ${label}: ${ratio.toFixed(2)}:1 < ${minRatio}:1 (${fg} on ${bg})`);
    }
  }
}

// Scan all components to ensure solid-fill tokens are never reused as foreground color:
const compDir = path.join(rootDir, 'src/components');
const fillAsTextRe = /color:\s*var\(--el-color-(primary|primary-hover|danger|success|warning|info|accent)(?!-text|-contrast)\b|color:\s*var\(--el-step-(9|10)\b/;
for (const file of fs.readdirSync(compDir).filter((f) => f.endsWith('.js')).sort()) {
  const lines = fs.readFileSync(path.join(compDir, file), 'utf8').split('\n');
  lines.forEach((line, idx) => {
    if (/^\s*color:/.test(line) && fillAsTextRe.test(line)) {
      failures.push(`[component] src/components/${file}:${idx + 1} uses solid-fill token as foreground color: ${line.trim()}`);
    }
  });
}

if (failures.length > 0) {
  console.error(`Contrast matrix check FAILED (${failures.length} violation(s)):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Contrast matrix check PASSED: ${checked} light/dark token pairs >= 4.5:1 and 0 solid-fill foreground leaks across src/components/*.js.`);
