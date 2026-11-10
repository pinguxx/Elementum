/**
 * <el-dropdown>
 * Accessible overlay container with light-dismiss, trigger slot, and anchor positioning.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElDropdown extends Elementum {
  static observedAttributes = ['open'];

  isOpen = signal(false);

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
      min-width: 280px;
      background: var(--el-surface-base, #ffffff);
      border: 1px solid var(--el-surface-border, #e5e7eb);
      border-radius: var(--el-radius-md, 8px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      padding: var(--el-spacing-sm, 8px);
      box-sizing: border-box;
      opacity: 0;
      transform: translateY(-4px);
      pointer-events: none;
      transition: opacity 0.15s ease, transform 0.15s ease;
    }

    .panel.open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
  `;

  connected() {
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
  }

  open() {
    if (!this.isOpen.value) {
      this.isOpen.value = true;
      this.emit('open');
    }
  }

  close() {
    if (this.isOpen.value) {
      this.isOpen.value = false;
      this.emit('close');
    }
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
        part="panel"
        role="region"
        aria-hidden=${() => !this.isOpen.value}
      >
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-dropdown')) {
  customElements.define('el-dropdown', ElDropdown);
}
