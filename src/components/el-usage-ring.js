import { Elementum } from '../elementum.js';
import { html, svg, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-usage-ring>
 * Radial segmented quota/usage meter rendered cleanly in pure SVG with
 * tabular numerals and WCAG 2.2 AA progressbar semantics.
 *
 * @element el-usage-ring
 * @attr {number} value - Current usage value (default: 68)
 * @attr {number} max - Maximum capacity value (default: 100)
 * @attr {number} segments - Number of radial tick segments (default: 24)
 * @attr {'sm' | 'md' | 'lg'} size - Ring footprint size
 * @attr {'primary' | 'success' | 'warning' | 'danger'} variant - Active segment color
 * @attr {string} label - Accessible metric label (default: 'Quota')
 * @attr {string} sublabel - Caption beneath percentage (default: 'used')
 * @csspart ring - Outer container
 * @csspart svg - Radial SVG gauge
 * @csspart value - Percentage value readout
 * @csspart label - Accessible/visible label text
 * @csspart sublabel - Secondary unit caption
 */
export class ElUsageRing extends Elementum {
  static observedAttributes = ['value', 'max', 'segments', 'size', 'variant', 'label', 'sublabel'];

  value = signal(68);
  max = signal(100);
  segments = signal(24);
  size = signal('md'); // 'sm' | 'md' | 'lg'
  variant = signal('primary'); // 'primary' | 'success' | 'warning' | 'danger'
  label = signal('Quota');
  sublabel = signal('used');

  connected() {
    this.#sync();
  }

  attributeChanged() {
    this.#sync();
  }

  #sync() {
    this.value.value = this.numAttr('value', 68, 0);
    const maxVal = this.numAttr('max', 100);
    this.max.value = maxVal > 0 ? maxVal : 100;
    this.segments.value = Math.round(this.numAttr('segments', 24, 6, 60));
    this.size.value = this.getAttribute('size') || 'md';
    this.variant.value = this.getAttribute('variant') || 'primary';
    this.label.value = this.getAttribute('label') || 'Quota';
    this.sublabel.value = this.hasAttribute('sublabel') ? this.getAttribute('sublabel') : 'used';
  }

  #percent() {
    const ratio = Math.max(0, Math.min(1, this.value.value / Math.max(1, this.max.value)));
    return Math.round(ratio * 100);
  }

  #renderSegments() {
    const total = this.segments.value;
    const ratio = Math.max(0, Math.min(1, this.value.value / Math.max(1, this.max.value)));
    const activeCount = Math.round(ratio * total);
    const items = [];
    for (let i = 0; i < total; i++) {
      const rad = ((-90 + (i * 360) / total) * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const x1 = (60 + 40 * cos).toFixed(2);
      const y1 = (60 + 40 * sin).toFixed(2);
      const x2 = (60 + 52 * cos).toFixed(2);
      const y2 = (60 + 52 * sin).toFixed(2);
      items.push(
        svg`<line x1=${x1} y1=${y1} x2=${x2} y2=${y2} class=${i < activeCount ? 'seg active' : 'seg'} />`
      );
    }
    return items;
  }

  static styles = css`
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      box-sizing: border-box;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    .ring {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 128px;
      height: 128px;
      color: var(--el-color-primary-text, #1d4ed8);
    }

    :host([size='sm']) .ring {
      width: 88px;
      height: 88px;
    }

    :host([size='lg']) .ring {
      width: 168px;
      height: 168px;
    }

    :host([variant='success']) .ring {
      color: var(--el-color-success-text, #065f46);
    }

    :host([variant='warning']) .ring {
      color: var(--el-color-warning-text, #92400e);
    }

    :host([variant='danger']) .ring {
      color: var(--el-color-danger-text, #991b1b);
    }

    svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .seg {
      stroke: var(--el-surface-border, #e2e8f0);
      stroke-width: 4.5;
      stroke-linecap: round;
      transition: stroke 0.2s ease, opacity 0.2s ease;
    }

    .seg.active {
      stroke: currentColor;
    }

    .center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      pointer-events: none;
    }

    .value {
      font-size: 1.35rem;
      font-weight: 700;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
      color: var(--el-text-primary, #0f172a);
    }

    :host([size='sm']) .value {
      font-size: 1rem;
    }

    :host([size='lg']) .value {
      font-size: 1.75rem;
    }

    .sublabel {
      font-size: 0.72rem;
      color: var(--el-text-secondary, #475569);
    }

    .caption {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--el-text-primary, #0f172a);
    }

    @media (prefers-reduced-motion: reduce) {
      .seg {
        transition: none;
      }
    }
  `;

  render() {
    return html`
      <div
        class="ring"
        part="ring"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${() => String(this.#percent())}
        aria-label=${() => `${this.label.value}: ${this.#percent()}%`}
      >
        <svg viewBox="0 0 120 120" part="svg" aria-hidden="true">
          ${() => this.#renderSegments()}
        </svg>
        <div class="center">
          <span class="value" part="value">${() => `${this.#percent()}%`}</span>
          ${() => (this.sublabel.value ? html`<span class="sublabel" part="sublabel">${this.sublabel}</span>` : null)}
        </div>
      </div>
      <span class="caption" part="label">${this.label}</span>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-usage-ring')) {
  customElements.define('el-usage-ring', ElUsageRing);
}
