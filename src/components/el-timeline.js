/**
 * <el-timeline> & <el-timeline-item>
 * Accessible activity and event progression trail inspired by shadcn/ui.
 * Supports status indicators (completed, active, pending, error),
 * dates/timestamps, connecting connector lines, and custom icons.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElTimelineItem extends Elementum {
  static observedAttributes = ['status', 'title', 'date', 'label'];

  status = signal('pending'); // 'completed' | 'active' | 'pending' | 'error'
  itemTitle = signal('');
  date = signal('');
  label = signal('');

  static styles = css`
    :host {
      display: flex;
      position: relative;
      padding-bottom: 24px;
      box-sizing: border-box;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    :host(:last-of-type) {
      padding-bottom: 0;
    }

    .gutter {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .node {
      width: 20px;
      height: 20px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-surface-base, #ffffff);
      border: 2px solid var(--el-surface-border, #cbd5e1);
      color: var(--el-text-muted, #64748b);
      font-size: 11px;
      z-index: 2;
      box-sizing: border-box;
    }

    :host([status="completed"]) .node {
      background: var(--el-color-success, #16a34a);
      border-color: var(--el-color-success, #16a34a);
      color: #ffffff;
    }

    :host([status="active"]) .node {
      background: var(--el-color-primary, #2563eb);
      border-color: var(--el-color-primary, #2563eb);
      color: #ffffff;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
    }

    :host([status="error"]) .node {
      background: var(--el-color-danger, #dc2626);
      border-color: var(--el-color-danger, #dc2626);
      color: #ffffff;
    }

    :host-context([data-theme="dark"]) .node {
      background: #1e293b;
      border-color: #475569;
    }

    .line {
      width: 2px;
      flex: 1;
      background: var(--el-surface-border, #e2e8f0);
      margin-top: 4px;
      margin-bottom: -4px;
    }

    :host-context([data-theme="dark"]) .line {
      background: #334155;
    }

    :host(:last-of-type) .line {
      display: none;
    }

    .content {
      flex: 1;
      padding-top: 1px;
    }

    .header-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }

    .title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--el-text-primary, #0f172a);
      margin: 0;
    }

    :host-context([data-theme="dark"]) .title {
      color: #f8fafc;
    }

    .date {
      font-size: 0.75rem;
      color: var(--el-text-muted, #94a3b8);
      white-space: nowrap;
    }

    .description {
      font-size: 0.875rem;
      color: var(--el-text-secondary, #475569);
      line-height: 1.45;
    }

    :host-context([data-theme="dark"]) .description {
      color: #94a3b8;
    }

    :host-context(el-timeline[orientation="horizontal"]),
    :host([orientation="horizontal"]) {
      flex-direction: column;
      padding-bottom: 0;
      padding-right: 24px;
      flex: 1;
      min-width: 140px;
    }

    :host-context(el-timeline[orientation="horizontal"]) .gutter,
    :host([orientation="horizontal"]) .gutter {
      flex-direction: row;
      margin-right: 0;
      margin-bottom: 8px;
      width: 100%;
    }

    :host-context(el-timeline[orientation="horizontal"]) .line,
    :host([orientation="horizontal"]) .line {
      width: 100%;
      height: 2px;
      margin-top: 0;
      margin-bottom: 0;
      margin-left: 8px;
    }
  `;

  connected() {
    this.#syncAttrs();
  }

  attributeChanged(name, oldValue, newValue) {
    this.#syncAttrs();
    return true;
  }

  #syncAttrs() {
    this.status.value = this.getAttribute('status') || 'pending';
    this.itemTitle.value = this.getAttribute('title') || '';
    this.date.value = this.getAttribute('date') || '';
    this.label.value = this.getAttribute('label') || '';
    if (!this.hasAttribute('status')) this.setAttribute('status', 'pending');
  }

  render() {
    return html`
      <div class="gutter" part="gutter">
        <div class="node" part="node">
          <slot name="icon">
            ${() => (this.status.value === 'completed' ? '✓' : '')}
          </slot>
        </div>
        <div class="line" part="line"></div>
      </div>
      <div class="content" part="content">
        <div class="header-row">
          ${() => (this.itemTitle.value ? html`<h5 class="title" part="title">${() => this.itemTitle.value}</h5>` : '')}
          ${() => (this.date.value ? html`<span class="date" part="date">${() => this.date.value}</span>` : '')}
        </div>
        <div class="description" part="description">
          <slot>${() => this.label.value}</slot>
        </div>
      </div>
    `;
  }
}

export class ElTimeline extends Elementum {
  static observedAttributes = ['orientation', 'reverse'];

  orientation = signal('vertical');
  reverse = signal(false);

  connected() {
    this.#syncAttrs();
  }

  attributeChanged(name, oldValue, newValue) {
    this.#syncAttrs();
    return true;
  }

  #syncAttrs() {
    this.orientation.value = this.getAttribute('orientation') || 'vertical';
    this.reverse.value = this.hasAttribute('reverse');
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
    }

    :host([orientation="horizontal"]) {
      flex-direction: row;
      align-items: flex-start;
      overflow-x: auto;
    }

    :host([reverse]) {
      flex-direction: column-reverse;
    }

    :host([orientation="horizontal"][reverse]) {
      flex-direction: row-reverse;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-timeline-item')) customElements.define('el-timeline-item', ElTimelineItem);
  if (!customElements.get('el-timeline')) customElements.define('el-timeline', ElTimeline);
}
