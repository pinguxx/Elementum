import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElProgress extends Elementum {
  static observedAttributes = ['value', 'max', 'variant', 'size', 'indeterminate', 'striped'];

  value = signal(0);
  max = signal(100);
  variant = signal('primary'); // 'primary' | 'success' | 'danger'
  size = signal('md'); // 'sm' | 'md' | 'lg'
  indeterminate = signal(false);
  striped = signal(false);

  connected() {
    this.#syncValues();
  }

  attributeChanged(name, oldValue, newValue) {
    this.#syncValues();
  }

  #syncValues() {
    const rawVal = this.getAttribute('value');
    this.value.value = rawVal !== null ? Math.max(0, Number(rawVal) || 0) : 0;
    this.max.value = Math.max(1, Number(this.getAttribute('max')) || 100);
    this.indeterminate.value = this.hasAttribute('indeterminate') || rawVal === null;
    this.striped.value = this.hasAttribute('striped');
    this.variant.value = this.getAttribute('variant') || 'primary';
    this.size.value = this.getAttribute('size') || 'md';
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }

    .track {
      position: relative;
      width: 100%;
      background: var(--el-surface-muted, #f1f5f9);
      border-radius: var(--el-radius-full, 9999px);
      overflow: hidden;
      border: 1px solid var(--el-surface-border, #e2e8f0);
    }

    :host([size='sm']) .track {
      height: 6px;
    }

    :host([size='md']) .track,
    .track {
      height: 10px;
    }

    :host([size='lg']) .track {
      height: 16px;
    }

    .bar {
      height: 100%;
      border-radius: var(--el-radius-full, 9999px);
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .bar[data-variant='primary'] {
      background: var(--el-color-primary, #2563eb);
    }

    .bar[data-variant='success'] {
      background: var(--el-color-success, #10b981);
    }

    .bar[data-variant='danger'] {
      background: var(--el-color-danger, #ef4444);
    }

    /* Indeterminate animation */
    :host([indeterminate]) .bar {
      width: 40% !important;
      position: absolute;
      animation: el-progress-indeterminate 1.5s infinite ease-in-out;
    }

    @keyframes el-progress-indeterminate {
      0% {
        left: -40%;
      }
      50% {
        left: 40%;
        width: 60%;
      }
      100% {
        left: 100%;
        width: 40%;
      }
    }

    /* Striped styling */
    :host([striped]) .bar {
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.2) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0.2) 75%,
        transparent 75%,
        transparent
      );
      background-size: 1rem 1rem;
      animation: el-progress-stripes 1s linear infinite;
    }

    @keyframes el-progress-stripes {
      from {
        background-position: 1rem 0;
      }
      to {
        background-position: 0 0;
      }
    }
  `;

  render() {
    const percentage = () => {
      if (this.indeterminate.value) return '0%';
      const clamped = Math.min(this.max.value, Math.max(0, this.value.value));
      return `${Math.round((clamped / this.max.value) * 100)}%`;
    };

    return html`
      <div
        class="track"
        part="track"
        role="progressbar"
        aria-valuenow=${() => (this.indeterminate.value ? null : this.value.value)}
        aria-valuemin="0"
        aria-valuemax=${() => this.max.value}
        aria-label=${() => this.getAttribute('aria-label') || 'Progress'}
      >
        <div
          class="bar"
          part="bar"
          data-variant=${() => this.variant.value}
          style=${() => `width: ${percentage()};`}
        ></div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-progress')) {
  customElements.define('el-progress', ElProgress);
}
