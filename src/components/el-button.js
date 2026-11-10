/**
 * <el-button>
 * Frameworkless, signal-driven button component with 1:1 Figma variant parity.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElButton extends Elementum {
  static observedAttributes = ['variant', 'size', 'disabled'];

  // Figma Variant mappings as reactive signals
  variant = signal('primary'); // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = signal('md');         // 'sm' | 'md' | 'lg'
  disabled = signal(false);

  static styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--el-spacing-sm, 8px);
      font-family: inherit;
      font-weight: 500;
      border: 1px solid transparent;
      border-radius: var(--el-radius-md, 8px);
      cursor: pointer;
      user-select: none;
      transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
      outline: none;
    }

    button:focus-visible {
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.4);
    }

    button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Size Variants */
    :host([size="sm"]) button {
      padding: var(--el-spacing-xs, 4px) var(--el-spacing-sm, 8px);
      font-size: 0.8125rem;
    }

    :host([size="md"]) button,
    :host(:not([size])) button {
      padding: var(--el-spacing-sm, 8px) var(--el-spacing-md, 16px);
      font-size: 0.9375rem;
    }

    :host([size="lg"]) button {
      padding: var(--el-spacing-md, 16px) var(--el-spacing-lg, 24px);
      font-size: 1.0625rem;
    }

    /* Color Variants (from Figma tokens) */
    :host([variant="primary"]) button,
    :host(:not([variant])) button {
      background-color: var(--el-color-primary, #2563eb);
      color: var(--el-text-inverse, #ffffff);
    }
    :host([variant="primary"]) button:not([disabled]):hover {
      background-color: var(--el-color-primary-hover, #1d4ed8);
    }

    :host([variant="secondary"]) button {
      background-color: var(--el-surface-muted, #f3f4f6);
      color: var(--el-text-base, #111827);
      border-color: var(--el-surface-border, #e5e7eb);
    }
    :host([variant="secondary"]) button:not([disabled]):hover {
      background-color: #e5e7eb;
    }

    :host([variant="danger"]) button {
      background-color: var(--el-color-danger, #dc2626);
      color: var(--el-text-inverse, #ffffff);
    }
    :host([variant="danger"]) button:not([disabled]):hover {
      background-color: #b91c1c;
    }

    :host([variant="ghost"]) button {
      background-color: transparent;
      color: var(--el-color-primary, #2563eb);
    }
    :host([variant="ghost"]) button:not([disabled]):hover {
      background-color: var(--el-surface-muted, #f3f4f6);
    }
  `;

  render() {
    return html`
      <button
        part="button"
        ?disabled=${() => Boolean(this.disabled.value)}
        @click=${(e) => {
          if (this.disabled.value) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
      </button>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-button')) {
  customElements.define('el-button', ElButton);
}
