import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, computed } from '../signal.js';

export class ElPagination extends Elementum {
  static observedAttributes = ['page', 'total', 'page-size', 'sibling-count'];

  page = signal(1);
  total = signal(0);
  pageSize = signal(10);
  siblingCount = signal(1);

  totalPages = computed(() => {
    const size = Math.max(1, Number(this.pageSize.value) || 10);
    const tot = Math.max(0, Number(this.total.value) || 0);
    return Math.max(1, Math.ceil(tot / size));
  });

  connected() {
    this.#syncValues();
  }

  attributeChanged(name, oldValue, newValue) {
    this.#syncValues();
  }

  #syncValues() {
    const rawPage = this.getAttribute('page');
    const rawTotal = this.getAttribute('total');
    const rawSize = this.getAttribute('page-size');
    const rawSiblings = this.getAttribute('sibling-count');

    if (rawPage !== null) this.page.value = Math.max(1, Number(rawPage) || 1);
    if (rawTotal !== null) this.total.value = Math.max(0, Number(rawTotal) || 0);
    if (rawSize !== null) this.pageSize.value = Math.max(1, Number(rawSize) || 10);
    if (rawSiblings !== null) this.siblingCount.value = Math.max(1, Number(rawSiblings) || 1);
  }

  setPage(p) {
    const target = Math.min(this.totalPages.value, Math.max(1, Number(p) || 1));
    if (this.page.value !== target) {
      this.page.value = target;
      this.setAttribute('page', String(target));
      this.emit('pagechange', { page: target, pageSize: this.pageSize.value });
    }
  }

  next() {
    if (this.page.value < this.totalPages.value) {
      this.setPage(this.page.value + 1);
    }
  }

  prev() {
    if (this.page.value > 1) {
      this.setPage(this.page.value - 1);
    }
  }

  #computePageRange() {
    const total = this.totalPages.value;
    const current = this.page.value;
    const siblings = this.siblingCount.value;

    const totalPageNumbers = siblings * 2 + 5; // 1 + siblings + current + siblings + last + 2*dots

    if (total <= totalPageNumbers) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(current - siblings, 1);
    const rightSiblingIndex = Math.min(current + siblings, total);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < total - 2;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblings;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', total];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblings;
      const rightRange = Array.from({ length: rightItemCount }, (_, i) => total - rightItemCount + 1 + i);
      return [1, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, '...', ...middleRange, '...', total];
    }

    return Array.from({ length: total }, (_, i) => i + 1);
  }

  static styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
      user-select: none;
    }

    nav {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }

    .page-btn,
    .nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 34px;
      height: 34px;
      padding: 0 8px;
      border: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-card, #ffffff);
      color: var(--el-text-primary, #0f172a);
      border-radius: var(--el-radius-md, 8px);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      box-sizing: border-box;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      font-family: inherit;
    }

    .page-btn:hover:not(:disabled):not(.active),
    .nav-btn:hover:not(:disabled) {
      background: var(--el-surface-muted, #f1f5f9);
      border-color: #cbd5e1;
    }

    .page-btn.active {
      background: var(--el-color-primary, #2563eb);
      color: #ffffff;
      border-color: var(--el-color-primary, #2563eb);
      font-weight: 600;
    }

    .page-btn:focus-visible,
    .nav-btn:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: 1px;
    }

    .nav-btn:disabled,
    .page-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      background: var(--el-surface-muted, #f8fafc);
    }

    .ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 34px;
      height: 34px;
      color: var(--el-text-muted, #64748b);
      font-size: 0.875rem;
    }
  `;

  render() {
    const isFirstPage = () => this.page.value <= 1;
    const isLastPage = () => this.page.value >= this.totalPages.value;
    const items = () => this.#computePageRange();

    return html`
      <nav role="navigation" aria-label="Pagination" part="pagination">
        <button
          type="button"
          class="nav-btn prev-btn"
          part="prev-button"
          aria-label="Go to previous page"
          ?disabled=${isFirstPage}
          @click=${() => this.prev()}
        >
          ‹
        </button>

        ${() =>
          items().map((item) => {
            if (item === '...') {
              return html`<span class="ellipsis" aria-hidden="true">…</span>`;
            }
            const isActive = this.page.value === item;
            return html`
              <button
                type="button"
                class=${() => `page-btn ${isActive ? 'active' : ''}`}
                part=${isActive ? 'page-button active-page' : 'page-button'}
                aria-label=${`Go to page ${item}`}
                aria-current=${isActive ? 'page' : null}
                @click=${() => this.setPage(item)}
              >
                ${item}
              </button>
            `;
          })}

        <button
          type="button"
          class="nav-btn next-btn"
          part="next-button"
          aria-label="Go to next page"
          ?disabled=${isLastPage}
          @click=${() => this.next()}
        >
          ›
        </button>
      </nav>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-pagination')) {
  customElements.define('el-pagination', ElPagination);
}
