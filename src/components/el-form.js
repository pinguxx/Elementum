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

    :host-context([data-theme="dark"]) fieldset {
      border-color: #334155;
      background: #1e293b;
    }

    legend {
      font-size: 0.95rem;
      font-weight: 600;
      padding: 0 6px;
      color: var(--el-text-primary, #0f172a);
    }

    :host-context([data-theme="dark"]) legend {
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

  get form() {
    return this.shadowRoot?.querySelector('form') || null;
  }

  get elements() {
    const nativeTags = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'FIELDSET', 'OUTPUT']);
    return Array.from(this.querySelectorAll('*')).filter(
      (el) => nativeTags.has(el.tagName) || el.constructor?.formAssociated === true
    );
  }

  #onSubmit = (e) => {
    e?.preventDefault?.();
    const data = this.getFormData();
    const isValid = this.validate();

    if (!isValid && !this.novalidate.value) {
      this.emit('form-invalid', { data });
      return;
    }

    this.emit('form-submit', { data });
  };

  requestSubmit() {
    this.#onSubmit({ preventDefault() {} });
  }

  checkValidity() {
    let allValid = true;
    for (const el of this.elements) {
      if (typeof el.checkValidity === 'function' && !el.checkValidity()) {
        allValid = false;
      }
    }
    return allValid;
  }

  reportValidity() {
    let allValid = true;
    for (const el of this.elements) {
      if (typeof el.reportValidity === 'function') {
        if (!el.reportValidity()) allValid = false;
      } else if (typeof el.checkValidity === 'function') {
        if (!el.checkValidity()) allValid = false;
      }
    }
    return allValid;
  }

  validate() {
    return this.reportValidity();
  }

  #readControlEntry(el) {
    const name = el.getAttribute('name');
    const dis = el.hasAttribute?.('disabled') || (el.disabled?.value ?? el.disabled);
    if (!name || dis) return null;

    const unwrap = (v) => (v && typeof v === 'object' && 'value' in v ? v.value : v);
    if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
      return el.checked ? [name, el.value || 'on'] : null;
    }
    if (el.tagName !== 'INPUT' && el.checked !== undefined) {
      return unwrap(el.checked) ? [name, unwrap(el.value) || el.getAttribute('value') || 'on'] : null;
    }
    if ('value' in el) return [name, unwrap(el.value) ?? ''];
    return el.hasAttribute('value') ? [name, el.getAttribute('value') ?? ''] : null;
  }

  toFormData() {
    const fd = new FormData();
    for (const el of this.elements) {
      const entry = this.#readControlEntry(el);
      if (!entry) continue;
      for (const v of Array.isArray(entry[1]) ? entry[1] : [entry[1]]) fd.append(entry[0], String(v));
    }
    return fd;
  }

  getFormData() {
    const data = {};
    for (const el of this.elements) {
      const entry = this.#readControlEntry(el);
      if (entry) data[entry[0]] = entry[1];
    }
    return data;
  }

  reset() {
    for (const el of this.elements) {
      if (typeof el.formResetCallback === 'function') el.formResetCallback();
      else if (typeof el.formReset === 'function') el.formReset();
      else if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) el.checked = Boolean(el.defaultChecked);
      else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = el.defaultValue ?? '';
      else if (el.tagName === 'SELECT') el.selectedIndex = 0;
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
