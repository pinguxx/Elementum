import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-insight-card>
 * Structured AI insight / artifact card with metric delta, CTA action, and thumbs feedback.
 *
 * @element el-insight-card
 * @attr {string} title - Insight heading
 * @attr {string} category - Category badge (e.g. 'Anomaly', 'Optimization', 'Artifact')
 * @attr {string} metric - Optional key figure (e.g. '$1,420/mo')
 * @attr {string} delta - Optional delta label (e.g. '-18.4%')
 * @attr {'info' | 'success' | 'warning' | 'danger'} variant - Semantic accent
 * @attr {string} summary - Short explanation text
 * @attr {string} action-label - Optional primary CTA button label
 * @fires action - Fired when CTA button is clicked
 * @fires feedback - Fired when thumbs up/down is toggled ({ vote: 'up' | 'down' | null })
 */
export class ElInsightCard extends Elementum {
  static observedAttributes = ['title', 'category', 'metric', 'delta', 'variant', 'summary', 'action-label'];

  title = signal('AI Insight');
  category = signal('Insight');
  metric = signal('');
  delta = signal('');
  variant = signal('info');
  summary = signal('');
  actionLabel = signal('');
  vote = signal(null);

  connected() {
    this.#sync();
  }

  attributeChanged() {
    this.#sync();
  }

  #sync() {
    if (this.hasAttribute('title')) this.title.value = this.getAttribute('title') || 'AI Insight';
    if (this.hasAttribute('category')) this.category.value = this.getAttribute('category') || 'Insight';
    if (this.hasAttribute('metric')) this.metric.value = this.getAttribute('metric') || '';
    if (this.hasAttribute('delta')) this.delta.value = this.getAttribute('delta') || '';
    if (this.hasAttribute('variant')) this.variant.value = this.getAttribute('variant') || 'info';
    if (this.hasAttribute('summary')) this.summary.value = this.getAttribute('summary') || '';
    if (this.hasAttribute('action-label')) this.actionLabel.value = this.getAttribute('action-label') || '';
  }

  #onAction = () => {
    this.emit('action', { title: this.title.value, metric: this.metric.value });
  };

  #toggleVote(nextVote) {
    const resolved = this.vote.value === nextVote ? null : nextVote;
    this.vote.value = resolved;
    this.emit('feedback', { vote: resolved, title: this.title.value });
  }

  static styles = css`
    :host {
      display: block;
      font-family: var(--el-font-sans, system-ui, -apple-system, sans-serif);
      box-sizing: border-box;
    }

    .card {
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 12px);
      background: var(--el-surface-card, #ffffff);
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: var(--el-shadow-card, 0 1px 3px rgba(0, 0, 0, 0.05));
    }

    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .cat-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 9px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .v-info { background: #dbeafe; color: #1d4ed8; }
    .v-success { background: #d1fae5; color: #047857; }
    .v-warning { background: #fef3c7; color: #b45309; }
    .v-danger { background: #fee2e2; color: #b91c1c; }

    .heading {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--el-text-primary, #0f172a);
    }

    .metric-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      font-variant-numeric: tabular-nums;
    }

    .metric-val {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--el-text-primary, #0f172a);
    }

    .metric-delta {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--el-text-secondary, #475569);
    }

    .summary {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.5;
      color: var(--el-text-secondary, #475569);
      max-width: 65ch;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding-top: 6px;
      border-top: 1px solid var(--el-surface-border, #f1f5f9);
    }

    .cta-btn,
    .vote-btn {
      font-family: inherit;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 140ms ease, border-color 140ms ease, transform 120ms var(--el-ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
    }

    .cta-btn {
      padding: 6px 12px;
      border-radius: 7px;
      border: none;
      background: var(--el-color-primary, #2563eb);
      color: #ffffff;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .cta-btn:active,
    .vote-btn:active {
      transform: scale(0.97);
    }

    .feedback-group {
      display: inline-flex;
      gap: 6px;
      margin-left: auto;
    }

    .vote-btn {
      padding: 4px 9px;
      border-radius: 7px;
      border: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-elevated, #ffffff);
      color: var(--el-text-secondary, #475569);
      font-size: 0.78rem;
    }

    .vote-btn.active {
      border-color: var(--el-color-primary, #2563eb);
      background: #eff6ff;
      color: #1d4ed8;
    }

    @media (prefers-reduced-motion: reduce) {
      .cta-btn, .vote-btn { transition: none; }
      .cta-btn:active, .vote-btn:active { transform: none; }
    }
  `;

  render() {
    return html`
      <article class="card" part="card">
        <div class="top-row">
          <span class=${() => `cat-pill v-${this.variant.value}`}>${this.category}</span>
        </div>
        <h3 class="heading">${this.title}</h3>
        ${() =>
          this.metric.value
            ? html`
                <div class="metric-row">
                  <span class="metric-val">${this.metric}</span>
                  ${() => (this.delta.value ? html`<span class="metric-delta">${this.delta}</span>` : '')}
                </div>
              `
            : ''}
        ${() => (this.summary.value ? html`<p class="summary">${this.summary}</p>` : '')}
        <slot></slot>
        <div class="footer">
          ${() =>
            this.actionLabel.value
              ? html`<button type="button" class="cta-btn" @click=${this.#onAction}>${this.actionLabel}</button>`
              : ''}
          <div class="feedback-group" role="group" aria-label="Insight feedback">
            <button
              type="button"
              class=${() => `vote-btn ${this.vote.value === 'up' ? 'active' : ''}`}
              aria-pressed=${() => String(this.vote.value === 'up')}
              @click=${() => this.#toggleVote('up')}
            >👍 Helpful</button>
            <button
              type="button"
              class=${() => `vote-btn ${this.vote.value === 'down' ? 'active' : ''}`}
              aria-pressed=${() => String(this.vote.value === 'down')}
              @click=${() => this.#toggleVote('down')}
            >👎</button>
          </div>
        </div>
      </article>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-insight-card')) {
  customElements.define('el-insight-card', ElInsightCard);
}
