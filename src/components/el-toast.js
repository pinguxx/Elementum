/**
 * <el-toast> and <el-toaster>
 * Lightweight notification toast system with global programmatic API.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

class ToastManager {
  toasts = signal([]); // [{ id, message, variant, duration }]
  #counter = 0;

  show({ message, variant = 'info', duration = 3500 }) {
    const id = ++this.#counter;
    const item = { id, message, variant, duration };
    this.toasts.value = [...this.toasts.value, item];

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
    return id;
  }

  success(message, duration = 3500) {
    return this.show({ message, variant: 'success', duration });
  }

  error(message, duration = 4000) {
    return this.show({ message, variant: 'danger', duration });
  }

  info(message, duration = 3500) {
    return this.show({ message, variant: 'info', duration });
  }

  dismiss(id) {
    this.toasts.value = this.toasts.value.filter((t) => t.id !== id);
  }
}

export const toast = new ToastManager();

export class ElToaster extends Elementum {
  static styles = css`
    :host {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      font-family: inherit;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-width: 280px;
      max-width: 400px;
      padding: 12px 16px;
      border-radius: var(--el-radius-md, 8px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      font-size: 0.875rem;
      font-weight: 500;
      color: #ffffff;
      animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-8px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .toast-item.info {
      background: #1e293b;
    }

    .toast-item.success {
      background: var(--el-color-success, #16a34a);
    }

    .toast-item.danger {
      background: var(--el-color-danger, #dc2626);
    }

    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      font-size: 1rem;
      cursor: pointer;
      line-height: 1;
      padding: 2px;
    }

    .close-btn:hover {
      color: #ffffff;
    }
  `;

  render() {
    return html`
      ${() =>
        toast.toasts.value.map(
          (t) => html`
            <div class=${() => `toast-item ${t.variant}`} role="alert">
              <span>${t.message}</span>
              <button
                type="button"
                class="close-btn"
                aria-label="Dismiss toast"
                @click=${() => toast.dismiss(t.id)}
              >
                ✕
              </button>
            </div>
          `
        )}
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-toaster')) {
  customElements.define('el-toaster', ElToaster);
}
