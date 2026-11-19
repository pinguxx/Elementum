/**
 * Declarative Shadow DOM (DSD) Server-Side Renderer for Elementum
 * Emits zero-runtime HTML with <template shadowrootmode="open">
 * for instant hydration in Next.js, Nuxt, Astro, and Node.js.
 */

import { CSSResult, TemplateResult } from './template.js';
import { isSignal } from './signal.js';

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Evaluates dynamic template values safely for SSR
 */
function resolveValue(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'function') {
    try {
      return resolveValue(val());
    } catch {
      return '';
    }
  }
  if (isSignal(val)) {
    return resolveValue(val.value);
  }
  if (Array.isArray(val)) {
    return val.map(resolveValue).join('');
  }
  if (val instanceof TemplateResult) {
    return renderTemplateToString(val);
  }
  return escapeHtml(String(val));
}

/**
 * Renders an Elementum TemplateResult to an HTML string
 */
export function renderTemplateToString(templateResult) {
  if (!(templateResult instanceof TemplateResult)) {
    return resolveValue(templateResult);
  }

  const { strings, values } = templateResult;
  let html = '';

  for (let i = 0; i < strings.length; i++) {
    html += strings[i];
    if (i < values.length) {
      const val = values[i];
      // 1. Skip @event= and on<event>= listeners in SSR (never invoke event handlers!)
      if (typeof val === 'function' && /(?:@[\w.-]+|on[a-z]+)=\s*$/i.test(strings[i])) {
        html = html.replace(/(?:@[\w.-]+|on[a-z]+)=\s*$/i, '');
        continue;
      }
      // 2. Boolean ?attr= bindings: emit bare attribute if truthy, omit if falsy
      const boolMatch = strings[i].match(/\?([\w.-]+)=\s*$/);
      if (boolMatch) {
        const evaluated = resolveValue(val);
        const truthy = evaluated !== '' && evaluated !== 'false' && evaluated !== 'null' && evaluated !== 'undefined' && evaluated !== '0';
        html = html.replace(/\?[\w.-]+=\s*$/, truthy ? boolMatch[1] : '');
        continue;
      }
      // 3. Property .prop= bindings: strip from HTML markup (hydrated on client)
      if (/\.[\w.-]+=\s*$/.test(strings[i])) {
        html = html.replace(/\.[\w.-]+=\s*$/, '');
        continue;
      }
      html += resolveValue(val);
    }
  }

  return html;
}

/**
 * Wraps component shadow styles and template in Declarative Shadow DOM
 * @param {string} tagName - Custom element tag name (e.g. 'el-button')
 * @param {Function} ComponentClass - Elementum component class
 * @param {Object} [attributes={}] - Attribute key-values
 * @param {string} [lightDOMChildren=''] - Slotted children
 * @returns {string} Declarative Shadow DOM HTML string
 */
export function renderComponentToDSD(tagName, ComponentClass, attributes = {}, lightDOMChildren = '') {
  let styleHtml = '';
  if (ComponentClass.styles) {
    const styles = Array.isArray(ComponentClass.styles)
      ? ComponentClass.styles
      : [ComponentClass.styles];
    const cssText = styles
      .map((s) => (s instanceof CSSResult ? s.cssText : String(s)))
      .join('\n');
    styleHtml = `<style>${cssText}</style>`;
  }

  // Instantiate component instance in memory to get its render template
  let shadowBody = '';
  try {
    const instance = new ComponentClass();
    for (const [k, v] of Object.entries(attributes)) {
      const camel = k.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      const targetKey = (camel in instance && isSignal(instance[camel])) ? camel : k;
      if (instance[targetKey] && isSignal(instance[targetKey])) {
        instance[targetKey].value = v;
      }
      if (typeof instance.setAttribute === 'function') {
        instance.setAttribute(k, String(v));
      }
    }
    const template = instance.render?.();
    if (template) {
      shadowBody = renderTemplateToString(template);
    }
  } catch {
    // If DOM environment is unavailable, render minimal fallback
    shadowBody = '<slot></slot>';
  }

  const attrStr = Object.entries(attributes)
    .filter(([_, v]) => v !== false && v !== null && v !== undefined)
    .map(([k, v]) => (v === true ? k : `${k}="${escapeHtml(String(v))}"`))
    .join(' ');

  const openTag = attrStr ? `<${tagName} ${attrStr}>` : `<${tagName}>`;
  const dsdTemplate = `<template shadowrootmode="open">${styleHtml}${shadowBody}</template>`;

  return `${openTag}${dsdTemplate}${lightDOMChildren}</${tagName}>`;
}
