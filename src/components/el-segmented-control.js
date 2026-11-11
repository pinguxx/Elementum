import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElSegmentedControl extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['value', 'disabled', 'size', 'name'];

  value = signal('');
  disabled = signal(false);
  size = signal('md'); // 'sm' | 'md' | 'lg'
  name = signal('');
  #options = signal([]);

  connected() {
    this.disabled.value = this.hasAttribute('disabled');
    this.size.value = this.getAttribute('size') || 'md';
    this.name.value = this.getAttribute('name') || '';

    this.#scanOptions();

    const observer = new MutationObserver(() => this.#scanOptions());
    observer.observe(this, { childList: true, subtree: true, characterData: true });
    this.signal?.addEventListener('abort', () => observer.disconnect());

    const initial = this.getAttribute('value') || this.#options.value[0]?.value || '';
    this.value.value = initial;
    this.setFormValue(initial);

    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnected() {
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value') {
      this.value.value = newValue || '';
      this.setFormValue(this.value.value);
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
    } else if (name === 'size') {
      this.size.value = newValue || 'md';
    }
  }

  formReset() {
    const initial = this.getAttribute('value') || this.#options.value[0]?.value || '';
    this.value.value = initial;
    this.setFormValue(initial);
  }

  #scanOptions() {
    const raw = Array.from(this.querySelectorAll('option')).map((opt) => ({
      label: opt.textContent.trim(),
      value: opt.value || opt.textContent.trim(),
      disabled: opt.hasAttribute('disabled'),
    }));

    if (raw.length > 0) {
      this.#options.value = raw;
      if (!this.value.value && raw[0]) {
        this.value.value = raw[0].value;
        this.setFormValue(raw[0].value);
      }
    }
  }

  selectOption(val) {
    if (this.disabled.value) return;
    const opt = this.#options.value.find((o) => o.value === val);
    if (opt && !opt.disabled && this.value.value !== val) {
      this.value.value = val;
      this.setFormValue(val);
      this.emit('change', { value: val });
    }
  }

  #onKeyDown = (e) => {
    if (this.disabled.value) return;
    const opts = this.#options.value.filter((o) => !o.disabled);
    if (!opts.length) return;

    const currentIndex = opts.findIndex((o) => o.value === this.value.value);
    let nextIndex = -1;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % opts.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + opts.length) % opts.length;
    }

    if (nextIndex >= 0) {
      this.selectOption(opts[nextIndex].value);
      // Focus newly selected segment button
      const buttons = this.root.querySelectorAll('button[role="radio"]');
      buttons[nextIndex]?.focus();
    }
  };

  static styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      box-sizing: border-box;
      user-select: none;
    }

    .segmented-group {
      display: inline-flex;
      align-items: center;
      background: var(--el-surface-muted, #f1f5f9);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 8px);
      padding: 3px;
      gap: 2px;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    .segment-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--el-text-muted, #64748b);
      font-weight: 500;
      cursor: pointer;
      border-radius: calc(var(--el-radius-md, 8px) - 2px);
      transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
      font-family: inherit;
    }

    /* Sizes */
    :host([size='sm']) .segment-btn,
    .segment-btn.size-sm {
      padding: 4px 10px;
      font-size: 0.75rem;
      min-height: 26px;
    }

    :host([size='md']) .segment-btn,
    .segment-btn,
    .segment-btn.size-md {
      padding: 6px 14px;
      font-size: 0.875rem;
      min-height: 32px;
    }

    :host([size='lg']) .segment-btn,
    .segment-btn.size-lg {
      padding: 8px 18px;
      font-size: 1rem;
      min-height: 40px;
    }

    .segment-btn:hover:not([disabled]):not(.active) {
      color: var(--el-text-primary, #0f172a);
    }

    .segment-btn.active {
      background: var(--el-surface-card, #ffffff);
      color: var(--el-color-primary, #2563eb);
      font-weight: 600;
      box-shadow: var(--el-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
    }

    .segment-btn:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: -1px;
    }

    .segment-btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sr-only-slot {
      display: none;
    }
  `;

  render() {
    return html`
      <div class="sr-only-slot">
        <slot></slot>
      </div>

      <div
        class="segmented-group"
        part="group"
        role="radiogroup"
        aria-label=${() => this.getAttribute('aria-label') || 'Options'}
      >
        ${() =>
          this.#options.value.map((opt) => {
            const isChecked = this.value.value === opt.value;
            return html`
              <button
                type="button"
                role="radio"
                part="segment"
                class=${() =>
                  `segment-btn size-${this.size.value} ${isChecked ? 'active' : ''}`}
                aria-checked=${String(isChecked)}
                tabindex=${isChecked ? '0' : '-1'}
                disabled=${opt.disabled || this.disabled.value}
                @click=${() => this.selectOption(opt.value)}
              >
                ${opt.label}
              </button>
            `;
          })}
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-segmented-control')) {
  customElements.define('el-segmented-control', ElSegmentedControl);
}
