/**
 * @wcomp/elementum/testing — Structural WAI-ARIA APG, RTL, DSD SSR & Declarative Component Testing
 *
 * Note: `checkAriaPattern` is a structural contract validator (roles & ARIA attributes).
 * Combine it with `testComponent()` and real-browser Playwright + `axe-core` tests
 * for full behavioral, focus-management, and visual accessibility verification.
 */

import { isRTL } from '../behaviors/index.js';
import { renderComponentToDSD } from '../ssr.js';
import { snapshot, act } from '../agent/index.js';

function queryDeep(root, selector, out = [], visited = new Set()) {
  if (!root || visited.has(root)) return out;
  visited.add(root);
  if (root.nodeType === 1 && root.matches?.(selector)) {
    out.push(root);
  }
  if (root.shadowRoot) {
    queryDeep(root.shadowRoot, selector, out, visited);
  }
  for (const child of root.children || []) {
    queryDeep(child, selector, out, visited);
  }
  return out;
}

/**
 * Validates an element (including its open Shadow DOM) against WAI-ARIA Authoring Practices Guide (APG) rules.
 *
 * @param {HTMLElement} el
 * @param {'button'|'checkbox'|'switch'|'dialog'|'tabs'|'accordion'|'combobox'|'slider'|'progressbar'} pattern
 * @returns {{ ok: boolean, pattern: string, violations: string[], passed: string[] }}
 */
export function checkAriaPattern(el, pattern) {
  const violations = [];
  const passed = [];

  if (!el) {
    return { ok: false, pattern, violations: ['Element is null or undefined'], passed };
  }

  const check = (cond, passMsg, failMsg) => {
    if (cond) passed.push(passMsg);
    else violations.push(failMsg);
  };

  if (pattern === 'button') {
    const btn = queryDeep(el, 'button, [role="button"]')[0];
    check(Boolean(btn), 'Has button semantics', 'Missing native <button> or role="button"');
    if (btn) {
      const hasName = Boolean(
        btn.getAttribute('aria-label') ||
        btn.getAttribute('aria-labelledby') ||
        (el.textContent || '').trim() ||
        (btn.textContent || '').trim()
      );
      check(hasName, 'Button has accessible name', 'Button is missing an accessible name');
    }
  } else if (pattern === 'switch' || pattern === 'checkbox') {
    const ctrl = queryDeep(el, `[role="${pattern}"], input[type="checkbox"]`)[0] || (el.getAttribute('role') === pattern ? el : null);
    check(Boolean(ctrl), `Has role="${pattern}"`, `Missing role="${pattern}"`);
    if (ctrl) {
      const checked = ctrl.getAttribute('aria-checked');
      check(
        checked === 'true' || checked === 'false' || checked === 'mixed' || ctrl.tagName === 'INPUT',
        'Has valid aria-checked state',
        `Missing valid aria-checked ("true" | "false" | "mixed") on ${pattern}`
      );
    }
  } else if (pattern === 'dialog') {
    const dlg = queryDeep(el, 'dialog, [role="dialog"], [role="alertdialog"]')[0];
    check(Boolean(dlg), 'Has dialog/alertdialog semantics', 'Missing <dialog> or role="dialog"/"alertdialog"');
    if (dlg) {
      const hasLabel = Boolean(dlg.getAttribute('aria-label') || dlg.getAttribute('aria-labelledby'));
      check(hasLabel, 'Dialog has aria-label or aria-labelledby', 'Dialog is missing aria-label or aria-labelledby');
    }
  } else if (pattern === 'tabs') {
    const tablist = queryDeep(el, '[role="tablist"]')[0];
    const tabs = queryDeep(el, '[role="tab"]');
    check(Boolean(tablist), 'Has role="tablist"', 'Missing role="tablist"');
    check(tabs.length > 0, `Has ${tabs.length} role="tab" element(s)`, 'Missing role="tab" elements');
    const selectedTabs = tabs.filter((t) => t.getAttribute('aria-selected') === 'true');
    check(selectedTabs.length <= 1, 'At most one tab has aria-selected="true"', 'Multiple tabs have aria-selected="true"');
  } else if (pattern === 'accordion') {
    const triggers = queryDeep(el, 'button[aria-expanded]');
    const regions = queryDeep(el, '[role="region"]');
    check(triggers.length > 0, `Has ${triggers.length} disclosure trigger(s) with aria-expanded`, 'Missing button[aria-expanded] triggers');
    check(regions.length > 0, `Has ${regions.length} panel region(s)`, 'Missing role="region" panels');
    for (const btn of triggers) {
      const controls = btn.getAttribute('aria-controls');
      check(Boolean(controls), `Trigger controls "${controls}"`, 'Accordion trigger missing aria-controls');
    }
  } else if (pattern === 'combobox') {
    const combo = queryDeep(el, '[role="combobox"], input[aria-autocomplete]')[0];
    check(Boolean(combo), 'Has combobox semantics', 'Missing role="combobox" or input[aria-autocomplete]');
    if (combo) {
      const hasExpanded = combo.hasAttribute('aria-expanded');
      check(hasExpanded, 'Combobox exposes aria-expanded', 'Combobox missing aria-expanded');
    }
  } else if (pattern === 'slider') {
    const slider = queryDeep(el, '[role="slider"], input[type="range"]')[0];
    check(Boolean(slider), 'Has slider semantics', 'Missing role="slider" or input[type="range"]');
    if (slider && slider.tagName !== 'INPUT') {
      check(slider.hasAttribute('aria-valuenow'), 'Slider exposes aria-valuenow', 'Slider missing aria-valuenow');
      check(slider.hasAttribute('aria-valuemin'), 'Slider exposes aria-valuemin', 'Slider missing aria-valuemin');
      check(slider.hasAttribute('aria-valuemax'), 'Slider exposes aria-valuemax', 'Slider missing aria-valuemax');
    }
  } else if (pattern === 'progressbar') {
    const bar = queryDeep(el, '[role="progressbar"]')[0];
    check(Boolean(bar), 'Has role="progressbar"', 'Missing role="progressbar"');
    if (bar) {
      check(bar.hasAttribute('aria-valuemin') && bar.hasAttribute('aria-valuemax'), 'Progressbar exposes min/max', 'Progressbar missing aria-valuemin or aria-valuemax');
    }
  } else {
    violations.push(`Unknown WAI-ARIA pattern: ${pattern}`);
  }

  return { ok: violations.length === 0, pattern, violations, passed };
}

