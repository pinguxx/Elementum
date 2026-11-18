import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ElButton,
  ElBadge,
  ElInput,
  ElDropdown,
  ElCalendar,
  ElDatepicker,
  ElDialog,
  ElTabs,
  ElTab,
  ElSelect,
  ElThemeSwitch,
  ElToaster,
  toast
} from '../src/index.js';

test('<el-button> handles clicks, disabled states, and form submission/reset', () => {
  const form = document.createElement('form');
  let submitted = false;
  let reset = false;
  form.requestSubmit = () => { submitted = true; };
  form.reset = () => { reset = true; };

  const submitBtn = document.createElement('el-button');
  submitBtn.setAttribute('type', 'submit');
  form.appendChild(submitBtn);

  const resetBtn = document.createElement('el-button');
  resetBtn.setAttribute('type', 'reset');
  form.appendChild(resetBtn);

  document.body.appendChild(form);

  const innerSubmitBtn = submitBtn.shadowRoot.querySelector('button');
  innerSubmitBtn.click();
  assert.equal(submitted, true);

  const innerResetBtn = resetBtn.shadowRoot.querySelector('button');
  innerResetBtn.click();
  assert.equal(reset, true);

  // Disabled button via signal
  submitBtn.disabled.value = true;
  submitted = false;
  innerSubmitBtn.click();
  assert.equal(submitted, false);

  // Disabled button via HTML attribute
  const disabledBtn = document.createElement('el-button');
  disabledBtn.setAttribute('disabled', '');
  document.body.appendChild(disabledBtn);
  assert.equal(disabledBtn.disabled.value, true);
  assert.equal(disabledBtn.getAttribute('aria-disabled'), 'true');
  const innerDisabled = disabledBtn.shadowRoot.querySelector('button');
  assert.equal(innerDisabled.hasAttribute('disabled'), true);
  assert.equal(innerDisabled.getAttribute('aria-disabled'), 'true');

  // Dynamic remove and re-add disabled attribute
  disabledBtn.removeAttribute('disabled');
  assert.equal(disabledBtn.disabled.value, false);
  assert.equal(disabledBtn.hasAttribute('aria-disabled'), false);
  assert.equal(innerDisabled.hasAttribute('disabled'), false);

  disabledBtn.setAttribute('disabled', '');
  assert.equal(disabledBtn.disabled.value, true);
  assert.equal(disabledBtn.getAttribute('aria-disabled'), 'true');
  assert.equal(innerDisabled.hasAttribute('disabled'), true);
  document.body.removeChild(disabledBtn);

  document.body.removeChild(form);
});

test('<el-badge> renders variant and count', () => {
  const badge = document.createElement('el-badge');
  badge.setAttribute('variant', 'success');
  badge.setAttribute('count', '99+');
  document.body.appendChild(badge);

  assert.ok(badge.shadowRoot.innerHTML.includes('99+'));
  document.body.removeChild(badge);
});

test('<el-input> handles typing, change events, and formReset', () => {
  const inputEl = document.createElement('el-input');
  document.body.appendChild(inputEl);

  let inputVal = '';
  let changeVal = '';
  inputEl.addEventListener('input', (e) => { inputVal = e.detail.value; });
  inputEl.addEventListener('change', (e) => { changeVal = e.detail.value; });

  const nativeInput = inputEl.shadowRoot.querySelector('input');
  nativeInput.value = 'hello';
  nativeInput.dispatchEvent(new Event('input'));
  nativeInput.dispatchEvent(new Event('change'));

  assert.equal(inputVal, 'hello');
  assert.equal(changeVal, 'hello');
  assert.equal(inputEl.value.value, 'hello');

  inputEl.formReset();
  assert.equal(inputEl.value.value, '');

  document.body.removeChild(inputEl);
});

test('<el-dropdown> open, close, toggle, and light-dismiss', () => {
  const dd = document.createElement('el-dropdown');
  document.body.appendChild(dd);

  assert.equal(dd.isOpen.value, false);
  dd.open();
  assert.equal(dd.isOpen.value, true);

  dd.close();
  assert.equal(dd.isOpen.value, false);

  dd.toggle();
  assert.equal(dd.isOpen.value, true);

  // Escape key closes
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(dd.isOpen.value, false);

  document.body.removeChild(dd);
});

