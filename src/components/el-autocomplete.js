import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, effect } from '../signal.js';
import { highlightMatch } from '../behaviors/index.js';
import './el-chip.js';
import './el-spinner.js';

/**
 * <el-autocomplete>
 * Form-associated combobox component supporting static data arrays,
 * remote URL queries with debouncing, flexible key mapping, multi-select with inline chips,
 * and ARIA 1.2 / WCAG 2.2 accessibility.
 *
 * @attr {string} name - Form submission field name
 * @attr {string|Array} value - Form submission resolved value
 * @attr {string} placeholder - Placeholder text
 * @attr {boolean} disabled - Whether the component is disabled
 * @attr {boolean} required - Whether selection is required
 * @attr {boolean} multiple - Enable multi-selection with inline chips
 * @attr {string} url - Remote endpoint URL
 * @attr {string} query-param - Query param name for remote fetch (default: 'q')
 * @attr {number} debounce - Milliseconds to debounce remote queries (default: 250)
 * @attr {number} min-chars - Minimum characters required before querying (default: 1)
 * @attr {string} label-key - Property name for display label (default: 'label')
 * @attr {string} value-key - Property name for submission value (default: 'value')
 * @attr {string} size - Size variant ('sm', 'md', 'lg')
 *
 * @fires change - Dispatched when value changes
 * @fires select - Dispatched when an option is selected with { item, value, label }
 * @fires remove - Dispatched in multi-mode when a chip is removed
 * @fires clear - Dispatched when input is cleared
 */
export class ElAutocomplete extends Elementum {
  static formAssociated = true;

  static observedAttributes = [
    'name', 'value', 'placeholder', 'disabled', 'required',
    'multiple', 'url', 'query-param', 'debounce', 'min-chars',
    'label-key', 'value-key', 'size', 'options', 'data'
  ];

  name = signal('');
  value = signal('');
  displayLabel = signal('');
  placeholder = signal('Search or type...');
  disabled = signal(false);
  required = signal(false);
  multiple = signal(false);
  url = signal('');
  queryParam = signal('q');
  debounce = signal(250);
  minChars = signal(1);
  labelKey = signal('label');
  valueKey = signal('value');
  size = signal('md');

  // Internal reactivity
  data = signal([]);
  suggestions = signal([]);
  isOpen = signal(false);
  isLoading = signal(false);
  activeIndex = signal(-1);
  selectedItem = signal(null);
  selectedItems = signal([]);
  announcement = signal('');

