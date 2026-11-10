import './setup.js';
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

  // Disabled button
  submitBtn.disabled.value = true;
  submitted = false;
  innerSubmitBtn.click();
  assert.equal(submitted, false);

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
  tabs.innerHTML = `
    <el-tab label="Tab 1" value="t1">Content 1</el-tab>
    <el-tab label="Tab 2" value="t2">Content 2</el-tab>
  `;
  document.body.appendChild(tabs);

  assert.equal(tabs.tabs.value.length, 2);
  assert.equal(tabs.activeTab.value, 't1');

  let changed = '';
  tabs.addEventListener('tabchange', (e) => { changed = e.detail.value; });

  tabs.selectTab('t2');
  assert.equal(tabs.activeTab.value, 't2');
  assert.equal(changed, 't2');

  document.body.removeChild(tabs);
});

test('<el-select> scans options and handles change', () => {
  const select = document.createElement('el-select');
  select.innerHTML = `
    <option value="opt1">Option 1</option>
    <option value="opt2">Option 2</option>
  `;
  document.body.appendChild(select);

  assert.equal(select.options.value.length, 2);

  const nativeSel = select.shadowRoot.querySelector('select');
  nativeSel.value = 'opt2';
  nativeSel.dispatchEvent(new Event('change'));

  assert.equal(select.value.value, 'opt2');

  select.formReset();
  assert.equal(select.value.value, '');

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
