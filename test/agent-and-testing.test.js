import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../test-helpers/setup.js';

import { snapshot, act, registerWebMCP } from '../src/agent/index.js';
import { checkAriaPattern, checkDirection, checkServerRender } from '../src/testing/index.js';
import '../src/components/el-toggle.js';

import { ElButton } from '../src/components/el-button.js';
import { ElInput } from '../src/components/el-input.js';
import { ElSwitch } from '../src/components/el-switch.js';
import { ElCheckbox } from '../src/components/el-checkbox.js';
import { ElDialog } from '../src/components/el-dialog.js';
import { ElTabs } from '../src/components/el-tabs.js';
import { ElAccordion } from '../src/components/el-accordion.js';
import { ElAutocomplete } from '../src/components/el-autocomplete.js';
import { ElSlider } from '../src/components/el-slider.js';
import { ElProgress } from '../src/components/el-progress.js';
import '../src/components/el-otp-input.js';
import '../src/components/el-number-field.js';
import '../src/components/el-segmented-control.js';
import '../src/components/el-select.js';
import '../src/components/el-datepicker.js';

test('Agent Runtime: snapshot() extracts structured refs/roles/states and act() operates Shadow DOM components', () => {
  const stage = document.createElement('div');
  stage.innerHTML = `
    <el-input id="ag-email" label="Work Email" placeholder="ada@example.com"></el-input>
    <el-switch id="ag-alerts" label="Enable Alerts"></el-switch>
    <el-button id="ag-submit" variant="primary">Save Settings</el-button>
    <el-dialog id="ag-dlg" heading="Confirm"></el-dialog>
  `;
  document.body.appendChild(stage);

  let clicked = false;
  stage.querySelector('#ag-submit').addEventListener('click', () => { clicked = true; });

  const tree = snapshot(stage);
  assert.ok(tree.count >= 4, `Expected >= 4 interactive nodes, got ${tree.count}`);

  const inputNode = tree.nodes.find((n) => n.tag === 'el-input');
  const switchNode = tree.nodes.find((n) => n.tag === 'el-switch');
  const btnNode = tree.nodes.find((n) => n.tag === 'el-button');
  const dlgNode = tree.nodes.find((n) => n.tag === 'el-dialog');

  assert.equal(inputNode.role, 'textbox');
  assert.equal(inputNode.name, 'Work Email');
  assert.equal(switchNode.role, 'switch');
  assert.equal(btnNode.role, 'button');
  assert.equal(dlgNode.role, 'dialog');

  // Operate via ref from snapshot()
  const typeRes = act(stage, { ref: inputNode.ref, action: 'type', value: 'grace@example.com' });
  assert.equal(typeRes.ok, true);
  assert.equal(stage.querySelector('#ag-email').value.value, 'grace@example.com');

  const toggleRes = act(stage, { ref: switchNode.ref, action: 'toggle' });
  assert.equal(toggleRes.ok, true);
  assert.equal(toggleRes.state.checked, true);

  // Operate via semantic role + name
  const clickRes = act(stage, { role: 'button', name: 'Save Settings', action: 'click' });
  assert.equal(clickRes.ok, true);
  assert.equal(clicked, true);

  // Open & close dialog
  const openRes = act(stage, { ref: dlgNode.ref, action: 'open' });
  assert.equal(openRes.ok, true);
  const closeRes = act(stage, { ref: dlgNode.ref, action: 'close' });
  assert.equal(closeRes.ok, true);

  // Focus & press + unknown target error handling
  assert.equal(act(stage, { ref: btnNode.ref, action: 'focus' }).ok, true);
  assert.equal(act(stage, { ref: btnNode.ref, action: 'press', key: 'Enter' }).ok, true);
  assert.equal(act(stage, { ref: '@e999', action: 'click' }).ok, false);
  assert.equal(act(stage, { ref: btnNode.ref, action: 'unknown-op' }).ok, false);

  // Action guard blocks destructive clicks cleanly
  clicked = false;
  const blocked = act(stage, { ref: btnNode.ref, action: 'click' }, { guard: () => false });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.blocked, true);
  assert.equal(clicked, false);

  // registerWebMCP registers & unregisters tools on navigator.modelContext
  const tools = new Map();
  const mockMC = {
    registerTool: (t) => tools.set(t.name, t),
    unregisterTool: (n) => tools.delete(n),
  };
  const reg = registerWebMCP(stage, { modelContext: mockMC });
  assert.equal(reg.registered, true);
  assert.equal(tools.has('elementum_snapshot'), true);
  assert.equal(tools.has('elementum_act'), true);
  assert.ok(tools.get('elementum_snapshot').execute().count >= 4);
  reg.unregister();
  assert.equal(tools.size, 0);

  stage.remove();
});

