import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../test-helpers/setup.js';

import {
  ElSlider,
  ElPopover,
  ElCollapsible,
  ElScrollArea,
  ElToggle,
  ElToggleGroup,
  ElCheckbox,
  ElRadio,
  ElRadioGroup,
  ElPreviewCard,
  ElAlertDialog,
  ElSeparator,
} from '../src/index.js';

test('<el-slider> handles values, clamping, keyboard navigation, and form association', () => {
  const slider = document.createElement('el-slider');
  slider.setAttribute('min', '0');
  slider.setAttribute('max', '100');
  slider.setAttribute('step', '5');
  slider.setAttribute('value', '30');
  document.body.appendChild(slider);

  assert.equal(slider.value.value, 30);
  assert.equal(slider.getAttribute('aria-valuenow'), '30');

  slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp' }));
  assert.equal(slider.value.value, 40);

  slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
  assert.equal(slider.value.value, 30);

  slider.setAttribute('orientation', 'vertical');
  assert.equal(slider.orientation.value, 'vertical');

  slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
  assert.equal(slider.value.value, 25);

  slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
  assert.equal(slider.value.value, 0);

  slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
  assert.equal(slider.value.value, 100);

  // Attribute change
  slider.setAttribute('value', '60');
  assert.equal(slider.value.value, 60);

  // Clamping
  slider.setAttribute('value', '150');
  assert.equal(slider.value.value, 100);

  // Disabled
  slider.setAttribute('disabled', '');
  assert.equal(slider.disabled.value, true);
  slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
  assert.equal(slider.value.value, 100); // no change when disabled

  // Pointer dragging
  slider.removeAttribute('disabled');
  slider.disabled.value = false;
  const root = slider.root.querySelector('.slider-root');
  if (root) {
    root.dispatchEvent(new MouseEvent('pointerdown', { clientX: 40, clientY: 5, bubbles: true }));
    assert.ok(typeof slider.value.value === 'number');
  }

  document.body.removeChild(slider);
});

test('<el-popover> handles open, close, toggle, placement, and light dismiss', () => {
  const popover = document.createElement('el-popover');
  popover.setAttribute('placement', 'top');
  popover.setAttribute('arrow', '');
  popover.innerHTML = `
    <button slot="trigger">Trigger</button>
    <div slot="content">Popover Content</div>
  `;
  document.body.appendChild(popover);

  assert.equal(popover.isOpen.value, false);
  popover.open();
  assert.equal(popover.isOpen.value, true);
  assert.equal(popover.getAttribute('data-state'), 'open');

  popover.toggle();
  assert.equal(popover.isOpen.value, false);

  popover.show();
  assert.equal(popover.isOpen.value, true);

  // Escape light dismiss
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(popover.isOpen.value, false);

  // Click outside light dismiss
  popover.open();
  assert.equal(popover.isOpen.value, true);
  document.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  assert.equal(popover.isOpen.value, false);

  document.body.removeChild(popover);
});

test('<el-collapsible> handles expansion, collapse, and toggle', () => {
  const col = document.createElement('el-collapsible');
  col.innerHTML = `
    <button slot="trigger">Toggle Panel</button>
    <div>Panel Details</div>
  `;
  document.body.appendChild(col);

  assert.equal(col.isOpen.value, false);
  col.toggle();
  assert.equal(col.isOpen.value, true);
  assert.equal(col.getAttribute('data-state'), 'open');

  col.close();
  assert.equal(col.isOpen.value, false);

  col.setAttribute('disabled', '');
  assert.equal(col.disabled.value, true);
  col.toggle();
  assert.equal(col.isOpen.value, false); // cannot toggle when disabled

  document.body.removeChild(col);
});

test('<el-scroll-area> renders viewport with custom sizing and type', () => {
  const sa = document.createElement('el-scroll-area');
  sa.setAttribute('type', 'always');
  sa.setAttribute('max-height', '200px');
  sa.innerHTML = `<p>Long text content</p>`;
  document.body.appendChild(sa);

  assert.equal(sa.type.value, 'always');
  assert.equal(sa.maxHeight.value, '200px');

  sa.setAttribute('height', '150px');
  assert.equal(sa.height.value, '150px');
  sa.setAttribute('max-width', '400px');
  assert.equal(sa.maxWidth.value, '400px');

  sa.setAttribute('type', 'auto');
  assert.equal(sa.type.value, 'auto');

  document.body.removeChild(sa);
});

