/**
 * <el-badge>
 * Minimal status indicator and notification badge.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElBadge extends Elementum {
  static observedAttributes = ['variant', 'count'];

  variant = signal('default'); // 'default' | 'success' | 'danger'
  count = signal('');

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
    }

    span {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: var(--el-radius-full, 9999px);
      line-height: 1.2;
    }

    :host([variant="default"]) span,
    :host(:not([variant])) span {
      background: var(--el-surface-muted, #f3f4f6);
      color: var(--el-text-base, #111827);
    }

    :host([variant="success"]) span {
      background: #dcfce7;
      color: var(--el-color-success, #16a34a);
    }

    :host([variant="danger"]) span {
      background: #fee2e2;
      color: var(--el-color-danger, #dc2626);
    }
  `;

  render() {
    return html`
      <span part="badge">
        <slot>${() => this.count.value}</slot>
      </span>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-badge')) {
  customElements.define('el-badge', ElBadge);
}
