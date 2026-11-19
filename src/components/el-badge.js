/**
 * <el-badge>
 * Minimal status indicator and notification badge.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElBadge extends Elementum {
  static observedAttributes = ['variant', 'count', 'label', 'size'];

  variant = signal('default'); // 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline'
  count = signal('');
  label = signal('');
  size = signal('md');

  connected() {
    if (this.hasAttribute('label')) this.label.value = this.getAttribute('label');
    if (this.hasAttribute('count')) this.count.value = this.getAttribute('count');
    if (this.hasAttribute('variant')) this.variant.value = this.getAttribute('variant');
    if (this.hasAttribute('size')) this.size.value = this.getAttribute('size');
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'label') {
      this.label.value = newValue || '';
    } else if (name === 'count') {
      this.count.value = newValue || '';
    } else if (name === 'variant') {
      this.variant.value = newValue || 'default';
    } else if (name === 'size') {
      this.size.value = newValue || 'md';
    } else if (name in this) {
      this[name].value = newValue;
    }
  }

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 8px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: var(--el-radius-full, 9999px);
      line-height: 1.2;
      box-sizing: border-box;
      transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease, transform 120ms ease;
    }

    :host([variant="default"]) span,
    :host(:not([variant])) span {
      background: var(--el-surface-muted, #f1f5f9);
      color: var(--el-text-primary, #0f172a);
      border: 1px solid var(--el-surface-border, #e2e8f0);
    }

    :host([variant="primary"]) span {
      background: var(--el-color-primary, #2563eb);
      color: #ffffff;
      border: 1px solid transparent;
    }

    :host([variant="secondary"]) span {
      background: var(--el-surface-muted, #f1f5f9);
      color: var(--el-text-muted, #475569);
      border: 1px solid var(--el-surface-border, #cbd5e1);
    }

    :host([variant="success"]) span {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid rgba(21, 128, 61, 0.25);
    }

    :host([variant="danger"]) span {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid rgba(185, 28, 28, 0.25);
    }

    :host([variant="warning"]) span {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid rgba(146, 64, 14, 0.25);
    }

    :host([variant="info"]) span {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid rgba(3, 105, 161, 0.25);
    }

    :host([variant="outline"]) span {
      background: transparent;
      color: var(--el-text-primary, #0f172a);
      border: 1px solid var(--el-surface-border, #cbd5e1);
    }

    :host([size="sm"]) span {
      padding: 1px 6px;
      font-size: 0.6875rem;
    }

    :host([size="lg"]) span {
      padding: 4px 12px;
      font-size: 0.875rem;
    }
  `;

  render() {
    return html`
      <span part="badge">
        <slot>${() => this.label.value || this.count.value || 'Badge'}</slot>
      </span>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-badge')) {
  customElements.define('el-badge', ElBadge);
}
