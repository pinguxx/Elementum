/**
 * <el-tree-view> & <el-tree-item>
 * Accessible multi-level hierarchical tree explorer inspired by shadcn/ui.
 * Supports keyboard navigation (ArrowUp, ArrowDown, ArrowRight, ArrowLeft),
 * selection, auto-collapse/expand, custom icons, and folder/leaf roles.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElTreeItem extends Elementum {
  static observedAttributes = ['label', 'expanded', 'selected', 'disabled'];

  label = signal('');
  expanded = signal(false);
  selected = signal(false);
  disabled = signal(false);
  hasChildren = signal(false);

  static styles = css`
    :host {
      display: block;
      user-select: none;
      -webkit-user-select: none;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
    }

    .item-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border-radius: var(--el-radius-sm, 6px);
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--el-text-primary, #0f172a);
      transition: background-color 0.12s ease;
      outline: none;
    }

    .item-row:focus-visible {
      box-shadow: inset 0 0 0 2px var(--el-color-primary, #2563eb);
    }

    .item-row:hover {
      background: var(--el-surface-muted, #f1f5f9);
    }

    :host-context([data-theme="dark"]) .item-row {
      color: #f8fafc;
    }

    :host-context([data-theme="dark"]) .item-row:hover {
      background: #1e293b;
    }

    :host([selected]) .item-row {
      background: var(--el-surface-border, #e2e8f0);
      font-weight: 600;
      color: var(--el-color-primary-text, #1d4ed8);
    }

    .chevron {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
      color: var(--el-text-muted, #94a3b8);
      flex-shrink: 0;
    }

    .chevron.hidden {
      visibility: hidden;
    }

    .chevron.open {
      transform: rotate(90deg);
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--el-text-secondary, #64748b);
    }

    .label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sub-tree {
      display: none;
      padding-left: 20px;
      position: relative;
    }

    .sub-tree::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 8px;
      left: 14px;
      width: 1px;
      background: var(--el-surface-border, #e2e8f0);
    }

    :host-context([data-theme="dark"]) .sub-tree::before {
      background: #334155;
    }

    :host([expanded]) .sub-tree {
      display: block;
    }
  `;

  connected() {
    this.#syncAttrs();
    this.#checkChildren();

    const observer = new MutationObserver(() => this.#checkChildren());
    observer.observe(this, { childList: true });
    this._observer = observer;
  }

  disconnected() {
    this._observer?.disconnect();
  }

  attributeChanged(name, oldValue, newValue) {
    this.#syncAttrs();
    return true;
  }

  #syncAttrs() {
    this.label.value = this.getAttribute('label') || '';
    this.expanded.value = this.hasAttribute('expanded');
    this.selected.value = this.hasAttribute('selected');
    this.disabled.value = this.hasAttribute('disabled');
  }

  #checkChildren() {
    const childItems = this.querySelectorAll('el-tree-item');
    this.hasChildren.value = childItems.length > 0;
  }

  #getVisibleTreeItems() {
    const tree = this.closest('el-tree-view');
    if (!tree) return [this];
    const all = Array.from(tree.querySelectorAll('el-tree-item'));
    return all.filter((item) => {
      let ancestor = item.parentElement?.closest('el-tree-item');
      while (ancestor) {
        if (!ancestor.hasAttribute('expanded')) return false;
        ancestor = ancestor.parentElement?.closest('el-tree-item');
      }
      return true;
    });
  }

  #focusRow(targetItem) {
    targetItem?.shadowRoot?.querySelector('.item-row')?.focus();
  }

  #onKeyDown = (e) => {
    if (this.disabled.value) return;
    const key = e.key;
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End', 'Enter', ' '].includes(key)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const visible = this.#getVisibleTreeItems();
    const idx = visible.indexOf(this);

    if (key === 'ArrowDown') {
      if (idx >= 0 && idx < visible.length - 1) this.#focusRow(visible[idx + 1]);
    } else if (key === 'ArrowUp') {
      if (idx > 0) this.#focusRow(visible[idx - 1]);
    } else if (key === 'Home') {
      this.#focusRow(visible[0]);
    } else if (key === 'End') {
      this.#focusRow(visible[visible.length - 1]);
    } else if (key === 'ArrowRight') {
      if (this.hasChildren.value && !this.expanded.value) {
        this.expanded.value = true;
        this.setAttribute('expanded', '');
        this.emit('expand', { item: this });
      } else if (this.hasChildren.value && this.expanded.value) {
        const firstChild = this.querySelector(':scope > el-tree-item');
        if (firstChild) this.#focusRow(firstChild);
      }
    } else if (key === 'ArrowLeft') {
      if (this.hasChildren.value && this.expanded.value) {
        this.expanded.value = false;
        this.removeAttribute('expanded');
        this.emit('collapse', { item: this });
      } else {
        const parentItem = this.parentElement?.closest('el-tree-item');
        if (parentItem) this.#focusRow(parentItem);
      }
    } else if (key === 'Enter' || key === ' ') {
      this.toggle(e);
    }
  };

  toggle = (e) => {
    e?.stopPropagation();
    if (this.disabled.value) return;

    if (this.hasChildren.value) {
      if (this.expanded.value) {
        this.expanded.value = false;
        this.removeAttribute('expanded');
        this.emit('collapse', { item: this });
      } else {
        this.expanded.value = true;
        this.setAttribute('expanded', '');
        this.emit('expand', { item: this });
      }
    }

    this.select();
  };

  select() {
    const tree = this.closest('el-tree-view');
    if (tree) {
      tree.querySelectorAll('el-tree-item').forEach(it => {
        if (it !== this) {
          it.selected.value = false;
          it.removeAttribute('selected');
        }
      });
    }

    this.selected.value = true;
    this.setAttribute('selected', '');
    this.emit('select', { item: this, label: this.label.value });
  }

  render() {
    return html`
      <div
        class="item-row"
        part="item"
        role="treeitem"
        aria-expanded=${() => (this.hasChildren.value ? String(this.expanded.value) : false)}
        aria-selected=${() => String(this.selected.value)}
        tabindex="0"
        onclick=${this.toggle}
        onkeydown=${this.#onKeyDown}
      >
        <span class=${() => `chevron ${!this.hasChildren.value ? 'hidden' : ''} ${this.expanded.value ? 'open' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
        </span>
        <span class="icon" part="icon">
          <slot name="icon">
            ${() =>
              this.hasChildren.value
                ? html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`
                : html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`
            }
          </slot>
        </span>
        <span class="label" part="label">${() => this.label.value || html`<slot name="label"></slot>`}</span>
      </div>
      <div class="sub-tree" part="subtree" role="group">
        <slot></slot>
      </div>
    `;
  }
}

export class ElTreeView extends Elementum {
  static observedAttributes = ['max-width'];

  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }
  `;

  connected() {
    this.setAttribute('role', 'tree');
    this.#applyMaxWidth();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'max-width') {
      this.#applyMaxWidth();
    }
    return true;
  }

  #applyMaxWidth() {
    if (this.hasAttribute('max-width')) {
      const mw = this.getAttribute('max-width');
      this.style.maxWidth = mw ? (isNaN(mw) ? mw : `${mw}px`) : '';
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-tree-item')) customElements.define('el-tree-item', ElTreeItem);
  if (!customElements.get('el-tree-view')) customElements.define('el-tree-view', ElTreeView);
}
