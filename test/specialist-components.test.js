import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ElNumberFlow } from '../src/components/el-number-flow.js';
import { ElOtpInput } from '../src/components/el-otp-input.js';
import { ElCommand, ElCommandGroup, ElCommandItem } from '../src/components/el-command.js';
import { ElPromptInput } from '../src/components/el-prompt-input.js';
import { ElReasoningCard } from '../src/components/el-reasoning-card.js';
import { ElBorderBeam } from '../src/components/el-border-beam.js';
import { ElStreamingText } from '../src/components/el-streaming-text.js';
import { ElChart } from '../src/components/el-chart.js';
import { ElField } from '../src/components/el-field.js';
import { ElNumberField } from '../src/components/el-number-field.js';
import { ElInput } from '../src/components/el-input.js';

test('<el-number-flow> renders rolling digits, prefixes, and suffixes reactively', () => {
  const el = document.createElement('el-number-flow');
  el.setAttribute('value', '125');
  el.setAttribute('prefix', '$');
  el.setAttribute('suffix', '/mo');
  document.body.appendChild(el);

  assert.equal(el.value.value, '125');
  assert.equal(el.prefix.value, '$');
  assert.equal(el.suffix.value, '/mo');

  const root = el.root;
  assert.ok(root.querySelector('.prefix'));
  assert.equal(root.querySelector('.prefix').textContent, '$');
  assert.ok(root.querySelector('.suffix'));
  assert.equal(root.querySelector('.suffix').textContent, '/mo');

  const reels = Array.from(root.querySelectorAll('.digit-reel'));
  assert.equal(reels.length, 3); // 1, 2, 5

  // Change value reactively (same length) — must reuse existing DOM nodes so CSS transitions fire
  el.setAttribute('value', '987');
  const reelsSameLen = Array.from(el.root.querySelectorAll('.digit-reel'));
  assert.equal(reelsSameLen.length, 3);
  assert.strictEqual(reelsSameLen[0], reels[0], 'Digit column 0 DOM node must persist');
  assert.strictEqual(reelsSameLen[1], reels[1], 'Digit column 1 DOM node must persist');
  assert.strictEqual(reelsSameLen[2], reels[2], 'Digit column 2 DOM node must persist');
  assert.equal(reelsSameLen[0].style.transform, 'translateY(-11.25em)');

  // Change value reactively (growing length) — right-aligned digits must persist
  el.setAttribute('value', '1250');
  const reelsGrown = Array.from(el.root.querySelectorAll('.digit-reel'));
  assert.equal(reelsGrown.length, 4);
  assert.strictEqual(reelsGrown[1], reels[0], 'Right-aligned digit column should persist when length grows');

  // Change value reactively (shrinking length + static char)
  el.setAttribute('value', '9.5');
  assert.equal(el.root.querySelectorAll('.digit-reel').length, 2);
  assert.equal(el.root.querySelectorAll('.static-char').length, 1);
  assert.equal(el.root.querySelector('.static-char').textContent, '.');

  // Animated attribute disables CSS transition duration
  el.setAttribute('animated', 'false');
  assert.equal(el.animated.value, false);
  assert.ok(el.root.querySelector('.flow-wrapper').getAttribute('style').includes('--flow-duration: 0ms'));
  el.setAttribute('animated', 'true');
  assert.equal(el.animated.value, true);
  assert.ok(el.root.querySelector('.flow-wrapper').getAttribute('style').includes('--flow-duration: 400ms'));

  document.body.removeChild(el);
});

test('<el-otp-input> handles cell inputs, paste splitting, backspace, and form integration', () => {
  const otp = document.createElement('el-otp-input');
  otp.setAttribute('length', '4');
  otp.setAttribute('name', 'otp_code');
  document.body.appendChild(otp);

  assert.equal(otp.length.value, 4);
  const inputs = Array.from(otp.root.querySelectorAll('input'));
  assert.equal(inputs.length, 4);

  let completeData = null;
  otp.addEventListener('complete', (e) => {
    completeData = e.detail;
  });

  // Type in cell 0
  inputs[0].value = '4';
  inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
  assert.equal(otp.value.value, '4');

  // Type in cell 1
  inputs[1].value = '8';
  inputs[1].dispatchEvent(new Event('input', { bubbles: true }));

  // Backspace on cell 1 moves focus back
  const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true });
  inputs[1].dispatchEvent(backspaceEvent);

  // Paste handling: paste '9876' into first cell
  const pasteEvent = new Event('paste', { bubbles: true });
  pasteEvent.clipboardData = {
    getData: (type) => (type === 'text' || type === 'text/plain' ? '9876' : '')
  };
  inputs[0].dispatchEvent(pasteEvent);

  assert.equal(otp.value.value, '9876');
  assert.deepEqual(completeData, { value: '9876' });

  // Clear method
  otp.clear();
  assert.equal(otp.value.value, '');

  // Form Reset
  otp.value.value = '1234';
  otp.formResetCallback();
  assert.equal(otp.value.value, '');

  // Focus and blur
  otp.focus();
  otp.blur();

  // Disabled and type attributes
  otp.setAttribute('disabled', '');
  assert.equal(otp.disabled.value, true);
  otp.removeAttribute('disabled');
  assert.equal(otp.disabled.value, false);

  otp.setAttribute('type', 'password');
  assert.equal(otp.type.value, 'password');

  document.body.removeChild(otp);
});

