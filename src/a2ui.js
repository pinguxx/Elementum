/**
 * Elementum A2UI Renderer (@wcomp/elementum/a2ui)
 *
 * Zero-dependency, signal-driven declarative Agent-to-UI (A2UI) surface renderer.
 * Maps streaming A2UI JSON messages (`createSurface`, `surfaceUpdate`, `dataModelUpdate`,
 * `deleteSurface`) onto a locked catalog of native Elementum Web Components with
 * fine-grained two-way micro-signal bindings and zero executable code / zero innerHTML.
 */

import { signal, effect } from './signal.js';

/**
 * Default locked catalog mapping standard A2UI component names to Elementum Web Components
 * and safe structural layout primitives.
 */
export const DEFAULT_A2UI_CATALOG = Object.freeze({
  // Structural layout
  Column: { tag: 'div', layout: 'column' },
  Row: { tag: 'div', layout: 'row' },
  List: { tag: 'div', layout: 'column' },
  Divider: { tag: 'el-separator' },

  // Surfaces & display
  Card: { tag: 'el-card' },
  Text: { tag: 'span', isText: true },
  Badge: { tag: 'el-badge' },
  Callout: { tag: 'el-callout' },
  Alert: { tag: 'el-alert' },
  Progress: { tag: 'el-progress' },
  Meter: { tag: 'el-meter' },
  Avatar: { tag: 'el-avatar' },
  CodeBlock: { tag: 'el-code-block' },

  // Interactive & form controls
  Button: { tag: 'el-button' },
  TextField: { tag: 'el-input', valueProp: 'value', event: 'input' },
  TextArea: { tag: 'el-textarea', valueProp: 'value', event: 'input' },
  Select: { tag: 'el-select', valueProp: 'value', event: 'change' },
  Switch: { tag: 'el-switch', valueProp: 'checked', event: 'change' },
  CheckBox: { tag: 'el-checkbox', valueProp: 'checked', event: 'change' },
  Slider: { tag: 'el-slider', valueProp: 'value', event: 'change' },
  DatePicker: { tag: 'el-datepicker', valueProp: 'value', event: 'change' },
  ChoiceChip: { tag: 'el-chip', isChip: true },
  Tabs: { tag: 'el-tabs' },
  Dialog: { tag: 'el-dialog' },

  // AI specialist primitives
  PromptInput: { tag: 'el-prompt-input', event: 'submit' },
  ReasoningCard: { tag: 'el-reasoning-card' },
  ToolCall: { tag: 'el-tool-call' },
  StreamingText: { tag: 'el-streaming-text' },
  Sources: { tag: 'el-sources' },
});

const UNSAFE_ATTR_RE = /^on/i;
const SAFE_URL_RE = /^(https?:\/\/|\/|#)/i;

function normalizePointer(pointer) {
  if (!pointer || pointer === '/') return '';
  return String(pointer).startsWith('/') ? String(pointer) : `/${pointer}`;
}

function getByPath(obj, pointer) {
  const norm = normalizePointer(pointer);
  if (!norm) return obj;
  const parts = norm.slice(1).split('/');
  let cur = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return cur;
}

function setByPath(obj, pointer, value) {
  const norm = normalizePointer(pointer);
  if (!norm) return value && typeof value === 'object' ? { ...value } : obj;
  const parts = norm.slice(1).split('/');
  const root = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return root;
    const next = cur[key];
    cur[key] = next && typeof next === 'object' ? (Array.isArray(next) ? [...next] : { ...next }) : {};
    cur = cur[key];
  }
  const last = parts[parts.length - 1];
  if (last === '__proto__' || last === 'constructor' || last === 'prototype') return root;
  cur[last] = value;
  return root;
}

function isBoundValue(val) {
  return Boolean(
    val &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      ('path' in val || 'literalString' in val || 'literalNumber' in val || 'literalBoolean' in val)
  );
}

function resolveBoundValue(val, dataModel) {
  if (!isBoundValue(val)) return val;
  if ('path' in val) {
    const fromData = getByPath(dataModel, val.path);
    if (fromData !== undefined) return fromData;
  }
  if ('literalString' in val) return val.literalString;
  if ('literalNumber' in val) return val.literalNumber;
  if ('literalBoolean' in val) return val.literalBoolean;
  return '';
}

