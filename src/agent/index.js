/**
 * @wcomp/elementum/agent — Shadow-DOM-Aware Agent Runtime Bridge (WebMCP)
 * Lets AI agents inspect live Elementum interfaces (`snapshot`) and operate them
 * semantically (`act`) across open Shadow DOM boundaries without brittle CSS scraping.
 */

const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'textbox',
  'searchbox',
  'combobox',
  'checkbox',
  'switch',
  'radio',
  'tab',
  'menuitem',
  'option',
  'slider',
  'spinbutton',
  'dialog',
  'alertdialog',
  'listbox',
]);

const INTERACTIVE_NATIVE_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea', 'dialog']);

const lastSnapshotRefs = new WeakMap();

function isHidden(el) {
  if (!el || el.nodeType !== 1) return true;
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') return true;
  if (el.style && (el.style.display === 'none' || el.style.visibility === 'hidden')) return true;
  return false;
}

function inferRole(el) {
  const explicit = el.getAttribute?.('role');
  if (explicit) return explicit;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'button' || tag === 'el-button') return 'button';
  if (tag === 'a') return 'link';
  if (tag === 'input' || tag === 'el-input' || tag === 'el-textarea' || tag === 'textarea') return 'textbox';
  if (tag === 'select' || tag === 'el-select' || tag === 'el-autocomplete') return 'combobox';
  if (tag === 'el-checkbox') return 'checkbox';
  if (tag === 'el-switch') return 'switch';
  if (tag === 'el-radio') return 'radio';
  if (tag === 'el-tab') return 'tab';
  if (tag === 'el-slider') return 'slider';
  if (tag === 'el-dialog' || tag === 'dialog') return 'dialog';
  if (tag === 'el-alert-dialog') return 'alertdialog';
  if (tag === 'el-drawer') return 'dialog';
  if (tag === 'el-popover' || tag === 'el-dropdown') return 'region';
  if (tag === 'el-accordion-item' || tag === 'el-collapsible') return 'button';
  if (tag === 'el-command-item') return 'option';
  return null;
}

function getAccessibleName(el) {
  const ariaLabel = el.getAttribute?.('aria-label');
  if (ariaLabel) return ariaLabel.trim();
  const labelAttr = el.getAttribute?.('label') || el.getAttribute?.('title') || el.getAttribute?.('heading') || el.getAttribute?.('placeholder');
  if (labelAttr) return labelAttr.trim();
  const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (text) return text.slice(0, 120);
  return '';
}

function readValue(el) {
  if (el.value !== undefined && el.value !== null) {
    if (typeof el.value === 'object' && 'value' in el.value) return el.value.value;
    if (typeof el.value === 'string' || typeof el.value === 'number') return el.value;
  }
  return el.getAttribute?.('value') ?? undefined;
}

function readState(el) {
  const state = {};
  const dataState = el.getAttribute?.('data-state');
  if (dataState) state.dataState = dataState;

  if (el.hasAttribute?.('disabled') || el.disabled === true || el.disabled?.value === true) {
    state.disabled = true;
  }
  if (el.checked === true || el.checked?.value === true || el.hasAttribute?.('checked') || el.getAttribute?.('aria-checked') === 'true') {
    state.checked = true;
  }
  if (el.isOpen?.value === true || el.hasAttribute?.('open') || el.open === true) {
    state.open = true;
  }
  const expanded = el.getAttribute?.('aria-expanded');
  if (expanded === 'true' || expanded === 'false') {
    state.expanded = expanded === 'true';
  }
  const selected = el.getAttribute?.('aria-selected');
  if (selected === 'true' || selected === 'false') {
    state.selected = selected === 'true';
  }
  return state;
}

function inferActions(el, role) {
  const actions = [];
  const tag = (el.tagName || '').toLowerCase();
  if (role === 'button' || role === 'link' || role === 'tab' || role === 'menuitem' || role === 'option') {
    actions.push('click');
  }
  if (role === 'checkbox' || role === 'switch' || role === 'radio') {
    actions.push('toggle');
  }
  if (role === 'textbox' || role === 'searchbox' || role === 'combobox') {
    actions.push('type');
  }
  if (typeof el.open === 'function' || typeof el.show === 'function' || typeof el.showModal === 'function') {
    actions.push('open');
  }
  if (typeof el.close === 'function' || typeof el.hide === 'function') {
    actions.push('close');
  }
  if (tag === 'el-accordion-item' || tag === 'el-collapsible' || typeof el.toggle === 'function') {
    if (!actions.includes('toggle')) actions.push('toggle');
  }
  return actions;
}

