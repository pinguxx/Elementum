/**
 * <el-datepicker>
 * Composite Datepicker combining <el-dropdown>, <el-input>, <el-calendar>, and <el-button>.
 */

import { Elementum, html, css, signal } from '../index.js';
import './el-dropdown.js';
import './el-input.js';
import './el-calendar.js';
import './el-button.js';

function getTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export class ElDatepicker extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['value', 'placeholder', 'disabled'];

  value = signal('');
  placeholder = signal('Select date...');
  disabled = signal(false);

  connected() {
    this.setFormValue(this.value.value);
  }

  formReset() {
    this.value.value = '';
    this.setFormValue('');
  }

  static styles = css`
    :host {
      display: inline-block;
      font-family: inherit;
    }

    el-dropdown {
      width: 100%;
    }

    .calendar-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: var(--el-spacing-sm, 8px);
      padding-top: var(--el-spacing-xs, 4px);
      border-top: 1px solid var(--el-surface-border, #e5e7eb);
    }

    .icon-prefix {
      font-size: 1rem;
      cursor: pointer;
    }

    .clear-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--el-text-muted, #6b7280);
      padding: 2px 6px;
      border-radius: var(--el-radius-sm, 4px);
    }

    .clear-btn:hover {
      background: var(--el-surface-muted, #f3f4f6);
      color: var(--el-text-base, #111827);
    }
  `;

  #getDropdown() {
    return this.root.querySelector('el-dropdown');
  }

  #onDateSelect = (e) => {
    const selected = e.detail.date;
    this.value.value = selected;
    this.setFormValue(selected);
    this.emit('change', { value: selected });
    this.#getDropdown()?.close();
  };

  #selectToday = () => {
    const today = getTodayString();
    this.value.value = today;
    this.setFormValue(today);
    this.emit('change', { value: today });
    this.#getDropdown()?.close();
  };

  #clear = (e) => {
    e?.stopPropagation();
    this.value.value = '';
    this.setFormValue('');
    this.emit('change', { value: '' });
  };

  render() {
    return html`
      <el-dropdown part="dropdown">
        <!-- TRIGGER: The Input Component -->
        <el-input
          slot="trigger"
          part="input"
          readonly
          .value=${this.value}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled}
        >
          <span slot="prefix" class="icon-prefix">📅</span>
          ${() =>
            this.value.value
              ? html`
                  <button
                    slot="suffix"
                    type="button"
                    class="clear-btn"
                    title="Clear date"
                    @click=${this.#clear}
                  >
                    ✕
                  </button>
                `
              : ''}
        </el-input>

        <!-- DROPDOWN CONTENT: Calendar & Quick Action Buttons -->
        <div part="panel-content">
          <el-calendar
            .value=${this.value}
            @select=${this.#onDateSelect}
          ></el-calendar>

          <div class="calendar-footer">
            <el-button
              variant="ghost"
              size="sm"
              @click=${this.#clear}
            >
              Clear
            </el-button>
            <el-button
              variant="primary"
              size="sm"
              @click=${this.#selectToday}
            >
              Today
            </el-button>
          </div>
        </div>
      </el-dropdown>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-datepicker')) {
  customElements.define('el-datepicker', ElDatepicker);
}
