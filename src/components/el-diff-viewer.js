import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, computed } from '../signal.js';

/**
 * Computes a clean LCS-based line diff between two strings (zero dependencies).
 * @param {string} beforeText
 * @param {string} afterText
 * @returns {Array<{ type: 'same' | 'add' | 'remove', text: string, oldLine: number | null, newLine: number | null }>}
 */
export function computeLineDiff(beforeText = '', afterText = '') {
  const a = beforeText === '' ? [] : String(beforeText).split(/\r?\n/);
  const b = afterText === '' ? [] : String(afterText).split(/\r?\n/);
  const m = a.length;
  const n = b.length;

  // Build LCS table
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      rows.push({ type: 'same', text: a[i], oldLine: i + 1, newLine: j + 1 });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: 'remove', text: a[i], oldLine: i + 1, newLine: null });
      i++;
    } else {
      rows.push({ type: 'add', text: b[j], oldLine: null, newLine: j + 1 });
      j++;
    }
  }
  while (i < m) {
    rows.push({ type: 'remove', text: a[i], oldLine: i + 1, newLine: null });
    i++;
  }
  while (j < n) {
    rows.push({ type: 'add', text: b[j], oldLine: null, newLine: j + 1 });
    j++;
  }
  return rows;
}

/**
 * <el-diff-viewer>
 * AI-native code and config diff viewer with unified/split modes and optional HITL approval actions.
 *
 * @element el-diff-viewer
 * @attr {string} filename - File path or resource label
 * @attr {string} before - Original text content
 * @attr {string} after - Proposed text content
 * @attr {'unified' | 'split'} mode - View mode (default: 'unified')
 * @attr {boolean} approval - Show Accept / Reject HITL patch controls
 * @fires accept - Fired when user accepts the proposed diff
 * @fires reject - Fired when user rejects the proposed diff
 */
export class ElDiffViewer extends Elementum {
  static observedAttributes = ['filename', 'before', 'after', 'mode', 'approval'];

  filename = signal('changes.js');
  before = signal('');
  after = signal('');
  mode = signal('unified');
  approval = signal(false);

  diffRows = computed(() => computeLineDiff(this.before.value, this.after.value));
  stats = computed(() => {
    let added = 0;
    let removed = 0;
    for (const r of this.diffRows.value) {
      if (r.type === 'add') added++;
      else if (r.type === 'remove') removed++;
    }
    return { added, removed };
  });

  connected() {
    this.#sync();
  }

  attributeChanged() {
    this.#sync();
  }