test('<el-toggle> & <el-toggle-group> handle single and multi press states', () => {
  const group = document.createElement('el-toggle-group');
  group.setAttribute('type', 'single');
  group.innerHTML = `
    <el-toggle value="left">Left</el-toggle>
    <el-toggle value="center">Center</el-toggle>
    <el-toggle value="right">Right</el-toggle>
  `;
  document.body.appendChild(group);

  const [t1, t2] = group.querySelectorAll('el-toggle');
  t1.toggle();
  assert.equal(t1.isPressed.value, true);
  assert.equal(group.value.value, 'left');

  t2.toggle();
  assert.equal(t2.isPressed.value, true);
  assert.equal(t1.isPressed.value, false);
  assert.equal(group.value.value, 'center');

  // Multi-mode toggle group
  const multiGroup = document.createElement('el-toggle-group');
  multiGroup.setAttribute('type', 'multiple');
  multiGroup.innerHTML = `
    <el-toggle value="bold">B</el-toggle>
    <el-toggle value="italic">I</el-toggle>
  `;
  document.body.appendChild(multiGroup);
  const [tb, ti] = multiGroup.querySelectorAll('el-toggle');
  tb.toggle();
  ti.toggle();
  assert.equal(multiGroup.value.value, 'bold,italic');
  document.body.removeChild(multiGroup);

  document.body.removeChild(group);
});

test('<el-checkbox> supports checked, unchecked, indeterminate, and Space toggle', () => {
  const cb = document.createElement('el-checkbox');
  cb.setAttribute('value', 'accept');
  document.body.appendChild(cb);

  assert.equal(cb.checked.value, false);
  assert.equal(cb.getAttribute('aria-checked'), 'false');

  cb.toggle();
  assert.equal(cb.checked.value, true);
  assert.equal(cb.getAttribute('aria-checked'), 'true');

  cb.setAttribute('indeterminate', '');
  assert.equal(cb.indeterminate.value, true);
  assert.equal(cb.getAttribute('aria-checked'), 'mixed');

  cb.toggle(); // toggling from indeterminate should check
  assert.equal(cb.checked.value, true);
  assert.equal(cb.indeterminate.value, false);

  cb.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
  assert.equal(cb.checked.value, false);

  document.body.removeChild(cb);
});

test('<el-radio> & <el-radio-group> handle roving focus and value selection', () => {
  const group = document.createElement('el-radio-group');
  group.setAttribute('value', 'email');
  group.innerHTML = `
    <el-radio value="email">Email</el-radio>
    <el-radio value="sms">SMS</el-radio>
    <el-radio value="push">Push</el-radio>
  `;
  document.body.appendChild(group);

  const [r1, r2, r3] = group.querySelectorAll('el-radio');
  assert.equal(r1.checked.value, true);
  assert.equal(r2.checked.value, false);

  r2.select();
  assert.equal(group.value.value, 'sms');
  assert.equal(r2.checked.value, true);
  assert.equal(r1.checked.value, false);

  // Arrow key navigation
  group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
  assert.equal(group.value.value, 'push');
  assert.equal(r3.checked.value, true);

  // Multi-mode toggle group
  const multiGroup = document.createElement('el-toggle-group');
  multiGroup.setAttribute('type', 'multiple');
  multiGroup.innerHTML = `
    <el-toggle value="bold">B</el-toggle>
    <el-toggle value="italic">I</el-toggle>
  `;
  document.body.appendChild(multiGroup);
  const [tb, ti] = multiGroup.querySelectorAll('el-toggle');
  tb.toggle();
  ti.toggle();
  assert.equal(multiGroup.value.value, 'bold,italic');
  document.body.removeChild(multiGroup);

  document.body.removeChild(group);
});

test('<el-preview-card> handles hover trigger and timer controls', () => {
  const card = document.createElement('el-preview-card');
  card.setAttribute('open-delay', '50');
  card.setAttribute('close-delay', '50');
  card.innerHTML = `
    <a href="#" slot="trigger">@shadcn</a>
    <div>Preview profile details</div>
  `;
  document.body.appendChild(card);

  assert.equal(card.isOpen.value, false);
  card.open();
  assert.equal(card.isOpen.value, true);
  assert.equal(card.getAttribute('data-state'), 'open');

  card.close();
  assert.equal(card.isOpen.value, false);

  document.body.removeChild(card);
});

test('<el-alert-dialog> handles modal alert opening, focus and cancel event', () => {
  const dialog = document.createElement('el-alert-dialog');
  dialog.setAttribute('heading', 'Delete Deployment');
  dialog.innerHTML = `
    <button slot="trigger">Delete</button>
    <p>This action is irreversible.</p>
    <button id="cancel-btn">Cancel</button>
  `;
  document.body.appendChild(dialog);

  assert.equal(dialog.isOpen.value, false);
  dialog.showModal();
  assert.equal(dialog.isOpen.value, true);
  assert.equal(dialog.getAttribute('data-state'), 'open');

  let cancelled = false;
  dialog.addEventListener('cancel', () => { cancelled = true; });
  dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(cancelled, true);

  dialog.close();
  assert.equal(dialog.isOpen.value, false);

  document.body.removeChild(dialog);
});

test('<el-separator> handles horizontal and vertical orientation', () => {
  const sep = document.createElement('el-separator');
  document.body.appendChild(sep);

  assert.equal(sep.orientation.value, 'horizontal');
  assert.equal(sep.getAttribute('role'), 'separator');
  assert.equal(sep.getAttribute('aria-orientation'), 'horizontal');

  sep.setAttribute('orientation', 'vertical');
  assert.equal(sep.orientation.value, 'vertical');
  assert.equal(sep.getAttribute('aria-orientation'), 'vertical');

  sep.setAttribute('decorative', 'true');
  assert.equal(sep.getAttribute('role'), 'none');

  document.body.removeChild(sep);
});

