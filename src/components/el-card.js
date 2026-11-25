/**
 * <el-card> family
 * Accessible structured card container inspired by shadcn/ui.
 * Includes <el-card-header>, <el-card-title>, <el-card-description>,
 * <el-card-content>, and <el-card-footer>.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElCardTitle extends Elementum {
  static observedAttributes = ['size', 'align'];

  size = signal('md');
  align = signal('left');

  static styles = css`
    :host {
      display: block;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.3;
      color: var(--el-text-primary, #0f172a);
      margin: 0;
    }
    :host([size="sm"]) { font-size: 1rem; }
    :host([size="lg"]) { font-size: 1.5rem; }
    :host([align="center"]) { text-align: center; }
    :host([align="right"]) { text-align: right; }
  `;
  render() {
    return html`<slot></slot>`;
  }
}

export class ElCardDescription extends Elementum {
  static observedAttributes = ['align', 'truncate'];

  align = signal('left');
  truncate = signal(false);

  static styles = css`
    :host {
      display: block;
      font-size: 0.875rem;
      line-height: 1.4;
      color: var(--el-text-muted, #64748b);
      margin-top: 4px;
    }
    :host([align="center"]) { text-align: center; }
    :host([align="right"]) { text-align: right; }
    :host([truncate]) {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
  render() {
    return html`<slot></slot>`;
  }
}

export class ElCardHeader extends Elementum {
  static observedAttributes = ['bordered', 'compact', 'align'];

  bordered = signal(false);
  compact = signal(false);
  align = signal('left');

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 24px 24px 16px 24px;
      box-sizing: border-box;
    }
    :host([compact]) {
      padding: 14px 16px 10px 16px;
    }
    :host([bordered]:not([bordered="false"])) {
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
      margin-bottom: 16px;
    }
    :host([align="center"]) {
      align-items: center;
      text-align: center;
    }
    :host([align="right"]) {
      align-items: flex-end;
      text-align: right;
    }
  `;
  render() {
    return html`<slot></slot>`;
  }
}

export class ElCardContent extends Elementum {
  static observedAttributes = ['compact', 'flush'];

  compact = signal(false);
  flush = signal(false);

  static styles = css`
    :host {
      display: block;
      padding: 0 24px 24px 24px;
      box-sizing: border-box;
      flex: 1;
    }
    :host([compact]) {
      padding: 0 16px 16px 16px;
    }
    :host([flush]) {
      padding: 0;
    }
  `;
  render() {
    return html`<slot></slot>`;
  }
}

export class ElCardFooter extends Elementum {
  static observedAttributes = ['align', 'bordered'];

  align = signal('end');
  bordered = signal(false);

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 24px 24px 24px;
      box-sizing: border-box;
      gap: 12px;
    }
    :host([align="start"]) { justify-content: flex-start; }
    :host([align="center"]) { justify-content: center; }
    :host([align="end"]) { justify-content: flex-end; }
    :host([align="between"]) { justify-content: space-between; }
    :host([bordered]:not([bordered="false"])) {
      border-top: 1px solid var(--el-surface-border, #e2e8f0);
      padding-top: 16px;
    }
  `;
  render() {
    return html`<slot></slot>`;
  }
}

export class ElCard extends Elementum {
  static observedAttributes = ['title', 'bordered', 'glass', 'hoverable'];

  title = signal('');
  bordered = signal(true);
  glass = signal(false);
  hoverable = signal(false);

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      background: var(--el-surface-elevated, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-lg, 12px);
      box-shadow: var(--el-shadow-card, 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05));
      color: var(--el-text-primary, #0f172a);
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    }

    :host([bordered="false"]) {
      border-color: transparent !important;
      box-shadow: none;
    }

    :host([glass]) {
      background: rgba(255, 255, 255, 0.68);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-color: rgba(148, 163, 184, 0.35);
      box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
    }

    :host([hoverable]) {
      cursor: pointer;
    }

    :host([hoverable]:hover) {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
      border-color: var(--el-color-primary, #2563eb);
    }

    .card-auto-header {
      padding: 18px 24px 0 24px;
      font-size: 1.125rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--el-text-primary, #0f172a);
    }

    .card-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      box-sizing: border-box;
    }

    :host(:not([data-compound])) .card-body {
      padding: 16px 24px 20px 24px;
    }
  `;

  connected() {
    this.title.value = this.getAttribute('title') || '';
    this.bordered.value = this.getAttribute('bordered') !== 'false';
    this.glass.value = this.hasAttribute('glass') && this.getAttribute('glass') !== 'false';
    this.hoverable.value = this.hasAttribute('hoverable') && this.getAttribute('hoverable') !== 'false';
    this.#checkCompound();
  }

  rendered() {
    this.#checkCompound();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'title') this.title.value = newValue || '';
    else if (name === 'bordered') this.bordered.value = newValue !== 'false';
    else if (name === 'glass') this.glass.value = newValue !== null && newValue !== 'false';
    else if (name === 'hoverable') this.hoverable.value = newValue !== null && newValue !== 'false';
  }

  #checkCompound() {
    const hasCompound = Boolean(
      this.querySelector('el-card-header, el-card-content, el-card-footer')
    );
    if (hasCompound) {
      this.setAttribute('data-compound', '');
    } else {
      this.removeAttribute('data-compound');
    }
  }

  render() {
    return html`
      ${() =>
        this.title.value
          ? html`<div class="card-auto-header" part="header">${this.title.value}</div>`
          : null}
      <div class="card-body" part="body">
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-card-title')) customElements.define('el-card-title', ElCardTitle);
  if (!customElements.get('el-card-description')) customElements.define('el-card-description', ElCardDescription);
  if (!customElements.get('el-card-header')) customElements.define('el-card-header', ElCardHeader);
  if (!customElements.get('el-card-content')) customElements.define('el-card-content', ElCardContent);
  if (!customElements.get('el-card-footer')) customElements.define('el-card-footer', ElCardFooter);
  if (!customElements.get('el-card')) customElements.define('el-card', ElCard);
}
