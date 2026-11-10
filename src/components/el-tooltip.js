/**
 * <el-tooltip>
 * Accessible lightweight tooltip anchored to wrapped trigger element.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

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
      color: #ffffff;
      background: var(--el-text-base, #1f2937);
      border-radius: var(--el-radius-sm, 4px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s ease;
    }

    .tooltip-bubble.visible {
      opacity: 1;
      visibility: visible;
    }

    /* Placements */
    .tooltip-bubble.top {
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) translateY(4px);
    }
    .tooltip-bubble.top.visible {
      transform: translateX(-50%) translateY(0);
    }

    .tooltip-bubble.bottom {
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) translateY(-4px);
    }
    .tooltip-bubble.bottom.visible {
      transform: translateX(-50%) translateY(0);
    }

    .tooltip-bubble.left {
      right: calc(100% + 8px);
      top: 50%;
      transform: translateY(-50%) translateX(4px);
    }
    .tooltip-bubble.left.visible {
      transform: translateY(-50%) translateX(0);
    }

    .tooltip-bubble.right {
      left: calc(100% + 8px);
      top: 50%;
      transform: translateY(-50%) translateX(-4px);
    }
    .tooltip-bubble.right.visible {
      transform: translateY(-50%) translateX(0);
    }
  `;

  connected() {
    this.addEventListener('mouseenter', this.#onEnter);
    this.addEventListener('mouseleave', this.#onLeave);
    this.addEventListener('focusin', this.#onEnter);
    this.addEventListener('focusout', this.#onLeave);
    window.addEventListener('keydown', this.#onWindowKeyDown, { signal: this.signal });
  }

  show() {
    if (this.disabled.value) return;
    clearTimeout(this.#timeoutId);
    const delayMs = Number(this.delay.value) || 0;
    if (delayMs > 0) {
      this.#timeoutId = setTimeout(() => {
        this.visible.value = true;
      }, delayMs);
    } else {
      this.visible.value = true;
    }
  }

  hide() {
    clearTimeout(this.#timeoutId);
    this.visible.value = false;
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