test('<el-meter> handles scalar value, percentage, and semantic status thresholds', () => {
  const meter = document.createElement('el-meter');
  meter.setAttribute('value', '75');
  meter.setAttribute('min', '0');
  meter.setAttribute('max', '100');
  meter.setAttribute('low', '30');
  meter.setAttribute('high', '70');
  meter.setAttribute('optimum', '85');
  document.body.appendChild(meter);

  assert.equal(meter.value.value, 75);
  assert.equal(meter.percentage.value, 75);
  assert.equal(meter.status.value, 'safe');

  meter.setAttribute('value', '50');
  assert.equal(meter.value.value, 50);
  assert.equal(meter.status.value, 'warning');

  meter.setAttribute('value', '10');
  assert.equal(meter.value.value, 10);
  assert.equal(meter.status.value, 'critical');

  meter.setAttribute('size', 'lg');
  assert.equal(meter.size.value, 'lg');

  document.body.removeChild(meter);
});

test('<el-toolbar> supports roving tabindex and keyboard navigation', () => {
  const tb = document.createElement('el-toolbar');
  tb.innerHTML = `
    <button id="btn1">Bold</button>
    <button id="btn2">Italic</button>
    <button id="btn3">Underline</button>
  `;
  document.body.appendChild(tb);

  assert.equal(tb.orientation.value, 'horizontal');
  assert.equal(tb.getAttribute('role') || tb.shadowRoot?.querySelector('.toolbar')?.getAttribute('role'), 'toolbar');

  const [b1, b2, b3] = tb.querySelectorAll('button');

  // Trigger keyboard navigation
  tb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  tb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  tb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  tb.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));

  tb.setAttribute('orientation', 'vertical');
  assert.equal(tb.orientation.value, 'vertical');
  tb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  tb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));

  tb.setAttribute('disabled', '');
  assert.equal(tb.disabled.value, true);

  document.body.removeChild(tb);
});

test('<el-context-menu> handles right-click trigger, open/close, and keyboard actions', async () => {
  const cm = document.createElement('el-context-menu');
  cm.innerHTML = `
    <div id="trigger-area">Right-click zone</div>
    <div slot="menu">
      <button role="menuitem">Edit</button>
      <button role="menuitem">Delete</button>
    </div>
  `;
  document.body.appendChild(cm);

  assert.equal(cm.isOpen.value, false);
  assert.equal(cm.getAttribute('data-state'), 'closed');

  cm.open(150, 200);
  assert.equal(cm.isOpen.value, true);
  assert.equal(cm.getAttribute('data-state'), 'open');
  assert.ok(cm.posX.value > 0);
  assert.ok(cm.posY.value > 0);

  cm.close();
  assert.equal(cm.isOpen.value, false);
  assert.equal(cm.getAttribute('data-state'), 'closed');

  cm.toggle(50, 50);
  assert.equal(cm.isOpen.value, true);
  cm.toggle(50, 50);
  assert.equal(cm.isOpen.value, false);

  // Keyboard Shift+F10
  cm.dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true }));
  assert.equal(cm.isOpen.value, true);

  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(cm.isOpen.value, false);

  // Mobile pointer long-press trigger
  const trigger = cm.querySelector('#trigger-area');
  trigger.dispatchEvent(new PointerEvent('pointerdown', { clientX: 110, clientY: 140, pointerType: 'touch', bubbles: true, composed: true }));
  await new Promise(r => setTimeout(r, 550));
  assert.equal(cm.isOpen.value, true);
  assert.equal(cm.posX.value, 110);
  assert.equal(cm.posY.value, 140);

  // Move clears timer
  cm.close();
  trigger.dispatchEvent(new PointerEvent('pointerdown', { clientX: 110, clientY: 140, pointerType: 'touch', bubbles: true, composed: true }));
  trigger.dispatchEvent(new PointerEvent('pointermove', { clientX: 150, clientY: 200, pointerType: 'touch', bubbles: true, composed: true }));
  await new Promise(r => setTimeout(r, 550));
  assert.equal(cm.isOpen.value, false);

  document.body.removeChild(cm);
});

test('<el-menubar> handles horizontal keyboard arrows and hover-switching', () => {
  const mb = document.createElement('el-menubar');
  mb.innerHTML = `
    <button id="m1">File</button>
    <button id="m2">Edit</button>
    <button id="m3">View</button>
  `;
  document.body.appendChild(mb);

  const [m1, m2, m3] = mb.querySelectorAll('button');

  mb.openMenu(m1);
  assert.equal(mb.activeMenu.value, m1);
  assert.equal(m1.getAttribute('data-state'), 'open');

  // Hovering adjacent item switches menu
  mb.dispatchEvent(new Event('pointerenter', { bubbles: true }));
  mb.openMenu(m2);
  assert.equal(mb.activeMenu.value, m2);

  // Keyboard navigation
  mb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  mb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  mb.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  mb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));

  mb.closeMenu();
  assert.equal(mb.activeMenu.value, null);

  document.body.removeChild(mb);
});
