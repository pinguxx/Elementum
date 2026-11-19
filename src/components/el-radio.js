/**
 * <el-radio> & <el-radio-group>
 * Accessible, zero-dependency radio primitives inspired by Base UI.
 * Features roving tabindex, arrow key navigation, form integration, and clean state attributes.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElRadio extends Elementum {
  static observedAttributes = ['value', 'disabled', 'checked', 'label'];

  value = signal('');
  disabled = signal(false);
  checked = signal(false);
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

    .circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--el-surface-base, #ffffff);
      border: 1px solid var(--el-surface-border, #cbd5e1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    :host(:hover:not([disabled])) .circle {
      border-color: var(--el-color-primary, #2563eb);
    }

    :host(:focus-visible) .circle {
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.35);
      border-color: var(--el-color-primary, #2563eb);
    }

    .circle.checked {
      border-color: var(--el-color-primary, #2563eb);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--el-color-primary, #2563eb);
      transform: scale(0);
      transition: transform 120ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .circle.checked .dot {
      transform: scale(1);
    }

    :root[data-theme="dark"] .circle {
      background: var(--el-surface-card, #111827);
      border-color: #475569;
    }

    :root[data-theme="dark"] .circle.checked {
      border-color: var(--el-color-primary, #2563eb);
    }
  `;

  connected() {
    if (this.hasAttribute('value')) this.value.value = this.getAttribute('value');
    if (this.hasAttribute('label')) this.label.value = this.getAttribute('label');
    this.disabled.value = this.hasAttribute('disabled');
    this.checked.value = this.hasAttribute('checked');
    this.setAttribute('role', 'radio');
    this.tabIndex = this.checked.value ? 0 : -1;
    this.setAttribute('aria-checked', this.checked.value ? 'true' : 'false');

    this.addEventListener('click', () => {
      if (this.disabled.value) return;
      this.select();
    });
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value') this.value.value = newValue || '';
    else if (name === 'label') this.label.value = newValue || '';
    else if (name === 'disabled') this.disabled.value = newValue !== null && newValue !== 'false';
    else if (name === 'checked') {
      this.checked.value = newValue !== null && newValue !== 'false';
      this.tabIndex = this.checked.value ? 0 : -1;
      this.setAttribute('aria-checked', this.checked.value ? 'true' : 'false');
    }
    return true;
  }

  select() {
    const group = this.closest('el-radio-group');
    if (group && typeof group.selectValue === 'function') {
      group.selectValue(this.value.value);
    } else {
      this.checked.value = true;
      this.tabIndex = 0;
      this.setAttribute('aria-checked', 'true');
    }
  }

  render() {
    return html`
      <div class=${() => `circle ${this.checked.value ? 'checked' : ''}`} part="circle">
        <div class="dot" part="dot"></div>
      </div>
      <slot>${() => this.label.value || ''}</slot>
    `;
  }
}

export class ElRadioGroup extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['value', 'name', 'disabled', 'required', 'orientation'];

  value = signal('');
  disabled = signal(false);
  required = signal(false);
  orientation = signal('vertical');

  static styles = css`
    :host {
      display: inline-flex;
      flex-direction: column;
      gap: 10px;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
    }

    :host([orientation="horizontal"]) {
      flex-direction: row;
      gap: 16px;
    }
  `;

  connected() {
    if (this.hasAttribute('value')) this.value.value = this.getAttribute('value');
    if (this.hasAttribute('orientation')) this.orientation.value = this.getAttribute('orientation');
    this.disabled.value = this.hasAttribute('disabled');
    this.required.value = this.hasAttribute('required');
    this.setAttribute('role', 'radiogroup');
    this.setAttribute('aria-required', String(this.required.value));
    this.setFormValue(this.value.value);

    this.#syncChildren();
    if (typeof queueMicrotask !== 'undefined') {
      queueMicrotask(() => this.#syncChildren());
    }

    this.addEventListener('keydown', this.#onKeyDown);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value') {
      this.value.value = newValue || '';
      this.#syncChildren();
      this.setFormValue(this.value.value);
    } else if (name === 'orientation') {
      this.orientation.value = newValue === 'horizontal' ? 'horizontal' : 'vertical';
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
    }
    return true;
  }

  #syncChildren() {
    const radios = Array.from(this.querySelectorAll('el-radio'));
    const val = this.value.value;
    let hasChecked = false;

    radios.forEach((r) => {
      const match = r.getAttribute('value') === val;
      if (match) {
        r.setAttribute('checked', '');
      } else {
        r.removeAttribute('checked');
      }
      if (r.checked && typeof r.checked === 'object' && 'value' in r.checked) {
        r.checked.value = match;
      }
      r.tabIndex = match ? 0 : -1;
      r.setAttribute('aria-checked', match ? 'true' : 'false');
      if (match) hasChecked = true;
    });

    if (!hasChecked && radios.length > 0) {
      radios[0].tabIndex = 0;
    }
  }

  selectValue(val) {
    if (this.disabled.value) return;
    this.value.value = val;
    this.#syncChildren();
    this.setFormValue(val);
    this.emit('change', { value: val });
    this.emit('input', { value: val });
  }

  #onKeyDown = (e) => {
    if (this.disabled.value) return;
    const radios = Array.from(this.querySelectorAll('el-radio:not([disabled])'));
    if (!radios.length) return;

    const currentIdx = radios.findIndex((r) => r.checked.value);
    let nextIdx = currentIdx;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIdx = currentIdx < radios.length - 1 ? currentIdx + 1 : 0;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIdx = currentIdx > 0 ? currentIdx - 1 : radios.length - 1;
    } else {
      return;
    }

    const nextRadio = radios[nextIdx];
    if (nextRadio) {
      this.selectValue(nextRadio.getAttribute('value') || '');
      nextRadio.focus();
    }
  };

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-radio')) customElements.define('el-radio', ElRadio);
  if (!customElements.get('el-radio-group')) customElements.define('el-radio-group', ElRadioGroup);
}
