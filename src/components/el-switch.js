/**
 * <el-switch>
 * Form-associated binary toggle switch with keyboard support and token styling.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElSwitch extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['checked', 'disabled', 'name', 'value', 'size', 'required', 'label'];

  checked = signal(false);
  disabled = signal(false);
  required = signal(false);
  name = signal('');
  value = signal('on');
  size = signal('md'); // 'sm' | 'md' | 'lg'
  label = signal('');

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--el-spacing-sm, 8px);
      font-family: inherit;
      cursor: pointer;
      user-select: none;
      vertical-align: middle;
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .track {
      position: relative;
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      background: var(--el-surface-border, #d1d5db);
      border-radius: 9999px;
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    :host(:focus-visible) .track,
    .track:focus-visible {
      box-shadow: 0 0 0 3px var(--el-focus-ring, rgba(37, 99, 235, 0.4));
    }

    .track.checked {
      background: var(--el-color-primary, #2563eb);
    }

    .thumb {
      position: absolute;
      background: var(--el-color-primary-contrast, #ffffff);
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Size variants */
    :host([size="sm"]) .track {
      width: 32px;
      height: 18px;
    }
    :host([size="sm"]) .thumb {
      width: 14px;
      height: 14px;
      left: 2px;
    }
    :host([size="sm"]) .track.checked .thumb {
      transform: translateX(14px);
    }

    :host([size="md"]) .track,
    .track {
      width: 44px;
      height: 24px;
    }
    :host([size="md"]) .thumb,
    .thumb {
      width: 20px;
      height: 20px;
      left: 2px;
    }
    :host([size="md"]) .track.checked .thumb,
    .track.checked .thumb {
      transform: translateX(20px);
    }

    :host([size="lg"]) .track {
      width: 56px;
      height: 30px;
    }
    :host([size="lg"]) .thumb {
      width: 26px;
      height: 26px;
      left: 2px;
    }
    :host([size="lg"]) .track.checked .thumb {
      transform: translateX(26px);
    }

    .label {
      font-size: 0.9375rem;
      color: var(--el-text-base, #111827);
    }
  `;

  connected() {
    this.checked.value = this.hasAttribute('checked');
    this.disabled.value = this.hasAttribute('disabled');
    this.required.value = this.hasAttribute('required');
    if (this.hasAttribute('label')) this.label.value = this.getAttribute('label');
    this.#syncForm();
    this.validate();

    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);

    if (!this.hasAttribute('tabindex') && !this.disabled.value) {
      this.setAttribute('tabindex', '0');
    }
    this.setAttribute('role', 'switch');
    this.setAttribute('aria-checked', String(this.checked.value));
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'checked') {
      const isChecked = newValue !== null && newValue !== 'false';
      this.checked.value = isChecked;
      this.setAttribute('aria-checked', String(isChecked));
      this.#syncForm();
      this.validate();
    } else if (name === 'required') {
      this.required.value = newValue !== null && newValue !== 'false';
      this.validate();
    } else if (name === 'disabled') {
      const isDisabled = newValue !== null && newValue !== 'false';
      this.disabled.value = isDisabled;
      this.setAttribute('aria-disabled', String(isDisabled));
      if (isDisabled) {
        this.removeAttribute('tabindex');
      } else {
        this.setAttribute('tabindex', '0');
      }
    } else if (name === 'label') {
      this.label.value = newValue || '';
    }
  }

  formReset() {
    this.checked.value = this.hasAttribute('checked');
    this.setAttribute('aria-checked', String(this.checked.value));
    this.#syncForm();
    this.validate();
  }

  validate() {
    if (this.required.value && !this.checked.value) {
      this.setValidity({ valueMissing: true }, 'Please turn this switch on.');
      this.setAttribute('aria-invalid', 'true');
      return false;
    }
    this.setValidity({});
    this.removeAttribute('aria-invalid');
    return true;
  }

  #syncForm() {
    if (this.checked.value) {
      this.setFormValue(this.value.value || 'on');
    } else {
      this.setFormValue(null);
    }
  }

  toggle() {
    if (this.disabled.value) return;
    this.checked.value = !this.checked.value;
    this.setAttribute('aria-checked', String(this.checked.value));
    this.#syncForm();
    this.validate();
    this.emit('change', { checked: this.checked.value, value: this.value.value });
  }

  #onClick = (e) => {
    e.preventDefault();
    this.toggle();
  };

  #onKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
  };

  render() {
    return html`
      <div
        class=${() => `track ${this.checked.value ? 'checked' : ''}`}
        part="track"
      >
        <div class="thumb" part="thumb"></div>
      </div>
      <span class="label" part="label">
        <slot>${() => this.label.value || ''}</slot>
      </span>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-switch')) {
  customElements.define('el-switch', ElSwitch);
}
