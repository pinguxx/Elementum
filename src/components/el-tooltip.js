/**
 * <el-tooltip>
 * Accessible lightweight tooltip anchored to wrapped trigger element.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

let lastTooltipClosedAt = 0;

export class ElTooltip extends Elementum {
  static observedAttributes = ['content', 'placement', 'delay', 'disabled'];

  content = signal('');
  placement = signal('top'); // 'top' | 'bottom' | 'left' | 'right'
  delay = signal(150);
  disabled = signal(false);
  visible = signal(false);

  #timeoutId = null;

  static styles = css`
    :host {
      position: relative;
      display: inline-block;
    }

    .tooltip-bubble {
      position: absolute;
      z-index: 1000;
      padding: 6px 10px;
      font-size: 0.8125rem;
      line-height: 1.25;
      font-weight: 500;
      color: var(--el-tooltip-text, #ffffff) !important;
      background: var(--el-tooltip-bg, #0f172a) !important;
      border: 1px solid var(--el-tooltip-border, rgba(255, 255, 255, 0.15));
      border-radius: var(--el-radius-sm, 6px);
      box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.4);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s ease;
    }

    .tooltip-bubble ::slotted(*),
    .tooltip-bubble slot {
      color: var(--el-tooltip-text, #ffffff) !important;
    }

    .tooltip-bubble.visible {
      opacity: 1;
      visibility: visible;
    }

    /* Placements (origin-aware toward trigger edge) */
    .tooltip-bubble.top {
      bottom: calc(100% + 8px);
      left: 50%;
      transform-origin: bottom center;
      transform: translateX(-50%) translateY(4px) scale(0.96);
    }
    .tooltip-bubble.top.visible {
      transform: translateX(-50%) translateY(0) scale(1);
    }

    .tooltip-bubble.bottom {
      top: calc(100% + 8px);
      left: 50%;
      transform-origin: top center;
      transform: translateX(-50%) translateY(-4px) scale(0.96);
    }
    .tooltip-bubble.bottom.visible {
      transform: translateX(-50%) translateY(0) scale(1);
    }

    .tooltip-bubble.left {
      right: calc(100% + 8px);
      top: 50%;
      transform-origin: right center;
      transform: translateY(-50%) translateX(4px) scale(0.96);
    }
    .tooltip-bubble.left.visible {
      transform: translateY(-50%) translateX(0) scale(1);
    }

    .tooltip-bubble.right {
      left: calc(100% + 8px);
      top: 50%;
      transform-origin: left center;
      transform: translateY(-50%) translateX(-4px) scale(0.96);
    }
    .tooltip-bubble.right.visible {
      transform: translateY(-50%) translateX(0) scale(1);
    }

    @media (prefers-reduced-motion: reduce) {
      .tooltip-bubble {
        transition: none;
      }
    }
  `;

  connected() {
    this.setAttribute('data-state', this.visible.value ? 'open' : 'closed');
    this.setAttribute('data-side', this.placement.value);
    this.addEventListener('mouseenter', this.#onEnter);
    this.addEventListener('mouseleave', this.#onLeave);
    this.addEventListener('focusin', this.#onEnter);
    this.addEventListener('focusout', this.#onLeave);
    window.addEventListener('keydown', this.#onWindowKeyDown, { signal: this.signal });
  }

  show() {
    if (this.disabled.value) return;
    clearTimeout(this.#timeoutId);
    const recentGroupSwitch = Date.now() - lastTooltipClosedAt < 350;
    const delayMs = recentGroupSwitch ? 0 : (Number(this.delay.value) || 0);
    const doShow = () => {
      this.visible.value = true;
      this.setAttribute('data-state', 'open');
      this.setAttribute('data-side', this.placement.value);
    };
    if (delayMs > 0) {
      this.#timeoutId = setTimeout(doShow, delayMs);
    } else {
      doShow();
    }
  }

  hide() {
    clearTimeout(this.#timeoutId);
    if (this.visible.value) {
      lastTooltipClosedAt = Date.now();
    }
    this.visible.value = false;
    this.setAttribute('data-state', 'closed');
  }

  #onEnter = () => {
    this.show();
  };

  #onLeave = () => {
    this.hide();
  };

  #onWindowKeyDown = (e) => {
    if (e.key === 'Escape' && this.visible.value) {
      this.hide();
    }
  };

  render() {
    return html`
      <slot></slot>
      <div
        role="tooltip"
        part="bubble"
        class=${() => `tooltip-bubble ${this.placement.value} ${this.visible.value ? 'visible' : ''}`}
      >
        <slot name="content">${this.content}</slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-tooltip')) {
  customElements.define('el-tooltip', ElTooltip);
}
