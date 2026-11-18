import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-callout>
 * Inline callout banner inspired by Radix Themes.
 * Supports variants (info, success, warning, danger) and slots for icon, title, and body.
 */
export class ElCallout extends Elementum {
  static observedAttributes = ['variant', 'size'];

  variant = signal('info');
  size = signal('md');

  static styles = css`
    :host {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--el-radius-md, 8px);
      border: 1px solid transparent;
      font-family: inherit;
      font-size: var(--el-text-sm, 0.875rem);
      line-height: 1.5;
      box-sizing: border-box;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }

    :host([size="sm"]) {
      padding: 8px 12px;
      font-size: 0.8125rem;
      gap: 8px;
    }

    :host([size="lg"]) {
      padding: 16px 20px;
      font-size: 1rem;
      gap: 16px;
    }

    /* Info & Primary */
    :host, :host([variant="info"]), :host([variant="primary"]) {
      background-color: rgba(37, 99, 235, 0.08);
      border-color: rgba(37, 99, 235, 0.2);
      color: #1e40af;
    }
    :host-context([data-theme="dark"]), :host-context([data-theme="dark"])[variant="info"], :host-context([data-theme="dark"])[variant="primary"] {
      background-color: rgba(59, 130, 246, 0.12);
      border-color: rgba(59, 130, 246, 0.25);
      color: #93c5fd;
    }

    /* Secondary */
    :host([variant="secondary"]) {
      background-color: var(--el-surface-muted, #f1f5f9);
      border-color: var(--el-surface-border, #e2e8f0);
      color: var(--el-text-secondary, #475569);
    }
    :host-context([data-theme="dark"])[variant="secondary"] {
      background-color: rgba(30, 41, 59, 0.7);
      border-color: #334155;
      color: #cbd5e1;
    }

    /* Success */
    :host([variant="success"]) {
      background-color: rgba(16, 185, 129, 0.08);
      border-color: rgba(16, 185, 129, 0.25);
      color: #065f46;
    }
    :host-context([data-theme="dark"])[variant="success"] {
      background-color: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.25);
      color: #6ee7b7;
    }

    /* Warning */
    :host([variant="warning"]) {
      background-color: rgba(245, 158, 11, 0.08);
      border-color: rgba(245, 158, 11, 0.25);
      color: #92400e;
    }
    :host-context([data-theme="dark"])[variant="warning"] {
      background-color: rgba(245, 158, 11, 0.12);
      border-color: rgba(245, 158, 11, 0.25);
      color: #fcd34d;
    }

    /* Danger */
    :host([variant="danger"]) {
      background-color: rgba(239, 68, 68, 0.08);
      border-color: rgba(239, 68, 68, 0.25);
      color: #991b1b;
    }
    :host-context([data-theme="dark"])[variant="danger"] {
      background-color: rgba(239, 68, 68, 0.12);
      border-color: rgba(239, 68, 68, 0.25);
      color: #fca5a5;
    }

    .icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
      font-size: 1.15em;
    }

    .content-wrapper {
      flex: 1;
      min-width: 0;
    }

    ::slotted([slot="title"]) {
      font-weight: 600;
      margin-bottom: 2px;
      display: block;
      color: inherit;
    }
  `;

  connected() {
    this.variant.value = this.getAttribute('variant') || 'info';
    this.size.value = this.getAttribute('size') || 'md';
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'variant') this.variant.value = newValue || 'info';
    if (name === 'size') this.size.value = newValue || 'md';
  }

  #getDefaultIcon() {
    const v = this.variant.value;
    if (v === 'success') return '✓';
    if (v === 'warning') return '⚠';
    if (v === 'danger') return '✕';
    return 'ℹ';
  }

  render() {
    return html`
      <div class="icon-wrapper" aria-hidden="true">
        <slot name="icon">${() => this.#getDefaultIcon()}</slot>
      </div>
      <div class="content-wrapper">
        <slot name="title"></slot>
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-callout')) {
  customElements.define('el-callout', ElCallout);
}
