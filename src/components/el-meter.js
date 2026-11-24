/**
 * <el-meter>
 * Accessible scalar measurement gauge primitive inspired by Base UI.
 * Displays a known scalar value or fractional measurement within a bounded range
 * (e.g. disk storage, password strength, battery, quota limits) with semantic threshold statuses.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal, computed, effect } from '../signal.js';

export class ElMeter extends Elementum {
  static observedAttributes = ['value', 'min', 'max', 'low', 'high', 'optimum', 'size'];

  value = signal(0);
  min = signal(0);
  max = signal(100);
  low = signal(null);
  high = signal(null);
  optimum = signal(null);
  size = signal('md'); // 'sm' | 'md' | 'lg'

  percentage = computed(() => {
    const val = Number(this.value.value) || 0;
    const minVal = Number(this.min.value) || 0;
    const maxVal = Number(this.max.value) || 100;
    if (maxVal <= minVal) return 0;
    const pct = ((val - minVal) / (maxVal - minVal)) * 100;
    return Math.min(100, Math.max(0, pct));
  });

  status = computed(() => {
    const val = Number(this.value.value) || 0;
    const lowVal = this.low.value !== null ? Number(this.low.value) : null;
    const highVal = this.high.value !== null ? Number(this.high.value) : null;
    const optVal = this.optimum.value !== null ? Number(this.optimum.value) : null;

    if (lowVal === null || highVal === null) {
      return 'default';
    }

    const optimum = optVal !== null ? optVal : (lowVal + highVal) / 2;

    // Higher is better (e.g., battery, storage remaining)
    if (optimum >= highVal) {
      if (val >= highVal) return 'safe';
      if (val >= lowVal) return 'warning';
      return 'critical';
    }

    // Lower is better (e.g., CPU load, disk usage)
    if (optimum <= lowVal) {
      if (val <= lowVal) return 'safe';
      if (val <= highVal) return 'warning';
      return 'critical';
    }

    // Medium is optimum
    if (val >= lowVal && val <= highVal) return 'safe';
    return 'warning';
  });

  static styles = css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      font-variant-numeric: tabular-nums;
      box-sizing: border-box;
    }

    .meter-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .track {
      width: 100%;
      background: var(--el-surface-muted, #e2e8f0);
      border-radius: 9999px;
      overflow: hidden;
      position: relative;
    }

    :host([size="sm"]) .track {
      height: 4px;
    }

    :host([size="md"]) .track,
    :host(:not([size])) .track {
      height: 8px;
    }

    :host([size="lg"]) .track {
      height: 12px;
    }

    :host-context([data-theme="dark"]) .track {
      background: #334155;
    }

    .fill {
      height: 100%;
      border-radius: inherit;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease;
      background: var(--el-color-primary, #2563eb);
    }

    :host([data-status="safe"]) .fill {
      background: var(--el-color-success, #16a34a);
    }

    :host([data-status="warning"]) .fill {
      background: var(--el-color-warning, #eab308);
    }

    :host([data-status="critical"]) .fill {
      background: var(--el-color-danger, #dc2626);
    }
  `;

  #stopEffect = null;

  connected() {
    this.#syncAttributes();
    this.#stopEffect = effect(() => {
      this.setAttribute('data-status', this.status.value);
    });
  }

  disconnected() {
    this.#stopEffect?.();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value') this.value.value = Number(newValue) || 0;
    else if (name === 'min') this.min.value = Number(newValue) || 0;
    else if (name === 'max') this.max.value = Number(newValue) || 100;
    else if (name === 'low') this.low.value = newValue !== null ? Number(newValue) : null;
    else if (name === 'high') this.high.value = newValue !== null ? Number(newValue) : null;
    else if (name === 'optimum') this.optimum.value = newValue !== null ? Number(newValue) : null;
    else if (name === 'size') this.size.value = newValue || 'md';
    return true;
  }

  #syncAttributes() {
    if (this.hasAttribute('value')) this.value.value = Number(this.getAttribute('value')) || 0;
    if (this.hasAttribute('min')) this.min.value = Number(this.getAttribute('min')) || 0;
    if (this.hasAttribute('max')) this.max.value = Number(this.getAttribute('max')) || 100;
    if (this.hasAttribute('low')) this.low.value = Number(this.getAttribute('low'));
    if (this.hasAttribute('high')) this.high.value = Number(this.getAttribute('high'));
    if (this.hasAttribute('optimum')) this.optimum.value = Number(this.getAttribute('optimum'));
    if (this.hasAttribute('size')) this.size.value = this.getAttribute('size');
  }

  render() {
    return html`
      <div
        class="meter-container"
        role="meter"
        aria-label=${() => this.getAttribute?.('aria-label') || 'Meter'}
        aria-valuenow=${() => this.value.value}
        aria-valuemin=${() => this.min.value}
        aria-valuemax=${() => this.max.value}
        aria-valuetext=${() => `${Math.round(this.percentage.value)}%`}
      >
        <div class="track" part="track">
          <div
            class="fill"
            part="fill"
            style=${() => `width: ${this.percentage.value}%;`}
          ></div>
        </div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-meter')) {
  customElements.define('el-meter', ElMeter);
}
