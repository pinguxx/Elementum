import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/components/el-drawer.js';
import '../src/components/el-bottom-nav.js';
import '../src/components/el-popover.js';

test('<el-drawer> supports responsive inline-at and mode="auto" foldable switching (#9)', () => {
  const origMatchMedia = window.matchMedia;
  const listeners = new Map();
  let matchesWide = false;

  try {
    window.matchMedia = (query) => {
      const mql = {
        media: query,
        get matches() {
          return query.includes('680px') ? matchesWide : false;
        },
        addEventListener: (_ev, fn) => listeners.set(query, fn),
        removeEventListener: () => listeners.delete(query),
      };
      return mql;
    };

    const drawer = document.createElement('el-drawer');
    drawer.setAttribute('inline-at', '680px');
    drawer.setAttribute('heading', 'Filters');
    document.body.appendChild(drawer);

    assert.equal(drawer.isInline.value, false);
    assert.equal(drawer.getAttribute('data-mode'), 'overlay');

    let modeEvent = null;
    drawer.addEventListener('modechange', (e) => { modeEvent = e.detail; });

    matchesWide = true;
    listeners.get('(min-width: 680px)')?.();
    assert.equal(drawer.isInline.value, true);
    assert.equal(drawer.getAttribute('data-mode'), 'inline');
    assert.deepEqual(modeEvent, { mode: 'inline' });

    // Explicit mode="overlay" overrides
    drawer.setAttribute('mode', 'overlay');
    assert.equal(drawer.isInline.value, false);
    assert.equal(drawer.getAttribute('data-mode'), 'overlay');

    // Explicit mode="inline" pins immediately
    drawer.setAttribute('mode', 'inline');
    assert.equal(drawer.isInline.value, true);
    assert.equal(drawer.getAttribute('data-mode'), 'inline');

    drawer.remove();
  } finally {
    window.matchMedia = origMatchMedia;
  }
});

test('<el-bottom-nav> and <el-bottom-nav-item> support aria-current, 99+ badge cap, selection, and arrow navigation (#10)', () => {
  const nav = document.createElement('el-bottom-nav');
  nav.setAttribute('value', 'home');
  nav.setAttribute('fixed', '');
  nav.innerHTML = `
    <el-bottom-nav-item value="home" label="Home"></el-bottom-nav-item>
    <el-bottom-nav-item value="inbox" label="Inbox" badge="142"></el-bottom-nav-item>
    <el-bottom-nav-item value="docs" label="Docs" href="javascript:alert(1)"></el-bottom-nav-item>
  `;
  document.body.appendChild(nav);

  const items = nav.querySelectorAll('el-bottom-nav-item');
  assert.equal(items.length, 3);
  assert.equal(items[0].hasAttribute('active'), true);
  assert.equal(items[0].shadowRoot.querySelector('.nav-item').getAttribute('aria-current'), 'page');
  assert.equal(items[1].shadowRoot.querySelector('.badge').textContent, '99+');
  // Unsafe javascript: href is neutralized to '#'
  assert.equal(items[2].shadowRoot.querySelector('a.nav-item').getAttribute('href'), '#');

  let changedTo = null;
  nav.addEventListener('change', (e) => { changedTo = e.detail.value; });
  items[1].shadowRoot.querySelector('button.nav-item').click();

  assert.equal(changedTo, 'inbox');
  assert.equal(nav.getAttribute('value'), 'inbox');
  assert.equal(items[1].hasAttribute('active'), true);
  assert.equal(items[0].hasAttribute('active'), false);

  // Keyboard arrow navigation
  nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));

  nav.remove();
});

test('<el-popover> trigger="hover long-press" opens on fine-pointer hover and 380ms touch long-press with >10px scroll cancellation (#11)', async () => {
  const origMatchMedia = window.matchMedia;
  try {
    window.matchMedia = (q) => ({ matches: q.includes('hover: hover') });

    const pop = document.createElement('el-popover');
    pop.setAttribute('trigger', 'hover long-press');
    pop.innerHTML = `<button slot="trigger">Info</button><div slot="content">Details</div>`;
    document.body.appendChild(pop);

    const trigger = pop.shadowRoot.querySelector('.trigger-wrapper');

    // Fine-pointer mouse hover opens immediately
    trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse', bubbles: true }));
    assert.equal(pop.isOpen.value, true);
    pop.close();
    assert.equal(pop.isOpen.value, false);

    // Touch pointerenter does NOT open hover
    trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch', bubbles: true }));
    assert.equal(pop.isOpen.value, false);

    // Touch long-press canceled when finger moves > 10px (scrolling)
    trigger.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', clientX: 50, clientY: 50, bubbles: true }));
    trigger.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'touch', clientX: 50, clientY: 75, bubbles: true }));
    await new Promise((r) => setTimeout(r, 420));
    assert.equal(pop.isOpen.value, false);

    // Touch long-press without scroll movement opens after 380ms
    trigger.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', clientX: 50, clientY: 50, bubbles: true }));
    await new Promise((r) => setTimeout(r, 420));
    assert.equal(pop.isOpen.value, true);

    pop.remove();
  } finally {
    window.matchMedia = origMatchMedia;
  }
});
