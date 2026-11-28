/**
 * <el-separator>
 * Accessible, zero-dependency divider primitive inspired by Base UI.
 * Renders semantic horizontal or vertical rules with responsive token theming.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElSeparator extends Elementum {
  static observedAttributes = ['orientation', 'decorative'];

  orientation = signal('horizontal');
  decorative = signal(false);

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
    }

    :host([orientation="vertical"]) {
      display: inline-block;
      align-self: stretch;
    }

    .separator.horizontal {
      width: 100%;
      height: 1px;
      background: var(--el-surface-border, #e2e8f0);
      margin: var(--el-spacing-sm, 8px) 0;
    }

    .separator.vertical {
      width: 1px;
      height: 100%;
      min-height: 20px;
      background: var(--el-surface-border, #e2e8f0);
      margin: 0 var(--el-spacing-sm, 8px);
      display: block;
    }
  `;

  connected() {
    if (this.hasAttribute('orientation')) this.orientation.value = this.getAttribute('orientation');
    this.decorative.value = this.getAttribute('decorative') === 'true';

    if (this.decorative.value) {
      this.setAttribute('role', 'none');
    } else {
      this.setAttribute('role', 'separator');
      this.setAttribute('aria-orientation', this.orientation.value);
    }
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'orientation') {
      this.orientation.value = newValue === 'vertical' ? 'vertical' : 'horizontal';
      if (!this.decorative.value) {
        this.setAttribute('aria-orientation', this.orientation.value);
      }
    } else if (name === 'decorative') {
      this.decorative.value = newValue === 'true';
      this.setAttribute('role', this.decorative.value ? 'none' : 'separator');
    }
    return true;
  }

  render() {
    return html`
      <div
        class=${() => `separator ${this.orientation.value}`}
        part="separator"
      ></div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('el-separator')) {
  customElements.define('el-separator', ElSeparator);
}
