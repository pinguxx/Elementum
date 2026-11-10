/**
 * Elementum Base Class
 * Ultra-lightweight custom element with shadow root, signal lifecycle, and styles adoption.
 */

import { render, CSSResult } from './template.js';
import { isSignal } from './signal.js';

const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export class Elementum extends BaseElement {
  /**
   * Set to false to disable Shadow DOM and render into Light DOM
   */
  static shadowRoot = true;

  /**
   * Set to true to participate in native HTML <form> submission & validation
   */
  static formAssociated = false;

  /**
   * CSSResult or array of CSSResults (created via css`...`)
   */
  static styles = null;

  #abortController = null;
  #mounted = false;
  internals = null;
  #validity = {
    valid: true,
    valueMissing: false,
    typeMismatch: false,
    patternMismatch: false,
    tooLong: false,
    tooShort: false,
    rangeUnderflow: false,
    rangeOverflow: false,
    stepMismatch: false,
    badInput: false,
    customError: false,
  };
  #validationMessage = '';

  constructor() {
    super();
    if (this.constructor.formAssociated && typeof this.attachInternals === 'function') {
      this.internals = this.attachInternals();
    }
  }

  setFormValue(value) {
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(value);
    }
  }

  get validity() {
    return this.internals?.validity || this.#validity;
  }

  get validationMessage() {
    return this.internals?.validationMessage || this.#validationMessage;
  }

  get willValidate() {
    return this.internals?.willValidate ?? true;
  }

  checkValidity() {
    if (this.internals && typeof this.internals.checkValidity === 'function') {
      return this.internals.checkValidity();
    }
    return this.validity.valid;
  }

  reportValidity() {
    if (this.internals && typeof this.internals.reportValidity === 'function') {
      return this.internals.reportValidity();
    }
    const isValid = this.checkValidity();
    if (!isValid) {
      this.dispatchEvent(new Event('invalid', { bubbles: false, cancelable: true }));
    }
    return isValid;
  }

  setValidity(flags = {}, message = '', anchor) {
    const isInvalid = Object.values(flags).some(Boolean);
    this.#validity = {
      valid: !isInvalid,
      valueMissing: !!flags.valueMissing,
      typeMismatch: !!flags.typeMismatch,
      patternMismatch: !!flags.patternMismatch,
      tooLong: !!flags.tooLong,
      tooShort: !!flags.tooShort,
      rangeUnderflow: !!flags.rangeUnderflow,
      rangeOverflow: !!flags.rangeOverflow,
      stepMismatch: !!flags.stepMismatch,
      badInput: !!flags.badInput,
      customError: !!flags.customError,
    };
    this.#validationMessage = message || '';

    if (this.internals && typeof this.internals.setValidity === 'function') {
      this.internals.setValidity(flags, message, anchor);
    }
  }

  setCustomValidity(message = '') {
    if (message) {
      this.setValidity({ customError: true }, message);
    } else {
      this.setValidity({});
    }
  }

  formResetCallback() {
    if (typeof this.formReset === 'function') {
      this.formReset();
    }
  }

  formDisabledCallback(disabled) {
    if (typeof this.formDisabled === 'function') {
      this.formDisabled(disabled);
    }
  }

  get signal() {
    return this.#abortController?.signal;
  }

  connectedCallback() {
    this.#abortController = new AbortController();

    // 1. Shadow Root initialization
    if (this.constructor.shadowRoot !== false) {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
      }
      this.root = this.shadowRoot;

      // 2. Adopt Constructable Stylesheets
      if (this.constructor.styles) {
        const rawStyles = Array.isArray(this.constructor.styles)
          ? this.constructor.styles
          : [this.constructor.styles];

        const sheets = [];
        const fallbackStyles = [];

        for (const s of rawStyles) {
          if (s instanceof CSSResult && s.sheet) {
            sheets.push(s.sheet);
          } else {
            fallbackStyles.push(String(s));
          }
        }

        if (sheets.length > 0 && typeof Document !== 'undefined' && 'adoptedStyleSheets' in Document.prototype) {
          this.shadowRoot.adoptedStyleSheets = sheets;
        }

        if (fallbackStyles.length > 0) {
          const styleEl = document.createElement('style');
          styleEl.textContent = fallbackStyles.join('\n');
          this.shadowRoot.appendChild(styleEl);
        }
      }
    } else {
      this.root = this;
    }

    // 3. Sync initial HTML attributes into signals or properties
    const observed = this.constructor.observedAttributes;
    if (Array.isArray(observed)) {
      for (const attr of observed) {
        if (this.hasAttribute(attr)) {
          const val = this.getAttribute(attr);
          if (attr in this) {
            if (isSignal(this[attr])) {
              this[attr].value = val;
            } else {
              this[attr] = val;
            }
          }
        }
      }
    }

    // 4. User lifecycle hook
    if (typeof this.connected === 'function') {
      this.connected();
    }

    // 5. Initial Render
    if (typeof this.render === 'function') {
      const templateResult = this.render();
      if (templateResult) {
        render(templateResult, this.root, this.#abortController.signal);
      }
    }

    this.#mounted = true;

    if (typeof this.rendered === 'function') {
      this.rendered();
    }
  }

  disconnectedCallback() {
    if (this.#abortController) {
      this.#abortController.abort();
    }
    this.#mounted = false;

    if (typeof this.disconnected === 'function') {
      this.disconnected();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    // Sync attribute changes directly into matching signals or properties
    if (name in this) {
      if (isSignal(this[name])) {
        this[name].value = newValue;
      } else {
        this[name] = newValue;
      }
    }

    if (typeof this.attributeChanged === 'function') {
      this.attributeChanged(name, oldValue, newValue);
    }
  }

  /**
   * Helper to dispatch standard bubbling, composed CustomEvents
   */
  emit(eventName, detail = null, options = {}) {
    return this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        detail,
        ...options,
      })
    );
  }
}
