/**
 * <el-slider>
 * Accessible, zero-dependency slider primitive supporting single-value
 * or range tracking, keyboard navigation, touch/mouse dragging, and form association.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElSlider extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['value', 'min', 'max', 'step', 'orientation', 'disabled', 'name'];

  value = signal(50);
  min = signal(0);
  max = signal(100);
  step = signal(1);
  orientation = signal('horizontal');
  disabled = signal(false);

  #isDragging = false;

  static styles = css`
    :host {
      display: inline-block;
      width: 100%;
      min-width: 140px;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      box-sizing: border-box;
      user-select: none;
      touch-action: none;
    }

    :host([orientation="vertical"]) {
      width: auto;
      min-width: 0;
      height: 160px;
    }

    .slider-root {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      height: 24px;
      cursor: pointer;
    }

    :host([orientation="vertical"]) .slider-root {
      flex-direction: column;
      width: 24px;
      height: 100%;
    }

    :host([disabled]) .slider-root {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .track {
      position: relative;
      background: var(--el-surface-border, #e2e8f0);
      border-radius: 9999px;
      width: 100%;
      height: 6px;
      overflow: hidden;
      transition: background 150ms ease;
    }

    :host([orientation="vertical"]) .track {
      width: 6px;
      height: 100%;
    }

    .range-fill {
      position: absolute;
      background: var(--el-color-primary, #2563eb);
      border-radius: 9999px;
      height: 100%;
      left: 0;
      top: 0;
      pointer-events: none;
      transition: width 50ms linear, height 50ms linear;
    }

    :host([orientation="vertical"]) .range-fill {
      width: 100%;
      bottom: 0;
      top: auto;
    }

    .thumb {
      position: absolute;
      top: 50%;
      width: 18px;
      height: 18px;
      margin-top: -9px;
      margin-left: -9px;
      background: var(--el-surface-base, #ffffff);
      border: 2px solid var(--el-color-primary, #2563eb);
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.06);
      cursor: grab;
      outline: none;
      transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
      box-sizing: border-box;
    }

    :host([orientation="vertical"]) .thumb {
      left: 50%;
      top: auto;
      margin-left: -9px;
      margin-bottom: -9px;
    }

    .thumb:hover {
      transform: scale(1.1);
    }

    .thumb:focus-visible {
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35);
      border-color: var(--el-color-primary-hover, #1d4ed8);
    }

    .thumb.dragging {
      cursor: grabbing;
      transform: scale(1.15);
    }
  `;

  connected() {
    this.#syncFromAttributes();
    this.tabIndex = this.disabled.value ? -1 : 0;
    this.setAttribute('role', 'slider');
    this.#updateAria();
    this.setFormValue(String(this.value.value));

    this.addEventListener('keydown', this.#onKeyDown);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'value') {
      const num = parseFloat(newValue);
      if (!isNaN(num)) this.value.value = this.#clamp(num);
    } else if (name === 'min') {
      const num = parseFloat(newValue);
      if (!isNaN(num)) this.min.value = num;
    } else if (name === 'max') {
      const num = parseFloat(newValue);
      if (!isNaN(num)) this.max.value = num;
    } else if (name === 'step') {
      const num = parseFloat(newValue);
      if (!isNaN(num) && num > 0) this.step.value = num;
    } else if (name === 'orientation') {
      this.orientation.value = newValue === 'vertical' ? 'vertical' : 'horizontal';
    } else if (name === 'disabled') {
      this.disabled.value = newValue !== null && newValue !== 'false';
      this.tabIndex = this.disabled.value ? -1 : 0;
    }
    this.#updateAria();
    this.setFormValue(String(this.value.value));
    return true;
  }

  #syncFromAttributes() {
    if (this.hasAttribute('min')) this.min.value = parseFloat(this.getAttribute('min')) || 0;
    if (this.hasAttribute('max')) this.max.value = parseFloat(this.getAttribute('max')) || 100;
    if (this.hasAttribute('step')) this.step.value = parseFloat(this.getAttribute('step')) || 1;
    if (this.hasAttribute('value')) {
      this.value.value = this.#clamp(parseFloat(this.getAttribute('value')) || 0);
    }
    if (this.hasAttribute('orientation')) {
      this.orientation.value = this.getAttribute('orientation') === 'vertical' ? 'vertical' : 'horizontal';
    }
    this.disabled.value = this.hasAttribute('disabled');
  }

  #updateAria() {
    this.setAttribute('aria-valuenow', String(this.value.value));
    this.setAttribute('aria-valuemin', String(this.min.value));
    this.setAttribute('aria-valuemax', String(this.max.value));
    this.setAttribute('aria-orientation', this.orientation.value);
    this.setAttribute('aria-disabled', String(this.disabled.value));
  }

  #clamp(val) {
    const minVal = this.min.value;
    const maxVal = this.max.value;
    const stepVal = this.step.value;
    let clamped = Math.min(maxVal, Math.max(minVal, val));
    if (stepVal > 0) {
      const steps = Math.round((clamped - minVal) / stepVal);
      clamped = minVal + steps * stepVal;
    }
    return Math.min(maxVal, Math.max(minVal, Math.round(clamped * 10000) / 10000));
  }

  #getPercentage() {
    const minVal = this.min.value;
    const maxVal = this.max.value;
    if (maxVal <= minVal) return 0;
    const pct = ((this.value.value - minVal) / (maxVal - minVal)) * 100;
    return Math.min(100, Math.max(0, pct));
  }

  #setValueFromPosition(clientX, clientY) {
    const track = this.root.querySelector('.track');
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const isVertical = this.orientation.value === 'vertical';

    let ratio = 0;
    if (isVertical) {
      ratio = (rect.bottom - clientY) / rect.height;
    } else {
      ratio = (clientX - rect.left) / rect.width;
    }
    ratio = Math.max(0, Math.min(1, ratio));

    const minVal = this.min.value;
    const maxVal = this.max.value;
    const rawVal = minVal + ratio * (maxVal - minVal);
    const newVal = this.#clamp(rawVal);

    if (newVal !== this.value.value) {
      this.value.value = newVal;
      this.#updateAria();
      this.setFormValue(String(newVal));
      this.emit('input', { value: newVal });
    }
  }

  #onPointerDown = (e) => {
    if (this.disabled.value) return;
    this.#isDragging = true;
    const thumb = this.root.querySelector('.thumb');
    if (thumb) thumb.classList.add('dragging');

    this.#setValueFromPosition(e.clientX, e.clientY);
    this.focus();

    const onPointerMove = (moveEvent) => {
      if (!this.#isDragging) return;
      this.#setValueFromPosition(moveEvent.clientX, moveEvent.clientY);
    };

    const onPointerUp = () => {
      if (this.#isDragging) {
        this.#isDragging = false;
        if (thumb) thumb.classList.remove('dragging');
        this.emit('change', { value: this.value.value });
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  #onKeyDown = (e) => {
    if (this.disabled.value) return;
    const minVal = this.min.value;
    const maxVal = this.max.value;
    const stepVal = this.step.value || 1;
    let next = this.value.value;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        next += stepVal;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        next -= stepVal;
        break;
      case 'PageUp':
        e.preventDefault();
        next += (maxVal - minVal) * 0.1;
        break;
      case 'PageDown':
        e.preventDefault();
        next -= (maxVal - minVal) * 0.1;
        break;
      case 'Home':
        e.preventDefault();
        next = minVal;
        break;
      case 'End':
        e.preventDefault();
        next = maxVal;
        break;
      default:
        return;
    }

    const clamped = this.#clamp(next);
    if (clamped !== this.value.value) {
      this.value.value = clamped;
      this.#updateAria();
      this.setFormValue(String(clamped));
      this.emit('input', { value: clamped });
      this.emit('change', { value: clamped });
    }
  };

  render() {
    return html`
      <div
        class="slider-root"
        @pointerdown=${this.#onPointerDown}
        @keydown=${this.#onKeyDown}
        tabindex="-1"
      >
        <div class="track" part="track">
          <div
            class="range-fill"
            part="range"
            style=${() => {
              const pct = this.#getPercentage();
              return this.orientation.value === 'vertical'
                ? `height: ${pct}%;`
                : `width: ${pct}%;`;
            }}
          ></div>
        </div>
        <div
          class="thumb"
          part="thumb"
          style=${() => {
            const pct = this.#getPercentage();
            return this.orientation.value === 'vertical'
              ? `bottom: ${pct}%;`
              : `left: ${pct}%;`;
          }}
        ></div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-slider')) {
  customElements.define('el-slider', ElSlider);
}
