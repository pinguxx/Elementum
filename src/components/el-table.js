/**
 * <el-table>
 * Fine-grained reactive data table with column sorting and row selection.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, computed } from '../signal.js';

export class ElTable extends Elementum {
  static observedAttributes = ['selectable', 'data', 'columns', 'hover', 'striped'];

  selectable = signal(false);
  hover = signal(false);
  striped = signal(false);
  selected = signal([]); // Array of selected row indices/keys
  sortKey = signal('');
  sortDirection = signal(''); // 'asc' | 'desc' | ''

  #dataSignal = signal([]);
  #columnsSignal = signal([]);

  constructor() {
    super();
    Object.defineProperty(this, 'data', {
      get: () => this.#dataSignal,
      set: (val) => {
        this.#applyData(val);
      },
      configurable: true
    });

    Object.defineProperty(this, 'columns', {
      get: () => this.#columnsSignal,
      set: (val) => {
        this.#applyColumns(val);
      },
      configurable: true
    });
  }

  get tableData() {
    return this.#dataSignal.value;
  }

  set tableData(val) {
    this.#applyData(val);
  }

  get tableColumns() {
    return this.#columnsSignal.value;
  }

  set tableColumns(val) {
    this.#applyColumns(val);
  }

  #applyData(val) {
    let list = [];
    if (Array.isArray(val)) {
      list = val;
    } else if (typeof val === 'string') {
      try {
        list = JSON.parse(val);
      } catch {
        list = [];
      }
    }
    this.#dataSignal.value = list;

    // Auto-infer columns if not already defined
    if ((!this.#columnsSignal.value || this.#columnsSignal.value.length === 0) && list.length > 0) {
      const first = list[0];
      if (first && typeof first === 'object') {
        this.#columnsSignal.value = Object.keys(first).map((key) => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          sortable: true
        }));
      }
    }
  }

  #applyColumns(val) {
    let cols = [];
    if (Array.isArray(val)) {
      cols = val;
    } else if (typeof val === 'string') {
      try {
        cols = JSON.parse(val);
      } catch {
        cols = [];
      }
    }
    this.#columnsSignal.value = cols;
  }

  sortedData = computed(() => {
    const raw = this.#dataSignal.value;
    const list = Array.isArray(raw) ? [...raw] : [];
    const key = this.sortKey.value;
    const dir = this.sortDirection.value;

    if (!key || !dir) return list;

    return list.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return dir === 'desc' ? -comparison : comparison;
    });
  });

  static styles = css`
    :host {
      display: block;
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      font-family: inherit;
    }

    table {
      width: 100%;
      min-width: 480px;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
      font-variant-numeric: tabular-nums;
      color: var(--el-text-base, #111827);
    }

    th {
      background: var(--el-surface-muted, #f8fafc);
      padding: 12px 16px;
      font-weight: 600;
      color: var(--el-text-muted, #475569);
      border-bottom: 2px solid var(--el-surface-border, #e2e8f0);
      user-select: none;
    }

    th.sortable {
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    th.sortable:hover {
      background: var(--el-surface-border, #e2e8f0);
    }

    .sort-icon {
      display: inline-block;
      margin-left: 6px;
      font-size: 0.75rem;
      color: var(--el-text-muted, #94a3b8);
    }

    .sort-icon.active {
      color: var(--el-color-primary, #2563eb);
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-surface-border, #f1f5f9);
      transition: background-color 0.1s ease;
    }

    :host([striped]) tbody tr:nth-child(even) td {
      background: var(--el-surface-muted, #f8fafc);
    }

    :host([hover]) tbody tr:hover td {
      background: rgba(37, 99, 235, 0.08);
      cursor: pointer;
    }

    :host([hover][striped]) tbody tr:nth-child(even):hover td {
      background: rgba(37, 99, 235, 0.12);
    }

    tr.selected td {
      background: rgba(37, 99, 235, 0.08);
    }

    .checkbox-cell {
      width: 40px;
      text-align: center;
      padding-left: 12px;
      padding-right: 8px;
    }

    input[type="checkbox"] {
      cursor: pointer;
      width: 16px;
      height: 16px;
      accent-color: var(--el-color-primary, #2563eb);
    }
  `;

  connected() {
    this.selectable.value = this.hasAttribute('selectable');
    this.hover.value = this.hasAttribute('hover');
    this.striped.value = this.hasAttribute('striped');
    if (this.hasAttribute('columns')) {
      this.#applyColumns(this.getAttribute('columns'));
    }
    if (this.hasAttribute('data')) {
      this.#applyData(this.getAttribute('data'));
    } else if (this.#dataSignal.value.length === 0) {
      const slottedTable = this.querySelector('table');
      if (slottedTable) {
        const headers = Array.from(slottedTable.querySelectorAll('thead th, tr:first-child th')).map((th, i) => {
          const text = th.textContent.trim();
          return {
            key: th.getAttribute('data-key') || text.toLowerCase().replace(/[^a-z0-9_]/g, '_') || `col_${i}`,
            label: text || `Column ${i + 1}`,
            sortable: true
          };
        });
        const rows = Array.from(slottedTable.querySelectorAll('tbody tr')).map(tr => {
          const cells = Array.from(tr.querySelectorAll('td'));
          const rowObj = {};
          cells.forEach((td, i) => {
            const key = headers[i]?.key || `col_${i}`;
            rowObj[key] = td.textContent.trim();
          });
          return rowObj;
        });
        if (headers.length > 0) this.#columnsSignal.value = headers;
        if (rows.length > 0) this.#dataSignal.value = rows;
        slottedTable.style.display = 'none';
      }
    }
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'selectable') {
      this.selectable.value = newValue !== null && newValue !== 'false';
      return true;
    } else if (name === 'hover') {
      this.hover.value = newValue !== null && newValue !== 'false';
      return true;
    } else if (name === 'striped') {
      this.striped.value = newValue !== null && newValue !== 'false';
      return true;
    } else if (name === 'data') {
      this.#applyData(newValue);
      return true;
    } else if (name === 'columns') {
      this.#applyColumns(newValue);
      return true;
    }
  }

  sortBy(key) {
    if (this.sortKey.value === key) {
      if (this.sortDirection.value === 'asc') {
        this.sortDirection.value = 'desc';
      } else if (this.sortDirection.value === 'desc') {
        this.sortKey.value = '';
        this.sortDirection.value = '';
      }
    } else {
      this.sortKey.value = key;
      this.sortDirection.value = 'asc';
    }

    this.emit('sort', {
      key: this.sortKey.value,
      direction: this.sortDirection.value,
    });
  }

  toggleSelectAll() {
    const dataList = this.sortedData.value;
    if (this.selected.value.length === dataList.length && dataList.length > 0) {
      this.selected.value = [];
    } else {
      this.selected.value = dataList.map((_, i) => i);
    }
    this.emit('selectionchange', { selected: this.selected.value });
  }

  toggleRow(index) {
    const cur = [...this.selected.value];
    const exists = cur.indexOf(index);
    if (exists > -1) {
      cur.splice(exists, 1);
    } else {
      cur.push(index);
    }
    this.selected.value = cur;
    this.emit('selectionchange', { selected: this.selected.value });
  }

  isRowSelected(index) {
    return this.selected.value.includes(index);
  }

  render() {
    return html`
      <table part="table">
        <thead>
          <tr>
            ${() =>
              this.selectable.value
                ? html`
                    <th class="checkbox-cell">
                      <input
                        type="checkbox"
                        .checked=${() =>
                          this.data.value.length > 0 &&
                          this.selected.value.length === this.data.value.length}
                        @change=${() => this.toggleSelectAll()}
                      />
                    </th>
                  `
                : ''}
            ${() => {
              const cols = Array.isArray(this.columns.value) ? this.columns.value : [];
              return cols.map(
                (col) => html`
                  <th
                    class=${col.sortable ? 'sortable' : ''}
                    style=${col.width ? `width: ${col.width};` : ''}
                    @click=${col.sortable ? () => this.sortBy(col.key) : null}
                  >
                    ${col.label || col.key}
                    ${() =>
                      col.sortable
                        ? html`
                            <span
                              class=${() =>
                                `sort-icon ${this.sortKey.value === col.key ? 'active' : ''}`}
                            >
                              ${() =>
                                this.sortKey.value === col.key
                                  ? this.sortDirection.value === 'asc'
                                    ? '▲'
                                    : '▼'
                                  : '⇅'}
                            </span>
                          `
                        : ''}
                  </th>
                `
              );
            }}
          </tr>
        </thead>
        <tbody>
          ${() => {
            const rows = Array.isArray(this.sortedData.value) ? this.sortedData.value : [];
            const cols = Array.isArray(this.columns.value) ? this.columns.value : [];
            return rows.map(
              (row, idx) => html`
                <tr class=${() => (this.isRowSelected(idx) ? 'selected' : '')}>
                  ${() =>
                    this.selectable.value
                      ? html`
                          <td class="checkbox-cell">
                            <input
                              type="checkbox"
                              .checked=${() => this.isRowSelected(idx)}
                              @change=${() => this.toggleRow(idx)}
                            />
                          </td>
                        `
                      : ''}
                  ${() =>
                    cols.map(
                      (col) => html`<td>${row[col.key] ?? ''}</td>`
                    )}
                </tr>
              `
            );
          }}
        </tbody>
      </table>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-table')) {
  customElements.define('el-table', ElTable);
}
