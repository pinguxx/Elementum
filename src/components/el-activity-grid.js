import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-activity-grid>
 * Daily activity heatmap grid in 7-day week columns with keyboard navigation,
 * intensity levels (0..4), and accessible live tooltips/labels.
 *
 * @element el-activity-grid
 * @attr {number} weeks - Number of 7-day columns (default: 12, range: 4..52)
 * @attr {'success' | 'primary' | 'accent'} variant - Intensity scale palette
 * @attr {string} label - Grid heading & ARIA label (default: 'Activity')
 * @attr {boolean} show-legend - Display Less/More scale legend
 * @fires select - Fired when a cell is activated: detail: { index, date, count, level }
 * @csspart container - Outer wrapper
 * @csspart grid - 7-row CSS Grid matrix
 * @csspart cell - Individual day button
 * @csspart legend - Optional Less/More legend row
 */
export class ElActivityGrid extends Elementum {
  static observedAttributes = ['weeks', 'variant', 'label', 'show-legend', 'data'];

  weeks = signal(12);
  variant = signal('success'); // 'success' | 'primary' | 'accent'
  label = signal('Activity');
  showLegend = signal(false);
  data = signal([]); // Array<{ date?: string, count?: number, level?: 0|1|2|3|4 }>
  selectedIndex = signal(0);

  connected() {
    this.#sync();
  }

  attributeChanged(name, oldVal, newVal) {
    if (name === 'data' && newVal !== oldVal && newVal) {
      try {
        const parsed = JSON.parse(newVal);
        if (Array.isArray(parsed)) this.data.value = parsed;
      } catch {
        // Ignore invalid JSON data attribute
      }
      return;
    }
    this.#sync();
  }

  #sync() {
    const rawWeeks = parseInt(this.getAttribute('weeks') || '', 10);
    this.weeks.value = Number.isFinite(rawWeeks) ? Math.max(4, Math.min(52, rawWeeks)) : 12;
    this.variant.value = this.getAttribute('variant') || 'success';
    this.label.value = this.getAttribute('label') || 'Activity';
    this.showLegend.value = this.hasAttribute('show-legend') && this.getAttribute('show-legend') !== 'false';
    const dataAttr = this.getAttribute('data');
    if (dataAttr) {
      try {
        const parsed = JSON.parse(dataAttr);
        if (Array.isArray(parsed)) this.data.value = parsed;
      } catch {
        // Ignore invalid JSON data attribute
      }
    }
  }

  #buildCells() {
    const total = this.weeks.value * 7;
    const entries = Array.isArray(this.data.value) ? this.data.value : [];
    const cells = [];
    for (let i = 0; i < total; i++) {
      const item = entries[i] || {};
      const rawLevel =
        item.level !== undefined
          ? Number(item.level)
          : item.count
            ? Math.min(4, Math.ceil(Number(item.count) / 3))
            : 0;
      const level = Math.max(0, Math.min(4, Math.round(rawLevel) || 0));
      const count = Number(item.count) || 0;
      const date = item.date ? String(item.date) : `Day ${i + 1}`;
      cells.push({ index: i, date, count, level });
    }
    return cells;
  }

  #onCellKeyDown = (e, index, total) => {
    let next = index;
    if (e.key === 'ArrowDown') next = Math.min(total - 1, index + 1);
    else if (e.key === 'ArrowUp') next = Math.max(0, index - 1);
    else if (e.key === 'ArrowRight') next = Math.min(total - 1, index + 7);
    else if (e.key === 'ArrowLeft') next = Math.max(0, index - 7);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = total - 1;
    else return;

    e.preventDefault();
    this.#focusCell(next);
  };

  static styles = css`
    :host {
      display: inline-block;
      box-sizing: border-box;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      --_tone: var(--el-color-success, #16a34a);
    }

    :host([variant='primary']) {
      --_tone: var(--el-color-primary, #2563eb);
    }

    :host([variant='accent']) {
      --_tone: var(--el-color-accent, #7c3aed);
    }

    .container {
      display: inline-flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: var(--el-surface-card, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 8px);
    }

    .header {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--el-text-primary, #0f172a);
    }

    .grid {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .row {
      display: flex;
      gap: 3px;
    }

    .cell,
    .swatch {
      width: 12px;
      height: 12px;
      padding: 0;
      border-radius: 3px;
      border: 1px solid var(--el-border-translucent, rgba(15, 23, 42, 0.08));
      background: var(--el-surface-muted, #f1f5f9);
      box-sizing: border-box;
    }

    .cell {
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.12s var(--el-ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
    }

    .cell:hover {
      transform: scale(1.18);
    }

    .cell:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: 1px;
    }

    [data-level='1'] {
      background: color-mix(in srgb, var(--_tone) 26%, var(--el-surface-muted, #f1f5f9));
    }

    [data-level='2'] {
      background: color-mix(in srgb, var(--_tone) 50%, var(--el-surface-muted, #f1f5f9));
    }

    [data-level='3'] {
      background: color-mix(in srgb, var(--_tone) 76%, var(--el-surface-muted, #f1f5f9));
    }

    [data-level='4'] {
      background: var(--_tone);
    }

    .legend {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      font-size: 0.72rem;
      color: var(--el-text-secondary, #475569);
    }

    @media (prefers-reduced-motion: reduce) {
      .cell {
        transition: none;
      }
      .cell:hover {
        transform: none;
      }
    }
  `;

  #focusCell(index) {
    this.selectedIndex.value = index;
    this.root?.querySelector(`[data-index="${index}"]`)?.focus();
  }

  render() {
    return html`
      <div class="container" part="container">
        <div class="header">${this.label}</div>
        <div class="grid" part="grid" role="grid" aria-label=${() => this.label.value}>
          ${() => {
            const cells = this.#buildCells();
            const cols = this.weeks.value;
            const rows = [];
            for (let r = 0; r < 7; r++) {
              const rowCells = [];
              for (let c = 0; c < cols; c++) {
                const cell = cells[c * 7 + r];
                if (cell) rowCells.push(cell);
              }
              rows.push(rowCells);
            }
            return rows.map(
              (rowCells) => html`
                <div class="row" role="row">
                  ${rowCells.map(
                    (cell) => html`
                      <button
                        type="button"
                        role="gridcell"
                        class="cell"
                        part="cell"
                        data-index=${String(cell.index)}
                        data-level=${String(cell.level)}
                        tabindex=${() => (this.selectedIndex.value === cell.index ? '0' : '-1')}
                        aria-label=${`${cell.date}: ${cell.count} events (level ${cell.level})`}
                        @keydown=${(e) => this.#onCellKeyDown(e, cell.index, cells.length)}
                        @click=${() => {
                          this.selectedIndex.value = cell.index;
                          this.emit('select', { index: cell.index, date: cell.date, count: cell.count, level: cell.level });
                        }}
                      ></button>
                    `
                  )}
                </div>
              `
            );
          }}
        </div>
        ${() =>
          this.showLegend.value
            ? html`
                <div class="legend" part="legend" aria-hidden="true">
                  <span>Less</span>
                  <span class="swatch" data-level="0"></span>
                  <span class="swatch" data-level="1"></span>
                  <span class="swatch" data-level="2"></span>
                  <span class="swatch" data-level="3"></span>
                  <span class="swatch" data-level="4"></span>
                  <span>More</span>
                </div>
              `
            : null}
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-activity-grid')) {
  customElements.define('el-activity-grid', ElActivityGrid);
}
