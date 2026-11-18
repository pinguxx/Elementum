/**
 * <el-preview-card>
 * Accessible, zero-dependency hover card primitive inspired by Base UI.
 * Delays opening on hover (intent-based) to display rich previews without distracting false-triggers.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElPreviewCard extends Elementum {
  static observedAttributes = ['open', 'delay', 'open-delay', 'close-delay', 'placement'];

  isOpen = signal(false);
  openDelay = signal(400);
  closeDelay = signal(300);
  placement = signal('bottom');

  #openTimer = null;
  #closeTimer = null;

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      color: var(--el-text-primary, #0f172a);
    }

    .trigger-wrapper {
      display: inline-block;
    }

    .card {
      position: absolute;
      z-index: 1050;
      width: max-content;
      max-width: 320px;
      background: var(--el-surface-elevated, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-lg, 12px);
      box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.05);
      padding: 16px;
      box-sizing: border-box;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-4px) scale(0.97);
      transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    :root[data-theme="dark"] .card {
      background: var(--el-surface-card, #111827);
      border-color: #334155;
      color: #f8fafc;
    }

    .card[data-side="bottom"] {
      top: calc(100% + 8px);
      left: 50%;
      transform-origin: top center;
      transform: translateX(-50%) translateY(-4px) scale(0.97);
    }

    .card[data-side="top"] {
      bottom: calc(100% + 8px);
      left: 50%;
      transform-origin: bottom center;
      transform: translateX(-50%) translateY(4px) scale(0.97);
    }

    .card[data-side="right"] {
      left: calc(100% + 10px);
      top: 50%;
      transform-origin: left center;
      transform: translateY(-50%) translateX(-4px) scale(0.97);
    }

    .card[data-side="left"] {
      right: calc(100% + 10px);
      top: 50%;
      transform-origin: right center;
      transform: translateY(-50%) translateX(4px) scale(0.97);
    }

    .card.open,
    .card[data-state="open"] {
      opacity: 1;
      pointer-events: auto;
    }

    .card[data-side="bottom"].open,
    .card[data-side="top"].open {
      transform: translateX(-50%) translateY(0) scale(1);
    }

    .card[data-side="right"].open,
    .card[data-side="left"].open {
      transform: translateY(-50%) translateX(0) scale(1);
    }

    @starting-style {
      .card.open {
        opacity: 0;
      }
    }
  `;

  connected() {
    if (this.hasAttribute('delay')) this.openDelay.value = parseInt(this.getAttribute('delay'), 10) || 400;
    if (this.hasAttribute('open-delay')) this.openDelay.value = parseInt(this.getAttribute('open-delay'), 10) || 400;
    if (this.hasAttribute('close-delay')) this.closeDelay.value = parseInt(this.getAttribute('close-delay'), 10) || 300;
    if (this.hasAttribute('placement')) this.placement.value = this.getAttribute('placement');
    this.isOpen.value = this.hasAttribute('open') && this.getAttribute('open') !== 'false';
    this.setAttribute('data-state', this.isOpen.value ? 'open' : 'closed');

    this.addEventListener('pointerenter', this.#onMouseEnter);
    this.addEventListener('pointerleave', this.#onMouseLeave);
    this.addEventListener('focusin', this.#onFocusIn);
    this.addEventListener('focusout', this.#onFocusOut);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'open') {
      const shouldOpen = newValue !== null && newValue !== 'false';
      if (shouldOpen) this.open();
      else this.close();
    } else if (name === 'delay' || name === 'open-delay') {
      this.openDelay.value = parseInt(newValue, 10) || 400;
    } else if (name === 'close-delay') {
      this.closeDelay.value = parseInt(newValue, 10) || 300;
    } else if (name === 'placement') {
      this.placement.value = newValue || 'bottom';
    }
    return true;
  }

  #onMouseEnter = () => {
    clearTimeout(this.#closeTimer);
    this.#openTimer = setTimeout(() => {
      this.open();
    }, this.openDelay.value);
  };

  #onMouseLeave = () => {
    clearTimeout(this.#openTimer);
    this.#closeTimer = setTimeout(() => {
      this.close();
    }, this.closeDelay.value);
  };

  #onFocusIn = () => {
    clearTimeout(this.#closeTimer);
    this.open();
  };

  #onFocusOut = (e) => {
    if (!this.contains(e.relatedTarget)) {
      this.close();
    }
  };

  open() {
    if (!this.isOpen.value) {
      this.isOpen.value = true;
      this.setAttribute('data-state', 'open');
      this.emit('open');
    }
  }

  close() {
    if (this.isOpen.value) {
      this.isOpen.value = false;
      this.setAttribute('data-state', 'closed');
      this.emit('close');
    }
  }

  render() {
    return html`
      <div class="trigger-wrapper" part="trigger">
        <slot name="trigger"></slot>
      </div>

      <div
        class=${() => `card ${this.isOpen.value ? 'open' : ''}`}
        data-state=${() => (this.isOpen.value ? 'open' : 'closed')}
        data-side=${() => this.placement.value}
        part="card"
        role="tooltip"
        aria-hidden=${() => !this.isOpen.value}
      >
        <slot name="preview"></slot>
        <slot name="content"></slot>
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-preview-card')) {
  customElements.define('el-preview-card', ElPreviewCard);
}
