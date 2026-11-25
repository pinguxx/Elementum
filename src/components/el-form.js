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
      background: var(--el-surface-elevated, #ffffff);
    }

    legend {
      font-size: 0.95rem;
      font-weight: 600;
      padding: 0 6px;
      color: var(--el-text-primary, #0f172a);
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
  static observedAttributes = ['novalidate', 'toolname', 'tooldescription', 'toolautosubmit'];

  novalidate = signal(false);
  toolname = signal('');
  tooldescription = signal('');
  toolautosubmit = signal(false);
  #mcpCtrl = null;
  #mcpName = '';

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
    this.toolname.value = this.getAttribute('toolname') || '';
    this.tooldescription.value = this.getAttribute('tooldescription') || '';
    this.toolautosubmit.value = this.hasAttribute('toolautosubmit');
    this.addEventListener('submit', this.#onSubmit);
    this.#syncWebMCP();
  }

  disconnected() {
    this.removeEventListener('submit', this.#onSubmit);
    this.#unregisterWebMCP();
  }

  attributeChanged(name, oldValue, newValue) {
    if (name === 'novalidate') this.novalidate.value = newValue !== null;
    if (name === 'toolname') {
      this.toolname.value = newValue || '';
      this.#syncWebMCP();
    }
    if (name === 'tooldescription') {
      this.tooldescription.value = newValue || '';
      this.#syncWebMCP();
    }
    if (name === 'toolautosubmit') this.toolautosubmit.value = newValue !== null;
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

  getToolSchema() {
    const properties = {};
    const required = [];
    for (const el of this.elements) {
      const name = el.getAttribute('name');
      if (!name || name === '__proto__' || name === 'constructor' || name === 'prototype') continue;
      const tag = el.tagName.toLowerCase();
      const inputType = (el.getAttribute('type') || '').toLowerCase();
      const isBool = tag === 'el-checkbox' || tag === 'el-switch' || (tag === 'input' && inputType === 'checkbox');
      const isNum = tag === 'el-number-field' || tag === 'el-slider' || (tag === 'input' && (inputType === 'number' || inputType === 'range'));
      const prop = { type: isBool ? 'boolean' : isNum ? 'number' : 'string' };
      const desc = el.getAttribute('toolparamdescription') || el.getAttribute('label') || el.getAttribute('aria-label') || el.getAttribute('placeholder');
      if (desc) prop.description = desc;
      const opts = Array.from(el.querySelectorAll?.('option, el-option') || []).map((o) => o.getAttribute('value') ?? o.textContent?.trim()).filter(Boolean);
      if (opts.length) prop.enum = opts;
      properties[name] = prop;
      if (el.hasAttribute('required') || el.closest?.('el-field')?.hasAttribute('required')) required.push(name);
    }
    const schema = { type: 'object', properties };
    if (required.length) schema.required = required;
    return schema;
  }

  #applyToolArgs(args = {}) {
    if (!args || typeof args !== 'object') return;
    for (const el of this.elements) {
      const name = el.getAttribute('name');
      if (!name || !Object.prototype.hasOwnProperty.call(args, name)) continue;
      if (name === '__proto__' || name === 'constructor' || name === 'prototype') continue;
      const val = args[name];
      const isCheck = el.tagName === 'INPUT' ? (el.type === 'checkbox' || el.type === 'radio') : el.checked !== undefined;
      if (isCheck) {
        const b = Boolean(val);
        if (typeof el.checked === 'object' && 'value' in el.checked) el.checked.value = b;
        else el.checked = b;
        if (b) el.setAttribute('checked', '');
        else el.removeAttribute('checked');
      } else if (el.value !== undefined) {
        const s = val == null ? '' : String(val);
        if (typeof el.value === 'object' && 'value' in el.value) el.value.value = s;
        else el.value = s;
        el.setAttribute('value', s);
      }
      el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }
  }

  #unregisterWebMCP() {
    this.#mcpCtrl?.abort();
    this.#mcpCtrl = null;
    const mc = typeof navigator !== 'undefined' ? navigator.modelContext : null;
    if (this.#mcpName && typeof mc?.unregisterTool === 'function') {
      try { mc.unregisterTool(this.#mcpName); } catch {}
    }
    this.#mcpName = '';
  }

  #syncWebMCP() {
    this.#unregisterWebMCP();
    const name = this.toolname.value.trim();
    const mc = typeof navigator !== 'undefined' ? navigator.modelContext : null;
    if (!name || !this.isConnected || typeof mc?.registerTool !== 'function') return;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    this.#mcpCtrl = ctrl;
    this.#mcpName = name;
    const tool = {
      name,
      description: this.tooldescription.value.trim() || `Submit ${name} form`,
      inputSchema: this.getToolSchema(),
      execute: (args = {}) => {
        this.#applyToolArgs(args);
        const valid = this.novalidate.value ? true : this.validate();
        const data = this.getFormData();
        const submitted = Boolean(valid && this.toolautosubmit.value);
        if (submitted) this.emit('form-submit', { data });
        else if (!valid) this.emit('form-invalid', { data });
        return { ok: valid, submitted, data };
      },
    };
    mc.registerTool(tool, ctrl ? { signal: ctrl.signal } : undefined);
  }

  render() {
    return html`
      <form
        part="form"
        ?novalidate=${() => this.novalidate.value}
        toolname=${() => this.toolname.value || null}
        tooldescription=${() => this.tooldescription.value || null}
        ?toolautosubmit=${() => this.toolautosubmit.value}
        @submit=${this.#onSubmit}
      >
        <slot></slot>
      </form>
    `;
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('el-fieldset')) customElements.define('el-fieldset', ElFieldset);
  if (!customElements.get('el-form')) customElements.define('el-form', ElForm);
}
