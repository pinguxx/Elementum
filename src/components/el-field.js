/**
 * <el-field>
 * Accessible form field wrapper providing automated label, description,
 * error state reflection, and ARIA wiring for any slotted form control.
 * Inspired by modern headless Field primitives (Base UI, WAI-ARIA APG).
 *
 * @element el-field
 * @attr {string} label - Text label for the control
 * @attr {string} description - Helper or context description
 * @attr {string} error - Validation error message (forces data-invalid state)
 * @attr {boolean} required - Displays required indicator
 * @attr {boolean} disabled - Marks field and control as disabled
 *
 * @slot - Default slot for form control (<el-input>, <el-select>, <el-number-field>, native <input>)
 * @slot label - Custom label content
 * @slot description - Custom description content
 * @slot error - Custom error content
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

let fieldIdSeq = 0;

export class ElField extends Elementum {
  static observedAttributes = ['label', 'description', 'error', 'required', 'disabled'];

  label = signal('');
  description = signal('');
  error = signal('');
  required = signal(false);
  disabled = signal(false);
  isFocused = signal(false);
  isInvalid = signal(false);
  activeErrorMessage = signal('');

  #fieldId = `el-field-${++fieldIdSeq}`;
  #slottedControl = null;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--el-spacing-xs, 4px);
      width: 100%;
      box-sizing: border-box;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      color: var(--el-text-primary, #0f172a);
    }

    .field-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--el-spacing-xs, 4px);
    }

    .field-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--el-text-primary, #0f172a);
      cursor: default;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      user-select: none;
    }

    .required-indicator {
      color: var(--el-color-danger-text, #991b1b);
      font-weight: 700;
      font-size: 0.875rem;
      line-height: 1;
    }

    .field-description {
      font-size: 0.75rem;
      color: var(--el-text-muted, #64748b);
      line-height: 1.4;
      margin-top: 2px;
    }

    .field-error {
      font-size: 0.75rem;
      color: var(--el-color-danger-text, #991b1b);
      font-weight: 500;
      line-height: 1.4;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
      animation: field-fade-in 150ms ease forwards;
    }

    .error-icon {
      flex-shrink: 0;
      width: 14px;
      height: 14px;
    }

    .control-container {
      width: 100%;
      position: relative;
    }

    /* State reflections */
    :host([data-invalid]) .field-label {
      color: var(--el-color-danger-text, #991b1b);
    }

    :host([data-disabled]) {
      opacity: 0.6;
      pointer-events: none;
    }

    @keyframes field-fade-in {
      from {
        opacity: 0;
        transform: translateY(-2px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  connected() {
    this.label.value = this.getAttribute('label') || '';
    this.description.value = this.getAttribute('description') || '';
    this.error.value = this.getAttribute('error') || '';
    this.required.value = this.hasAttribute('required');
    this.disabled.value = this.hasAttribute('disabled');

    this.#syncState();

    // Wire slotted controls
    const defaultSlot = this.root?.querySelector('slot:not([name])');
    if (defaultSlot) {
      defaultSlot.addEventListener('slotchange', this.#onSlotChange);
    }
    this.#bindControl();
  }

  attributeChanged(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'label') {
      this.label.value = newValue || '';
    } else if (name === 'description') {
      this.description.value = newValue || '';
    } else if (name === 'error') {
      this.error.value = newValue || '';
      this.#syncState();
    } else if (name === 'required') {
      this.required.value = newValue !== null && newValue !== 'false';
      if (this.#slottedControl && !this.#slottedControl.hasAttribute('required') && this.required.value) {
        this.#slottedControl.setAttribute('required', '');
      }
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
      if (this.#slottedControl) {
        if (this.disabled.value) {
          this.#slottedControl.setAttribute('disabled', '');
        } else {
          this.#slottedControl.removeAttribute('disabled');
        }
      }
    }
  }

  #onSlotChange = () => {
    this.#bindControl();
  };

  #bindControl() {
    const control = this.#findControl();
    if (!control || control === this.#slottedControl) return;

    // Detach previous control listeners
    if (this.#slottedControl) {
      this.#slottedControl.removeEventListener('focusin', this.#onControlFocus);
      this.#slottedControl.removeEventListener('focusout', this.#onControlBlur);
      this.#slottedControl.removeEventListener('invalid', this.#onControlInvalid);
      this.#slottedControl.removeEventListener('input', this.#onControlInput);
      this.#slottedControl.removeEventListener('change', this.#onControlInput);
    }

    this.#slottedControl = control;

    // Automatic ARIA association
    const labelId = `${this.#fieldId}-label`;
    const descId = `${this.#fieldId}-desc`;
    const errId = `${this.#fieldId}-err`;

    if (!control.getAttribute('aria-labelledby')) {
      control.setAttribute('aria-labelledby', labelId);
    }

    const describedBy = [];
    if (this.description.value) describedBy.push(descId);
    if (this.isInvalid.value) describedBy.push(errId);
    if (describedBy.length > 0) {
      control.setAttribute('aria-describedby', describedBy.join(' '));
    }

    if (this.required.value && !control.hasAttribute('required')) {
      control.setAttribute('required', '');
    }
    if (control.hasAttribute('required')) {
      this.required.value = true;
    }
    if (this.disabled.value && !control.hasAttribute('disabled')) {
      control.setAttribute('disabled', '');
    }

    // Attach reactive listeners
    control.addEventListener('focusin', this.#onControlFocus);
    control.addEventListener('focusout', this.#onControlBlur);
    control.addEventListener('invalid', this.#onControlInvalid);
    control.addEventListener('input', this.#onControlInput);
    control.addEventListener('change', this.#onControlInput);

    this.#checkControlValidity();
  }

  #findControl() {
    // Look into slotted elements
    const elements = Array.from(this.children);
    for (const el of elements) {
      if (el.slot && el.slot !== '') continue;
      // Is an input, custom element, or form-associated control
      if (
        el.tagName.toLowerCase().startsWith('el-') ||
        ['input', 'select', 'textarea', 'button'].includes(el.tagName.toLowerCase())
      ) {
        return el;
      }
    }
    return this.querySelector('input, select, textarea, [tabindex="0"]');
  }

  #onControlFocus = () => {
    this.isFocused.value = true;
    this.setAttribute('data-focused', '');
  };

  #onControlBlur = () => {
    this.isFocused.value = false;
    this.removeAttribute('data-focused');
    this.#checkControlValidity();
  };

  #onControlInvalid = (e) => {
    const msg = e.target?.validationMessage || 'Invalid input';
    this.activeErrorMessage.value = msg;
    this.isInvalid.value = true;
    this.#syncState();
  };

  #onControlInput = () => {
    this.#checkControlValidity();
  };

  #checkControlValidity() {
    if (this.error.value) {
      this.activeErrorMessage.value = this.error.value;
      this.isInvalid.value = true;
      this.#syncState();
      return;
    }

    const ctrl = this.#slottedControl;
    if (!ctrl) return;

    if (ctrl.validity) {
      if (!ctrl.validity.valid) {
        this.activeErrorMessage.value = ctrl.validationMessage || 'Please check this field';
        this.isInvalid.value = true;
      } else {
        this.isInvalid.value = false;
        this.activeErrorMessage.value = '';
      }
    } else if (ctrl.hasAttribute('aria-invalid') && ctrl.getAttribute('aria-invalid') === 'true') {
      this.isInvalid.value = true;
      this.activeErrorMessage.value = ctrl.getAttribute('data-error-message') || 'Invalid field';
    } else {
      this.isInvalid.value = false;
      this.activeErrorMessage.value = '';
    }

    this.#syncState();
  }

  #syncState() {
    const errText = this.error.value || this.activeErrorMessage.value;
    const invalid = Boolean(errText);

    if (invalid) {
      this.setAttribute('data-invalid', '');
      this.isInvalid.value = true;
      this.activeErrorMessage.value = errText;
      if (this.#slottedControl) {
        this.#slottedControl.setAttribute('aria-invalid', 'true');
        this.#slottedControl.setAttribute('aria-describedby', `${this.#fieldId}-err`);
      }
    } else {
      this.removeAttribute('data-invalid');
      this.isInvalid.value = false;
      this.activeErrorMessage.value = '';
      if (this.#slottedControl) {
        this.#slottedControl.removeAttribute('aria-invalid');
        if (this.description.value) {
          this.#slottedControl.setAttribute('aria-describedby', `${this.#fieldId}-desc`);
        } else {
          this.#slottedControl.removeAttribute('aria-describedby');
        }
      }
    }

    if (this.required.value) {
      this.setAttribute('data-required', '');
    } else {
      this.removeAttribute('data-required');
    }

    if (this.disabled.value) {
      this.setAttribute('data-disabled', '');
    } else {
      this.removeAttribute('data-disabled');
    }
  }

  render() {
    const labelId = `${this.#fieldId}-label`;
    const descId = `${this.#fieldId}-desc`;
    const errId = `${this.#fieldId}-err`;

    return html`
      <!-- Label Row -->
      <div class="field-label-row">
        <label id=${labelId} class="field-label" part="label">
          <slot name="label">${this.label}</slot>
          ${() => (this.required.value ? html`<span class="required-indicator" aria-hidden="true">*</span>` : null)}
        </label>
      </div>

      <!-- Slotted Form Control Container -->
      <div class="control-container" part="control">
        <slot></slot>
      </div>

      <!-- Description Helper -->
      ${() => {
        const desc = this.description.value;
        if (!desc && !this.querySelector('[slot="description"]')) return null;
        return html`
          <div id=${descId} class="field-description" part="description">
            <slot name="description">${desc}</slot>
          </div>
        `;
      }}

      <!-- Validation Error -->
      ${() => {
        const isErr = this.isInvalid.value;
        const msg = this.activeErrorMessage.value || this.error.value;
        if (!isErr && !msg) return null;
        return html`
          <div id=${errId} class="field-error" part="error" role="alert" aria-live="polite">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <slot name="error">${msg}</slot>
          </div>
        `;
      }}
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-field')) {
  customElements.define('el-field', ElField);
}