test('<el-command> handles keyboard shortcut, fuzzy search filtering, and item selection', () => {
  const cmd = document.createElement('el-command');
  cmd.innerHTML = `
    <el-command-group heading="Actions">
      <el-command-item value="deploy" shortcut="⌘D">Deploy Project</el-command-item>
      <el-command-item value="settings" shortcut="⌘,">Settings</el-command-item>
    </el-command-group>
    <el-command-group heading="Links">
      <el-command-item value="docs">Documentation</el-command-item>
    </el-command-group>
  `;
  document.body.appendChild(cmd);

  assert.equal(cmd.open.value, false);

  // Open command palette
  cmd.show();
  assert.equal(cmd.open.value, true);

  // Search filtering
  cmd.query.value = 'sett';
  const input = cmd.root.querySelector('.search-input');
  input.value = 'sett';
  input.dispatchEvent(new Event('input', { bubbles: true }));

  const items = Array.from(cmd.querySelectorAll('el-command-item'));
  const settingsItem = items.find((i) => i.value.value === 'settings');
  const deployItem = items.find((i) => i.value.value === 'deploy');

  assert.equal(settingsItem.style.display, 'flex');
  assert.equal(deployItem.style.display, 'none');

  // Clear query
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  assert.equal(deployItem.style.display, 'flex');

  // Verify ARIA 1.2 Combobox / Listbox structure
  assert.equal(input.getAttribute('role'), 'combobox');
  assert.equal(input.getAttribute('aria-autocomplete'), 'list');
  const listbox = cmd.root.querySelector('.command-list');
  assert.equal(listbox.getAttribute('role'), 'listbox');
  assert.equal(deployItem.getAttribute('role'), 'option');

  // Keyboard navigation: ArrowDown, ArrowUp, Enter
  cmd.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.ok(items.some((i) => i.active.value));
  assert.ok(input.getAttribute('aria-activedescendant'));

  let selectedEvent = null;
  cmd.addEventListener('select', (e) => {
    selectedEvent = e.detail;
  });

  cmd.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.ok(selectedEvent);
  assert.equal(cmd.open.value, false); // Selecting an item automatically closes palette

  // Toggle and close
  cmd.toggle();
  assert.equal(cmd.open.value, true);
  cmd.close();
  assert.equal(cmd.open.value, false);

  // Global shortcut trigger (⌘K / Ctrl+K)
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  assert.equal(cmd.open.value, true);
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  assert.equal(cmd.open.value, false);

  document.body.removeChild(cmd);
});

test('<el-prompt-input> auto-resizes, handles Enter submit, and resets on demand', () => {
  const prompt = document.createElement('el-prompt-input');
  prompt.setAttribute('placeholder', 'Ask a question...');
  prompt.setAttribute('max-rows', '6');
  prompt.setAttribute('min-rows', '2');
  document.body.appendChild(prompt);

  assert.equal(prompt.placeholder.value, 'Ask a question...');
  assert.equal(prompt.maxRows.value, 6);
  assert.equal(prompt.minRows.value, 2);

  const textarea = prompt.root.querySelector('textarea');
  assert.ok(textarea);

  let submittedValue = null;
  prompt.addEventListener('submit', (e) => {
    submittedValue = e.detail.value;
  });

  // Type message
  textarea.value = 'Refactor UI components to follow design tokens';
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  assert.equal(prompt.value.value, 'Refactor UI components to follow design tokens');

  // Press Enter to submit
  textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(submittedValue, 'Refactor UI components to follow design tokens');
  assert.equal(prompt.value.value, ''); // Cleared on submit

  // Shift+Enter should NOT submit
  textarea.value = 'Line 1';
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  submittedValue = null;
  textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }));
  assert.equal(submittedValue, null);

  // Direct submit() call
  prompt.value.value = 'Test prompt';
  prompt.submit();
  assert.equal(submittedValue, 'Test prompt');

  // Focus & Blur & Reset
  prompt.focus();
  prompt.blur();
  prompt.value.value = 'Dirty input';
  prompt.formResetCallback();
  assert.equal(prompt.value.value, '');

  document.body.removeChild(prompt);
});

