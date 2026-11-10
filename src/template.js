/**
 * Elementum Tagged Template Engine
 * Ultra-lightweight template literal DOM binding and Constructable Stylesheets.
 */

import { isSignal, effect } from './signal.js';

// Cache for compiled CSSStyleSheets
const styleSheetCache = new Map();

export class CSSResult {
  constructor(cssText) {
    this.cssText = cssText;
    if (typeof CSSStyleSheet !== 'undefined' && 'replaceSync' in CSSStyleSheet.prototype) {
      let sheet = styleSheetCache.get(cssText);
      if (!sheet) {
        sheet = new CSSStyleSheet();
        sheet.replaceSync(cssText);
        styleSheetCache.set(cssText, sheet);
      }
      this.sheet = sheet;
    }
  }

  toString() {
    return this.cssText;
  }
}

export function css(strings, ...values) {
  const cssText = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
  return new CSSResult(cssText);
}

// Marker token for template part tracking
const MARKER = '<!--elementum-part-->';
const ATTR_PREFIX = 'data-el-part-';

export class TemplateResult {
  constructor(strings, values) {
    this.strings = strings;
    this.values = values;
  }
}

export function html(strings, ...values) {
  return new TemplateResult(strings, values);
}

// Template element cache by template string array reference
const templateCache = new WeakMap();

