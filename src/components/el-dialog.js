/**
 * <el-dialog>
 * Accessible modal dialog powered by the native <dialog> element.
 * Follows modern web guidance with overscroll containment and top-layer rendering.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElDialog extends Elementum {
  static observedAttributes = ['open', 'title'];

  isOpen = signal(false);
  titleText = signal('');

  static styles = css`
    :host {
      display: contents;
      font-family: inherit;
    }

    dialog {
      margin: auto;
      padding: 0;
      border: 1px solid var(--el-surface-border, #e5e7eb);
      border-radius: var(--el-radius-lg, 16px);
      background: var(--el-surface-base, #ffffff);
      color: var(--el-text-base, #111827);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      width: min(90vw, 500px);
      box-sizing: border-box;
      overscroll-behavior: contain;
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(2px);
      overflow: hidden;
      overscroll-behavior: contain;
    }

    .dialog-container {
      display: flex;
      flex-direction: column;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--el-spacing-md, 16px) var(--el-spacing-lg, 24px);
      border-bottom: 1px solid var(--el-surface-border, #e5e7eb);
    }

    .dialog-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--el-text-muted, #6b7280);
      padding: 4px 8px;
      border-radius: var(--el-radius-sm, 4px);
      line-height: 1;
    }

    .close-button:hover {
      background: var(--el-surface-muted, #f3f4f6);
      color: var(--el-text-base, #111827);
    }

    .dialog-body {
      padding: var(--el-spacing-lg, 24px);
      overflow-y: auto;
      max-height: 60vh;
    }

    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--el-spacing-sm, 8px);
      padding: var(--el-spacing-md, 16px) var(--el-spacing-lg, 24px);
      border-top: 1px solid var(--el-surface-border, #e5e7eb);
      background: var(--el-surface-muted, #f8fafc);
      border-bottom-left-radius: var(--el-radius-lg, 16px);
      border-bottom-right-radius: var(--el-radius-lg, 16px);
    }

    @media (max-width: 640px) {
      dialog {
        width: calc(100vw - 24px);
        max-height: calc(100dvh - 32px);
      }

      .dialog-header,
      .dialog-body,
      .dialog-footer {
        padding-left: var(--el-spacing-md, 16px);
        padding-right: var(--el-spacing-md, 16px);
      }
    }
  `;

  #previousActiveElement = null;

  #getNativeDialog() {
    return this.root.querySelector('dialog');
  }

  showModal() {
    const dlg = this.#getNativeDialog();
    if (dlg && !dlg.open) {
      if (typeof document !== 'undefined' && document.activeElement) {
        this.#previousActiveElement = document.activeElement;
      }
      dlg.showModal();
      this.isOpen.value = true;
      this.emit('open');
    }
  }

  close(returnValue = '') {
    const dlg = this.#getNativeDialog();
    if (dlg && dlg.open) {
      dlg.close(returnValue);
      this.isOpen.value = false;
      this.emit('close', { returnValue });
      this.#restoreFocus();
    }
  }

  #restoreFocus() {
    if (this.#previousActiveElement && typeof this.#previousActiveElement.focus === 'function') {
      try {
        this.#previousActiveElement.focus();
      } catch {
        // Ignore focus failures if detached
      }
      this.#previousActiveElement = null;
    }
  }

  #onBackdropClick = (e) => {
    const dlg = this.#getNativeDialog();
    if (!dlg) return;
    const rect = dlg.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      this.close('cancel');
    }
  };

  #onDialogClose = (e) => {
    const dlg = e.target;
    this.isOpen.value = false;
    const returnValue = dlg.returnValue;
    dlg.returnValue = ''; // Reset per modern web guidance to prevent stale leaks
    this.emit('close', { returnValue });
    this.#restoreFocus();
  };

  render() {
    return html`
      <dialog
        part="dialog"
        aria-labelledby="dialog-title"
        @click=${this.#onBackdropClick}
        @close=${this.#onDialogClose}
      >
        <div class="dialog-container">
          <div class="dialog-header">
            <h2 id="dialog-title" class="dialog-title">
              <slot name="header">${() => this.titleText.value}</slot>
            </h2>
            <button
              type="button"
              class="close-button"
              aria-label="Close dialog"
              @click=${() => this.close('cancel')}
            >
              ✕
            </button>
          </div>

          <div class="dialog-body" part="body">
            <slot></slot>
          </div>

          <div class="dialog-footer" part="footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </dialog>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-dialog')) {
  customElements.define('el-dialog', ElDialog);
}
