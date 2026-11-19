import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, effect } from '../signal.js';

/**
 * <el-prompt-input>
 * Beautiful UI-style auto-expanding AI prompt composer with action slots,
 * model tags, and keyboard submit handling (Enter to submit, Shift+Enter for newline).
 *
 * @element el-prompt-input
 * @fires submit - Dispatched when the user submits prompt via Enter or submit button
 * @fires input - Dispatched as the user types
 * @fires change - Dispatched on value commit
 * @slot tools - Left side action bar (e.g. Model Selector, Deep Think toggle, Attachments)
 * @slot actions - Right side custom actions/buttons
 * @csspart container - The outer wrapper container
 * @csspart textarea - The native auto-expanding textarea
 * @csspart bottom-bar - The actions footer bar
 * @csspart submit-button - The built-in submit arrow button
 */
export class ElPromptInput extends Elementum {
  static formAssociated = true;
  static observedAttributes = [
    'value',
    'placeholder',
    'disabled',
    'loading',
    'max-rows',
    'min-rows',
    'clear-on-submit',
    'autofocus'
  ];

  value = signal('');
  placeholder = signal('Type a message or prompt... (Enter to send, Shift+Enter for newline)');
  disabled = signal(false);
  loading = signal(false);
  maxRows = signal(10);
  minRows = signal(2);
  clearOnSubmit = signal(true);

  #textarea = null;

