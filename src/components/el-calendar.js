/**
 * <el-calendar>
 * Standalone accessible calendar month-grid component.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, computed } from '../signal.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function padZero(n) {
  return n < 10 ? '0' + n : String(n);
}

function formatDateString(year, month, day) {
  return `${year}-${padZero(month + 1)}-${padZero(day)}`;
}

export class ElCalendar extends Elementum {
  static observedAttributes = ['value'];

  value = signal(''); // 'YYYY-MM-DD'
  viewYear = signal(new Date().getFullYear());
  viewMonth = signal(new Date().getMonth()); // 0 - 11

  monthTitle = computed(() => {
    return `${MONTH_NAMES[this.viewMonth.value]} ${this.viewYear.value}`;
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
    if (this.value.value) {
      const parts = this.value.value.split('-').map(Number);
      if (parts.length === 3) {
        this.viewYear.value = parts[0];
        this.viewMonth.value = parts[1] - 1;
      }
    }
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
          <span class="header-title">${this.monthTitle}</span>
          <button type="button" class="nav-btn" @click=${this.nextMonth} aria-label="Next Month">▶</button>
        </div>

        <div class="weekdays">
          ${WEEKDAYS.map((w) => html`<div>${w}</div>`)}
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