test('<el-reasoning-card> toggles thinking state, duration badge, and accordion disclosure', () => {
  const card = document.createElement('el-reasoning-card');
  card.setAttribute('duration', '8.4s');
  card.setAttribute('summary', 'Analyzing design patterns');
  card.setAttribute('thinking', '');
  card.innerHTML = `<p>Step 1: Inspected tokens</p>`;
  document.body.appendChild(card);

  assert.equal(card.open.value, false);
  assert.equal(card.thinking.value, true);
  assert.equal(card.duration.value, '8.4s');
  assert.equal(card.summary.value, 'Analyzing design patterns');

  let toggleDetail = null;
  card.addEventListener('toggle', (e) => {
    toggleDetail = e.detail;
  });

  // Toggle open
  card.toggle();
  assert.equal(card.open.value, true);
  assert.ok(card.hasAttribute('open'));
  assert.deepEqual(toggleDetail, { open: true });

  // Toggle closed
  const headerBtn = card.root.querySelector('.header-btn');
  headerBtn.click();
  assert.equal(card.open.value, false);
  assert.ok(!card.hasAttribute('open'));
  assert.deepEqual(toggleDetail, { open: false });

  // Remove thinking attribute
  card.removeAttribute('thinking');
  assert.equal(card.thinking.value, false);

  document.body.removeChild(card);
});

test('<el-border-beam> accepts size, duration, colors, and reverse attributes', () => {
  const beam = document.createElement('el-border-beam');
  beam.setAttribute('size', '90');
  beam.setAttribute('duration', '5');
  beam.setAttribute('color-from', '#ff0055');
  beam.setAttribute('color-to', '#00ffcc');
  beam.setAttribute('border-width', '2');
  beam.setAttribute('reverse', '');
  document.body.appendChild(beam);

  assert.equal(beam.size.value, 90);
  assert.equal(beam.duration.value, 5);
  assert.equal(beam.colorFrom.value, '#ff0055');
  assert.equal(beam.colorTo.value, '#00ffcc');
  assert.equal(beam.borderWidth.value, 2);
  assert.equal(beam.reverse.value, true);

  const track = beam.root.querySelector('.beam-track');
  assert.ok(track);

  document.body.removeChild(beam);
});

test('<el-streaming-text> streams tokens with events and controls', async () => {
  const stream = document.createElement('el-streaming-text');
  stream.setAttribute('text', 'Hello world');
  stream.setAttribute('speed', '5');
  stream.setAttribute('auto-start', 'false');
  document.body.appendChild(stream);

  assert.equal(stream.text.value, 'Hello world');
  assert.equal(stream.isStreaming.value, false);

  let started = false;
  let ended = false;
  stream.addEventListener('stream-start', () => (started = true));
  stream.addEventListener('stream-end', () => (ended = true));

  stream.start();
  assert.equal(started, true);
  assert.equal(stream.isStreaming.value, true);

  // Pause and resume
  stream.pause();
  assert.equal(stream.isStreaming.value, false);
  stream.resume();
  assert.equal(stream.isStreaming.value, true);

  // Finish immediately
  stream.finish();
  assert.equal(ended, true);
  assert.equal(stream.displayedText.value, 'Hello world');
  assert.equal(stream.isComplete.value, true);

  document.body.removeChild(stream);
});

