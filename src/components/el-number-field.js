/**
 * <el-number-field>
 * Accessible numerical input with stepper buttons, precision clamping,
 * and Figma/Blender-style drag scrubbing.
 * Form-associated with native ElementInternals and zero dependencies.
 *
 * @element el-number-field
 * @attr {number} value - Numerical value
 * @attr {number} min - Minimum value constraint
 * @attr {number} max - Maximum value constraint
 * @attr {number} step - Step increment/decrement amount (default: 1)
 * @attr {number} precision - Fixed decimal places (optional)
 * @attr {string} prefix - Text or currency symbol shown before number (e.g. '$')
 * @attr {string} suffix - Unit or text shown after number (e.g. 'px', '%')
 * @attr {boolean} scrub - Enable click-and-drag scrubbing on prefix/label zone
 * @attr {boolean} disabled - Disable the field
 * @attr {boolean} readonly - Prevent user editing
 * @attr {boolean} required - Form validation constraint
 * @attr {string} name - Form submission field name
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElNumberField extends Elementum {
  static formAssociated = true;
  static observedAttributes = [
    'value',
    'min',
    'max',
    'step',
    'precision',
    'prefix',
    'suffix',
    'scrub',
    'disabled',
    'readonly',
    'required',
    'name'
  ];

  value = signal(0);
  min = signal(null);
  max = signal(null);
  step = signal(1);
  precision = signal(null);
  prefix = signal('');
  suffix = signal('');
  scrub = signal(false);
  disabled = signal(false);
  readonly = signal(false);
  required = signal(false);
  name = signal('');

  #isScrubbing = signal(false);
  #dragStartX = 0;
  #dragStartVal = 0;

  static styles = css`
    :host {
      display: inline-block;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      color: var(--el-text-primary, #0f172a);
      box-sizing: border-box;
      vertical-align: middle;
      width: 100%;
      max-width: 220px;
    }

    .field-wrapper {
      display: flex;
      align-items: center;
      position: relative;
      background: var(--el-surface-base, #ffffff);
      border: 1px solid var(--el-surface-border, #e5e7eb);
      border-radius: var(--el-radius-md, 8px);
      box-shadow: var(--el-shadow-subtle, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      transition: border-color 150ms ease, box-shadow 150ms ease;
      overflow: hidden;
    }

    .field-wrapper:focus-within {
      border-color: var(--el-color-primary, #2563eb);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    :host([data-scrubbing]) .field-wrapper {
      border-color: var(--el-color-primary, #2563eb);
      cursor: ew-resize !important;
      user-select: none;
    }

    /* Stepper Buttons */
    .stepper-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 36px;
      padding: 0;
      background: var(--el-surface-muted, #f8fafc);
      border: none;
      color: var(--el-text-secondary, #475569);
      cursor: pointer;
      user-select: none;
      transition: background-color 120ms ease, color 120ms ease;
      flex-shrink: 0;
    }

    .stepper-btn:hover:not(:disabled) {
      background: var(--el-surface-border, #e2e8f0);
      color: var(--el-text-primary, #0f172a);
    }

    .stepper-btn:active:not(:disabled) {
      background: rgba(37, 99, 235, 0.15);
      color: var(--el-color-primary, #2563eb);
    }

    .stepper-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .stepper-btn.decrement {
      border-right: 1px solid var(--el-surface-border, #e5e7eb);
    }

    .stepper-btn.increment {
      border-left: 1px solid var(--el-surface-border, #e5e7eb);
    }

    /* Inner Input & Affixes */
    .input-row {
      display: flex;
      align-items: center;
      flex: 1;
      height: 36px;
      padding: 0 8px;
      min-width: 0;
    }

    .affix {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--el-text-muted, #64748b);
      user-select: none;
      flex-shrink: 0;
    }

    .affix.prefix.scrubbable {
      cursor: ew-resize;
      padding: 2px 4px;
      border-radius: var(--el-radius-sm, 4px);
      transition: background-color 120ms ease, color 120ms ease;
    }

    .affix.prefix.scrubbable:hover {
      background: var(--el-surface-muted, #f1f5f9);
      color: var(--el-color-primary, #2563eb);
    }

    input {
      flex: 1;
      width: 100%;
      min-width: 0;
      height: 100%;
      border: none;
      outline: none;
      background: transparent;
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--el-text-primary, #0f172a);
      text-align: center;
      padding: 0 4px;
      box-sizing: border-box;
      -moz-appearance: textfield;
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    :host([disabled]) {
      opacity: 0.55;
      pointer-events: none;
    }

    :host([data-invalid]) .field-wrapper {
      border-color: var(--el-color-danger, #ef4444);
    }
  `;

  connected() {
    this.#parseInitialAttributes();
    this.setFormValue(String(this.value.value));
    this.#validate();
  }

  formReset() {
    this.#parseInitialAttributes();
    this.setFormValue(String(this.value.value));
    this.#validate();
  }

  #parseInitialAttributes() {
    if (this.hasAttribute('value')) {
      this.value.value = Number(this.getAttribute('value')) || 0;
    }
    if (this.hasAttribute('min')) {
      this.min.value = Number(this.getAttribute('min'));
    }
    if (this.hasAttribute('max')) {
      this.max.value = Number(this.getAttribute('max'));
    }
    if (this.hasAttribute('step')) {
      this.step.value = Number(this.getAttribute('step')) || 1;
    }
    if (this.hasAttribute('precision')) {
      this.precision.value = Number(this.getAttribute('precision'));
    }
    this.prefix.value = this.getAttribute('prefix') || '';
    this.suffix.value = this.getAttribute('suffix') || '';
    this.scrub.value = this.hasAttribute('scrub');
    this.disabled.value = this.hasAttribute('disabled');
    this.readonly.value = this.hasAttribute('readonly');
    this.required.value = this.hasAttribute('required');
    this.name.value = this.getAttribute('name') || '';
  }

  attributeChanged(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'value') {
      this.value.value = Number(newValue) || 0;
      this.setFormValue(String(this.value.value));
      this.#validate();
    } else if (name === 'min') {
      this.min.value = newValue !== null ? Number(newValue) : null;
      this.#validate();
    } else if (name === 'max') {
      this.max.value = newValue !== null ? Number(newValue) : null;
      this.#validate();
    } else if (name === 'step') {
      this.step.value = Number(newValue) || 1;
    } else if (name === 'precision') {
      this.precision.value = newValue !== null ? Number(newValue) : null;
    } else if (name === 'prefix') {
      this.prefix.value = newValue || '';
    } else if (name === 'suffix') {
      this.suffix.value = newValue || '';
    } else if (name === 'scrub') {
      this.scrub.value = newValue !== null && newValue !== 'false';
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
    } else if (name === 'readonly') {
      this.readonly.value = newValue !== null && newValue !== 'false';
    } else if (name === 'required') {
      this.required.value = newValue !== null && newValue !== 'false';
      this.#validate();
    } else if (name === 'name') {
      this.name.value = newValue || '';
    }
  }

  #formatValue(val) {
    if (val === null || val === undefined || isNaN(val)) return '0';
    const prec = this.precision.value;
    if (prec !== null && prec >= 0) {
      return Number(val).toFixed(prec);
    }
    return String(val);
  }

  #clamp(val) {
    let res = val;
    if (this.min.value !== null && res < this.min.value) {
      res = this.min.value;
    }
    if (this.max.value !== null && res > this.max.value) {
      res = this.max.value;
    }
    const prec = this.precision.value;
    if (prec !== null && prec >= 0) {
      res = Number(res.toFixed(prec));
    }
    return res;
  }

  #updateValue(newVal, emitChange = true) {
    const clamped = this.#clamp(newVal);
    if (this.value.value !== clamped) {
      this.value.value = clamped;
      this.setFormValue(String(clamped));
      this.#validate();

      this.emit('input', { value: clamped });
      if (emitChange) {
        this.emit('change', { value: clamped });
      }
    }
  }

  stepUp(multiplier = 1) {
    if (this.disabled.value || this.readonly.value) return;
    const stp = (this.step.value || 1) * multiplier;
    this.#updateValue(this.value.value + stp);
  }

  stepDown(multiplier = 1) {
    if (this.disabled.value || this.readonly.value) return;
    const stp = (this.step.value || 1) * multiplier;
    this.#updateValue(this.value.value - stp);
  }

  #validate() {
    const val = this.value.value;
    const inputEl = this.root?.querySelector?.('input');

    if (this.required.value && (val === null || val === undefined || isNaN(val))) {
      this.setValidity({ valueMissing: true }, 'Value is required', inputEl);
      this.setAttribute('data-invalid', '');
      return false;
    }

    if (this.min.value !== null && val < this.min.value) {
      this.setValidity({ rangeUnderflow: true }, `Value must be at least ${this.min.value}`, inputEl);
      this.setAttribute('data-invalid', '');
      return false;
    }

    if (this.max.value !== null && val > this.max.value) {
      this.setValidity({ rangeOverflow: true }, `Value must not exceed ${this.max.value}`, inputEl);
      this.setAttribute('data-invalid', '');
      return false;
    }

    this.setValidity({}, '', inputEl);
    this.removeAttribute('data-invalid');
    return true;
  }

  #onInputChange = (e) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      this.#updateValue(parsed, true);
    } else {
      e.target.value = this.#formatValue(this.value.value);
    }
  };

  #onKeyDown = (e) => {
    if (this.disabled.value || this.readonly.value) return;

    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.stepUp(mult);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.stepDown(mult);
    } else if (e.key === 'Home' && this.min.value !== null) {
      e.preventDefault();
      this.#updateValue(this.min.value);
    } else if (e.key === 'End' && this.max.value !== null) {
      e.preventDefault();
      this.#updateValue(this.max.value);
    }
  };

  /* Pointer Scrubbing (Figma / Blender Drag Interaction) */
  #onPointerDownScrub = (e) => {
    if (this.disabled.value || this.readonly.value || !this.scrub.value) return;
    e.preventDefault();

    this.#isScrubbing.value = true;
    this.setAttribute('data-scrubbing', '');
    this.#dragStartX = e.clientX;
    this.#dragStartVal = this.value.value;

    const target = e.currentTarget;
    if (target && typeof target.setPointerCapture === 'function') {
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }

    window.addEventListener('pointermove', this.#onPointerMoveScrub);
    window.addEventListener('pointerup', this.#onPointerUpScrub, { once: true });
  };

  #onPointerMoveScrub = (e) => {
    if (!this.#isScrubbing.value) return;
    const dx = e.clientX - this.#dragStartX;
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    const stepVal = (this.step.value || 1) * mult;
    const deltaSteps = Math.round(dx / 3); // 3px per step
    const newVal = this.#dragStartVal + deltaSteps * stepVal;

    this.#updateValue(newVal, false);
  };

  #onPointerUpScrub = () => {
    if (this.#isScrubbing.value) {
      this.#isScrubbing.value = false;
      this.removeAttribute('data-scrubbing');
      window.removeEventListener('pointermove', this.#onPointerMoveScrub);
      this.emit('change', { value: this.value.value });
    }
  };

  render() {
    const isDecDisabled = () =>
      Boolean(this.disabled.value) || (this.min.value !== null && this.value.value <= this.min.value);
    const isIncDisabled = () =>
      Boolean(this.disabled.value) || (this.max.value !== null && this.value.value >= this.max.value);
    const isScrubbable = () =>
      Boolean(this.scrub.value) && !this.disabled.value && !this.readonly.value;

    return html`
      <div
        class="field-wrapper"
        part="wrapper"
        role="group"
        aria-label="Numerical Input"
      >
        <!-- Decrement Stepper Button -->
        <button
          type="button"
          class="stepper-btn decrement"
          part="decrement"
          aria-label="Decrease value"
          tabindex="-1"
          ?disabled=${isDecDisabled}
          @click=${() => this.stepDown(1)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        <!-- Input and Optional Affixes -->
        <div class="input-row">
          ${() => {
            const p = this.prefix.value;
            if (!p) return null;
            const scrubbable = isScrubbable();
            return html`
              <span
                class=${`affix prefix ${scrubbable ? 'scrubbable' : ''}`}
                part="prefix"
                title=${scrubbable ? 'Click and drag horizontally to scrub value' : ''}
                @pointerdown=${this.#onPointerDownScrub}
              >
                ${p}
              </span>
            `;
          }}

          <input
            type="text"
            inputmode="decimal"
            part="input"
            role="spinbutton"
            aria-valuenow=${() => this.value.value}
            aria-valuemin=${() => (this.min.value !== null ? this.min.value : null)}
            aria-valuemax=${() => (this.max.value !== null ? this.max.value : null)}
            .value=${() => this.#formatValue(this.value.value)}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            @change=${this.#onInputChange}
            @keydown=${this.#onKeyDown}
          />

          ${() => {
            const s = this.suffix.value;
            if (!s) return null;
            return html`
              <span class="affix suffix" part="suffix">${s}</span>
            `;
          }}
        </div>

        <!-- Increment Stepper Button -->
        <button
          type="button"
          class="stepper-btn increment"
          part="increment"
          aria-label="Increase value"
          tabindex="-1"
          ?disabled=${isIncDisabled}
          @click=${() => this.stepUp(1)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-number-field')) {
  customElements.define('el-number-field', ElNumberField);
}
