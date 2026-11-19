/**
 * @wcomp/elementum/testing — WAI-ARIA APG, RTL Direction, and DSD SSR Contract Checkers
 * Reusable verification primitives for testing Elementum components and custom compositions.
 */

import { isRTL } from '../behaviors/index.js';
import { renderComponentToDSD } from '../ssr.js';

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
