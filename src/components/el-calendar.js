/**
 * <el-calendar>
 * Standalone accessible calendar month-grid component.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, computed } from '../signal.js';
import { formatLocaleDate } from '../behaviors/index.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getLocalizedMonths(locale) {
  if (!locale || locale === 'en-US') return MONTH_NAMES;
  return Array.from({ length: 12 }, (_, m) =>
    formatLocaleDate(new Date(2026, m, 15), locale, { month: 'long' })
  );
}

function getLocalizedWeekdays(locale) {
  if (!locale || locale === 'en-US') return WEEKDAYS;
  // 2026-01-04 is a Sunday
  return Array.from({ length: 7 }, (_, d) =>
    formatLocaleDate(new Date(2026, 0, 4 + d), locale, { weekday: 'short' }).slice(0, 2)
  );
}

function padZero(n) {
  return n < 10 ? '0' + n : String(n);
}

function formatDateString(year, month, day) {
  return `${year}-${padZero(month + 1)}-${padZero(day)}`;
}

export class ElCalendar extends Elementum {
  static observedAttributes = ['value', 'min-year', 'max-year', 'locale'];

  value = signal(''); // 'YYYY-MM-DD'
  viewYear = signal(new Date().getFullYear());
  viewMonth = signal(new Date().getMonth()); // 0 - 11
  minYear = signal(new Date().getFullYear() - 50);
  maxYear = signal(new Date().getFullYear() + 20);
  locale = signal('en-US');

  monthTitle = computed(() => {
    const months = getLocalizedMonths(this.locale.value);
    return `${months[this.viewMonth.value]} ${this.viewYear.value}`;
  });

  static styles = css`
    :host {
      display: inline-block;
      user-select: none;
      font-family: inherit;
      width: 280px;
    }

    .calendar {
      display: flex;
      flex-direction: column;
      gap: var(--el-spacing-sm, 8px);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--el-spacing-xs, 4px);
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .header-select {
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--el-radius-sm, 4px);
      color: var(--el-text-base, #111827);
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      padding: 3px 6px;
      cursor: pointer;
      outline: none;
      transition: background-color 0.15s ease, border-color 0.15s ease;
      text-align: center;
    }

    .header-select:hover {
      background: var(--el-surface-muted, #f3f4f6);
      border-color: var(--el-surface-border, #e5e7eb);
    }

    .header-select:focus-visible {
      border-color: var(--el-color-primary, #2563eb);
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }

    .header-select option {
      background: var(--el-surface-base, #ffffff);
      color: var(--el-text-base, #111827);
      font-weight: 500;
    }

    :root[data-theme="dark"] .header-select option {
      background: #1e293b;
      color: #f8fafc;
    }

    .header-title {
      font-weight: 600;
      font-size: 0.9375rem;
      color: var(--el-text-base, #111827);
    }

    .nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid var(--el-surface-border, #e5e7eb);
      background: var(--el-surface-base, #ffffff);
      border-radius: var(--el-radius-sm, 4px);
      cursor: pointer;
      color: var(--el-text-base, #111827);
      font-size: 0.75rem;
      transition: background-color 0.15s ease;
    }

    .nav-btn:hover {
      background: var(--el-surface-muted, #f3f4f6);
    }

    .weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--el-text-muted, #6b7280);
      margin-bottom: var(--el-spacing-xs, 4px);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }

    .day {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      font-size: 0.8125rem;
      border: 1px solid transparent;
      border-radius: var(--el-radius-sm, 4px);
      background: transparent;
      cursor: pointer;
      color: var(--el-text-base, #111827);
      transition: background-color 0.12s ease;
      outline: none;
    }

    .day:hover:not(.disabled) {
      background: var(--el-surface-muted, #f3f4f6);
    }

    .day.other-month {
      color: var(--el-text-muted, #9ca3af);
      opacity: 0.5;
    }

    .day.today {
      font-weight: 700;
      border-color: var(--el-color-primary, #2563eb);
    }

    .day.selected {
      background: var(--el-color-primary, #2563eb) !important;
      color: var(--el-text-inverse, #ffffff) !important;
      font-weight: 600;
    }
  `;

  connected() {
    // If an initial value was provided, sync the initial view to it
    if (this.hasAttribute('min-year')) {
      const parsed = Number(this.getAttribute('min-year'));
      if (!isNaN(parsed)) this.minYear.value = parsed;
    }
    if (this.hasAttribute('max-year')) {
      const parsed = Number(this.getAttribute('max-year'));
      if (!isNaN(parsed)) this.maxYear.value = parsed;
    }
    if (this.hasAttribute('locale')) {
      this.locale.value = this.getAttribute('locale') || 'en-US';
    }
    if (this.value.value) {
      const parts = this.value.value.split('-').map(Number);
      if (parts.length === 3) {
        this.viewYear.value = parts[0];
        this.viewMonth.value = parts[1] - 1;
      }
    }
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value' && newValue) {
      this.value.value = newValue;
      const parts = newValue.split('-').map(Number);
      if (parts.length === 3) {
        this.viewYear.value = parts[0];
        this.viewMonth.value = parts[1] - 1;
      }
    } else if (name === 'min-year' && newValue) {
      const parsed = Number(newValue);
      if (!isNaN(parsed)) this.minYear.value = parsed;
    } else if (name === 'max-year' && newValue) {
      const parsed = Number(newValue);
      if (!isNaN(parsed)) this.maxYear.value = parsed;
    } else if (name === 'locale') {
      this.locale.value = newValue || 'en-US';
    }
    return true;
  }

  setMonth(m) {
    const month = Number(m);
    if (!isNaN(month) && month >= 0 && month <= 11) {
      this.viewMonth.value = month;
    }
  }

  setYear(y) {
    const year = Number(y);
    if (!isNaN(year)) {
      this.viewYear.value = year;
    }
  }

  #onMonthSelect = (e) => {
    this.setMonth(e.target.value);
  };

  #onYearSelect = (e) => {
    this.setYear(e.target.value);
  };

  #generateYears() {
    const currentYear = new Date().getFullYear();
    const min = Number(this.minYear.value) || (currentYear - 50);
    const max = Number(this.maxYear.value) || (currentYear + 20);
    const years = [];
    for (let y = min; y <= max; y++) {
      years.push(y);
    }
    return years;
  }

  prevMonth = () => {
    let m = this.viewMonth.value - 1;
    let y = this.viewYear.value;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    this.viewMonth.value = m;
    this.viewYear.value = y;
  };

  nextMonth = () => {
    let m = this.viewMonth.value + 1;
    let y = this.viewYear.value;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    this.viewMonth.value = m;
    this.viewYear.value = y;
  };

  #selectDate = (dateStr) => {
    this.value.value = dateStr;
    this.emit('select', { date: dateStr });
  };

  #generateDays() {
    const year = this.viewYear.value;
    const month = this.viewMonth.value;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = formatDateString(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    );

    const cells = [];

    // Previous month spillover days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = formatDateString(prevY, prevM, day);

      cells.push({
        day,
        dateStr,
        isOtherMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.value.value,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = formatDateString(year, month, day);
      cells.push({
        day,
        dateStr,
        isOtherMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.value.value,
      });
    }

    // Next month spillover days to reach 42 cells (6 rows x 7 columns)
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = formatDateString(nextY, nextM, day);

      cells.push({
        day,
        dateStr,
        isOtherMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.value.value,
      });
    }

    return cells;
  }

  render() {
    return html`
      <div class="calendar" part="calendar">
        <div class="header">
          <button type="button" class="nav-btn" @click=${this.prevMonth} aria-label="Previous Month">◀</button>
          <div class="header-controls">
            <select
              class="header-select month-select"
              aria-label="Select month"
              @change=${this.#onMonthSelect}
            >
              ${() =>
                getLocalizedMonths(this.locale.value).map(
                  (name, idx) => html`
                    <option
                      value="${idx}"
                      ?selected=${() => this.viewMonth.value === idx}
                    >
                      ${name}
                    </option>
                  `
                )}
            </select>
            <select
              class="header-select year-select"
              aria-label="Select year"
              @change=${this.#onYearSelect}
            >
              ${() =>
                this.#generateYears().map(
                  (y) => html`
                    <option
                      value="${y}"
                      ?selected=${() => this.viewYear.value === y}
                    >
                      ${y}
                    </option>
                  `
                )}
            </select>
          </div>
          <button type="button" class="nav-btn" @click=${this.nextMonth} aria-label="Next Month">▶</button>
        </div>

        <div class="weekdays">
          ${() => getLocalizedWeekdays(this.locale.value).map((w) => html`<div>${w}</div>`)}
        </div>

        <div class="grid" role="grid">
          ${() =>
            this.#generateDays().map(
              (cell) => html`
                <button
                  type="button"
                  class=${() =>
                    `day ${cell.isOtherMonth ? 'other-month' : ''} ${cell.isToday ? 'today' : ''} ${
                      cell.isSelected ? 'selected' : ''
                    }`}
                  aria-selected=${() => (cell.isSelected ? 'true' : 'false')}
                  @click=${() => this.#selectDate(cell.dateStr)}
                >
                  ${cell.day}
                </button>
              `
            )}
        </div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-calendar')) {
  customElements.define('el-calendar', ElCalendar);
}
