/**
 * <el-toggle> & <el-toggle-group>
 * Accessible, zero-dependency 2-state pressable buttons and groups inspired by Base UI.
 * Standard for toolbars, text alignment, and multi/single view selections.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElToggle extends Elementum {
  static observedAttributes = ['pressed', 'disabled', 'value', 'size', 'variant', 'label'];

  isPressed = signal(false);
  disabled = signal(false);
  value = signal('');
  size = signal('md');
  variant = signal('default');
  label = signal('');

  static styles = css`
    :host {
      display: inline-flex;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-family: inherit;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-base, #ffffff);
      color: var(--el-text-secondary, #475569);
      border-radius: var(--el-radius-md, 6px);
      transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease, transform 120ms var(--el-ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
      user-select: none;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      line-height: 1;
    }

    button:active:not(:disabled) {
      transform: scale(0.97);
    }

    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
      button:active:not(:disabled) {
        transform: none;
      }
    }

    :host([size="sm"]) button {
      padding: 6px 10px;
      font-size: 12px;
      height: 30px;
    }

    :host([size="md"]) button,
    button {
      padding: 8px 14px;
      font-size: 13px;
      height: 36px;
    }

    :host([size="lg"]) button {
      padding: 10px 18px;
      font-size: 14px;
      height: 42px;
    }

    button:hover:not(:disabled) {
      background: var(--el-surface-muted, #f1f5f9);
      color: var(--el-text-primary, #0f172a);
    }

    button:focus-visible {
      box-shadow: 0 0 0 2px var(--el-color-primary, #2563eb);
      border-color: var(--el-color-primary, #2563eb);
    }

    button.pressed,
    :host([data-state="on"]) button {
      background: var(--el-color-primary, #2563eb);
      color: #ffffff;
      border-color: var(--el-color-primary, #2563eb);
    }

    button.pressed:hover:not(:disabled),
    :host([data-state="on"]) button:hover:not(:disabled) {
      background: var(--el-color-primary-hover, #1d4ed8);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    :host-context([data-theme="dark"]) button {
      background: var(--el-surface-elevated, #1e293b);
      border-color: #334155;
      color: #94a3b8;
    }

    :host-context([data-theme="dark"]) button:hover:not(:disabled) {
      background: #334155;
      color: #f8fafc;
    }

    :host-context([data-theme="dark"]) button.pressed {
      background: var(--el-color-primary, #2563eb);
      color: #ffffff;
      border-color: var(--el-color-primary, #2563eb);
    }

    /* Color Variants (from Figma tokens) */
    :host([variant="primary"]) button.pressed,
    :host(:not([variant])) button.pressed {
      background-color: var(--el-color-primary, #2563eb);
      color: #ffffff;
    }
    :host([variant="primary"]:not([disabled])) button.pressed:not([disabled]):hover,
    :host(:not([variant]):not([disabled])) button.pressed:not([disabled]):hover {
      background-color: var(--el-color-primary-hover, #1d4ed8);
    }

    :host([variant="secondary"]) button.pressed {
      background-color: var(--el-surface-muted, #f3f4f6);
      color: var(--el-text-primary, #0f172a);
      border-color: var(--el-surface-border, #e5e7eb);
    }
    :host([variant="secondary"]:not([disabled])) button.pressed:not([disabled]):hover {
      background-color: var(--el-step-4, var(--el-surface-border, #e2e8f0));
      color: var(--el-text-primary, #0f172a);
    }

    :host([variant="danger"]) button.pressed {
      background-color: var(--el-color-danger, #dc2626);
      color: #ffffff;
    }
    :host([variant="danger"]:not([disabled])) button.pressed:not([disabled]):hover {
      background-color: #b91c1c;
    }

    :host([variant="success"]) button.pressed,
    :host([variant="success"][data-state="on"]) button {
      background-color: var(--el-color-success, #16a34a);
      border-color: var(--el-color-success, #16a34a);
      color: #ffffff;
    }
    :host([variant="success"]:not([disabled])) button.pressed:not([disabled]):hover {
      background-color: #15803d;
    }

    :host([variant="warning"]) button.pressed,
    :host([variant="warning"][data-state="on"]) button {
      background-color: var(--el-color-warning, #d97706);
      border-color: var(--el-color-warning, #d97706);
      color: #ffffff;
    }
    :host([variant="warning"]:not([disabled])) button.pressed:not([disabled]):hover {
      background-color: #b45309;
    }

    :host([variant="info"]) button.pressed,
    :host([variant="info"][data-state="on"]) button {
      background-color: var(--el-color-info, #0284c7);
      border-color: var(--el-color-info, #0284c7);
      color: #ffffff;
    }
    :host([variant="info"]:not([disabled])) button.pressed:not([disabled]):hover {
      background-color: #0369a1;
    }

    :host([variant="outline"]) button {
      background-color: transparent;
      border-color: var(--el-surface-border, #cbd5e1);
      color: var(--el-text-primary, #0f172a);
    }
    :host([variant="outline"]) button.pressed,
    :host([variant="outline"][data-state="on"]) button {
      background-color: rgba(37, 99, 235, 0.08);
      border-color: var(--el-color-primary, #2563eb);
      color: var(--el-color-primary, #2563eb);
    }
  `;

  connected() {
    this.isPressed.value = this.hasAttribute('pressed');
    this.disabled.value = this.hasAttribute('disabled');
    if (this.hasAttribute('value')) this.value.value = this.getAttribute('value');
    if (this.hasAttribute('size')) this.size.value = this.getAttribute('size');
    if (this.hasAttribute('label')) this.label.value = this.getAttribute('label');
    this.setAttribute('data-state', this.isPressed.value ? 'on' : 'off');
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'pressed') {
      this.isPressed.value = newValue !== null && newValue !== 'false';
      this.setAttribute('data-state', this.isPressed.value ? 'on' : 'off');
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
    } else if (name === 'value') {
      this.value.value = newValue || '';
    } else if (name === 'size') {
      this.size.value = newValue || 'md';
    } else if (name === 'variant') {
      this.variant.value = newValue || 'default';
    } else if (name === 'label') {
      this.label.value = newValue || '';
    }
    return true;
  }

  toggle() {
    if (this.disabled.value) return;
    this.setPressed(!this.isPressed.value);
    this.emit('toggle', { pressed: this.isPressed.value, value: this.value.value });
    this.emit('change', { pressed: this.isPressed.value, value: this.value.value });
  }

  setPressed(pressed) {
    const next = Boolean(pressed);
    this.isPressed.value = next;
    this.setAttribute('data-state', next ? 'on' : 'off');
    if (next) {
      if (!this.hasAttribute('pressed')) this.setAttribute('pressed', '');
    } else if (this.hasAttribute('pressed')) {
      this.removeAttribute('pressed');
    }
  }

  render() {
    return html`
      <button
        type="button"
        class=${() => (this.isPressed.value ? 'pressed' : '')}
        aria-pressed=${() => (this.isPressed.value ? 'true' : 'false')}
        ?disabled=${this.disabled}
        @click=${() => this.toggle()}
        part="button"
      >
        <slot>${() => this.label.value || ''}</slot>
      </button>
    `;
  }
}

export class ElToggleGroup extends Elementum {
  static observedAttributes = ['type', 'value', 'disabled'];

  type = signal('single'); // 'single' | 'multiple'
  value = signal('');
  disabled = signal(false);

  #syncing = false;

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px;
      background: var(--el-surface-muted, #f1f5f9);
      border-radius: var(--el-radius-md, 8px);
      box-sizing: border-box;
    }

    :host-context([data-theme="dark"]) {
      background: #0f172a;
      border: 1px solid #1e293b;
    }
  `;

  #getToggles() {
    return Array.from(this.querySelectorAll('el-toggle'));
  }

  #syncChildrenFromValue() {
    const raw = String(this.value.value || '').trim();
    const selected = raw
      ? this.type.value === 'multiple'
        ? new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))
        : new Set([raw.split(',')[0].trim()])
      : new Set();

    for (const t of this.#getToggles()) {
      const val = t.getAttribute('value') || t.value?.value || '';
      const shouldPress = val !== '' && selected.has(val);
      if (typeof t.setPressed === 'function') {
        t.setPressed(shouldPress);
      } else {
        if (shouldPress) t.setAttribute('pressed', '');
        else t.removeAttribute('pressed');
        t.setAttribute('data-state', shouldPress ? 'on' : 'off');
      }
    }
  }

  #syncDisabled() {
    const isDis = this.disabled.value;
    for (const t of this.#getToggles()) {
      if (isDis) t.setAttribute('disabled', '');
      else t.removeAttribute('disabled');
    }
  }

  connected() {
    this.type.value = this.getAttribute('type') === 'multiple' ? 'multiple' : 'single';
    this.value.value = this.getAttribute('value') || '';
    this.disabled.value = this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false';
    this.setAttribute('role', 'group');

    this.#syncChildrenFromValue();
    if (this.disabled.value) this.#syncDisabled();

    this.addEventListener(
      'toggle',
      (e) => {
        const toggleEl = e.target;
        if (!toggleEl || toggleEl.tagName?.toLowerCase() !== 'el-toggle') return;
        if (this.disabled.value) return;

        const itemVal = toggleEl.getAttribute('value') || toggleEl.value?.value || '';
        this.#syncing = true;
        try {
          if (this.type.value === 'single') {
            for (const t of this.#getToggles()) {
              if (t !== toggleEl) {
                if (typeof t.setPressed === 'function') t.setPressed(false);
                else {
                  t.removeAttribute('pressed');
                  t.setAttribute('data-state', 'off');
                }
              }
            }
            const nextVal = toggleEl.isPressed.value ? itemVal : '';
            this.value.value = nextVal;
            if (nextVal) this.setAttribute('value', nextVal);
            else this.removeAttribute('value');
            this.emit('change', { value: nextVal });
          } else {
            const activeVals = [];
            for (const t of this.#getToggles()) {
              if (t.isPressed?.value) {
                const v = t.getAttribute('value') || t.value?.value || '';
                if (v) activeVals.push(v);
              }
            }
            const joined = activeVals.join(',');
            this.value.value = joined;
            if (joined) this.setAttribute('value', joined);
            else this.removeAttribute('value');
            this.emit('change', { value: activeVals });
          }
        } finally {
          this.#syncing = false;
        }
      },
      { signal: this.signal }
    );
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'type') {
      this.type.value = newValue === 'multiple' ? 'multiple' : 'single';
      if (!this.#syncing) this.#syncChildrenFromValue();
    } else if (name === 'value') {
      if (this.#syncing) return true;
      this.value.value = newValue || '';
      this.#syncChildrenFromValue();
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
      this.#syncDisabled();
    }
    return true;
  }

  render() {
    return html`<slot @slotchange=${() => { this.#syncChildrenFromValue(); if (this.disabled.value) this.#syncDisabled(); }}></slot>`;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-toggle')) customElements.define('el-toggle', ElToggle);
  if (!customElements.get('el-toggle-group')) customElements.define('el-toggle-group', ElToggleGroup);
}
