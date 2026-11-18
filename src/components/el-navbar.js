/**
 * <el-navbar>
 * Responsive sticky top navigation bar with brand, badge, leading/trailing action slots,
 * and automatic mobile drawer collapse for slotted navigation links.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';
import './el-badge.js';

export class ElNavbar extends Elementum {
  static observedAttributes = ['brand', 'href', 'badge', 'badge-variant', 'sticky', 'open'];

  brand = signal('');
  href = signal('#');
  badge = signal('');
  // 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  badgeVariant = signal('primary');
  sticky = signal(false);
  open = signal(false);

  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      position: relative;
      z-index: 1000;
      font-family: var(--el-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    :host([sticky]) {
      position: sticky;
      top: 0;
    }

    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 16px;
      width: 100%;
      box-sizing: border-box;
      position: relative;
      background: var(--el-surface-card, #ffffff);
      background: color-mix(in srgb, var(--el-surface-card, #ffffff) 92%, transparent);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
      color: var(--el-text-primary, #0f172a);
    }

    .left-group {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1 1 auto;
    }

    .brand-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      max-width: 100%;
      font-weight: 800;
      font-size: 1.05rem;
      text-decoration: none;
      color: inherit;
      letter-spacing: -0.02em;
    }

    .brand-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-links {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
      padding: 14px 16px;
      background: var(--el-surface-card, #ffffff);
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
      box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.14);
      z-index: 1001;
      box-sizing: border-box;
    }

    .nav-links.open,
    :host([open]) .nav-links {
      display: flex;
    }

    ::slotted(a),
    ::slotted(el-route-link) {
      display: inline-flex;
      align-items: center;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--el-text-secondary, #475569);
      text-decoration: none;
      padding: 8px 12px;
      border-radius: var(--el-radius-md, 6px);
      transition: background-color 0.15s ease, color 0.15s ease;
      white-space: nowrap;
      box-sizing: border-box;
      width: 100%;
    }

    ::slotted(a:hover),
    ::slotted(a.active),
    ::slotted(a[active]),
    ::slotted(el-route-link:hover),
    ::slotted(el-route-link[active]) {
      color: var(--el-color-primary, #2563eb);
      background: var(--el-surface-muted, #f1f5f9);
      font-weight: 600;
    }

    .right-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .mobile-menu-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      background: var(--el-surface-muted, #f1f5f9);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 8px);
      color: var(--el-text-primary, #0f172a);
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }

    .mobile-menu-btn:hover {
      background: var(--el-step-4, #e2e8f0);
    }

    .mobile-menu-btn:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: 2px;
    }

    @media (min-width: 860px) {
      .navbar-inner {
        padding: 10px 28px;
      }

      .left-group {
        flex: 0 0 auto;
      }

      .nav-links,
      :host([open]) .nav-links {
        display: flex;
        position: static;
        flex-direction: row;
        align-items: center;
        gap: 6px;
        padding: 0;
        background: transparent;
        border-bottom: none;
        box-shadow: none;
        width: auto;
      }

      ::slotted(a),
      ::slotted(el-route-link) {
        width: auto;
        font-size: 0.875rem;
        padding: 6px 12px;
      }

      .mobile-menu-btn {
        display: none;
      }
    }
  `;

  connected() {
    this.addEventListener(
      'click',
      (e) => {
        if (!this.open.value) return;
        const link = e.target?.closest?.('a, el-route-link');
        if (link && this.contains(link)) {
          this.closeMenu();
        }
      },
      { signal: this.signal }
    );

    if (typeof document !== 'undefined') {
      document.addEventListener(
        'click',
        (e) => {
          if (!this.open.value) return;
          const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
          if (!path.includes(this) && !this.contains(e.target)) {
            this.closeMenu();
          }
        },
        { signal: this.signal }
      );

      document.addEventListener(
        'keydown',
        (e) => {
          if (e.key === 'Escape' && this.open.value) {
            this.closeMenu();
          }
        },
        { signal: this.signal }
      );
    }
  }

  toggleMenu(e) {
    if (e) e.stopPropagation();
    this.open.value = !this.open.value;
    this.emit('toggle', { open: this.open.value });
  }

  closeMenu() {
    if (!this.open.value) return;
    this.open.value = false;
    this.emit('toggle', { open: false });
  }

  render() {
    return html`
      <header class="navbar-inner" part="header">
        <div class="left-group" part="start">
          <slot name="start"></slot>
          <slot name="brand">
            <a class="brand-link" href=${() => this.href.value || '#'} part="brand">
              ${() => (this.brand.value ? html`<span class="brand-text">${() => this.brand.value}</span>` : '')}
              ${() =>
                this.badge.value
                  ? html`<el-badge size="sm" variant=${() => this.badgeVariant.value || 'primary'} count=${() => this.badge.value}></el-badge>`
                  : ''}
            </a>
          </slot>
        </div>

        <nav
          class=${() => (this.open.value ? 'nav-links open' : 'nav-links')}
          part="nav"
          aria-label="Primary navigation"
        >
          <slot></slot>
        </nav>

        <div class="right-group" part="actions">
          <slot name="actions"></slot>
          <button
            class="mobile-menu-btn"
            part="toggle"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded=${() => (this.open.value ? 'true' : 'false')}
            onclick=${(e) => this.toggleMenu(e)}
          >
            ${() =>
              this.open.value
                ? html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
                : html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`}
          </button>
        </div>
      </header>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-navbar')) {
  customElements.define('el-navbar', ElNavbar);
}