/**
 * Produces a structured, Shadow-DOM-piercing snapshot of interactive elements
 * for AI agents, assigning deterministic `@e1`, `@e2`, ... handles usable by `act()`.
 *
 * @param {Element | Document | ShadowRoot} [root]
 * @param {{ includeShadow?: boolean, maxNodes?: number }} [options]
 */
export function snapshot(root = typeof document !== 'undefined' ? document.body : null, options = {}) {
  const { includeShadow = true, maxNodes = 250 } = options;
  const nodes = [];
  const refMap = new Map();
  let counter = 0;

  if (!root) return { nodes, count: 0 };

  const visited = new Set();

  const walk = (node) => {
    if (!node || nodes.length >= maxNodes || visited.has(node)) return;
    visited.add(node);

    if (node.nodeType === 1) {
      if (isHidden(node)) return;
      const tag = node.tagName.toLowerCase();
      const isCustom = tag.startsWith('el-');
      const role = inferRole(node);
      const isInteractive =
        isCustom ||
        INTERACTIVE_NATIVE_TAGS.has(tag) ||
        (role && INTERACTIVE_ROLES.has(role));

      if (isInteractive && role) {
        const ref = `@e${++counter}`;
        refMap.set(ref, node);
        const entry = {
          ref,
          tag,
          role,
          name: getAccessibleName(node),
          state: readState(node),
          actions: inferActions(node, role),
        };
        const val = readValue(node);
        if (val !== undefined && val !== '') entry.value = val;
        nodes.push(entry);
      }

      // Traverse children in Light DOM
      for (const child of node.children || []) {
        walk(child);
      }

      // Pierce open Shadow DOM for non-leaf containers (skip duplicating inner controls of leaf el-* widgets)
      if (includeShadow && node.shadowRoot && !isCustom) {
        for (const shadowChild of node.shadowRoot.children || []) {
          walk(shadowChild);
        }
      }
      return;
    }

    // Document or ShadowRoot
    for (const child of node.children || []) {
      walk(child);
    }
  };

  walk(root);
  if (typeof root === 'object' && root !== null) {
    lastSnapshotRefs.set(root, refMap);
  }
  return { nodes, count: nodes.length };
}

function findElement(root, command) {
  if (!root || !command) return null;
  if (command.ref) {
    const map = lastSnapshotRefs.get(root);
    if (map?.has(command.ref)) return map.get(command.ref);
    // Re-snapshot if map wasn't populated yet
    snapshot(root);
    const refreshed = lastSnapshotRefs.get(root);
    if (refreshed?.has(command.ref)) return refreshed.get(command.ref);
  }
  if (command.selector && typeof root.querySelector === 'function') {
    const direct = root.querySelector(command.selector);
    if (direct) return direct;
  }
  if (command.name || command.role) {
    const snap = snapshot(root);
    const map = lastSnapshotRefs.get(root);
    const wantedName = (command.name || '').toLowerCase();
    const match = snap.nodes.find((n) => {
      const roleOk = !command.role || n.role === command.role;
      const nameOk = !wantedName || n.name.toLowerCase().includes(wantedName);
      return roleOk && nameOk;
    });
    if (match) return map.get(match.ref);
  }
  return null;
}

/**
 * Executes a semantic agent action (`click`, `type`, `toggle`, `open`, `close`, `focus`, `press`)
 * against an element identified by `ref` (from `snapshot()`), `selector`, or `role`/`name`.
 * Supports an optional `options.guard(context)` safety hook to gate destructive actions.
 *
 * @param {Element | Document | ShadowRoot} root
 * @param {{ ref?: string, selector?: string, role?: string, name?: string, action: string, value?: any, key?: string }} command
 * @param {{ guard?: (ctx: { element: Element, action: string, command: object }) => boolean }} [options]
 */
