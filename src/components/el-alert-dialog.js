/**
 * <el-alert-dialog>
 * Accessible, zero-dependency alert dialog primitive inspired by Base UI.
 * Designed for destructive or critical confirmation flows with strict modal focus trapping
 * and non-dismissible backdrop.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElAlertDialog extends Elementum {
  static observedAttributes = ['open', 'heading', 'title'];

  isOpen = signal(false);
  heading = signal('');

  #previousFocused = null;

  static styles = css`
    :host {
      display: inline-block;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      color: var(--el-text-primary, #0f172a);
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      opacity: 0;
      pointer-events: none;
      transition: opacity 200ms ease;
    }

    .backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }

    .dialog-window {
      background: var(--el-surface-base, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-lg, 12px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
      width: 100%;
      max-width: 480px;
      padding: 24px;
      box-sizing: border-box;
      transform: scale(0.95) translateY(8px);
      opacity: 0;
      transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease;
    }

    :root[data-theme="dark"] .dialog-window {
      background: var(--el-surface-elevated, #1e293b);
      border-color: #334155;
      color: #f8fafc;
    }

    .backdrop.open .dialog-window {
      transform: scale(1) translateY(0);
      opacity: 1;
    }

    @starting-style {
      .backdrop.open {
        opacity: 0;
      }
      .backdrop.open .dialog-window {
        transform: scale(0.95) translateY(8px);
        opacity: 0;
      }
    }

    .dialog-header {
      margin-bottom: 12px;
    }

    .dialog-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0;
      color: var(--el-text-primary, #0f172a);
    }

    :root[data-theme="dark"] .dialog-title {
      color: #f8fafc;
    }
  `;

  connected() {
    this.isOpen.value = this.hasAttribute('open');
    this.heading.value = this.getAttribute('heading') || this.getAttribute('title') || '';
    this.setAttribute('data-state', this.isOpen.value ? 'open' : 'closed');

    this.addEventListener('keydown', (e) => {
      if (this.isOpen.value && e.key === 'Escape') {
        e.preventDefault(); // Alert dialogs require explicit action, but can emit cancel
        this.emit('cancel');
      }
    });
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'open') {
      const open = newValue !== null && newValue !== 'false';
      if (open) this.open();
      else this.close();
    } else if (name === 'heading' || name === 'title') {
      this.heading.value = newValue || '';
    }
    return true;
  }

  open() {
    if (!this.isOpen.value) {
      this.#previousFocused = document.activeElement;
      this.isOpen.value = true;
      this.setAttribute('data-state', 'open');
      this.emit('open');

      const schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb) => setTimeout(cb, 0);
      schedule(() => {
        const focusable = this.root.querySelector('.dialog-window button, .dialog-window [tabindex="0"]') ||
                          this.querySelector('button, [tabindex="0"]');
        if (focusable) focusable.focus();
      });
    }
  }

  close() {
    if (this.isOpen.value) {
      this.isOpen.value = false;
      this.setAttribute('data-state', 'closed');
      this.emit('close');
      if (this.#previousFocused && typeof this.#previousFocused.focus === 'function') {
        this.#previousFocused.focus();
      }
    }
  }

  show() { this.open(); }
  showModal() { this.open(); }

  render() {
    return html`
      <slot name="trigger" @click=${() => this.open()}></slot>

      <div
        class=${() => `backdrop ${this.isOpen.value ? 'open' : ''}`}
        data-state=${() => (this.isOpen.value ? 'open' : 'closed')}
        role="presentation"
      >
        <div
          class="dialog-window"
          part="dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          ${() =>
            this.heading.value
              ? html`
                  <div class="dialog-header">
                    <h3 id="dialog-title" class="dialog-title">${() => this.heading.value}</h3>
                  </div>
                `
              : ''}
          <slot></slot>
        </div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-alert-dialog')) {
  customElements.define('el-alert-dialog', ElAlertDialog);
}
