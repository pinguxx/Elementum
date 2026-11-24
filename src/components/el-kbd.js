/**
 * <el-kbd>
 * Accessible keyboard shortcut badge inspired by shadcn/ui.
 * Automatically parses modifier shortcuts (cmd, ctrl, shift, alt, opt, enter, esc, etc.)
 * or renders custom slotted keycaps.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElKbd extends Elementum {
  static observedAttributes = ['keys', 'size'];

  keys = signal('');
  size = signal('md'); // 'sm' | 'md' | 'lg'

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      vertical-align: middle;
      font-family: var(--el-font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
      box-sizing: border-box;
      line-height: 1;
    }

    .keycap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--el-surface-muted, #f1f5f9);
      border: 1px solid var(--el-surface-border, #cbd5e1);
      border-bottom-width: 2px;
      border-radius: var(--el-radius-sm, 4px);
      color: var(--el-text-secondary, #475569);
      font-weight: 600;
      box-sizing: border-box;
      user-select: none;
      box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
    }

    :host-context([data-theme="dark"]) .keycap {
      background: #1e293b;
      border-color: #475569;
      border-bottom-color: #64748b;
      color: #cbd5e1;
      box-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
    }

    /* Sizes */
    :host([size="sm"]) .keycap {
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      font-size: 10px;
    }

    :host([size="md"]) .keycap,
    :host(:not([size])) .keycap {
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      font-size: 11px;
    }

    :host([size="lg"]) .keycap {
      min-width: 26px;
      height: 26px;
      padding: 0 8px;
      font-size: 13px;
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
    this.keys.value = this.getAttribute('keys') || '';
    this.size.value = this.getAttribute('size') || 'md';
    if (!this.hasAttribute('size')) this.setAttribute('size', 'md');
  }

  #formatKey(key) {
    const k = key.trim().toLowerCase();
    switch (k) {
      case 'cmd':
      case 'command':
        return '⌘';
      case 'ctrl':
      case 'control':
        return '⌃';
      case 'shift':
        return '⇧';
      case 'alt':
      case 'opt':
      case 'option':
        return '⌥';
      case 'enter':
      case 'return':
        return '↵';
      case 'esc':
      case 'escape':
        return '⎋';
      case 'tab':
        return '⇥';
      case 'backspace':
      case 'delete':
        return '⌫';
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'left':
        return '←';
      case 'right':
        return '→';
      default:
        return key.trim().toUpperCase();
    }
  }

  render() {
    const keyList = () => {
      const raw = this.keys.value;
      if (!raw) return [];
      return raw.split('+').map(k => this.#formatKey(k));
    };

    return html`
      ${() => {
        const list = keyList();
        if (list.length === 0) {
          return html`<kbd class="keycap" part="key"><slot></slot></kbd>`;
        }
        return list.map(k => html`<kbd class="keycap" part="key">${k}</kbd>`);
      }}
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-kbd')) {
  customElements.define('el-kbd', ElKbd);
}
