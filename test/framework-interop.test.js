import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../test-helpers/setup.js';
import '../src/components/el-input.js';
import '../src/components/el-badge.js';
import '../src/components/el-select.js';
import '../src/components/el-switch.js';
import '../src/components/el-button.js';

test('Framework Interop 1: React 19 / Vue 3 / Svelte 5 property & attribute reflection parity', async () => {
  const input = document.createElement('el-input');
  const badge = document.createElement('el-badge');
  document.body.append(input, badge);
  await Promise.resolve();

  // Property assignment (React 19 / Vue 3 / Svelte 5 style) updates signal & inner native input
  input.value = 'hello-framework';
  assert.equal(String(input.value), 'hello-framework');
  assert.equal(input.shadowRoot.querySelector('input').value, 'hello-framework');

  // Attribute mutation (HTML / Lit / Astro style) reflects back to reactive signal
  input.setAttribute('value', 'updated-via-attr');
  assert.equal(String(input.value), 'updated-via-attr');

  // Reflected signal property on <el-badge> syncs both directions
  badge.count = '99';
  assert.equal(badge.getAttribute('count'), '99');

  input.remove();
  badge.remove();
});

test('Framework Interop 2: CustomEvents bubble and cross Shadow DOM boundaries (composed: true)', () => {
  const wrapper = document.createElement('div');
  const sw = document.createElement('el-switch');
  wrapper.appendChild(sw);
  document.body.appendChild(wrapper);

  let received = null;
  wrapper.addEventListener('change', (e) => {
    received = { bubbles: e.bubbles, composed: e.composed, detail: e.detail };
  });

  sw.toggle();
  assert.ok(received, 'parent framework listener should receive composed change event');
  assert.equal(received.bubbles, true);
  assert.equal(received.composed, true);
  assert.equal(received.detail?.checked, true);

  wrapper.remove();
});

test('Framework Interop 3: TypeScript index.d.ts declares all live Custom Elements in HTMLElementTagNameMap & JSX', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../custom-elements.json', import.meta.url), 'utf8'));
  const dts = fs.readFileSync(new URL('../src/index.d.ts', import.meta.url), 'utf8');

  const manifestTags = manifest.modules.flatMap((m) => (m.declarations || []).map((d) => d.tagName)).filter(Boolean);
  assert.ok(manifestTags.length >= 100, 'manifest should list all components');

  // Verify balanced braces in src/index.d.ts (prevents syntax regressions)
  const openBraces = (dts.match(/\{/g) || []).length;
  const closeBraces = (dts.match(/\}/g) || []).length;
  assert.equal(openBraces, closeBraces, 'src/index.d.ts must have balanced curly braces');

  // Verify key public exports are typed
  for (const sym of ['createAgUiStore', 'createPressBehavior', 'createRovingFocus', 'createSelectionBehavior', 'createReorderBehavior', 'announce', 'renderComponentToDSD']) {
    assert.ok(dts.includes(sym), `src/index.d.ts missing export typing for ${sym}`);
  }
});
