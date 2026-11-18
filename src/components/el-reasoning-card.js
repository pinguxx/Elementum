import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, effect } from '../signal.js';

/**
 * <el-reasoning-card>
 * Modern collapsible AI thought disclosure card (inspired by Beautiful UI, Claude 3.7 & DeepSeek-R1).
 * Features breathing active pulse indicator, elapsed duration counter,
 * and smooth grid-based expand/collapse accordion animation.
 *
 * @element el-reasoning-card
 * @fires toggle - Dispatched when expanded state toggles with { detail: { open } }
 * @slot default - The reasoning thought process content or steps
 * @slot summary - Custom summary or status header
 * @csspart container - The card wrapper
 * @csspart header - The interactive clickable header
 * @csspart indicator - The pulsing thinking status dot
 * @csspart title - The title/duration label
 * @csspart chevron - The expand/collapse chevron
 * @csspart body - The collapsible body container
 */
export class ElReasoningCard extends Elementum {
  static observedAttributes = ['open', 'thinking', 'duration', 'summary'];

  open = signal(false);
  thinking = signal(false);
  duration = signal('');
  summary = signal('Thinking process');

  connected() {
    this.open.value = this.hasAttribute('open');
    this.thinking.value = this.hasAttribute('thinking');
    if (this.hasAttribute('duration')) {
      this.duration.value = this.getAttribute('duration');
    }
    if (this.hasAttribute('summary')) {
      this.summary.value = this.getAttribute('summary');
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    switch (name) {
      case 'open':
        this.open.value = newValue !== null;
        break;
      case 'thinking':
        this.thinking.value = newValue !== null;
        break;
      case 'duration':
        this.duration.value = newValue || '';
        break;
      case 'summary':
        this.summary.value = newValue || 'Thinking process';
        break;
    }
  }

  toggle() {
    this.open.value = !this.open.value;
    if (this.open.value) {
      this.setAttribute('open', '');
    } else {
      this.removeAttribute('open');
    }

    this.dispatchEvent(
      new CustomEvent('toggle', {
        bubbles: true,
        composed: true,
        detail: { open: this.open.value }
      })
    );
  }

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      font-family: var(--el-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      margin: 8px 0;
    }

    .card {
      border: 1px solid var(--el-border-translucent, rgba(15, 23, 42, 0.08));
      border-radius: var(--el-radius-lg, 12px);
      background: var(--el-surface-muted, #f8fafc);
      overflow: hidden;
      transition: border-color var(--el-transition-fluid, 280ms cubic-bezier(0.16, 1, 0.3, 1)),
                  background-color var(--el-transition-fluid, 280ms cubic-bezier(0.16, 1, 0.3, 1));
    }

    :host([open]) .card {
      background: var(--el-surface-elevated, #ffffff);
      border-color: var(--el-border-translucent, rgba(15, 23, 42, 0.12));
      box-shadow: var(--el-shadow-subtle, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    }

    .header-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      background: transparent;
      border: none;
      text-align: left;
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--el-text-secondary, #475569);
      cursor: pointer;
      user-select: none;
      outline: none;
      border-radius: var(--el-radius-lg, 12px);
      transition: color 0.15s ease, background-color 0.15s ease;
    }

    .header-btn:hover {
      color: var(--el-text-primary, #0f172a);
      background-color: rgba(0, 0, 0, 0.02);
    }

    .header-btn:focus-visible {
      box-shadow: inset 0 0 0 2px var(--el-color-primary, #2563eb);
    }

    .header-left {
      display: inline-flex;
      align-items: center;
      gap: 9px;
    }

    /* Pulsing breathing dot for active thinking */
    .indicator-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
    }

    .indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--el-color-primary, #2563eb);
      transition: background-color 0.2s ease;
    }

    .indicator-ping {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: var(--el-color-primary, #2563eb);
      opacity: 0.6;
      animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    :host(:not([thinking])) .indicator-dot {
      background: var(--el-text-muted, #94a3b8);
    }

    :host(:not([thinking])) .indicator-ping {
      display: none;
    }

    @keyframes ping {
      75%, 100% {
        transform: scale(2);
        opacity: 0;
      }
    }

    .title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .duration-badge {
      display: inline-flex;
      align-items: center;
      font-family: var(--el-font-mono, monospace);
      font-size: 0.75rem;
      padding: 1px 6px;
      border-radius: var(--el-radius-full, 9999px);
      background: rgba(15, 23, 42, 0.06);
      color: var(--el-text-muted, #64748b);
    }

    .chevron {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform var(--el-transition-fluid, 280ms cubic-bezier(0.16, 1, 0.3, 1));
      color: var(--el-text-muted, #94a3b8);
    }

    :host([open]) .chevron {
      transform: rotate(180deg);
    }

    /* Grid accordion expansion for buttery smooth layout transition without fixed max-height */
    .content-wrapper {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows var(--el-transition-fluid, 280ms cubic-bezier(0.16, 1, 0.3, 1));
    }

    :host([open]) .content-wrapper {
      grid-template-rows: 1fr;
    }

    .content-inner {
      overflow: hidden;
    }

    .content-body {
      padding: 4px 16px 14px 37px;
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--el-text-secondary, #334155);
      border-top: 1px solid var(--el-border-translucent, rgba(15, 23, 42, 0.05));
    }

    ::slotted(*) {
      margin-top: 6px;
      margin-bottom: 6px;
    }

    @media (prefers-reduced-motion: reduce) {
      .card, .chevron, .content-wrapper {
        transition: none;
      }
      .indicator-ping {
        animation: none;
      }
    }
  `;

  render() {
    const summaryText = () => this.summary.value || (this.thinking.value ? 'Thinking...' : 'Reasoning process');

    return html`
      <div class="card" part="container">
        <button
          type="button"
          class="header-btn"
          part="header"
          aria-expanded=${() => String(this.open.value)}
          @click=${() => this.toggle()}
        >
          <div class="header-left">
            <div class="indicator-wrapper" part="indicator">
              <div class="indicator-ping"></div>
              <div class="indicator-dot"></div>
            </div>
            <div class="title" part="title">
              <slot name="summary">
                <span>${summaryText}</span>
              </slot>
              ${() => (this.duration.value
                ? html`<span class="duration-badge">${this.duration.value}</span>`
                : null)}
            </div>
          </div>
          <div class="chevron" part="chevron">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </button>

        <div class="content-wrapper" part="body">
          <div class="content-inner">
            <div class="content-body">
              <slot></slot>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-reasoning-card')) {
  customElements.define('el-reasoning-card', ElReasoningCard);
}
