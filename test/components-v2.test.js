import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ElSwitch,
  ElTooltip,
  ElAccordion,
  ElAccordionItem,
  ElTable,
} from '../src/index.js';

test('<el-switch> handles toggle, keyboard navigation, and form reset', () => {
  const sw = document.createElement('el-switch');
  document.body.appendChild(sw);

  assert.equal(sw.checked.value, false);
  assert.equal(sw.getAttribute('aria-checked'), 'false');

  let changed = null;
  sw.addEventListener('change', (e) => { changed = e.detail; });

  sw.click();
  assert.equal(sw.checked.value, true);
  assert.equal(sw.getAttribute('aria-checked'), 'true');
  assert.deepEqual(changed, { checked: true, value: 'on' });

  // Keyboard space
  sw.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
  assert.equal(sw.checked.value, false);

  // Keyboard enter
  sw.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  assert.equal(sw.checked.value, true);

  // Disabled switch should not toggle
  sw.setAttribute('disabled', 'true');
  sw.click();
  assert.equal(sw.checked.value, true); // stays true

  // Form reset restores initial state
  sw.removeAttribute('disabled');
  sw.formReset();
  assert.equal(sw.checked.value, false);

  document.body.removeChild(sw);
});

test('<el-tooltip> shows and hides on hover, focus, and escape key', () => {
  const tip = document.createElement('el-tooltip');
  tip.setAttribute('content', 'Help text');
  tip.setAttribute('delay', '0');
  tip.innerHTML = '<button>Hover me</button>';
  document.body.appendChild(tip);

  assert.equal(tip.visible.value, false);

  tip.dispatchEvent(new Event('mouseenter'));
  assert.equal(tip.visible.value, true);

  tip.dispatchEvent(new Event('mouseleave'));
  assert.equal(tip.visible.value, false);

  tip.dispatchEvent(new Event('focusin'));
  assert.equal(tip.visible.value, true);

  // Escape key closes tooltip
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(tip.visible.value, false);

  document.body.removeChild(tip);
});

test('<el-accordion> manages single and multiple expansion', () => {
  const acc = document.createElement('el-accordion');
  acc.innerHTML = `
    <el-accordion-item title="Item 1" value="i1">Panel 1</el-accordion-item>
    <el-accordion-item title="Item 2" value="i2">Panel 2</el-accordion-item>
  `;
  document.body.appendChild(acc);

  const item1 = acc.querySelectorAll('el-accordion-item')[0];
  const item2 = acc.querySelectorAll('el-accordion-item')[1];

  let changeEvent = null;
  acc.addEventListener('change', (e) => { changeEvent = e.detail; });

  // Open item 1
  item1.toggle();
  assert.equal(item1.isOpen.value, true);
  assert.equal(item2.isOpen.value, false);
  assert.deepEqual(changeEvent, { value: 'i1', open: true });

  // Opening item 2 should close item 1 (multiple is false by default)
  item2.toggle();
  assert.equal(item1.isOpen.value, false);
  assert.equal(item2.isOpen.value, true);
  assert.deepEqual(changeEvent, { value: 'i2', open: true });

  // Enable multiple
  acc.setAttribute('multiple', 'true');
  item1.toggle();
  assert.equal(item1.isOpen.value, true);
  assert.equal(item2.isOpen.value, true);

  document.body.removeChild(acc);
});

test('<el-table> renders reactive data, handles sorting and row selection', () => {
  const table = document.createElement('el-table');
  table.setAttribute('selectable', 'true');
  document.body.appendChild(table);

  table.columns.value = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'age', label: 'Age', sortable: true },
  ];
  table.data.value = [
    { name: 'Charlie', age: 30 },
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 35 },
  ];

  assert.equal(table.sortedData.value.length, 3);
  assert.equal(table.sortedData.value[0].name, 'Charlie');

  // Sort by name ascending
  table.sortBy('name');
  assert.equal(table.sortKey.value, 'name');
  assert.equal(table.sortDirection.value, 'asc');
  assert.equal(table.sortedData.value[0].name, 'Alice');
  assert.equal(table.sortedData.value[1].name, 'Bob');
  assert.equal(table.sortedData.value[2].name, 'Charlie');

  // Sort by name descending
  table.sortBy('name');
  assert.equal(table.sortDirection.value, 'desc');
  assert.equal(table.sortedData.value[0].name, 'Charlie');

  // Selection
  assert.equal(table.selected.value.length, 0);
  table.toggleRow(0);
  assert.equal(table.selected.value.length, 1);
  assert.equal(table.isRowSelected(0), true);

  // Select all
  table.toggleSelectAll();
  assert.equal(table.selected.value.length, 3);

  // Deselect all
  table.toggleSelectAll();
  assert.equal(table.selected.value.length, 0);

  document.body.removeChild(table);
});
