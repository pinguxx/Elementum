import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ElInput } from '../src/components/el-input.js';
import { ElSelect } from '../src/components/el-select.js';
import { ElDatepicker } from '../src/components/el-datepicker.js';
import { ElSwitch } from '../src/components/el-switch.js';
import { ElDialog } from '../src/components/el-dialog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverScript = path.resolve(__dirname, '..', 'mcp', 'server.js');

test('<el-input> constraint validation and validity state', () => {
  const input = document.createElement('el-input');
  input.setAttribute('required', '');
  input.setAttribute('pattern', '[0-9]{3}');
  document.body.appendChild(input);

  // 1. Value is missing
  assert.equal(input.checkValidity(), false);
  assert.equal(input.validity?.valueMissing, true);
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.ok(input.validationMessage.length > 0);

  // 2. Value does not match pattern
  input.value.value = 'abc';
  input.validate();
  assert.equal(input.checkValidity(), false);
  assert.equal(input.validity?.patternMismatch, true);

  // 3. Valid value
  input.value.value = '123';
  input.validate();
  assert.equal(input.checkValidity(), true);
  assert.equal(input.hasAttribute('aria-invalid'), false);

  // 4. Test minlength constraint
  input.pattern.value = '';
  input.setAttribute('minlength', '5');
  input.attributeChanged('minlength', null, '5');
  input.value.value = '12';
  input.validate();
  assert.equal(input.checkValidity(), false);
  assert.equal(input.validity?.tooShort, true);

  input.value.value = '12345';
  input.validate();
  assert.equal(input.checkValidity(), true);

  // 5. Custom validity and reportValidity
  input.setCustomValidity('Custom error message');
  assert.equal(input.checkValidity(), false);
  assert.equal(input.reportValidity(), false);
  assert.equal(input.validity?.customError, true);
  assert.equal(input.validationMessage, 'Custom error message');

  input.setCustomValidity('');
  assert.equal(input.checkValidity(), true);
  assert.equal(input.reportValidity(), true);

  document.body.removeChild(input);
});

test('<el-select> constraint validation with required attribute', () => {
  const select = document.createElement('el-select');
  select.setAttribute('required', '');
  select.innerHTML = `
    <option value="">Choose...</option>
    <option value="first">First</option>
  `;
  document.body.appendChild(select);

  // Initially empty value
  select.value.value = '';
  select.validate();
  assert.equal(select.checkValidity(), false);
  assert.equal(select.validity?.valueMissing, true);
  assert.equal(select.getAttribute('aria-invalid'), 'true');

  // Selected valid value
  select.value.value = 'first';
  select.validate();
  assert.equal(select.checkValidity(), true);
  assert.equal(select.hasAttribute('aria-invalid'), false);

  document.body.removeChild(select);
});

test('<el-datepicker> constraint validation with required attribute', () => {
  const picker = document.createElement('el-datepicker');
  picker.setAttribute('required', '');
  document.body.appendChild(picker);

  // Empty value
  picker.value.value = '';
  picker.validate();
  assert.equal(picker.checkValidity(), false);
  assert.equal(picker.validity?.valueMissing, true);
  assert.equal(picker.getAttribute('aria-invalid'), 'true');

  // Selected date
  picker.value.value = '2026-11-10';
  picker.validate();
  assert.equal(picker.checkValidity(), true);
  assert.equal(picker.hasAttribute('aria-invalid'), false);

  document.body.removeChild(picker);
});

test('<el-switch> constraint validation with required attribute', () => {
  const elSwitch = document.createElement('el-switch');
  elSwitch.setAttribute('required', '');
  document.body.appendChild(elSwitch);

  // Initially unchecked
  assert.equal(elSwitch.checkValidity(), false);
  assert.equal(elSwitch.validity?.valueMissing, true);
  assert.equal(elSwitch.getAttribute('aria-invalid'), 'true');

  // Toggled on
  elSwitch.checked.value = true;
  elSwitch.validate();
  assert.equal(elSwitch.checkValidity(), true);
  assert.equal(elSwitch.hasAttribute('aria-invalid'), false);

  document.body.removeChild(elSwitch);
});

test('<el-dialog> WCAG 2.2 focus restoration on close', () => {
  const launcher = document.createElement('button');
  launcher.textContent = 'Open Dialog';
  document.body.appendChild(launcher);
  launcher.focus();

  const dialog = document.createElement('el-dialog');
  dialog.setAttribute('title', 'Accessible Modal');
  dialog.innerHTML = '<p>Dialog body</p>';
  document.body.appendChild(dialog);

  // Show modal
  dialog.showModal();
  assert.equal(dialog.isOpen.value, true);

  // Close modal
  dialog.close('ok');
  assert.equal(dialog.isOpen.value, false);
  assert.equal(document.activeElement, launcher);

  document.body.removeChild(dialog);
  document.body.removeChild(launcher);
});

test('MCP server scaffold_component and validate_accessibility tools', async () => {
  const proc = spawn('node', [serverScript], { stdio: ['pipe', 'pipe', 'inherit'] });

  const send = (msg) => {
    proc.stdin.write(JSON.stringify(msg) + '\n');
  };

  const readResponse = () =>
    new Promise((resolve) => {
      proc.stdout.once('data', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });

  // 1. Call scaffold_component
  send({
    jsonrpc: '2.0',
    id: 10,
    method: 'tools/call',
    params: {
      name: 'scaffold_component',
      arguments: {
        tag: 'el-avatar',
        formAssociated: false,
        attributes: ['src', 'alt', 'size'],
      },
    },
  });

  const scaffoldRes = await readResponse();
  const scaffoldData = JSON.parse(scaffoldRes.result.content[0].text);
  assert.equal(scaffoldData.tag, 'el-avatar');
  assert.equal(scaffoldData.className, 'ElAvatar');
  assert.ok(scaffoldData.code.includes('class ElAvatar extends Elementum'));
  assert.ok(scaffoldData.code.includes("observedAttributes = ['src', 'alt', 'size']"));

  // 2. Call validate_accessibility with invalid markup
  send({
    jsonrpc: '2.0',
    id: 11,
    method: 'tools/call',
    params: {
      name: 'validate_accessibility',
      arguments: {
        markup: '<el-input placeholder="Search..."></el-input><el-button></el-button><img src="pic.jpg">',
      },
    },
  });

  const a11yRes = await readResponse();
  const a11yData = JSON.parse(a11yRes.result.content[0].text);
  assert.equal(a11yData.valid, false);
  assert.ok(a11yData.violationsCount >= 3);
  assert.ok(a11yData.violations.some((v) => v.criterion.includes('4.1.2')));
  assert.ok(a11yData.violations.some((v) => v.criterion.includes('1.1.1')));

  // 3. Call validate_accessibility with valid markup
  send({
    jsonrpc: '2.0',
    id: 12,
    method: 'tools/call',
    params: {
      name: 'validate_accessibility',
      arguments: {
        markup: '<el-input aria-label="Search items" placeholder="Search..."></el-input><el-button aria-label="Submit search">Go</el-button><img src="pic.jpg" alt="Profile avatar">',
      },
    },
  });

  const validRes = await readResponse();
  const validData = JSON.parse(validRes.result.content[0].text);
  assert.equal(validData.valid, true);
  assert.equal(validData.violationsCount, 0);

  proc.kill();
});
