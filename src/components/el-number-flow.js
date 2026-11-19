import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, effect } from '../signal.js';
import { formatLocaleNumber } from '../behaviors/index.js';

/**
 * <el-number-flow>
 * Smooth rolling odometer / slot-machine character reel component.
 *
 * @attr {number|string} value - The numeric value to display and animate
 * @attr {string} prefix - Optional prefix (e.g. '$' or '+')
 * @attr {string} suffix - Optional suffix (e.g. '%' or 'ms')
 * @attr {number} duration - Animation duration in ms (default: 400)
 * @attr {string} locale - Optional BCP 47 locale for Intl.NumberFormat (e.g. 'en-US', 'de-DE')
 */
export class ElNumberFlow extends Elementum {
  static observedAttributes = ['value', 'prefix', 'suffix', 'duration', 'animated', 'locale'];

  value = signal('0');
  prefix = signal('');
  suffix = signal('');
  duration = signal(400);
  animated = signal(true);
  locale = signal('');

  connected() {
    this.#sync();
  }

  attributeChanged(name, oldValue, newValue) {
    this.#sync();
  }

  #sync() {
    if (this.hasAttribute('value')) this.value.value = String(this.getAttribute('value') ?? '0');
    if (this.hasAttribute('prefix')) this.prefix.value = this.getAttribute('prefix') || '';
    if (this.hasAttribute('suffix')) this.suffix.value = this.getAttribute('suffix') || '';
    if (this.hasAttribute('duration')) this.duration.value = Number(this.getAttribute('duration')) || 400;
    if (this.hasAttribute('animated')) this.animated.value = this.getAttribute('animated') !== 'false';
    if (this.hasAttribute('locale')) this.locale.value = this.getAttribute('locale') || '';
  }

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      font-variant-numeric: tabular-nums;
      font-family: inherit;
      line-height: 1;
      vertical-align: baseline;
      box-sizing: border-box;
      overflow: hidden;
      height: 1.25em;
    }

    .flow-wrapper {
      display: inline-flex;
      align-items: center;
      height: 1.25em;
      overflow: hidden;
    }

    .affix {
      display: inline-block;
      user-select: none;
    }

    .digit-column {
      position: relative;
      display: inline-flex;
      flex-direction: column;
      width: 1ch;
      height: 1.25em;
      transition: transform var(--flow-duration, 400ms) cubic-bezier(0.16, 1, 0.3, 1);
      will-change: transform;
    }

    .digit-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 1.25em;
      line-height: 1.25em;
      text-align: center;
      user-select: none;
    }

    .static-char {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 1.25em;
      user-select: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .digit-column {
        transition: none !important;
      }
    }
  `;

  render() {
    const rawVal = () => {
      const str = String(this.value.value ?? '0');
      const loc = (this.locale.value || '').trim();
      if (loc && /^-?\d+(\.\d+)?$/.test(str)) {
        return formatLocaleNumber(Number(str), loc);
      }
      return str;
    };
    const fullText = () => `${this.prefix.value}${rawVal()}${this.suffix.value}`;

    return html`
      <div
        class="flow-wrapper"
        part="wrapper"
        role="text"
        aria-label=${fullText}
        style=${() => `--flow-duration: ${this.duration.value}ms;`}
      >
        ${() => this.prefix.value ? html`<span class="affix prefix" part="prefix">${this.prefix}</span>` : null}

        ${() => {
          const chars = rawVal().split('');
          return chars.map((ch, idx) => {
            const digit = parseInt(ch, 10);
            if (!isNaN(digit)) {
              // Roll to digit index: 0 is top, 9 is bottom
              const translateY = -digit * 1.25;
              return html`
                <span
                  class="digit-column digit-reel"
                  part="digit"
                  style=${`transform: translateY(${translateY}em);`}
                  aria-hidden="true"
                >
                  <span class="digit-cell">0</span>
                  <span class="digit-cell">1</span>
                  <span class="digit-cell">2</span>
                  <span class="digit-cell">3</span>
                  <span class="digit-cell">4</span>
                  <span class="digit-cell">5</span>
                  <span class="digit-cell">6</span>
                  <span class="digit-cell">7</span>
                  <span class="digit-cell">8</span>
                  <span class="digit-cell">9</span>
                </span>
              `;
            } else {
              return html`<span class="static-char" part="char" aria-hidden="true">${ch}</span>`;
            }
          });
        }}

        ${() => this.suffix.value ? html`<span class="affix suffix" part="suffix">${this.suffix}</span>` : null}
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-number-flow')) {
  customElements.define('el-number-flow', ElNumberFlow);
}