test('<el-calendar> navigates months and selects date', () => {
  const cal = document.createElement('el-calendar');
  cal.setAttribute('value', '2026-11-10');
  document.body.appendChild(cal);

  assert.equal(cal.value.value, '2026-11-10');

  const curMonth = cal.viewMonth.value;
  cal.nextMonth();
  assert.equal(cal.viewMonth.value, (curMonth + 1) % 12);
  cal.prevMonth();
  assert.equal(cal.viewMonth.value, curMonth);

  let selectedDate = '';
  cal.addEventListener('select', (e) => { selectedDate = e.detail.date; });

  const dayBtn = cal.shadowRoot.querySelector('.day');
  dayBtn?.click();
  assert.ok(selectedDate.length > 0);

  // Direct month and year jump via methods
  cal.setMonth(5); // June
  assert.equal(cal.viewMonth.value, 5);
  cal.setYear(2030);
  assert.equal(cal.viewYear.value, 2030);

  // Direct month and year jump via dropdown changes
  const monthSelect = cal.shadowRoot.querySelector('.month-select');
  if (monthSelect) {
    monthSelect.value = '2'; // March
    monthSelect.dispatchEvent(new Event('change'));
    assert.equal(cal.viewMonth.value, 2);
  }

  const yearSelect = cal.shadowRoot.querySelector('.year-select');
  if (yearSelect) {
    yearSelect.value = '2028';
    yearSelect.dispatchEvent(new Event('change'));
    assert.equal(cal.viewYear.value, 2028);
  }

  cal.setAttribute('min-year', '2020');
  cal.setAttribute('max-year', '2035');
  assert.equal(cal.minYear.value, 2020);
  assert.equal(cal.maxYear.value, 2035);

  document.body.removeChild(cal);
});

test('<el-datepicker> select date, today, and clear', () => {
  const dp = document.createElement('el-datepicker');
  document.body.appendChild(dp);

  const cal = dp.shadowRoot.querySelector('el-calendar');
  assert.ok(cal);

  let changedVal = '';
  dp.addEventListener('change', (e) => { changedVal = e.detail.value; });

  cal.emit('select', { date: '2026-12-25' });
  assert.equal(dp.value.value, '2026-12-25');
  assert.equal(changedVal, '2026-12-25');

  dp.formReset();
  assert.equal(dp.value.value, '');

  document.body.removeChild(dp);
});

test('<el-dialog> showModal, close, and cancel events', () => {
  const dlgEl = document.createElement('el-dialog');
  document.body.appendChild(dlgEl);

  const nativeDlg = dlgEl.shadowRoot.querySelector('dialog');
  nativeDlg.showModal = () => { nativeDlg.open = true; };
  nativeDlg.close = (val) => {
    nativeDlg.open = false;
    nativeDlg.returnValue = val || '';
    nativeDlg.dispatchEvent(new Event('close'));
  };

  let closeReturn = null;
  dlgEl.addEventListener('close', (e) => {
    closeReturn = e.detail.returnValue;
  });

  dlgEl.showModal();
  assert.equal(dlgEl.isOpen.value, true);

  dlgEl.close('confirm');
  assert.equal(dlgEl.isOpen.value, false);
  assert.equal(closeReturn, 'confirm');

  document.body.removeChild(dlgEl);
});

test('<el-tabs> scans tabs and switches active tab', () => {
  const tabs = document.createElement('el-tabs');
  tabs.setAttribute('value', 't2');
  tabs.innerHTML = `
    <el-tab label="Tab 1" value="t1">Content 1</el-tab>
    <el-tab label="Tab 2" value="t2">Content 2</el-tab>
  `;
  document.body.appendChild(tabs);

  assert.equal(tabs.tabs.value.length, 2);
  assert.equal(tabs.activeTab.value, 't2');

  let changed = '';
  tabs.addEventListener('tabchange', (e) => { changed = e.detail.value; });

  tabs.selectTab('t1');
  assert.equal(tabs.activeTab.value, 't1');
  assert.equal(changed, 't1');

  document.body.removeChild(tabs);
});

test('<el-select> scans options and handles change', () => {
  const select = document.createElement('el-select');
  select.setAttribute('value', 'opt2');
  select.innerHTML = `
    <option value="opt1">Option 1</option>
    <option value="opt2">Option 2</option>
  `;
  document.body.appendChild(select);

  assert.equal(select.options.value.length, 2);
  assert.equal(select.value.value, 'opt2');

  const nativeSel = select.shadowRoot.querySelector('select');
  nativeSel.value = 'opt1';
  nativeSel.dispatchEvent(new Event('change'));

  assert.equal(select.value.value, 'opt1');

  select.formReset();
  assert.equal(select.value.value, 'opt2');

  document.body.removeChild(select);
});

