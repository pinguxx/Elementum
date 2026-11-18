/**
 * <el-textarea>
 * Accessible auto-resizing multi-line text input inspired by shadcn/ui.
 * Implements Form Associated Custom Element (FACE), auto-resize, character count limit,
 * clear on form reset, and full accessibility.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElTextarea extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['value', 'placeholder', 'disabled', 'required', 'rows', 'maxlength', 'auto-resize', 'name'];

  value = signal('');
  placeholder = signal('');
  disabled = signal(false);
  required = signal(false);
  rows = signal(3);
  maxlength = signal(null);
  autoResize = signal(false);

  static styles = css`
    :host {
      display: block;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
      width: 100%;
    }

    .wrapper {
      display: flex;
      flex-direction: column;
      position: relative;
      width: 100%;
      box-sizing: border-box;
    }

    textarea {
      width: 100%;
      min-height: 80px;
      padding: 10px 14px;
      font-family: inherit;
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--el-text-primary, #0f172a);
      background: var(--el-surface-base, #ffffff);
      border: 1px solid var(--el-surface-border, #cbd5e1);
      border-radius: var(--el-radius-md, 8px);
      box-sizing: border-box;
      outline: none;
      resize: vertical;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    :host([auto-resize]) textarea {
      resize: none;
      overflow-y: hidden;
    }

    textarea:focus {
      border-color: var(--el-color-primary, #2563eb);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    :root[data-theme="dark"] textarea {
      background: #1e293b;
      border-color: #334155;
      color: #f8fafc;
    }

    :root[data-theme="dark"] textarea:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    }

    :host([disabled]) textarea {
      opacity: 0.6;
      cursor: not-allowed;
      background: var(--el-surface-muted, #f1f5f9);
    }

    .footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--el-text-muted, #94a3b8);
    }
  `;

  connected() {
    this.#syncAttrs();
    this.setFormValue(this.value.value);
  }

  attributeChanged(name, oldValue, newValue) {
    this.#syncAttrs();
    return true;
  }

  #syncAttrs() {
    if (this.hasAttribute('value') && this.getAttribute('value') !== this.value.value) {
      this.value.value = this.getAttribute('value') || '';
    }
    this.placeholder.value = this.getAttribute('placeholder') || '';
    this.disabled.value = this.hasAttribute('disabled');
    this.required.value = this.hasAttribute('required');
    this.rows.value = parseInt(this.getAttribute('rows') || '3', 10);
    this.maxlength.value = this.hasAttribute('maxlength') ? parseInt(this.getAttribute('maxlength'), 10) : null;
    this.autoResize.value = this.hasAttribute('auto-resize');
  }

  formReset() {
    this.value.value = this.getAttribute('value') || '';
    this.setFormValue(this.value.value);
    const textarea = this.shadowRoot?.querySelector('textarea');
    if (textarea) textarea.value = this.value.value;
  }

  #onInput = (e) => {
    const val = e.target.value;
    this.value.value = val;
    this.setFormValue(val);
    this.emit('input', { value: val });

    if (this.autoResize.value) {
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    }
  };

  #onChange = (e) => {
    this.emit('change', { value: this.value.value });
  };

  render() {
    return html`
      <div class="wrapper" part="wrapper">
        <textarea
          part="textarea"
          rows=${() => this.rows.value}
          placeholder=${() => this.placeholder.value}
          ?disabled=${() => this.disabled.value}
          ?required=${() => this.required.value}
          maxlength=${() => (this.maxlength.value !== null ? this.maxlength.value : false)}
          .value=${() => this.value.value}
          oninput=${this.#onInput}
          onchange=${this.#onChange}
        ></textarea>
        ${() =>
          this.maxlength.value !== null
            ? html`
                <div class="footer" part="footer">
                  <span class="count">${() => `${this.value.value.length} / ${this.maxlength.value}`}</span>
                </div>
              `
            : ''
        }
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-textarea')) {
  customElements.define('el-textarea', ElTextarea);
}