  #sync() {
    if (this.hasAttribute('filename')) this.filename.value = this.getAttribute('filename') || 'changes.js';
    if (this.hasAttribute('before')) this.before.value = this.getAttribute('before') || '';
    if (this.hasAttribute('after')) this.after.value = this.getAttribute('after') || '';
    const m = this.getAttribute('mode');
    if (m === 'split' || m === 'unified') this.mode.value = m;
    this.approval.value = this.hasAttribute('approval') && this.getAttribute('approval') !== 'false';
  }

  setMode(nextMode) {
    if (nextMode !== 'unified' && nextMode !== 'split') return;
    this.mode.value = nextMode;
    this.setAttribute('mode', nextMode);
  }

  #onAccept = () => {
    this.emit('accept', {
      filename: this.filename.value,
      before: this.before.value,
      after: this.after.value,
    });
  };

  #onReject = () => {
    this.emit('reject', {
      filename: this.filename.value,
      before: this.before.value,
      after: this.after.value,
    });
  };

  static styles = css`
    :host {
      display: block;
      font-family: var(--el-font-sans, system-ui, -apple-system, sans-serif);
      box-sizing: border-box;
    }

    .diff-shell {
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 10px);
      background: var(--el-surface-card, #ffffff);
      overflow: hidden;
      box-shadow: var(--el-shadow-subtle, 0 1px 2px rgba(0, 0, 0, 0.04));
    }

    .diff-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      padding: 10px 14px;
      background: var(--el-surface-muted, #f8fafc);
      border-bottom: 1px solid var(--el-surface-border, #e2e8f0);
    }

    .file-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .filename {
      font-family: var(--el-font-mono, ui-monospace, monospace);
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--el-text-primary, #0f172a);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .stats {
      display: inline-flex;
      gap: 6px;
      font-family: var(--el-font-mono, ui-monospace, monospace);
      font-size: 0.75rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .stat-add {
      color: var(--el-color-success-text, #047857);
      background: var(--el-tint-success-bg, #d1fae5);
      padding: 2px 6px;
      border-radius: 9999px;
    }

    .stat-del {
      color: var(--el-color-danger-text, #b91c1c);
      background: var(--el-tint-danger-bg, #fee2e2);
      padding: 2px 6px;
      border-radius: 9999px;
    }

    .mode-switch {
      display: inline-flex;
      gap: 4px;
      background: var(--el-surface-card, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: 7px;
      padding: 2px;
    }

    .mode-btn,
    .action-btn {
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 140ms ease, color 140ms ease, transform 120ms var(--el-ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
    }

    .mode-btn {
      border: none;
      background: transparent;
      color: var(--el-text-secondary, #475569);
      padding: 4px 10px;
    }

    .mode-btn.active {
      background: var(--el-color-primary, #2563eb);
      color: #ffffff;
    }

    .mode-btn:active,
    .action-btn:active {
      transform: scale(0.97);
    }

    .diff-body {
      overflow-x: auto;
      font-family: var(--el-font-mono, ui-monospace, monospace);
      font-size: 0.8rem;
      line-height: 1.55;
      font-variant-numeric: tabular-nums;
    }

    .row {
      display: grid;
      grid-template-columns: 44px 44px 20px 1fr;
      padding: 1px 10px 1px 0;
      white-space: pre;
    }

    .row.add {
      background: rgba(16, 185, 129, 0.12);
    }

    .row.remove {
      background: rgba(239, 68, 68, 0.12);
    }

    .ln {
      text-align: right;
      padding: 0 8px;
      color: var(--el-text-muted, #94a3b8);
      user-select: none;
    }

    .sigil {
      text-align: center;
      font-weight: 700;
      user-select: none;
    }

    .row.add .sigil { color: #059669; }
    .row.remove .sigil { color: #dc2626; }

    .code-cell {
      color: var(--el-text-primary, #0f172a);
    }

    .split-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .split-col {
      min-width: 0;
      overflow-x: auto;
    }

    .split-col:first-child {
      border-right: 1px solid var(--el-surface-border, #e2e8f0);
    }

    .split-row {
      display: grid;
      grid-template-columns: 40px 1fr;
      padding: 1px 10px 1px 0;
      white-space: pre;
      min-height: 1.55em;
    }

    .split-row.remove { background: rgba(239, 68, 68, 0.12); }
    .split-row.add { background: rgba(16, 185, 129, 0.12); }

    .diff-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 10px 14px;
      border-top: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-muted, #f8fafc);
    }

    .action-btn {
      padding: 6px 12px;
      border: 1px solid transparent;
    }

    .btn-accept {
      background: var(--el-color-success, #10b981);
      color: #ffffff;
    }

    .btn-reject {
      background: var(--el-surface-base, #ffffff);
      color: var(--el-color-danger-text, #b91c1c);
      border-color: rgba(220, 38, 38, 0.35);
    }

    @media (prefers-reduced-motion: reduce) {
      .mode-btn, .action-btn { transition: none; }
      .mode-btn:active, .action-btn:active { transform: none; }
    }
  `;

  render() {
    return html`
      <div class="diff-shell" part="container">
        <div class="diff-header" part="header">
          <div class="file-meta">
            <span class="filename">${this.filename}</span>
            <span class="stats">
              <span class="stat-add">+${() => this.stats.value.added}</span>
              <span class="stat-del">-${() => this.stats.value.removed}</span>
            </span>
          </div>
          <div class="mode-switch" role="group" aria-label="Diff view mode">
            <button
              type="button"
              class=${() => `mode-btn ${this.mode.value === 'unified' ? 'active' : ''}`}
              @click=${() => this.setMode('unified')}
            >Unified</button>
            <button
              type="button"
              class=${() => `mode-btn ${this.mode.value === 'split' ? 'active' : ''}`}
              @click=${() => this.setMode('split')}
            >Split</button>
          </div>
        </div>

        <div class="diff-body" part="body">
          ${() => {
            const rows = this.diffRows.value;
            if (this.mode.value === 'split') {
              const leftRows = rows.filter((r) => r.type !== 'add');
              const rightRows = rows.filter((r) => r.type !== 'remove');
              return html`
                <div class="split-grid">
                  <div class="split-col">
                    ${leftRows.map(
                      (r) => html`
                        <div class=${`split-row ${r.type}`}>
                          <span class="ln">${r.oldLine ?? ''}</span>
                          <span class="code-cell">${r.text}</span>
                        </div>
                      `
                    )}
                  </div>
                  <div class="split-col">
                    ${rightRows.map(
                      (r) => html`
                        <div class=${`split-row ${r.type}`}>
                          <span class="ln">${r.newLine ?? ''}</span>
                          <span class="code-cell">${r.text}</span>
                        </div>
                      `
                    )}
                  </div>
                </div>
              `;
            }

            return rows.map((r) => {
              const sigil = r.type === 'add' ? '+' : r.type === 'remove' ? '-' : ' ';
              return html`
                <div class=${`row ${r.type}`}>
                  <span class="ln">${r.oldLine ?? ''}</span>
                  <span class="ln">${r.newLine ?? ''}</span>
                  <span class="sigil">${sigil}</span>
                  <span class="code-cell">${r.text}</span>
                </div>
              `;
            });
          }}
        </div>

        ${() =>
          this.approval.value
            ? html`
                <div class="diff-footer" part="footer">
                  <button type="button" class="action-btn btn-reject" @click=${this.#onReject}>Reject</button>
                  <button type="button" class="action-btn btn-accept" @click=${this.#onAccept}>Accept Patch</button>
                </div>
              `
            : ''}
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-diff-viewer')) {
  customElements.define('el-diff-viewer', ElDiffViewer);
}
