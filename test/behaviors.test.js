import test from 'node:test';
import assert from 'node:assert/strict';
import '../test-helpers/setup.js';
import {
  setHostState,
  isRTL,
  formatLocaleNumber,
  formatLocaleDate,
  announce,
  clearAnnouncer,
  createPressBehavior,
  createRovingFocus,
  createDismissableLayer,
  createSelectionBehavior,
  createReorderBehavior,
} from '../src/behaviors/index.js';
import '../src/components/el-button.js';
import '../src/components/el-code-block.js';
import '../src/components/el-pagination.js';
import '../src/components/el-number-flow.js';
import '../src/components/el-calendar.js';

test('Behaviors 1: setHostState reflects data-* attributes and ElementInternals.states', () => {
  const el = document.createElement('div');
  const stateSet = new Set();
  el.internals = { states: stateSet };

  setHostState(el, 'pressed', true);
  assert.equal(el.hasAttribute('data-pressed'), true);
  assert.equal(stateSet.has('pressed'), true);

  setHostState(el, 'pressed', false);
  assert.equal(el.hasAttribute('data-pressed'), false);
  assert.equal(stateSet.has('pressed'), false);
});

test('Behaviors 2: announce() creates polite & assertive live regions and clearAnnouncer() clears them', () => {
  clearAnnouncer();
  announce('Copied to clipboard', 'polite');
  const polite = document.getElementById('el-live-announcer-polite');
  assert.ok(polite);
  assert.equal(polite.getAttribute('aria-live'), 'polite');
  assert.equal(polite.textContent, 'Copied to clipboard');

  // Repeat identical message still succeeds
  announce('Copied to clipboard', 'polite');
  assert.equal(polite.textContent, 'Copied to clipboard');

  announce('Connection lost', 'assertive');
  const assertive = document.getElementById('el-live-announcer-assertive');
  assert.ok(assertive);
  assert.equal(assertive.getAttribute('role'), 'alert');
  assert.equal(assertive.textContent, 'Connection lost');

  clearAnnouncer();
  assert.equal(polite.textContent, '');
  assert.equal(assertive.textContent, '');
});

test('Behaviors 3: createPressBehavior normalizes mouse/touch/keyboard and ignores touch hover', () => {
  const btn = document.createElement('el-button');
  btn.textContent = 'Save';
  document.body.appendChild(btn);

  const innerBtn = btn.shadowRoot.querySelector('button');
  assert.ok(innerBtn);

  // Touch pointerenter must NOT trigger data-hovered (prevents sticky hover on mobile)
  const touchEnter = new Event('pointerenter');
  Object.defineProperty(touchEnter, 'pointerType', { value: 'touch' });
  innerBtn.dispatchEvent(touchEnter);
  assert.equal(btn.hasAttribute('data-hovered'), false);

  // Mouse pointerenter triggers data-hovered
  const mouseEnter = new Event('pointerenter');
  Object.defineProperty(mouseEnter, 'pointerType', { value: 'mouse' });
  innerBtn.dispatchEvent(mouseEnter);
  assert.equal(btn.hasAttribute('data-hovered'), true);

  // Pointerdown / pointerup toggles data-pressed
  const down = new Event('pointerdown');
  Object.defineProperty(down, 'button', { value: 0 });
  innerBtn.dispatchEvent(down);
  assert.equal(btn.hasAttribute('data-pressed'), true);

  innerBtn.dispatchEvent(new Event('pointerup'));
  assert.equal(btn.hasAttribute('data-pressed'), false);

  // Keyboard Space / Enter toggles data-pressed
  innerBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(btn.hasAttribute('data-pressed'), true);
  innerBtn.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  assert.equal(btn.hasAttribute('data-pressed'), false);

  // Focus / blur reflects data-focused & data-focus-visible on keyboard modality
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
  innerBtn.dispatchEvent(new Event('focus'));
  assert.equal(btn.hasAttribute('data-focused'), true);
  assert.equal(btn.hasAttribute('data-focus-visible'), true);

  innerBtn.dispatchEvent(new Event('blur'));
  assert.equal(btn.hasAttribute('data-focused'), false);
  assert.equal(btn.hasAttribute('data-focus-visible'), false);

  // Pointerleave clears hover
  innerBtn.dispatchEvent(new Event('pointerleave'));
  assert.equal(btn.hasAttribute('data-hovered'), false);

  // Disabled state reflects data-disabled
  btn.setAttribute('disabled', '');
  assert.equal(btn.hasAttribute('data-disabled'), true);
  btn.removeAttribute('disabled');
  assert.equal(btn.hasAttribute('data-disabled'), false);

  btn.remove();
});

