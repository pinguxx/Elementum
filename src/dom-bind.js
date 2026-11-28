/**
 * Lightweight, tree-shakable reactive DOM binding helpers.
 * Bind signals or computed getters directly to DOM attributes, classes, or text
 * with automatic cleanup for surgical, zero-flash updates in vanilla JS apps.
 */

import { effect, isSignal } from './signal.js';

function readSource(source) {
  if (isSignal(source)) return source.value;
  if (typeof source === 'function') return source();
  return source;
}

/**
 * Reactively binds a signal or getter to an element's HTML attribute.
 * - boolean: toggles the attribute (present when true, removed when false)
 * - null / undefined: removes the attribute
 * - other values: sets the attribute to String(value)
 */
export function bindAttr(el, name, source, options) {
  return effect(() => {
    if (!el) return;
    const val = readSource(source);
    if (typeof val === 'boolean') {
      if (val) el.setAttribute(name, '');
      else el.removeAttribute(name);
    } else if (val === null || val === undefined) {
      el.removeAttribute(name);
    } else {
      const str = String(val);
      if (el.getAttribute(name) !== str) el.setAttribute(name, str);
    }
  }, options);
}

/**
 * Reactively toggles a CSS class on an element from a boolean signal or getter.
 */
export function bindClass(el, className, source, options) {
  return effect(() => {
    if (!el || !el.classList) return;
    el.classList.toggle(className, Boolean(readSource(source)));
  }, options);
}

/**
 * Reactively binds a signal or getter to an element's textContent.
 */
export function bindText(el, source, options) {
  return effect(() => {
    if (!el) return;
    const val = readSource(source);
    const next = val === null || val === undefined ? '' : String(val);
    if (el.textContent !== next) el.textContent = next;
  }, options);
}
