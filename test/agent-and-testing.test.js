import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../test-helpers/setup.js';

import { snapshot, act } from '../src/agent/index.js';
import { checkAriaPattern, checkDirection, checkServerRender } from '../src/testing/index.js';

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

  stage.remove();
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
