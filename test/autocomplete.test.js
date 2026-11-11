import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ElAutocomplete } from '../src/components/el-autocomplete.js';

test('<el-autocomplete> filters local data, handles keyboard navigation, and selects items', async () => {
  const ac = document.createElement('el-autocomplete');
  ac.setAttribute('label-key', 'name');
  ac.setAttribute('value-key', 'id');
  document.body.appendChild(ac);

  ac.setData([
    { id: 'sfo', name: 'San Francisco International (SFO)', meta: 'USA' },
    { id: 'jfk', name: 'John F. Kennedy International (JFK)', meta: 'USA' },
    { id: 'hnd', name: 'Tokyo Haneda (HND)', meta: 'Japan' },
    { id: 'lhr', name: 'London Heathrow (LHR)', meta: 'UK' },
  ]);

  // Initial state
  assert.equal(ac.isOpen.value, false);
  assert.equal(ac.value.value, '');

  let selectEvent = null;
  let changeEvent = null;
  ac.addEventListener('select', (e) => (selectEvent = e.detail));
  ac.addEventListener('change', (e) => (changeEvent = e.detail));

  // Perform search
  await ac.search('tokyo');
  assert.equal(ac.isOpen.value, true);
  assert.equal(ac.suggestions.value.length, 1);
  assert.equal(ac.suggestions.value[0].id, 'hnd');

  // Input element within shadowRoot
  const input = ac.root.querySelector('.combobox-input');
  assert.ok(input);
  assert.equal(input.getAttribute('role'), 'combobox');
  assert.equal(input.getAttribute('aria-expanded'), 'true');

  // Select item programmatically or click
  ac.select(ac.suggestions.value[0]);
  assert.equal(ac.value.value, 'hnd');
  assert.equal(ac.displayLabel.value, 'Tokyo Haneda (HND)');
  assert.equal(ac.isOpen.value, false);
  assert.equal(selectEvent.value, 'hnd');
  assert.equal(changeEvent.value, 'hnd');

  // Search with multiple results & keyboard navigation (matching meta 'USA')
  await ac.search('usa');
  assert.equal(ac.suggestions.value.length, 2);

  // ArrowDown to highlight first item
  const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
  input.dispatchEvent(downEvent);
  assert.equal(ac.activeIndex.value, 0);

  // ArrowDown to highlight second item
  input.dispatchEvent(downEvent);
  assert.equal(ac.activeIndex.value, 1);

  // ArrowUp to wrap back to first item
  const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
  input.dispatchEvent(upEvent);
  assert.equal(ac.activeIndex.value, 0);

  // Enter to select highlighted item
  const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
  input.dispatchEvent(enterEvent);
  assert.equal(ac.value.value, 'sfo');
  assert.equal(ac.isOpen.value, false);

  // Test Escape key closes dropdown
  await ac.search('sfo');
  assert.equal(ac.isOpen.value, true);
  const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
  input.dispatchEvent(escEvent);
  assert.equal(ac.isOpen.value, false);

  // Test click on option
  await ac.search('london');
  const option = ac.root.querySelector('.option-item');
  assert.ok(option);
  option.click();
  assert.equal(ac.value.value, 'lhr');
  assert.equal(ac.isOpen.value, false);

  // Clear button test
  const clearBtn = ac.root.querySelector('.btn-clear');
  assert.ok(clearBtn);
  clearBtn.click();
  assert.equal(ac.value.value, '');
  assert.equal(ac.displayLabel.value, '');
  assert.equal(ac.selectedItem.value, null);

  // Test minChars: searching with empty string closes suggestions
  await ac.search('');
  assert.equal(ac.isOpen.value, false);
  assert.equal(ac.suggestions.value.length, 0);

  ac.remove();
});

