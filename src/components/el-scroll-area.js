/**
 * <el-scroll-area>
 * Accessible, zero-dependency custom scrollbar primitive inspired by Base UI.
 * Provides sleek, unobtrusive cross-browser scrollbars with custom track/thumb styling
 * and zero layout shifts.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElScrollArea extends Elementum {
  static observedAttributes = ['type', 'max-height', 'max-width', 'height'];

  type = signal('hover');
  maxHeight = signal('');
  maxWidth = signal('');
  height = signal('');

  static styles = css`
    :host {
      display: block;
      position: relative;
      overflow: hidden;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
    }

    .viewport {
      width: 100%;
      height: 100%;
      overflow: auto;
      box-sizing: border-box;
      scrollbar-width: thin;
      scrollbar-color: var(--el-surface-border, #cbd5e1) transparent;
      -webkit-overflow-scrolling: touch;
    }

    :host-context([data-theme="dark"]) .viewport {
      scrollbar-color: #475569 transparent;
    }

    /* WebKit sleek custom scrollbar */
    .viewport::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .viewport::-webkit-scrollbar-track {
      background: transparent;
    }

    .viewport::-webkit-scrollbar-thumb {
      background: var(--el-surface-border, #cbd5e1);
      border-radius: 9999px;
      transition: background 150ms ease;
    }

    .viewport::-webkit-scrollbar-thumb:hover {
      background: var(--el-text-muted, #94a3b8);
    }

    :host-context([data-theme="dark"]) .viewport::-webkit-scrollbar-thumb {
      background: #475569;
    }

    :host-context([data-theme="dark"]) .viewport::-webkit-scrollbar-thumb:hover {
      background: #64748b;
    }

    /* Hover-only scrollbar mode */
    :host([type="hover"]) .viewport {
      scrollbar-color: transparent transparent;
    }

    :host([type="hover"]:hover) .viewport {
      scrollbar-color: var(--el-surface-border, #cbd5e1) transparent;
    }

    :host([type="hover"]) .viewport::-webkit-scrollbar-thumb {
      background: transparent;
    }

    :host([type="hover"]:hover) .viewport::-webkit-scrollbar-thumb {
      background: var(--el-surface-border, #cbd5e1);
    }

    :host([type="always"]) .viewport {
      overflow: scroll;
      scrollbar-color: var(--el-surface-border, #cbd5e1) transparent;
    }
    :host([type="always"]) .viewport::-webkit-scrollbar-thumb {
      background: var(--el-surface-border, #cbd5e1);
    }

    :host([type="scroll"]) .viewport {
      overflow: auto;
      scrollbar-color: var(--el-text-muted, #94a3b8) transparent;
    }

    :host([type="auto"]) .viewport {
      overflow: auto;
    }
  `;

  #normalizeSize(val) {
    if (!val) return '';
    return /^\d+(\.\d+)?$/.test(val.trim()) ? `${val.trim()}px` : val;
  }

  connected() {
    if (this.hasAttribute('type')) this.type.value = this.getAttribute('type');
    if (this.hasAttribute('max-height')) this.maxHeight.value = this.#normalizeSize(this.getAttribute('max-height'));
    if (this.hasAttribute('max-width')) this.maxWidth.value = this.#normalizeSize(this.getAttribute('max-width'));
    if (this.hasAttribute('height')) this.height.value = this.#normalizeSize(this.getAttribute('height'));
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'type') this.type.value = newValue || 'hover';
    else if (name === 'max-height') this.maxHeight.value = this.#normalizeSize(newValue || '');
    else if (name === 'max-width') this.maxWidth.value = this.#normalizeSize(newValue || '');
    else if (name === 'height') this.height.value = this.#normalizeSize(newValue || '');
    return true;
  }

  render() {
    return html`
      <div
        class="viewport"
        part="viewport"
        tabindex="0"
        role="region"
        aria-label="Scrollable container"
        style=${() => {
          let s = '';
          if (this.height.value) s += `height: ${this.height.value};`;
          if (this.maxHeight.value) s += `max-height: ${this.maxHeight.value};`;
          if (this.maxWidth.value) s += `max-width: ${this.maxWidth.value};`;
          return s;
        }}
      >
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-scroll-area')) {
  customElements.define('el-scroll-area', ElScrollArea);
}
