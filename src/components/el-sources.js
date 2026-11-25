import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

function sanitizeUrl(raw) {
  const s = String(raw || '').trim();
  if (/^https?:\/\//i.test(s)) return s;
  return '';
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
}

/**
 * <el-sources>
 * Grounding citation pills and expandable source list for AI / RAG responses.
 *
 * @element el-sources
 * @attr {string} sources - JSON array of { title, url, domain?, snippet? }
 * @attr {string} label - Header label (default: 'Sources')
 * @attr {boolean} expanded - Whether full source cards are expanded
 * @fires source-select - Fired when a source pill is clicked ({ index, source })
 */
export class ElSources extends Elementum {
  static observedAttributes = ['sources', 'label', 'open', 'expanded'];

  sources = signal([]);
  label = signal('Sources');
  expanded = signal(false);

  connected() {
    this.#sync();
  }

  attributeChanged() {
    this.#sync();
  }

  #sync() {
    if (this.hasAttribute('label')) this.label.value = this.getAttribute('label') || 'Sources';
    const hasOpen = this.hasAttribute('open') && this.getAttribute('open') !== 'false';
    const hasExpanded = this.hasAttribute('expanded') && this.getAttribute('expanded') !== 'false';
    this.expanded.value = hasOpen || hasExpanded;
    const raw = this.getAttribute('sources');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) this.sources.value = parsed;
      } catch {
        // Ignore malformed JSON
      }
    }
  }

  toggleExpanded = () => {
    const next = !this.expanded.value;
    this.expanded.value = next;
    if (next) {
      this.setAttribute('open', '');
      this.setAttribute('expanded', '');
    } else {
      this.removeAttribute('open');
      this.removeAttribute('expanded');
    }
  };

  #selectSource(src, index) {
    this.emit('source-select', { index, source: src });
  }

  static styles = css`
    :host {
      display: block;
      font-family: var(--el-font-sans, system-ui, -apple-system, sans-serif);
      box-sizing: border-box;
    }

    .sources-wrap {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .pills-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }

    .toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-muted, #f8fafc);
      color: var(--el-text-primary, #0f172a);
      font-family: inherit;
      font-size: 0.76rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 140ms ease, border-color 140ms ease, transform 120ms var(--el-ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
    }

    .toggle-btn:active {
      transform: scale(0.97);
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 9999px;
      border: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-elevated, #ffffff);
      color: var(--el-text-secondary, #475569);
      font-size: 0.75rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: border-color 140ms ease, color 140ms ease, transform 120ms var(--el-ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
    }

    .pill:hover {
      border-color: var(--el-color-primary-text, #1d4ed8);
      color: var(--el-color-primary-text, #1d4ed8);
    }

    .pill:active {
      transform: scale(0.97);
    }

    .idx {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 9999px;
      background: var(--el-color-primary, #2563eb);
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
    }

    .source-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px 12px;
      border-radius: var(--el-radius-md, 8px);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-elevated, #ffffff);
      text-decoration: none;
      color: inherit;
      transition: border-color 140ms ease, box-shadow 140ms ease;
    }

    .source-card:hover {
      border-color: var(--el-color-primary-text, #1d4ed8);
      box-shadow: var(--el-shadow-subtle, 0 2px 6px rgba(15, 23, 42, 0.06));
    }

    .source-title {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--el-text-primary, #0f172a);
    }

    .source-domain {
      font-size: 0.72rem;
      color: var(--el-color-primary-text, #1d4ed8);
    }

    .source-snippet {
      font-size: 0.76rem;
      color: var(--el-text-secondary, #475569);
      margin: 2px 0 0;
      line-height: 1.45;
    }

    @media (prefers-reduced-motion: reduce) {
      .toggle-btn, .pill, .source-card { transition: none; }
      .toggle-btn:active, .pill:active { transform: none; }
    }
  `;

  render() {
    return html`
      <div class="sources-wrap" part="container">
        <div class="pills-bar" part="pills">
          <button
            type="button"
            class="toggle-btn"
            aria-expanded=${() => String(this.expanded.value)}
            @click=${this.toggleExpanded}
          >
            <span>${this.label} (${() => (Array.isArray(this.sources.value) ? this.sources.value.length : 0)})</span>
            <span>${() => (this.expanded.value ? '▴' : '▾')}</span>
          </button>
          ${() => {
            const list = Array.isArray(this.sources.value) ? this.sources.value : [];
            return list.map((src, idx) => {
              const safeHref = sanitizeUrl(src.url);
              const dom = src.domain || domainFromUrl(safeHref);
              return html`
                <a
                  class="pill"
                  href=${safeHref || '#'}
                  target=${safeHref ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  @click=${(e) => {
                    if (!safeHref) e.preventDefault();
                    this.#selectSource(src, idx);
                  }}
                >
                  <span class="idx">${idx + 1}</span>
                  <span>${dom}</span>
                </a>
              `;
            });
          }}
        </div>

        ${() => {
          if (!this.expanded.value) return '';
          const list = Array.isArray(this.sources.value) ? this.sources.value : [];
          return html`
            <div class="cards" part="list">
              ${list.map((src, idx) => {
                const safeHref = sanitizeUrl(src.url);
                const dom = src.domain || domainFromUrl(safeHref);
                return html`
                  <a
                    class="source-card"
                    href=${safeHref || '#'}
                    target=${safeHref ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    @click=${(e) => {
                      if (!safeHref) e.preventDefault();
                      this.#selectSource(src, idx);
                    }}
                  >
                    <span class="source-domain">[${idx + 1}] ${dom}</span>
                    <span class="source-title">${src.title || dom}</span>
                    ${src.snippet ? html`<p class="source-snippet">${src.snippet}</p>` : ''}
                  </a>
                `;
              })}
            </div>
          `;
        }}
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-sources')) {
  customElements.define('el-sources', ElSources);
}
