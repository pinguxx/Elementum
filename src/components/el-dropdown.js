/**
 * <el-dropdown>
 * Accessible overlay container with light-dismiss, trigger slot, and anchor positioning.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';
import { createPresenceBehavior } from '../behaviors/index.js';

export class ElDropdown extends Elementum {
  static observedAttributes = ['open'];

  isOpen = signal(false);
  #presence = null;

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }

    .trigger-wrapper {
      display: inline-block;
      width: 100%;
      cursor: pointer;
    }

    .panel {
      position: absolute;
      top: calc(100% + var(--el-spacing-xs, 4px));
      left: 0;
      z-index: 1000;
      min-width: var(--anchor-width, 240px);
      max-width: calc(100vw - 24px);
      max-height: var(--available-height, 400px);
      overflow-y: auto;
      background: var(--el-surface-base, #ffffff);
      border: 1px solid var(--el-surface-border, #e5e7eb);
      border-radius: var(--el-radius-md, 8px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      padding: var(--el-spacing-sm, 8px);
      box-sizing: border-box;
      opacity: 0;
      transform: translateY(-4px) scale(0.98);
      transform-origin: var(--transform-origin, top left);
      pointer-events: none;
      transition: opacity 150ms ease, transform 150ms ease;
    }

    .panel.open,
    .panel[data-state="open"],
    :host([data-state="open"]) .panel {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    @starting-style {
      .panel[data-state="open"],
      :host([data-state="open"]) .panel {
        opacity: 0;
        transform: translateY(-4px) scale(0.98);
      }
    }
  `;

  connected() {
    if (this.hasAttribute('open') && this.getAttribute('open') !== 'false') {
      this.isOpen.value = true;
    }
    this.setAttribute('data-state', this.isOpen.value ? 'open' : 'closed');
    this.setAttribute('data-side', 'bottom');

    // Light-dismiss: close on click outside or escape key
    const onDocPointerDown = (e) => {
      if (!this.isOpen.value) return;
      // Check if click was inside this component (or shadow root)
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

    this.#presence = createPresenceBehavior(() => this.root?.querySelector('.panel'), {
      initialOpen: this.isOpen.value,
      signal: this.signal,
    });
  }

  rendered() {
    if (this.isOpen.value) {
      this.#updateAnchorMetrics();
    }
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'open') {
      const shouldOpen = newValue !== null && newValue !== 'false';
      if (shouldOpen) this.open();
      else this.close();
    }
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
      this.style.setProperty('--transform-origin', 'top left');
    }
  }

  open() {
    if (!this.isOpen.value) {
      this.#updateAnchorMetrics();
      this.isOpen.value = true;
      this.setAttribute('data-state', 'open');
      this.#presence?.setOpen(true);
      this.emit('open');
    }
  }

  show() {
    this.open();
  }

  close() {
    if (this.isOpen.value) {
      this.isOpen.value = false;
      this.setAttribute('data-state', 'closed');
      this.#presence?.setOpen(false);
      this.emit('close');
    }
  }

  hide() {
    this.close();
  }

  toggle() {
    if (this.isOpen.value) {
      this.close();
    } else {
      this.open();
    }
  }

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
        class=${() => `panel ${this.isOpen.value ? 'open' : ''}`}
        data-state=${() => (this.isOpen.value ? 'open' : 'closed')}
        data-side="bottom"
        part="panel"
        role="region"
        aria-hidden=${() => !this.isOpen.value}
      >
        <slot name="menu"></slot>
        <slot name="content"></slot>
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-dropdown')) {
  customElements.define('el-dropdown', ElDropdown);
}
