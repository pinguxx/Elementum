import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElDrawer extends Elementum {
  static observedAttributes = ['open', 'placement', 'title'];

  isOpen = signal(false);
  placement = signal('right'); // 'right' | 'left' | 'top' | 'bottom'
  titleText = signal('');

  #previousActiveElement = null;

  connected() {
    this.isOpen.value = this.hasAttribute('open');
    this.placement.value = this.getAttribute('placement') || 'right';
    this.titleText.value = this.getAttribute('title') || '';

    window.addEventListener('keydown', this.#onKeyDown);
  }

  disconnected() {
    window.removeEventListener('keydown', this.#onKeyDown);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'open') {
      const shouldOpen = newValue !== null && newValue !== 'false';
      if (shouldOpen) {
        this.show();
      } else {
        this.close();
      }
    } else if (name === 'placement') {
      this.placement.value = newValue || 'right';
    } else if (name === 'title') {
      this.titleText.value = newValue || '';
    }
  }

  show() {
    if (this.isOpen.value) return;
    if (typeof document !== 'undefined' && document.activeElement) {
      this.#previousActiveElement = document.activeElement;
    }
    this.isOpen.value = true;
    this.emit('open');

    // Focus close button or panel for accessibility
    setTimeout(() => {
      const closeBtn = this.root?.querySelector('.close-btn');
      closeBtn?.focus?.();
    }, 50);
  }

  close() {
    if (!this.isOpen.value) return;
    this.isOpen.value = false;
    this.emit('close');

    if (this.#previousActiveElement && typeof this.#previousActiveElement.focus === 'function') {
      try {
        this.#previousActiveElement.focus();
      } catch {
        // Ignore if detached
      }
      this.#previousActiveElement = null;
    }
  }

  #onKeyDown = (e) => {
    if (this.isOpen.value && e.key === 'Escape') {
      e.stopPropagation();
      this.close();
    }
  };

  #onBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      this.close();
    }
  };

  static styles = css`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(2px);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.25s ease, visibility 0.25s ease;
    }

    .backdrop.open {
      opacity: 1;
      visibility: visible;
    }

    .drawer-panel {
      position: fixed;
      background: var(--el-surface-card, #ffffff);
      color: var(--el-text-primary, #0f172a);
      box-shadow: var(--el-shadow-lg, 0 20px 25px -5px rgba(0, 0, 0, 0.2));
      display: flex;
      flex-direction: column;
      z-index: 1001;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
      max-width: 100vw;
      max-height: 100vh;
    }

    /* Placements */
    .placement-right {
      top: 0;
      right: 0;
      bottom: 0;
      width: var(--el-drawer-size, 380px);
      transform: translateX(100%);
      border-left: 1px solid var(--el-surface-border, #e2e8f0);
    }

    .placement-left {
      top: 0;
      left: 0;
      bottom: 0;
      width: var(--el-drawer-size, 380px);
      transform: translateX(-100%);
      border-right: 1px solid var(--el-surface-border, #e2e8f0);
    }

    .placement-top {
      top: 0;
      left: 0;
      right: 0;
      height: var(--el-drawer-size, 320px);
      transform: translateY(-100%);
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
    }

    .placement-bottom {
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--el-drawer-size, 320px);
      transform: translateY(100%);
      border-top: 1px solid var(--el-surface-border, #e2e8f0);
    }

    .drawer-panel.open {
      transform: translate(0, 0);
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--el-spacing-md, 16px) var(--el-spacing-lg, 24px);
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
    }

    .drawer-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--el-text-muted, #64748b);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--el-radius-md, 8px);
      transition: background 0.15s ease;
    }

    .close-btn:hover {
      background: var(--el-surface-muted, #f1f5f9);
      color: var(--el-text-primary, #0f172a);
    }

    .close-btn:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--el-spacing-lg, 24px);
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    .drawer-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--el-spacing-sm, 8px);
      padding: var(--el-spacing-md, 16px) var(--el-spacing-lg, 24px);
      border-top: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-muted, #f8fafc);
    }

    @media (max-width: 640px) {
      .placement-left,
      .placement-right {
        width: 100vw !important;
        max-width: 100vw !important;
      }

      .placement-top,
      .placement-bottom {
        max-height: 85dvh;
        height: auto;
      }

      .drawer-header,
      .drawer-body,
      .drawer-footer {
        padding-left: var(--el-spacing-md, 16px);
        padding-right: var(--el-spacing-md, 16px);
      }
    }
  `;

  render() {
    return html`
      <div
        class=${() => `backdrop ${this.isOpen.value ? 'open' : ''}`}
        @click=${this.#onBackdropClick}
        aria-hidden="true"
      ></div>

      <div
        class=${() =>
          `drawer-panel placement-${this.placement.value} ${this.isOpen.value ? 'open' : ''}`}
        part="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div class="drawer-header" part="header">
          <h2 id="drawer-title" class="drawer-title">
            <slot name="header">${() => this.titleText.value}</slot>
          </h2>
          <button
            type="button"
            class="close-btn"
            aria-label="Close drawer"
            @click=${() => this.close()}
          >
            ✕
          </button>
        </div>

        <div class="drawer-body" part="body">
          <slot></slot>
        </div>

        <div class="drawer-footer" part="footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-drawer')) {
  customElements.define('el-drawer', ElDrawer);
}
