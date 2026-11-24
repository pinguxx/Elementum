/**
 * <el-sidebar> family
 * Accessible collapsible application sidebar inspired by shadcn/ui.
 * Includes <el-sidebar-header>, <el-sidebar-content>, <el-sidebar-footer>,
 * and <el-sidebar-trigger> with smooth width transitions and responsive mobile drawers.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElSidebarTrigger extends Elementum {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      flex-shrink: 0;
      z-index: 20;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      min-height: 32px;
      width: auto;
      height: auto;
      padding: 6px;
      border-radius: var(--el-radius-md, 8px);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-elevated, #ffffff);
      color: var(--el-text-primary, #0f172a);
      cursor: pointer;
      outline: none;
      transition: background-color 0.15s ease, transform 0.15s ease;
    }

    button:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: 2px;
    }

    :host-context([data-theme="dark"]) button {
      background: #1e293b;
      border-color: #334155;
      color: #f8fafc;
    }

    button:hover {
      background: var(--el-surface-muted, #f1f5f9);
      transform: scale(1.05);
    }

    :host-context([data-theme="dark"]) button:hover {
      background: #334155;
    }
  `;

  #onClick = (e) => {
    e.stopPropagation();
    const forId = this.getAttribute('for');
    const sidebar =
      (forId ? document.getElementById(forId) : null) ||
      this.closest('el-sidebar') ||
      this.parentElement?.querySelector('el-sidebar') ||
      document.querySelector('el-sidebar');
    sidebar?.toggle();
  };

  render() {
    return html`
      <button type="button" aria-label="Toggle Sidebar" @click=${this.#onClick}>
        <slot>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
        </slot>
      </button>
    `;
  }
}

export class ElSidebarHeader extends Elementum {
  static observedAttributes = ['collapsed'];
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
      box-sizing: border-box;
      flex-shrink: 0;
      color: var(--el-text-primary, #0f172a);
      transition: padding 0.2s ease;
    }

    :host([collapsed]) {
      padding: 8px 4px !important;
      justify-content: center !important;
    }

    :host([collapsed]) ::slotted(.collapsible-text),
    :host([collapsed]) .collapsible-text {
      display: none !important;
    }

    :host([collapsed]) ::slotted(div),
    :host([collapsed]) ::slotted(*) {
      justify-content: center !important;
    }
  `;

  connected() {
    this.#syncCollapsed(this.hasAttribute('collapsed') && this.getAttribute('collapsed') !== 'false');
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'collapsed') {
      this.#syncCollapsed(newValue !== null && newValue !== 'false');
    }
  }

  #syncCollapsed(isCol) {
    this.querySelectorAll('.collapsible-text').forEach((el) => {
      el.style.display = isCol ? 'none' : '';
    });
  }

  render() {
    return html`<slot></slot>`;
  }
}

export class ElSidebarContent extends Elementum {
  static observedAttributes = ['collapsed'];
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px;
      gap: 4px;
      box-sizing: border-box;
      color: var(--el-text-primary, #0f172a);
      transition: padding 0.2s ease;
    }

    :host([collapsed]) {
      padding: 8px 4px !important;
      align-items: center !important;
      overflow-x: hidden !important;
      overflow-y: hidden !important;
    }

    :host([collapsed]) ::slotted(.collapsible-text),
    :host([collapsed]) .collapsible-text {
      display: none !important;
    }

    :host([collapsed]) ::slotted(el-button),
    :host([collapsed]) ::slotted(button),
    :host([collapsed]) ::slotted(a),
    :host([collapsed]) ::slotted(.sidebar-nav-item) {
      width: 38px !important;
      min-width: 38px !important;
      max-width: 38px !important;
      height: 38px !important;
      padding: 0 !important;
      justify-content: center !important;
      text-align: center !important;
      overflow: hidden !important;
      margin: 0 auto 6px auto !important;
    }
  `;
  render() {
    return html`<slot></slot>`;
  }
}

export class ElSidebarFooter extends Elementum {
  static observedAttributes = ['collapsed'];
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-top: 1px solid var(--el-surface-border, #e2e8f0);
      box-sizing: border-box;
      flex-shrink: 0;
      color: var(--el-text-primary, #0f172a);
      transition: padding 0.2s ease;
    }

    :host([collapsed]) {
      padding: 8px 4px !important;
      justify-content: center !important;
    }

    :host([collapsed]) ::slotted(.collapsible-text),
    :host([collapsed]) .collapsible-text {
      display: none !important;
    }
  `;
  render() {
    return html`<slot></slot>`;
  }
}

export class ElSidebar extends Elementum {
  static observedAttributes = ['collapsed', 'variant'];

  collapsed = signal(false);
  variant = signal('sidebar'); // 'sidebar' | 'floating' | 'inset'

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 240px;
      min-width: 240px;
      height: 100%;
      min-height: 120px;
      background: var(--el-surface-card, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-lg, 12px);
      box-sizing: border-box;
      transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      color: var(--el-text-primary, #0f172a);
      overflow: hidden;
    }

    :host([collapsed]) {
      width: 56px !important;
      min-width: 56px !important;
      max-width: 56px !important;
    }

    :host([collapsed]) .collapsible-text,
    :host([collapsed]) ::slotted(.collapsible-text) {
      display: none !important;
    }

    /* Variant: default / sidebar */
    :host([variant="default"]),
    :host([variant="sidebar"]) {
      border-radius: 0;
    }

    /* Variant: floating */
    :host([variant="floating"]) {
      border: 1px solid var(--el-surface-border, #e2e8f0) !important;
      border-radius: var(--el-radius-lg, 12px) !important;
      margin: 8px;
      height: calc(100% - 16px);
      min-height: auto;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
    }

    /* Variant: inset */
    :host([variant="inset"]) {
      background: var(--el-surface-muted, #f8fafc);
      border-right: 1px dashed var(--el-surface-border, #cbd5e1) !important;
    }

    ::slotted(a),
    ::slotted(button) {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: var(--el-radius-sm, 6px);
      color: var(--el-text-secondary, #475569);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: background-color 0.15s ease, color 0.15s ease;
      white-space: nowrap;
      border: none;
      background: transparent;
      cursor: pointer;
      width: 100%;
      text-align: left;
      box-sizing: border-box;
    }

    ::slotted(a:hover),
    ::slotted(button:hover) {
      background: var(--el-surface-muted, #f1f5f9);
      color: var(--el-text-primary, #0f172a);
    }

    :host-context([data-theme="dark"]) ::slotted(a),
    :host-context([data-theme="dark"]) ::slotted(button) {
      color: #94a3b8;
    }

    :host-context([data-theme="dark"]) ::slotted(a:hover),
    :host-context([data-theme="dark"]) ::slotted(button:hover) {
      background: #1e293b;
      color: #f8fafc;
    }
  `;

  connected() {
    this.collapsed.value = this.hasAttribute('collapsed') && this.getAttribute('collapsed') !== 'false';
    this.variant.value = this.getAttribute('variant') || 'sidebar';
    if (this.collapsed.value) this.#propagateCollapsed(true);
  }

  rendered() {
    if (this.collapsed.value) {
      this.#propagateCollapsed(true);
    }
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'collapsed') {
      const isCol = newValue !== null && newValue !== 'false';
      this.collapsed.value = isCol;
      this.#propagateCollapsed(isCol);
    }
    if (name === 'variant') this.variant.value = newValue || 'sidebar';
    return true;
  }

  toggle() {
    if (this.collapsed.value) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  collapse() {
    this.collapsed.value = true;
    this.setAttribute('collapsed', '');
    this.#propagateCollapsed(true);
    this.emit('collapse');
    this.emit('toggle', { collapsed: true });
  }

  expand() {
    this.collapsed.value = false;
    this.removeAttribute('collapsed');
    this.#propagateCollapsed(false);
    this.emit('expand');
    this.emit('toggle', { collapsed: false });
  }

  #propagateCollapsed(val) {
    this.querySelectorAll('el-sidebar-header, el-sidebar-content, el-sidebar-footer').forEach(el => {
      if (val) el.setAttribute('collapsed', '');
      else el.removeAttribute('collapsed');
    });
    this.querySelectorAll('.collapsible-text').forEach(el => {
      el.style.display = val ? 'none' : '';
    });
    const headerInner = this.querySelector('el-sidebar-header > div');
    if (headerInner) {
      headerInner.style.justifyContent = val ? 'center' : 'space-between';
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-sidebar-trigger')) customElements.define('el-sidebar-trigger', ElSidebarTrigger);
  if (!customElements.get('el-sidebar-header')) customElements.define('el-sidebar-header', ElSidebarHeader);
  if (!customElements.get('el-sidebar-content')) customElements.define('el-sidebar-content', ElSidebarContent);
  if (!customElements.get('el-sidebar-footer')) customElements.define('el-sidebar-footer', ElSidebarFooter);
  if (!customElements.get('el-sidebar')) customElements.define('el-sidebar', ElSidebar);
}
