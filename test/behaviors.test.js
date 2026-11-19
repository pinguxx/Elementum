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
  splitMatchSegments,
  highlightMatch,
  prefersReducedMotion,
  createPresenceBehavior,
  createFocusRecovery,
  createShortcuts,
  createDisclosureBehavior,
  createPopupPositioner,
  createHistory,
} from '../src/behaviors/index.js';
import '../src/components/el-command.js';
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

test('Behaviors 11: createRovingFocus skips disabled/hidden items, handles dynamic DOM & Unicode typeahead', () => {
  const wrap = document.createElement('div');
  const makeBtn = (text, opts = {}) => {
    const b = document.createElement('button');
    b.textContent = text;
    if (opts.disabled) b.setAttribute('disabled', '');
    if (opts.hidden) b.setAttribute('hidden', '');
    if (opts.displayNone) b.style.display = 'none';
    wrap.appendChild(b);
    return b;
  };

  const b1 = makeBtn('Alpha');
  makeBtn('DisabledItem', { disabled: true });
  makeBtn('HiddenItem', { hidden: true });
  makeBtn('NoneItem', { displayNone: true });
  const b2 = makeBtn('Éclair');
  const b3 = makeBtn('Ñandú');
  document.body.appendChild(wrap);

  let lastEl = null;
  const dispose = createRovingFocus(wrap, {
    getItems: () => [...wrap.querySelectorAll('button')],
    orientation: 'horizontal',
    onFocusItem: (el) => {
      lastEl = el;
    },
  });

  // ArrowRight from Alpha skips disabled, hidden, and display:none straight to Éclair
  b1.focus();
  b1.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(lastEl, b2);

  // Unicode typeahead 'ñ' jumps directly to Ñandú
  b2.dispatchEvent(new KeyboardEvent('keydown', { key: 'ñ', bubbles: true }));
  assert.equal(lastEl, b3);

  // Dynamic insertion works immediately without re-initializing controller
  const b4 = makeBtn('Zebra');
  b3.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(lastEl, b4);

  dispose();
  wrap.remove();
});

test('Behaviors 12: createDismissableLayer cleans up on AbortSignal disconnect and supports 3-level nesting', () => {
  const l1 = document.createElement('div');
  const l2 = document.createElement('div');
  const l3 = document.createElement('div');
  document.body.append(l1, l2, l3);

  const ac3 = new AbortController();
  const order = [];
  let open1 = true;
  let open2 = true;
  let open3 = true;

  const off1 = createDismissableLayer(l1, { isOpen: () => open1, onDismiss: () => { open1 = false; order.push('l1'); } });
  const off2 = createDismissableLayer(l2, { isOpen: () => open2, onDismiss: () => { open2 = false; order.push('l2'); } });
  createDismissableLayer(l3, { isOpen: () => open3, onDismiss: () => { open3 = false; order.push('l3'); }, signal: ac3.signal });

  // Simulate l3 disconnecting via AbortSignal -> Escape should dismiss l2 (now topmost), NOT l3
  ac3.abort();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.deepEqual(order, ['l2']);

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.deepEqual(order, ['l2', 'l1']);

  off1();
  off2();
  l1.remove();
  l2.remove();
  l3.remove();
});

