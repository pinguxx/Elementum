/**
 * <el-tool-call>
 * Agentic UI component for visualizing AG-UI tool call execution lifecycles
 * (TOOL_CALL_START -> TOOL_CALL_ARGS -> TOOL_CALL_END / TOOL_CALL_RESULT)
 * with collapsible JSON arguments, results, and Human-in-the-Loop (HITL) approval actions.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';
import './el-badge.js';

const STATUS_BADGES = {
  running: { variant: 'primary', label: 'Running', icon: '⚡' },
  'awaiting-approval': { variant: 'warning', label: 'Awaiting Approval', icon: '🛡️' },
  completed: { variant: 'success', label: 'Completed', icon: '✓' },
  error: { variant: 'danger', label: 'Error', icon: '✕' },
  rejected: { variant: 'danger', label: 'Rejected', icon: '✕' },
};

export class ElToolCall extends Elementum {
  static observedAttributes = ['name', 'status', 'args', 'result', 'call-id', 'approval', 'open'];

  name = signal('tool_call');
  // 'running' | 'awaiting-approval' | 'completed' | 'error' | 'rejected'
  status = signal('running');
  args = signal('');
  result = signal('');
  callId = signal('');
  approval = signal(false);
  open = signal(true);

  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--el-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .card {
      background: var(--el-surface-card, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-lg, 12px);
      overflow: hidden;
      box-shadow: var(--el-shadow-subtle, 0 1px 2px rgba(0, 0, 0, 0.05));
      color: var(--el-text-primary, #0f172a);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    :host([status="awaiting-approval"]) .card,
    :host([approval]) .card {
      border-color: rgba(245, 158, 11, 0.45);
      box-shadow: 0 4px 14px -4px rgba(245, 158, 11, 0.18);
    }

    :host([status="error"]) .card,
    :host([status="rejected"]) .card {
      border-color: rgba(239, 68, 68, 0.4);
    }

    .header-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      background: var(--el-surface-muted, #f8fafc);
      border: none;
      border-bottom: 1px solid transparent;
      color: var(--el-text-primary, #0f172a);
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      text-align: left;
      cursor: pointer;
      box-sizing: border-box;
      transition: background-color 0.15s ease;
    }

    .header-btn:hover {
      background: var(--el-step-4, var(--el-surface-border, #e2e8f0));
    }

    .header-btn[aria-expanded="true"] {
      border-bottom-color: var(--el-surface-border, #e2e8f0);
    }

    .header-btn:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: -2px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1 1 auto;
    }

    .status-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: rgba(37, 99, 235, 0.12);
      font-size: 0.78rem;
      flex-shrink: 0;
    }

    :host([status="running"]) .status-icon {
      animation: el-tool-pulse 1.4s ease-in-out infinite;
    }

    @keyframes el-tool-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.08); opacity: 0.65; }
    }

    .tool-name {
      font-family: var(--el-font-mono, ui-monospace, monospace);
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--el-text-primary, #0f172a);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .call-id {
      font-family: var(--el-font-mono, ui-monospace, monospace);
      font-size: 0.72rem;
      color: var(--el-text-muted, #64748b);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .chevron {
      font-size: 0.72rem;
      color: var(--el-text-muted, #64748b);
      transition: transform 0.2s ease;
    }

    .header-btn[aria-expanded="true"] .chevron {
      transform: rotate(180deg);
    }

    .tool-body {
      display: none;
      flex-direction: column;
      gap: 12px;
      padding: 14px;
    }

    .tool-body.open {
      display: flex;
    }

    .section-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--el-text-muted, #64748b);
      margin-bottom: 5px;
    }

    .payload-box {
      margin: 0;
      padding: 10px 12px;
      border-radius: var(--el-radius-md, 8px);
      background: #0f172a;
      color: #e2e8f0;
      border: 1px solid #1e293b;
      font-family: var(--el-font-mono, ui-monospace, monospace);
      font-size: 0.78rem;
      line-height: 1.5;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .result-box {
      border-left: 3px solid var(--el-color-success, #16a34a);
    }

    .hitl-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--el-radius-md, 8px);
      background: rgba(245, 158, 11, 0.09);
      border: 1px solid rgba(245, 158, 11, 0.25);
      font-size: 0.8125rem;
    }

    .hitl-prompt {
      font-weight: 600;
      color: var(--el-text-primary, #0f172a);
    }

    .hitl-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .hitl-btn {
      padding: 6px 12px;
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background-color 0.15s ease, transform 0.1s ease;
    }

    .approve-btn {
      background: var(--el-color-success, #16a34a);
      color: #ffffff;
    }

    .approve-btn:hover {
      background: #15803d;
    }

    .reject-btn {
      background: var(--el-surface-card, #ffffff);
      color: var(--el-color-danger-text, #b91c1c);
      border-color: rgba(220, 38, 38, 0.35);
    }

    .reject-btn:hover {
      background: rgba(220, 38, 38, 0.1);
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  #statusInfo() {
    const key = String(this.status.value || 'running').toLowerCase();
    return STATUS_BADGES[key] || STATUS_BADGES.running;
  }

  #formatPayload(raw) {
    if (raw === null || raw === undefined || raw === '') return '';
    if (typeof raw === 'object') return JSON.stringify(raw, null, 2);
    const trimmed = String(raw).trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  toggleOpen() {
    this.open.value = !this.open.value;
    this.emit('toggle', { open: this.open.value });
  }

  approveTool(e) {
    if (e) e.stopPropagation();
    this.status.value = 'completed';
    this.approval.value = false;
    this.emit('approve', {
      callId: this.callId.value,
      name: this.name.value,
      args: this.args.value,
    });
  }

  rejectTool(e) {
    if (e) e.stopPropagation();
    this.status.value = 'rejected';
    this.approval.value = false;
    this.emit('reject', {
      callId: this.callId.value,
      name: this.name.value,
      args: this.args.value,
    });
  }

  render() {
    return html`
      <div class="card" part="container">
        <button
          type="button"
          class="header-btn"
          part="header"
          aria-expanded=${() => (this.open.value ? 'true' : 'false')}
          onclick=${() => this.toggleOpen()}
        >
          <span class="header-left">
            <span class="status-icon" part="icon" aria-hidden="true">${() => this.#statusInfo().icon}</span>
            <span class="tool-name" part="name">${() => this.name.value || 'tool_call'}</span>
            ${() => (this.callId.value ? html`<span class="call-id">#${() => this.callId.value}</span>` : '')}
          </span>
          <span class="header-right">
            <el-badge
              part="badge"
              size="sm"
              variant=${() => this.#statusInfo().variant}
              count=${() => this.#statusInfo().label}
            ></el-badge>
            <span class="chevron" aria-hidden="true">▾</span>
          </span>
        </button>

        <div class=${() => (this.open.value ? 'tool-body open' : 'tool-body')} part="body">
          <div>
            <div class="section-label">Arguments</div>
            <pre class="payload-box" part="args"><code>${() => this.#formatPayload(this.args.value) || '{}'}</code></pre>
          </div>

          ${() =>
            this.result.value
              ? html`
                  <div>
                    <div class="section-label">Result</div>
                    <pre class="payload-box result-box" part="result"><code>${() => this.#formatPayload(this.result.value)}</code></pre>
                  </div>
                `
              : ''}

          <slot></slot>

          ${() =>
            this.approval.value || this.status.value === 'awaiting-approval'
              ? html`
                  <div class="hitl-footer" part="approval">
                    <span class="hitl-prompt">Human-in-the-Loop approval required</span>
                    <div class="hitl-actions">
                      <button
                        type="button"
                        class="hitl-btn reject-btn"
                        part="reject-button"
                        onclick=${(e) => this.rejectTool(e)}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        class="hitl-btn approve-btn"
                        part="approve-button"
                        onclick=${(e) => this.approveTool(e)}
                      >
                        Approve Execution
                      </button>
                      <slot name="actions"></slot>
                    </div>
                  </div>
                `
              : ''}
        </div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-tool-call')) {
  customElements.define('el-tool-call', ElToolCall);
}
