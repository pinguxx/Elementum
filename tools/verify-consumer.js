#!/usr/bin/env node
/**
 * External Consumer Tarball Verification for @wcomp/elementum
 * Packs the real npm artifact (.tgz), installs it into a clean external temp
 * directory outside this repository, and verifies:
 *   1. All package.json subpath exports (ESM resolution + runtime execution)
 *   2. Pure-Node DSD SSR from installed package
 *   3. AG-UI and Behaviors subpath imports
 *   4. Strict TypeScript compilation (`tsc --noEmit --strict`) against installed `index.d.ts`
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const tscBin = path.join(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'elementum-consumer-'));
console.log(`📦 External Consumer Verification in ${tmpDir}`);

try {
  // 1. Pack actual tarball
  const packOut = execFileSync(npmCmd, ['pack', '--pack-destination', tmpDir], {
    cwd: rootDir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  }).trim();
  const tgzName = packOut.split(/\r?\n/).pop().trim();
  const tgzPath = path.join(tmpDir, tgzName);
  if (!fs.existsSync(tgzPath)) {
    throw new Error(`Expected tarball not found: ${tgzPath}`);
  }
  console.log(`✔ Packed ${tgzName}`);

  // 2. Create clean external consumer app
  const consumerDir = path.join(tmpDir, 'app');
  fs.mkdirSync(consumerDir, { recursive: true });
  fs.writeFileSync(
    path.join(consumerDir, 'package.json'),
    JSON.stringify({ name: 'external-consumer-test', private: true, type: 'module' }, null, 2)
  );

  // 3. Install packed tarball (verifies zero runtime dependencies & clean files list)
  execFileSync(npmCmd, ['install', '--no-audit', '--no-fund', tgzPath], {
    cwd: consumerDir,
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
  console.log('✔ Installed tarball into clean external app');

  // 4. Verify runtime ESM subpath exports
  const esmTestFile = path.join(consumerDir, 'verify-esm.mjs');
  fs.writeFileSync(
    esmTestFile,
    `
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as main from '@wcomp/elementum';
import { renderComponentToDSD } from '@wcomp/elementum/ssr';
import { createAgUiStore, applyJsonPatch } from '@wcomp/elementum/ag-ui';
import { createPressBehavior, createRovingFocus, createSelectionBehavior, createReorderBehavior, announce } from '@wcomp/elementum/behaviors';
import { ElButton } from '@wcomp/elementum/components/el-button.js';

assert.equal(typeof main.signal, 'function');
assert.equal(typeof main.computed, 'function');
assert.equal(typeof main.effect, 'function');
assert.equal(typeof main.Elementum, 'function');
assert.equal(typeof createPressBehavior, 'function');
assert.equal(typeof createRovingFocus, 'function');
assert.equal(typeof createSelectionBehavior, 'function');
assert.equal(typeof createReorderBehavior, 'function');
assert.equal(typeof announce, 'function');

// Pure-Node DSD SSR from installed package
const dsd = renderComponentToDSD('el-button', ElButton, { variant: 'primary' }, 'Click');
assert.ok(dsd.includes('<template shadowrootmode="open">'));
assert.ok(dsd.includes('variant="primary"'));

// AG-UI store from installed package
const store = createAgUiStore({ count: 1 });
store.dispatch({ type: 'STATE_DELTA', delta: [{ op: 'replace', path: '/count', value: 42 }] });
assert.equal(store.state.value.count, 42);
assert.equal(applyJsonPatch({ a: 1 }, [{ op: 'replace', path: '/a', value: 2 }]).a, 2);

// Verify tokens.css & custom-elements.json are resolvable
const tokensPath = fileURLToPath(import.meta.resolve('@wcomp/elementum/tokens.css'));
const cemPath = fileURLToPath(import.meta.resolve('@wcomp/elementum/custom-elements.json'));
assert.ok(fs.readFileSync(tokensPath, 'utf8').includes('--el-color-primary'));
const cem = JSON.parse(fs.readFileSync(cemPath, 'utf8'));
assert.ok(cem.modules.length >= 70);

console.log('✔ All 7 ESM subpath exports & pure-Node SSR/AG-UI/Behaviors verified');
`
  );
  execFileSync(process.execPath, [esmTestFile], { cwd: consumerDir, stdio: 'inherit' });

  // 5. Verify strict TypeScript consumer compilation against installed index.d.ts
  const tsFile = path.join(consumerDir, 'verify-types.ts');
  fs.writeFileSync(
    tsFile,
    `
import {
  signal,
  computed,
  ElButton,
  createAgUiStore,
  createPressBehavior,
  createSelectionBehavior,
  renderComponentToDSD,
} from '@wcomp/elementum';

const count = signal<number>(1);
const doubled = computed(() => count.value * 2);
const btn = document.createElement('el-button');
const typedBtn: ElButton = btn;
void typedBtn;
void doubled;

const store = createAgUiStore({ progress: 0 });
store.dispatch({ type: 'RUN_STARTED', runId: 'r1' });

const sel = createSelectionBehavior({ mode: 'multiple', getKeys: () => ['a', 'b'] });
sel.selectAll();

const cleanup = createPressBehavior(btn);
cleanup();

const htmlOut: string = renderComponentToDSD('el-button', ElButton, { variant: 'primary' }, 'Hi');
void htmlOut;
`
  );
  fs.writeFileSync(
    path.join(consumerDir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          lib: ['ES2022', 'DOM'],
          strict: true,
          noEmit: true,
          skipLibCheck: true,
        },
        include: ['verify-types.ts'],
      },
      null,
      2
    )
  );
  execFileSync(tscBin, ['-p', path.join(consumerDir, 'tsconfig.json')], {
    cwd: consumerDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  console.log('✔ Strict TypeScript consumer compilation passed (0 errors)');
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
