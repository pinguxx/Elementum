import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-radio-card>
 * Rich selection card primitive inspired by Radix Themes.
 * Supports title, description, badge/meta, and radio indicator.
 */
export class ElRadioCard extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['value', 'checked', 'disabled'];

  value = signal('');
  checked = signal(false);
  disabled = signal(false);

  static styles = css`
    :host {
      display: block;
      cursor: pointer;
      user-select: none;
      font-family: inherit;
      box-sizing: border-box;
      outline: none;
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.6;
      pointer-events: none;
    }

    .card {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px;
      border-radius: var(--el-radius-lg, 12px);
      border: 2px solid var(--el-surface-border, #e2e8f0);
      background-color: var(--el-surface-card, #ffffff);
      transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    :host(:hover:not([disabled])) .card {
      border-color: var(--el-primary-subtle, #93c5fd);
      background-color: var(--el-surface-muted, #f8fafc);
    }

    :host([checked]) .card {
      border-color: var(--el-primary, #2563eb);
      background-color: rgba(37, 99, 235, 0.04);
      box-shadow: 0 0 0 1px var(--el-primary, #2563eb);
    }

    :host(:focus-visible) .card {
      outline: 2px solid var(--el-primary, #2563eb);
      outline-offset: 2px;
    }

    .radio-circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid var(--el-step-5, #cbd5e1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
      transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    }

    :host([checked]) .radio-circle {
      border-color: var(--el-primary, #2563eb);
      background-color: var(--el-primary, #2563eb);
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #ffffff;
      opacity: 0;
      transform: scale(0.4);
      transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    :host([checked]) .dot {
      opacity: 1;
      transform: scale(1);
    }

    .content {
      flex: 1;
      min-width: 0;
    }

    ::slotted([slot="title"]) {
      font-weight: 600;
      font-size: var(--el-text-base, 1rem);
      color: var(--el-text-primary, #0f172a);
      margin-bottom: 4px;
      display: block;
    }

    ::slotted([slot="description"]) {
      font-size: var(--el-text-sm, 0.875rem);
      color: var(--el-text-muted, #64748b);
      line-height: 1.4;
      display: block;
    }
  `;

  connected() {
    this.value.value = this.getAttribute('value') || '';
    this.checked.value = this.hasAttribute('checked');
    this.disabled.value = this.hasAttribute('disabled');

    if (!this.hasAttribute('tabindex') && !this.disabled.value) {
      this.setAttribute('tabindex', this.checked.value ? '0' : '-1');
    }
    this.setAttribute('role', 'radio');
    this.setAttribute('aria-checked', this.checked.value ? 'true' : 'false');

    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnected() {
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value') this.value.value = newValue || '';
    if (name === 'checked') {
      const isChecked = newValue !== null;
      this.checked.value = isChecked;
      this.setAttribute('aria-checked', isChecked ? 'true' : 'false');
      this.setAttribute('tabindex', isChecked ? '0' : '-1');
    }
    if (name === 'disabled') {
      this.disabled.value = newValue !== null;
      if (this.disabled.value) {
        this.setAttribute('aria-disabled', 'true');
        this.removeAttribute('tabindex');
      } else {
        this.removeAttribute('aria-disabled');
        this.setAttribute('tabindex', this.checked.value ? '0' : '-1');
      }
    }
  }

  #onClick = () => {
    if (this.disabled.value) return;
    this.select();
  };

  #onKeyDown = (e) => {
    if (this.disabled.value) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.select();
    }
  };

  select() {
    const parentGroup = this.closest('el-radio-card-group');
    if (parentGroup) {
      parentGroup.setValue(this.value.value);
    } else {
      this.setAttribute('checked', '');
      this.checked.value = true;
    }
    this.emit('change', { value: this.value.value });
  }

  render() {
    return html`
      <div class="card">
        <div class="radio-circle">
          <div class="dot"></div>
        </div>
        <div class="content">
          <slot name="title"></slot>
          <slot name="description"></slot>
          <slot></slot>
        </div>
        <slot name="extra"></slot>
      </div>
    `;
  }
}

/**
 * <el-radio-card-group>
 * Container for <el-radio-card> providing keyboard navigation and value coordination.
 */
export class ElRadioCardGroup extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['name', 'value', 'columns'];

  name = signal('');
  value = signal('');
  columns = signal('1');

  static styles = css`
    :host {
      display: grid;
      gap: 12px;
      width: 100%;
      box-sizing: border-box;
    }

    :host([columns="2"]) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    :host([columns="3"]) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
      :host([columns="2"]), :host([columns="3"]) {
        grid-template-columns: 1fr;
      }
    }
  `;

  connected() {
    this.name.value = this.getAttribute('name') || '';
    this.value.value = this.getAttribute('value') || '';
    this.columns.value = this.getAttribute('columns') || '1';

    this.setAttribute('role', 'radiogroup');
    this.#syncChildren();
    if (typeof queueMicrotask !== 'undefined') {
      queueMicrotask(() => this.#syncChildren());
    }
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnected() {
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value') {
      this.value.value = newValue || '';
      this.#syncChildren();
    }
    if (name === 'columns') this.columns.value = newValue || '1';
    if (name === 'name') this.name.value = newValue || '';
  }

  #syncChildren() {
    const cards = this.querySelectorAll('el-radio-card');
    let hasChecked = false;
    cards.forEach((card) => {
      const isMatch = card.getAttribute('value') === this.value.value;
      if (isMatch && !hasChecked) {
        card.setAttribute('checked', '');
        if (card.checked && typeof card.checked === 'object' && 'value' in card.checked) {
          card.checked.value = true;
        }
        card.setAttribute('tabindex', '0');
        hasChecked = true;
      } else {
        card.removeAttribute('checked');
        if (card.checked && typeof card.checked === 'object' && 'value' in card.checked) {
          card.checked.value = false;
        }
        card.setAttribute('tabindex', '-1');
      }
    });

    if (!hasChecked && cards.length > 0) {
      cards[0].setAttribute('tabindex', '0');
    }

    this.setFormValue(this.value.value);
  }

  setValue(val) {
    this.value.value = val;
    this.setAttribute('value', val);
    this.#syncChildren();
    this.emit('change', { value: val });
  }

  #onKeyDown = (e) => {
    const cards = Array.from(this.querySelectorAll('el-radio-card:not([disabled])'));
    if (cards.length === 0) return;

    const currentIndex = cards.findIndex((c) => c.getAttribute('value') === this.value.value);
    let nextIndex = -1;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
    }

    if (nextIndex >= 0) {
      cards[nextIndex].focus();
      cards[nextIndex].select();
    }
  };

  formReset() {
    const initial = this.defaultValue;
    this.setValue(initial);
  }

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-radio-card')) customElements.define('el-radio-card', ElRadioCard);
  if (!customElements.get('el-radio-card-group')) customElements.define('el-radio-card-group', ElRadioCardGroup);
}
