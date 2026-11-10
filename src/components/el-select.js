/**
 * <el-select>
 * Form-associated select component with custom styling and design tokens.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElSelect extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['value', 'placeholder', 'disabled', 'name', 'required'];

  value = signal('');
  placeholder = signal('');
  disabled = signal(false);
  name = signal('');
  required = signal(false);
  options = signal([]); // [{ label, value }]

  static styles = css`
    :host {
      display: inline-block;
      width: 100%;
      font-family: inherit;
    }

    .wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--el-surface-base, #ffffff);
      border: 1px solid var(--el-surface-border, #e5e7eb);
      border-radius: var(--el-radius-md, 8px);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      height: 40px;
      box-sizing: border-box;
    }

    .wrapper:focus-within {
      border-color: var(--el-color-primary, #2563eb);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    select {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      background: transparent;
      padding: 0 var(--el-spacing-md, 16px);
      padding-right: 32px;
      font-family: inherit;
      font-size: 0.9375rem;
      color: var(--el-text-base, #111827);
      cursor: pointer;
      appearance: none;
    }

    select:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .arrow {
      position: absolute;
      right: 12px;
      pointer-events: none;
      font-size: 0.75rem;
      color: var(--el-text-muted, #6b7280);
    }
  `;

  connected() {
    this.required.value = this.hasAttribute('required');
    this.#scanOptions();
    if (!this.value.value && !this.hasAttribute('placeholder') && this.options.value.length > 0) {
      this.value.value = this.options.value[0].value;
    }
    this.setFormValue(this.value.value);
    this.validate();

    const observer = new MutationObserver(() => {
      this.#scanOptions();
      if (!this.value.value && !this.hasAttribute('placeholder') && this.options.value.length > 0) {
        this.value.value = this.options.value[0].value;
        this.setFormValue(this.value.value);
      }
      this.validate();
    });
    observer.observe(this, { childList: true, subtree: true });
    this.signal.addEventListener('abort', () => observer.disconnect());
  }

  formReset() {
    const initial = this.getAttribute('value') || '';
    this.value.value = initial;
    this.setFormValue(initial);
    this.validate();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value') {
      this.setFormValue(newValue);
      this.validate();
    } else if (name === 'required') {
      this.required.value = newValue !== null && newValue !== 'false';
      this.validate();
    }
  }

  validate() {
    const val = String(this.value.value || '');
    const selectEl = this.root?.querySelector?.('select');

    if (this.required.value && !val.trim()) {
      this.setValidity({ valueMissing: true }, 'Please select an item in the list.', selectEl);
      this.setAttribute('aria-invalid', 'true');
      return false;
    }

    this.setValidity({});
    this.removeAttribute('aria-invalid');
    return true;
  }

  #scanOptions() {
    const rawOptions = Array.from(this.querySelectorAll('option')).map((opt) => ({
      label: opt.textContent.trim(),
      value: opt.value || opt.textContent.trim(),
    }));
    this.options.value = rawOptions;
  }

  #onChange = (e) => {
    const val = e.target.value;
    this.value.value = val;
    this.setFormValue(val);
    this.validate();
    this.emit('change', { value: val });
  };

  render() {
    return html`
      <div class="wrapper" part="wrapper">
        <select
          part="select"
          ?disabled=${this.disabled}
          @change=${this.#onChange}
        >
          ${() =>
            this.placeholder.value
              ? html`
                  <option value="" disabled ?selected=${() => !this.value.value}>
                    ${this.placeholder}
                  </option>
                `
              : ''}
          ${() =>
            this.options.value.map(
              (opt) => html`
                <option
                  value=${opt.value}
                  ?selected=${() => this.value.value === opt.value}
                >
                  ${opt.label}
                </option>
              `
            )}
        </select>
        <span class="arrow">▼</span>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-select')) {
  customElements.define('el-select', ElSelect);
}
