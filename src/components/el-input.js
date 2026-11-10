/**
 * <el-input>
 * Accessible text/form input with prefix/suffix slots and design token styling.
 */

import { Elementum, html, css, signal } from '../index.js';

export class ElInput extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['value', 'placeholder', 'disabled', 'readonly', 'type', 'size'];

  value = signal('');
  placeholder = signal('');
  disabled = signal(false);
  readonly = signal(false);
  type = signal('text');
  size = signal('md'); // 'sm' | 'md' | 'lg'

  connected() {
    this.setFormValue(this.value.value);
  }

  formReset() {
    this.value.value = '';
    this.setFormValue('');
  }

  static styles = css`
    :host {
      display: inline-block;
      width: 100%;
      font-family: inherit;
    }

    .wrapper {
      display: flex;
      align-items: center;
      background: var(--el-surface-base, #ffffff);
      border: 1px solid var(--el-surface-border, #e5e7eb);
      border-radius: var(--el-radius-md, 8px);
      padding: 0 var(--el-spacing-sm, 8px);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
      gap: var(--el-spacing-xs, 4px);
    }

    .wrapper:focus-within {
      border-color: var(--el-color-primary, #2563eb);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .wrapper.disabled {
      background: var(--el-surface-muted, #f3f4f6);
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* Size variants */
    :host([size="sm"]) .wrapper {
      height: 32px;
      font-size: 0.8125rem;
    }

    :host([size="md"]) .wrapper,
    :host(:not([size])) .wrapper {
      height: 40px;
      font-size: 0.9375rem;
    }

    :host([size="lg"]) .wrapper {
      height: 48px;
      font-size: 1.0625rem;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      color: var(--el-text-base, #111827);
      font-family: inherit;
      font-size: inherit;
      width: 100%;
      padding: 0 4px;
      min-width: 0;
    }

    input::placeholder {
      color: var(--el-text-muted, #9ca3af);
    }

    input:disabled {
      cursor: not-allowed;
    }

    ::slotted([slot="prefix"]),
    ::slotted([slot="suffix"]) {
      display: flex;
      align-items: center;
      color: var(--el-text-muted, #6b7280);
      user-select: none;
    }
  `;

  #onInput = (e) => {
    this.value.value = e.target.value;
    this.setFormValue(e.target.value);
    this.emit('input', { value: e.target.value });
  };

  #onChange = (e) => {
    this.value.value = e.target.value;
    this.setFormValue(e.target.value);
    this.emit('change', { value: e.target.value });
  };

  focus() {
    this.root.querySelector('input')?.focus();
  }

  render() {
    return html`
      <div
        class=${() => `wrapper ${this.disabled.value ? 'disabled' : ''}`}
        part="wrapper"
      >
        <slot name="prefix"></slot>
        <input
          part="input"
          type=${this.type}
          .value=${this.value}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          @input=${this.#onInput}
          @change=${this.#onChange}
        />
        <slot name="suffix"></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-input')) {
  customElements.define('el-input', ElInput);
}