test('<el-theme-switch> toggles theme and persists in localStorage', () => {
  const sw = document.createElement('el-theme-switch');
  document.body.appendChild(sw);

  sw.setTheme('light');
  assert.equal(sw.theme.value, 'light');
  assert.equal(localStorage.getItem('elementum-theme'), 'light');

  sw.toggle();
  assert.equal(sw.theme.value, 'dark');
  assert.equal(localStorage.getItem('elementum-theme'), 'dark');

  document.body.removeChild(sw);
});

test('<el-toaster> renders toasts and handles dismissal', () => {
  const toaster = document.createElement('el-toaster');
  document.body.appendChild(toaster);

  const id = toast.info('Toast Alert');
  assert.ok(toast.toasts.value.some(t => t.id === id));

  toast.dismiss(id);
  assert.ok(!toast.toasts.value.some(t => t.id === id));

  document.body.removeChild(toaster);
});

test('Components support label attribute as fallback when no slotted children provided', () => {
  // 1. el-button with label attribute
  const btn = document.createElement('el-button');
  btn.setAttribute('label', 'Save Record');
  document.body.appendChild(btn);
  assert.equal(btn.label.value, 'Save Record');
  assert.ok(btn.shadowRoot.textContent.includes('Save Record'));

  btn.setAttribute('label', 'Updated Label');
  assert.equal(btn.label.value, 'Updated Label');
  assert.ok(btn.shadowRoot.textContent.includes('Updated Label'));

  // 2. el-toggle with label attribute
  const toggle = document.createElement('el-toggle');
  toggle.setAttribute('label', 'Mute Mic');
  document.body.appendChild(toggle);
  assert.equal(toggle.label.value, 'Mute Mic');
  assert.ok(toggle.shadowRoot.textContent.includes('Mute Mic'));

  // 3. el-switch with label attribute
  const sw = document.createElement('el-switch');
  sw.setAttribute('label', 'Auto Refresh');
  document.body.appendChild(sw);
  assert.equal(sw.label.value, 'Auto Refresh');
  assert.ok(sw.shadowRoot.textContent.includes('Auto Refresh'));

  // 4. el-chip with label attribute
  const chip = document.createElement('el-chip');
  chip.setAttribute('label', 'Node.js');
  document.body.appendChild(chip);
  assert.equal(chip.label.value, 'Node.js');
  assert.ok(chip.shadowRoot.textContent.includes('Node.js'));

  // 5. el-badge with label attribute
  const badge = document.createElement('el-badge');
  badge.setAttribute('label', 'Active');
  document.body.appendChild(badge);
  assert.equal(badge.label.value, 'Active');
  assert.ok(badge.shadowRoot.textContent.includes('Active'));

  // 6. el-alert with label attribute
  const alert = document.createElement('el-alert');
  alert.setAttribute('label', 'System operational');
  document.body.appendChild(alert);
  assert.equal(alert.label.value, 'System operational');
  assert.ok(alert.shadowRoot.textContent.includes('System operational'));

  // 7. el-checkbox with label attribute
  const cb = document.createElement('el-checkbox');
  cb.setAttribute('label', 'I agree to the terms');
  document.body.appendChild(cb);
  assert.equal(cb.label.value, 'I agree to the terms');
  assert.ok(cb.shadowRoot.textContent.includes('I agree to the terms'));

  document.body.removeChild(btn);
  document.body.removeChild(toggle);
  document.body.removeChild(sw);
  document.body.removeChild(chip);
  document.body.removeChild(badge);
  document.body.removeChild(alert);
  document.body.removeChild(cb);
});

