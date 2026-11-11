import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ElPagination } from '../src/components/el-pagination.js';
import { ElChip } from '../src/components/el-chip.js';

test('<el-pagination> calculates total pages, windowing, and handles navigation', () => {
  const pag = document.createElement('el-pagination');
  pag.setAttribute('total', '100');
  pag.setAttribute('page-size', '10');
  pag.setAttribute('page', '1');
  document.body.appendChild(pag);

  // Total pages: 100 / 10 = 10
  assert.equal(pag.totalPages.value, 10);
  assert.equal(pag.page.value, 1);

  // First page: previous button should be disabled
  const prevBtn = pag.root.querySelector('.prev-btn');
  const nextBtn = pag.root.querySelector('.next-btn');
  assert.ok(prevBtn.disabled);
  assert.ok(!nextBtn.disabled);

  let changeEvent = null;
  pag.addEventListener('pagechange', (e) => (changeEvent = e.detail));

  // Next page
  pag.next();
  assert.equal(pag.page.value, 2);
  assert.deepEqual(changeEvent, { page: 2, pageSize: 10 });
  assert.ok(!prevBtn.disabled);

  // Jump to page 6: range should show 1, ..., 5, 6, 7, ..., 10
  pag.setPage(6);
  assert.equal(pag.page.value, 6);
  assert.deepEqual(changeEvent, { page: 6, pageSize: 10 });

  const activeBtn = pag.root.querySelector('.page-btn.active');
  assert.ok(activeBtn);
  assert.equal(activeBtn.textContent.trim(), '6');
  assert.equal(activeBtn.getAttribute('aria-current'), 'page');

  // Jump to last page (10)
  pag.setPage(10);
  assert.equal(pag.page.value, 10);
  assert.ok(nextBtn.disabled);

  // Clicking a page number
  const pageButtons = Array.from(pag.root.querySelectorAll('.page-btn'));
  const firstBtn = pageButtons.find((b) => b.textContent.trim() === '1');
  assert.ok(firstBtn);
  firstBtn.click();
  assert.equal(pag.page.value, 1);

  // Small total (e.g. 20 items / 10 = 2 pages)
  pag.setAttribute('total', '20');
  pag.attributeChanged('total', '100', '20');
  assert.equal(pag.totalPages.value, 2);

  document.body.removeChild(pag);
});

test('<el-chip> selectable, removable, keyboard events, and disabled states', () => {
  const chip = document.createElement('el-chip');
  chip.setAttribute('selectable', '');
  chip.setAttribute('removable', '');
  chip.setAttribute('value', 'javascript');
  chip.setAttribute('variant', 'primary');
  chip.textContent = 'JavaScript';
  document.body.appendChild(chip);

  assert.equal(chip.variant.value, 'primary');
  assert.equal(chip.value.value, 'javascript');
  assert.equal(chip.selected.value, false);

  let changeDetail = null;
  let removeDetail = null;
  chip.addEventListener('change', (e) => (changeDetail = e.detail));
  chip.addEventListener('remove', (e) => (removeDetail = e.detail));

  // 1. Click to select
  chip.click();
  assert.equal(chip.selected.value, true);
  assert.deepEqual(changeDetail, { selected: true, value: 'javascript' });
  assert.ok(chip.hasAttribute('selected'));

  // 2. Click to deselect
  chip.click();
  assert.equal(chip.selected.value, false);
  assert.deepEqual(changeDetail, { selected: false, value: 'javascript' });
  assert.ok(!chip.hasAttribute('selected'));

  // 3. Keyboard Enter to select
  chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
  assert.equal(chip.selected.value, true);

  // 4. Click remove button
  const removeBtn = chip.root.querySelector('.remove-btn');
  assert.ok(removeBtn);
  removeBtn.click();
  assert.deepEqual(removeDetail, { value: 'javascript' });

  // 5. Keyboard Backspace to remove
  removeDetail = null;
  chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true }));
  assert.deepEqual(removeDetail, { value: 'javascript' });

  // 6. Disabled chip
  chip.setAttribute('disabled', '');
  chip.attributeChanged('disabled', null, '');
  changeDetail = null;
  chip.click();
  assert.equal(changeDetail, null);

  document.body.removeChild(chip);
});