function normalizeComponentDef(raw) {
  if (!raw || typeof raw !== 'object') return null;
  // Shape A (A2UI v0.8/v1.0 envelope): { id, component: { Card: { child, ... } } }
  if (raw.component && typeof raw.component === 'object') {
    const entries = Object.entries(raw.component);
    if (entries.length === 0) return null;
    const [type, props] = entries[0];
    return { id: raw.id, type, props: props || {} };
  }
  // Shape B (flat): { id, type: 'Card', props: { ... }, children: [...] }
  if (raw.type) {
    return {
      id: raw.id,
      type: raw.type,
      props: { ...(raw.props || {}), ...(raw.children ? { children: raw.children } : {}) },
    };
  }
  return null;
}

function extractChildIds(props) {
  if (!props || typeof props !== 'object') return [];
  if (typeof props.child === 'string') return [props.child];
  if (Array.isArray(props.children)) return props.children.filter((c) => typeof c === 'string');
  if (props.children && Array.isArray(props.children.explicitList)) {
    return props.children.explicitList.filter((c) => typeof c === 'string');
  }
  return [];
}

/**
 * Creates a locked-catalog, signal-reactive A2UI surface renderer backed by Elementum Web Components.
 *
 * @param {Object} [options]
 * @param {Record<string, Object>} [options.catalog] - Component catalog mapping A2UI names to Elementum tags
 * @param {string[]|Set<string>} [options.allowlist] - Optional strict allowlist of permitted A2UI component names
 * @param {(actionEvent: Object) => void} [options.onAction] - Callback invoked when user triggers an A2UI action
 * @param {Object} [options.initialData] - Initial surface data model
 */
