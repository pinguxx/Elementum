import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, effect } from '../signal.js';

/**
 * <el-otp-input>
 * Segmented PIN / verification code input component.
 *
 * @attr {number} length - Number of PIN slots (default: 6)
 * @attr {string} name - Form field name
 * @attr {string} value - Combined OTP value
 * @attr {boolean} disabled - Whether the input is disabled
 * @attr {boolean} required - Whether OTP is required
 * @attr {string} type - 'text' | 'password' (mask characters)
 *
 * @fires change - Dispatched when value changes
 * @fires complete - Dispatched when all digits are filled with { value }
 */
export class ElOtpInput extends Elementum {
  static formAssociated = true;

  static observedAttributes = ['length', 'name', 'value', 'disabled', 'required', 'type'];

  length = signal(6);
  name = signal('');
  value = signal('');
  disabled = signal(false);
  required = signal(false);
  type = signal('text');
  digits = signal([]);

  connected() {
    this.#sync();
    this.setFormValue(this.value.value);
    this.validate();

    effect(() => {
      this.setFormValue(this.value.value);
      this.validate();
    }, { signal: this.signal });
  }

  attributeChanged(name, oldValue, newValue) {
    this.#sync();
  }

  #sync() {
    const len = Number(this.getAttribute('length')) || 6;
    this.length.value = len;
    this.name.value = this.getAttribute('name') || '';
    this.disabled.value = this.hasAttribute('disabled');
    this.required.value = this.hasAttribute('required');
    this.type.value = this.getAttribute('type') || 'text';

    const val = this.getAttribute('value') || this.value.value || '';
    const arr = new Array(len).fill('');
    for (let i = 0; i < Math.min(val.length, len); i++) {
      arr[i] = val[i];
    }
    this.digits.value = arr;
    this.value.value = arr.join('');
  }

  static styles = css`
    :host {
      display: inline-block;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
    }

    .otp-container {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .otp-cell {
      width: 44px;
      height: 48px;
      border: 1px solid var(--el-surface-border, #cbd5e1);
      border-radius: var(--el-radius-md, 8px);
      background: var(--el-surface-card, #ffffff);
      color: var(--el-text-primary, #0f172a);
      font-size: 1.25rem;
      font-weight: 700;
      text-align: center;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      box-sizing: border-box;
      font-variant-numeric: tabular-nums;
      padding: 0;
    }

    .otp-cell:focus {
      border-color: var(--el-color-primary, #2563eb);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
      transform: scale(1.04);
    }

    .otp-cell:disabled {
      background: var(--el-surface-muted, #f1f5f9);
      cursor: not-allowed;
      opacity: 0.6;
    }
  `;

  validate() {
    const isRequired = Boolean(this.required.value);
    const isFull = this.value.value.length === this.length.value;

    if (isRequired && !isFull) {
      this.setValidity(
        { valueMissing: true },
        `Please enter the full ${this.length.value}-digit verification code.`
      );
      this.setAttribute('aria-invalid', 'true');
      return false;
    }

    this.setValidity({});
    this.removeAttribute('aria-invalid');
    return true;
  }

  focus() {
    const firstEmpty = this.digits.value.findIndex((d) => !d);
    const idx = firstEmpty >= 0 ? firstEmpty : 0;
    const inputs = this.root.querySelectorAll('.otp-cell');
    inputs[idx]?.focus();
  }

  clear() {
    const len = this.length.value;
    this.digits.value = new Array(len).fill('');
    this.value.value = '';
    const inputs = this.root.querySelectorAll('.otp-cell');
    inputs.forEach((i) => (i.value = ''));
    inputs[0]?.focus();
    this.emit('change', { value: '' });
  }

  #onInput = (e, index) => {
    const val = e.target.value.slice(-1); // Take only the last character
    const arr = [...this.digits.value];
    arr[index] = val;
    this.digits.value = arr;
    this.value.value = arr.join('');

    const inputs = this.root.querySelectorAll('.otp-cell');
    if (val && index < this.length.value - 1) {
      inputs[index + 1]?.focus();
      inputs[index + 1]?.select?.();
    }

    this.emit('change', { value: this.value.value });

    if (this.value.value.length === this.length.value && !this.value.value.includes('')) {
      this.emit('complete', { value: this.value.value });
    }
  };

  #onKeyDown = (e, index) => {
    const inputs = this.root.querySelectorAll('.otp-cell');

    if (e.key === 'Backspace') {
      if (!this.digits.value[index] && index > 0) {
        inputs[index - 1]?.focus();
        const arr = [...this.digits.value];
        arr[index - 1] = '';
        this.digits.value = arr;
        this.value.value = arr.join('');
        if (inputs[index - 1]) inputs[index - 1].value = '';
        e.preventDefault();
      } else {
        const arr = [...this.digits.value];
        arr[index] = '';
        this.digits.value = arr;
        this.value.value = arr.join('');
      }
      this.emit('change', { value: this.value.value });
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputs[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < this.length.value - 1) {
      inputs[index + 1]?.focus();
      e.preventDefault();
    }
  };

  #onPaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)?.getData('text') || '';
    const cleaned = pasted.trim().slice(0, this.length.value);
    if (!cleaned) return;

    const arr = [...this.digits.value];
    const inputs = this.root.querySelectorAll('.otp-cell');

    for (let i = 0; i < cleaned.length; i++) {
      arr[i] = cleaned[i];
      if (inputs[i]) inputs[i].value = cleaned[i];
    }

    this.digits.value = arr;
    this.value.value = arr.join('');

    const nextIndex = Math.min(cleaned.length, this.length.value - 1);
    inputs[nextIndex]?.focus();

    this.emit('change', { value: this.value.value });
    if (this.value.value.length === this.length.value) {
      this.emit('complete', { value: this.value.value });
    }
  };

  formReset() {
    this.clear();
  }

  formResetCallback() {
    this.clear();
  }

  render() {
    return html`
      <div
        class="otp-container"
        part="container"
        role="group"
        aria-label="Verification Code Input"
        @paste=${this.#onPaste}
      >
        ${() => {
          const len = this.length.value;
          const isMasked = this.type.value === 'password';
          const arr = [];
          for (let i = 0; i < len; i++) {
            arr.push(html`
              <input
                type=${isMasked ? 'password' : 'text'}
                inputmode="numeric"
                maxlength="1"
                class="otp-cell"
                part="cell"
                aria-label=${`Digit ${i + 1} of ${len}`}
                .value=${() => this.digits.value[i] || ''}
                ?disabled=${this.disabled}
                @input=${(e) => this.#onInput(e, i)}
                @keydown=${(e) => this.#onKeyDown(e, i)}
                @paste=${this.#onPaste}
                @focus=${(e) => e.target.select?.()}
              />
            `);
          }
          return arr;
        }}
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-otp-input')) {
  customElements.define('el-otp-input', ElOtpInput);
}
