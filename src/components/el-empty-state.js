/**
 * <el-empty-state>
 * Accessible zero-data feedback placeholder inspired by shadcn/ui.
 * Renders an illustrative graphic/icon, headline title, description text,
 * and customizable action buttons.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElEmptyState extends Elementum {
  static observedAttributes = ['title', 'description', 'icon'];

  stateTitle = signal('');
  stateDescription = signal('');
  stateIcon = signal('');

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 48px 24px;
      border: 2px dashed var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-lg, 12px);
      background: var(--el-surface-base, #ffffff);
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
      width: 100%;
    }

    :root[data-theme="dark"] :host {
      background: #1e293b;
      border-color: #334155;
    }

    .icon-container {
      width: 54px;
      height: 54px;
      border-radius: 999px;
      background: var(--el-surface-muted, #f1f5f9);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      color: var(--el-text-muted, #64748b);
    }

    :root[data-theme="dark"] .icon-container {
      background: #0f172a;
      color: #94a3b8;
    }

    .title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--el-text-primary, #0f172a);
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }

    :root[data-theme="dark"] .title {
      color: #f8fafc;
    }

    .description {
      font-size: 0.875rem;
      color: var(--el-text-secondary, #64748b);
      max-width: 420px;
      line-height: 1.5;
      margin: 0 0 20px 0;
    }

    :root[data-theme="dark"] .description {
      color: #94a3b8;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }
  `;

  connected() {
    this.#syncAttrs();
  }

  attributeChanged(name, oldValue, newValue) {
    this.#syncAttrs();
    return true;
  }

  #syncAttrs() {
    this.stateTitle.value = this.getAttribute('title') || 'No items found';
    this.stateDescription.value = this.getAttribute('description') || '';
    this.stateIcon.value = this.getAttribute('icon') || '';
  }

  render() {
    return html`
      <div class="icon-container" part="icon">
        <slot name="icon">
          ${() =>
            this.stateIcon.value
              ? html`<span style="font-size: 1.5rem; line-height: 1;">${() => this.stateIcon.value}</span>`
              : html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`}
        </slot>
      </div>
      <h3 class="title" part="title">${() => this.stateTitle.value}</h3>
      ${() =>
        this.stateDescription.value
          ? html`<p class="description" part="description">${() => this.stateDescription.value}</p>`
          : html`<div class="description" part="description"><slot></slot></div>`
      }
      <div class="actions" part="actions">
        <slot name="action"></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-empty-state')) {
  customElements.define('el-empty-state', ElEmptyState);
}
