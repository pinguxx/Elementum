import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/components/el-navbar.js';
import { ElCodeBlock } from '../src/components/el-code-block.js';
import { renderComponentToDSD } from '../src/ssr.js';

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

test('<el-code-block> highlights js, html, css, json, and bash without changing code textContent', () => {
  const cases = [
    {
      language: 'js',
      code: '// line\n/* block */\nconst n = 42;\nconst s = "hi\\"";\nfoo(n);',
      expectedTokens: ['.tok-comment', '.tok-keyword', '.tok-number', '.tok-string', '.tok-fn'],
    },
    {
      language: 'html',
      code: '<!-- note -->\n<el-button variant="primary" disabled>Go</el-button>',
      expectedTokens: ['.tok-comment', '.tok-tag', '.tok-attr', '.tok-string'],
    },
    {
      language: 'css',
      code: '/* theme */\n:root { --el-code-bg: #0f172a; color: var(--fg); padding: 12px; }',
      expectedTokens: ['.tok-comment', '.tok-keyword', '.tok-attr', '.tok-number', '.tok-fn'],
    },
    {
      language: 'json',
      code: '{"ok": true, "count": -5, "msg": "ready"}',
      expectedTokens: ['.tok-attr', '.tok-keyword', '.tok-number', '.tok-string'],
    },
    {
      language: 'bash',
      code: '# install\nnpm install --save-dev $PKG 2',
      expectedTokens: ['.tok-comment', '.tok-keyword', '.tok-attr', '.tok-number'],
    },
  ];

  for (const c of cases) {
    const el = document.createElement('el-code-block');
    el.setAttribute('language', c.language);
    el.setAttribute('code', c.code);
    document.body.appendChild(el);

    const codeEl = el.root.querySelector('code');
    assert.equal(codeEl?.textContent, c.code, `Exact text preserved for ${c.language}`);
    for (const sel of c.expectedTokens) {
      assert.ok(codeEl?.querySelector(sel), `Expected ${sel} in ${c.language} highlight`);
    }
    el.remove();
  }
});

test('<el-code-block> auto-dedents slotted text, reacts to slotchange, and supports <template> children cleanly', () => {
  const slotted = document.createElement('el-code-block');
  slotted.setAttribute('language', 'js');
  slotted.textContent = '\n    const a = 1;\n    const b = 2;\n  ';
  document.body.appendChild(slotted);

  assert.equal(slotted.getCodeText(), 'const a = 1;\nconst b = 2;');
  assert.equal(slotted.root.querySelector('code')?.textContent, 'const a = 1;\nconst b = 2;');
  assert.ok(slotted.root.querySelector('.tok-keyword'));

  // slotchange updates highlighted output
  slotted.textContent = '\n      let updated = 99;\n    ';
  slotted.root.querySelector('slot')?.dispatchEvent(new Event('slotchange'));
  assert.equal(slotted.getCodeText(), 'let updated = 99;');
  assert.equal(slotted.root.querySelector('code')?.textContent, 'let updated = 99;');
  slotted.remove();

  // <template> child exposes raw HTML markup without manually escaping &lt;
  const host = document.createElement('div');
  host.innerHTML = `<el-code-block language="html">
    <template>
      <el-button variant="primary">Click</el-button>
    </template>
  </el-code-block>`;
  document.body.appendChild(host);
  const tplBlock = host.firstElementChild;
  assert.equal(tplBlock.getCodeText(), '<el-button variant="primary">Click</el-button>');
  assert.ok(tplBlock.root.querySelector('.tok-tag'));
  assert.ok(tplBlock.root.querySelector('.tok-attr'));
  assert.ok(tplBlock.root.querySelector('.tok-string'));
  host.remove();
});

test('<el-code-block> prevents XSS injection and emits highlighted DSD SSR markup', () => {
  const xss = document.createElement('el-code-block');
  xss.setAttribute('language', 'html');
  xss.setAttribute('code', '<script>alert(1)</script>');
  document.body.appendChild(xss);

  const codeEl = xss.root.querySelector('code');
  assert.equal(xss.root.querySelector('script'), null);
  assert.equal(codeEl?.textContent, '<script>alert(1)</script>');
  xss.remove();

  const dsd = renderComponentToDSD('el-code-block', ElCodeBlock, {
    language: 'js',
    code: 'const x = 1;',
  });
  assert.ok(dsd.includes('--el-code-bg'));
  assert.ok(dsd.includes('<span class="tok-keyword">const</span>'));
});
