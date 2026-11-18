import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-data-list>
 * Semantic key-value list inspired by Radix Themes.
 * Renders data pairs with responsive horizontal/vertical orientation and copyable values.
 */
export class ElDataList extends Elementum {
  static observedAttributes = ['orientation', 'size'];

  orientation = signal('horizontal');
  size = signal('md');

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      font-family: inherit;
      box-sizing: border-box;
    }

    :host([size="sm"]) {
      gap: 8px;
    }

    :host([size="lg"]) {
      gap: 16px;
    }
  `;

  connected() {
    this.orientation.value = this.getAttribute('orientation') || 'horizontal';
    this.size.value = this.getAttribute('size') || 'md';
    this.#syncChildren();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'orientation') {
      this.orientation.value = newValue || 'horizontal';
      this.#syncChildren();
    }
    if (name === 'size') this.size.value = newValue || 'md';
  }

  #syncChildren() {
    const orient = this.orientation.value || 'horizontal';
    this.querySelectorAll('el-data-list-item').forEach((item) => {
      if (item.getAttribute('orientation') !== orient) {
        item.setAttribute('orientation', orient);
      }
    });
  }

  render() {
    return html`<slot @slotchange=${() => this.#syncChildren()}></slot>`;
  }
}

/**
 * <el-data-list-item>
 * An individual key-value row within <el-data-list>.
 */
export class ElDataListItem extends Elementum {
  static observedAttributes = ['label', 'value', 'copyable'];

  label = signal('');
  value = signal('');
  copyable = signal(false);
  copied = signal(false);

  static styles = css`
    :host {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      font-size: var(--el-text-sm, 0.875rem);
      line-height: 1.5;
      padding: 6px 0;
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
    }

    :host(:last-child) {
      border-bottom: none;
    }

    :host([orientation="vertical"]),
    :host-context([orientation="vertical"]) {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .label {
      color: var(--el-text-muted, #64748b);
      font-weight: 500;
      flex-shrink: 0;
      min-width: 120px;
    }

    :host-context([data-theme="dark"]) .label {
      color: #94a3b8;
    }

    .value-container {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--el-text-primary, #0f172a);
      font-weight: 400;
      word-break: break-all;
    }

    :host-context([data-theme="dark"]) .value-container {
      color: #f8fafc;
    }

    .copy-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      padding: 2px 6px;
      margin-left: 4px;
      border-radius: var(--el-radius-sm, 4px);
      cursor: pointer;
      color: var(--el-text-muted, #64748b);
      font-size: 0.75rem;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .copy-btn:hover {
      background-color: var(--el-surface-muted, #f1f5f9);
      color: var(--el-text-primary, #0f172a);
    }

    :host-context([data-theme="dark"]) .copy-btn:hover {
      background-color: #1e293b;
      color: #f8fafc;
    }

    .copied-badge {
      color: #10b981;
      font-size: 0.75rem;
      font-weight: 600;
    }
  `;

  connected() {
    this.label.value = this.getAttribute('label') || '';
    this.value.value = this.getAttribute('value') || '';
    this.copyable.value = this.hasAttribute('copyable');
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'label') this.label.value = newValue || '';
    if (name === 'value') this.value.value = newValue || '';
    if (name === 'copyable') this.copyable.value = newValue !== null;
  }

  async copyValue() {
    const text = this.value.value || this.textContent.trim();
    if (!text) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      this.copied.value = true;
      setTimeout(() => {
        this.copied.value = false;
      }, 2000);
    } catch {
      // Fallback
    }
  }

  render() {
    return html`
      <div class="label">
        <slot name="label">${() => this.label.value}</slot>
      </div>
      <div class="value-container">
        <slot>${() => this.value.value}</slot>
        ${() =>
          this.copyable.value
            ? html`
                <button
                  type="button"
                  class="copy-btn"
                  title="Copy to clipboard"
                  onclick="${() => this.copyValue()}"
                >
                  ${() => (this.copied.value ? html`<span class="copied-badge">✓ Copied</span>` : '📋')}
                </button>
              `
            : ''}
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-data-list')) customElements.define('el-data-list', ElDataList);
  if (!customElements.get('el-data-list-item')) customElements.define('el-data-list-item', ElDataListItem);
}
