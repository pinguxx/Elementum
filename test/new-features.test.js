import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ElProgress } from '../src/components/el-progress.js';
import { ElSpinner } from '../src/components/el-spinner.js';
import { ElAvatar, ElAvatarGroup } from '../src/components/el-avatar.js';
import { ElDrawer } from '../src/components/el-drawer.js';
import { ElSegmentedControl } from '../src/components/el-segmented-control.js';
import { ElButton } from '../src/components/el-button.js';
import { html } from '../src/template.js';
import { signal } from '../src/signal.js';
import { renderTemplateToString, renderComponentToDSD } from '../src/ssr.js';

test('<el-progress> calculates percentages and handles indeterminate mode', () => {
  const progress = document.createElement('el-progress');
  progress.setAttribute('value', '45');
  progress.setAttribute('max', '90');
  progress.setAttribute('variant', 'success');
  document.body.appendChild(progress);

  const track = progress.root.querySelector('.track');
  const bar = progress.root.querySelector('.bar');

  assert.ok(track);
  assert.equal(track.getAttribute('aria-valuenow'), '45');
  assert.equal(track.getAttribute('aria-valuemax'), '90');
  assert.equal(bar.style.width, '50%');
  assert.equal(bar.getAttribute('data-variant'), 'success');

  // Change value
  progress.setAttribute('value', '90');
  progress.attributeChanged('value', '45', '90');
  assert.equal(bar.style.width, '100%');

  // Indeterminate
  progress.setAttribute('indeterminate', '');
  progress.attributeChanged('indeterminate', null, '');
  assert.equal(progress.indeterminate.value, true);
  assert.equal(track.getAttribute('aria-valuenow'), null);

  document.body.removeChild(progress);
});

test('<el-spinner> renders accessible spinner with status role', () => {
  const spinner = document.createElement('el-spinner');
  spinner.setAttribute('size', 'lg');
  spinner.setAttribute('variant', 'primary');
  spinner.setAttribute('label', 'Loading records...');
  document.body.appendChild(spinner);

  const spinEl = spinner.root.querySelector('.spinner');
  assert.ok(spinEl);
  assert.equal(spinEl.getAttribute('role'), 'status');
  assert.equal(spinEl.getAttribute('aria-label'), 'Loading records...');
  assert.ok(spinEl.className.includes('size-lg'));
  assert.ok(spinEl.className.includes('variant-primary'));

  document.body.removeChild(spinner);
});

test('<el-avatar> computes initials and handles image error fallback and status dot', () => {
  const avatar = document.createElement('el-avatar');
  avatar.setAttribute('name', 'Grace Hopper');
  avatar.setAttribute('status', 'online');
  document.body.appendChild(avatar);

  const initials = avatar.root.querySelector('[part="initials"]');
  assert.ok(initials);
  assert.equal(initials.textContent.trim(), 'GH');

  const statusDot = avatar.root.querySelector('.status-dot');
  assert.ok(statusDot);
  assert.ok(statusDot.className.includes('status-online'));

  // Single name fallback
  avatar.setAttribute('name', 'Aristotle');
  avatar.attributeChanged('name', 'Grace Hopper', 'Aristotle');
  assert.equal(avatar.root.querySelector('[part="initials"]').textContent.trim(), 'AR');

  // Image with error fallback
  avatar.setAttribute('src', 'http://invalid-avatar-url.jpg');
  avatar.attributeChanged('src', null, 'http://invalid-avatar-url.jpg');
  const img = avatar.root.querySelector('img');
  assert.ok(img);
  img.dispatchEvent(new Event('error'));
  // Should fallback to initials
  assert.ok(avatar.root.querySelector('[part="initials"]'));

  document.body.removeChild(avatar);
});

test('<el-avatar-group> renders slotted avatar collection', () => {
  const group = document.createElement('el-avatar-group');
  group.innerHTML = `
    <el-avatar name="Alice Smith"></el-avatar>
    <el-avatar name="Bob Jones"></el-avatar>
  `;
  document.body.appendChild(group);
  assert.equal(group.querySelectorAll('el-avatar').length, 2);
  document.body.removeChild(group);
});

