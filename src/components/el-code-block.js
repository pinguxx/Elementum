/**
 * <el-code-block>
 * Accessible code snippet container with optional language header,
 * zero-dependency syntax highlighting, slot dedent / <template> support, and copy button.
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

const LANG_MODE = {
  js: 'js',
  javascript: 'js',
  ts: 'js',
  json: 'json',
  html: 'html',
  css: 'css',
  bash: 'bash',
  sh: 'bash',
};

const JS_KW = new Set('const,let,var,function,return,if,else,for,while,do,switch,case,break,continue,default,import,from,export,as,class,extends,super,new,this,typeof,instanceof,in,of,async,await,try,catch,finally,throw,true,false,null,undefined,void,type,interface'.split(','));
const BASH_KW = new Set('export,sudo,npm,npx,node,git,cd,if,then,else,fi,for,do,done'.split(','));
const JSON_KW = new Set(['true', 'false', 'null']);

const RE_NUM = /-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/iy;
const RE_JS_NUM = /(?:0[xbo][0-9a-f_]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?n?)/iy;
const RE_IDENT = /[a-z_$][a-z0-9_$]*/iy;
const RE_CSS_IDENT = /--?[a-z][a-z0-9_-]*|[a-z][a-z0-9-]*/iy;
const RE_HEX = /#[0-9a-f]{3,8}\b/iy;
const RE_CSS_NUM = /\d+(?:\.\d+)?(?:%|px|rem|em|vh|vw|ms|s|deg)?/iy;
const RE_HTML_NAME = /[a-z][a-z0-9-]*/iy;
const RE_HTML_ATTR = /[a-z?@.][a-z0-9_.:-]*/iy;
const RE_BASH_VAR = /\$(?:[a-z_][a-z0-9_]*|\{[^}]+\})/iy;
const RE_BASH_FLAG = /--?[a-z0-9-]+/iy;

function dedent(raw) {
  if (!raw) return '';
  const lines = String(raw).replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  let min = Infinity;
  for (const line of lines) {
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    if (indent < min) min = indent;
  }
  const out = Number.isFinite(min) && min > 0 ? lines.map((l) => l.slice(min)) : lines;
  return out.join('\n').trimEnd();
}

function scanQuoted(src, start) {
  const q = src[start];
  let j = start + 1;
  while (j < src.length) {
    const ch = src[j++];
    if (ch === '\\') { j++; continue; }
    if (ch === q) break;
  }
  return j;
}

function matchAt(src, i, re) {
  re.lastIndex = i;
  const m = re.exec(src);
  return m ? m[0] : '';
}

function skipHws(src, i) {
  while (i < src.length && (src[i] === ' ' || src[i] === '\t')) i++;
  return i;
}

/**
 * Linear-time zero-dependency tokenizer returning [tokenType | null, text] pairs.
 */
