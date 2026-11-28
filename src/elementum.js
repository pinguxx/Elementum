/**
 * Elementum Base Class
 * Ultra-lightweight custom element with shadow root, signal lifecycle, and styles adoption.
 */

import { render, CSSResult, html, css } from './template.js';
import { signal, isSignal, effect } from './signal.js';
import { setHostState } from './behaviors/index.js';
import { VERSION, version } from './version.js';

export { html, css, VERSION, version };

const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

function toCamelCase(attr) {
  return attr.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
}

function toKebabCase(prop) {
  return prop.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

function hasCustomSubclassAccessor(instance, prop) {
  let proto = Object.getPrototypeOf(instance);
  while (proto && proto !== Elementum.prototype && proto !== BaseElement.prototype && proto !== Object.prototype) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc && (typeof desc.get === 'function' || typeof desc.set === 'function')) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}

export class Elementum extends BaseElement {
  static version = VERSION;

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
  #syncingAttr = false;
  #upgradedProps = new Set();
  #reflectedSignals = new Set();
  #boolAttrs = new Set();
  #syntheticProps = new Set();
  #signalEntries = [];
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
    queueMicrotask(() => this.#setupReactiveProperties());
  }

  setFormValue(value) {
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(value);
    }
  }

  get form() {
    return this.internals?.form || (typeof this.closest === 'function' ? this.closest('form, el-form') : null);
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
      if (anchor && typeof HTMLElement !== 'undefined' && anchor instanceof HTMLElement) {
        this.internals.setValidity(flags, message, anchor);
      } else {
        this.internals.setValidity(flags, message);
      }
    }
    this.setHostState('invalid', isInvalid);
  }

  /**
   * Reflect a standardized component state onto the host element via both
   * `data-<name>` attributes and `ElementInternals.states` (`:state(<name>)`).
   */
  setHostState(name, active) {
    setHostState(this, name, active);
  }

  setCustomValidity(message = '') {
    if (message) {
      this.setValidity({ customError: true }, message);
    } else {
      this.setValidity({});
    }
  }

  #initialFormChecked = null;
  #initialFormValue = null;

  get defaultChecked() {
    return this.#initialFormChecked !== null ? this.#initialFormChecked : this.hasAttribute('checked');
  }

  get defaultValue() {
    return this.#initialFormValue !== null ? this.#initialFormValue : (this.getAttribute('value') ?? '');
  }

  formResetCallback() {
    if (typeof this.formReset === 'function') {
      this.formReset();
      return;
    }
    if (isSignal(this.checked)) {
      const initialChecked = this.defaultChecked;
      this.checked.value = initialChecked;
      this.setFormValue(initialChecked ? (this.defaultValue || 'on') : null);
    } else if (isSignal(this.value)) {
      const initialValue = this.defaultValue;
      this.value.value = initialValue;
      this.setFormValue(initialValue);
    }
  }

  formDisabledCallback(disabled) {
    if (typeof this.formDisabled === 'function') {
      this.formDisabled(disabled);
      return;
    }
    if (isSignal(this.disabled)) {
      this.disabled.value = Boolean(disabled);
    }
  }

  get signal() {
    return this.#abortController?.signal;
  }

  #reflectToAttribute(attrName, val, initialBoolDefault = false) {
    if (this.#syncingAttr || !attrName) return;
    if (typeof val === 'object' && val !== null) return;

    if (typeof val === 'boolean' || initialBoolDefault) {
      const boolVal = typeof val === 'boolean' ? val : (val === 'false' ? false : Boolean(val));
      if (boolVal) {
        if (!this.hasAttribute(attrName) || this.getAttribute(attrName) === 'false') {
          this.setAttribute(attrName, '');
        }
      } else if (this.hasAttribute(attrName)) {
        this.removeAttribute(attrName);
      }
      return;
    }

    if (val === null || val === undefined) {
      if (this.hasAttribute(attrName)) {
        this.removeAttribute(attrName);
      }
      return;
    }

    const strVal = String(val);
    if (this.getAttribute(attrName) !== strVal) {
      this.setAttribute(attrName, strVal);
    }
  }

  #getMappedAttrValue(attr) {
    if (!this.hasAttribute(attr)) {
      return this.#boolAttrs.has(attr) ? false : null;
    }
    const val = this.getAttribute(attr);
    if (this.#boolAttrs.has(attr)) {
      return val !== 'false';
    }
    return val;
  }

  #syncAttributeToProperty(attr, rawVal) {
    const camel = toCamelCase(attr);
    const propKey = (camel !== attr && camel in this) ? camel : attr;
    if (!(propKey in this)) return;
    if (typeof this[propKey] === 'function' || this.#syntheticProps.has(propKey)) return;

    const current = this[propKey];
    const isBool = this.#boolAttrs.has(attr) ||
      (isSignal(current) ? typeof current.peek() === 'boolean' : typeof current === 'boolean');
    const mappedVal = isBool ? (rawVal !== null && rawVal !== 'false') : rawVal;

    if (isSignal(current)) {
      current.value = mappedVal;
    } else {
      this[propKey] = mappedVal;
    }
  }

  #defineSignalProperty(propKey, attrName, sig, isBool, initialVal) {
    if (isBool && attrName) {
      this.#boolAttrs.add(attrName);
    }

    this.#upgradedProps.add(propKey);
    if (attrName) {
      this.#signalEntries.push({ attrName, sig, isBool, initialVal });
    }

    Object.defineProperty(this, propKey, {
      configurable: true,
      enumerable: true,
      get: () => sig,
      set: (val) => {
        if (isSignal(val)) return;
        sig.value = val;
        if (attrName) {
          this.#reflectToAttribute(attrName, val, isBool);
        }
      },
    });
  }

  #setupReactiveProperties() {
    const observed = this.constructor.observedAttributes;
    const observedSet = Array.isArray(observed) ? new Set(observed) : null;

    // 1. Upgrade own Signal properties into two-way reactive accessors
    for (const propKey of Object.keys(this)) {
      if (propKey.startsWith('_') || this.#upgradedProps.has(propKey)) continue;
      if (hasCustomSubclassAccessor(this, propKey)) continue;

      const desc = Object.getOwnPropertyDescriptor(this, propKey);
      if (!desc || !desc.configurable || !('value' in desc) || !isSignal(desc.value)) {
        continue;
      }

      const sig = desc.value;
      const initialVal = sig.peek();
      const isBool = typeof initialVal === 'boolean';
      const kebab = toKebabCase(propKey);
      const attrName = observedSet
        ? (observedSet.has(propKey) ? propKey : (observedSet.has(kebab) ? kebab : null))
        : null;

      this.#defineSignalProperty(propKey, attrName, sig, isBool, initialVal);
    }

    // 2. Ensure remaining observedAttributes have reactive property accessors
    if (!observedSet) return;
    for (const attr of observedSet) {
      const camel = toCamelCase(attr);
      const propKey = (attr in this && !(camel in this)) ? attr : camel;

      if (this.#upgradedProps.has(propKey) || this.#upgradedProps.has(attr)) continue;
      if (hasCustomSubclassAccessor(this, propKey) || (propKey !== attr && hasCustomSubclassAccessor(this, attr))) {
        continue;
      }

      const ownDesc = Object.getOwnPropertyDescriptor(this, propKey);
      if (!ownDesc && propKey in BaseElement.prototype) {
        continue;
      }

      if (ownDesc && !ownDesc.configurable) continue;
      if (ownDesc && !('value' in ownDesc)) continue;

      if (typeof this[propKey] === 'function') {
        const origMethod = this[propKey];
        this.#upgradedProps.add(propKey);
        this.#boolAttrs.add(attr);
        Object.defineProperty(this, propKey, {
          configurable: true,
          enumerable: true,
          get: () => origMethod,
          set: (val) => {
            const boolVal = typeof val === 'boolean' ? val : (val === 'false' ? false : Boolean(val));
            this.#reflectToAttribute(attr, boolVal, true);
          },
        });
        continue;
      }

      // Reconstruct Signal when a pre-mount synchronous assignment overwrote a field before microtask setup
      const hasInitialOwnValue = Boolean(ownDesc && 'value' in ownDesc);
      if (hasInitialOwnValue) {
        const initialVal = ownDesc.value;
        const sig = signal(initialVal);
        const isBool = typeof initialVal === 'boolean';
        this.#defineSignalProperty(propKey, attr, sig, isBool, initialVal);
        if (initialVal !== undefined && !this.hasAttribute(attr)) {
          this.#reflectToAttribute(attr, initialVal, isBool);
        }
        continue;
      }

      this.#upgradedProps.add(propKey);
      this.#syntheticProps.add(propKey);

      Object.defineProperty(this, propKey, {
        configurable: true,
        enumerable: true,
        get: () => this.#getMappedAttrValue(attr),
        set: (val) => {
          if (typeof val === 'boolean') {
            this.#boolAttrs.add(attr);
          }
          this.#reflectToAttribute(attr, val, this.#boolAttrs.has(attr));
        },
      });
    }
  }

  #setupAttributeReflection() {
    if (!this.#abortController) return;
    for (const { attrName, sig, isBool, initialVal } of this.#signalEntries) {
      if (!attrName || this.#reflectedSignals.has(sig)) continue;
      this.#reflectedSignals.add(sig);

      let initialized = false;
      effect(() => {
        const val = sig.value;
        if (!initialized) {
          initialized = true;
          if (val !== initialVal && !this.hasAttribute(attrName)) {
            this.#reflectToAttribute(attrName, val, isBool);
          }
          return;
        }
        this.#reflectToAttribute(attrName, val, isBool);
      }, { signal: this.#abortController.signal });
    }
  }

  connectedCallback() {
    if (this.#abortController) {
      this.#abortController.abort();
    }
    this.#abortController = new AbortController();

    // 1. Shadow Root initialization
    if (this.constructor.shadowRoot !== false) {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
      }
      this.root = this.shadowRoot;

      // 2. Adopt Constructable Stylesheets (skip when `unstyled` attribute is present for headless styling)
      if (this.constructor.styles && !this.hasAttribute('unstyled')) {
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

    // 3. Ensure reactive properties are initialized before syncing attributes or rendering
    this.#setupReactiveProperties();

    if (this.constructor.formAssociated && this.#initialFormChecked === null) {
      this.#initialFormChecked = this.hasAttribute('checked');
      this.#initialFormValue = this.getAttribute('value') ?? '';
    }

    // Sync initial HTML attributes into signals or properties
    const observed = this.constructor.observedAttributes;
    if (Array.isArray(observed)) {
      this.#syncingAttr = true;
      try {
        for (const attr of observed) {
          if (this.hasAttribute(attr)) {
            this.#syncAttributeToProperty(attr, this.getAttribute(attr));
          }
        }
      } finally {
        this.#syncingAttr = false;
      }
    }

    // Reflect initial disabled host state if present
    if (this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false') {
      this.setHostState('disabled', true);
    }

    // 4. User lifecycle hook
    if (typeof this.connected === 'function') {
      this.connected();
    }

    // Reflect signal updates back to host HTML attributes while connected
    this.#setupAttributeReflection();

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
      this.#abortController = null;
    }
    this.#reflectedSignals.clear();
    this.#mounted = false;

    if (typeof this.disconnected === 'function') {
      this.disconnected();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'disabled') {
      this.setHostState('disabled', newValue !== null && newValue !== 'false');
    }

    this.#syncingAttr = true;
    try {
      if (typeof this.attributeChanged === 'function') {
        this.attributeChanged(name, oldValue, newValue);
        return;
      }

      // Sync attribute changes directly into matching signals or properties
      this.#syncAttributeToProperty(name, newValue);
    } finally {
      this.#syncingAttr = false;
    }
  }

  /**
   * Reads a boolean HTML attribute where present and not explicitly `"false"`.
   * @param {string} name
   */
  boolAttr(name) {
    return this.hasAttribute(name) && this.getAttribute(name) !== 'false';
  }

  /**
   * Reads a numeric HTML attribute with fallback and optional [min, max] clamping.
   * @param {string} name
   * @param {number} fallback
   * @param {number} [min]
   * @param {number} [max]
   */
  numAttr(name, fallback, min = -Infinity, max = Infinity) {
    const val = parseFloat(this.getAttribute(name));
    return Number.isFinite(val) ? Math.max(min, Math.min(max, val)) : fallback;
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

if (typeof globalThis !== 'undefined' && typeof globalThis.elementum === 'undefined') {
  globalThis.elementum = Object.freeze({ version: VERSION });
}