test('<el-select> supports options attribute, placeholders, and dynamic option mutations', async () => {
  // 1. options attribute via JSON string
  const selJson = document.createElement('el-select');
  selJson.setAttribute('options', JSON.stringify([
    { label: 'US East', value: 'us-east' },
    { label: 'US West', value: 'us-west' }
  ]));
  document.body.appendChild(selJson);
  assert.equal(selJson.options.value.length, 2);
  assert.equal(selJson.value.value, 'us-east');

  // Change attribute dynamically
  selJson.setAttribute('options', JSON.stringify(['Option A', 'Option B', 'Option C']));
  assert.equal(selJson.options.value.length, 3);
  assert.equal(selJson.options.value[0].value, 'Option A');
  document.body.removeChild(selJson);

  // 2. options attribute via comma-separated string
  const selCsv = document.createElement('el-select');
  selCsv.setAttribute('options', 'Alpha, Beta, Gamma');
  document.body.appendChild(selCsv);
  assert.equal(selCsv.options.value.length, 3);
  assert.equal(selCsv.options.value[1].label, 'Beta');
  document.body.removeChild(selCsv);

  // 3. placeholder and required validation
  const selReq = document.createElement('el-select');
  selReq.setAttribute('placeholder', 'Choose region...');
  selReq.setAttribute('required', '');
  document.body.appendChild(selReq);
  assert.equal(selReq.validate(), false);
  assert.equal(selReq.getAttribute('aria-invalid'), 'true');

  selReq.setAttribute('options', 'North, South');
  selReq.value.value = 'North';
  assert.equal(selReq.validate(), true);
  assert.equal(selReq.hasAttribute('aria-invalid'), false);
  document.body.removeChild(selReq);

  // 4. MutationObserver for dynamic option elements
  const selDom = document.createElement('el-select');
  document.body.appendChild(selDom);
  assert.equal(selDom.options.value.length, 0);

  const opt1 = document.createElement('option');
  opt1.value = 'v1';
  opt1.textContent = 'Val 1';
  selDom.appendChild(opt1);

  // Wait a microtask / tick for MutationObserver
  await new Promise(r => setTimeout(r, 20));
  assert.equal(selDom.options.value.length, 1);
  assert.equal(selDom.options.value[0].value, 'v1');
  assert.equal(selDom.value.value, 'v1');

  document.body.removeChild(selDom);
});

test('<el-radio> supports label attribute as fallback', () => {
  const radio = document.createElement('el-radio');
  radio.setAttribute('value', 'opt1');
  radio.setAttribute('label', 'Developer License');
  document.body.appendChild(radio);
  assert.equal(radio.label.value, 'Developer License');
  assert.ok(radio.shadowRoot.textContent.includes('Developer License'));
  document.body.removeChild(radio);
});

test('<el-badge> supports all semantic variants and size attributes', () => {
  const badge = document.createElement('el-badge');
  badge.setAttribute('variant', 'primary');
  badge.setAttribute('size', 'lg');
  badge.setAttribute('count', '42');
  document.body.appendChild(badge);
  assert.equal(badge.variant.value, 'primary');
  assert.equal(badge.size.value, 'lg');
  assert.ok(badge.shadowRoot.textContent.includes('42'));
  badge.setAttribute('variant', 'warning');
  assert.equal(badge.variant.value, 'warning');
  document.body.removeChild(badge);
});

test('<el-table> parses slotted native table into reactive columns and data', () => {
  const table = document.createElement('el-table');
  table.innerHTML = `
    <table>
      <thead>
        <tr><th data-key="name">User</th><th data-key="role">Permission</th></tr>
      </thead>
      <tbody>
        <tr><td>Alice</td><td>Admin</td></tr>
        <tr><td>Bob</td><td>Viewer</td></tr>
      </tbody>
    </table>
  `;
  document.body.appendChild(table);
  assert.equal(table.tableColumns.length, 2);
  assert.equal(table.tableData.length, 2);
  assert.equal(table.tableData[0].name, 'Alice');
  assert.equal(table.tableData[1].role, 'Viewer');
  document.body.removeChild(table);
});

test('<el-chart> accepts {x, y} coordinate data objects as well as {label, value}', () => {
  const chart = document.createElement('el-chart');
  chart.setAttribute('data', JSON.stringify([
    { x: '10:00', y: 150 },
    { x: '11:00', y: 350 }
  ]));
  document.body.appendChild(chart);
  const textElements = Array.from(chart.shadowRoot.querySelectorAll('text.axis-label'));
  const texts = textElements.map(t => t.textContent.trim());
  assert.ok(texts.includes('10:00'));
  assert.ok(texts.includes('11:00'));
  document.body.removeChild(chart);
});

test('<el-radio-group> and <el-radio-card-group> safely sync un-upgraded or dynamic children without throwing', () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <el-radio-group value="plan-b">
      <el-radio value="plan-a">Plan A</el-radio>
      <el-radio value="plan-b">Plan B</el-radio>
    </el-radio-group>
    <el-radio-card-group value="card-b">
      <el-radio-card value="card-a">Card A</el-radio-card>
      <el-radio-card value="card-b">Card B</el-radio-card>
    </el-radio-card-group>
  `;
  document.body.appendChild(container);

  const group = container.querySelector('el-radio-group');
  const cardGroup = container.querySelector('el-radio-card-group');

  // Trigger attribute changes
  group.setAttribute('value', 'plan-a');
  assert.equal(group.value.value, 'plan-a');

  cardGroup.setAttribute('value', 'card-a');
  assert.equal(cardGroup.value.value, 'card-a');

  document.body.removeChild(container);
});