test('<el-drawer> opens, closes, fires events, restores focus, and handles Escape', () => {
  const btn = document.createElement('button');
  btn.textContent = 'Open Drawer';
  document.body.appendChild(btn);
  btn.focus();

  const drawer = document.createElement('el-drawer');
  drawer.setAttribute('title', 'Navigation Drawer');
  drawer.setAttribute('placement', 'left');
  document.body.appendChild(drawer);

  let opened = false;
  let closed = false;
  drawer.addEventListener('open', () => (opened = true));
  drawer.addEventListener('close', () => (closed = true));

  drawer.show();
  assert.equal(drawer.isOpen.value, true);
  assert.equal(opened, true);

  // Escape key closes
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(drawer.isOpen.value, false);
  assert.equal(closed, true);
  assert.equal(document.activeElement, btn);

  // Backdrop click closes
  drawer.show();
  assert.equal(drawer.isOpen.value, true);
  const backdrop = drawer.root.querySelector('.backdrop');
  backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  assert.equal(drawer.isOpen.value, false);

  // Property setter drawer.open
  drawer.open = true;
  assert.equal(drawer.isOpen.value, true);
  assert.equal(drawer.open, true);
  drawer.open = false;
  assert.equal(drawer.isOpen.value, false);

  // Heading attribute
  drawer.setAttribute('heading', 'Settings Panel');
  assert.equal(drawer.titleText.value, 'Settings Panel');

  document.body.removeChild(drawer);
  document.body.removeChild(btn);
});

test('<el-segmented-control> options selection, keyboard arrows, and formReset', () => {
  const seg = document.createElement('el-segmented-control');
  seg.setAttribute('name', 'view');
  seg.innerHTML = `
    <option value="list">List View</option>
    <option value="grid">Grid View</option>
    <option value="table">Table View</option>
  `;
  document.body.appendChild(seg);

  assert.equal(seg.value.value, 'list');

  let changeVal = '';
  seg.addEventListener('change', (e) => (changeVal = e.detail.value));

  // Click on second button
  const buttons = seg.root.querySelectorAll('button[role="radio"]');
  assert.equal(buttons.length, 3);
  buttons[1].click();

  assert.equal(seg.value.value, 'grid');
  assert.equal(changeVal, 'grid');

  // Arrow Right navigation
  seg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
  assert.equal(seg.value.value, 'table');

  // Arrow Left navigation
  seg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }));
  assert.equal(seg.value.value, 'grid');

  // Form Reset
  seg.formReset();
  assert.equal(seg.value.value, 'list');

  document.body.removeChild(seg);
});

test('<el-segmented-control> supports options attribute and dynamic option attributes', () => {
  // 1. JSON options
  const segJson = document.createElement('el-segmented-control');
  segJson.setAttribute('options', JSON.stringify([
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' }
  ]));
  document.body.appendChild(segJson);
  assert.equal(segJson.value.value, 'day');
  const btnsJson = segJson.root.querySelectorAll('button[role="radio"]');
  assert.equal(btnsJson.length, 3);
  document.body.removeChild(segJson);

  // 2. Comma-separated options
  const segCsv = document.createElement('el-segmented-control');
  segCsv.setAttribute('options', 'Analytics, Reports, Settings');
  document.body.appendChild(segCsv);
  assert.equal(segCsv.value.value, 'Analytics');
  const btnsCsv = segCsv.root.querySelectorAll('button[role="radio"]');
  assert.equal(btnsCsv.length, 3);
  assert.equal(btnsCsv[1].textContent.trim(), 'Reports');

  // Change attribute dynamically
  segCsv.setAttribute('options', 'Red, Green, Blue, Alpha');
  const btnsCsvUpdated = segCsv.root.querySelectorAll('button[role="radio"]');
  assert.equal(btnsCsvUpdated.length, 4);

  document.body.removeChild(segCsv);
});

test('Declarative Shadow DOM (DSD) SSR: renderTemplateToString and renderComponentToDSD', () => {
  const count = signal(42);
  const tmpl = html`<div class="badge" @click=${() => {}}>Count: ${() => count.value}</div>`;

  const rendered = renderTemplateToString(tmpl);
  assert.ok(rendered.includes('<div class="badge"'));
  assert.ok(rendered.includes('Count: 42'));
  // Event handler stripped from SSR output
  assert.ok(!rendered.includes('@click'));

  // Test renderComponentToDSD
  const dsd = renderComponentToDSD('el-button', ElButton, { variant: 'danger', size: 'lg' }, 'Click Here');
  assert.ok(dsd.startsWith('<el-button variant="danger" size="lg">'));
  assert.ok(dsd.includes('<template shadowrootmode="open">'));
  assert.ok(dsd.includes('<style>'));
  assert.ok(dsd.includes('part="button"'));
  assert.ok(dsd.endsWith('Click Here</el-button>'));
});
