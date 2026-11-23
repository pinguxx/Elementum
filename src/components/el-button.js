/**
 * <el-button>
 * Frameworkless, signal-driven button component with 1:1 Figma variant parity.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';
import { createPressBehavior } from '../behaviors/index.js';

export class ElButton extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['variant', 'size', 'disabled', 'type', 'label'];

  // Figma Variant mappings as reactive signals
  variant = signal('primary'); // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = signal('md');         // 'sm' | 'md' | 'lg'
  disabled = signal(false);
  type = signal('button');     // 'button' | 'submit' | 'reset'
  label = signal('');

  static styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
    }

    :host([disabled]),
    :host([aria-disabled="true"]) {
      cursor: not-allowed;
    }

    button {
      display: inline-flex;
      width: 100%;
      box-sizing: border-box;
      align-items: center;
      justify-content: center;
      gap: var(--el-spacing-sm, 8px);
      font-family: inherit;
      font-weight: 500;
      border: 1px solid transparent;
      border-radius: var(--el-radius-md, 8px);
      cursor: pointer;
      user-select: none;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease, transform 0.1s ease;
      outline: none;
    }

    button:focus-visible {
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.4);
    }

    button:not([disabled]):active {
      transform: scale(0.97);
    }

    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
      button:not([disabled]):active {
        transform: none;
      }
    }

    /* Disabled State - distinct, washed-out, and accessible */
    button[disabled],
    button:disabled,
    :host([disabled]) button,
    :host([aria-disabled="true"]) button {
      opacity: 0.45;
      cursor: not-allowed !important;
      pointer-events: none !important;
      box-shadow: none !important;
      transform: none !important;
      filter: grayscale(0.2);
    }

    :root[data-theme="dark"] button[disabled],
    :root[data-theme="dark"] button:disabled,
    :root[data-theme="dark"] :host([disabled]) button,
    :root[data-theme="dark"] :host([aria-disabled="true"]) button {
      opacity: 0.38;
      filter: grayscale(0.3);
    }

    /* Size Variants */
    :host([size="sm"]) button {
      padding: var(--el-spacing-xs, 4px) var(--el-spacing-sm, 8px);
      font-size: 0.8125rem;
      line-height: 1.2;
      min-height: 32px;
    }

    :host([size="md"]) button,
    :host(:not([size])) button {
      padding: var(--el-spacing-sm, 8px) var(--el-spacing-md, 16px);
      font-size: 0.9375rem;
      line-height: 1.2;
      min-height: 38px;
    }

    :host([size="lg"]) button {
      padding: var(--el-spacing-md, 16px) var(--el-spacing-lg, 24px);
      font-size: 1.0625rem;
      line-height: 1.2;
      min-height: 46px;
    }

    /* Color Variants (from Figma tokens) */
    :host([variant="primary"]) button,
    :host(:not([variant])) button {
      background-color: var(--el-color-primary, #2563eb);
      color: #ffffff;
    }
    :host([variant="primary"]:not([disabled])) button:not([disabled]):hover,
    :host(:not([variant]):not([disabled])) button:not([disabled]):hover {
      background-color: var(--el-color-primary-hover, #1d4ed8);
    }

    :host([variant="secondary"]) button {
      background-color: var(--el-surface-muted, #f3f4f6);
      color: var(--el-text-primary, #0f172a);
      border-color: var(--el-surface-border, #e5e7eb);
    }
    :host([variant="secondary"]:not([disabled])) button:not([disabled]):hover {
      background-color: var(--el-step-4, var(--el-surface-border, #e2e8f0));
      color: var(--el-text-primary, #0f172a);
      border-color: var(--el-step-7, var(--el-surface-border, #cbd5e1));
    }

    :host([variant="outline"]) button {
      background-color: transparent;
      color: var(--el-text-primary, #0f172a);
      border-color: var(--el-surface-border, #cbd5e1);
    }
    :host([variant="outline"]:not([disabled])) button:not([disabled]):hover {
      background-color: var(--el-step-4, var(--el-surface-border, #e2e8f0));
      color: var(--el-text-primary, #0f172a);
      border-color: var(--el-step-7, var(--el-surface-border, #94a3b8));
    }

    :host([variant="danger"]) button {
      background-color: var(--el-color-danger, #dc2626);
      color: #ffffff;
    }
    :host([variant="danger"]:not([disabled])) button:not([disabled]):hover {
      background-color: #b91c1c;
    }

    :host([variant="ghost"]) button {
      background-color: transparent;
      color: var(--el-color-primary, #2563eb);
    }
    :host([variant="ghost"]:not([disabled])) button:not([disabled]):hover {
      background-color: var(--el-step-3, var(--el-surface-muted, #f1f5f9));
      color: var(--el-color-primary-hover, #1d4ed8);
    }
  `;

  connected() {
    if (this.hasAttribute('disabled')) {
      this.disabled.value = this.getAttribute('disabled') !== 'false';
    }
    if (this.disabled.value) {
      this.setAttribute('aria-disabled', 'true');
    }
    if (this.hasAttribute('label')) {
      this.label.value = this.getAttribute('label') || '';
    }
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'disabled') {
      const isDisabled = newValue !== null && newValue !== 'false';
      this.disabled.value = isDisabled;
      if (isDisabled) {
        this.setAttribute('aria-disabled', 'true');
      } else {
        this.removeAttribute('aria-disabled');
      }
      return;
    }
    if (name in this) {
      this[name].value = newValue !== null ? newValue : '';
    }
  }

  rendered() {
    const btn = this.root?.querySelector?.('button');
    if (btn) {
      createPressBehavior(this, btn, {
        isDisabled: () => Boolean(this.disabled.value),
        signal: this.signal,
      });
    }
  }

  render() {
    return html`
      <button
        part="button"
        ?disabled=${() => Boolean(this.disabled.value)}
        aria-disabled=${() => Boolean(this.disabled.value) ? 'true' : 'false'}
        @click=${(e) => {
          if (this.disabled.value) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }

          const btnType = this.getAttribute('type') || this.type.value;
          if (btnType === 'submit') {
            const form = this.internals?.form || this.closest('form');
            if (form) {
              form.requestSubmit();
            } else {
              const elForm = this.closest('el-form');
              if (elForm) {
                elForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
              }
            }
          } else if (btnType === 'reset') {
            const form = this.internals?.form || this.closest('form');
            if (form) {
              form.reset();
            } else {
              this.closest('el-form')?.reset?.();
            }
          }
        }}
      >
        <slot name="prefix"></slot>
        <slot>${() => this.label.value || ''}</slot>
        <slot name="suffix"></slot>
      </button>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-button')) {
  customElements.define('el-button', ElButton);
}
