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

  for (let i = 0; i < strings.length - 1; i++) {
    const str = strings[i];
    htmlString += str;

    // Check if interpolation is inside an HTML tag attribute
    const lastOpenTag = str.lastIndexOf('<');
    const lastCloseTag = str.lastIndexOf('>');
    const isInsideTag = lastOpenTag > lastCloseTag;

    if (isInsideTag) {
      // Find attribute name preceding '='
      const match = str.match(/([@.?a-zA-Z0-9_\-]+)\s*=\s*["']?$/);
      if (match) {
        const rawName = match[1];
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
        htmlString += `"" ${markerAttr}=""`;
        partMeta.push({ index: i, type, name, markerAttr });
      } else {
        // Plain attribute or value
        const markerAttr = `${ATTR_PREFIX}${i}`;
        htmlString += `"" ${markerAttr}=""`;
        partMeta.push({ index: i, type: 'attr', name: 'data-attr', markerAttr });
      }
    } else {
      // Child node position
      htmlString += MARKER;
      partMeta.push({ index: i, type: 'node' });
    }
  }

  htmlString += strings[strings.length - 1];

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
      // Find comment markers
      const iterator = document.createNodeIterator(fragment, NodeFilter.SHOW_COMMENT);
      let commentNode;
      while ((commentNode = iterator.nextNode())) {
        if (commentNode.textContent === 'elementum-part') {
          break;
        }
      }

      if (commentNode) {
        const textNode = document.createTextNode('');
        commentNode.parentNode.replaceChild(textNode, commentNode);

        const updateText = (v) => {
          const resolved = resolveValue(v);
          if (resolved instanceof TemplateResult) {
            textNode.textContent = '';
            render(resolved, textNode.parentNode, abortSignal);
          } else if (Array.isArray(resolved)) {
            // Handle array of template results or strings
            const span = document.createDocumentFragment();
            resolved.forEach((item) => {
              if (item instanceof TemplateResult) {
                const subContainer = document.createElement('span');
                render(item, subContainer, abortSignal);
                span.appendChild(subContainer);
              } else {
                span.appendChild(document.createTextNode(String(item)));
              }
            });
            textNode.parentNode.replaceChild(span, textNode);
          } else {
            textNode.data = resolved == null ? '' : String(resolved);
          }
        };

        if (isReactive(val)) {
          effect(() => updateText(val), { signal: abortSignal });
        } else {
          updateText(val);
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
            el[meta.name] = resolveValue(v);
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

  container.innerHTML = '';
  container.appendChild(fragment);
}