/**
 * Verifies that an element detects `dir="rtl"` dynamically without needing a framework provider.
 *
 * @param {HTMLElement} el
 * @returns {{ ok: boolean, ltrDetected: boolean, rtlDetected: boolean }}
 */
export function checkDirection(el) {
  const prevDir = el.getAttribute('dir');
  el.setAttribute('dir', 'ltr');
  const ltrDetected = !isRTL(el);
  el.setAttribute('dir', 'rtl');
  const rtlDetected = isRTL(el);

  if (prevDir === null) el.removeAttribute('dir');
  else el.setAttribute('dir', prevDir);

  return { ok: ltrDetected && rtlDetected, ltrDetected, rtlDetected };
}

/**
 * Verifies pure Node.js Declarative Shadow DOM SSR output and XSS attribute escaping.
 *
 * @param {string} tagName
 * @param {Function} ComponentClass
 * @param {Record<string, any>} [attrs]
 * @returns {{ ok: boolean, html: string, violations: string[] }}
 */
export function checkServerRender(tagName, ComponentClass, attrs = {}) {
  const violations = [];
  let html = '';
  try {
    html = renderComponentToDSD(tagName, ComponentClass, {
      ...attrs,
      'data-xss-probe': '"><script>alert(1)</script>',
    });
    if (!html.includes(`<${tagName}`)) {
      violations.push(`SSR output missing opening <${tagName}> tag`);
    }
    if (!html.includes('<template shadowrootmode="open">')) {
      violations.push('SSR output missing Declarative Shadow DOM <template shadowrootmode="open">');
    }
    if (html.includes('<script>alert(1)</script>')) {
      violations.push('SSR output failed to escape hostile attribute payload');
    }
  } catch (err) {
    violations.push(`SSR threw error: ${err?.message || String(err)}`);
  }
  return { ok: violations.length === 0, html, violations };
}

/**
 * Declarative Agent Testing Framework: mounts a component (or uses an existing one),
 * executes semantic `actions` via `@wcomp/elementum/agent`, and verifies `assertions`.
 *
 * @param {string | HTMLElement} tagOrElement
 * @param {{
 *   attrs?: Record<string, string | boolean>,
 *   html?: string,
 *   actions?: Array<Record<string, any>>,
 *   assertions?: Array<Record<string, any>>,
 *   cleanup?: boolean
 * }} [spec]
 */
