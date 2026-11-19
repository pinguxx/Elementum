import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/components/el-navbar.js';
import '../src/components/el-code-block.js';

test('<el-navbar> renders brand, badge, navigation slots, and reactive attributes', () => {
  const nav = document.createElement('el-navbar');
  nav.setAttribute('brand', 'Pulse UI');
  nav.setAttribute('href', '/home');
  nav.setAttribute('badge', 'Beta');
  nav.setAttribute('badge-variant', 'success');
  nav.setAttribute('sticky', '');
  nav.innerHTML = '<a href="#docs" active>Docs</a><a href="#api">API</a>';
  document.body.appendChild(nav);

  const brandText = nav.root.querySelector('.brand-text');
  assert.equal(brandText?.textContent, 'Pulse UI');
  assert.equal(nav.root.querySelector('.brand-link')?.getAttribute('href'), '/home');

  const badgeEl = nav.root.querySelector('el-badge');
  assert.ok(badgeEl, 'Badge should render when badge attribute is non-empty');
  assert.equal(badgeEl.getAttribute('count'), 'Beta');
  assert.equal(badgeEl.getAttribute('variant'), 'success');

  nav.brand = 'Elementum';
  assert.equal(nav.getAttribute('brand'), 'Elementum');
  assert.equal(nav.root.querySelector('.brand-text')?.textContent, 'Elementum');

  nav.remove();
});

test('<el-navbar> mobile menu toggles, emits events, closes on outside click, link click, and Escape', () => {
  const nav = document.createElement('el-navbar');
  nav.setAttribute('brand', 'Elementum');
  nav.innerHTML = '<a href="#home">Home</a><a href="#docs">Docs</a>';
  document.body.appendChild(nav);

  const outside = document.createElement('div');
  document.body.appendChild(outside);

  let lastToggle = null;
  nav.addEventListener('toggle', (e) => {
    lastToggle = e.detail.open;
  });

  const btn = nav.root.querySelector('.mobile-menu-btn');
  const menu = nav.root.querySelector('.nav-links');
  assert.ok(btn && menu);
  assert.equal(btn.getAttribute('aria-expanded'), 'false');
  assert.equal(menu.classList.contains('open'), false);

  // Open via button click
  btn.click();
  assert.equal(nav.open.value, true);
  assert.equal(lastToggle, true);
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
  assert.equal(menu.classList.contains('open'), true);

  // Clicking a slotted navigation link closes mobile menu
  nav.querySelector('a[href="#docs"]').click();
  assert.equal(nav.open.value, false);
  assert.equal(lastToggle, false);

  // Open again and dismiss with Escape key
  btn.click();
  assert.equal(nav.open.value, true);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(nav.open.value, false);

  // Open again and dismiss on outside click
  btn.click();
  assert.equal(nav.open.value, true);
  outside.click();
  assert.equal(nav.open.value, false);

  // Calling closeMenu when already closed is a safe no-op
  nav.closeMenu();
  assert.equal(nav.open.value, false);

  outside.remove();
  nav.remove();
});

test('<el-code-block> renders code, language header, compact mode, slotted fallback, and copies to clipboard', async () => {
  let clipboardText = '';
  const navObj = globalThis.navigator;
  const prevClipboard = navObj.clipboard;
  Object.defineProperty(navObj, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (txt) => {
        clipboardText = txt;
      },
    },
  });

  try {
    const block = document.createElement('el-code-block');
    block.setAttribute('language', 'js');
    block.setAttribute('copyable', '');
    block.setAttribute('code', 'const x = signal(1);');
    document.body.appendChild(block);

    assert.equal(block.root.querySelector('.lang-tag')?.textContent, 'JavaScript');
    assert.equal(block.root.querySelector('code')?.textContent.trim(), 'const x = signal(1);');

    let copiedDetail = null;
    block.addEventListener('copy', (e) => {
      copiedDetail = e.detail;
    });

    const copyBtn = block.root.querySelector('.copy-btn');
    assert.ok(copyBtn);
    await block.copyCode(new MouseEvent('click'));

    assert.equal(clipboardText, 'const x = signal(1);');
    assert.deepEqual(copiedDetail, { code: 'const x = signal(1);' });
    assert.equal(copyBtn.getAttribute('data-copied'), 'true');
    assert.equal(copyBtn.textContent.trim(), 'Copied ✓');

    // Compact mode hides language header and moves copy button inline
    block.setAttribute('compact', '');
    assert.equal(block.root.querySelector('.code-header'), null);
    assert.ok(block.root.querySelector('.inline-actions .copy-btn'));

    // Slotted fallback when code attribute is empty
    const slotted = document.createElement('el-code-block');
    slotted.setAttribute('copyable', '');
    slotted.textContent = 'npm install @wcomp/elementum';
    document.body.appendChild(slotted);
    assert.equal(slotted.getCodeText(), 'npm install @wcomp/elementum');

    block.remove();
    slotted.remove();
  } finally {
    Object.defineProperty(navObj, 'clipboard', {
      configurable: true,
      value: prevClipboard,
    });
  }
});
