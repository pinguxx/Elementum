import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-checkbox-card>
 * Rich multi-selection card primitive inspired by Radix Themes.
 * Supports title, description, badge/meta, and checkbox checkmark indicator.
 */
export class ElCheckboxCard extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['value', 'checked', 'disabled'];

  value = signal('');
  checked = signal(false);
  disabled = signal(false);

  static styles = css`
    :host {
      display: block;
      cursor: pointer;
      user-select: none;
      font-family: inherit;
      box-sizing: border-box;
      outline: none;
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.6;
      pointer-events: none;
    }

    .card {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px;
      border-radius: var(--el-radius-lg, 12px);
      border: 2px solid var(--el-surface-border, #e2e8f0);
      background-color: var(--el-surface-card, #ffffff);
      transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    :host-context([data-theme="dark"]) .card {
      background-color: #111827;
      border-color: #334155;
    }

    :host(:hover:not([disabled])) .card {
      border-color: var(--el-primary-subtle, #93c5fd);
      background-color: var(--el-surface-muted, #f8fafc);
    }

    :host-context([data-theme="dark"]):host(:hover:not([disabled])) .card {
      background-color: #1e293b;
      border-color: #475569;
    }

    :host([checked]) .card {
      border-color: var(--el-primary, #2563eb);
      background-color: rgba(37, 99, 235, 0.04);
      box-shadow: 0 0 0 1px var(--el-primary, #2563eb);
    }

    :host-context([data-theme="dark"]):host([checked]) .card {
      border-color: #3b82f6;
      background-color: rgba(59, 130, 246, 0.1);
      box-shadow: 0 0 0 1px #3b82f6;
    }

    :host(:focus-visible) .card {
      outline: 2px solid var(--el-primary, #2563eb);
      outline-offset: 2px;
    }

    .checkbox-box {
      width: 18px;
      height: 18px;
      border-radius: var(--el-radius-sm, 4px);
      border: 2px solid var(--el-surface-border, #cbd5e1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    }

    :host([checked]) .checkbox-box {
      border-color: var(--el-primary, #2563eb);
      background-color: var(--el-primary, #2563eb);
    }

    :host-context([data-theme="dark"]) .checkbox-box {
      border-color: #475569;
    }

    :host-context([data-theme="dark"]):host([checked]) .checkbox-box {
      border-color: #3b82f6;
      background-color: #3b82f6;
    }

    .content {
      flex: 1;
      min-width: 0;
    }

    ::slotted([slot="title"]) {
      font-weight: 600;
      font-size: var(--el-text-base, 1rem);
      color: var(--el-text-primary, #0f172a);
      margin-bottom: 4px;
      display: block;
    }

    :host-context([data-theme="dark"]) ::slotted([slot="title"]) {
      color: #f8fafc;
    }

    ::slotted([slot="description"]) {
      font-size: var(--el-text-sm, 0.875rem);
      color: var(--el-text-muted, #64748b);
      line-height: 1.4;
      display: block;
    }

    :host-context([data-theme="dark"]) ::slotted([slot="description"]) {
      color: #94a3b8;
    }
  `;

  connected() {
    this.value.value = this.getAttribute('value') || '';
    this.checked.value = this.hasAttribute('checked');
    this.disabled.value = this.hasAttribute('disabled');

    if (!this.hasAttribute('tabindex') && !this.disabled.value) {
      this.setAttribute('tabindex', '0');
    }
    this.setAttribute('role', 'checkbox');
    this.setAttribute('aria-checked', this.checked.value ? 'true' : 'false');

    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnected() {
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value') this.value.value = newValue || '';
    if (name === 'checked') {
      const isChecked = newValue !== null;
      this.checked.value = isChecked;
      this.setAttribute('aria-checked', isChecked ? 'true' : 'false');
      this.setFormValue(isChecked ? this.value.value || 'on' : null);
    }
    if (name === 'disabled') {
      this.disabled.value = newValue !== null;
      if (this.disabled.value) {
        this.setAttribute('aria-disabled', 'true');
        this.removeAttribute('tabindex');
      } else {
        this.removeAttribute('aria-disabled');
        this.setAttribute('tabindex', '0');
      }
    }
  }

  #onClick = () => {
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
    const next = !this.checked.value;
    if (next) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
    this.checked.value = next;
    this.setFormValue(next ? this.value.value || 'on' : null);
    this.emit('change', { checked: next, value: this.value.value });
  }

  render() {
    return html`
      <div class="card">
        <div class="checkbox-box">
          ${() => (this.checked.value ? '✓' : '')}
        </div>
        <div class="content">
          <slot name="title"></slot>
          <slot name="description"></slot>
          <slot></slot>
        </div>
        <slot name="extra"></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-checkbox-card')) {
  customElements.define('el-checkbox-card', ElCheckboxCard);
}
