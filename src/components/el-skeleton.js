/**
 * <el-skeleton>
 * Accessible shimmer loading placeholder primitive inspired by shadcn/ui.
 * Supports text, circular, rectangular, and custom rounded variants
 * with wave or pulse animation and custom dimensions.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElSkeleton extends Elementum {
  static observedAttributes = ['variant', 'width', 'height', 'animation'];

  variant = signal('text'); // 'text' | 'circular' | 'rectangular'
  width = signal('');
  height = signal('');
  animation = signal('wave'); // 'wave' | 'pulse' | 'none'

  static styles = css`
    :host {
      display: inline-block;
      box-sizing: border-box;
      line-height: 1;
      width: 100%;
    }

    :host([variant="circular"]) {
      width: auto;
      display: inline-block;
    }

    .skeleton {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 16px;
      border-radius: var(--el-radius-sm, 6px);
      background: var(--el-skeleton-bg, #e2e8f0);
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }

    /* Variants */
    :host([variant="text"]) .skeleton {
      height: 16px;
      border-radius: var(--el-radius-sm, 4px);
      margin: 4px 0;
    }

    :host([variant="circular"]) .skeleton {
      border-radius: 9999px;
      width: 40px;
      height: 40px;
      min-height: 40px;
    }

    :host([variant="rectangular"]) .skeleton {
      border-radius: var(--el-radius-md, 8px);
      min-height: 36px;
    }

    /* Wave Animation */
    :host([animation="wave"]) .skeleton::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        transparent 0%,
        var(--el-skeleton-shimmer, rgba(255, 255, 255, 0.5)) 50%,
        transparent 100%
      );
      animation: el-skeleton-wave 1.6s infinite ease-in-out;
    }

    /* Pulse Animation */
    :host([animation="pulse"]) .skeleton {
      animation: el-skeleton-pulse 1.8s infinite ease-in-out;
    }

    @keyframes el-skeleton-wave {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    @keyframes el-skeleton-pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.35;
      }
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
    this.variant.value = this.getAttribute('variant') || 'text';
    this.width.value = this.getAttribute('width') || '';
    this.height.value = this.getAttribute('height') || '';
    this.animation.value = this.getAttribute('animation') || 'wave';

    if (!this.hasAttribute('variant')) this.setAttribute('variant', 'text');
    if (!this.hasAttribute('animation')) this.setAttribute('animation', 'wave');
  }

  render() {
    const customStyle = () => {
      const styles = [];
      if (this.width.value) styles.push(`width: ${this.width.value};`);
      if (this.height.value) styles.push(`height: ${this.height.value};`);
      return styles.join(' ');
    };

    return html`
      <div
        class="skeleton"
        part="skeleton"
        role="status"
        aria-label="Loading..."
        style=${customStyle}
      >
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-skeleton')) {
  customElements.define('el-skeleton', ElSkeleton);
}
