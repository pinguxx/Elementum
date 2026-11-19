/**
 * <el-datepicker>
 * Composite Datepicker combining <el-dropdown>, <el-input>, <el-calendar>, and <el-button>.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';
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
  static observedAttributes = ['value', 'placeholder', 'disabled', 'required'];

  value = signal('');
  placeholder = signal('Select date...');
  disabled = signal(false);
  required = signal(false);

  connected() {
    this.required.value = this.hasAttribute('required');
    this.setFormValue(this.value.value);
    this.validate();
  }

  formReset() {
    this.value.value = this.getAttribute('value') || '';
    this.setFormValue(this.value.value);
    this.validate();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value') {
      this.value.value = newValue ?? '';
      this.setFormValue(this.value.value);
      this.validate();
    } else if (name === 'placeholder') {
      this.placeholder.value = newValue ?? 'Select date...';
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
    } else if (name === 'required') {
      this.required.value = newValue !== null && newValue !== 'false';
      this.validate();
    }
  }

  validate() {
    const val = String(this.value.value || '');
    if (this.required.value && !val.trim()) {
      this.setValidity({ valueMissing: true }, 'Please select a date.');
      this.setAttribute('aria-invalid', 'true');
      return false;
    }
    this.setValidity({});
    this.removeAttribute('aria-invalid');
    return true;
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
    this.validate();
    this.emit('change', { value: selected });
    this.#getDropdown()?.close();
  };

  #selectToday = () => {
    const today = getTodayString();
    this.value.value = today;
    this.setFormValue(today);
    this.validate();
    this.emit('change', { value: today });
    this.#getDropdown()?.close();
  };

  #clear = (e) => {
    e?.stopPropagation();
    this.value.value = '';
    this.setFormValue('');
    this.validate();
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
