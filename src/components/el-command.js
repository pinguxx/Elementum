import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, effect } from '../signal.js';

/**
 * <el-command-item>
 * Individual actionable item within <el-command>.
 */
export class ElCommandItem extends Elementum {
  static observedAttributes = ['value', 'shortcut', 'disabled'];

  value = signal('');
  shortcut = signal('');
  disabled = signal(false);
  active = signal(false);

  connected() {
    this.setAttribute('role', 'option');
    if (!this.id) {
      this.id = `cmd-item-${Math.random().toString(36).slice(2, 8)}`;
    }
    this.setAttribute('aria-selected', 'false');
    this.value.value = this.getAttribute('value') || this.textContent.trim();
    this.shortcut.value = this.getAttribute('shortcut') || '';
    this.disabled.value = this.hasAttribute('disabled');
    if (this.disabled.value) {
      this.setAttribute('aria-disabled', 'true');
    }
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value') {
      this.value.value = newValue || this.textContent.trim();
    } else if (name === 'shortcut') {
      this.shortcut.value = newValue || '';
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
      if (this.disabled.value) {
        this.setAttribute('aria-disabled', 'true');
      } else {
        this.removeAttribute('aria-disabled');
      }
    }
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: var(--el-radius-md, 8px);
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--el-text-primary, #0f172a);
      transition: background-color 0.1s ease, color 0.1s ease;
      user-select: none;
      box-sizing: border-box;
    }

    :host(:hover),
    :host([data-active="true"]) {
      background-color: var(--el-surface-muted, #f1f5f9);
      color: var(--el-color-primary, #2563eb);
    }

    :host([disabled]) {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .item-content {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .shortcut {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-family: var(--el-font-mono, monospace);
      color: var(--el-text-muted, #64748b);
      background: var(--el-surface-muted, #e2e8f0);
      padding: 2px 6px;
      border-radius: 4px;
    }
  `;

  render() {
    return html`
      <div class="item-content" part="content">
        <slot></slot>
      </div>
      ${() => this.shortcut.value ? html`<span class="shortcut" part="shortcut">${this.shortcut.value}</span>` : null}
    `;
  }
}

/**
 * <el-command-group>
 * Category section within <el-command>.
 */
export class ElCommandGroup extends Elementum {
  static observedAttributes = ['heading'];
  static #count = 0;

  heading = signal('');
  #headingId = '';

  connected() {
    this.setAttribute('role', 'group');
    this.heading.value = this.getAttribute('heading') || '';
    this.#headingId = `cmd-grp-${++ElCommandGroup.#count}`;
    this.setAttribute('aria-labelledby', this.#headingId);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'heading') {
      this.heading.value = newValue || '';
    }
  }

  static styles = css`
    :host {
      display: block;
      margin-bottom: 12px;
    }

    .heading {
      padding: 6px 12px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--el-text-muted, #64748b);
    }
  `;

  render() {
    return html`
      ${() => this.heading.value ? html`<div class="heading" id=${this.#headingId} part="heading">${this.heading.value}</div>` : null}
      <div class="items" part="items">
        <slot></slot>
      </div>
    `;
  }
}

/**
 * <el-command>
 * Accessible command palette dialog (⌘K / cmdk style).
 *
 * @attr {string} placeholder - Search placeholder
 * @fires select - Dispatched when an item is selected with { value, item }
 */
export class ElCommand extends Elementum {
  static observedAttributes = ['placeholder', 'open', 'inline', 'disabled'];

  placeholder = signal('Type a command or search...');
  isOpen = signal(false);
  inline = signal(false);
  disabled = signal(false);
  query = signal('');
  activeIndex = signal(0);
  #emptyVisible = signal(false);
  #previouslyFocused = null;

  get open() {
    return this.isOpen;
  }

  set open(v) {
    this.isOpen.value = Boolean(v);
  }

  connected() {
    if (this.hasAttribute('placeholder')) this.placeholder.value = this.getAttribute('placeholder');
    if (this.hasAttribute('open') && this.getAttribute('open') !== 'false') this.isOpen.value = true;
    if (this.hasAttribute('inline') && this.getAttribute('inline') !== 'false') this.inline.value = true;
    if (this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false') this.disabled.value = true;

    // Global keyboard shortcut: Cmd+K / Ctrl+K
    const onGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      }
    };
    window.addEventListener('keydown', onGlobalKey, { signal: this.signal });
    this.addEventListener('keydown', this.#onKeyDown, { signal: this.signal });
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'open') {
      const shouldOpen = newValue !== null && newValue !== 'false';
      if (shouldOpen) this.show();
      else this.close();
    } else if (name === 'placeholder') {
      this.placeholder.value = newValue || 'Type a command or search...';
    } else if (name === 'inline') {
      this.inline.value = newValue !== null && newValue !== 'false';
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
    }
  }

  static styles = css`
    :host {
      display: contents;
    }

    :host([inline]) {
      display: block;
      width: 100%;
    }

    .command-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: none;
      align-items: flex-start;
      justify-content: center;
      padding: 15vh 16px 16px;
      box-sizing: border-box;
      animation: fadeIn 0.15s ease-out;
    }

    :host([inline]) .command-backdrop {
      position: relative;
      inset: auto;
      background: transparent;
      backdrop-filter: none;
      z-index: 1;
      display: flex;
      padding: 0;
      animation: none;
    }

    :host([disabled]) .command-dialog {
      opacity: 0.6;
      pointer-events: none;
    }

    @media (max-width: 640px) {
      .command-backdrop {
        padding: 32px 12px 12px;
      }
      .command-dialog {
        max-width: 100%;
      }
    }

    .command-backdrop.open {
      display: flex;
    }

    .command-dialog {
      width: 100%;
      max-width: 620px;
      background: var(--el-surface-card, #ffffff);
      border: 1px solid var(--el-border-translucent, rgba(15, 23, 42, 0.08));
      border-radius: var(--el-radius-lg, 12px);
      box-shadow: var(--el-shadow-popover, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .search-bar {
      display: flex;
      align-items: center;
      padding: 0 16px;
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
      min-height: 52px;
      gap: 12px;
    }

    .search-icon {
      font-size: 1.125rem;
      color: var(--el-text-muted, #64748b);
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-family: inherit;
      font-size: 1rem;
      color: var(--el-text-primary, #0f172a);
    }

    .command-list {
      max-height: 340px;
      overflow-y: auto;
      padding: 8px;
      box-sizing: border-box;
    }

    .empty-state {
      padding: 24px;
      text-align: center;
      font-size: 0.875rem;
      color: var(--el-text-muted, #64748b);
    }

    .command-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: var(--el-surface-muted, #f8fafc);
      border-top: 1px solid var(--el-surface-border, #e2e8f0);
      font-size: 0.75rem;
      color: var(--el-text-muted, #64748b);
    }

    .footer-keys {
      display: inline-flex;
      gap: 8px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from { transform: scale(0.96) translateY(-8px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
  `;

  show() {
    this.#previouslyFocused = typeof document !== 'undefined' ? document.activeElement : null;
    this.isOpen.value = true;
    this.query.value = '';
    this.activeIndex.value = 0;
    this.#emptyVisible.value = false;
    setTimeout(() => {
      this.root?.querySelector('.search-input')?.focus();
      this.#filterItems('');
    }, 50);
  }

  close() {
    this.isOpen.value = false;
    if (this.#previouslyFocused && typeof this.#previouslyFocused.focus === 'function') {
      this.#previouslyFocused.focus();
    }
  }

  toggle() {
    if (this.isOpen.value) this.close();
    else this.show();
  }

  #onSearchInput = (e) => {
    const q = e.target.value;
    this.query.value = q;
    this.activeIndex.value = 0;
    this.#filterItems(q);
  };

  #filterItems(query) {
    const q = query.trim().toLowerCase();
    const items = Array.from(this.querySelectorAll('el-command-item'));
    const groups = Array.from(this.querySelectorAll('el-command-group'));

    let visibleCount = 0;
    items.forEach((item) => {
      const text = item.textContent.trim().toLowerCase();
      const val = (item.getAttribute('value') || '').toLowerCase();
      const match = text.includes(q) || val.includes(q);
      item.style.display = match ? 'flex' : 'none';
      if (match) visibleCount++;
    });

    // Hide groups if no children visible
    groups.forEach((group) => {
      const visibleChildren = group.querySelectorAll('el-command-item:not([style*="display: none"])');
      group.style.display = visibleChildren.length > 0 ? 'block' : 'none';
    });

    this.#emptyVisible.value = visibleCount === 0;
    this.#updateActiveHighlight();
  }

  #getVisibleItems() {
    return Array.from(this.querySelectorAll('el-command-item')).filter(
      (it) => it.style.display !== 'none' && !it.hasAttribute('disabled')
    );
  }

  #updateActiveHighlight() {
    const visible = this.#getVisibleItems();
    const input = this.root?.querySelector('.search-input');
    visible.forEach((it, idx) => {
      if (idx === this.activeIndex.value) {
        it.setAttribute('data-active', 'true');
        it.setAttribute('aria-selected', 'true');
        it.active.value = true;
        if (!it.id) {
          it.id = `cmd-item-${idx}-${Math.random().toString(36).slice(2, 6)}`;
        }
        input?.setAttribute('aria-activedescendant', it.id);
        if (typeof it.scrollIntoView === 'function') {
          it.scrollIntoView({ block: 'nearest' });
        }
      } else {
        it.removeAttribute('data-active');
        it.setAttribute('aria-selected', 'false');
        it.active.value = false;
      }
    });

    if (visible.length === 0) {
      input?.removeAttribute('aria-activedescendant');
    }
  }

  #onKeyDown = (e) => {
    if (!this.isOpen.value && !this.inline.value) return;
    const visible = this.#getVisibleItems();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (visible.length > 0) {
          this.activeIndex.value = (this.activeIndex.value + 1) % visible.length;
          this.#updateActiveHighlight();
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (visible.length > 0) {
          this.activeIndex.value = (this.activeIndex.value - 1 + visible.length) % visible.length;
          this.#updateActiveHighlight();
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (visible.length > 0 && visible[this.activeIndex.value]) {
          this.#selectItem(visible[this.activeIndex.value]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.close();
        break;

      case 'Tab':
        // Trap focus inside modal
        e.preventDefault();
        break;
    }
  };

  #selectItem(item) {
    const val = item.getAttribute('value') || item.textContent.trim();
    this.close();
    this.emit('select', { value: val, item });
  }

  render() {
    return html`
      <div
        class=${() => `command-backdrop ${this.isOpen.value ? 'open' : ''}`}
        part="backdrop"
        @click=${(e) => { if (e.target === e.currentTarget) this.close(); }}
      >
        <div
          class="command-dialog"
          part="dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Command Menu"
        >
          <div class="search-bar" part="search-bar">
            <span class="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              class="search-input"
              part="input"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded=${() => String(this.isOpen.value)}
              aria-controls="cmd-listbox"
              aria-haspopup="listbox"
              placeholder=${this.placeholder}
              .value=${this.query}
              @input=${this.#onSearchInput}
            />
          </div>

          <div
            id="cmd-listbox"
            class="command-list"
            part="list"
            role="listbox"
            aria-label="Commands"
            @click=${(e) => {
              const item = e.target.closest('el-command-item');
              if (item && !item.hasAttribute('disabled')) {
                this.#selectItem(item);
              }
            }}
          >
            <slot></slot>
            <div
              class="empty-state"
              part="empty"
              role="status"
              aria-live="polite"
              style=${() => this.#emptyVisible.value ? 'display: block;' : 'display: none;'}
            >
              No commands or actions found.
            </div>
          </div>

          <div class="command-footer" part="footer">
            <span>Navigation</span>
            <div class="footer-keys">
              <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
              <span><kbd>↵</kbd> select</span>
              <span><kbd>esc</kbd> close</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-command-item')) customElements.define('el-command-item', ElCommandItem);
  if (!customElements.get('el-command-group')) customElements.define('el-command-group', ElCommandGroup);
  if (!customElements.get('el-command')) customElements.define('el-command', ElCommand);
}
