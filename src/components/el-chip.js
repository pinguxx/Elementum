import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElChip extends Elementum {
  static observedAttributes = ['variant', 'size', 'removable', 'selectable', 'selected', 'value', 'disabled'];

  variant = signal('muted'); // 'primary' | 'success' | 'danger' | 'warning' | 'muted'
  size = signal('md'); // 'sm' | 'md'
  removable = signal(false);
  selectable = signal(false);
  selected = signal(false);
  value = signal('');
  disabled = signal(false);

  connected() {
    this.#syncValues();
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnected() {
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  attributeChanged(name, oldValue, newValue) {
    this.#syncValues();
  }

  #syncValues() {
    this.variant.value = this.getAttribute('variant') || 'muted';
    this.size.value = this.getAttribute('size') || 'md';
    this.removable.value = this.hasAttribute('removable');
    this.selectable.value = this.hasAttribute('selectable');
    this.selected.value = this.hasAttribute('selected');
    this.value.value = this.getAttribute('value') || '';
    this.disabled.value = this.hasAttribute('disabled');
  }

  toggleSelected() {
    if (this.disabled.value || !this.selectable.value) return;
    const nextState = !this.selected.value;
    this.selected.value = nextState;
    if (nextState) {
      this.setAttribute('selected', '');
    } else {
      this.removeAttribute('selected');
    }
    this.emit('change', { selected: nextState, value: this.value.value });
  }

  #onRemoveClick = (e) => {
    e.stopPropagation();
    if (this.disabled.value) return;
    this.emit('remove', { value: this.value.value });
  };

  #onClick = () => {
    if (this.selectable.value) {
      this.toggleSelected();
    }
  };

  #onKeyDown = (e) => {
    if (this.disabled.value) return;
    if (this.selectable.value && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      this.toggleSelected();
    } else if (this.removable.value && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      this.emit('remove', { value: this.value.value });
    }
  };

  static styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      box-sizing: border-box;
      user-select: none;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: var(--el-radius-full, 9999px);
      font-family: var(--el-font-sans, system-ui, sans-serif);
      font-weight: 500;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
      border: 1px solid transparent;
      outline: none;
    }

    /* Sizes */
    .size-sm {
      height: 24px;
      padding: 0 8px;
      font-size: 0.75rem;
    }

    .size-md {
      height: 30px;
      padding: 0 12px;
      font-size: 0.8125rem;
    }

    /* Variants */
    .variant-muted {
      background: var(--el-surface-muted, #f1f5f9);
      color: var(--el-text-primary, #1e293b);
      border-color: var(--el-surface-border, #e2e8f0);
    }

    .variant-primary {
      background: #eff6ff;
      color: var(--el-color-primary, #2563eb);
      border-color: #bfdbfe;
    }

    .variant-success {
      background: #ecfdf5;
      color: #059669;
      border-color: #a7f3d0;
    }

    .variant-warning {
      background: #fffbeb;
      color: #d97706;
      border-color: #fde68a;
    }

    .variant-danger {
      background: #fef2f2;
      color: var(--el-color-danger, #ef4444);
      border-color: #fecaca;
    }

    /* Selectable */
    .selectable {
      cursor: pointer;
    }

    .selectable:hover:not(.disabled) {
      filter: brightness(0.96);
    }

    .selected {
      background: var(--el-color-primary, #2563eb) !important;
      color: #ffffff !important;
      border-color: var(--el-color-primary, #2563eb) !important;
    }

    :host(:focus-visible) .chip {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: 1px;
    }

    .disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Remove button */
    .remove-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: currentColor;
      opacity: 0.7;
      cursor: pointer;
      padding: 0;
      margin: 0;
      width: 14px;
      height: 14px;
      border-radius: var(--el-radius-full, 9999px);
      font-size: 11px;
      line-height: 1;
      transition: opacity 0.15s ease, background 0.15s ease;
    }

    .remove-btn:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.12);
    }

    .remove-btn:focus-visible {
      outline: 1px solid currentColor;
    }
  `;

  render() {
    return html`
      <div
        class=${() =>
          `chip size-${this.size.value} variant-${this.variant.value} ${
            this.selectable.value ? 'selectable' : ''
          } ${this.selected.value ? 'selected' : ''} ${this.disabled.value ? 'disabled' : ''}`}
        part="chip"
        role=${() => (this.selectable.value ? 'button' : 'status')}
        aria-pressed=${() => (this.selectable.value ? String(this.selected.value) : null)}
        tabindex=${() => (this.selectable.value && !this.disabled.value ? '0' : null)}
      >
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>

        ${() =>
          this.removable.value
            ? html`
                <button
                  type="button"
                  class="remove-btn"
                  part="remove-button"
                  aria-label="Remove tag"
                  @click=${this.#onRemoveClick}
                >
                  ✕
                </button>
              `
            : null}
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-chip')) {
  customElements.define('el-chip', ElChip);
}