function tokenizeCode(src, lang) {
  const mode = LANG_MODE[String(lang || '').trim().toLowerCase()] || '';
  if (!mode || !src) return [[null, src || '']];

  const out = [];
  const push = (t, v) => {
    if (!v) return;
    const prev = out[out.length - 1];
    if (!t && prev && prev[0] === null) prev[1] += v;
    else out.push([t, v]);
  };

  let i = 0;
  let inTag = false;
  let inBlock = 0;
  const n = src.length;

  while (i < n) {
    const ch = src[i];

    // Comments
    if (mode === 'html' && src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      const to = end === -1 ? n : end + 3;
      push('comment', src.slice(i, to));
      i = to;
      continue;
    }
    if (mode === 'js' && ch === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i + 2);
      const to = nl === -1 ? n : nl;
      push('comment', src.slice(i, to));
      i = to;
      continue;
    }
    if ((mode === 'js' || mode === 'css') && ch === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      const to = close === -1 ? n : close + 2;
      push('comment', src.slice(i, to));
      i = to;
      continue;
    }
    if (mode === 'bash' && ch === '#' && (i === 0 || /\s/.test(src[i - 1]))) {
      const nl = src.indexOf('\n', i + 1);
      const to = nl === -1 ? n : nl;
      push('comment', src.slice(i, to));
      i = to;
      continue;
    }

    // Quoted strings (and JSON property keys before `:`)
    if (ch === '"' || (mode !== 'json' && ch === "'") || ((mode === 'js' || mode === 'bash') && ch === '`')) {
      const to = scanQuoted(src, i);
      const type = mode === 'json' && ch === '"' && src[skipHws(src, to)] === ':' ? 'attr' : 'string';
      push(type, src.slice(i, to));
      i = to;
      continue;
    }

    if (mode === 'html') {
      if (!inTag && ch === '<') {
        const off = src[i + 1] === '/' ? 2 : 1;
        const tag = matchAt(src, i + off, RE_HTML_NAME);
        if (tag) {
          push(null, src.slice(i, i + off));
          push('tag', tag);
          inTag = true;
          i += off + tag.length;
          continue;
        }
      }
      if (inTag) {
        if (ch === '>') {
          push(null, '>');
          inTag = false;
          i++;
          continue;
        }
        const attr = matchAt(src, i, RE_HTML_ATTR);
        if (attr) {
          push('attr', attr);
          i += attr.length;
          continue;
        }
      }
      push(null, ch);
      i++;
      continue;
    }

    if (mode === 'css') {
      if (ch === '{' || ch === '}') {
        inBlock += ch === '{' ? 1 : -1;
        if (inBlock < 0) inBlock = 0;
        push(null, ch);
        i++;
        continue;
      }
      if (ch === '#') {
        const hex = matchAt(src, i, RE_HEX);
        if (hex) { push('number', hex); i += hex.length; continue; }
      }
      if (ch === '@' || (!inBlock && ch === ':')) {
        const off = ch === ':' && src[i + 1] === ':' ? 2 : 1;
        const name = matchAt(src, i + off, RE_HTML_NAME);
        if (name) { push('keyword', src.slice(i, i + off) + name); i += off + name.length; continue; }
      }
      if (/\d/.test(ch)) {
        const num = matchAt(src, i, RE_CSS_NUM);
        if (num) { push('number', num); i += num.length; continue; }
      }
      const id = matchAt(src, i, RE_CSS_IDENT);
      if (id) {
        const nextCh = src[skipHws(src, i + id.length)];
        const type = nextCh === '(' ? 'fn' : (inBlock && nextCh === ':' ? 'attr' : null);
        push(type, id);
        i += id.length;
        continue;
      }
      push(null, ch);
      i++;
      continue;
    }

    if (mode === 'bash') {
      if (ch === '$') {
        const v = matchAt(src, i, RE_BASH_VAR);
        if (v) { push('keyword', v); i += v.length; continue; }
      }
      if (ch === '-' && (i === 0 || /\s/.test(src[i - 1]))) {
        const fl = matchAt(src, i, RE_BASH_FLAG);
        if (fl) { push('attr', fl); i += fl.length; continue; }
      }
      if (/\d/.test(ch) && (i === 0 || /[\s=]/.test(src[i - 1]))) {
        const num = matchAt(src, i, RE_CSS_NUM);
        if (num) { push('number', num); i += num.length; continue; }
      }
      const id = matchAt(src, i, RE_IDENT);
      if (id) {
        push(BASH_KW.has(id) && (i === 0 || /[\s;|&]/.test(src[i - 1])) ? 'keyword' : null, id);
        i += id.length;
        continue;
      }
      push(null, ch);
      i++;
      continue;
    }

    if (mode === 'json') {
      if ((ch === '-' && /\d/.test(src[i + 1])) || /\d/.test(ch)) {
        const num = matchAt(src, i, RE_NUM);
        if (num) { push('number', num); i += num.length; continue; }
      }
      const id = matchAt(src, i, RE_IDENT);
      if (id) {
        push(JSON_KW.has(id) ? 'keyword' : null, id);
        i += id.length;
        continue;
      }
      push(null, ch);
      i++;
      continue;
    }

    // JS / TS mode
    if (/\d/.test(ch) && (i === 0 || !/[a-zA-Z0-9_$]/.test(src[i - 1]))) {
      const num = matchAt(src, i, RE_JS_NUM);
      if (num) { push('number', num); i += num.length; continue; }
    }
    const id = matchAt(src, i, RE_IDENT);
    if (id) {
      const nextCh = src[skipHws(src, i + id.length)];
      const type = JS_KW.has(id) ? 'keyword' : (nextCh === '(' ? 'fn' : null);
      push(type, id);
      i += id.length;
      continue;
    }
    push(null, ch);
    i++;
  }

  return out;
}

export class ElCodeBlock extends Elementum {
  static observedAttributes = ['code', 'language', 'copyable', 'compact'];

  code = signal('');
  // 'html' | 'js' | 'css' | 'bash' | 'json' | 'ts'
  language = signal('');
  copyable = signal(false);
  compact = signal(false);
  copied = signal(false);

  #slotCode = signal('');
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
      background: var(--el-code-bg, #0f172a);
      color: var(--el-code-fg, #e2e8f0);
      border: 1px solid var(--el-code-border, #1e293b);
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
      background: var(--el-code-header-bg, rgba(15, 23, 42, 0.85));
      border-bottom: 1px solid var(--el-code-border, #1e293b);
    }

    .lang-tag {
      font-family: var(--el-font-sans, system-ui, sans-serif);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--el-code-comment, #94a3b8);
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
      color: var(--el-code-fg, #e2e8f0);
      white-space: pre;
      overflow-x: auto;
      flex: 1 1 auto;
      min-width: 0;
    }

    .tok-comment { color: var(--el-code-comment, #94a3b8); font-style: italic; }
    .tok-string { color: var(--el-code-string, #86efac); }
    .tok-keyword { color: var(--el-code-keyword, #c084fc); }
    .tok-number { color: var(--el-code-number, #fbbf24); }
    .tok-tag { color: var(--el-code-tag, #f472b6); }
    .tok-attr { color: var(--el-code-attr, #7dd3fc); }
    .tok-fn { color: var(--el-code-fn, #60a5fa); }

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

  connected() {
    this.#syncSlotCode();
  }

  disconnected() {
    if (this.#copyTimer) {
      clearTimeout(this.#copyTimer);
      this.#copyTimer = null;
    }
  }

  #readLightDom() {
    const tpl = this.children ? Array.from(this.children).find((c) => c.tagName === 'TEMPLATE') : null;
    return dedent(tpl ? tpl.innerHTML : (this.textContent || ''));
  }

  #syncSlotCode() {
    this.#slotCode.value = this.#readLightDom();
  }

  getCodeText() {
    return this.code.value || this.#slotCode.value || this.#readLightDom();
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
          <pre part="pre" tabindex="0"><code part="code">${() => {
            const source = this.code.value || this.#slotCode.value;
            if (!source) return '';
            return tokenizeCode(source, this.language.value).map(([type, text]) =>
              type ? html`<span class=${`tok-${type}`}>${text}</span>` : text
            );
          }}<slot style=${() => (this.code.value || this.#slotCode.value ? 'display:none;' : '')} @slotchange=${() => this.#syncSlotCode()}></slot></code></pre>
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
