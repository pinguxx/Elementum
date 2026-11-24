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

test('Form ownership: el.form returns enclosing native <form> or <el-form>', () => {
  const nativeForm = document.createElement('form');
  const input1 = document.createElement('el-input');
  nativeForm.appendChild(input1);
  document.body.appendChild(nativeForm);
  assert.equal(input1.form, nativeForm);
  nativeForm.remove();

  const elForm = document.createElement('el-form');
  const input2 = document.createElement('el-input');
  elForm.appendChild(input2);
  document.body.appendChild(elForm);
  assert.equal(input2.form, elForm);
  elForm.remove();
});

test('ElForm parity: form, elements, toFormData, getFormData, checkValidity, requestSubmit, reset', () => {
  const elForm = document.createElement('el-form');
  elForm.innerHTML = `
    <input name="nativeName" value="Ada" />
    <input type="checkbox" name="nativeUnchecked" value="yes" />
    <input type="checkbox" name="nativeChecked" value="yes" checked />
    <el-input name="elEmail" value="ada@example.com"></el-input>
    <el-checkbox name="elTerms" value="accepted" checked></el-checkbox>
    <el-switch name="elAlerts"></el-switch>
    <el-input name="disabledField" value="skip" disabled></el-input>
  `;
  document.body.appendChild(elForm);

  // Internal <form> accessible via .form
  assert.equal(elForm.form?.tagName, 'FORM');

  // .elements includes both native inputs and Elementum FACE controls
  const tags = elForm.elements.map((e) => e.tagName.toLowerCase());
  assert.ok(tags.includes('input'));
  assert.ok(tags.includes('el-input'));
  assert.ok(tags.includes('el-checkbox'));
  assert.ok(tags.includes('el-switch'));

  // getFormData() and toFormData() omit unchecked checkboxes/switches and disabled controls
  const obj = elForm.getFormData();
  assert.equal(obj.nativeName, 'Ada');
  assert.equal(obj.nativeUnchecked, undefined);
  assert.equal(obj.nativeChecked, 'yes');
  assert.equal(obj.elEmail, 'ada@example.com');
  assert.equal(obj.elTerms, 'accepted');
  assert.equal(obj.elAlerts, undefined);
  assert.equal(obj.disabledField, undefined);

  const fd = elForm.toFormData();
  assert.ok(fd instanceof FormData);
  assert.equal(fd.get('nativeName'), 'Ada');
  assert.equal(fd.get('elEmail'), 'ada@example.com');
  assert.equal(fd.get('elTerms'), 'accepted');
  assert.equal(fd.get('elAlerts'), null);
  assert.equal(fd.get('disabledField'), null);

  // checkValidity() & requestSubmit()
  assert.equal(elForm.checkValidity(), true);
  let submitted = null;
  elForm.addEventListener('form-submit', (e) => {
    submitted = e.detail.data;
  });
  elForm.requestSubmit();
  assert.equal(submitted?.elEmail, 'ada@example.com');

  // reset() restores both native and Elementum controls
  elForm.querySelector('el-input[name="elEmail"]').value.value = 'changed@example.com';
  elForm.reset();
  assert.equal(elForm.querySelector('el-input[name="elEmail"]').value.value, 'ada@example.com');

  elForm.remove();
});
