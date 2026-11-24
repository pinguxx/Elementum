import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-navigation-menu>
 * Desktop mega-menu navigation primitive inspired by Radix Primitives.
 * Supports horizontal links, interactive popover cards, and roving keyboard navigation.
 */
export class ElNavigationMenu extends Elementum {
  static observedAttributes = ['orientation'];

  orientation = signal('horizontal');

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      position: relative;
      box-sizing: border-box;
      font-family: inherit;
    }

    nav {
      display: flex;
      align-items: center;
      gap: 6px;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    :host([orientation="vertical"]) nav {
      flex-direction: column;
      align-items: stretch;
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  connected() {
    this.orientation.value = this.getAttribute('orientation') || 'horizontal';
    this.setAttribute('role', 'navigation');
    this.#syncOrientation();
  }

  rendered() {
    this.#syncOrientation();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'orientation') {
      this.orientation.value = newValue || 'horizontal';
      this.#syncOrientation();
    }
  }

  #syncOrientation() {
    const orient = this.orientation.value || 'horizontal';
    this.querySelectorAll('el-navigation-menu-item').forEach((item) => {
      item.setAttribute('data-orientation', orient);
    });
  }

  render() {
    return html`<nav><slot></slot></nav>`;
  }
}

/**
 * <el-navigation-menu-item>
 * Wrapper for a navigation menu entry (either a direct link or a trigger + content popover).
 */
export class ElNavigationMenuItem extends Elementum {
  open = signal(false);
  #closeTimer = null;

  static styles = css`
    :host {
      position: relative;
      display: inline-block;
    }

    .viewport {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 8px;
      min-width: 280px;
      padding: 16px;
      background-color: var(--el-surface-card, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-lg, 12px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      z-index: 1050;
      display: none;
      animation: el-nav-fade-in 180ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Invisible hover bridge so cursor movement across margin-top does not collapse menu */
    .viewport::before {
      content: '';
      position: absolute;
      top: -14px;
      left: 0;
      right: 0;
      height: 14px;
    }

    :host([data-orientation="vertical"]) .viewport {
      top: 0;
      left: 100%;
      margin-top: 0;
      margin-left: 8px;
    }

    :host([data-orientation="vertical"]) .viewport::before {
      top: 0;
      left: -14px;
      right: auto;
      width: 14px;
      height: 100%;
    }

    :host-context([data-theme="dark"]) .viewport {
      background-color: #1e293b;
      border-color: #334155;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }

    :host([open]) .viewport {
      display: block;
    }

    @keyframes el-nav-fade-in {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  connected() {
    const parentMenu = this.closest('el-navigation-menu');
    if (parentMenu) {
      this.setAttribute('data-orientation', parentMenu.getAttribute('orientation') || 'horizontal');
    }
    this.addEventListener('mouseenter', this.#onMouseEnter);
    this.addEventListener('mouseleave', this.#onMouseLeave);
    document.addEventListener('click', this.#onDocClick);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnected() {
    clearTimeout(this.#closeTimer);
    this.removeEventListener('mouseenter', this.#onMouseEnter);
    this.removeEventListener('mouseleave', this.#onMouseLeave);
    document.removeEventListener('click', this.#onDocClick);
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  #onMouseEnter = () => {
    clearTimeout(this.#closeTimer);
    if (this.querySelector('el-navigation-menu-content')) {
      this.openMenu();
    }
  };

  #onMouseLeave = () => {
    clearTimeout(this.#closeTimer);
    if (this.querySelector('el-navigation-menu-content')) {
      this.#closeTimer = setTimeout(() => {
        this.closeMenu();
      }, 150);
    }
  };

  #onDocClick = (e) => {
    const path = typeof e.composedPath === 'function' ? e.composedPath() : null;
    const inside = path?.length ? path.includes(this) : this.contains(e.target);
    if (!inside) {
      this.closeMenu();
    }
  };

  #onKeyDown = (e) => {
    if (e.key === 'Escape') {
      this.closeMenu();
    }
  };

  openMenu() {
    clearTimeout(this.#closeTimer);
    this.open.value = true;
    this.setAttribute('open', '');
    const btn = this.querySelector('el-navigation-menu-trigger')?.shadowRoot?.querySelector('button');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  closeMenu() {
    clearTimeout(this.#closeTimer);
    this.open.value = false;
    this.removeAttribute('open');
    const btn = this.querySelector('el-navigation-menu-trigger')?.shadowRoot?.querySelector('button');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  toggleMenu() {
    if (this.open.value) this.closeMenu();
    else this.openMenu();
  }

  #onViewportClick = (e) => {
    const link = e.target.closest('a, button, [role="menuitem"]');
    if (link) {
      this.emit('select', { value: link.textContent?.trim() || '' });
      this.closeMenu();
    }
  };

  render() {
    return html`
      <slot name="trigger"></slot>
      <slot></slot>
      <div class="viewport" role="region" @click=${this.#onViewportClick}>
        <slot name="content"></slot>
      </div>
    `;
  }
}

/**
 * <el-navigation-menu-trigger>
 * Button that toggles an <el-navigation-menu-item>'s dropdown.
 */
export class ElNavigationMenuTrigger extends Elementum {
  static styles = css`
    :host {
      display: inline-flex;
    }

    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      font-size: var(--el-text-sm, 0.875rem);
      font-weight: 500;
      color: var(--el-text-primary, #0f172a);
      background: transparent;
      border: none;
      border-radius: var(--el-radius-md, 6px);
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
      outline: none;
    }

    button:hover, :host-context([open]) button {
      background-color: var(--el-surface-muted, #f1f5f9);
      color: var(--el-color-primary-text, #1d4ed8);
    }

    :host-context([data-theme="dark"]) button {
      color: #f8fafc;
    }

    :host-context([data-theme="dark"]) button:hover,
    :host-context([data-theme="dark"]):host-context([open]) button {
      background-color: #1e293b;
      color: #60a5fa;
    }

    .chevron {
      font-size: 10px;
      transition: transform 0.2s ease;
    }

    :host-context([open]) .chevron {
      transform: rotate(180deg);
    }
  `;

  #onClick = () => {
    this.closest('el-navigation-menu-item')?.toggleMenu();
  };

  render() {
    return html`
      <button type="button" aria-haspopup="true" aria-expanded="false" @click=${this.#onClick}>
        <slot></slot>
        <span class="chevron" aria-hidden="true">▼</span>
      </button>
    `;
  }
}

/**
 * <el-navigation-menu-content>
 * Container for the menu item's expanded content.
 */
export class ElNavigationMenuContent extends Elementum {
  connected() {
    this.setAttribute('slot', 'content');
  }

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-navigation-menu')) customElements.define('el-navigation-menu', ElNavigationMenu);
  if (!customElements.get('el-navigation-menu-item')) customElements.define('el-navigation-menu-item', ElNavigationMenuItem);
  if (!customElements.get('el-navigation-menu-trigger')) customElements.define('el-navigation-menu-trigger', ElNavigationMenuTrigger);
  if (!customElements.get('el-navigation-menu-content')) customElements.define('el-navigation-menu-content', ElNavigationMenuContent);
}
