/**
 * <el-breadcrumb> & <el-breadcrumb-item>
 * Accessible breadcrumb navigation trail inspired by shadcn/ui.
 * Emits semantic nav structure, aria-label="Breadcrumb", current page indicator,
 * and customizable separators (chevron, slash, or custom icon).
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElBreadcrumbItem extends Elementum {
  static observedAttributes = ['href', 'current', 'separator'];

  href = signal('');
  current = signal(false);
  separator = signal('/');
  isLast = signal(false);

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      font-size: 0.875rem;
      line-height: 1.25rem;
      box-sizing: border-box;
    }

    .link {
      color: var(--el-text-muted, #64748b);
      text-decoration: none;
      transition: color 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .link:hover {
      color: var(--el-text-primary, #0f172a);
      text-decoration: underline;
    }

    :host-context([data-theme="dark"]) .link {
      color: #94a3b8;
    }

    :host-context([data-theme="dark"]) .link:hover {
      color: #f8fafc;
    }

    .current {
      font-weight: 600;
      color: var(--el-text-primary, #0f172a);
      pointer-events: none;
    }

    :host-context([data-theme="dark"]) .current {
      color: #f8fafc;
    }

    .separator {
      display: inline-flex;
      align-items: center;
      margin: 0 8px;
      color: var(--el-text-muted, #94a3b8);
      user-select: none;
    }
  `;

  connected() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'listitem');
    }
    this.href.value = this.getAttribute('href') || '';
    this.current.value =
      (this.hasAttribute('current') && this.getAttribute('current') !== 'false') ||
      this.getAttribute('aria-current') === 'page';
    if (this.hasAttribute('separator')) {
      this.separator.value = this.getAttribute('separator') || '/';
    }
  }

  rendered() {
    this.closest('el-breadcrumb')?.syncSeparators?.();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'href') this.href.value = newValue || '';
    if (name === 'current') this.current.value = newValue !== null && newValue !== 'false';
    if (name === 'separator') this.separator.value = newValue || '/';
    return true;
  }

  render() {
    return html`
      ${() =>
        this.current.value
          ? html`<span class="current" aria-current="page"><slot></slot></span>`
          : html`<a class="link" href=${() => this.href.value || '#'}><slot></slot></a>`
      }
      <span
        class="separator"
        aria-hidden="true"
        part="separator"
        style=${() => (this.isLast.value ? 'display: none;' : 'display: inline-flex;')}
      >
        <slot name="separator">${() => this.separator.value}</slot>
      </span>
    `;
  }
}

export class ElBreadcrumb extends Elementum {
  static observedAttributes = ['separator'];

  separator = signal('/');

  static styles = css`
    :host {
      display: block;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
    }

    .breadcrumb-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      list-style: none;
      padding: 0;
      margin: 0;
      gap: 0;
    }

    ::slotted(el-breadcrumb-item:last-of-type) {
      /* hide trailing separator */
    }
  `;

  connected() {
    this.separator.value = this.getAttribute('separator') || '/';
    this.#updateChildrenSeparators();

    const observer = new MutationObserver(() => this.#updateChildrenSeparators());
    observer.observe(this, { childList: true });
    this._observer = observer;
  }

  rendered() {
    this.#updateChildrenSeparators();
    queueMicrotask(() => this.#updateChildrenSeparators());
  }

  disconnected() {
    this._observer?.disconnect();
  }

  syncSeparators() {
    this.#updateChildrenSeparators();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'separator') {
      this.separator.value = newValue || '/';
      this.#updateChildrenSeparators();
    }
    return true;
  }

  #updateChildrenSeparators() {
    const items = Array.from(this.querySelectorAll('el-breadcrumb-item'));
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      if (item.separator && typeof item.separator === 'object' && 'value' in item.separator) {
        item.separator.value = this.separator.value;
      }
      if (item.isLast && typeof item.isLast === 'object' && 'value' in item.isLast) {
        item.isLast.value = isLast;
      }
      const sep = item.shadowRoot?.querySelector('.separator');
      if (sep) {
        sep.style.display = isLast ? 'none' : 'inline-flex';
        sep.textContent = this.separator.value;
      }
    });
  }

  render() {
    return html`
      <nav aria-label="Breadcrumb" part="nav">
        <div role="list" class="breadcrumb-list" part="list">
          <slot></slot>
        </div>
      </nav>
    `;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-breadcrumb-item')) {
    customElements.define('el-breadcrumb-item', ElBreadcrumbItem);
  }
  if (!customElements.get('el-breadcrumb')) {
    customElements.define('el-breadcrumb', ElBreadcrumb);
  }
}