test('Behaviors 4: createRovingFocus handles horizontal/vertical, Home/End, typeahead, and RTL reversal', () => {
  const container = document.createElement('div');
  const items = ['Apple', 'Banana', 'Cherry'].map((label, i) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.setAttribute('tabindex', i === 0 ? '0' : '-1');
    container.appendChild(b);
    return b;
  });
  document.body.appendChild(container);

  let focusedIndex = 0;
  const dispose = createRovingFocus(container, {
    getItems: () => items,
    orientation: 'horizontal',
    onFocusItem: (_el, idx) => {
      focusedIndex = idx;
    },
  });

  // LTR ArrowRight moves forward: 0 -> 1
  items[0].focus();
  container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(focusedIndex, 1);
  assert.equal(items[1].getAttribute('tabindex'), '0');

  // End jumps to last (2), Home jumps to first (0)
  container.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(focusedIndex, 2);
  container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(focusedIndex, 0);

  // Typeahead 'c' jumps to Cherry (2)
  container.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
  assert.equal(focusedIndex, 2);

  // RTL reversal: in dir="rtl", ArrowLeft moves forward (2 -> 0 with loop)
  container.setAttribute('dir', 'rtl');
  assert.equal(isRTL(container), true);
  container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  assert.equal(focusedIndex, 0);

  dispose();
  container.remove();
});

test('Behaviors 5: createDismissableLayer dismisses top-most overlay first on Escape and outside click', () => {
  const outer = document.createElement('div');
  const inner = document.createElement('div');
  const outside = document.createElement('button');
  document.body.append(outer, inner, outside);

  let outerOpen = true;
  let innerOpen = true;
  const dismissed = [];

  const offOuter = createDismissableLayer(outer, {
    isOpen: () => outerOpen,
    onDismiss: (reason) => {
      outerOpen = false;
      dismissed.push(`outer:${reason}`);
    },
  });

  const offInner = createDismissableLayer(inner, {
    isOpen: () => innerOpen,
    onDismiss: (reason) => {
      innerOpen = false;
      dismissed.push(`inner:${reason}`);
    },
  });

  // First Escape closes ONLY the top-most layer (inner)
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.deepEqual(dismissed, ['inner:escape']);
  assert.equal(outerOpen, true);

  // Clicking inside outer does NOT dismiss outer
  outer.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  assert.equal(outerOpen, true);

  // Clicking outside dismisses outer
  outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  assert.deepEqual(dismissed, ['inner:escape', 'outer:outside-click']);

  offInner();
  offOuter();
  outer.remove();
  inner.remove();
  outside.remove();
});

test('Behaviors 6: unstyled attribute enables headless mode without Shadow DOM stylesheets', () => {
  const styledBtn = document.createElement('el-button');
  const headlessBtn = document.createElement('el-button');
  headlessBtn.setAttribute('unstyled', '');
  document.body.append(styledBtn, headlessBtn);

  const styledHasCss =
    (styledBtn.shadowRoot.adoptedStyleSheets?.length || 0) > 0 ||
    Boolean(styledBtn.shadowRoot.querySelector('style'));
  const headlessHasCss =
    (headlessBtn.shadowRoot.adoptedStyleSheets?.length || 0) > 0 ||
    Boolean(headlessBtn.shadowRoot.querySelector('style'));

  assert.equal(styledHasCss, true);
  assert.equal(headlessHasCss, false);
  // Headless button still renders semantic <button part="button"> and press behavior!
  const inner = headlessBtn.shadowRoot.querySelector('button[part="button"]');
  assert.ok(inner);
  inner.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(headlessBtn.hasAttribute('data-pressed'), true);

  styledBtn.remove();
  headlessBtn.remove();
});

test('Behaviors 7: Intl locale formatting works in el-number-flow, el-calendar, and formatters', () => {
  assert.equal(formatLocaleNumber(12345.6, 'en-US'), '12,345.6');
  assert.equal(formatLocaleNumber('not-a-number', 'en-US'), 'not-a-number');
  assert.ok(formatLocaleDate(new Date(2026, 0, 15), 'es-ES', { month: 'long' }).toLowerCase().includes('enero'));

  const numFlow = document.createElement('el-number-flow');
  numFlow.setAttribute('value', '48290');
  numFlow.setAttribute('locale', 'en-US');
  document.body.appendChild(numFlow);
  const wrapper = numFlow.shadowRoot.querySelector('.flow-wrapper');
  assert.equal(wrapper.getAttribute('aria-label'), '48,290');

  const cal = document.createElement('el-calendar');
  cal.setAttribute('value', '2026-01-15');
  cal.setAttribute('locale', 'es-ES');
  document.body.appendChild(cal);
  assert.ok(cal.monthTitle.value.toLowerCase().includes('enero'));

  numFlow.remove();
  cal.remove();
});

