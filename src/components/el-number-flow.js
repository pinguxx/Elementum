import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, effect } from '../signal.js';
import { formatLocaleNumber, prefersReducedMotion } from '../behaviors/index.js';

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

  #hasRenderedOnce = false;
  #disposeEffect = null;
  #reducedMotion = null;

  connected() {
    this.#sync();
    this.#reducedMotion = prefersReducedMotion({ signal: this.signal });
  }

  rendered() {
    this.#hasRenderedOnce = false;
    this.#disposeEffect?.();
    this.#disposeEffect = effect(() => {
      this.#reconcileDigits();
    });
  }

  disconnected() {
    this.#disposeEffect?.();
    this.#disposeEffect = null;
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

  #getFormattedValue() {
    const str = String(this.value.value ?? '0');
    const loc = (this.locale.value || '').trim();
    if (loc && /^-?\d+(\.\d+)?$/.test(str)) {
      return formatLocaleNumber(Number(str), loc);
    }
    return str;
  }

  #createDigitColumn(initialDigit) {
    const col = document.createElement('span');
    col.className = 'digit-column digit-reel';
    col.setAttribute('part', 'digit');
    col.setAttribute('aria-hidden', 'true');
    col.style.transform = `translateY(${-initialDigit * 1.25}em)`;
    for (let d = 0; d <= 9; d++) {
      const cell = document.createElement('span');
      cell.className = 'digit-cell';
      cell.textContent = String(d);
      col.appendChild(cell);
    }
    return col;
  }

  #createStaticChar(ch) {
    const span = document.createElement('span');
    span.className = 'static-char';
    span.setAttribute('part', 'char');
    span.setAttribute('aria-hidden', 'true');
    span.textContent = ch;
    return span;
  }

  #reconcileDigits() {
    const chars = this.#getFormattedValue().split('');
    const track = this.root?.querySelector('.digits-track');
    if (!track || typeof document === 'undefined') return;

    const shouldAnimateNew = this.#hasRenderedOnce && this.animated.value && !this.#reducedMotion?.value;
    const newlyAdded = [];

    // Reconcile right-aligned so existing place-value digit reels preserve DOM identity
    // and smoothly CSS-transition their transform when value changes.
    while (track.children.length > chars.length) {
      track.removeChild(track.firstChild);
    }

    if (track.children.length < chars.length) {
      const deficit = chars.length - track.children.length;
      const anchor = track.firstChild;
      for (let i = 0; i < deficit; i++) {
        const ch = chars[i];
        const isDigit = /^[0-9]$/.test(ch);
        if (isDigit) {
          const digit = Number(ch);
          const startDigit = shouldAnimateNew ? 0 : digit;
          const col = this.#createDigitColumn(startDigit);
          track.insertBefore(col, anchor);
          if (shouldAnimateNew && digit !== 0) {
            newlyAdded.push({ col, digit });
          }
        } else {
          track.insertBefore(this.#createStaticChar(ch), anchor);
        }
      }
    }

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const isDigit = /^[0-9]$/.test(ch);
      const node = track.children[i];
      if (!node) continue;

      if (isDigit) {
        const digit = Number(ch);
        if (node.classList.contains('digit-column')) {
          if (!newlyAdded.some((item) => item.col === node)) {
            node.style.transform = `translateY(${-digit * 1.25}em)`;
          }
        } else {
          const startDigit = shouldAnimateNew ? 0 : digit;
          const col = this.#createDigitColumn(startDigit);
          track.replaceChild(col, node);
          if (shouldAnimateNew && digit !== 0) {
            newlyAdded.push({ col, digit });
          }
        }
      } else {
        if (node.classList.contains('static-char')) {
          if (node.textContent !== ch) node.textContent = ch;
        } else {
          track.replaceChild(this.#createStaticChar(ch), node);
        }
      }
    }

    if (newlyAdded.length > 0) {
      // Force layout flush so newly inserted reels transition smoothly from 0 to target digit
      void track.offsetWidth;
      for (const { col, digit } of newlyAdded) {
        col.style.transform = `translateY(${-digit * 1.25}em)`;
      }
    }

    this.#hasRenderedOnce = true;
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

    .digits-track {
      display: inline-flex;
      align-items: flex-start;
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
      flex: 0 0 1.25em;
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
    const fullText = () => `${this.prefix.value}${this.#getFormattedValue()}${this.suffix.value}`;
    const isSSR = typeof document === 'undefined';

    return html`
      <div
        class="flow-wrapper"
        part="wrapper"
        role="text"
        aria-label=${fullText}
        style=${() => `--flow-duration: ${this.animated.value && !this.#reducedMotion?.value ? this.duration.value : 0}ms;`}
      >
        ${() => this.prefix.value ? html`<span class="affix prefix" part="prefix">${this.prefix}</span>` : null}

        <span class="digits-track" part="digits" aria-hidden="true">${isSSR ? this.#getFormattedValue() : ''}</span>

        ${() => this.suffix.value ? html`<span class="affix suffix" part="suffix">${this.suffix}</span>` : null}
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-number-flow')) {
  customElements.define('el-number-flow', ElNumberFlow);
}
