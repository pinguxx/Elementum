/**
 * Elementum Base Class
 * Ultra-lightweight custom element with shadow root, signal lifecycle, and styles adoption.
 */

import { render, CSSResult } from './template.js';
import { isSignal } from './signal.js';

export class Elementum extends HTMLElement {
  /**
   * Set to false to disable Shadow DOM and render into Light DOM
   */
  static shadowRoot = true;

  /**
   * CSSResult or array of CSSResults (created via css`...`)
   */
  static styles = null;

  #abortController = null;
  #mounted = false;

  constructor() {
    super();
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

        if (sheets.length > 0 && 'adoptedStyleSheets' in Document.prototype) {
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

    // 3. User lifecycle hook
    if (typeof this.connected === 'function') {
      this.connected();
    }

    // 4. Initial Render
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
