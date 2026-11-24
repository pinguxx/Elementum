import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, computed } from '../signal.js';

/**
 * <el-task-list>
 * Multi-step AI agent plan and execution progress tracker.
 *
 * @element el-task-list
 * @attr {string} heading - Plan heading (default: 'Agent Execution Plan')
 * @attr {string} tasks - JSON array of { id, label, status, detail?, duration? }
 * @attr {boolean} compact - Compact dense row mode
 */
export class ElTaskList extends Elementum {
  static observedAttributes = ['heading', 'tasks', 'compact'];

  heading = signal('Agent Execution Plan');
  tasks = signal([]);
  compact = signal(false);

  progress = computed(() => {
    const list = Array.isArray(this.tasks.value) ? this.tasks.value : [];
    const completed = list.filter((t) => t.status === 'completed').length;
    return { completed, total: list.length };
  });

  connected() {
    this.#sync();
  }

  attributeChanged() {
    this.#sync();
  }

  #sync() {
    if (this.hasAttribute('heading')) this.heading.value = this.getAttribute('heading') || 'Agent Execution Plan';
    this.compact.value = this.hasAttribute('compact') && this.getAttribute('compact') !== 'false';
    const raw = this.getAttribute('tasks');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) this.tasks.value = parsed;
      } catch {
        // Ignore invalid JSON
      }
    }
  }

  /**
   * Surgically updates or inserts a task by id (ideal for AG-UI STEP_STARTED / STEP_FINISHED).
   */
  updateTask(id, patch) {
    const list = Array.isArray(this.tasks.value) ? [...this.tasks.value] : [];
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) {
      list.push({ id, label: patch.label || id, status: patch.status || 'running', ...patch });
    } else {
      list[idx] = { ...list[idx], ...patch };
    }
    this.tasks.value = list;
  }

  static styles = css`
    :host {
      display: block;
      font-family: var(--el-font-sans, system-ui, -apple-system, sans-serif);
      box-sizing: border-box;
    }

    .task-card {
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 10px);
      background: var(--el-surface-base, #ffffff);
      overflow: hidden;
    }

    .task-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      background: var(--el-surface-muted, #f8fafc);
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
    }

    .title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--el-text-primary, #0f172a);
    }

    .counter {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--el-text-secondary, #475569);
      font-variant-numeric: tabular-nums;
    }

    .rows {
      list-style: none;
      margin: 0;
      padding: 6px 0;
    }

    .row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 14px;
      font-size: 0.85rem;
    }

    :host([compact]) .row {
      padding: 5px 12px;
      font-size: 0.8rem;
    }

    .status-icon {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      margin-top: 1px;
    }

    .status-completed { background: #d1fae5; color: #047857; }
    .status-running {
      background: #dbeafe;
      color: #1d4ed8;
      animation: el-task-pulse 1.2s ease-out infinite;
    }
    .status-error { background: #fee2e2; color: #b91c1c; }
    .status-pending, .status-skipped { background: #f1f5f9; color: #64748b; }

    @keyframes el-task-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.55; transform: scale(0.92); }
    }

    .row-main {
      flex: 1;
      min-width: 0;
    }

    .row-label {
      font-weight: 600;
      color: var(--el-text-primary, #0f172a);
    }

    .row.is-skipped .row-label {
      color: var(--el-text-muted, #94a3b8);
      text-decoration: line-through;
    }

    .row-detail {
      font-size: 0.76rem;
      color: var(--el-text-secondary, #64748b);
      margin-top: 2px;
    }

    .duration {
      flex-shrink: 0;
      font-family: var(--el-font-mono, ui-monospace, monospace);
      font-size: 0.72rem;
      color: var(--el-text-muted, #64748b);
      font-variant-numeric: tabular-nums;
    }

    :host-context([data-theme="dark"]) .task-card {
      background: #0f172a;
      border-color: #334155;
    }
    :host-context([data-theme="dark"]) .task-header {
      background: #1e293b;
      border-color: #334155;
    }
    :host-context([data-theme="dark"]) .title,
    :host-context([data-theme="dark"]) .row-label {
      color: #f8fafc;
    }
    :host-context([data-theme="dark"]) .counter,
    :host-context([data-theme="dark"]) .row-detail {
      color: #94a3b8;
    }

    @media (prefers-reduced-motion: reduce) {
      .status-running { animation: none; }
    }
  `;

  render() {
    return html`
      <div class="task-card" part="container">
        <div class="task-header" part="header">
          <span class="title">${this.heading}</span>
          <span class="counter">${() => `${this.progress.value.completed} / ${this.progress.value.total} completed`}</span>
        </div>
        <ul class="rows" role="list" part="list">
          ${() => {
            const list = Array.isArray(this.tasks.value) ? this.tasks.value : [];
            return list.map((t) => {
              const st = t.status || 'pending';
              const glyph = st === 'completed' ? '✓' : st === 'error' ? '✕' : st === 'running' ? '●' : '○';
              return html`
                <li class=${`row is-${st}`}>
                  <span class=${`status-icon status-${st}`} aria-label=${st}>${glyph}</span>
                  <div class="row-main">
                    <div class="row-label">${t.label || t.id}</div>
                    ${t.detail ? html`<div class="row-detail">${t.detail}</div>` : ''}
                  </div>
                  ${t.duration ? html`<span class="duration">${t.duration}</span>` : ''}
                </li>
              `;
            });
          }}
        </ul>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-task-list')) {
  customElements.define('el-task-list', ElTaskList);
}
