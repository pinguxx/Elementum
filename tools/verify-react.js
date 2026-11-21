#!/usr/bin/env node
/**
 * Real React 18 & React 19 Consumer Verification for @wcomp/elementum/react
 * Packs the real npm tarball (.tgz), installs it alongside real `react` + `react-dom`
 * (`18.x` and `19.x`) into isolated external temp directories, and verifies:
 *   1. Pure-Node SSR (`react-dom/server` `renderToString`) with zero console warnings
 *   2. Real `react-dom/client` under `<React.StrictMode>`:
 *      - StrictMode double-effect listener deduplication
 *      - Conditional event handler toggling (no hook deps size warning)
 *      - Callback & object `ref` forwarding
 *      - Complex object/array property assignment (`<ElTable columns data />`)
 *      - Concurrent `React.startTransition` updates
 *      - Native `<form>` submission & FormData / ElementInternals integration
 *      - Unmount cleanup (0 listener leaks)
 *   3. Strict TypeScript JSX compilation (`tsc --noEmit --strict` + `"jsx": "react-jsx"`)
 *      against `@types/react@18` / `@types/react@19`
 *
 * Usage:
 *   node tools/verify-react.js              # Runs both React 18 and React 19
 *   node tools/verify-react.js --react=18   # Runs React 18 only
 *   node tools/verify-react.js --react=19   # Runs React 19 only
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

const reactFlag = process.argv.find((arg) => arg.startsWith('--react='));
let targetMajors = ['18', '19'];
if (reactFlag) {
  const val = reactFlag.slice('--react='.length);
  if (val !== '18' && val !== '19') {
    console.error(`Invalid --react value "${val}". Expected --react=18 or --react=19.`);
    process.exit(1);
  }
  targetMajors = [val];
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'elementum-react-'));
console.log(`⚛️  Real React Consumer Verification (${targetMajors.map((v) => `React ${v}`).join(' + ')}) in ${tmpDir}`);

try {
  // 1. Pack actual tarball once
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

  for (const major of targetMajors) {
    console.log(`\n--- Verifying @wcomp/elementum/react with real react@${major} ---`);
    const appDir = path.join(tmpDir, `react-${major}`);
    fs.mkdirSync(appDir, { recursive: true });
    fs.writeFileSync(
      path.join(appDir, 'package.json'),
      JSON.stringify({ name: `elementum-react-${major}-test`, private: true, type: 'module' }, null, 2)
    );

    execFileSync(
      npmCmd,
      [
        'install',
        '--no-audit',
        '--no-fund',
        tgzPath,
        `react@${major}`,
        `react-dom@${major}`,
        `@types/react@${major}`,
        'happy-dom@21',
      ],
      {
        cwd: appDir,
        stdio: 'pipe',
        shell: process.platform === 'win32',
      }
    );
    console.log(`✔ Installed tarball + react@${major} + react-dom@${major} + @types/react@${major}`);

    // Suite 1: Pure-Node SSR via react-dom/server renderToString (no happy-dom)
    const ssrFile = path.join(appDir, 'verify-ssr.mjs');
    fs.writeFileSync(
      ssrFile,
      `
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ElButton, ElInput, ElDialog } from '@wcomp/elementum/react';

const logs = [];
const origErr = console.error;
const origWarn = console.warn;
console.error = (...args) => logs.push(['error', ...args]);
console.warn = (...args) => logs.push(['warn', ...args]);

let html = '';
try {
  html = renderToString(
    React.createElement(
      'main',
      null,
      React.createElement(ElButton, { variant: 'primary', disabled: true, className: 'cta' }, 'Save'),
      React.createElement(ElInput, { name: 'email', value: 'ada@example.com' }),
      React.createElement(ElDialog, { open: true }, 'Confirm')
    )
  );
} finally {
  console.error = origErr;
  console.warn = origWarn;
}

assert.equal(logs.length, 0, 'Expected zero console warnings/errors during React SSR: ' + JSON.stringify(logs));
assert.ok(html.includes('<el-button'), 'Missing <el-button> in SSR output: ' + html);
assert.ok(html.includes('variant="primary"'), 'Missing variant attr in SSR output: ' + html);
assert.ok(html.includes('class="cta"'), 'Missing class attr in SSR output: ' + html);
assert.ok(html.includes('<el-input'), 'Missing <el-input> in SSR output: ' + html);
assert.ok(html.includes('<el-dialog'), 'Missing <el-dialog> in SSR output: ' + html);
console.log('✔ [React ' + React.version + '] Pure-Node renderToString SSR passed (0 warnings)');
`
    );
    execFileSync(process.execPath, [ssrFile], { cwd: appDir, stdio: 'inherit' });

    // Suite 2: Real react-dom/client StrictMode + Transitions + Form + Unmount cleanup
    const domFile = path.join(appDir, 'verify-dom.mjs');
    fs.writeFileSync(
      domFile,
      `
import assert from 'node:assert/strict';
import { GlobalWindow } from 'happy-dom';

const win = new GlobalWindow({ url: 'http://localhost' });
globalThis.window = win;
globalThis.document = win.document;
globalThis.Document = win.Document;
globalThis.Node = win.Node;
globalThis.Element = win.Element;
globalThis.HTMLElement = win.HTMLElement;
globalThis.HTMLInputElement = win.HTMLInputElement;
globalThis.HTMLTextAreaElement = win.HTMLTextAreaElement;
globalThis.HTMLSelectElement = win.HTMLSelectElement;
globalThis.customElements = win.customElements;
globalThis.DocumentFragment = win.DocumentFragment;
globalThis.NodeFilter = win.NodeFilter;
globalThis.CSSStyleSheet = win.CSSStyleSheet;
globalThis.MutationObserver = win.MutationObserver;
globalThis.CustomEvent = win.CustomEvent;
globalThis.Event = win.Event;
globalThis.MouseEvent = win.MouseEvent;
globalThis.PointerEvent = win.PointerEvent || win.MouseEvent;
globalThis.KeyboardEvent = win.KeyboardEvent;
globalThis.FormData = win.FormData;
globalThis.localStorage = win.localStorage;
globalThis.requestAnimationFrame = win.requestAnimationFrame?.bind(win) ?? ((cb) => setTimeout(cb, 0));
globalThis.cancelAnimationFrame = win.cancelAnimationFrame?.bind(win) ?? clearTimeout;
if (typeof globalThis.navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: win.navigator });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ReactMod = await import('react');
const React = ReactMod.default ?? ReactMod;
const act = React.act ?? (await import('react-dom/test-utils')).act;
const { createRoot } = await import('react-dom/client');
const { ElButton, ElForm, ElInput, ElTabs, ElTable, ElSwitch } = await import('@wcomp/elementum/react');

assert.ok(React.version.startsWith('${major}.'), 'Expected React ${major}.x, got ' + React.version);

const warnings = [];
const origErr = console.error;
const origWarn = console.warn;
console.error = (...args) => warnings.push(['error', args.map(String).join(' ')]);
console.warn = (...args) => warnings.push(['warn', args.map(String).join(' ')]);

const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);

try {
  const formRef = React.createRef();
  const inputRef = React.createRef();
  const cols = [{ key: 'name', label: 'Name' }];
  const rows = [{ name: 'Ada Lovelace' }];

  let changeCount = 0;
  let tabEvents = [];
  let submittedFormData = null;
  let altClicks = 0;

  function TestApp({ enableAltHandler, label, statusText }) {
    return React.createElement(
      React.StrictMode,
      null,
      React.createElement(
        ElForm,
        {
          ref: formRef,
          onFormSubmit: (e) => { submittedFormData = e.detail.data; },
        },
        React.createElement(ElInput, {
          ref: inputRef,
          name: 'email',
          value: 'ada@example.com',
          onChange: () => { changeCount++; },
        }),
        React.createElement(ElSwitch, { name: 'alerts', checked: true }),
        React.createElement(
          ElButton,
          enableAltHandler
            ? { variant: 'primary', onClick: () => { altClicks++; } }
            : { variant: 'secondary' },
          label
        ),
        React.createElement(ElTabs, {
          onTabChange: (e) => { tabEvents.push(e.detail?.tab); },
        }),
        React.createElement(ElTable, { columns: cols, data: rows }),
        React.createElement('span', { id: 'status-text' }, statusText)
      )
    );
  }

  // 1. Mount under React.StrictMode
  await act(async () => {
    root.render(React.createElement(TestApp, { enableAltHandler: true, label: 'Save', statusText: 'idle' }));
  });

  // Ref forwarding check
  assert.ok(inputRef.current instanceof win.HTMLElement, 'Forwarded ref must point to HTMLElement');
  assert.equal(inputRef.current.tagName.toLowerCase(), 'el-input');

  // Complex object/array props assigned directly onto instance (not serialized to attributes)
  const tblEl = container.querySelector('el-table');
  assert.deepEqual(tblEl.columns.value, cols);
  assert.deepEqual(tblEl.data.value, rows);
  assert.equal(tblEl.hasAttribute('columns'), false);
  assert.equal(tblEl.hasAttribute('data'), false);

  // StrictMode double-effect check: dispatching event must invoke listener ONCE
  await act(async () => {
    inputRef.current.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: 'grace@example.com' } }));
  });
  assert.equal(changeCount, 1, 'StrictMode must clean up first effect pass so listener fires once');

  // Custom event mapping (onTabChange -> 'tabchange')
  const tabsEl = container.querySelector('el-tabs');
  await act(async () => {
    tabsEl.dispatchEvent(new CustomEvent('tabchange', { detail: { tab: 'security' } }));
  });
  assert.deepEqual(tabEvents, ['security']);

  // Form association, getFormData(), and onFormSubmit event handling inside React
  const formData = formRef.current.getFormData();
  assert.equal(formData.email, 'ada@example.com');
  assert.equal(formData.alerts, 'on');
  await act(async () => {
    formRef.current.shadowRoot.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
  });
  assert.deepEqual(submittedFormData, { email: 'ada@example.com', alerts: 'on' });
  assert.equal(inputRef.current.constructor.formAssociated, true);

  // Conditional handler toggling: enableAltHandler true -> false -> true (must NOT warn about deps size)
  await act(async () => {
    root.render(React.createElement(TestApp, { enableAltHandler: false, label: 'Disabled', statusText: 'toggling' }));
  });
  await act(async () => {
    root.render(React.createElement(TestApp, { enableAltHandler: true, label: 'Enabled', statusText: 'ready' }));
  });

  // Concurrent startTransition update
  await act(async () => {
    React.startTransition(() => {
      root.render(React.createElement(TestApp, { enableAltHandler: true, label: 'Committed', statusText: 'transitioned' }));
    });
  });
  assert.equal(container.querySelector('#status-text').textContent, 'transitioned');
  assert.equal(container.querySelector('el-button').textContent, 'Committed');

  // Unmount cleanup check: listeners must be removed after root.unmount()
  const savedInput = inputRef.current;
  const savedTabs = tabsEl;
  await act(async () => {
    root.unmount();
  });
  savedInput.dispatchEvent(new CustomEvent('change', { bubbles: true }));
  savedTabs.dispatchEvent(new CustomEvent('tabchange', { detail: { tab: 'after-unmount' } }));
  assert.equal(changeCount, 1, 'Listener leaked after React unmount on <el-input>');
  assert.deepEqual(tabEvents, ['security'], 'Listener leaked after React unmount on <el-tabs>');

  assert.equal(warnings.length, 0, 'Expected zero React console errors/warnings: ' + JSON.stringify(warnings));
  console.log('✔ [React ' + React.version + '] StrictMode, refs, object props, startTransition, ElForm & unmount passed (0 warnings)');
} finally {
  console.error = origErr;
  console.warn = origWarn;
  container.remove();
}
`
    );
    execFileSync(process.execPath, [domFile], { cwd: appDir, stdio: 'inherit' });

    // Suite 3: Strict TypeScript JSX verification against @types/react@<major>
    const tsxFile = path.join(appDir, 'verify-react.tsx');
    fs.writeFileSync(
      tsxFile,
      `
import React, { useRef } from 'react';
import { ElButton, ElInput, ElTabs, ElTable, type ElementFor } from '@wcomp/elementum/react';

export function ConsumerExample() {
  const inputRef = useRef<ElementFor<'el-input'> | null>(null);
  const columns = [{ key: 'name', label: 'Name' }];
  const data = [{ name: 'Ada' }];

  return (
    <form>
      <ElInput
        ref={inputRef}
        name="username"
        value="ada"
        required
        onChange={(e) => {
          void e.detail;
        }}
      />
      <ElButton variant="primary" disabled={false} className="submit-btn">
        Submit
      </ElButton>
      <ElTabs onTabChange={(e) => { void e.detail; }} />
      <ElTable columns={columns} data={data} />
    </form>
  );
}
`
    );
    fs.writeFileSync(
      path.join(appDir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            lib: ['ES2022', 'DOM'],
            jsx: 'react-jsx',
            strict: true,
            noEmit: true,
            skipLibCheck: true,
          },
          include: ['verify-react.tsx'],
        },
        null,
        2
      )
    );
    execFileSync(tscBin, ['-p', path.join(appDir, 'tsconfig.json')], {
      cwd: appDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    console.log(`✔ [React ${major}] Strict TypeScript TSX consumer check passed (0 errors)`);
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
