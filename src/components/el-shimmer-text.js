import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-shimmer-text>
 * Zero-dependency animated light-sweep sheen across status or AI thinking copy,
 * keeping real solid text color for WCAG 2.2 AA contrast and forced-colors parity.
 *
 * @element el-shimmer-text
 * @attr {number} duration - Sweep loop duration in seconds (default: 2.2)
 * @attr {number} spread - Luminous band half-width percentage (default: 35)
 * @attr {'muted' | 'primary' | 'accent'} variant - Foreground color tone
 * @attr {boolean} paused - Pauses the shimmer animation
 * @csspart text - The rendered text wrapper
 */
export class ElShimmerText extends Elementum {
  static observedAttributes = ['duration', 'spread', 'variant', 'paused'];

  duration = signal(2.2);
  spread = signal(35);
  variant = signal('muted'); // 'muted' | 'primary' | 'accent'
  paused = signal(false);

  connected() {
    this.#sync();
  }

  attributeChanged() {
    this.#sync();
  }

  #sync() {
    const rawDur = parseFloat(this.getAttribute('duration'));
    this.duration.value = Number.isFinite(rawDur) ? Math.max(0.4, Math.min(20, rawDur)) : 2.2;
    const rawSpread = parseFloat(this.getAttribute('spread'));
    this.spread.value = Number.isFinite(rawSpread) ? Math.max(10, Math.min(80, rawSpread)) : 35;
    this.variant.value = this.getAttribute('variant') || 'muted';
    this.paused.value = this.hasAttribute('paused') && this.getAttribute('paused') !== 'false';
  }

  static styles = css`
    :host {
      display: inline-block;
      box-sizing: border-box;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    .shimmer {
      display: inline-block;
      font-weight: 500;
      line-height: 1.5;
      color: var(--el-text-secondary, #475569);
    }

    :host([variant='primary']) .shimmer {
      color: var(--el-color-primary-text, #1d4ed8);
    }

    :host([variant='accent']) .shimmer {
      color: var(
        --el-color-accent-text,
        color-mix(in srgb, var(--el-color-accent, #7c3aed) 65%, var(--el-text-primary, #0f172a))
      );
    }

    :host(:not([paused])) .shimmer {
      -webkit-mask-image: linear-gradient(
        110deg,
        rgba(0, 0, 0, 0.62) calc(50% - var(--el-shimmer-spread, 35%)),
        #000 50%,
        rgba(0, 0, 0, 0.62) calc(50% + var(--el-shimmer-spread, 35%))
      );
      -webkit-mask-size: 250% 100%;
      mask-image: linear-gradient(
        110deg,
        rgba(0, 0, 0, 0.62) calc(50% - var(--el-shimmer-spread, 35%)),
        #000 50%,
        rgba(0, 0, 0, 0.62) calc(50% + var(--el-shimmer-spread, 35%))
      );
      mask-size: 250% 100%;
      animation: shimmer-sweep var(--el-shimmer-duration, 2.2s) linear infinite;
    }

    :host([paused]) .shimmer {
      -webkit-mask-image: none;
      mask-image: none;
      animation: none;
    }

    @keyframes shimmer-sweep {
      from {
        -webkit-mask-position: 150% 0;
        mask-position: 150% 0;
      }
      to {
        -webkit-mask-position: -150% 0;
        mask-position: -150% 0;
      }
    }

    @media (prefers-reduced-motion: reduce), (forced-colors: active) {
      :host(:not([paused])) .shimmer,
      .shimmer {
        -webkit-mask-image: none;
        mask-image: none;
        animation: none;
      }
    }
  `;

  render() {
    return html`
      <span
        class="shimmer"
        part="text"
        style=${() => `--el-shimmer-duration:${this.duration.value}s;--el-shimmer-spread:${this.spread.value}%;`}
      >
        <slot>Thinking...</slot>
      </span>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-shimmer-text')) {
  customElements.define('el-shimmer-text', ElShimmerText);
}
