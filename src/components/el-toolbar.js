/**
 * <el-toolbar>
 * Accessible action & tool strip container primitive inspired by Base UI.
 * Implements WAI-ARIA Toolbar role with roving tabindex keyboard navigation,
 * orientation support, and seamless grouping of controls.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElToolbar extends Elementum {
  static observedAttributes = ['orientation', 'disabled'];

  orientation = signal('horizontal'); // 'horizontal' | 'vertical'
  disabled = signal(false);

  static styles = css`
    :host {
      display: inline-flex;
      max-width: 100%;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
    }

    .toolbar {
      display: inline-flex;
      align-items: center;
      gap: var(--el-spacing-xs, 4px);
      padding: var(--el-spacing-xs, 4px);
      background: var(--el-surface-base, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 8px);
      box-sizing: border-box;
      max-width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    :host-context([data-theme="dark"]) .toolbar {
      background: #1e293b;
      border-color: #334155;
    }

    :host([orientation="vertical"]) .toolbar {
      flex-direction: column;
    }

    :host([disabled]) {
      opacity: 0.6;
      pointer-events: none;
    }

    ::slotted(*) {
      box-sizing: border-box;
    }
  `;

  #focusedIndex = 0;

  connected() {
    if (this.hasAttribute('orientation')) {
      this.orientation.value = this.getAttribute('orientation');
    }
    if (this.hasAttribute('disabled')) {
      this.disabled.value = true;
    }

    this.addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('focusin', this.#onFocusIn);

    // Initial roving tabindex setup
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb) => setTimeout(cb, 0);
    const slot = this.shadowRoot?.querySelector('slot');
    slot?.addEventListener('slotchange', () => this.#updateRovingTabindex());
    // Also run immediately
    raf(() => this.#updateRovingTabindex());
  }

  disconnected() {
    this.removeEventListener('keydown', this.#onKeyDown);
    this.removeEventListener('focusin', this.#onFocusIn);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'orientation') {
      this.orientation.value = newValue || 'horizontal';
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null;
    }
    return true;
  }

  #getItems() {
    const candidates = Array.from(this.querySelectorAll('*')).filter((el) => {
      // Must be a direct child or button/input/select/custom element
      if (el.parentElement !== this) return false;
      const tag = el.tagName.toLowerCase();
      if (['el-separator', 'hr'].includes(tag)) return false;
      if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') return false;
      return true;
    });
    return candidates;
  }

  #updateRovingTabindex(activeIndex = 0) {
    const items = this.#getItems();
    if (items.length === 0) return;
    this.#focusedIndex = Math.max(0, Math.min(activeIndex, items.length - 1));

    items.forEach((item, idx) => {
      if (idx === this.#focusedIndex) {
        item.setAttribute('tabindex', '0');
      } else {
        item.setAttribute('tabindex', '-1');
      }
    });
  }

  #onFocusIn = (e) => {
    const items = this.#getItems();
    const idx = items.indexOf(e.target);
    if (idx !== -1) {
      this.#focusedIndex = idx;
      this.#updateRovingTabindex(idx);
    }
  };

  #onKeyDown = (e) => {
    if (this.disabled.value) return;
    const items = this.#getItems();
    if (items.length === 0) return;

    const isVert = this.orientation.value === 'vertical';
    const prevKey = isVert ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = isVert ? 'ArrowDown' : 'ArrowRight';

    if (e.key === prevKey) {
      e.preventDefault();
      this.#focusedIndex = (this.#focusedIndex - 1 + items.length) % items.length;
      this.#focusCurrent(items);
    } else if (e.key === nextKey) {
      e.preventDefault();
      this.#focusedIndex = (this.#focusedIndex + 1) % items.length;
      this.#focusCurrent(items);
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.#focusedIndex = 0;
      this.#focusCurrent(items);
    } else if (e.key === 'End') {
      e.preventDefault();
      this.#focusedIndex = items.length - 1;
      this.#focusCurrent(items);
    }
  };

  #focusCurrent(items) {
    const target = items[this.#focusedIndex];
    if (target) {
      this.#updateRovingTabindex(this.#focusedIndex);
      target.focus();
    }
  }

  render() {
    return html`
      <div
        class="toolbar"
        part="toolbar"
        role="toolbar"
        aria-orientation=${() => this.orientation.value}
        aria-disabled=${() => (this.disabled.value ? 'true' : 'false')}
      >
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-toolbar')) {
  customElements.define('el-toolbar', ElToolbar);
}