  #debounceTimer = null;
  #abortController = null;
  #listboxId = `el-ac-listbox-${Math.random().toString(36).slice(2, 9)}`;

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: var(--el-font-sans, system-ui, -apple-system, sans-serif);
      width: 100%;
      box-sizing: border-box;
    }

    .combobox-wrapper {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
      width: 100%;
      border: 1px solid var(--el-surface-border, #cbd5e1);
      border-radius: var(--el-radius-md, 8px);
      background-color: var(--el-surface-card, #ffffff);
      color: var(--el-text-primary, #0f172a);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
      padding: 3px 8px;
    }

    .combobox-wrapper:focus-within {
      border-color: var(--el-color-primary, #2563eb);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      outline: none;
    }

    .combobox-wrapper.is-disabled {
      background-color: var(--el-surface-muted, #f1f5f9);
      border-color: var(--el-surface-border, #e2e8f0);
      cursor: not-allowed;
      opacity: 0.65;
    }

    /* Size variants */
    .size-sm {
      min-height: 32px;
      font-size: 0.8125rem;
    }
    .size-md {
      min-height: 40px;
      font-size: 0.875rem;
    }
    .size-lg {
      min-height: 48px;
      font-size: 1rem;
    }

    .prefix-area {
      display: inline-flex;
      align-items: center;
      margin-right: 4px;
      color: var(--el-text-muted, #64748b);
    }

    .chips-group {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }

    .combobox-input {
      flex: 1 1 80px;
      min-width: 80px;
      border: none;
      background: transparent;
      color: inherit;
      font-family: inherit;
      font-size: inherit;
      padding: 5px 0;
      outline: none;
    }

    .combobox-input:disabled {
      cursor: not-allowed;
    }

    .actions-area {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }

    .btn-clear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      min-width: 24px;
      min-height: 24px;
      border: none;
      background: transparent;
      color: var(--el-text-muted, #64748b);
      cursor: pointer;
      border-radius: 50%;
      font-size: 14px;
      padding: 0;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .btn-clear:hover {
      background-color: var(--el-surface-muted, #e2e8f0);
      color: var(--el-text-primary, #0f172a);
    }

    .dropdown-listbox {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background-color: var(--el-surface-card, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 8px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      max-height: 240px;
      overflow-y: auto;
      z-index: 1000;
      list-style: none;
      padding: 4px;
      margin: 0;
      box-sizing: border-box;
    }

    .option-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      min-height: 36px;
      border-radius: var(--el-radius-sm, 6px);
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--el-text-primary, #0f172a);
      transition: background-color 0.1s ease;
      box-sizing: border-box;
    }

    .option-item:hover,
    .option-item.is-active {
      background-color: var(--el-surface-muted, #f1f5f9);
    }

    .option-item.is-selected {
      background-color: var(--el-tint-primary-bg, rgba(37, 99, 235, 0.08));
      color: var(--el-color-primary-text, #1d4ed8);
      font-weight: 600;
    }

    .check-icon {
      font-weight: bold;
      color: var(--el-color-primary-text, #1d4ed8);
      margin-right: 6px;
    }

    .option-meta {
      font-size: 0.75rem;
      color: var(--el-text-muted, #64748b);
      margin-left: 8px;
    }

    .empty-message,
    .loading-message {
      padding: 12px 16px;
      font-size: 0.875rem;
      color: var(--el-text-muted, #64748b);
      text-align: center;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .match-highlight {
      background: color-mix(in srgb, var(--el-color-primary, #2563eb) 14%, transparent);
      color: var(--el-color-primary-text, #1d4ed8);
      font-weight: 700;
      border-radius: 3px;
      padding: 0 2px;
    }

    .option-item.is-active .match-highlight {
      background: color-mix(in srgb, var(--el-color-primary, #2563eb) 26%, transparent);
    }

    @media (pointer: coarse) {
      input {
        font-size: max(16px, 1em);
      }
    }
  `;

  connected() {
    this.required.value = this.hasAttribute('required');
    this.disabled.value = this.hasAttribute('disabled');
    this.multiple.value = this.hasAttribute('multiple');

    this.#syncFormValue();
    this.validate();

    // Form value synchronization
    effect(() => {
      this.#syncFormValue();
      this.validate();
    }, { signal: this.signal });

    // Sync input text with display label in single mode
    effect(() => {
      if (!this.multiple.value) {
        const input = this.root?.querySelector?.('.combobox-input');
        if (input && document.activeElement !== input) {
          input.value = this.displayLabel.value;
        }
      }
    }, { signal: this.signal });

    // Light dismiss on outside clicks
    const onDocPointerDown = (e) => {
      if (!this.isOpen.value) return;
      const path = e.composedPath ? e.composedPath() : [];
      if (!path.includes(this)) {
        this.close();
      }
    };

    document.addEventListener('pointerdown', onDocPointerDown, { signal: this.signal });

    if (this.hasAttribute('options')) {
      this.#applyOptions(this.getAttribute('options'));
    } else if (this.hasAttribute('data')) {
      this.#applyOptions(this.getAttribute('data'));
    }
  }

  get options() {
    return this.data.value;
  }

  set options(val) {
    this.#applyOptions(val);
  }

  #applyOptions(val) {
    if (Array.isArray(val)) {
      this.data.value = val;
    } else if (typeof val === 'string') {
      try {
        this.data.value = JSON.parse(val);
      } catch {
        this.data.value = [];
      }
    }
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'required') {
      this.required.value = newValue !== null && newValue !== 'false';
      this.validate();
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
    } else if (name === 'multiple') {
      this.multiple.value = newValue !== null && newValue !== 'false';
      this.#syncFormValue();
      this.validate();
    } else if (name === 'value') {
      this.value.value = newValue;
      this.#syncFormValue();
      this.validate();
    } else if (name === 'options' || name === 'data') {
      this.#applyOptions(newValue);
    }
  }

  #syncFormValue() {
    if (this.multiple.value) {
      const vals = this.selectedItems.value.map(it => this.getItemValue(it));
      this.setFormValue(vals.join(','));
    } else {
      const val = this.value.value;
      this.setFormValue(val ? String(val) : '');
    }
  }

  validate() {
    const isRequired = Boolean(this.required.value);
    const inputEl = this.root?.querySelector?.('.combobox-input');
    let hasValue = false;

    if (this.multiple.value) {
      hasValue = this.selectedItems.value.length > 0;
    } else {
      hasValue = String(this.value.value || '').trim().length > 0;
    }

    if (isRequired && !hasValue) {
      this.setValidity(
        { valueMissing: true },
        'Please select an option from the list.',
        inputEl
      );
      this.setAttribute('aria-invalid', 'true');
      return false;
    }

    this.setValidity({});
    this.removeAttribute('aria-invalid');
    return true;
  }

  getItemLabel(item) {
    if (item === null || item === undefined) return '';
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    const key = this.labelKey.value || 'label';
    return item[key] !== undefined ? String(item[key]) : (item.label || item.name || item.title || JSON.stringify(item));
  }

  getItemValue(item) {
    if (item === null || item === undefined) return '';
    if (typeof item === 'string' || typeof item === 'number') return item;
    const key = this.valueKey.value || 'value';
    return item[key] !== undefined ? item[key] : (item.value || item.id || this.getItemLabel(item));
  }

  getItemMeta(item) {
    if (!item || typeof item !== 'object') return '';
    return item.meta || item.email || item.code || item.subtitle || '';
  }

  isItemSelected(item) {
    const val = this.getItemValue(item);
    if (this.multiple.value) {
      return this.selectedItems.value.some(it => this.getItemValue(it) === val);
    }
    return this.value.value === val;
  }

  setData(items) {
    this.data.value = Array.isArray(items) ? items : [];
  }

  async search(query) {
    const q = String(query || '').trim();
    const min = Number(this.minChars.value) || 1;

    if (q.length < min) {
      this.suggestions.value = [];
      this.isOpen.value = false;
      this.activeIndex.value = -1;
      return;
    }

    const matchesQuery = (item) => {
      const qLower = q.toLowerCase();
      const label = this.getItemLabel(item).toLowerCase();
      const meta = this.getItemMeta(item).toLowerCase();
      const val = String(this.getItemValue(item)).toLowerCase();
      return label.includes(qLower) || meta.includes(qLower) || val.includes(qLower);
    };

    const endpoint = this.url.value;

    if (endpoint) {
      this.isLoading.value = true;
      this.isOpen.value = true;
      this.activeIndex.value = -1;

      if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
      if (this.#abortController) this.#abortController.abort();

      const delay = Number(this.debounce.value) || 0;

      this.#debounceTimer = setTimeout(async () => {
        this.#abortController = new AbortController();
        try {
          let reqUrl = endpoint;
          if (reqUrl.includes('{query}')) {
            reqUrl = reqUrl.replace('{query}', encodeURIComponent(q));
          } else {
            const sep = reqUrl.includes('?') ? '&' : '?';
            reqUrl = `${reqUrl}${sep}${this.queryParam.value || 'q'}=${encodeURIComponent(q)}`;
          }

          const res = await fetch(reqUrl, { credentials: 'omit', signal: this.#abortController.signal });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          const raw = await res.json();
          const items = Array.isArray(raw) ? raw : (raw.results || raw.data || raw.items || []);

          const filtered = items.filter(matchesQuery);
          this.suggestions.value = filtered.length > 0 ? filtered : items;
          this.isOpen.value = true;
        } catch (err) {
          if (err.name !== 'AbortError') {
            const local = this.data.value.filter(matchesQuery);
            this.suggestions.value = local;
          }
        } finally {
          this.isLoading.value = false;
        }
      }, delay);
    } else {
      const local = this.data.value.filter(matchesQuery);
      this.suggestions.value = local;
      this.isOpen.value = true;
      this.activeIndex.value = -1;
    }
  }

  select(item) {
    if (!item) return;
    const label = this.getItemLabel(item);
    const val = this.getItemValue(item);

    if (this.multiple.value) {
      // Toggle or append item in multi-mode
      const existsIndex = this.selectedItems.value.findIndex(it => this.getItemValue(it) === val);
      if (existsIndex >= 0) {
        this.removeItem(existsIndex);
        return;
      }

      this.selectedItems.value = [...this.selectedItems.value, item];
      const newVals = this.selectedItems.value.map(it => this.getItemValue(it));
      this.value.value = newVals;
      this.displayLabel.value = '';

      const input = this.root?.querySelector?.('.combobox-input');
      if (input) input.value = '';

      this.announcement.value = `Selected ${label}. Total selected: ${this.selectedItems.value.length}.`;
      this.suggestions.value = [];
      this.isOpen.value = false;
      this.activeIndex.value = -1;
      this.validate();

      this.emit('select', { item, items: this.selectedItems.value, value: newVals, label });
      this.emit('change', { value: newVals, items: this.selectedItems.value });
    } else {
      // Single selection mode
      this.selectedItem.value = item;
      this.value.value = val;
      this.displayLabel.value = label;

      const input = this.root?.querySelector?.('.combobox-input');
      if (input) input.value = label;

      this.announcement.value = `Selected ${label}.`;
      this.isOpen.value = false;
      this.activeIndex.value = -1;
      this.validate();

      this.emit('select', { item, value: val, label });
      this.emit('change', { value: val, label });
    }
  }

  removeItem(index) {
    if (!this.multiple.value) return;
    const list = [...this.selectedItems.value];
    if (index < 0 || index >= list.length) return;

    const [removed] = list.splice(index, 1);
    this.selectedItems.value = list;
    const newVals = list.map(it => this.getItemValue(it));
    this.value.value = newVals;
    this.announcement.value = `Removed ${this.getItemLabel(removed)}. Total selected: ${list.length}.`;
    this.validate();

    this.emit('remove', { item: removed, items: list, value: newVals });
    this.emit('change', { value: newVals, items: list });
  }

  clear() {
    this.selectedItem.value = null;
    this.selectedItems.value = [];
    this.value.value = this.multiple.value ? [] : '';
    this.displayLabel.value = '';

    const input = this.root?.querySelector?.('.combobox-input');
    if (input) input.value = '';

    this.suggestions.value = [];
    this.isOpen.value = false;
    this.activeIndex.value = -1;
    this.announcement.value = 'Cleared selection.';
    this.validate();

    this.emit('clear');
    this.emit('change', { value: this.multiple.value ? [] : '', items: [] });
  }

  open() {
    if (this.disabled.value) return;
    if (this.suggestions.value.length > 0) {
      this.isOpen.value = true;
    }
  }

  close() {
    this.isOpen.value = false;
    this.activeIndex.value = -1;
  }

  #onInput = (e) => {
    const query = e.target.value;
    this.displayLabel.value = query;

    if (!this.multiple.value && this.selectedItem.value && this.getItemLabel(this.selectedItem.value) !== query) {
      this.selectedItem.value = null;
      this.value.value = '';
      this.validate();
    }

    this.search(query);
  };

  #onKeyDown = (e) => {
    if (this.disabled.value) return;
    const items = this.suggestions.value;
    const input = e.target;

    switch (e.key) {
      case 'Backspace':
        if (this.multiple.value && input.value === '' && this.selectedItems.value.length > 0) {
          e.preventDefault();
          this.removeItem(this.selectedItems.value.length - 1);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!this.isOpen.value) {
          this.isOpen.value = true;
        } else if (items.length > 0) {
          const next = this.activeIndex.value + 1;
          this.activeIndex.value = next >= items.length ? 0 : next;
          this.#scrollActiveIntoView();
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (this.isOpen.value && items.length > 0) {
          const prev = this.activeIndex.value - 1;
          this.activeIndex.value = prev < 0 ? items.length - 1 : prev;
          this.#scrollActiveIntoView();
        }
        break;

      case 'Enter':
        if (this.isOpen.value && this.activeIndex.value >= 0 && items[this.activeIndex.value]) {
          e.preventDefault();
          this.select(items[this.activeIndex.value]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.close();
        break;

      case 'Tab':
        if (this.isOpen.value && this.activeIndex.value >= 0 && items[this.activeIndex.value]) {
          this.select(items[this.activeIndex.value]);
        } else {
          this.close();
        }
        break;
    }
  };

  #scrollActiveIntoView() {
    const listbox = this.root?.querySelector?.('.dropdown-listbox');
    const active = listbox?.querySelector?.('.is-active');
    if (active && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest' });
    }
  }

  formReset() {
    this.clear();
  }

  formResetCallback() {
    this.clear();
  }

  render() {
    const listId = this.#listboxId;

    return html`
      <div
        class=${() => `combobox-wrapper size-${this.size.value}${this.disabled.value ? ' is-disabled' : ''}`}
        part="wrapper"
      >
        <span class="prefix-area" part="prefix">
          <slot name="prefix"></slot>
        </span>

        ${() => this.multiple.value ? html`
          <div class="chips-group" part="chips" role="list" aria-label="Selected items">
            ${() => this.selectedItems.value.map((item, idx) => {
              const label = this.getItemLabel(item);
              return html`
                <el-chip
                  role="listitem"
                  size="sm"
                  variant="primary"
                  removable
                  part="chip"
                  aria-label=${`Selected: ${label}`}
                  @remove=${() => this.removeItem(idx)}
                >${label}</el-chip>
              `;
            })}
          </div>
        ` : null}

        <input
          type="text"
          class="combobox-input"
          part="input"
          placeholder=${() => (this.multiple.value && this.selectedItems.value.length > 0) ? '' : this.placeholder.value}
          ?disabled=${this.disabled}
          ?required=${() => (this.multiple.value && this.selectedItems.value.length > 0) ? null : this.required.value}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded=${() => this.isOpen.value ? 'true' : 'false'}
          aria-controls=${listId}
          aria-haspopup="listbox"
          aria-activedescendant=${() => this.activeIndex.value >= 0 ? `${listId}-opt-${this.activeIndex.value}` : ''}
          @input=${this.#onInput}
          @keydown=${this.#onKeyDown}
          @focus=${() => { if (this.suggestions.value.length > 0) this.open(); }}
        />

        <div class="actions-area" part="actions">
          ${() => this.isLoading.value ? html`<el-spinner size="sm" part="spinner"></el-spinner>` : null}
          ${() => ((this.displayLabel.value || this.selectedItems.value.length > 0) && !this.disabled.value) ? html`
            <button
              type="button"
              class="btn-clear"
              part="clear-button"
              aria-label="Clear all selections"
              @click=${() => this.clear()}
            >✕</button>
          ` : null}
          <slot name="suffix"></slot>
        </div>
      </div>

      <!-- Accessible Live Region for Screen Readers -->
      <span class="sr-only" aria-live="polite" part="announcer">
        ${() => this.announcement.value}
      </span>

      ${() => this.isOpen.value ? html`
        <ul
          id=${listId}
          class="dropdown-listbox"
          part="listbox"
          role="listbox"
          tabindex="-1"
        >
          ${() => {
            const list = this.suggestions.value;
            if (this.isLoading.value && list.length === 0) {
              return html`<li class="loading-message">Searching suggestions...</li>`;
            }
            if (list.length === 0) {
              return html`<li class="empty-message">No matching results found</li>`;
            }
            return list.map((item, idx) => {
              const label = this.getItemLabel(item);
              const meta = this.getItemMeta(item);
              const isSelected = this.isItemSelected(item);
              const isActive = this.activeIndex.value === idx;

              return html`
                <li
                  id=${`${listId}-opt-${idx}`}
                  class=${`option-item${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}`}
                  role="option"
                  aria-selected=${isSelected ? 'true' : 'false'}
                  part="option"
                  @click=${() => this.select(item)}
                >
                  <span class="option-label">
                    ${isSelected ? html`<span class="check-icon" aria-hidden="true">✓ </span>` : null}
                    ${highlightMatch(label, this.displayLabel.value)}
                  </span>
                  ${meta ? html`<span class="option-meta">${meta}</span>` : null}
                </li>
              `;
            });
          }}
        </ul>
      ` : null}
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-autocomplete')) {
  customElements.define('el-autocomplete', ElAutocomplete);
}