test('Behaviors 8: el-code-block and el-pagination announce state updates to live region', async () => {
  clearAnnouncer();
  const codeBlock = document.createElement('el-code-block');
  codeBlock.setAttribute('code', 'npm install @wcomp/elementum');
  codeBlock.setAttribute('copyable', '');
  document.body.appendChild(codeBlock);
  await codeBlock.copyCode();
  assert.equal(document.getElementById('el-live-announcer-polite')?.textContent, 'Code copied to clipboard');

  const pager = document.createElement('el-pagination');
  pager.setAttribute('page', '1');
  pager.setAttribute('total', '50');
  pager.setAttribute('page-size', '10');
  document.body.appendChild(pager);
  pager.setPage(3);
  assert.equal(document.getElementById('el-live-announcer-polite')?.textContent, 'Page 3 of 5');

  codeBlock.remove();
  pager.remove();
});

test('Behaviors 9: createSelectionBehavior supports single, multiple, Shift-range, selectAll, and disabledKeys', () => {
  const keys = ['a', 'b', 'c', 'd', 'e'];
  let lastSize = 0;
  const multi = createSelectionBehavior({
    mode: 'multiple',
    getKeys: () => keys,
    disabledKeys: ['c'],
    onSelectionChange: (set) => {
      lastSize = set.size;
    },
  });

  // Select 'a', then Shift+select 'd' -> selects a, b, d (skips disabled 'c')
  multi.select('a');
  assert.equal(multi.isSelected('a'), true);
  multi.select('d', { shiftKey: true });
  assert.deepEqual([...multi.selectedKeys.value].sort(), ['a', 'b', 'd']);
  assert.equal(multi.isSelected('c'), false);
  assert.equal(lastSize, 3);

  // Toggle 'b' off
  multi.toggle('b');
  assert.equal(multi.isSelected('b'), false);

  // Select all skips disabled 'c'
  multi.selectAll();
  assert.deepEqual([...multi.selectedKeys.value].sort(), ['a', 'b', 'd', 'e']);

  // Clear empties selection
  multi.clear();
  assert.equal(multi.selectedKeys.value.size, 0);

  // Single mode replaces selection & supports toggle
  const single = createSelectionBehavior({ mode: 'single', getKeys: () => keys });
  single.select('a');
  single.select('b');
  assert.deepEqual([...single.selectedKeys.value], ['b']);
  single.toggle('b');
  assert.equal(single.selectedKeys.value.size, 0);
});

test('Behaviors 10: createReorderBehavior supports keyboard grab/move/drop/cancel and pointer drag/drop', () => {
  clearAnnouncer();
  const list = document.createElement('ul');
  const items = ['First', 'Second', 'Third'].map((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    li.setAttribute('tabindex', '0');
    li.setAttribute('draggable', 'true');
    list.appendChild(li);
    return li;
  });
  document.body.appendChild(list);

  const moves = [];
  const dispose = createReorderBehavior(list, {
    getItems: () => items,
    orientation: 'vertical',
    onReorder: ({ fromIndex, toIndex }) => moves.push([fromIndex, toIndex]),
  });

  // 1. Keyboard: Space grabs item 0, ArrowDown moves target to 1, Space drops -> [0, 1]
  items[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  assert.equal(items[0].hasAttribute('data-dragging'), true);
  assert.ok(document.getElementById('el-live-announcer-polite')?.textContent.includes('Grabbed item 1 of 3'));

  items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.equal(items[1].hasAttribute('data-drop-target'), true);

  items[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  assert.equal(items[0].hasAttribute('data-dragging'), false);
  assert.deepEqual(moves, [[0, 1]]);

  // 2. Keyboard Escape cancels reorder without firing onReorder
  items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(moves.length, 1);
  assert.equal(document.getElementById('el-live-announcer-polite')?.textContent, 'Reorder cancelled.');

  // 3. Pointer HTML5 dragstart -> dragover -> drop moves item 2 -> 0
  items[2].dispatchEvent(new Event('dragstart', { bubbles: true }));
  assert.equal(items[2].hasAttribute('data-dragging'), true);
  items[0].dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
  assert.equal(items[0].hasAttribute('data-drop-target'), true);
  items[0].dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
  assert.deepEqual(moves, [[0, 1], [2, 0]]);
  assert.equal(items[2].hasAttribute('data-dragging'), false);

  dispose();
  list.remove();
});
