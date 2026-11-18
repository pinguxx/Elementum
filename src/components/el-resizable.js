/**
 * <el-resizable> family
 * Accessible resizable panel splitter inspired by shadcn/ui.
 * Includes <el-resizable-panel> and <el-resizable-handle> with smooth pointer dragging,
 * keyboard arrow sizing, touch support, and min/max boundaries.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElResizableHandle extends Elementum {
  static observedAttributes = ['disabled'];
  disabled = signal(false);

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      z-index: 10;
      box-sizing: border-box;
      flex-shrink: 0;
      width: 8px;
      cursor: col-resize;
      background: var(--el-surface-border, #cbd5e1);
      transition: background-color 0.15s ease;
    }

    :host([direction="vertical"]) {
      width: 100%;
      height: 8px;
      cursor: row-resize;
    }

    :host(:hover),
    :host([dragging]),
    :host(:focus-visible) {
      background: var(--el-color-primary, #3b82f6) !important;
      outline: none;
    }

    .handle-bar {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .grip {
      width: 4px;
      height: 24px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.7);
    }
  `;

  connected() {
    this.disabled.value = this.hasAttribute('disabled');
    this.setAttribute('role', 'separator');
    this.setAttribute('tabindex', '0');
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'disabled') this.disabled.value = newValue !== null;
    return true;
  }

  render() {
    return html`
      <div class="handle-bar" part="handle">
        <slot><div class="grip"></div></slot>
      </div>
    `;
  }
}

export class ElResizablePanel extends Elementum {
  static observedAttributes = ['default-size', 'min-size', 'max-size'];

  size = signal(50); // percentage
  minSize = signal(10);
  maxSize = signal(90);

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow: auto;
      position: relative;
      min-width: 0;
      min-height: 0;
    }
  `;

  connected() {
    const def = parseFloat(this.getAttribute('default-size') || '50');
    this.size.value = def;
    this.minSize.value = parseFloat(this.getAttribute('min-size') || '10');
    this.maxSize.value = parseFloat(this.getAttribute('max-size') || '90');
    this.#applySize();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'default-size') this.size.value = parseFloat(newValue || '50');
    if (name === 'min-size') this.minSize.value = parseFloat(newValue || '10');
    if (name === 'max-size') this.maxSize.value = parseFloat(newValue || '90');
    this.#applySize();
    return true;
  }

  setSize(pct) {
    const clamped = Math.min(Math.max(pct, this.minSize.value), this.maxSize.value);
    this.size.value = clamped;
    this.#applySize();
  }

  #applySize() {
    this.style.flex = `0 0 ${this.size.value}%`;
  }

  render() {
    return html`<slot></slot>`;
  }
}

export class ElResizable extends Elementum {
  static observedAttributes = ['direction'];

  direction = signal('horizontal'); // 'horizontal' | 'vertical'
  #isDragging = false;
  #activeHandle = null;
  #startPos = 0;
  #prevPanel = null;
  #nextPanel = null;
  #startPrevSize = 0;
  #startNextSize = 0;

  static styles = css`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
      min-height: 120px;
      box-sizing: border-box;
      overflow: hidden;
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 8px);
      background: var(--el-surface-card, #ffffff);
    }

    :host([direction="horizontal"]) {
      flex-direction: row;
    }

    :host([direction="vertical"]) {
      flex-direction: column;
    }

    ::slotted(el-resizable-handle) {
      width: 8px;
      cursor: col-resize;
    }

    :host([direction="vertical"]) ::slotted(el-resizable-handle) {
      width: 100%;
      height: 8px;
      cursor: row-resize;
    }
  `;

  connected() {
    this.direction.value = this.getAttribute('direction') || 'horizontal';
    if (!this.hasAttribute('direction')) this.setAttribute('direction', 'horizontal');

    this.#ensurePanelsAndHandles();

    this.addEventListener('pointerdown', this.#onPointerDown);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  #ensurePanelsAndHandles() {
    const children = Array.from(this.children);
    if (children.length >= 2 && !this.querySelector('el-resizable-handle')) {
      const handle = document.createElement('el-resizable-handle');
      children[0].after(handle);
    }
    Array.from(this.children).forEach((child) => {
      if (child.tagName.toLowerCase() !== 'el-resizable-handle') {
        if (!child.style.flex) {
          child.style.flex = '1 1 0%';
          child.style.overflow = 'auto';
          child.style.boxSizing = 'border-box';
        }
      }
    });
  }

  disconnected() {
    this.removeEventListener('pointerdown', this.#onPointerDown);
    this.removeEventListener('keydown', this.#onKeyDown);
    this.#stopDragging();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'direction') this.direction.value = newValue || 'horizontal';
    return true;
  }

  #onPointerDown = (e) => {
    const handle = e.target.closest('el-resizable-handle');
    if (!handle || handle.disabled?.value) return;

    this.#activeHandle = handle;
    this.#prevPanel = handle.previousElementSibling;
    this.#nextPanel = handle.nextElementSibling;

    if (!this.#prevPanel || !this.#nextPanel) return;

    this.#isDragging = true;
    handle.setAttribute('dragging', '');
    this.#startPos = this.direction.value === 'horizontal' ? e.clientX : e.clientY;

    const totalDim = (this.direction.value === 'horizontal' ? this.offsetWidth : this.offsetHeight) || 1;
    const prevRect = this.#prevPanel.getBoundingClientRect();
    const nextRect = this.#nextPanel.getBoundingClientRect();

    this.#startPrevSize = this.#prevPanel.size?.value ?? (((this.direction.value === 'horizontal' ? prevRect.width : prevRect.height) / totalDim) * 100);
    this.#startNextSize = this.#nextPanel.size?.value ?? (((this.direction.value === 'horizontal' ? nextRect.width : nextRect.height) / totalDim) * 100);

    window.addEventListener('pointermove', this.#onPointerMove);
    window.addEventListener('pointerup', this.#onPointerUp);
    window.addEventListener('pointercancel', this.#onPointerUp);
    e.preventDefault();
  };

  #onPointerMove = (e) => {
    if (!this.#isDragging || !this.#prevPanel || !this.#nextPanel) return;

    const currentPos = this.direction.value === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPos - this.#startPos;
    const totalPixels = this.direction.value === 'horizontal' ? this.offsetWidth : this.offsetHeight;

    if (totalPixels <= 0) return;

    const deltaPct = (delta / totalPixels) * 100;
    const newPrev = this.#startPrevSize + deltaPct;
    const newNext = this.#startNextSize - deltaPct;

    const minPrev = this.#prevPanel.minSize?.value ?? 10;
    const maxPrev = this.#prevPanel.maxSize?.value ?? 90;
    const minNext = this.#nextPanel.minSize?.value ?? 10;
    const maxNext = this.#nextPanel.maxSize?.value ?? 90;

    if (newPrev >= minPrev && newPrev <= maxPrev && newNext >= minNext && newNext <= maxNext) {
      if (typeof this.#prevPanel.setSize === 'function') {
        this.#prevPanel.setSize(newPrev);
      } else {
        this.#prevPanel.style.flex = `0 0 ${newPrev}%`;
      }
      if (typeof this.#nextPanel.setSize === 'function') {
        this.#nextPanel.setSize(newNext);
      } else {
        this.#nextPanel.style.flex = `0 0 ${newNext}%`;
      }
      this.emit('resize', { prevSize: newPrev, nextSize: newNext });
    }
  };

  #onPointerUp = () => {
    this.#stopDragging();
  };

  #stopDragging() {
    if (!this.#isDragging) return;
    this.#isDragging = false;
    this.#activeHandle?.removeAttribute('dragging');
    this.#activeHandle = null;
    window.removeEventListener('pointermove', this.#onPointerMove);
    window.removeEventListener('pointerup', this.#onPointerUp);
    window.removeEventListener('pointercancel', this.#onPointerUp);
  }

  #onKeyDown = (e) => {
    const handle = document.activeElement?.closest('el-resizable-handle');
    if (!handle) return;

    const prev = handle.previousElementSibling;
    const next = handle.nextElementSibling;
    if (!prev || !next) return;

    let step = 0;
    if (this.direction.value === 'horizontal') {
      if (e.key === 'ArrowLeft') step = -4;
      if (e.key === 'ArrowRight') step = 4;
    } else {
      if (e.key === 'ArrowUp') step = -4;
      if (e.key === 'ArrowDown') step = 4;
    }

    if (step !== 0) {
      e.preventDefault();
      prev.setSize(prev.size.value + step);
      next.setSize(next.size.value - step);
      this.emit('resize', { prevSize: prev.size.value, nextSize: next.size.value });
    }
  };

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-resizable-handle')) customElements.define('el-resizable-handle', ElResizableHandle);
  if (!customElements.get('el-resizable-panel')) customElements.define('el-resizable-panel', ElResizablePanel);
  if (!customElements.get('el-resizable')) customElements.define('el-resizable', ElResizable);
}