export function act(root, command, options = {}) {
  const el = findElement(root, command);
  if (!el) {
    return { ok: false, error: 'Target element not found', command };
  }

  const action = String(command.action || 'click').toLowerCase();

  if (typeof options.guard === 'function') {
    const allowed = options.guard({ element: el, action, command });
    if (!allowed) {
      return { ok: false, blocked: true, error: 'Blocked by action guard', action, tag: el.tagName.toLowerCase() };
    }
  }

  if (action === 'click') {
    const innerBtn = el.shadowRoot?.querySelector?.('button, a, [role="button"]');
    if (innerBtn && typeof innerBtn.click === 'function') innerBtn.click();
    else if (typeof el.click === 'function') el.click();
    return { ok: true, action, tag: el.tagName.toLowerCase(), state: readState(el) };
  }

  if (action === 'toggle') {
    if (typeof el.toggle === 'function') {
      el.toggle();
    } else if (el.checked && typeof el.checked === 'object' && 'value' in el.checked) {
      el.checked.value = !el.checked.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (typeof el.click === 'function') {
      el.click();
    }
    return { ok: true, action, tag: el.tagName.toLowerCase(), state: readState(el) };
  }

  if (action === 'type' || action === 'fill') {
    const nextVal = String(command.value ?? '');
    const innerInput = el.shadowRoot?.querySelector?.('input, textarea') || (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el : null);
    if (innerInput) {
      innerInput.value = nextVal;
      innerInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      innerInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    } else if (el.value && typeof el.value === 'object' && 'value' in el.value) {
      el.value.value = nextVal;
      el.setAttribute('value', nextVal);
    } else {
      el.setAttribute('value', nextVal);
    }
    return { ok: true, action, tag: el.tagName.toLowerCase(), value: readValue(el), state: readState(el) };
  }

  if (action === 'open') {
    if (typeof el.showModal === 'function') el.showModal();
    else if (typeof el.open === 'function') el.open();
    else if (typeof el.show === 'function') el.show();
    else el.setAttribute('open', '');
    return { ok: true, action, tag: el.tagName.toLowerCase(), state: readState(el) };
  }

  if (action === 'close') {
    if (typeof el.close === 'function') el.close();
    else if (typeof el.hide === 'function') el.hide();
    else el.removeAttribute('open');
    return { ok: true, action, tag: el.tagName.toLowerCase(), state: readState(el) };
  }

  if (action === 'focus') {
    const focusTarget = el.shadowRoot?.querySelector?.('button, input, textarea, select, [tabindex="0"]') || el;
    focusTarget.focus?.();
    return { ok: true, action, tag: el.tagName.toLowerCase(), state: readState(el) };
  }

  if (action === 'press') {
    const key = command.key || 'Enter';
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, composed: true }));
    return { ok: true, action, key, tag: el.tagName.toLowerCase(), state: readState(el) };
  }

  return { ok: false, error: `Unsupported action: ${action}`, command };
}

/**
 * Registers `elementum_snapshot` and `elementum_act` with the browser's W3C WebMCP
 * `navigator.modelContext` API when available, returning a cleanup function.
 *
 * @param {Element | Document | ShadowRoot} [root]
 * @param {{ prefix?: string, guard?: (ctx: { element: Element, action: string, command: object }) => boolean, modelContext?: any }} [options]
 */
export function registerWebMCP(root = typeof document !== 'undefined' ? document.body : null, options = {}) {
  const mc = options.modelContext || (typeof navigator !== 'undefined' ? navigator.modelContext : null);
  if (!mc || typeof mc.registerTool !== 'function') {
    return { registered: false, unregister: () => {} };
  }

  const prefix = options.prefix || 'elementum';
  const snapshotName = `${prefix}_snapshot`;
  const actName = `${prefix}_act`;

  mc.registerTool({
    name: snapshotName,
    description: 'Inspect interactive Elementum Web Components across open Shadow DOM.',
    inputSchema: { type: 'object', properties: { maxNodes: { type: 'number' } } },
    execute: (args = {}) => snapshot(root, args),
  });

  mc.registerTool({
    name: actName,
    description: 'Execute a semantic UI action (click, type, toggle, open, close, focus, press) on an Elementum component.',
    inputSchema: {
      type: 'object',
      required: ['action'],
      properties: {
        ref: { type: 'string' },
        role: { type: 'string' },
        name: { type: 'string' },
        selector: { type: 'string' },
        action: { type: 'string' },
        value: {},
        key: { type: 'string' },
      },
    },
    execute: (args = {}) => act(root, args, { guard: options.guard }),
  });

  return {
    registered: true,
    tools: [snapshotName, actName],
    unregister: () => {
      if (typeof mc.unregisterTool === 'function') {
        mc.unregisterTool(snapshotName);
        mc.unregisterTool(actName);
      }
    },
  };
}