test('<el-toggle-group> syncs value, single/multiple modes, single-click unselect, and disabled', () => {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <el-toggle-group type="single" value="bold">
      <el-toggle value="bold">B</el-toggle>
      <el-toggle value="italic">I</el-toggle>
      <el-toggle value="underline">U</el-toggle>
    </el-toggle-group>
  `;
  document.body.appendChild(wrap);
  const group = wrap.querySelector('el-toggle-group');
  const [bold, italic, underline] = group.querySelectorAll('el-toggle');

  // Initial value="bold" presses bold immediately
  assert.equal(bold.isPressed.value, true);
  assert.equal(bold.getAttribute('data-state'), 'on');
  assert.equal(italic.isPressed.value, false);

  // Clicking italic in single mode unpresses bold (including data-state="off") in ONE click
  italic.toggle();
  assert.equal(italic.isPressed.value, true);
  assert.equal(bold.isPressed.value, false);
  assert.equal(bold.getAttribute('data-state'), 'off');
  assert.equal(group.value.value, 'italic');

  // Clicking italic again unselects it on the FIRST click
  italic.toggle();
  assert.equal(italic.isPressed.value, false);
  assert.equal(italic.getAttribute('data-state'), 'off');
  assert.equal(group.value.value, '');

  // Switching to type="multiple" allows multiple active toggles
  group.setAttribute('type', 'multiple');
  bold.toggle();
  underline.toggle();
  assert.equal(bold.isPressed.value, true);
  assert.equal(underline.isPressed.value, true);
  assert.equal(group.value.value, 'bold,underline');

  // Setting value attribute updates children directly
  group.setAttribute('value', 'italic,underline');
  assert.equal(bold.isPressed.value, false);
  assert.equal(italic.isPressed.value, true);
  assert.equal(underline.isPressed.value, true);

  // Switching back to type="single" keeps at most one pressed
  group.setAttribute('type', 'single');
  assert.equal(italic.isPressed.value, true);
  assert.equal(underline.isPressed.value, false);

  // Disabled propagates to children
  group.setAttribute('disabled', '');
  assert.equal(bold.disabled.value, true);
  group.removeAttribute('disabled');
  assert.equal(bold.disabled.value, false);

  wrap.remove();
});

test('Reactivity regression: el-otp-input, el-number-field, el-segmented-control, el-select, el-datepicker react to dynamic attributes', () => {
  // 1. el-otp-input: dynamic type="password" and length update cells reactively
  const otp = document.createElement('el-otp-input');
  otp.setAttribute('length', '4');
  document.body.appendChild(otp);
  assert.equal(otp.shadowRoot.querySelectorAll('.otp-cell').length, 4);
  assert.equal(otp.shadowRoot.querySelector('.otp-cell').getAttribute('type'), 'text');
  otp.setAttribute('type', 'password');
  assert.equal(otp.shadowRoot.querySelector('.otp-cell').getAttribute('type'), 'password');
  otp.setAttribute('length', '6');
  assert.equal(otp.shadowRoot.querySelectorAll('.otp-cell').length, 6);
  otp.remove();

  // 2. el-number-field: stepper buttons reactively disable at min/max and on disabled toggle
  const nf = document.createElement('el-number-field');
  nf.setAttribute('value', '5');
  nf.setAttribute('min', '0');
  nf.setAttribute('max', '10');
  document.body.appendChild(nf);
  const dec = nf.shadowRoot.querySelector('.decrement');
  const inc = nf.shadowRoot.querySelector('.increment');
  assert.equal(dec.hasAttribute('disabled'), false);
  assert.equal(inc.hasAttribute('disabled'), false);
  nf.setAttribute('value', '0');
  assert.equal(dec.hasAttribute('disabled'), true);
  nf.setAttribute('value', '10');
  assert.equal(inc.hasAttribute('disabled'), true);
  nf.setAttribute('disabled', '');
  assert.equal(dec.hasAttribute('disabled'), true);
  nf.remove();

  // 3. el-segmented-control: enabled options do NOT get disabled="false" attribute
  const seg = document.createElement('el-segmented-control');
  seg.innerHTML = '<option value="a">A</option><option value="b">B</option>';
  document.body.appendChild(seg);
  const segBtns = seg.shadowRoot.querySelectorAll('.segment-btn');
  assert.equal(segBtns[0].hasAttribute('disabled'), false);
  seg.setAttribute('disabled', '');
  assert.equal(seg.shadowRoot.querySelectorAll('.segment-btn')[0].hasAttribute('disabled'), true);
  seg.remove();

  // 4. el-select: dynamic value and disabled update signals
  const sel = document.createElement('el-select');
  sel.innerHTML = '<option value="a">A</option><option value="b">B</option>';
  document.body.appendChild(sel);
  sel.setAttribute('value', 'b');
  assert.equal(sel.value.value, 'b');
  sel.setAttribute('disabled', '');
  assert.equal(sel.disabled.value, true);
  sel.remove();

  // 5. el-datepicker: dynamic value, placeholder, and disabled update signals
  const dp = document.createElement('el-datepicker');
  document.body.appendChild(dp);
  dp.setAttribute('value', '2026-11-19');
  dp.setAttribute('placeholder', 'Pick a day');
  dp.setAttribute('disabled', '');
  assert.equal(dp.value.value, '2026-11-19');
  assert.equal(dp.placeholder.value, 'Pick a day');
  assert.equal(dp.disabled.value, true);
  dp.remove();
});

test('Testing Contracts: checkAriaPattern validates 9 WAI-ARIA APG patterns across Elementum components', () => {
  const cases = [
    ['button', '<el-button>Submit</el-button>'],
    ['switch', '<el-switch label="Dark Mode"></el-switch>'],
    ['checkbox', '<el-checkbox label="Accept"></el-checkbox>'],
    ['dialog', '<el-dialog heading="Invite"></el-dialog>'],
    ['tabs', '<el-tabs><el-tab label="One" active>1</el-tab><el-tab label="Two">2</el-tab></el-tabs>'],
    ['accordion', '<el-accordion><el-accordion-item title="FAQ 1">Answer 1</el-accordion-item></el-accordion>'],
    ['combobox', '<el-autocomplete label="City"></el-autocomplete>'],
    ['slider', '<el-slider value="50" min="0" max="100"></el-slider>'],
    ['progressbar', '<el-progress value="60" max="100"></el-progress>'],
  ];

  for (const [pattern, markup] of cases) {
    const wrap = document.createElement('div');
    wrap.innerHTML = markup;
    document.body.appendChild(wrap);
    const el = wrap.firstElementChild;
    const result = checkAriaPattern(el, pattern);
    assert.equal(result.ok, true, `ARIA pattern "${pattern}" failed: ${result.violations.join('; ')}`);
    assert.ok(result.passed.length > 0);
    wrap.remove();
  }

  // Unknown pattern reports violation cleanly
  assert.equal(checkAriaPattern(document.createElement('div'), 'nonexistent').ok, false);
  assert.equal(checkAriaPattern(null, 'button').ok, false);
});

test('Testing Contracts: checkDirection verifies provider-free RTL and checkServerRender verifies DSD SSR + XSS escaping', () => {
  const btn = document.createElement('el-button');
  btn.textContent = 'Go';
  document.body.appendChild(btn);
  const dirResult = checkDirection(btn);
  assert.equal(dirResult.ok, true);
  assert.equal(dirResult.ltrDetected, true);
  assert.equal(dirResult.rtlDetected, true);
  btn.remove();

  for (const [tag, Ctor] of [
    ['el-button', ElButton],
    ['el-input', ElInput],
    ['el-switch', ElSwitch],
    ['el-checkbox', ElCheckbox],
    ['el-dialog', ElDialog],
    ['el-tabs', ElTabs],
    ['el-accordion', ElAccordion],
    ['el-autocomplete', ElAutocomplete],
    ['el-slider', ElSlider],
    ['el-progress', ElProgress],
  ]) {
    const ssr = checkServerRender(tag, Ctor);
    assert.equal(ssr.ok, true, `SSR check failed for <${tag}>: ${ssr.violations.join('; ')}`);
  }
});

test('Distributable Agent Skill: skills.sh.json and skills/elementum/SKILL.md are valid and present', () => {
  const manifest = JSON.parse(fs.readFileSync('skills.sh.json', 'utf8'));
  assert.ok(Array.isArray(manifest.skills) && manifest.skills.length >= 1);
  for (const skill of manifest.skills) {
    assert.ok(fs.existsSync(`${skill.path}/SKILL.md`), `Missing ${skill.path}/SKILL.md`);
  }
});
