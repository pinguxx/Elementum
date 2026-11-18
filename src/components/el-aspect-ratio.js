/**
 * <el-aspect-ratio>
 * Responsive aspect-ratio container inspired by shadcn/ui.
 * Enforces fixed dimensions (e.g. 16/9, 4/3, 1/1, 21/9) to eliminate
 * Cumulative Layout Shift (CLS) for videos, embeds, and hero images.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElAspectRatio extends Elementum {
  static observedAttributes = ['ratio'];

  ratio = signal('16/9');

  static styles = css`
    :host {
      display: block;
      width: 100%;
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
    }

    .container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      box-sizing: border-box;
    }

    ::slotted(img),
    ::slotted(video),
    ::slotted(iframe),
    ::slotted(canvas) {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      display: block !important;
    }
  `;

  connected() {
    this.#syncRatio();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'ratio') this.#syncRatio();
    return true;
  }

  #syncRatio() {
    const raw = this.getAttribute('ratio') || '16/9';
    this.ratio.value = raw;
    this.style.aspectRatio = raw.replace(':', '/');
  }

  render() {
    return html`
      <div class="container" part="container">
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-aspect-ratio')) {
  customElements.define('el-aspect-ratio', ElAspectRatio);
}