test('<el-chart> renders native SVG charts, supports area/bar/line, and handles tooltips and keyboard navigation', () => {
  const chart = document.createElement('el-chart');
  chart.setAttribute('type', 'area');
  chart.setAttribute('x-key', 'month');
  chart.setAttribute('y-key', 'desktop');
  chart.setAttribute('secondary-key', 'mobile');
  chart.setAttribute('height', '240');
  document.body.appendChild(chart);

  const sampleData = [
    { month: 'Jan', desktop: 186, mobile: 80 },
    { month: 'Feb', desktop: 305, mobile: 200 },
    { month: 'Mar', desktop: 237, mobile: 120 }
  ];

  // Set data property
  chart.data = sampleData;
  assert.equal(chart.data.length, 3);

  const root = chart.root;
  const svg = root.querySelector('svg');
  assert.ok(svg, 'SVG element rendered');

  // Verify paths rendered for area/line
  assert.ok(root.querySelector('.series-primary-area'));
  assert.ok(root.querySelector('.series-primary-stroke'));
  assert.ok(root.querySelector('.series-secondary-stroke'));

  // Switch to bar mode
  chart.setAttribute('type', 'bar');
  const bars = root.querySelectorAll('.bar-rect');
  assert.ok(bars.length >= 3, 'Bar rectangles rendered');

  // Switch to line mode
  chart.setAttribute('type', 'line');
  assert.ok(root.querySelector('.series-primary-stroke'));

  // Test keyboard navigation for interactive tooltip
  const container = root.querySelector('.chart-container');
  container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  let tooltip = root.querySelector('.chart-tooltip');
  assert.ok(tooltip, 'Tooltip appears on ArrowRight');
  assert.ok(tooltip.textContent.includes('Jan') || tooltip.textContent.includes('Feb'));

  container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
  container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(root.querySelector('.chart-tooltip'), null, 'Tooltip dismissed on Escape');

  // Test hover interaction
  const hitColumn = root.querySelector('.hit-column');
  if (hitColumn) {
    hitColumn.dispatchEvent(new MouseEvent('mouseenter'));
    assert.ok(root.querySelector('.chart-tooltip'), 'Tooltip appears on hover');
    container.dispatchEvent(new MouseEvent('mouseleave'));
    assert.equal(root.querySelector('.chart-tooltip'), null, 'Tooltip dismissed on mouseleave');
  }

  // Test setting data as JSON string attribute
  chart.setAttribute('data', JSON.stringify([
    { month: 'Q1', desktop: 50 },
    { month: 'Q2', desktop: 75 }
  ]));
  assert.equal(chart.data.length, 2);

  // Test empty data fallback
  chart.data = [];
  assert.ok(root.textContent.includes('No chart data available'));

  document.body.removeChild(chart);
});

test('<el-field> wires label, description, error, and ARIA attributes to slotted controls', async () => {
  const field = document.createElement('el-field');
  field.setAttribute('label', 'Workspace Subdomain');
  field.setAttribute('description', 'Your unique URL handle');
  field.setAttribute('required', '');

  const input = document.createElement('el-input');
  input.setAttribute('placeholder', 'acme');
  field.appendChild(input);

  document.body.appendChild(field);

  assert.equal(field.label.value, 'Workspace Subdomain');
  assert.equal(field.description.value, 'Your unique URL handle');
  assert.equal(field.required.value, true);

  const root = field.root;
  const labelEl = root.querySelector('.field-label');
  assert.ok(labelEl);
  assert.ok(labelEl.textContent.includes('Workspace Subdomain'));
  assert.ok(labelEl.querySelector('.required-indicator, .required-asterisk'));

  const descEl = root.querySelector('.field-description');
  assert.ok(descEl);
  assert.equal(descEl.textContent.trim(), 'Your unique URL handle');

  // Wire attributes
  assert.ok(input.getAttribute('aria-labelledby'));
  assert.ok(input.getAttribute('aria-describedby'));

  // Test error display
  field.setAttribute('error', 'Subdomain is already taken');
  assert.equal(field.error.value, 'Subdomain is already taken');
  assert.equal(field.getAttribute('data-invalid'), '');
  const errEl = root.querySelector('.field-error');
  assert.ok(errEl);
  assert.ok(errEl.textContent.includes('already taken'));

  document.body.removeChild(field);
});

test('<el-number-field> stepUp, stepDown, precision clamping, keyboard controls, and form association', () => {
  const numField = document.createElement('el-number-field');
  numField.setAttribute('value', '10');
  numField.setAttribute('min', '0');
  numField.setAttribute('max', '20');
  numField.setAttribute('step', '2');
  numField.setAttribute('precision', '1');
  document.body.appendChild(numField);

  assert.equal(numField.value.value, 10);
  assert.equal(numField.min.value, 0);
  assert.equal(numField.max.value, 20);
  assert.equal(numField.step.value, 2);

  // Stepping
  numField.stepUp();
  assert.equal(numField.value.value, 12);
  numField.stepDown();
  assert.equal(numField.value.value, 10);

  // Clamping to max
  numField.stepUp(10); // 10 + 20 = 30 -> clamp to 20
  assert.equal(numField.value.value, 20);

  // Clamping to min
  numField.stepDown(20); // clamp to 0
  assert.equal(numField.value.value, 0);

  // Keyboard controls
  const inputEl = numField.root.querySelector('input');
  assert.ok(inputEl);
  inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
  assert.equal(numField.value.value, 2);

  // Shift + ArrowUp (10x step)
  inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true }));
  assert.equal(numField.value.value, 20); // 2 + 20 clamped to 20

  // Direct typing
  inputEl.value = '14.56';
  inputEl.dispatchEvent(new Event('input'));
  inputEl.dispatchEvent(new Event('change'));
  assert.equal(numField.value.value, 14.6); // precision 1 rounded

  // Form Reset
  numField.setAttribute('value', '10');
  numField.formReset();
  assert.equal(numField.value.value, 10);

  // Validity
  assert.equal(numField.checkValidity(), true);

  document.body.removeChild(numField);
});
