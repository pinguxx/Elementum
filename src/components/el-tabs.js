/**
 * <el-tabs> and <el-tab>
 * Accessible tabs component following W3C design patterns with keyboard navigation.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElTab extends Elementum {
  static observedAttributes = ['label', 'value'];

  label = signal('');
  value = signal('');

  static styles = css`
    :host {
      display: none;
    }
    :host([active]) {
      display: block;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-tab')) {
  customElements.define('el-tab', ElTab);
}

export class ElTabs extends Elementum {
  static observedAttributes = ['value'];

  activeTab = signal('');
  tabs = signal([]); // [{ label, value, el }]

  static styles = css`
    :host {
      display: block;
      font-family: inherit;
    }

    .tablist {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--el-surface-border, #e5e7eb);
      margin-bottom: var(--el-spacing-md, 16px);
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      padding: var(--el-spacing-sm, 8px) var(--el-spacing-md, 16px);
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--el-text-muted, #6b7280);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: color 0.15s ease, border-color 0.15s ease;
      outline: none;
      user-select: none;
    }

    .tab-btn:hover {
      color: var(--el-text-base, #111827);
    }

    .tab-btn:focus-visible {
      background: var(--el-surface-muted, #f3f4f6);
    }

    .tab-btn.active {
      color: var(--el-color-primary, #2563eb);
      border-bottom-color: var(--el-color-primary, #2563eb);
      font-weight: 600;
    }

    .panels {
      display: block;
    }
  `;

  connected() {
    this.#scanTabs();
    const observer = new MutationObserver(() => this.#scanTabs());
    observer.observe(this, { childList: true });
    this.signal.addEventListener('abort', () => observer.disconnect());
  }

  #scanTabs() {
    const tabEls = Array.from(this.querySelectorAll('el-tab'));
    const tabData = tabEls.map((el, i) => {
      const val = el.getAttribute('value') || `tab-${i}`;
      const lbl = el.getAttribute('label') || `Tab ${i + 1}`;
      return { label: lbl, value: val, el };
    });

    this.tabs.value = tabData;

    if (!this.activeTab.value && tabData.length > 0) {
      this.selectTab(tabData[0].value);
    } else {
      this.#syncActivePanel();
    }
  }

  selectTab(val) {
    this.activeTab.value = val;
    this.#syncActivePanel();
    this.emit('tabchange', { value: val });
  }

  #syncActivePanel() {
    for (const item of this.tabs.value) {
      if (item.value === this.activeTab.value) {
        item.el.setAttribute('active', '');
      } else {
        item.el.removeAttribute('active');
      }
    }
  }

  #onKeyDown = (e) => {
    const tabList = this.tabs.value;
    if (tabList.length === 0) return;
    const currentIndex = tabList.findIndex((t) => t.value === this.activeTab.value);

    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabList.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabList.length) % tabList.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabList.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    this.selectTab(tabList[nextIndex].value);
    // Focus the button
    const buttons = this.root.querySelectorAll('.tab-btn');
    buttons[nextIndex]?.focus();
  };

  render() {
    return html`
      <div
        class="tablist"
        role="tablist"
        part="tablist"
        @keydown=${this.#onKeyDown}
      >
        ${() =>
          this.tabs.value.map(
            (tab) => html`
              <button
                type="button"
                role="tab"
                class=${() => `tab-btn ${this.activeTab.value === tab.value ? 'active' : ''}`}
                aria-selected=${() => (this.activeTab.value === tab.value ? 'true' : 'false')}
                tabindex=${() => (this.activeTab.value === tab.value ? '0' : '-1')}
                @click=${() => this.selectTab(tab.value)}
              >
                ${tab.label}
              </button>
            `
          )}
      </div>

      <div class="panels" part="panels">
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-tabs')) {
  customElements.define('el-tabs', ElTabs);
}
