/**
 * <el-rating>
 * Accessible 1-5 star rating component inspired by shadcn/ui.
 * Implements Form Associated Custom Element (FACE), keyboard arrows navigation,
 * hover preview, read-only/disabled states, and clean SVG stars.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElRating extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['value', 'max', 'readonly', 'disabled', 'name'];

  value = signal(0);
  hoverValue = signal(0);
  max = signal(5);
  readonly = signal(false);
  disabled = signal(false);

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
      outline: none;
    }
    .star-btn:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: 2px;
    }

    .star-btn {
      background: transparent;
      border: none;
      padding: 2px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--el-surface-border, #cbd5e1);
      transition: color 0.15s ease, transform 0.1s ease;
      outline: none;
      border-radius: var(--el-radius-sm, 4px);
    }

    :host-context([data-theme="dark"]) .star-btn {
      color: #475569;
    }

    .star-btn:hover:not(:disabled) {
      transform: scale(1.15);
    }

    .star-btn.filled {
      color: #f59e0b; /* Amber 500 */
    }

    :host([readonly]) .star-btn {
      cursor: default;
    }

    :host([disabled]) {
      opacity: 0.6;
      cursor: not-allowed;
    }

    :host([disabled]) .star-btn {
      cursor: not-allowed;
    }
  `;

  connected() {
    this.#syncAttrs();
    this.setAttribute('role', 'slider');
    this.setAttribute('tabindex', this.disabled.value ? '-1' : '0');
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', String(this.max.value));
    this.setAttribute('aria-valuenow', String(this.value.value));

    this.addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('mouseleave', () => {
      this.hoverValue.value = 0;
    });

    this.setFormValue(String(this.value.value));
  }

  disconnected() {
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  attributeChanged(name, oldValue, newValue) {
    this.#syncAttrs();
    return true;
  }

  #syncAttrs() {
    this.value.value = parseFloat(this.getAttribute('value') || '0');
    this.max.value = parseInt(this.getAttribute('max') || '5', 10);
    this.readonly.value = this.hasAttribute('readonly');
    this.disabled.value = this.hasAttribute('disabled');
  }

  formReset() {
    this.value.value = parseFloat(this.getAttribute('value') || '0');
    this.setFormValue(String(this.value.value));
  }

  setValue(val) {
    if (this.readonly.value || this.disabled.value) return;
    const clamped = Math.max(0, Math.min(val, this.max.value));
    this.value.value = clamped;
    this.setAttribute('aria-valuenow', String(clamped));
    this.setFormValue(String(clamped));
    this.emit('change', { value: clamped });
  }

  #onKeyDown = (e) => {
    if (this.readonly.value || this.disabled.value) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.setValue(this.value.value + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.setValue(this.value.value - 1);
    }
  };

  render() {
    const starList = () => {
      const count = this.max.value;
      const activeVal = this.hoverValue.value || this.value.value;

      return Array.from({ length: count }).map((_, i) => {
        const starNum = i + 1;
        const isFilled = starNum <= activeVal;

        return html`
          <span
            class=${() => `star-btn ${isFilled ? 'filled' : ''}`}
            aria-hidden="true"
            onmouseenter=${() => {
              if (!this.readonly.value && !this.disabled.value) {
                this.hoverValue.value = starNum;
              }
            }}
            onclick=${() => this.setValue(starNum)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill=${isFilled ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </span>
        `;
      });
    };

    return html`${starList}`;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-rating')) {
  customElements.define('el-rating', ElRating);
}
