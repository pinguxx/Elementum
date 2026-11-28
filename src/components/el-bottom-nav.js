/**
 * <el-bottom-nav> & <el-bottom-nav-item>
 * Composable mobile-first bottom tab navigation bar for PWAs.
 * Features env(safe-area-inset-bottom) padding, aria-current="page" active state,
 * numeric badge pills with 99+ capping, and keyboard arrow navigation.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';
import { triggerHaptic } from '../behaviors/motion.js';

function formatBadge(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  const n = Number(raw);
  if (Number.isFinite(n)) {
    if (n <= 0) return '';
    return n > 99 ? '99+' : String(Math.floor(n));
  }
  return String(raw);
}

function sanitizeHref(raw) {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) return '#';
  return trimmed;
}

export class ElBottomNav extends Elementum {
  static observedAttributes = ['value', 'label', 'fixed'];

  value = signal('');
  label = signal('Primary navigation');
  fixed = signal(false);

  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    :host([fixed]) {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 900;
    }

    nav {
      display: flex;
      align-items: stretch;
      justify-content: space-around;
      gap: var(--el-spacing-xs, 4px);
      background: var(--el-surface-card, #ffffff);
      color: var(--el-text-primary, #0f172a);
      border-top: 1px solid var(--el-surface-border, #e5e7eb);
      padding: 6px var(--el-spacing-sm, 8px) max(6px, env(safe-area-inset-bottom));
      box-sizing: border-box;
      width: 100%;
    }
  `;

  connected() {
    if (this.hasAttribute('value')) this.value.value = this.getAttribute('value') || '';
    if (this.hasAttribute('label')) this.label.value = this.getAttribute('label') || 'Primary navigation';
    this.fixed.value = this.boolAttr('fixed');
    this.addEventListener('bottom-nav-select', this.#onItemSelect, { signal: this.signal });
    this.addEventListener('keydown', this.#onKeyDown, { signal: this.signal });
    this.#syncItems();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value') {
      this.value.value = newValue || '';
      this.#syncItems();
    } else if (name === 'label') {
      this.label.value = newValue || 'Primary navigation';
    } else if (name === 'fixed') {
      this.fixed.value = newValue !== null && newValue !== 'false';
    }
  }

  #getItems() {
    return Array.from(this.querySelectorAll('el-bottom-nav-item'));
  }

  #syncItems() {
    const items = this.#getItems();
    const current = this.value.value;
    for (const item of items) {
      const itemVal = item.getAttribute('value') || item.value?.value || '';
      const isActive = Boolean(current) && itemVal === current;
      if (isActive) {
        item.setAttribute('active', '');
      } else if (current) {
        item.removeAttribute('active');
      }
    }
  }

  #onItemSelect = (e) => {
    e.stopPropagation();
    const next = e.detail?.value ?? '';
    if (next && next !== this.value.value) {
      this.value.value = next;
      this.setAttribute('value', next);
      this.#syncItems();
      this.emit('change', { value: next });
    }
  };

  #onKeyDown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    const items = this.#getItems().filter((el) => !el.hasAttribute('disabled'));
    if (!items.length) return;
    const activeIdx = items.findIndex((el) => el === document.activeElement || el.contains(document.activeElement));
    let nextIdx = activeIdx >= 0 ? activeIdx : 0;
    if (e.key === 'ArrowRight') nextIdx = (nextIdx + 1) % items.length;
    else if (e.key === 'ArrowLeft') nextIdx = (nextIdx - 1 + items.length) % items.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = items.length - 1;
    e.preventDefault();
    items[nextIdx]?.focusItem?.();
  };

  render() {
    return html`
      <nav part="nav" role="navigation" aria-label=${() => this.label.value}>
        <slot @slotchange=${() => this.#syncItems()}></slot>
      </nav>
    `;
  }
}

export class ElBottomNavItem extends Elementum {
  static observedAttributes = ['value', 'label', 'href', 'badge', 'active', 'disabled', 'haptic'];

  value = signal('');
  label = signal('');
  href = signal('');
  badge = signal('');
  active = signal(false);
  disabled = signal(false);

  static styles = css`
    :host {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      justify-content: center;
      font-family: inherit;
    }

    .nav-item {
      position: relative;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      width: 100%;
      min-height: 44px;
      padding: 4px 8px;
      border: none;
      border-radius: var(--el-radius-md, 8px);
      background: transparent;
      color: var(--el-text-secondary, #475569);
      text-decoration: none;
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1.2;
      cursor: pointer;
      user-select: none;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      transition: color 150ms ease, background-color 150ms ease, transform 100ms ease;
    }

    .nav-item[aria-current="page"] {
      color: var(--el-color-primary-text, #1d4ed8);
      font-weight: 600;
    }

    .nav-item:focus-visible {
      box-shadow: 0 0 0 3px var(--el-focus-ring, rgba(37, 99, 235, 0.4));
    }

    .nav-item:not([disabled]):active {
      transform: scale(0.97);
    }

    .nav-item[disabled],
    :host([disabled]) .nav-item {
      opacity: var(--el-disabled-opacity, 0.45);
      cursor: not-allowed;
      pointer-events: none;
    }

    @media (hover: hover) and (pointer: fine) {
      .nav-item:not([disabled]):hover {
        background: var(--el-surface-hover, rgba(0, 0, 0, 0.05));
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .nav-item {
        transition: none;
      }
      .nav-item:not([disabled]):active {
        transform: none;
      }
    }

    .icon-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }

    .badge {
      position: absolute;
      top: -4px;
      right: -10px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 9999px;
      background: var(--el-color-danger, #dc2626);
      color: var(--el-color-danger-contrast, #ffffff);
      font-size: 0.625rem;
      font-weight: 700;
      line-height: 16px;
      text-align: center;
      font-variant-numeric: tabular-nums;
      box-sizing: border-box;
    }

    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
  `;

  connected() {
    if (this.hasAttribute('value')) this.value.value = this.getAttribute('value') || '';
    if (this.hasAttribute('label')) this.label.value = this.getAttribute('label') || '';
    if (this.hasAttribute('href')) this.href.value = this.getAttribute('href') || '';
    if (this.hasAttribute('badge')) this.badge.value = this.getAttribute('badge') || '';
    this.active.value = this.boolAttr('active');
    this.disabled.value = this.boolAttr('disabled');
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'active') this.active.value = newValue !== null && newValue !== 'false';
    else if (name === 'disabled') this.disabled.value = newValue !== null && newValue !== 'false';
    else if (name === 'value') this.value.value = newValue || '';
    else if (name === 'label') this.label.value = newValue || '';
    else if (name === 'href') this.href.value = newValue || '';
    else if (name === 'badge') this.badge.value = newValue || '';
  }

  focusItem() {
    this.root?.querySelector?.('.nav-item')?.focus?.();
  }

  #onActivate = (e) => {
    if (this.disabled.value) {
      e.preventDefault();
      return;
    }
    if (this.boolAttr('haptic')) triggerHaptic();
    this.emit('bottom-nav-select', { value: this.value.value || this.label.value });
  };

  render() {
    const content = () => {
      const badgeText = formatBadge(this.badge.value);
      return html`
        <span class="icon-wrap" part="icon">
          <slot name="icon"></slot>
          ${badgeText ? html`<span class="badge" part="badge">${badgeText}</span>` : ''}
        </span>
        <span class="label" part="label"><slot>${() => this.label.value}</slot></span>
      `;
    };

    return html`${() =>
      this.href.value
        ? html`<a
            class="nav-item"
            part="item"
            href=${sanitizeHref(this.href.value)}
            aria-current=${this.active.value ? 'page' : null}
            aria-disabled=${this.disabled.value ? 'true' : null}
            @click=${this.#onActivate}
          >${content()}</a>`
        : html`<button
            type="button"
            class="nav-item"
            part="item"
            ?disabled=${this.disabled.value}
            aria-current=${this.active.value ? 'page' : null}
            @click=${this.#onActivate}
          >${content()}</button>`}`;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-bottom-nav')) customElements.define('el-bottom-nav', ElBottomNav);
  if (!customElements.get('el-bottom-nav-item')) customElements.define('el-bottom-nav-item', ElBottomNavItem);
}