function getCachedTemplate(strings) {
  let cached = templateCache.get(strings);
  if (cached) return cached;

  let htmlString = '';
  const partMeta = [];
  let stripLeadingQuote = null;

  for (let i = 0; i < strings.length - 1; i++) {
    let str = strings[i];
    if (stripLeadingQuote && str.startsWith(stripLeadingQuote)) {
      str = str.slice(1);
      stripLeadingQuote = null;
    }

    // Check if interpolation is inside an HTML tag attribute using accumulated HTML
    const tempHtml = htmlString + str;
    const lastOpenTag = tempHtml.lastIndexOf('<');
    const lastCloseTag = tempHtml.lastIndexOf('>');
    const isInsideTag = lastOpenTag > lastCloseTag;

    if (isInsideTag) {
      // Find attribute name preceding '='
      const match = str.match(/([@.?a-zA-Z0-9_\-]+)\s*=\s*(["']?)$/);
      if (match) {
        const rawName = match[1];
        stripLeadingQuote = match[2] || null;

        let type = 'attr';
        let name = rawName;

        if (rawName.startsWith('@')) {
          type = 'event';
          name = rawName.slice(1);
        } else if (rawName.startsWith('.')) {
          type = 'prop';
          name = rawName.slice(1);
        } else if (rawName.startsWith('?')) {
          type = 'bool';
          name = rawName.slice(1);
        }

        const markerAttr = `${ATTR_PREFIX}${i}`;
        // Cleanly substitute the attribute name and '=' with markerAttr=""
        const cleanStr = str.slice(0, match.index) + `${markerAttr}=""`;
        htmlString += cleanStr;
        partMeta.push({ index: i, type, name, markerAttr });
      } else {
        const markerAttr = `${ATTR_PREFIX}${i}`;
        htmlString += str + ` ${markerAttr}=""`;
        partMeta.push({ index: i, type: 'attr', name: 'data-attr', markerAttr });
      }
    } else {
      // Child node position
      htmlString += str + MARKER;
      partMeta.push({ index: i, type: 'node' });
    }
  }

  let lastStr = strings[strings.length - 1];
  if (stripLeadingQuote && lastStr.startsWith(stripLeadingQuote)) {
    lastStr = lastStr.slice(1);
  }
  htmlString += lastStr;

  const tpl = document.createElement('template');
  tpl.innerHTML = htmlString;

  cached = { template: tpl, partMeta };
  templateCache.set(strings, cached);
  return cached;
}

/**
 * Resolves a dynamic value (signal, function getter, or literal)
 */
function resolveValue(val) {
  if (isSignal(val)) {
    return val.value;
  }
  if (typeof val === 'function' && !val._isEventHandler) {
    return val();
  }
  return val;
}

function isReactive(val) {
  return isSignal(val) || (typeof val === 'function' && !val._isEventHandler);
}

class NodePart {
  constructor(startNode, abortSignal) {
    this.startNode = startNode;
    this.endNode = document.createComment('/part');
    startNode.parentNode.insertBefore(this.endNode, startNode.nextSibling);
    this.abortSignal = abortSignal;
    this.nodes = [];
  }

  clear() {
    for (const node of this.nodes) {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    }
    this.nodes = [];
  }

  commit(raw) {
    const val = resolveValue(raw);
    this.clear();

    const parent = this.startNode.parentNode;
    if (!parent) return;

    if (val == null || val === false) {
      return;
    }

    if (val instanceof TemplateResult) {
      const fragment = document.createDocumentFragment();
      render(val, fragment, this.abortSignal);
      this.nodes = Array.from(fragment.childNodes);
      parent.insertBefore(fragment, this.endNode);
    } else if (Array.isArray(val)) {
      const fragment = document.createDocumentFragment();
      for (const item of val) {
        const resolvedItem = resolveValue(item);
        if (resolvedItem instanceof TemplateResult) {
          const subFrag = document.createDocumentFragment();
          render(resolvedItem, subFrag, this.abortSignal);
          fragment.appendChild(subFrag);
        } else if (resolvedItem != null && resolvedItem !== false) {
          fragment.appendChild(document.createTextNode(String(resolvedItem)));
        }
      }
      this.nodes = Array.from(fragment.childNodes);
      parent.insertBefore(fragment, this.endNode);
    } else {
      const text = document.createTextNode(String(val));
      this.nodes = [text];
      parent.insertBefore(text, this.endNode);
    }
  }
}

export function render(result, container, abortSignal) {
  if (!result || !(result instanceof TemplateResult)) {
    container.textContent = '';
    return;
  }

  const { template, partMeta } = getCachedTemplate(result.strings);
  const fragment = template.content.cloneNode(true);
  const values = result.values;

  // Track and bind parts
  partMeta.forEach((meta) => {
    const val = values[meta.index];

    if (meta.type === 'node') {
      // Find next unattached comment marker
      const iterator = document.createNodeIterator(fragment, NodeFilter.SHOW_COMMENT);
      let commentNode;
      while ((commentNode = iterator.nextNode())) {
        if (commentNode.textContent === 'elementum-part') {
          break;
        }
      }

      if (commentNode) {
        commentNode.textContent = 'part';
        const part = new NodePart(commentNode, abortSignal);

        if (isReactive(val)) {
          effect(() => part.commit(val), { signal: abortSignal });
        } else {
          part.commit(val);
        }
      }
    } else {
      // Attribute / Prop / Event / Bool
      const el = fragment.querySelector(`[${meta.markerAttr}]`);
      if (el) {
        el.removeAttribute(meta.markerAttr);

        if (meta.type === 'event') {
          if (typeof val === 'function') {
            val._isEventHandler = true;
            el.addEventListener(meta.name, val, { signal: abortSignal });
          }
        } else if (meta.type === 'prop') {
          const updateProp = (v) => {
            const resolved = resolveValue(v);
            if (isSignal(el[meta.name])) {
              el[meta.name].value = resolved;
            } else {
              el[meta.name] = resolved;
            }
          };
          if (isReactive(val)) {
            effect(() => updateProp(val), { signal: abortSignal });
          } else {
            updateProp(val);
          }
        } else if (meta.type === 'bool') {
          const updateBool = (v) => {
            const resolved = Boolean(resolveValue(v));
            if (resolved) {
              el.setAttribute(meta.name, '');
            } else {
              el.removeAttribute(meta.name);
            }
          };
          if (isReactive(val)) {
            effect(() => updateBool(val), { signal: abortSignal });
          } else {
            updateBool(val);
          }
        } else {
          // Regular attribute
          const updateAttr = (v) => {
            const resolved = resolveValue(v);
            if (resolved == null || resolved === false) {
              el.removeAttribute(meta.name);
            } else {
              el.setAttribute(meta.name, String(resolved));
            }
          };
          if (isReactive(val)) {
            effect(() => updateAttr(val), { signal: abortSignal });
          } else {
            updateAttr(val);
          }
        }
      }
    }
  });

  if ('replaceChildren' in container) {
    container.replaceChildren(fragment);
  } else {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(fragment);
  }
}
