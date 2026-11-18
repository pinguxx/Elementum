/**
 * <el-accordion> and <el-accordion-item>
 * Accessible disclosure/accordion components following W3C patterns.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

let nextItemId = 0;

export class ElAccordionItem extends Elementum {
  static observedAttributes = ['title', 'heading', 'value', 'open', 'disabled'];

  itemTitle = signal('');
  value = signal('');
  isOpen = signal(false);
  disabled = signal(false);

  #id = `el-acc-item-${++nextItemId}`;

  static styles = css`
    :host {
      display: block;
      border-bottom: 1px solid var(--el-surface-border, #e5e7eb);
    }

    :host(:last-of-type) {
      border-bottom: none;
    }

    .header-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--el-spacing-md, 16px) 0;
      background: none;
      border: none;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 600;
      color: var(--el-text-base, #111827);
      text-align: left;
      cursor: pointer;
      outline: none;
      transition: color 0.15s ease;
    }

    .header-btn:hover:not(:disabled) {
      color: var(--el-color-primary, #2563eb);
    }

    .header-btn:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: 2px;
      border-radius: var(--el-radius-sm, 4px);
    }

    .header-btn:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .chevron {
      font-size: 0.75rem;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      color: var(--el-text-muted, #6b7280);
    }

    .chevron.open {
      transform: rotate(180deg);
    }

    .panel {
      display: none;
      padding-bottom: var(--el-spacing-md, 16px);
      color: var(--el-text-base, #374151);
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    .panel.open {
      display: block;
    }
  `;

  connected() {
    this.itemTitle.value = this.getAttribute('title') || this.getAttribute('heading') || '';
    this.value.value = this.getAttribute('value') || this.#id;
    this.isOpen.value = this.hasAttribute('open');
    this.disabled.value = this.hasAttribute('disabled');
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'open') {
      this.isOpen.value = newValue !== null && newValue !== 'false';
    } else if (name === 'title' || name === 'heading') {
      this.itemTitle.value = newValue || '';
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
    }
  }

  toggle() {
    if (this.disabled.value) return;
    this.isOpen.value = !this.isOpen.value;
    if (this.isOpen.value) {
      this.setAttribute('open', '');
    } else {
      this.removeAttribute('open');
    }
    this.emit('toggle', { value: this.value.value, open: this.isOpen.value });
  }

  render() {
    const buttonId = `${this.#id}-btn`;
    const panelId = `${this.#id}-panel`;

    return html`
      <button
        type="button"
        id=${buttonId}
        class="header-btn"
        part="header"
        ?disabled=${this.disabled}
        aria-expanded=${() => (this.isOpen.value ? 'true' : 'false')}
        aria-controls=${panelId}
        @click=${() => this.toggle()}
      >
        <span part="title"><slot name="title">${this.itemTitle}</slot></span>
        <span class=${() => `chevron ${this.isOpen.value ? 'open' : ''}`} part="chevron">▼</span>
      </button>
      <div
        id=${panelId}
        role="region"
        aria-labelledby=${buttonId}
        class=${() => `panel ${this.isOpen.value ? 'open' : ''}`}
        part="panel"
      >
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-accordion-item')) {
  customElements.define('el-accordion-item', ElAccordionItem);
}

export class ElAccordion extends Elementum {
  static observedAttributes = ['multiple'];

  multiple = signal(false);

  static styles = css`
    :host {
      display: block;
      border: 1px solid var(--el-surface-border, #e5e7eb);
      border-radius: var(--el-radius-md, 8px);
      padding: 0 var(--el-spacing-md, 16px);
      background: var(--el-surface-base, #ffffff);
    }
  `;

  connected() {
    this.multiple.value = this.hasAttribute('multiple');
    this.addEventListener('toggle', this.#onItemToggle);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'multiple') {
      this.multiple.value = newValue !== null && newValue !== 'false';
    }
  }

  #onItemToggle = (e) => {
    // If not multiple and this item opened, close all other items
    if (!this.multiple.value && e.detail.open) {
      const items = this.querySelectorAll('el-accordion-item');
      for (const item of items) {
        if (item !== e.target && item.isOpen.value) {
          item.isOpen.value = false;
          item.removeAttribute('open');
        }
      }
    }
    this.emit('change', {
      value: e.detail.value,
      open: e.detail.open,
    });
  };

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-accordion')) {
  customElements.define('el-accordion', ElAccordion);
}
