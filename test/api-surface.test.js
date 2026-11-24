import test from 'node:test';
import assert from 'node:assert/strict';
import '../test-helpers/setup.js';
import '../src/index.js';

test('FACE consistency: formResetCallback resets value and checked signals cleanly', () => {
  const input = document.createElement('el-input');
  input.setAttribute('value', 'initial');
  document.body.appendChild(input);
  input.value.value = 'mutated';
  assert.equal(input.value.value, 'mutated');
  input.formResetCallback();
  assert.equal(input.value.value, 'initial');
  input.remove();

  const sw = document.createElement('el-switch');
  sw.setAttribute('checked', '');
  document.body.appendChild(sw);
  sw.checked.value = false;
  sw.formResetCallback();
  assert.equal(sw.checked.value, true);
  sw.remove();

  const cb = document.createElement('el-checkbox');
  document.body.appendChild(cb);
  cb.checked.value = true;
  cb.formResetCallback();
  assert.equal(cb.checked.value, false);
  cb.remove();
});

test('FACE consistency: formDisabledCallback toggles disabled signal across FACE inputs', () => {
  for (const tag of ['el-input', 'el-textarea', 'el-select', 'el-checkbox', 'el-switch', 'el-slider']) {
    const el = document.createElement(tag);
    document.body.appendChild(el);
    el.formDisabledCallback(true);
    assert.equal(el.disabled.value, true, `${tag} should become disabled on formDisabledCallback(true)`);
    el.formDisabledCallback(false);
    assert.equal(el.disabled.value, false, `${tag} should re-enable on formDisabledCallback(false)`);
    el.remove();
  }
});

test('AI disclosure consistency: el-sources accepts open attribute alongside expanded', () => {
  const el = document.createElement('el-sources');
  el.setAttribute('open', '');
  document.body.appendChild(el);
  assert.equal(el.expanded.value, true);
  el.toggleExpanded();
  assert.equal(el.expanded.value, false);
  assert.equal(el.hasAttribute('open'), false);
  assert.equal(el.hasAttribute('expanded'), false);
  el.toggleExpanded();
  assert.equal(el.expanded.value, true);
  assert.equal(el.hasAttribute('open'), true);
  assert.equal(el.hasAttribute('expanded'), true);
  el.remove();
});
