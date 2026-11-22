#!/usr/bin/env node
/**
 * 3-Way Framework Comparison Benchmark (React vs. Vue 3 vs. Vanilla)
 * Measures exact lines of code (total and non-empty), raw size, and level-9 gzipped size
 * across the three identical Team Directory implementations in starters/framework-comparison/,
 * and verifies all three share the same 9 Elementum UI primitives.
 *
 * Usage:
 *   node tools/bench-frameworks.js           # Prints summary report to stdout
 *   node tools/bench-frameworks.js --write   # Syncs measured metrics in starters/framework-comparison/README.md
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const cmpDir = path.join(rootDir, 'starters', 'framework-comparison');

const SHARED_COMPONENTS = [
  'el-card',
  'el-badge',
  'el-button',
  'el-theme-switch',
  'el-input',
  'el-select',
  'el-table',
  'el-dialog',
  'el-toaster',
];

function measureFile(relPath, checkTags) {
  const fullPath = path.join(cmpDir, relPath);
  const src = fs.readFileSync(fullPath, 'utf8');
  const buf = Buffer.from(src, 'utf8');
  const lines = src.split(/\r?\n/);
  // Trim trailing final newline empty element if present
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  const gzBytes = zlib.gzipSync(buf, { level: 9 }).length;

  for (const tag of checkTags) {
    // React wrappers use PascalCase JSX (<ElButton) while Vue & Vanilla use kebab-case (<el-button)
    const pascal = tag
      .split('-')
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join('');
    assert.ok(
      src.includes(tag) || src.includes(pascal),
      `${relPath} is missing shared component ${tag} / ${pascal}`
    );
  }

  return {
    relPath,
    totalLoc: lines.length,
    nonEmptyLoc: nonEmptyLines.length,
    rawBytes: buf.length,
    rawKb: (buf.length / 1024).toFixed(2),
    gzBytes,
    gzKb: (gzBytes / 1024).toFixed(2),
  };
}

const react = measureFile('react/src/App.jsx', SHARED_COMPONENTS);
const vue = measureFile('vue/src/App.vue', SHARED_COMPONENTS);
const vanilla = measureFile('vanilla/index.html', SHARED_COMPONENTS);

console.log('3-Way Framework Comparison Benchmark (Team Directory App):');
console.table([
  {
    Target: 'React (@wcomp/elementum/react)',
    File: react.relPath,
    'Non-Empty LOC': react.nonEmptyLoc,
    'Total LOC': react.totalLoc,
    'Raw KB': react.rawKb,
    'Gzip KB': react.gzKb,
  },
  {
    Target: 'Vue 3 (Native Custom Elements)',
    File: vue.relPath,
    'Non-Empty LOC': vue.nonEmptyLoc,
    'Total LOC': vue.totalLoc,
    'Raw KB': vue.rawKb,
    'Gzip KB': vue.gzKb,
  },
  {
    Target: 'Vanilla (Micro-Signals + CDN)',
    File: vanilla.relPath,
    'Non-Empty LOC': vanilla.nonEmptyLoc,
    'Total LOC': vanilla.totalLoc,
    'Raw KB': vanilla.rawKb,
    'Gzip KB': vanilla.gzKb,
  },
]);
console.log(`✔ Verified all 3 targets share the same ${SHARED_COMPONENTS.length} Elementum components.`);

if (process.argv.includes('--write')) {
  const readme = `# 3-Way Framework Comparison: React vs. Vue 3 vs. Vanilla

> Auto-updated by \`npm run bench:frameworks -- --write\`. Every figure below is computed directly from the three source files in this directory.

To evaluate Elementum's framework-independent architecture under identical conditions, this directory implements the **exact same interactive Team Directory application** three times using the same 9 Elementum components (\`<el-card>\`, \`<el-badge>\`, \`<el-button>\`, \`<el-theme-switch>\`, \`<el-input>\`, \`<el-select>\`, \`<el-table>\`, \`<el-dialog>\`, and \`<el-toaster>\` + \`toast\`):

1. [**\`react/\`**](./react) — React 19 using typed \`@wcomp/elementum/react\` wrappers
2. [**\`vue/\`**](./vue) — Vue 3 using native Custom Elements (\`isCustomElement\`)
3. [**\`vanilla/\`**](./vanilla) — Zero-build HTML5 + \`@wcomp/elementum\` micro-signals (\`signal\`, \`computed\`, \`effect\`)

## Measured Comparison

| Metric | React (\`@wcomp/elementum/react\`) | Vue 3 (Native Custom Elements) | Vanilla (Micro-Signals + CDN) |
| :--- | :---: | :---: | :---: |
| **App Implementation File** | \`src/App.jsx\` | \`src/App.vue\` | \`index.html\` (complete app) |
| **Non-Empty LOC (Total LOC)** | **${react.nonEmptyLoc}** (${react.totalLoc}) | **${vue.nonEmptyLoc}** (${vue.totalLoc}) | **${vanilla.nonEmptyLoc}** (${vanilla.totalLoc}, includes full HTML shell) |
| **App Source Size (Raw / Gzip)** | ${react.rawKb} KB / **${react.gzKb} KB** | ${vue.rawKb} KB / **${vue.gzKb} KB** | ${vanilla.rawKb} KB / **${vanilla.gzKb} KB** |
| **Build Step Required** | Vite + \`@vitejs/plugin-react\` | Vite + \`@vitejs/plugin-vue\` | **None (0 build)** |
| **Framework Runtime Added** | \`react\` + \`react-dom\` | \`vue\` | **0 KB** |
| **Complex Array Props (\`<el-table>\`)** | Direct JSX props (\`columns\`, \`data\`) via \`useLayoutEffect\` | \`ref\` + \`watchEffect\` on \`.data.value\` | Direct \`.data.value\` inside \`effect()\` |
| **Strict TypeScript Props** | Generated per-component types (\`src/react/index.d.ts\`) | Native \`HTMLElementTagNameMap\` | Native \`HTMLElementTagNameMap\` |
| **Accessibility & Theming** | Identical Shadow DOM + WCAG 2.2 AA | Identical Shadow DOM + WCAG 2.2 AA | Identical Shadow DOM + WCAG 2.2 AA |
| **Live Demo** | [elementum-comparison-react.vercel.app](https://elementum-comparison-react.vercel.app) | [elementum-comparison-vue.vercel.app](https://elementum-comparison-vue.vercel.app) | [elementum-sage.vercel.app/starters/...](https://elementum-sage.vercel.app/starters/framework-comparison/vanilla/index.html) |

## Key Takeaways

- **Consistent Ergonomics**: All three implementations weigh in at ~${Math.min(react.nonEmptyLoc, vue.nonEmptyLoc, vanilla.nonEmptyLoc)}–${Math.max(react.nonEmptyLoc, vue.nonEmptyLoc, vanilla.nonEmptyLoc)} non-empty lines (${react.gzKb}–${vanilla.gzKb} KB gzipped) with identical component structure, slots, theming (\`<el-theme-switch>\`), and toast notifications (\`toast.success()\`).
- **Zero Component Duplication**: None of the three versions re-implement table sorting, modal focus trapping, form controls, or theme tokens—every framework shares the exact same Custom Element implementation.
- **Progressive Integration**: Teams can adopt Elementum in an existing React or Vue app today and share components across micro-frontends or zero-build HTML pages without rewriting UI logic.
`;
  fs.writeFileSync(path.join(cmpDir, 'README.md'), readme, 'utf8');
  console.log('✔ Synced starters/framework-comparison/README.md');
}
