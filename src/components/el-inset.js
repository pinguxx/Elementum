import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * <el-inset>
 * Layout utility component inspired by Radix Themes.
 * Extends slotted media, tables, or hero content flush to the edges of its parent container.
 */
export class ElInset extends Elementum {
  static observedAttributes = ['side', 'clip'];

  side = signal('all'); // all | top | bottom | x | y
  clip = signal('border-box');

  static styles = css`
    :host {
      display: block;
      margin: -16px;
      margin-bottom: 16px;
      overflow: hidden;
      box-sizing: border-box;
    }

    :host([side="top"]) {
      margin-top: -16px;
      margin-left: -16px;
      margin-right: -16px;
      margin-bottom: 16px;
      border-top-left-radius: inherit;
      border-top-right-radius: inherit;
    }

    :host([side="bottom"]) {
      margin-bottom: -16px;
      margin-left: -16px;
      margin-right: -16px;
      margin-top: 16px;
      border-bottom-left-radius: inherit;
      border-bottom-right-radius: inherit;
    }

    :host([side="x"]) {
      margin-left: -16px;
      margin-right: -16px;
      margin-top: 0;
      margin-bottom: 0;
    }

    :host([side="y"]) {
      margin-top: -16px;
      margin-bottom: -16px;
      margin-left: 0;
      margin-right: 0;
    }

    ::slotted(img),
    ::slotted(video),
    ::slotted(picture) {
      display: block;
      width: 100%;
      height: auto;
      object-fit: cover;
    }

    ::slotted(table),
    ::slotted(el-table) {
      width: 100%;
      border-radius: 0;
    }
  `;

  connected() {
    this.side.value = this.getAttribute('side') || 'all';
    this.clip.value = this.getAttribute('clip') || 'border-box';
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'side') this.side.value = newValue || 'all';
    if (name === 'clip') this.clip.value = newValue || 'border-box';
  }

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-inset')) {
  customElements.define('el-inset', ElInset);
}
