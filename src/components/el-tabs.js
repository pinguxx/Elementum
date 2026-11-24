/**
 * <el-tabs> and <el-tab>
 * Accessible tabs component following W3C design patterns with keyboard navigation.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, effect } from '../signal.js';

export class ElTab extends Elementum {
  static observedAttributes = ['label', 'value', 'name', 'disabled'];

  label = signal('');
  value = signal('');
  name = signal('');
  disabled = signal(false);

  static styles = css`
    :host {
      display: none;
    }
    :host([active]) {
      display: block;
    }
  `;

  attributeChanged(name, oldValue, newValue) {
    if (name === 'label') this.label.value = newValue || '';
    else if (name === 'value') this.value.value = newValue || '';
    else if (name === 'name') this.name.value = newValue || '';
    else if (name === 'disabled') this.disabled.value = newValue !== null && newValue !== 'false';
    this.closest('el-tabs')?.rescan?.();
  }

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-tab')) {
  customElements.define('el-tab', ElTab);
}

export class ElTabs extends Elementum {
  static observedAttributes = ['value', 'variant'];

  activeTab = signal('');
  variant = signal('underline'); // 'underline' | 'pill'
  tabs = signal([]); // [{ label, value, disabled, el }]

  static styles = css`
    :host {
      display: block;
      font-family: inherit;
    }

    .tablist {
      position: relative;
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--el-surface-border, #e5e7eb);
      margin-bottom: var(--el-spacing-md, 16px);
    }

    :host([variant='pill']) .tablist {
      display: inline-flex;
      background: var(--el-surface-muted, #f3f4f6);
      border: 1px solid var(--el-surface-border, #e5e7eb);
      border-radius: var(--el-radius-md, 8px);
      padding: 4px;
    }

    .tab-indicator {
      position: absolute;
      left: 0;
      bottom: -1px;
      height: 2px;
      background: var(--el-color-primary-text, #1d4ed8);
      border-radius: 9999px;
      opacity: 0;
      pointer-events: none;
      transition:
        transform 0.28s var(--el-ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)),
        width 0.28s var(--el-ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
    }

    .tablist[data-indicator-ready='true'] .tab-indicator {
      opacity: 1;
    }

    :host([variant='pill']) .tab-indicator {
      top: 4px;
      bottom: 4px;
      height: auto;
      border-radius: calc(var(--el-radius-md, 8px) - 2px);
      background: var(--el-surface-card, #ffffff);
      box-shadow: var(--el-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
    }

    .tab-btn {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      padding: var(--el-spacing-sm, 8px) var(--el-spacing-md, 16px);
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--el-text-secondary, #475569);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      border-radius: calc(var(--el-radius-md, 8px) - 2px);
      cursor: pointer;
      transition: color 0.15s ease, border-color 0.15s ease;
      outline: none;
      user-select: none;
    }

    .tab-btn:hover:not(:disabled) {
      color: var(--el-text-base, #111827);
    }

    .tab-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .tab-btn:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: -2px;
    }

    .tab-btn.active {
      color: var(--el-color-primary-text, #1d4ed8);
      border-bottom-color: var(--el-color-primary-text, #1d4ed8);
      font-weight: 600;
    }

    .tablist[data-indicator-ready='true'] .tab-btn.active,
    :host([variant='pill']) .tab-btn.active {
      border-bottom-color: transparent;
    }

    :host([variant='pill']) .tablist:not([data-indicator-ready='true']) .tab-btn.active {
      background: var(--el-surface-card, #ffffff);
      box-shadow: var(--el-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
    }

    @media (prefers-reduced-motion: reduce) {
      .tab-indicator,
      .tab-btn {
        transition: none;
      }
    }

    .panels {
      display: block;
    }
  `;

  connected() {
    if (this.hasAttribute('value')) {
      this.activeTab.value = this.getAttribute('value');
    }
    this.variant.value = this.getAttribute('variant') || 'underline';
    this.#scanTabs();
    const observer = new MutationObserver(() => this.#scanTabs());
    observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['label', 'value', 'name', 'disabled'],
    });
    const stopEffect = effect(() => {
      void this.activeTab.value;
      void this.tabs.value;
      void this.variant.value;
      this.#scheduleIndicatorSync();
    });
    let ro = null;
    if (typeof ResizeObserver === 'function') {
      ro = new ResizeObserver(() => this.syncIndicator());
      const tablist = this.root?.querySelector('.tablist');
      if (tablist) ro.observe(tablist);
    }
    this.signal.addEventListener('abort', () => {
      observer.disconnect();
      stopEffect();
      ro?.disconnect();
    });
  }

  rescan() {
    this.#scanTabs();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value' && newValue !== oldValue) {
      this.selectTab(newValue);
    } else if (name === 'variant' && newValue !== oldValue) {
      this.variant.value = newValue || 'underline';
    }
  }

  #scheduleIndicatorSync() {
    queueMicrotask(() => this.syncIndicator());
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => this.syncIndicator());
    }
  }

  syncIndicator() {
    const tablist = this.root?.querySelector('.tablist');
    const indicator = this.root?.querySelector('.tab-indicator');
    const activeBtn = this.root?.querySelector('.tab-btn.active');
    if (!tablist || !indicator || !activeBtn || !(activeBtn.offsetWidth > 0)) {
      tablist?.removeAttribute('data-indicator-ready');
      return false;
    }
    indicator.style.width = `${activeBtn.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    tablist.setAttribute('data-indicator-ready', 'true');
    return true;
  }

  #scanTabs() {
    const tabEls = Array.from(this.querySelectorAll('el-tab'));
    const tabData = tabEls.map((el, i) => {
      const val = el.getAttribute('value') || el.getAttribute('name') || `tab-${i}`;
      const lbl =
        el.getAttribute('label') ||
        (el.children.length === 0 ? el.textContent.trim() : '') ||
        val ||
        `Tab ${i + 1}`;
      const disabled = el.hasAttribute('disabled') && el.getAttribute('disabled') !== 'false';
      return { label: lbl, value: val, disabled, el };
    });

    this.tabs.value = tabData;

    if (
      (!this.activeTab.value || !tabData.some((t) => t.value === this.activeTab.value)) &&
      tabData.length > 0
    ) {
      const firstEnabled = tabData.find((t) => !t.disabled) || tabData[0];
      this.selectTab(firstEnabled.value);
    } else {
      this.#syncActivePanel();
    }
  }

  selectTab(val) {
    this.activeTab.value = val;
    this.#syncActivePanel();
    this.emit('tabchange', { value: val });
    this.emit('change', { value: val });
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
    const tabList = this.tabs.value.filter((t) => !t.disabled);
    if (tabList.length === 0) return;
    const currentIndex = Math.max(0, tabList.findIndex((t) => t.value === this.activeTab.value));

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
    const targetVal = tabList[nextIndex].value;
    this.selectTab(targetVal);
    const allIdx = this.tabs.value.findIndex((t) => t.value === targetVal);
    const buttons = this.root.querySelectorAll('.tab-btn');
    buttons[allIdx]?.focus();
  };

  render() {
    return html`
      <div
        class="tablist"
        role="tablist"
        part="tablist"
        @keydown=${this.#onKeyDown}
      >
        <span class="tab-indicator" part="indicator" aria-hidden="true"></span>
        ${() =>
          this.tabs.value.map(
            (tab) => html`
              <button
                type="button"
                role="tab"
                ?disabled=${tab.disabled}
                class=${() => `tab-btn ${this.activeTab.value === tab.value ? 'active' : ''}`}
                aria-selected=${() => (this.activeTab.value === tab.value ? 'true' : 'false')}
                tabindex=${() => (this.activeTab.value === tab.value ? '0' : '-1')}
                @click=${() => {
                  if (!tab.disabled) this.selectTab(tab.value);
                }}
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
