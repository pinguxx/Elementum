/**
 * <el-checkbox>
 * Accessible, zero-dependency tri-state checkbox primitive inspired by Base UI.
 * Supports checked, unchecked, and indeterminate states, form association,
 * keyboard controls, and native constraint validation.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElCheckbox extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['checked', 'indeterminate', 'disabled', 'required', 'name', 'value', 'label'];

  checked = signal(false);
  indeterminate = signal(false);
  disabled = signal(false);
  required = signal(false);
  name = signal('');
  value = signal('on');
  label = signal('');

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      font-size: 14px;
      color: var(--el-text-primary, #0f172a);
      cursor: pointer;
      user-select: none;
      outline: none;
      line-height: 1;
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .checkbox-box {
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--el-surface-base, #ffffff);
      border: 1px solid var(--el-surface-border, #cbd5e1);
      border-radius: var(--el-radius-sm, 4px);
      transition: all 120ms ease;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    :host(:hover:not([disabled])) .checkbox-box {
      border-color: var(--el-color-primary, #2563eb);
    }

    :host(:focus-visible) .checkbox-box {
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.35);
      border-color: var(--el-color-primary, #2563eb);
    }

    .checkbox-box.checked,
    .checkbox-box.indeterminate {
      background: var(--el-color-primary, #2563eb);
      border-color: var(--el-color-primary, #2563eb);
      color: #ffffff;
    }

    .icon {
      width: 12px;
      height: 12px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    :root[data-theme="dark"] .checkbox-box {
      background: var(--el-surface-card, #111827);
      border-color: #475569;
    }

    :root[data-theme="dark"] .checkbox-box.checked,
    :root[data-theme="dark"] .checkbox-box.indeterminate {
      background: var(--el-color-primary, #2563eb);
      border-color: var(--el-color-primary, #2563eb);
    }
  `;

  connected() {
    this.#syncAttributes();
    this.tabIndex = this.disabled.value ? -1 : 0;
    this.setAttribute('role', 'checkbox');
    this.#updateAria();
    this.setFormValue(this.checked.value ? this.value.value : null);

    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'checked') {
      this.checked.value = newValue !== null && newValue !== 'false';
    } else if (name === 'indeterminate') {
      this.indeterminate.value = newValue !== null && newValue !== 'false';
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
      this.tabIndex = this.disabled.value ? -1 : 0;
    } else if (name === 'required') {
      this.required.value = newValue !== null && newValue !== 'false';
    } else if (name === 'value') {
      this.value.value = newValue || 'on';
    } else if (name === 'label') {
      this.label.value = newValue || '';
    }
    this.#updateAria();
    this.setFormValue(this.checked.value ? this.value.value : null);
    return true;
  }

  #syncAttributes() {
    this.checked.value = this.hasAttribute('checked');
    this.indeterminate.value = this.hasAttribute('indeterminate');
    this.disabled.value = this.hasAttribute('disabled');
    this.required.value = this.hasAttribute('required');
    if (this.hasAttribute('value')) this.value.value = this.getAttribute('value');
    if (this.hasAttribute('label')) this.label.value = this.getAttribute('label');
  }

  #updateAria() {
    if (this.indeterminate.value) {
      this.setAttribute('aria-checked', 'mixed');
    } else {
      this.setAttribute('aria-checked', this.checked.value ? 'true' : 'false');
    }
    this.setAttribute('aria-disabled', String(this.disabled.value));
    this.setAttribute('aria-required', String(this.required.value));
  }

  #onClick = (e) => {
    if (this.disabled.value) return;
    this.toggle();
  };

  #onKeyDown = (e) => {
    if (this.disabled.value) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
  };

  toggle() {
    if (this.disabled.value) return;
    if (this.indeterminate.value) {
      this.indeterminate.value = false;
      this.checked.value = true;
    } else {
      this.checked.value = !this.checked.value;
    }
    this.#updateAria();
    this.setFormValue(this.checked.value ? this.value.value : null);
    this.emit('change', { checked: this.checked.value });
    this.emit('input', { checked: this.checked.value });
  }

  render() {
    return html`
      <div
        class=${() => {
          let cls = 'checkbox-box';
          if (this.checked.value) cls += ' checked';
          if (this.indeterminate.value) cls += ' indeterminate';
          return cls;
        }}
        part="box"
      >
        ${() => {
          if (this.indeterminate.value) {
            return html`
              <svg class="icon" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            `;
          }
          if (this.checked.value) {
            return html`
              <svg class="icon" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            `;
          }
          return '';
        }}
      </div>
      <slot>${() => this.label.value || ''}</slot>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-checkbox')) {
  customElements.define('el-checkbox', ElCheckbox);
}
