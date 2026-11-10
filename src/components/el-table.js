/**
 * <el-table>
 * Fine-grained reactive data table with column sorting and row selection.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, computed } from '../signal.js';

export class ElTable extends Elementum {
  static observedAttributes = ['selectable'];

  data = signal([]); // Array of objects
  columns = signal([]); // Array of { key, label, sortable, width }
  selectable = signal(false);
  selected = signal([]); // Array of selected row indices/keys
  sortKey = signal('');
  sortDirection = signal(''); // 'asc' | 'desc' | ''

  sortedData = computed(() => {
    const list = [...this.data.value];
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
      font-family: inherit;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
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

    tr:hover td {
      background: rgba(37, 99, 235, 0.04);
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
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'selectable') {
      this.selectable.value = newValue !== null && newValue !== 'false';
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
            ${() =>
              this.columns.value.map(
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
              )}
          </tr>
        </thead>
        <tbody>
          ${() =>
            this.sortedData.value.map(
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
                    this.columns.value.map(
                      (col) => html`<td>${row[col.key] ?? ''}</td>`
                    )}
                </tr>
              `
            )}
        </tbody>
      </table>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-table')) {
  customElements.define('el-table', ElTable);
}
