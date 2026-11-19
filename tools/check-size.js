#!/usr/bin/env node
/**
 * Per-component & core gzipped byte size budget checker (0 runtime deps).
 * Usage:
 *   node tools/check-size.js           # Verify all entrypoints against size-budget.json
 *   node tools/check-size.js --update  # Regenerate size-budget.json with 15% headroom
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const BUDGET_PATH = path.join(ROOT, 'size-budget.json');
const UPDATE = process.argv.includes('--update');

const CORE_FILES = [
  ['@wcomp/elementum/signal', 'src/signal.js'],
  ['@wcomp/elementum/template', 'src/template.js'],
  ['@wcomp/elementum/elementum', 'src/elementum.js'],
  ['@wcomp/elementum/ssr', 'src/ssr.js'],
  ['@wcomp/elementum/behaviors', 'src/behaviors/index.js'],
  ['@wcomp/elementum/agent', 'src/agent/index.js'],
  ['@wcomp/elementum/testing', 'src/testing/index.js'],
  ['@wcomp/elementum/ag-ui', 'src/ag-ui.js'],
];

const compDir = path.join(ROOT, 'src', 'components');
const compFiles = fs
  .readdirSync(compDir)
  .filter((f) => f.endsWith('.js'))
  .sort()
  .map((f) => [`@wcomp/elementum/components/${f.replace(/\.js$/, '')}`, `src/components/${f}`]);

const allEntries = [...CORE_FILES, ...compFiles];

function measureGzipBytes(relPath) {
  const buf = fs.readFileSync(path.join(ROOT, relPath));
  return zlib.gzipSync(buf, { level: 9 }).length;
}

function resolveTransitiveGraph(entryRelPath, seen = new Set()) {
  const abs = path.resolve(ROOT, entryRelPath);
  if (seen.has(abs) || !fs.existsSync(abs)) return seen;
  seen.add(abs);
  const src = fs.readFileSync(abs, 'utf8');
  const importRe = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"](\.[^'"]+)['"]/g;
  let m;
  while ((m = importRe.exec(src)) !== null) {
    const dep = path.resolve(path.dirname(abs), m[1]);
    resolveTransitiveGraph(path.relative(ROOT, dep), seen);
  }
  return seen;
}

function measureTransitiveGzip(entryRelPath) {
  const files = Array.from(resolveTransitiveGraph(entryRelPath)).sort();
  const combined = Buffer.concat(files.map((f) => fs.readFileSync(f)));
  return { files: files.length, raw: combined.length, gzip: zlib.gzipSync(combined, { level: 9 }).length };
}

const PUBLIC_GRAPHS = [
  ['Core Runtime (elementum + signal + template)', 'src/elementum.js'],
  ['@wcomp/elementum/behaviors (transitive)', 'src/behaviors/index.js'],
  ['@wcomp/elementum/agent (transitive)', 'src/agent/index.js'],
  ['@wcomp/elementum/testing (transitive)', 'src/testing/index.js'],
  ['@wcomp/elementum/ssr (transitive)', 'src/ssr.js'],
  ['@wcomp/elementum/ag-ui (transitive)', 'src/ag-ui.js'],
  ['Single component: el-button (transitive)', 'src/components/el-button.js'],
];

const measured = {};
let totalGzip = 0;
for (const [name, rel] of allEntries) {
  const gz = measureGzipBytes(rel);
  measured[name] = gz;
  totalGzip += gz;
}

if (UPDATE || !fs.existsSync(BUDGET_PATH)) {
  const budgets = {};
  for (const [name, gz] of Object.entries(measured)) {
    // Round up with 15% headroom (minimum +256 B) to avoid churn on minor fixes
    budgets[name] = Math.ceil((gz * 1.15 + 256) / 64) * 64;
  }
  fs.writeFileSync(BUDGET_PATH, JSON.stringify(budgets, null, 2) + '\n', 'utf8');
  console.log(`Updated size-budget.json (${Object.keys(budgets).length} entrypoints, total gzip: ${(totalGzip / 1024).toFixed(1)} KB)`);
  process.exit(0);
}

const budgets = JSON.parse(fs.readFileSync(BUDGET_PATH, 'utf8'));
const failures = [];

for (const [name, gz] of Object.entries(measured)) {
  const limit = budgets[name];
  if (limit === undefined) {
    failures.push(`${name}: missing from size-budget.json (actual ${gz} B gzip — run npm run check:size:update)`);
  } else if (gz > limit) {
    failures.push(`${name}: ${gz} B gzip exceeds budget ${limit} B (+${gz - limit} B)`);
  }
}

if (failures.length > 0) {
  console.error(`Size budget check FAILED (${failures.length} violation(s)):`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}

const coreTotal = CORE_FILES.reduce((sum, [n]) => sum + measured[n], 0);
console.log(
  `Size budget check PASSED: ${allEntries.length} entrypoints within gzip budgets ` +
  `(core+behaviors+agent+ssr: ${(coreTotal / 1024).toFixed(1)} KB, avg component: ${(
    compFiles.reduce((s, [n]) => s + measured[n], 0) / compFiles.length / 1024
  ).toFixed(2)} KB gzip)`
);
console.log('\nTransitive Import Graph Sizes (unminified source -> gzip level 9):');
for (const [label, rel] of PUBLIC_GRAPHS) {
  const g = measureTransitiveGzip(rel);
  console.log(`  ${label.padEnd(46)} ${(g.gzip / 1024).toFixed(2).padStart(6)} KB gzip (${g.files} file${g.files === 1 ? '' : 's'})`);
}