  connected() {
    this.value.value = this.getAttribute('value') || '';
    if (this.hasAttribute('placeholder')) {
      this.placeholder.value = this.getAttribute('placeholder');
    }
    this.disabled.value = this.hasAttribute('disabled');
    this.loading.value = this.hasAttribute('loading');
    if (this.hasAttribute('max-rows')) {
      this.maxRows.value = parseInt(this.getAttribute('max-rows'), 10) || 10;
    }
    if (this.hasAttribute('min-rows')) {
      this.minRows.value = parseInt(this.getAttribute('min-rows'), 10) || 2;
    }
    if (this.hasAttribute('clear-on-submit')) {
      this.clearOnSubmit.value = this.getAttribute('clear-on-submit') !== 'false';
    }

    this.#textarea = this.root.querySelector('textarea');
    this.setFormValue(this.value.value);

    // Sync signal changes to textarea & height
    effect(() => {
      const val = this.value.value;
      if (this.#textarea && this.#textarea.value !== val) {
        this.#textarea.value = val;
        this.#autoResize();
      }
      this.setFormValue(val);
    }, { signal: this.signal });

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => this.#autoResize());
    } else {
      this.#autoResize();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    switch (name) {
      case 'value':
        this.value.value = newValue || '';
        break;
      case 'placeholder':
        this.placeholder.value = newValue || '';
        break;
      case 'disabled':
        this.disabled.value = newValue !== null;
        break;
      case 'loading':
        this.loading.value = newValue !== null;
        break;
      case 'max-rows':
        this.maxRows.value = parseInt(newValue, 10) || 10;
        this.#autoResize();
        break;
      case 'min-rows':
        this.minRows.value = parseInt(newValue, 10) || 2;
        this.#autoResize();
        break;
      case 'clear-on-submit':
        this.clearOnSubmit.value = newValue !== 'false';
        break;
    }
  }

  #autoResize() {
    const el = this.#textarea || this.root?.querySelector?.('textarea');
    if (!el) return;

    el.style.height = 'auto';
    const computed = typeof window.getComputedStyle === 'function' ? window.getComputedStyle(el) : null;
    const lineHeight = parseFloat(computed?.lineHeight) || 24;
    const paddingTop = parseFloat(computed?.paddingTop) || 0;
    const paddingBottom = parseFloat(computed?.paddingBottom) || 0;
    const padding = paddingTop + paddingBottom;

    const minH = lineHeight * this.minRows.value + padding;
    const maxH = lineHeight * this.maxRows.value + padding;

    const scrollHeight = el.scrollHeight || minH;
    const newH = Math.min(Math.max(scrollHeight, minH), maxH);
    el.style.height = `${newH}px`;
    el.style.overflowY = scrollHeight > maxH ? 'auto' : 'hidden';
  }

  #handleInput = (e) => {
    this.value.value = e.target.value;
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: this.value.value } }));
    this.#autoResize();
  };

  #handleChange = () => {
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: this.value.value } }));
  };

  #handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      this.submit();
    }
  };

  /**
   * Programmatically trigger prompt submission
   */
  submit() {
    if (this.disabled.value || this.loading.value) return;
    const val = this.value.value.trim();
    if (!val) return;

    const event = new CustomEvent('submit', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { value: val }
    });

    const notCancelled = this.dispatchEvent(event);
    if (notCancelled && this.clearOnSubmit.value) {
      this.value.value = '';
      if (this.#textarea) {
        this.#textarea.value = '';
        this.#autoResize();
      }
    }
  }

  formResetCallback() {
    this.value.value = '';
    if (this.#textarea) {
      this.#textarea.value = '';
      this.#autoResize();
    }
  }

  focus() {
    if (this.#textarea) this.#textarea.focus();
  }

  blur() {
    if (this.#textarea) this.#textarea.blur();
  }

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      font-family: var(--el-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    }

    .container {
      position: relative;
      display: flex;
      flex-direction: column;
      background: var(--el-surface-elevated, #ffffff);
      border: 1px solid var(--el-border-translucent, rgba(15, 23, 42, 0.1));
      border-radius: var(--el-radius-xl, 16px);
      box-shadow: var(--el-shadow-card, 0 1px 3px rgba(0,0,0,0.06), 0 8px 16px -4px rgba(0,0,0,0.04));
      padding: 12px 14px 10px 14px;
      transition: border-color var(--el-transition-fluid, 280ms cubic-bezier(0.16, 1, 0.3, 1)),
                  box-shadow var(--el-transition-fluid, 280ms cubic-bezier(0.16, 1, 0.3, 1));
      box-sizing: border-box;
    }

    .container:focus-within {
      border-color: var(--el-color-primary, #2563eb);
      box-shadow: 0 0 0 3px var(--el-color-primary-focus, rgba(37, 99, 235, 0.15)),
                  var(--el-shadow-card, 0 1px 3px rgba(0,0,0,0.06), 0 8px 16px -4px rgba(0,0,0,0.04));
    }

    :host([disabled]) .container {
      opacity: 0.6;
      background: var(--el-surface-muted, #f8fafc);
      cursor: not-allowed;
    }

    .textarea-wrapper {
      position: relative;
      width: 100%;
    }

    textarea {
      width: 100%;
      min-height: 48px;
      max-height: 320px;
      padding: 2px 0 6px 0;
      border: none;
      outline: none;
      background: transparent;
      resize: none;
      font-family: inherit;
      font-size: 0.9375rem;
      line-height: 1.5;
      color: var(--el-text-primary, #0f172a);
      box-sizing: border-box;
      overflow-y: hidden;
    }

    textarea::placeholder {
      color: var(--el-text-muted, #94a3b8);
    }

    textarea:disabled {
      cursor: not-allowed;
    }

    .bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid var(--el-border-translucent, rgba(15, 23, 42, 0.05));
    }

    .tools-slot {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      flex: 1;
    }

    .actions-slot {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .submit-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      padding: 0;
      border: none;
      border-radius: var(--el-radius-full, 9999px);
      background: var(--el-color-primary, #2563eb);
      color: #ffffff;
      cursor: pointer;
      transition: transform var(--el-transition-snappy, 150ms ease),
                  background-color var(--el-transition-snappy, 150ms ease),
                  opacity 0.2s ease;
      flex-shrink: 0;
    }

    .submit-button:hover:not(:disabled) {
      background: var(--el-color-primary-hover, #1d4ed8);
      transform: scale(1.04);
    }

    .submit-button:active:not(:disabled) {
      transform: scale(0.96);
    }

    .submit-button:disabled {
      background: var(--el-surface-muted, #e2e8f0);
      color: var(--el-text-muted, #94a3b8);
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .container, .submit-button {
        transition: none;
      }
      .spinner {
        animation-duration: 1.5s;
      }
    }

    @media (pointer: coarse) {
      textarea {
        font-size: max(16px, 1em);
      }
    }
  `;

  render() {
    return html`
      <div class="container" part="container">
        <div class="textarea-wrapper">
          <textarea
            part="textarea"
            .placeholder=${() => this.placeholder.value}
            .value=${() => this.value.value}
            ?disabled=${() => Boolean(this.disabled.value)}
            @input=${this.#handleInput}
            @change=${this.#handleChange}
            @keydown=${this.#handleKeyDown}
            rows="2"
            aria-label=${() => this.placeholder.value}
          ></textarea>
        </div>
        <div class="bottom-bar" part="bottom-bar">
          <div class="tools-slot" part="tools">
            <slot name="tools"></slot>
          </div>
          <div class="actions-slot" part="actions">
            <slot name="actions">
              <button
                type="button"
                class="submit-button"
                part="submit-button"
                ?disabled=${() => !this.value.value.trim() || this.disabled.value || this.loading.value}
                @click=${() => this.submit()}
                aria-label="Submit prompt"
              >
                ${() => this.loading.value
                  ? html`<div class="spinner" aria-label="Loading"></div>`
                  : html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`
                }
              </button>
            </slot>
          </div>
        </div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-prompt-input')) {
  customElements.define('el-prompt-input', ElPromptInput);
}