test('<el-autocomplete> remote URL query, debounce, and error handling', async () => {
  const ac = document.createElement('el-autocomplete');
  ac.setAttribute('url', 'https://jsonplaceholder.typicode.com/users?q={query}');
  ac.setAttribute('debounce', '50');
  ac.setAttribute('label-key', 'name');
  ac.setAttribute('value-key', 'id');
  document.body.appendChild(ac);

  // Mock global fetch for test
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    return {
      ok: true,
      json: async () => [
        { id: 1, name: 'Leanne Graham', email: 'sincere@april.biz' },
        { id: 2, name: 'Ervin Howell', email: 'shanna@melissa.tv' }
      ]
    };
  };

  try {
    await ac.search('leanne');
    // Wait for debounce timer
    await new Promise((r) => setTimeout(r, 70));

    assert.equal(ac.isOpen.value, true);
    assert.equal(ac.suggestions.value.length, 1);
    assert.equal(ac.suggestions.value[0].name, 'Leanne Graham');

    // Select the fetched item
    ac.select(ac.suggestions.value[0]);
    assert.equal(ac.value.value, 1);
    assert.equal(ac.displayLabel.value, 'Leanne Graham');
  } finally {
    globalThis.fetch = originalFetch;
    ac.remove();
  }
});

test('<el-autocomplete> form association, validation, and reset', () => {
  const form = document.createElement('form');
  const ac = document.createElement('el-autocomplete');
  ac.setAttribute('name', 'airport');
  ac.setAttribute('required', '');
  form.appendChild(ac);
  document.body.appendChild(form);

  ac.setData(['Seattle (SEA)', 'Chicago (ORD)']);

  // Initially required without value
  assert.equal(ac.checkValidity(), false);

  // Select valid value
  ac.select('Seattle (SEA)');
  assert.equal(ac.value.value, 'Seattle (SEA)');
  assert.equal(ac.checkValidity(), true);

  // Form reset callback
  ac.formReset();
  assert.equal(ac.value.value, '');
  assert.equal(ac.displayLabel.value, '');

  form.remove();
});

test('<el-autocomplete multiple> renders inline chips, handles Backspace and remove events', async () => {
  const form = document.createElement('form');
  const ac = document.createElement('el-autocomplete');
  ac.setAttribute('multiple', '');
  ac.setAttribute('required', '');
  ac.setAttribute('name', 'tags');
  form.appendChild(ac);
  document.body.appendChild(form);

  ac.setData([
    { id: 'react', label: 'React 19' },
    { id: 'vue', label: 'Vue 3' },
    { id: 'elementum', label: 'Elementum' }
  ]);

  // Initially required and empty
  assert.equal(ac.checkValidity(), false);
  assert.equal(ac.selectedItems.value.length, 0);

  // Select first item
  let selectEvent = null;
  let removeEvent = null;
  ac.addEventListener('select', (e) => (selectEvent = e.detail));
  ac.addEventListener('remove', (e) => (removeEvent = e.detail));

  ac.select(ac.data.value[0]); // React 19
  assert.equal(ac.selectedItems.value.length, 1);
  assert.deepEqual(ac.value.value, ['react']);
  assert.equal(ac.checkValidity(), true);
  assert.ok(selectEvent);
  assert.equal(selectEvent.label, 'React 19');

  // Verify inline chip rendered in Shadow DOM
  const chips = Array.from(ac.root.querySelectorAll('el-chip'));
  assert.equal(chips.length, 1);
  assert.equal(chips[0].textContent.trim(), 'React 19');
  assert.ok(chips[0].hasAttribute('removable'));

  // Select second item
  ac.select(ac.data.value[2]); // Elementum
  assert.equal(ac.selectedItems.value.length, 2);
  assert.deepEqual(ac.value.value, ['react', 'elementum']);

  // Test Backspace on empty input removes last chip
  const input = ac.root.querySelector('.combobox-input');
  input.value = '';
  const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true });
  input.dispatchEvent(backspaceEvent);

  assert.equal(ac.selectedItems.value.length, 1);
  assert.deepEqual(ac.value.value, ['react']);
  assert.ok(removeEvent);
  assert.equal(removeEvent.item.id, 'elementum');

  // Test removeItem directly
  ac.removeItem(0);
  assert.equal(ac.selectedItems.value.length, 0);
  assert.equal(ac.checkValidity(), false);

  // Test Clear button in multi-mode
  ac.select(ac.data.value[1]);
  assert.equal(ac.selectedItems.value.length, 1);
  ac.clear();
  assert.equal(ac.selectedItems.value.length, 0);
  assert.deepEqual(ac.value.value, []);

  form.remove();
});
