/**
 * <el-alert>
 * Accessible inline alert banner inspired by shadcn/ui.
 * Supports variants (default, info, success, warning, destructive),
 * optional title, slot description, dismiss button, and ARIA alert roles.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElAlert extends Elementum {
  static observedAttributes = ['variant', 'title', 'dismissible', 'label', 'message'];

  variant = signal('default');
  alertTitle = signal('');
  dismissible = signal(false);
  isDismissed = signal(false);
  label = signal('');
  message = signal('');

  static styles = css`
    :host {
      display: block;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
      margin-bottom: 12px;
    }

    :host([hidden]) {
      display: none !important;
    }

    .alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: var(--el-radius-md, 8px);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-base, #ffffff);
      color: var(--el-text-primary, #0f172a);
      position: relative;
      box-sizing: border-box;
    }

    .icon-area {
      flex-shrink: 0;
      margin-top: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .content-area {
      flex: 1;
      min-width: 0;
    }

    .title {
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.3;
      margin: 0 0 4px 0;
    }

    .description {
      font-size: 0.875rem;
      line-height: 1.45;
      color: var(--el-text-secondary, #475569);
    }

    :root[data-theme="dark"] .description {
      color: #94a3b8;
    }

    .dismiss-btn {
      flex-shrink: 0;
      background: transparent;
      border: none;
      color: var(--el-text-muted, #94a3b8);
      cursor: pointer;
      padding: 4px;
      border-radius: var(--el-radius-sm, 4px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease, background-color 0.15s ease;
    }

    .dismiss-btn:hover {
      color: var(--el-text-primary, #0f172a);
      background: rgba(0, 0, 0, 0.05);
    }

    :root[data-theme="dark"] .dismiss-btn:hover {
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.1);
    }

    /* Variants */
    :host([variant="info"]) .alert {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1e40af;
    }
    :host([variant="info"]) .title { color: #1e3a8a; }
    :host([variant="info"]) .description { color: #1e40af; }

    :root[data-theme="dark"] :host([variant="info"]) .alert {
      background: rgba(30, 58, 138, 0.25);
      border-color: #1e3a8a;
      color: #bfdbfe;
    }
    :root[data-theme="dark"] :host([variant="info"]) .title { color: #93c5fd; }
    :root[data-theme="dark"] :host([variant="info"]) .description { color: #bfdbfe; }

    :host([variant="success"]) .alert {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }
    :host([variant="success"]) .title { color: #14532d; }
    :host([variant="success"]) .description { color: #166534; }

    :root[data-theme="dark"] :host([variant="success"]) .alert {
      background: rgba(20, 83, 45, 0.25);
      border-color: #166534;
      color: #bbf7d0;
    }
    :root[data-theme="dark"] :host([variant="success"]) .title { color: #86efac; }
    :root[data-theme="dark"] :host([variant="success"]) .description { color: #bbf7d0; }

    :host([variant="warning"]) .alert {
      background: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }
    :host([variant="warning"]) .title { color: #78350f; }
    :host([variant="warning"]) .description { color: #92400e; }

    :root[data-theme="dark"] :host([variant="warning"]) .alert {
      background: rgba(120, 53, 15, 0.25);
      border-color: #92400e;
      color: #fde68a;
    }
    :root[data-theme="dark"] :host([variant="warning"]) .title { color: #fcd34d; }
    :root[data-theme="dark"] :host([variant="warning"]) .description { color: #fde68a; }

    :host([variant="destructive"]) .alert,
    :host([variant="danger"]) .alert,
    :host([variant="error"]) .alert {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }
    :host([variant="destructive"]) .title,
    :host([variant="danger"]) .title,
    :host([variant="error"]) .title { color: #7f1d1d; }
    :host([variant="destructive"]) .description,
    :host([variant="danger"]) .description,
    :host([variant="error"]) .description { color: #991b1b; }

    :root[data-theme="dark"] :host([variant="destructive"]) .alert,
    :root[data-theme="dark"] :host([variant="danger"]) .alert,
    :root[data-theme="dark"] :host([variant="error"]) .alert {
      background: rgba(127, 29, 29, 0.25);
      border-color: #991b1b;
      color: #fecaca;
    }
    :root[data-theme="dark"] :host([variant="destructive"]) .title,
    :root[data-theme="dark"] :host([variant="danger"]) .title,
    :root[data-theme="dark"] :host([variant="error"]) .title { color: #fca5a5; }
    :root[data-theme="dark"] :host([variant="destructive"]) .description,
    :root[data-theme="dark"] :host([variant="danger"]) .description,
    :root[data-theme="dark"] :host([variant="error"]) .description { color: #fecaca; }
  `;

  connected() {
    this.#syncAttrs();
  }

  attributeChanged(name, oldValue, newValue) {
    this.#syncAttrs();
    return true;
  }

  #syncAttrs() {
    this.variant.value = this.getAttribute('variant') || 'default';
    this.alertTitle.value = this.getAttribute('title') || '';
    this.dismissible.value = this.hasAttribute('dismissible');
    this.label.value = this.getAttribute('label') || '';
    this.message.value = this.getAttribute('message') || '';
    if (!this.hasAttribute('variant')) this.setAttribute('variant', 'default');
  }

  dismiss = () => {
    this.isDismissed.value = true;
    this.setAttribute('hidden', '');
    this.emit('dismiss');
  };

  #renderDefaultIcon() {
    const v = this.variant.value;
    if (v === 'destructive' || v === 'danger' || v === 'error') {
      return html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }
    if (v === 'warning') {
      return html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    }
    if (v === 'success') {
      return html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    }
    // info or default
    return html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  render() {
    const role = () => (['destructive', 'danger', 'error'].includes(this.variant.value) ? 'alert' : 'status');

    return html`
      <div class="alert" part="alert" role=${role}>
        <div class="icon-area" part="icon">
          <slot name="icon">${() => this.#renderDefaultIcon()}</slot>
        </div>
        <div class="content-area" part="content">
          ${() => (this.alertTitle.value ? html`<h5 class="title" part="title">${() => this.alertTitle.value}</h5>` : '')}
          <div class="description" part="description">
            <slot>${() => this.message.value || this.label.value || ''}</slot>
          </div>
        </div>
        ${() =>
          this.dismissible.value
            ? html`
                <button
                  type="button"
                  class="dismiss-btn"
                  part="dismiss"
                  aria-label="Dismiss alert"
                  onclick=${this.dismiss}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              `
            : ''
        }
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-alert')) {
  customElements.define('el-alert', ElAlert);
}