export async function testComponent(tagOrElement, spec = {}) {
  const { attrs = {}, html = '', actions = [], assertions = [], cleanup = true } = spec;
  let host = null;
  let el = null;
  let ownsHost = false;

  if (typeof tagOrElement === 'string') {
    host = document.createElement('div');
    el = document.createElement(tagOrElement);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === true) el.setAttribute(k, '');
      else if (v !== false && v !== null && v !== undefined) el.setAttribute(k, String(v));
    }
    if (html) el.innerHTML = html;
    host.appendChild(el);
    document.body.appendChild(host);
    ownsHost = true;
  } else {
    el = tagOrElement;
    host = el?.parentElement || el;
  }

  const tag = el?.tagName?.toLowerCase() || String(tagOrElement);
  const actionResults = [];
  const assertionResults = [];
  const failures = [];

  try {
    for (const step of actions) {
      const cmd = step.ref || step.selector || step.role || step.name
        ? step
        : { selector: tag, ...step };
      const res = act(host, cmd);
      actionResults.push(res);
      if (!res.ok) {
        failures.push(`Action "${step.action}" failed: ${res.error || 'unknown error'}`);
      }
      await Promise.resolve();
    }

    const snap = snapshot(host);
    const primaryNode = snap.nodes.find((n) => n.tag === tag) || snap.nodes[0];

    for (const rule of assertions) {
      let pass = false;
      let detail = '';

      if (rule.type === 'value') {
        const actual = el.value && typeof el.value === 'object' && 'value' in el.value
          ? el.value.value
          : (el.value ?? el.getAttribute('value') ?? '');
        pass = String(actual) === String(rule.equals);
        detail = `expected value "${rule.equals}", got "${actual}"`;
      } else if (rule.type === 'open') {
        const isOpen = Boolean(el.isOpen?.value || el.hasAttribute('open') || el.open === true);
        pass = isOpen === true;
        detail = `expected open=true, got ${isOpen}`;
      } else if (rule.type === 'closed') {
        const isOpen = Boolean(el.isOpen?.value || el.hasAttribute('open') || el.open === true);
        pass = isOpen === false;
        detail = `expected closed (open=false), got open=${isOpen}`;
      } else if (rule.type === 'checked') {
        const actual = Boolean(el.checked?.value ?? el.checked ?? el.hasAttribute('checked'));
        const expected = rule.equals !== undefined ? Boolean(rule.equals) : true;
        pass = actual === expected;
        detail = `expected checked=${expected}, got ${actual}`;
      } else if (rule.type === 'disabled') {
        const actual = Boolean(el.disabled?.value ?? el.disabled ?? el.hasAttribute('disabled'));
        const expected = rule.equals !== undefined ? Boolean(rule.equals) : true;
        pass = actual === expected;
        detail = `expected disabled=${expected}, got ${actual}`;
      } else if (rule.type === 'accessible-name') {
        const actualName = primaryNode?.name || '';
        pass = rule.includes
          ? actualName.toLowerCase().includes(String(rule.includes).toLowerCase())
          : actualName.length > 0;
        detail = `accessible name "${actualName}"`;
      } else if (rule.type === 'aria-pattern') {
        const check = checkAriaPattern(el, rule.pattern);
        pass = check.ok;
        detail = check.ok ? `passed ${rule.pattern}` : check.violations.join('; ');
      } else if (rule.type === 'direction') {
        const dir = checkDirection(el);
        pass = dir.ok;
        detail = `ltr=${dir.ltrDetected}, rtl=${dir.rtlDetected}`;
      } else if (rule.type === 'state') {
        const actual = el.getAttribute(rule.attr);
        pass = actual === String(rule.equals);
        detail = `expected ${rule.attr}="${rule.equals}", got "${actual}"`;
      } else {
        detail = `Unknown assertion type: ${rule.type}`;
      }

      assertionResults.push({ ...rule, ok: pass, detail });
      if (!pass) failures.push(`Assertion "${rule.type}" failed: ${detail}`);
    }
  } finally {
    if (ownsHost && cleanup && host) {
      host.remove();
    }
  }

  return {
    ok: failures.length === 0,
    tag,
    actionResults,
    assertionResults,
    failures,
  };
}
