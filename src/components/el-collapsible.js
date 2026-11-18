/**
 * <el-collapsible>
 * Accessible, zero-dependency collapsible disclosure primitive inspired by Base UI.
 * Provides smooth animated height expansion via modern CSS grid transition,
 * keyboard accessibility, and state attributes.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElCollapsible extends Elementum {
  static observedAttributes = ['open', 'disabled'];

  isOpen = signal(false);
  disabled = signal(false);

  static styles = css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      color: var(--el-text-primary, #0f172a);
    }

    .trigger-container {
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }

    :host([disabled]) .trigger-container {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .content-wrapper {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .content-wrapper.open {
      grid-template-rows: 1fr;
    }

    .content-inner {
      overflow: hidden;
      min-height: 0;
    }
  `;

  connected() {
    this.isOpen.value = this.hasAttribute('open');
    this.disabled.value = this.hasAttribute('disabled');
    this.setAttribute('data-state', this.isOpen.value ? 'open' : 'closed');
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'open') {
      const open = newValue !== null && newValue !== 'false';
      if (open !== this.isOpen.value) {
        if (open) this.open();
        else this.close();
      }
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
    }
    return true;
  }

  open() {
    if (this.disabled.value) return;
    if (!this.isOpen.value) {
      this.isOpen.value = true;
      this.setAttribute('data-state', 'open');
      this.emit('open');
    }
  }

  close() {
    if (this.disabled.value) return;
    if (this.isOpen.value) {
      this.isOpen.value = false;
      this.setAttribute('data-state', 'closed');
      this.emit('close');
    }
  }

  toggle() {
    if (this.isOpen.value) this.close();
    else this.open();
  }

  render() {
    return html`
      <div
        class="trigger-container"
        part="trigger"
        @click=${() => this.toggle()}
        aria-expanded=${() => (this.isOpen.value ? 'true' : 'false')}
        aria-disabled=${() => (this.disabled.value ? 'true' : 'false')}
      >
        <slot name="trigger"></slot>
      </div>

      <div
        class=${() => `content-wrapper ${this.isOpen.value ? 'open' : ''}`}
        data-state=${() => (this.isOpen.value ? 'open' : 'closed')}
        part="content"
        role="region"
      >
        <div class="content-inner">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-collapsible')) {
  customElements.define('el-collapsible', ElCollapsible);
}
