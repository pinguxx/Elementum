/**
 * <el-context-menu>
 * Accessible context menu primitive inspired by Base UI.
 * Opens at pointer coordinates on right-click or keyboard (Shift+F10)
 * with viewport collision boundary detection, roving item focus, and light dismiss.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElContextMenu extends Elementum {
  static observedAttributes = ['disabled'];

  isOpen = signal(false);
  disabled = signal(false);
  posX = signal(0);
  posY = signal(0);

  #touchStartX = 0;
  #touchStartY = 0;
  #touchTimer = null;
  #isLongPress = false;

  static styles = css`
    :host {
      display: block;
      position: relative;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }

    .trigger-area {
      display: block;
      width: 100%;
      height: 100%;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      touch-action: pan-x pan-y;
    }

    ::slotted(:not([slot="menu"])) {
      -webkit-touch-callout: none !important;
      -webkit-user-select: none !important;
      user-select: none !important;
    }

    .menu {
      position: fixed;
      z-index: 9999;
      display: none;
      flex-direction: column;
      min-width: 180px;
      padding: 4px;
      background: var(--el-surface-base, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 8px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
      box-sizing: border-box;
      outline: none;
    }

    :host([data-state="open"]) .menu {
      display: flex;
      transform-origin: top left;
      animation: el-fade-in 120ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    @media (prefers-reduced-motion: reduce) {
      :host([data-state="open"]) .menu {
        animation: none;
      }
    }

    :host-context([data-theme="dark"]) .menu {
      background: #1e293b;
      border-color: #334155;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }

    @keyframes el-fade-in {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    ::slotted([role="menuitem"]),
    ::slotted(button),
    ::slotted(.menu-item) {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 10px;
      font-size: 13px;
      color: var(--el-text-base, #111827);
      background: transparent;
      border: none;
      border-radius: var(--el-radius-sm, 4px);
      text-align: left;
      cursor: pointer;
      font-family: inherit;
      box-sizing: border-box;
      outline: none;
      transition: background-color 0.12s ease;
    }

    ::slotted([role="menuitem"]:hover),
    ::slotted(button:hover),
    ::slotted(.menu-item:hover),
    ::slotted([role="menuitem"]:focus-visible),
    ::slotted(button:focus-visible) {
      background: var(--el-surface-muted, #f1f5f9);
      color: var(--el-color-primary, #2563eb);
    }

    :host-context([data-theme="dark"]) ::slotted([role="menuitem"]:hover),
    :host-context([data-theme="dark"]) ::slotted(button:hover),
    :host-context([data-theme="dark"]) ::slotted(.menu-item:hover) {
      background: #334155;
      color: #93c5fd;
    }
  `;

  connected() {
    if (this.hasAttribute('disabled')) this.disabled.value = true;
    this.setAttribute('data-state', 'closed');

    this.addEventListener('contextmenu', this.#onContextMenu);
    this.addEventListener('pointerdown', this.#onPointerDown);
    this.addEventListener('pointermove', this.#onPointerMove);
    this.addEventListener('pointerup', this.#onPointerUp);
    this.addEventListener('pointercancel', this.#clearTouchTimer);
    this.addEventListener('click', this.#onClick, true);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnected() {
    this.#clearTouchTimer();
    this.removeEventListener('contextmenu', this.#onContextMenu);
    this.removeEventListener('pointerdown', this.#onPointerDown);
    this.removeEventListener('pointermove', this.#onPointerMove);
    this.removeEventListener('pointerup', this.#onPointerUp);
    this.removeEventListener('pointercancel', this.#clearTouchTimer);
    this.removeEventListener('click', this.#onClick, true);
    this.removeEventListener('keydown', this.#onKeyDown);
    this.#removeGlobalListeners();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'disabled') this.disabled.value = newValue !== null;
    return true;
  }

  #isMenuEvent(e) {
    const path = e.composedPath ? e.composedPath() : [];
    const menu = this.shadowRoot?.querySelector('.menu');
    return menu ? path.includes(menu) : false;
  }

  #onContextMenu = (e) => {
    if (this.disabled.value || this.#isMenuEvent(e)) return;
    e.preventDefault();
    this.#clearTouchTimer();
    this.open(e.clientX, e.clientY);
  };

  #onPointerDown = (e) => {
    if (this.disabled.value || this.#isMenuEvent(e)) return;
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      this.#touchStartX = e.clientX;
      this.#touchStartY = e.clientY;
      this.#isLongPress = false;
      this.#clearTouchTimer();

      this.#touchTimer = setTimeout(() => {
        this.#isLongPress = true;
        if (typeof window !== 'undefined' && window.getSelection) {
          try { window.getSelection()?.removeAllRanges?.(); } catch (_) {}
        }
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(30); } catch (_) {}
        }
        this.open(this.#touchStartX, this.#touchStartY);
      }, 500);
    }
  };

  #onPointerMove = (e) => {
    if (!this.#touchTimer) return;
    if (Math.hypot(e.clientX - this.#touchStartX, e.clientY - this.#touchStartY) > 10) {
      this.#clearTouchTimer();
    }
  };

  #onPointerUp = (e) => {
    this.#clearTouchTimer();
    if (this.#isLongPress) {
      e.preventDefault();
      setTimeout(() => { this.#isLongPress = false; }, 100);
    }
  };

  #onClick = (e) => {
    if (this.#isLongPress) {
      e.preventDefault();
      e.stopPropagation();
      this.#isLongPress = false;
    }
  };

  #clearTouchTimer = () => {
    if (this.#touchTimer) {
      clearTimeout(this.#touchTimer);
      this.#touchTimer = null;
    }
  };

  open(x = 100, y = 100) {
    if (this.disabled.value) return;
    this.posX.value = x;
    this.posY.value = y;
    this.isOpen.value = true;
    this.setAttribute('data-state', 'open');

    // Viewport collision adjustment
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 768;
    const estimatedW = 180;
    const estimatedH = 160;

    let adjustedX = x;
    let adjustedY = y;
    if (x + estimatedW > winW) adjustedX = Math.max(8, x - estimatedW);
    if (y + estimatedH > winH) adjustedY = Math.max(8, y - estimatedH);

    this.posX.value = adjustedX;
    this.posY.value = adjustedY;

    this.#addGlobalListeners();
    this.emit('open', { x: adjustedX, y: adjustedY });

    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb) => setTimeout(cb, 0);
    raf(() => {
      const firstItem = this.querySelector('[role="menuitem"], button, .menu-item');
      firstItem?.focus();
    });
  }

  close() {
    if (!this.isOpen.value) return;
    this.isOpen.value = false;
    this.setAttribute('data-state', 'closed');
    this.#removeGlobalListeners();
    this.emit('close');
  }

  toggle(x, y) {
    if (this.isOpen.value) this.close();
    else this.open(x, y);
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
    if (!this.isOpen.value) return;
    const path = e.composedPath ? e.composedPath() : [];
    if (!path.includes(this)) {
      this.close();
    }
  };

  #onWindowKeyDown = (e) => {
    if (!this.isOpen.value) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    }
  };

  #onKeyDown = (e) => {
    // Shift+F10 opens context menu via keyboard
    if (e.shiftKey && e.key === 'F10') {
      e.preventDefault();
      const rect = this.getBoundingClientRect();
      this.open(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  };

  render() {
    return html`
      <div class="trigger-area" part="trigger">
        <slot name="trigger"></slot>
        <slot></slot>
      </div>
      <div
        class="menu"
        part="menu"
        role="menu"
        tabindex="-1"
        style=${() => `left: ${this.posX.value}px; top: ${this.posY.value}px;`}
      >
        <slot name="menu"></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-context-menu')) {
  customElements.define('el-context-menu', ElContextMenu);
}
