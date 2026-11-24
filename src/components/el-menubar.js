/**
 * <el-menubar>
 * Desktop-grade application menubar primitive inspired by Base UI.
 * Features WAI-ARIA role="menubar", horizontal keyboard navigation (ArrowLeft/ArrowRight),
 * automatic hover-switching between menus when open, and light-dismiss.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElMenubar extends Elementum {
  static observedAttributes = ['disabled'];

  activeMenu = signal(null); // id or trigger element currently open
  disabled = signal(false);

  static styles = css`
    :host {
      display: flex;
      width: 100%;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
    }

    .menubar {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 3px 6px;
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      background: var(--el-surface-base, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 8px);
      box-sizing: border-box;
    }

    :host-context([data-theme="dark"]) .menubar {
      background: #1e293b;
      border-color: #334155;
    }

    :host([disabled]) {
      opacity: 0.6;
      pointer-events: none;
    }

    ::slotted([role="menuitem"]),
    ::slotted(.menubar-item),
    ::slotted(button) {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-base, #111827);
      background: transparent;
      border: none;
      border-radius: var(--el-radius-sm, 4px);
      cursor: pointer;
      font-family: inherit;
      outline: none;
      transition: background-color 0.12s ease, color 0.12s ease;
      box-sizing: border-box;
    }

    ::slotted([role="menuitem"]:hover),
    ::slotted(.menubar-item:hover),
    ::slotted(button:hover),
    ::slotted([role="menuitem"]:focus-visible),
    ::slotted(button:focus-visible) {
      background: var(--el-surface-muted, #f1f5f9);
      color: var(--el-color-primary, #2563eb);
    }

    :host-context([data-theme="dark"]) ::slotted([role="menuitem"]:hover),
    :host-context([data-theme="dark"]) ::slotted(.menubar-item:hover),
    :host-context([data-theme="dark"]) ::slotted(button:hover) {
      background: #334155;
      color: #93c5fd;
    }

    ::slotted([data-state="open"]) {
      background: var(--el-surface-muted, #f1f5f9) !important;
      color: var(--el-color-primary, #2563eb) !important;
    }
  `;

  #focusedIndex = 0;

  connected() {
    if (this.hasAttribute('disabled')) this.disabled.value = true;
    this.addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('pointerenter', this.#onPointerEnterItem, true);
    this.addEventListener('click', this.#onClickItem, true);

    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb) => setTimeout(cb, 0);
    raf(() => this.#initItems());
  }

  disconnected() {
    this.removeEventListener('keydown', this.#onKeyDown);
    this.removeEventListener('pointerenter', this.#onPointerEnterItem, true);
    this.removeEventListener('click', this.#onClickItem, true);
    this.#removeGlobalListeners();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'disabled') this.disabled.value = newValue !== null;
    return true;
  }

  #getItems() {
    return Array.from(this.querySelectorAll('*')).filter((el) => {
      if (el.parentElement !== this) return false;
      const tag = el.tagName.toLowerCase();
      if (['el-separator', 'hr'].includes(tag)) return false;
      return true;
    });
  }

  #initItems() {
    const items = this.#getItems();
    items.forEach((item, idx) => {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', idx === 0 ? '0' : '-1');
    });
  }

  #onClickItem = (e) => {
    const items = this.#getItems();
    const item = items.find((i) => i === e.target || i.contains(e.target));
    if (!item) return;

    if (this.activeMenu.value === item) {
      this.closeMenu();
    } else {
      this.openMenu(item);
    }
  };

  #onPointerEnterItem = (e) => {
    // If ANY menu is already open, hovering an adjacent item switches to it!
    if (!this.activeMenu.value) return;
    const items = this.#getItems();
    const item = items.find((i) => i === e.target || i.contains(e.target));
    if (item && item !== this.activeMenu.value) {
      this.openMenu(item);
    }
  };

  openMenu(item) {
    if (this.activeMenu.value) {
      this.activeMenu.value.removeAttribute('data-state');
      this.activeMenu.value.setAttribute('aria-expanded', 'false');
    }
    this.activeMenu.value = item;
    item.setAttribute('data-state', 'open');
    item.setAttribute('aria-expanded', 'true');
    this.#addGlobalListeners();
    this.emit('open', { item });
  }

  closeMenu() {
    if (!this.activeMenu.value) return;
    this.activeMenu.value.removeAttribute('data-state');
    this.activeMenu.value.setAttribute('aria-expanded', 'false');
    this.activeMenu.value = null;
    this.#removeGlobalListeners();
    this.emit('close');
  }

  #addGlobalListeners() {
    this.#removeGlobalListeners();
    document.addEventListener('pointerdown', this.#onPointerDownOutside, { capture: true, signal: this.signal });
    window.addEventListener('keydown', this.#onWindowKeyDown, { capture: true, signal: this.signal });
  }

  #removeGlobalListeners() {
    document.removeEventListener('pointerdown', this.#onPointerDownOutside, true);
    window.removeEventListener('keydown', this.#onWindowKeyDown, true);
  }

  #onPointerDownOutside = (e) => {
    if (!this.activeMenu.value) return;
    const path = e.composedPath ? e.composedPath() : [];
    if (!path.includes(this)) {
      this.closeMenu();
    }
  };

  #onWindowKeyDown = (e) => {
    if (!this.activeMenu.value) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closeMenu();
    }
  };

  #onKeyDown = (e) => {
    const items = this.#getItems();
    if (items.length === 0) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.#focusedIndex = (this.#focusedIndex + 1) % items.length;
      this.#focusItem(items[this.#focusedIndex]);
      if (this.activeMenu.value) this.openMenu(items[this.#focusedIndex]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.#focusedIndex = (this.#focusedIndex - 1 + items.length) % items.length;
      this.#focusItem(items[this.#focusedIndex]);
      if (this.activeMenu.value) this.openMenu(items[this.#focusedIndex]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.#focusedIndex = 0;
      this.#focusItem(items[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      this.#focusedIndex = items.length - 1;
      this.#focusItem(items[items.length - 1]);
    } else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const current = items[this.#focusedIndex];
      if (current) this.openMenu(current);
    }
  };

  #focusItem(item) {
    const items = this.#getItems();
    items.forEach((it) => it.setAttribute('tabindex', it === item ? '0' : '-1'));
    item?.focus();
  }

  render() {
    return html`
      <div
        class="menubar"
        part="menubar"
        role="menubar"
        aria-orientation="horizontal"
        aria-disabled=${() => (this.disabled.value ? 'true' : 'false')}
      >
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-menubar')) {
  customElements.define('el-menubar', ElMenubar);
}
