import '../test-helpers/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createElementumReactComponent } from '../src/react/runtime.js';
import '../src/index.js';

function createMiniReact() {
  let cleanups = [];
  let layoutEffects = [];
  let effects = [];
  let hookRefs = [];
  let refCursor = 0;

  const React = {
    forwardRef(renderFn) {
      return function ForwardRef(props) {
        return renderFn(props, props?.ref ?? null);
      };
    },
    useRef(initialValue) {
      const idx = refCursor++;
      if (!hookRefs[idx]) {
        hookRefs[idx] = { current: initialValue };
      }
      return hookRefs[idx];
    },
    useLayoutEffect(effectFn) {
      layoutEffects.push(effectFn);
    },
    useEffect(effectFn) {
      effects.push(effectFn);
    },
    createElement(tag, props, children) {
      const el = document.createElement(tag);
      for (const [k, v] of Object.entries(props || {})) {
        if (k === 'ref') continue;
        if (k === 'style' && typeof v === 'object') {
          Object.assign(el.style, v);
          continue;
        }
        if (typeof v === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), v);
          continue;
        }
        if (v !== undefined) el.setAttribute(k, String(v));
      }
      if (children != null) el.textContent = String(children);
      return { el, refCb: props?.ref };
    },
    mount(WrapperComponent, props) {
      layoutEffects = [];
      effects = [];
      cleanups = [];
      hookRefs = [];
      refCursor = 0;
      const rendered = WrapperComponent(props);
      document.body.appendChild(rendered.el);
      if (typeof rendered.refCb === 'function') rendered.refCb(rendered.el);
      for (const lef of layoutEffects) {
        const cleanup = lef();
        if (typeof cleanup === 'function') cleanups.push(cleanup);
      }
      for (const ef of effects) {
        const cleanup = ef();
        if (typeof cleanup === 'function') cleanups.push(cleanup);
      }
      return rendered.el;
    },
    rerender(WrapperComponent, existingEl, props) {
      for (const cleanup of cleanups) cleanup();
      cleanups = [];
      layoutEffects = [];
      effects = [];
      refCursor = 0;
      const rendered = WrapperComponent(props);
      if (typeof rendered.refCb === 'function') rendered.refCb(existingEl);
      for (const lef of layoutEffects) {
        const cleanup = lef();
        if (typeof cleanup === 'function') cleanups.push(cleanup);
      }
      for (const ef of effects) {
        const cleanup = ef();
        if (typeof cleanup === 'function') cleanups.push(cleanup);
      }
      return existingEl;
    },
    unmount(el) {
      for (const cleanup of cleanups) cleanup();
      cleanups = [];
      layoutEffects = [];
      effects = [];
      hookRefs = [];
      refCursor = 0;
      el?.remove();
    },
  };

  return React;
}

test('@wcomp/elementum/react runtime wires refs, className, booleans, object props, prop removal, and CustomEvents', () => {
  const React = createMiniReact();

  const ElBtn = createElementumReactComponent(React, 'el-button');
  assert.equal(ElBtn.displayName, 'Elementum(el-button)');

  let refObj = { current: null };
  let clicked = 0;
  const btnEl = React.mount(ElBtn, {
    ref: refObj,
    variant: 'primary',
    disabled: true,
    hidden: false,
    className: 'cta-btn',
    style: { marginTop: '4px' },
    ignored: null,
    onClick: () => { clicked++; },
    children: 'Save',
  });

  assert.equal(refObj.current, btnEl);
  assert.equal(btnEl.getAttribute('variant'), 'primary');
  assert.equal(btnEl.hasAttribute('disabled'), true);
  assert.equal(btnEl.hasAttribute('hidden'), false);
  assert.equal(btnEl.getAttribute('class'), 'cta-btn');
  assert.equal(btnEl.style.marginTop, '4px');
  btnEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  assert.equal(clicked, 1);
  React.unmount(btnEl);

  // Custom events + callback ref + complex array/object signal properties on el-table
  const ElTbl = createElementumReactComponent(React, 'el-table', {
    onSelectionChange: 'selectionchange',
  });
  let cbNode = null;
  let selectionDetail = null;
  let customPingCount = 0;

  const cols = [{ key: 'name', label: 'Name' }];
  const rows = [{ name: 'Ada' }];
  const tblEl = React.mount(ElTbl, {
    ref: (node) => { cbNode = node; },
    selectable: true,
    columns: cols,
    data: rows,
    customMeta: { env: 'prod' },
    onSelectionChange: (e) => { selectionDetail = e.detail; },
    onCustomPing: () => { customPingCount++; },
  });

  assert.equal(cbNode, tblEl);
  assert.deepEqual(tblEl.columns.value, cols);
  assert.deepEqual(tblEl.data.value, rows);
  assert.deepEqual(tblEl.customMeta, { env: 'prod' });

  // Removing object/array props resets signal & plain properties back to initial defaults
  React.rerender(ElTbl, tblEl, {
    ref: (node) => { cbNode = node; },
    selectable: true,
    columns: cols,
    onSelectionChange: (e) => { selectionDetail = e.detail; },
    onCustomPing: () => { customPingCount++; },
  });
  assert.deepEqual(tblEl.columns.value, cols);
  assert.deepEqual(tblEl.data.value, [], 'Removed signal prop `data` must reset to initial empty array');
  assert.equal(tblEl.customMeta, undefined, 'Removed plain object prop must reset to undefined');

  tblEl.dispatchEvent(new CustomEvent('selectionchange', { detail: { selected: [0] } }));
  tblEl.dispatchEvent(new CustomEvent('custom-ping'));
  assert.deepEqual(selectionDetail, { selected: [0] });
  assert.equal(customPingCount, 1);

  // Unmount detaches listeners cleanly
  React.unmount(tblEl);
  tblEl.dispatchEvent(new CustomEvent('custom-ping'));
  assert.equal(customPingCount, 1);
});

test('@wcomp/elementum/react generated wrappers cover all 113 custom-elements.json declarations', () => {
  const cem = JSON.parse(fs.readFileSync(new URL('../custom-elements.json', import.meta.url), 'utf8'));
  const decls = cem.modules.flatMap((m) => m.declarations || []).filter((d) => d.kind === 'class' && d.tagName);
  const reactJs = fs.readFileSync(new URL('../src/react/index.js', import.meta.url), 'utf8');
  const reactDts = fs.readFileSync(new URL('../src/react/index.d.ts', import.meta.url), 'utf8');

  assert.equal(decls.length, 113);
  for (const decl of decls) {
    assert.ok(reactJs.includes(`export const ${decl.name} =`), `Missing JS export ${decl.name}`);
    assert.ok(reactJs.includes(`'${decl.tagName}'`), `Missing tag '${decl.tagName}' in JS`);
    assert.ok(reactDts.includes(`export declare const ${decl.name}:`), `Missing DTS export ${decl.name}`);
  }
});
