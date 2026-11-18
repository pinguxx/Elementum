import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';

/**
 * <el-visually-hidden>
 * Accessibility primitive inspired by Radix Primitives.
 * Hides content visually while keeping it fully accessible to assistive technologies.
 */
export class ElVisuallyHidden extends Elementum {
  static styles = css`
    :host {
      border: 0 !important;
      clip: rect(0 0 0 0) !important;
      clip-path: inset(50%) !important;
      height: 1px !important;
      margin: -1px !important;
      overflow: hidden !important;
      padding: 0 !important;
      position: absolute !important;
      white-space: nowrap !important;
      width: 1px !important;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-visually-hidden')) {
  customElements.define('el-visually-hidden', ElVisuallyHidden);
}
