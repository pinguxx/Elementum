import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElSpinner extends Elementum {
  static observedAttributes = ['size', 'variant', 'label'];

  size = signal('md'); // 'sm' | 'md' | 'lg'
  variant = signal('primary'); // 'primary' | 'muted' | 'white'
  label = signal('Loading');

  connected() {
    this.#sync();
  }

  attributeChanged(name, oldValue, newValue) {
    this.#sync();
  }

  #sync() {
    this.size.value = this.getAttribute('size') || 'md';
    this.variant.value = this.getAttribute('variant') || 'primary';
    this.label.value = this.getAttribute('label') || 'Loading';
  }

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      box-sizing: border-box;
    }

    .spinner {
      animation: el-spin 0.8s linear infinite;
      transform-origin: center;
    }

    :host([size='sm']) .spinner,
    .spinner.size-sm {
      width: 16px;
      height: 16px;
    }

    :host([size='md']) .spinner,
    .spinner,
    .spinner.size-md {
      width: 24px;
      height: 24px;
    }

    :host([size='lg']) .spinner,
    .spinner.size-lg {
      width: 36px;
      height: 36px;
    }

    .circle-bg {
      opacity: 0.25;
    }

    .circle-arc {
      opacity: 0.9;
      stroke-dasharray: 80;
      stroke-dashoffset: 60;
    }

    .variant-primary {
      color: var(--el-color-primary, #2563eb);
    }

    .variant-muted {
      color: var(--el-text-muted, #64748b);
    }

    .variant-white {
      color: #ffffff;
    }

    @keyframes el-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  render() {
    return html`
      <div
        class=${() => `spinner size-${this.size.value} variant-${this.variant.value}`}
        part="spinner"
        role="status"
        aria-label=${() => this.label.value}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:100%;height:100%;">
          <circle class="circle-bg" cx="12" cy="12" r="10" stroke="currentColor"></circle>
          <path class="circle-arc" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-linecap="round"></path>
        </svg>
        <span class="sr-only">${() => this.label.value}</span>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-spinner')) {
  customElements.define('el-spinner', ElSpinner);
}
