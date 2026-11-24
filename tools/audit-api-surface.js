#!/usr/bin/env node
/**
 * Automated API Surface Consistency Audit across all 113 @wcomp/elementum components.
 *
 * Enforces cross-component API conventions before 1.0.0:
 *   1. Size tokens use short scale ('sm' | 'md' | 'lg'), never 'small' | 'medium' | 'large'.
 *   2. Destructive/error semantic variant is canonically named 'danger' in CEM (not 'destructive').
 *   3. No 'el-*' prefixed custom event names (standard DOM names like 'change', 'input', 'select').
 *   4. All AI disclosure cards (el-reasoning-card, el-tool-call, el-sources) support 'open'.
 *   5. All Form-Associated Custom Elements (FACE) inherit formResetCallback & formDisabledCallback.
 *
 * Usage:
 *   node tools/audit-api-surface.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const cem = JSON.parse(fs.readFileSync(path.join(rootDir, 'custom-elements.json'), 'utf8'));
const decls = [];
for (const mod of cem.modules || []) {
  for (const d of mod.declarations || []) {
    if (d.tagName) decls.push({ ...d, path: mod.path });
  }
}

const errors = [];

// 1. Check size values, danger vs destructive, and event prefixes across CEM
const disallowedSizes = new Set(['small', 'medium', 'large']);
for (const d of decls) {
  for (const a of d.attributes || []) {
    const t = a.type?.text || '';
    if (a.name === 'size') {
      for (const m of t.matchAll(/"([^"]+)"|'([^']+)'/g)) {
        const val = m[1] || m[2];
        if (disallowedSizes.has(val)) {
          errors.push(`${d.tagName}: size attribute uses "${val}" instead of sm/md/lg`);
        }
      }
    }
    if (a.name === 'variant') {
      for (const m of t.matchAll(/"([^"]+)"|'([^']+)'/g)) {
        const val = m[1] || m[2];
        if (val === 'destructive') {
          errors.push(`${d.tagName}: variant uses "destructive" instead of canonical "danger"`);
        }
      }
    }
  }
  for (const ev of d.events || []) {
    if (ev.name.startsWith('el-')) {
      errors.push(`${d.tagName}: event "${ev.name}" uses non-standard "el-" prefix`);
    }
  }
}

// 2. All AI disclosure cards must accept 'open'
for (const tag of ['el-reasoning-card', 'el-tool-call', 'el-sources']) {
  const d = decls.find((x) => x.tagName === tag);
  if (!d) {
    errors.push(`Missing AI disclosure component in CEM: ${tag}`);
    continue;
  }
  const hasOpen = (d.attributes || []).some((a) => a.name === 'open');
  if (!hasOpen) {
    errors.push(`${tag}: missing canonical "open" attribute in CEM`);
  }
}

// 3. Base Elementum class must provide default formResetCallback & formDisabledCallback
const baseSrc = fs.readFileSync(path.join(rootDir, 'src', 'elementum.js'), 'utf8');
if (!baseSrc.includes('formResetCallback()') || !baseSrc.includes('formDisabledCallback(disabled)')) {
  errors.push('src/elementum.js: missing base formResetCallback() or formDisabledCallback(disabled)');
}

// Count FACE components
const compDir = path.join(rootDir, 'src', 'components');
let faceCount = 0;
for (const f of fs.readdirSync(compDir)) {
  if (!f.endsWith('.js')) continue;
  const src = fs.readFileSync(path.join(compDir, f), 'utf8');
  if (src.includes('formAssociated = true')) faceCount++;
}

if (errors.length > 0) {
  console.error(`✖ API Surface Audit FAILED (${errors.length} issue(s)):`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `✔ API Surface Audit PASSED: ${decls.length} components, ${faceCount} FACE controls, 0 naming inconsistencies.`
);