test('Behaviors 13: createReorderBehavior keyboard and pointer produce identical final order', () => {
  const applyMove = (arr, from, to) => {
    const copy = [...arr];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    return copy;
  };

  let kbOrder = ['A', 'B', 'C'];
  let ptrOrder = ['A', 'B', 'C'];

  const makeList = (onMove) => {
    const ul = document.createElement('ul');
    const lis = ['A', 'B', 'C'].map((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      li.setAttribute('tabindex', '0');
      li.setAttribute('draggable', 'true');
      ul.appendChild(li);
      return li;
    });
    document.body.appendChild(ul);
    const dispose = createReorderBehavior(ul, { getItems: () => lis, onReorder: onMove });
    return { ul, lis, dispose };
  };

  const kb = makeList(({ fromIndex, toIndex }) => { kbOrder = applyMove(kbOrder, fromIndex, toIndex); });
  const ptr = makeList(({ fromIndex, toIndex }) => { ptrOrder = applyMove(ptrOrder, fromIndex, toIndex); });

  // Move index 0 -> index 2 via keyboard
  kb.lis[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  kb.lis[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  kb.lis[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  kb.lis[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

  // Move index 0 -> index 2 via pointer DnD
  ptr.lis[0].dispatchEvent(new Event('dragstart', { bubbles: true }));
  ptr.lis[2].dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
  ptr.lis[2].dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));

  assert.deepEqual(kbOrder, ['B', 'C', 'A']);
  assert.deepEqual(ptrOrder, kbOrder);

  kb.dispose();
  ptr.dispose();
  kb.ul.remove();
  ptr.ul.remove();
});

test('Behaviors 14: splitMatchSegments & highlightMatch power <el-command> search highlighting', () => {
  assert.deepEqual(splitMatchSegments('Open Settings', 'set'), [
    { text: 'Open ', match: false },
    { text: 'Set', match: true },
    { text: 'tings', match: false },
  ]);
  assert.equal(highlightMatch('Plain text', ''), 'Plain text');

  const cmd = document.createElement('el-command');
  cmd.setAttribute('inline', '');
  cmd.innerHTML = `
    <el-command-group heading="Actions">
      <el-command-item value="settings">Open Settings</el-command-item>
      <el-command-item value="theme">Toggle Theme</el-command-item>
    </el-command-group>
  `;
  document.body.appendChild(cmd);

  const input = cmd.root.querySelector('.search-input');
  input.value = 'set';
  input.dispatchEvent(new Event('input', { bubbles: true }));

  const item = cmd.querySelector('el-command-item[value="settings"]');
  const mark = item.root.querySelector('mark.match-highlight[part="highlight"]');
  assert.ok(mark, '<el-command-item> should highlight matched text with <mark part="highlight">');
  assert.equal(mark.textContent, 'Set');

  // Clearing query removes highlight and restores default slot
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  assert.equal(item.root.querySelector('mark.match-highlight'), null);

  cmd.remove();
});

test('Behaviors 15: prefersReducedMotion tracks media query changes and cleans up on abort', () => {
  const listeners = new Set();
  const origMatchMedia = window.matchMedia;
  window.matchMedia = () => ({
    matches: false,
    addEventListener: (_type, cb) => listeners.add(cb),
    removeEventListener: (_type, cb) => listeners.delete(cb),
  });

  try {
    const ac = new AbortController();
    const reduced = prefersReducedMotion({ signal: ac.signal });
    assert.equal(reduced.value, false);
    assert.equal(listeners.size, 1);

    // Simulate OS toggling Reduce Motion ON
    for (const cb of listeners) cb({ matches: true });
    assert.equal(reduced.value, true);

    // Aborting cleans up listener
    ac.abort();
    assert.equal(listeners.size, 0);
  } finally {
    window.matchMedia = origMatchMedia;
  }
});

test('Behaviors 16: createPresenceBehavior manages enter/exit lifecycle, getAnimations() wait, and rapid toggle cancellation', async () => {
  const el = document.createElement('div');
  document.body.appendChild(el);

  let resolveExit;
  let mockAnimations = [];
  el.getAnimations = () => mockAnimations;

  let enters = 0;
  let exits = 0;
  const ac = new AbortController();
  const presence = createPresenceBehavior(el, {
    onEnterComplete: () => { enters++; },
    onExitComplete: () => { exits++; },
    signal: ac.signal,
  });

  assert.equal(presence.status.value, 'unmounted');
  assert.equal(presence.mounted.value, false);

  // Open -> entering -> data-starting-style set -> next frame removes it & enters
  presence.setOpen(true);
  assert.equal(presence.status.value, 'entering');
  assert.equal(presence.mounted.value, true);
  assert.equal(el.getAttribute('data-state'), 'open');
  assert.equal(el.hasAttribute('data-starting-style'), true);

  await new Promise((r) => setTimeout(r, 25));
  assert.equal(el.hasAttribute('data-starting-style'), false);
  assert.equal(presence.status.value, 'entered');
  assert.equal(enters, 1);

  // Close with active CSS exit animation -> stays mounted until animation finishes
  mockAnimations = [{
    playState: 'running',
    finished: new Promise((r) => { resolveExit = r; }),
  }];
  presence.setOpen(false);
  assert.equal(presence.status.value, 'exiting');
  assert.equal(presence.mounted.value, true);
  assert.equal(el.hasAttribute('data-ending-style'), true);
  assert.equal(el.getAttribute('data-state'), 'closed');

  await new Promise((r) => setTimeout(r, 25));
  assert.equal(presence.status.value, 'exiting', 'Should remain exiting while animation runs');
  assert.equal(exits, 0);

  // Finish exit animation -> unmounts & clears data-ending-style
  resolveExit();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(presence.status.value, 'unmounted');
  assert.equal(presence.mounted.value, false);
  assert.equal(el.hasAttribute('data-ending-style'), false);
  assert.equal(exits, 1);

  // Rapid close->reopen cancels stale exit
  mockAnimations = [{
    playState: 'running',
    finished: new Promise((r) => { resolveExit = r; }),
  }];
  presence.setOpen(true);
  await new Promise((r) => setTimeout(r, 25));
  presence.setOpen(false);
  presence.setOpen(true); // cancel exit immediately
  resolveExit();
  mockAnimations = [];
  await new Promise((r) => setTimeout(r, 25));
  assert.equal(presence.status.value, 'entered');
  assert.equal(exits, 1, 'Cancelled exit must not invoke onExitComplete');

  ac.abort();
  el.remove();
});

test('Behaviors 17: createFocusRecovery restores focus when focused element is removed or disabled', () => {
  const wrap = document.createElement('div');
  const fallbackBtn = document.createElement('button');
  fallbackBtn.textContent = 'Fallback';
  const tempBtn = document.createElement('button');
  tempBtn.textContent = 'Clear';
  wrap.append(fallbackBtn, tempBtn);
  document.body.appendChild(wrap);

  const ac = new AbortController();
  const recovery = createFocusRecovery(wrap, { fallback: () => fallbackBtn, signal: ac.signal });

  tempBtn.focus();
  tempBtn.dispatchEvent(new Event('focusin', { bubbles: true }));
  tempBtn.remove();

  const restored = recovery.recover();
  assert.equal(restored, true);
  assert.equal(document.activeElement, fallbackBtn);

  ac.abort();
  wrap.remove();
});

test('Behaviors 18: createShortcuts handles Mod+K cross-platform and ignores editable inputs', () => {
  const input = document.createElement('input');
  document.body.appendChild(input);

  let hits = 0;
  const ac = new AbortController();
  createShortcuts(
    document,
    {
      'Mod+K': () => { hits++; },
      'Shift+Escape': () => { hits += 10; },
    },
    { isMac: false, signal: ac.signal }
  );

  // Ignored when dispatched from editable <input>
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  assert.equal(hits, 0);

  // Fires on document when Ctrl+K pressed on non-Mac
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  assert.equal(hits, 1);

  // Fires Shift+Escape
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', shiftKey: true, bubbles: true }));
  assert.equal(hits, 11);

  // Meta+K works when isMac: true
  const acMac = new AbortController();
  let macHits = 0;
  createShortcuts(document, { 'Mod+K': () => { macHits++; } }, { isMac: true, signal: acMac.signal });
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
  assert.equal(macHits, 1);

  ac.abort();
  acMac.abort();
  input.remove();
});

test('Behaviors 19: createDisclosureBehavior wires aria-expanded, aria-controls, and hidden state', () => {
  const btn = document.createElement('button');
  const panel = document.createElement('div');
  document.body.append(btn, panel);

  const states = [];
  const ac = new AbortController();
  const disc = createDisclosureBehavior(btn, panel, {
    initialOpen: false,
    onOpenChange: (open) => states.push(open),
    signal: ac.signal,
  });

  assert.equal(btn.getAttribute('aria-expanded'), 'false');
  assert.equal(btn.getAttribute('aria-controls'), panel.id);
  assert.equal(panel.hidden, true);

  btn.click();
  assert.equal(disc.isOpen.value, true);
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
  assert.equal(panel.hidden, false);
  assert.equal(panel.getAttribute('data-state'), 'open');

  disc.close();
  assert.equal(disc.isOpen.value, false);
  assert.equal(panel.hidden, true);
  assert.deepEqual(states, [true, false]);

  ac.abort();
  btn.remove();
  panel.remove();
});

test('Behaviors 20: createPopupPositioner computes coordinates and flips on viewport collision', () => {
  const anchor = document.createElement('button');
  const floating = document.createElement('div');
  document.body.append(anchor, floating);

  // Simulate anchor near bottom of viewport -> should flip from bottom to top
  anchor.getBoundingClientRect = () => ({ top: 700, bottom: 732, left: 100, right: 220, width: 120, height: 32 });
  floating.getBoundingClientRect = () => ({ width: 200, height: 180, top: 0, left: 0, right: 200, bottom: 180 });

  const ac = new AbortController();
  const pos = createPopupPositioner(anchor, floating, { placement: 'bottom', offset: 8, flip: true, signal: ac.signal });
  const metrics = pos.update();

  assert.equal(metrics.side, 'top');
  assert.equal(floating.getAttribute('data-side'), 'top');
  assert.equal(floating.style.getPropertyValue('--anchor-width'), '120px');

  // Simulate anchor near top -> stays bottom
  anchor.getBoundingClientRect = () => ({ top: 40, bottom: 72, left: 100, right: 220, width: 120, height: 32 });
  const metrics2 = pos.update();
  assert.equal(metrics2.side, 'bottom');

  ac.abort();
  anchor.remove();
  floating.remove();
});

test('Behaviors 21: createHistory manages undo/redo stacks, max limit, and reset', () => {
  const h = createHistory('v0', { limit: 2 });
  assert.equal(h.state.value, 'v0');
  assert.equal(h.canUndo.value, false);
  assert.equal(h.canRedo.value, false);

  h.push('v1');
  h.push('v2');
  h.push('v3'); // exceeds limit 2 -> v0 evicted
  assert.equal(h.state.value, 'v3');
  assert.deepEqual(h.past.value, ['v1', 'v2']);
  assert.equal(h.canUndo.value, true);

  assert.equal(h.undo(), true);
  assert.equal(h.state.value, 'v2');
  assert.equal(h.canRedo.value, true);

  assert.equal(h.redo(), true);
  assert.equal(h.state.value, 'v3');
  assert.equal(h.redo(), false);

  h.reset('fresh');
  assert.equal(h.state.value, 'fresh');
  assert.equal(h.canUndo.value, false);
  assert.equal(h.canRedo.value, false);
});
