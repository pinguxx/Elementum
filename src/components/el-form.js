/**
 * <el-form> & <el-fieldset>
 * Accessible reactive form orchestrator inspired by Base UI and shadcn/ui.
 * Intercepts submission, triggers validation across all Form Associated Custom Elements (FACE),
 * exposes validity states, and groups fields with semantic fieldset/legend tags.
 */

import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElFieldset extends Elementum {
  static observedAttributes = ['legend', 'disabled'];

  legend = signal('');
  disabled = signal(false);

  static styles = css`
    :host {
      display: block;
      margin: 0 0 20px 0;
      padding: 0;
      border: none;
      box-sizing: border-box;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    fieldset {
      border: 1px solid var(--el-surface-border, #e2e8f0);
      border-radius: var(--el-radius-md, 8px);
      padding: 16px 20px 20px 20px;
      margin: 0;
      box-sizing: border-box;
      background: var(--el-surface-base, #ffffff);
    }

    :root[data-theme="dark"] fieldset {
      border-color: #334155;
      background: #1e293b;
    }

    legend {
      font-size: 0.95rem;
      font-weight: 600;
      padding: 0 6px;
      color: var(--el-text-primary, #0f172a);
    }

    :root[data-theme="dark"] legend {
      color: #f8fafc;
    }

    :host([disabled]) {
      opacity: 0.6;
      pointer-events: none;
    }
  `;

  connected() {
    this.legend.value = this.getAttribute('legend') || '';
    this.disabled.value = this.hasAttribute('disabled');
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'legend') this.legend.value = newValue || '';
    if (name === 'disabled') this.disabled.value = newValue !== null;
    return true;
  }

  render() {
    return html`
      <fieldset ?disabled=${() => this.disabled.value}>
        ${() => (this.legend.value ? html`<legend part="legend">${() => this.legend.value}</legend>` : '')}
        <slot></slot>
      </fieldset>
    `;
  }
}

export class ElForm extends Elementum {
  static observedAttributes = ['novalidate'];

  novalidate = signal(false);

  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    form {
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
    }
  `;

  connected() {
    this.novalidate.value = this.hasAttribute('novalidate');
    this.addEventListener('submit', this.#onSubmit);
  }

  disconnected() {
    this.removeEventListener('submit', this.#onSubmit);
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'novalidate') this.novalidate.value = newValue !== null;
    return true;
  }

  #onSubmit = (e) => {
    e.preventDefault();
    const data = this.getFormData();
    const isValid = this.validate();

    if (!isValid && !this.novalidate.value) {
      this.emit('form-invalid', { data });
      return;
    }

    this.emit('form-submit', { data });
  };

  validate() {
    let allValid = true;
    const elements = Array.from(this.querySelectorAll('*')).filter(
      el => typeof el.checkValidity === 'function' || typeof el.reportValidity === 'function'
    );

    for (const el of elements) {
      if (typeof el.reportValidity === 'function') {
        const ok = el.reportValidity();
        if (!ok) allValid = false;
      } else if (typeof el.checkValidity === 'function') {
        const ok = el.checkValidity();
        if (!ok) allValid = false;
      }
    }
    return allValid;
  }

  getFormData() {
    const data = {};
    const elements = Array.from(this.querySelectorAll('[name]'));
    for (const el of elements) {
      const name = el.getAttribute('name');
      if (!name) continue;
      if ('value' in el) {
        data[name] = typeof el.value === 'object' && el.value !== null && 'value' in el.value ? el.value.value : el.value;
      } else if (el.hasAttribute('value')) {
        data[name] = el.getAttribute('value');
      }
    }
    return data;
  }

  reset() {
    const elements = Array.from(this.querySelectorAll('*'));
    for (const el of elements) {
      if (typeof el.formReset === 'function') el.formReset();
      if (typeof el.formResetCallback === 'function') el.formResetCallback();
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        el.value = '';
      }
    }
    this.emit('form-reset');
  }

  render() {
    return html`
      <form part="form" ?novalidate=${() => this.novalidate.value} @submit=${this.#onSubmit}>
        <slot></slot>
      </form>
    `;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-fieldset')) customElements.define('el-fieldset', ElFieldset);
  if (!customElements.get('el-form')) customElements.define('el-form', ElForm);
}
