/**
 * <el-code-block>
 * Accessible code snippet container with optional language header and one-click copy button.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';
import { announce } from '../behaviors/index.js';

const LANGUAGE_LABELS = {
  html: 'HTML',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  css: 'CSS',
  bash: 'Shell',
  sh: 'Shell',
  json: 'JSON',
};

export class ElCodeBlock extends Elementum {
  static observedAttributes = ['code', 'language', 'copyable', 'compact'];

  code = signal('');
  // 'html' | 'js' | 'css' | 'bash' | 'json' | 'ts'
  language = signal('');
  copyable = signal(false);
  compact = signal(false);
  copied = signal(false);

  #copyTimer = null;

  static styles = css`
    :host {
      display: block;
      font-family: var(--el-font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
      box-sizing: border-box;
      max-width: 100%;
    }

    :host([compact]) {
      display: inline-block;
    }

    .code-wrapper {
      position: relative;
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid #1e293b;
      border-radius: var(--el-radius-md, 10px);
      overflow: hidden;
      box-sizing: border-box;
      transition: border-color 0.15s ease;
    }

    .code-wrapper:hover {
      border-color: #334155;
    }

    .code-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 14px;
      background: rgba(15, 23, 42, 0.85);
      border-bottom: 1px solid #1e293b;
    }

    .lang-tag {
      font-family: var(--el-font-sans, system-ui, sans-serif);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #94a3b8;
    }

    .code-body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      overflow-x: auto;
    }

    :host([compact]) .code-body {
      padding: 10px 14px;
    }

    pre {
      margin: 0;
      padding: 0;
      font-family: inherit;
      font-size: 0.84rem;
      line-height: 1.6;
      color: #e2e8f0;
      white-space: pre;
      overflow-x: auto;
      flex: 1 1 auto;
      min-width: 0;
    }

    .inline-actions {
      position: relative;
      flex-shrink: 0;
    }

    .copy-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 4px 10px;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }

    .copy-btn:hover {
      background: var(--el-color-primary, #2563eb);
      border-color: var(--el-color-primary, #2563eb);
      color: #ffffff;
    }

    .copy-btn[data-copied="true"] {
      background: var(--el-color-success, #16a34a);
      border-color: var(--el-color-success, #16a34a);
      color: #ffffff;
    }

    .copy-btn:focus-visible {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: 2px;
    }
  `;

  disconnected() {
    if (this.#copyTimer) {
      clearTimeout(this.#copyTimer);
      this.#copyTimer = null;
    }
  }

  getCodeText() {
    if (this.code.value) return this.code.value;
    return (this.textContent || '').trim();
  }

  async copyCode(e) {
    if (e) e.stopPropagation();
    const text = this.getCodeText();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Clipboard API may be unavailable in restricted contexts; still emit event & show feedback
    }

    this.copied.value = true;
    if (this.#copyTimer) clearTimeout(this.#copyTimer);
    this.#copyTimer = setTimeout(() => {
      this.copied.value = false;
      this.#copyTimer = null;
    }, 1500);

    this.emit('copy', { code: text });
    announce('Code copied to clipboard', 'polite');
  }

  #getLanguageLabel() {
    const key = (this.language.value || '').trim().toLowerCase();
    return LANGUAGE_LABELS[key] || (key ? key.toUpperCase() : '');
  }

  #renderCopyButton() {
    return html`
      <button
        class="copy-btn"
        part="copy-button"
        type="button"
        data-copied=${() => (this.copied.value ? 'true' : 'false')}
        aria-label=${() => (this.copied.value ? 'Copied to clipboard' : 'Copy code snippet')}
        onclick=${(e) => this.copyCode(e)}
      >
        ${() => (this.copied.value ? 'Copied ✓' : 'Copy')}
      </button>
    `;
  }

  render() {
    return html`
      <div class="code-wrapper" part="container" role="region" aria-label="Code snippet">
        ${() => {
          const langLabel = this.#getLanguageLabel();
          const showHeader = Boolean(langLabel) && !this.compact.value;
          if (!showHeader) return '';
          return html`
            <div class="code-header" part="header">
              <span class="lang-tag" part="language">${() => langLabel}</span>
              ${() => (this.copyable.value ? this.#renderCopyButton() : '')}
            </div>
          `;
        }}
        <div class="code-body" part="body">
          <pre part="pre"><code part="code">${() => this.code.value}<slot style=${() => (this.code.value ? 'display:none;' : '')}></slot></code></pre>
          ${() => {
            const langLabel = this.#getLanguageLabel();
            const hasHeader = Boolean(langLabel) && !this.compact.value;
            return this.copyable.value && !hasHeader
              ? html`<div class="inline-actions">${() => this.#renderCopyButton()}</div>`
              : '';
          }}
        </div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-code-block')) {
  customElements.define('el-code-block', ElCodeBlock);
}
