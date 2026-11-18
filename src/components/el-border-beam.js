import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-border-beam>
 * Magic UI & Aceternity-inspired luminous border highlight that travels around the perimeter of any parent container.
 * Uses hardware-accelerated CSS conic rotation with mask clipping. Zero JS runtime loops.
 *
 * @element el-border-beam
 * @attr {number} size - Length/spread of the beam in degrees or pixels (default: 60)
 * @attr {number} duration - Full rotation loop duration in seconds (default: 8)
 * @attr {string} color-from - Starting gradient color (default: var(--el-color-primary, #2563eb))
 * @attr {string} color-to - Ending gradient color (default: var(--el-color-accent, #a855f7))
 * @attr {number} border-width - Thickness of the border beam line in px (default: 1.5)
 * @attr {boolean} reverse - Reverse clockwise direction
 */
export class ElBorderBeam extends Elementum {
  static observedAttributes = ['size', 'duration', 'color-from', 'color-to', 'border-width', 'reverse'];

  size = signal(60);
  duration = signal(8);
  colorFrom = signal('var(--el-color-primary, #2563eb)');
  colorTo = signal('var(--el-color-accent, #a855f7)');
  borderWidth = signal(1.5);
  reverse = signal(false);

  connected() {
    this.#syncAttributes();
  }

  attributeChangedCallback() {
    this.#syncAttributes();
  }

  #syncAttributes() {
    if (this.hasAttribute('size')) {
      this.size.value = parseFloat(this.getAttribute('size')) || 60;
    }
    if (this.hasAttribute('duration')) {
      this.duration.value = parseFloat(this.getAttribute('duration')) || 8;
    }
    if (this.hasAttribute('color-from')) {
      this.colorFrom.value = this.getAttribute('color-from');
    }
    if (this.hasAttribute('color-to')) {
      this.colorTo.value = this.getAttribute('color-to');
    }
    if (this.hasAttribute('border-width')) {
      this.borderWidth.value = parseFloat(this.getAttribute('border-width')) || 1.5;
    }
    this.reverse.value = this.hasAttribute('reverse');
  }

  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      overflow: hidden;
      display: block;
      box-sizing: border-box;
      z-index: 1;
    }

    .beam-track {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: var(--beam-border-width, 1.5px);
      box-sizing: border-box;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
    }

    .beam-spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 200%;
      height: 200%;
      transform: translate(-50%, -50%);
      background: conic-gradient(
        from 0deg,
        transparent 0deg,
        transparent calc(180deg - var(--beam-size, 60deg)),
        var(--beam-color-from, #2563eb) calc(180deg - var(--beam-size, 60deg) / 2),
        var(--beam-color-to, #a855f7) 180deg,
        transparent calc(180deg + 15deg),
        transparent 360deg
      );
      animation: beam-spin var(--beam-duration, 8s) linear infinite;
    }

    :host([reverse]) .beam-spinner {
      animation-direction: reverse;
    }

    @keyframes beam-spin {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .beam-spinner {
        animation: none;
        opacity: 0.4;
      }
    }
  `;

  render() {
    return html`
      <div
        class="beam-track"
        style=${() => `
          --beam-size: ${this.size.value}deg;
          --beam-duration: ${this.duration.value}s;
          --beam-color-from: ${this.colorFrom.value};
          --beam-color-to: ${this.colorTo.value};
          --beam-border-width: ${this.borderWidth.value}px;
        `}
      >
        <div class="beam-spinner"></div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-border-beam')) {
  customElements.define('el-border-beam', ElBorderBeam);
}