export function createA2UiSurface(options = {}) {
  const catalog = options.catalog ? { ...DEFAULT_A2UI_CATALOG, ...options.catalog } : DEFAULT_A2UI_CATALOG;
  const allowlist = options.allowlist ? new Set(options.allowlist) : null;
  const onAction = typeof options.onAction === 'function' ? options.onAction : null;

  const surfaceId = signal(options.surfaceId || 'default');
  const rootId = signal(null);
  const dataModel = signal(options.initialData ? { ...options.initialData } : {});
  const components = new Map();
  const blockedTypes = signal([]);

  let containerEl = null;
  let activeDisposers = [];

  function clearDisposers() {
    for (const dispose of activeDisposers) {
      try {
        dispose();
      } catch {
        // Ignore cleanup errors
      }
    }
    activeDisposers = [];
  }

  function isAllowed(type) {
    if (!(type in catalog)) return false;
    if (allowlist && !allowlist.has(type)) return false;
    return true;
  }

  function resolveActionContext(actionDef) {
    const ctx = {};
    const rawCtx = actionDef?.context;
    const currentData = dataModel.peek();
    if (Array.isArray(rawCtx)) {
      for (const entry of rawCtx) {
        if (entry && typeof entry.key === 'string') {
          ctx[entry.key] = resolveBoundValue(entry.value, currentData);
        }
      }
    } else if (rawCtx && typeof rawCtx === 'object') {
      for (const [k, v] of Object.entries(rawCtx)) {
        ctx[k] = resolveBoundValue(v, currentData);
      }
    }
    return ctx;
  }

  function buildNode(id, visited = new Set()) {
    if (!id || visited.has(id)) return null;
    const def = components.get(id);
    if (!def) return null;

    if (!isAllowed(def.type)) {
      const prev = blockedTypes.peek();
      if (!prev.includes(def.type)) {
        blockedTypes.value = [...prev, def.type];
      }
      return null;
    }

    visited.add(id);
    const spec = catalog[def.type];
    const props = def.props || {};

    // Determine tag (Text supports usageHint: h1..h4, p, caption)
    let tagName = spec.tag;
    if (spec.isText && props.usageHint) {
      const hintMap = { h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', body: 'p', caption: 'small' };
      tagName = hintMap[props.usageHint] || 'span';
    }

    const el = document.createElement(tagName);
    el.setAttribute('data-a2ui-id', def.id);
    el.setAttribute('data-a2ui-type', def.type);

    // Layout helpers
    if (spec.layout === 'column') {
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.gap = props.gap || '12px';
    } else if (spec.layout === 'row') {
      el.style.display = 'flex';
      el.style.flexDirection = 'row';
      el.style.flexWrap = 'wrap';
      el.style.alignItems = props.align || 'center';
      el.style.gap = props.gap || '10px';
    }

    // Bind text/label content reactively (never innerHTML)
    const contentSource = props.text ?? props.label ?? props.title;
    if (spec.isText || def.type === 'Button' || def.type === 'Badge' || def.type === 'ChoiceChip' || def.type === 'Alert' || def.type === 'Callout' || def.type === 'Switch' || def.type === 'CheckBox') {
      if (contentSource !== undefined) {
        const dispose = effect(() => {
          const val = resolveBoundValue(contentSource, dataModel.value);
          el.textContent = val == null ? '' : String(val);
        });
        activeDisposers.push(dispose);
      }
    }

    // Card header slot support
    if (def.type === 'Card' && props.title !== undefined) {
      const headerEl = document.createElement('h3');
      headerEl.setAttribute('slot', 'header');
      headerEl.style.margin = '0';
      headerEl.style.fontSize = '1.05rem';
      const dispose = effect(() => {
        const val = resolveBoundValue(props.title, dataModel.value);
        headerEl.textContent = val == null ? '' : String(val);
      });
      activeDisposers.push(dispose);
      el.appendChild(headerEl);
    }

    // ChoiceChip selectable + two-way selection binding
    if (spec.isChip) {
      el.setAttribute('selectable', '');
      const chipVal = props.value ?? resolveBoundValue(props.label, dataModel.peek());
      if (props.selected && isBoundValue(props.selected) && props.selected.path) {
        const bindPath = props.selected.path;
        const dispose = effect(() => {
          const current = getByPath(dataModel.value, bindPath);
          const isSelected = current === chipVal;
          if (isSelected) {
            el.setAttribute('selected', '');
          } else {
            el.removeAttribute('selected');
          }
          if (el.selected && typeof el.selected === 'object' && 'value' in el.selected) {
            el.selected.value = isSelected;
          }
        });
        activeDisposers.push(dispose);

        const onClick = () => {
          dataModel.value = setByPath(dataModel.peek(), bindPath, chipVal);
        };
        el.addEventListener('click', onClick);
        activeDisposers.push(() => el.removeEventListener('click', onClick));
      }
    }

    // Bind safe attributes & reactive two-way form controls
    const SKIP_KEYS = new Set(['child', 'children', 'action', 'usageHint', 'gap', 'align', 'text', 'label', 'title', 'selected', 'options']);
    for (const [key, rawVal] of Object.entries(props)) {
      if (SKIP_KEYS.has(key) || UNSAFE_ATTR_RE.test(key)) continue;

      if (key === 'href' || key === 'src') {
        const str = String(resolveBoundValue(rawVal, dataModel.peek()) ?? '');
        if (!SAFE_URL_RE.test(str.trim())) continue;
      }

      const dispose = effect(() => {
        const resolved = resolveBoundValue(rawVal, dataModel.value);
        if (resolved === undefined || resolved === null || resolved === false) {
          el.removeAttribute(key);
        } else if (resolved === true) {
          el.setAttribute(key, '');
        } else if (typeof resolved === 'object') {
          if (el[key] && typeof el[key] === 'object' && 'value' in el[key]) {
            el[key].value = resolved;
          } else {
            el.setAttribute(key, JSON.stringify(resolved));
          }
        } else {
          el.setAttribute(key, String(resolved));
          if (el[key] && typeof el[key] === 'object' && 'value' in el[key]) {
            el[key].value = resolved;
          }
        }
      });
      activeDisposers.push(dispose);

      // Two-way binding when a form control binds `value` or `checked` to a dataModel path
      if (spec.event && isBoundValue(rawVal) && rawVal.path && (key === 'value' || key === 'checked')) {
        const bindPath = rawVal.path;
        const onInputOrChange = (e) => {
          const nextVal =
            key === 'checked'
              ? Boolean(e.detail?.checked ?? e.target?.checked?.value ?? e.target?.checked)
              : (e.detail?.value ?? e.target?.value?.value ?? e.target?.value);
          if (nextVal !== undefined) {
            dataModel.value = setByPath(dataModel.peek(), bindPath, nextVal);
          }
        };
        el.addEventListener(spec.event, onInputOrChange);
        activeDisposers.push(() => el.removeEventListener(spec.event, onInputOrChange));
      }
    }

    // Select options support
    if (def.type === 'Select' && Array.isArray(props.options)) {
      for (const opt of props.options) {
        const optEl = document.createElement('option');
        optEl.value = String(opt.value ?? opt);
        optEl.textContent = String(opt.label ?? opt.value ?? opt);
        el.appendChild(optEl);
      }
    }

    // Action dispatch (Button click or PromptInput submit)
    if (props.action && onAction) {
      const eventName = def.type === 'PromptInput' ? 'submit' : 'click';
      const onTrigger = (e) => {
        const context = resolveActionContext(props.action);
        if (eventName === 'submit' && e.detail?.value !== undefined) {
          context.prompt = e.detail.value;
        }
        onAction({
          surfaceId: surfaceId.peek(),
          actionName: props.action.name || 'action',
          sourceComponentId: def.id,
          context,
        });
      };
      el.addEventListener(eventName, onTrigger);
      activeDisposers.push(() => el.removeEventListener(eventName, onTrigger));
    }

    // Render children recursively
    for (const childId of extractChildIds(props)) {
      const childNode = buildNode(childId, visited);
      if (childNode) el.appendChild(childNode);
    }

    return el;
  }

  function renderSurface() {
    if (!containerEl) return;
    clearDisposers();
    containerEl.replaceChildren();
    const root = rootId.peek();
    if (!root) return;
    const tree = buildNode(root, new Set());
    if (tree) {
      containerEl.appendChild(tree);
    }
  }

  function processMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    if (msg.createSurface) {
      if (msg.createSurface.surfaceId) surfaceId.value = msg.createSurface.surfaceId;
      if (msg.createSurface.root) rootId.value = msg.createSurface.root;
      renderSurface();
    }

    if (msg.beginRendering) {
      if (msg.beginRendering.surfaceId) surfaceId.value = msg.beginRendering.surfaceId;
      if (msg.beginRendering.root) rootId.value = msg.beginRendering.root;
      renderSurface();
    }

    const update = msg.surfaceUpdate || msg.updateComponents;
    if (update && Array.isArray(update.components)) {
      if (update.surfaceId) surfaceId.value = update.surfaceId;
      for (const rawComp of update.components) {
        const norm = normalizeComponentDef(rawComp);
        if (norm && norm.id) {
          components.set(norm.id, norm);
        }
      }
      if (rootId.peek()) {
        renderSurface();
      }
    }

    if (msg.dataModelUpdate) {
      const { path: targetPath = '/', contents, value } = msg.dataModelUpdate;
      if (value !== undefined) {
        dataModel.value = setByPath(dataModel.peek(), targetPath, value);
      } else if (Array.isArray(contents)) {
        let next = dataModel.peek();
        for (const item of contents) {
          if (!item || typeof item.key !== 'string') continue;
          const fullPath = `${normalizePointer(targetPath)}/${item.key}`;
          const val =
            'valueString' in item
              ? item.valueString
              : 'valueNumber' in item
                ? item.valueNumber
                : 'valueBoolean' in item
                  ? item.valueBoolean
                  : item.value;
          next = setByPath(next, fullPath, val);
        }
        dataModel.value = next;
      } else if (contents && typeof contents === 'object') {
        let next = dataModel.peek();
        for (const [k, v] of Object.entries(contents)) {
          const fullPath = `${normalizePointer(targetPath)}/${k}`;
          next = setByPath(next, fullPath, v);
        }
        dataModel.value = next;
      }
    }

    if (msg.deleteSurface) {
      components.clear();
      rootId.value = null;
      clearDisposers();
      if (containerEl) containerEl.replaceChildren();
    }
  }

  function processMessages(messages) {
    if (!Array.isArray(messages)) return;
    for (const msg of messages) {
      processMessage(msg);
    }
  }

  function mount(container) {
    containerEl = container;
    renderSurface();
    return () => destroy();
  }

  function destroy() {
    clearDisposers();
    if (containerEl) {
      containerEl.replaceChildren();
      containerEl = null;
    }
  }

  return {
    surfaceId,
    rootId,
    dataModel,
    blockedTypes,
    processMessage,
    processMessages,
    mount,
    destroy,
  };
}
