/**
 * <el-popover>
 * Accessible, zero-dependency floating popover primitive inspired by Base UI.
 * Supports anchor positioning, collision boundaries, directional arrow,
 * light-dismiss, and modern @starting-style CSS transitions.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';
import { createPresenceBehavior } from '../behaviors/index.js';

export class ElPopover extends Elementum {
  static observedAttributes = ['open', 'placement', 'offset', 'arrow'];

  isOpen = signal(false);
  placement = signal('bottom');
  offset = signal(8);
  hasArrow = signal(false);
  #presence = null;

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      color: var(--el-text-primary, #0f172a);
    }

    .trigger-wrapper {
      display: inline-block;
      cursor: pointer;
    }

    .popup {
      position: absolute;
      z-index: 1000;
      min-width: var(--anchor-width, 220px);
      max-width: calc(100vw - 32px);
      max-height: var(--available-height, 420px);
      overflow: visible;
      background: var(--el-surface-card, #ffffff);
      color: var(--el-text-primary, #0f172a);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 8px);
      box-shadow: var(--el-shadow-popover, 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1));
      padding: 12px;
      box-sizing: border-box;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-4px) scale(0.97);
      transform-origin: var(--transform-origin, top center);
      transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1), transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Placements */
    .popup[data-side="bottom"] {
      top: calc(100% + var(--popover-offset, 8px));
      left: 50%;
      transform: translateX(-50%) translateY(-4px) scale(0.97);
      transform-origin: top center;
    }

    .popup[data-side="top"] {
      bottom: calc(100% + var(--popover-offset, 8px));
      left: 50%;
      transform: translateX(-50%) translateY(4px) scale(0.97);
      transform-origin: bottom center;
    }

    .popup[data-side="right"] {
      left: calc(100% + var(--popover-offset, 8px));
      top: 50%;
      transform: translateY(-50%) translateX(-4px) scale(0.97);
      transform-origin: left center;
    }

    .popup[data-side="left"] {
      right: calc(100% + var(--popover-offset, 8px));
      top: 50%;
      transform: translateY(-50%) translateX(4px) scale(0.97);
      transform-origin: right center;
    }

    /* Open State */
    .popup.open,
    .popup[data-state="open"] {
      opacity: 1;
      pointer-events: auto;
    }

    .popup[data-side="bottom"].open {
      transform: translateX(-50%) translateY(0) scale(1);
    }

    .popup[data-side="top"].open {
      transform: translateX(-50%) translateY(0) scale(1);
    }

    .popup[data-side="right"].open {
      transform: translateY(-50%) translateX(0) scale(1);
    }

    .popup[data-side="left"].open {
      transform: translateY(-50%) translateX(0) scale(1);
    }

    @starting-style {
      .popup.open {
        opacity: 0;
        transform: translateY(-4px) scale(0.97);
      }
    }

    /* Arrow */
    .arrow {
      position: absolute;
      width: 10px;
      height: 10px;
      background: var(--el-surface-card, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      transform: rotate(45deg);
      pointer-events: none;
    }

    .popup[data-side="bottom"] .arrow {
      top: -6px;
      left: calc(50% - 5px);
      border-bottom: none;
      border-right: none;
    }

    .popup[data-side="top"] .arrow {
      bottom: -6px;
      left: calc(50% - 5px);
      border-top: none;
      border-left: none;
    }

    .popup[data-side="right"] .arrow {
      left: -6px;
      top: calc(50% - 5px);
      border-top: none;
      border-right: none;
    }

    .popup[data-side="left"] .arrow {
      right: -6px;
      top: calc(50% - 5px);
      border-bottom: none;
      border-left: none;
    }
  `;

  connected() {
    this.#syncAttributes();
    this.setAttribute('data-state', this.isOpen.value ? 'open' : 'closed');

    const onDocPointerDown = (e) => {
      if (!this.isOpen.value) return;
      const path = e.composedPath();
      if (!path.includes(this)) {
        this.close();
      }
    };

    const onDocKeyDown = (e) => {
      if (this.isOpen.value && e.key === 'Escape') {
        this.close();
        e.stopPropagation();
      }
    };

    document.addEventListener('pointerdown', onDocPointerDown, { signal: this.signal });
    document.addEventListener('keydown', onDocKeyDown, { signal: this.signal });
  }

  rendered() {
    if (this.isOpen.value) {
      this.#updateAnchorMetrics();
    }
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'open') {
      const open = newValue !== null && newValue !== 'false';
      if (open) this.open();
      else this.close();
    } else if (name === 'placement') {
      this.placement.value = newValue || 'bottom';
    } else if (name === 'offset') {
      const parsed = parseInt(newValue, 10);
      this.offset.value = !Number.isNaN(parsed) ? parsed : 8;
      this.style.setProperty('--popover-offset', `${this.offset.value}px`);
    } else if (name === 'arrow') {
      this.hasArrow.value = newValue !== null && newValue !== 'false';
    }
    return true;
  }

  #syncAttributes() {
    this.isOpen.value = this.hasAttribute('open') && this.getAttribute('open') !== 'false';
    if (this.hasAttribute('placement')) this.placement.value = this.getAttribute('placement');
    if (this.hasAttribute('offset')) {
      const parsed = parseInt(this.getAttribute('offset'), 10);
      this.offset.value = !Number.isNaN(parsed) ? parsed : 8;
    }
    this.style.setProperty('--popover-offset', `${this.offset.value}px`);
    this.hasArrow.value = this.hasAttribute('arrow') && this.getAttribute('arrow') !== 'false';
  }

  #updateAnchorMetrics() {
    if (typeof window === 'undefined') return;
    const trigger = this.root?.querySelector('.trigger-wrapper') || this;
    if (trigger && typeof trigger.getBoundingClientRect === 'function') {
      const rect = trigger.getBoundingClientRect();
      const anchorW = Math.round(rect.width);
      const availH = Math.max(120, Math.round(window.innerHeight - rect.bottom - 16));
      this.style.setProperty('--anchor-width', `${anchorW}px`);
      this.style.setProperty('--available-height', `${availH}px`);
      this.style.setProperty('--popover-offset', `${this.offset.value}px`);
    }
  }

  open() {
    if (!this.isOpen.value) {
      this.#updateAnchorMetrics();
      this.isOpen.value = true;
      this.setAttribute('data-state', 'open');
      if (!this.#presence) {
        this.#presence = createPresenceBehavior(() => this.root?.querySelector('.popup'), {
          initialOpen: false,
          signal: this.signal,
        });
      }
      this.#presence.setOpen(true);
      this.emit('open');
    }
  }

  close() {
    if (this.isOpen.value) {
      this.isOpen.value = false;
      this.setAttribute('data-state', 'closed');
      this.#presence?.setOpen(false);
      this.emit('close');
    }
  }

  toggle() {
    if (this.isOpen.value) this.close();
    else this.open();
  }

  show() { this.open(); }
  hide() { this.close(); }

  render() {
    return html`
      <div
        class="trigger-wrapper"
        part="trigger"
        @click=${() => this.toggle()}
      >
        <slot name="trigger"></slot>
      </div>

      <div
        class=${() => `popup ${this.isOpen.value ? 'open' : ''}`}
        data-state=${() => (this.isOpen.value ? 'open' : 'closed')}
        data-side=${() => this.placement.value}
        part="popup"
        role="dialog"
        aria-hidden=${() => !this.isOpen.value}
      >
        ${() => (this.hasArrow.value ? html`<div class="arrow" part="arrow"></div>` : '')}
        <slot name="content"></slot>
        <slot name="popup"></slot>
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-popover')) {
  customElements.define('el-popover', ElPopover);
}
