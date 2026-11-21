import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { renderComponentToDSD } from '../src/ssr.js';
import {
  ElNavbar,
  ElButton,
  ElBadge,
  ElAlert,
  ElCallout,
  ElProgress,
  ElMeter,
  ElAvatar,
  ElCodeBlock,
  ElSwitch,
  ElInput,
  ElCard,
} from '../src/index.js';

function build54ComponentDsdHtml() {
  const pieces = [];
  pieces.push(renderComponentToDSD('el-navbar', ElNavbar, { brand: 'DSD Stress', badge: '54 Nodes' }, ''));

  const builders = [
    (i) => renderComponentToDSD('el-button', ElButton, { variant: i % 2 ? 'primary' : 'secondary', 'data-dsd-item': '1' }, `Action ${i}`),
    (i) => renderComponentToDSD('el-badge', ElBadge, { variant: 'success', count: `Badge ${i}`, 'data-dsd-item': '1' }, ''),
    (i) => renderComponentToDSD('el-progress', ElProgress, { value: String((i * 7) % 100 || 50), variant: 'primary', 'data-dsd-item': '1' }, ''),
    (i) => renderComponentToDSD('el-meter', ElMeter, { value: '68', min: '0', max: '100', 'data-dsd-item': '1' }, ''),
    (i) => renderComponentToDSD('el-avatar', ElAvatar, { name: `User ${i}`, size: 'md', status: 'online', 'data-dsd-item': '1' }, ''),
    (i) => renderComponentToDSD('el-switch', ElSwitch, { checked: i % 2 === 0, 'data-dsd-item': '1' }, `Toggle ${i}`),
    (i) => renderComponentToDSD('el-input', ElInput, { value: `val-${i}`, placeholder: 'Enter text', 'data-dsd-item': '1' }, ''),
    (i) => renderComponentToDSD('el-alert', ElAlert, { variant: 'info', 'data-dsd-item': '1' }, `Status ${i}`),
    (i) => renderComponentToDSD('el-callout', ElCallout, { variant: 'success', 'data-dsd-item': '1' }, `Callout ${i}`),
    (i) => renderComponentToDSD('el-code-block', ElCodeBlock, { language: 'js', code: `const item${i} = ${i};`, 'data-dsd-item': '1' }, ''),
    (i) => renderComponentToDSD('el-card', ElCard, { bordered: true, 'data-dsd-item': '1' }, `<p>Stress Card ${i}</p>`),
  ];

  // 1 navbar + 53 varied components = 54 DSD components
  for (let i = 0; i < 53; i++) {
    pieces.push(builders[i % builders.length](i + 1));
  }

  return `<!DOCTYPE html>
<html lang="en" data-dsd>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>54-Component DSD Stress Test</title>
  <link rel="stylesheet" href="/src/tokens.css" />
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: var(--el-surface-base); }
    .stress-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding: 16px; }
  </style>
</head>
<body>
  ${pieces[0]}
  <main class="stress-grid">
    ${pieces.slice(1).join('\n    ')}
  </main>
</body>
</html>`;
}

test.describe('Framework Parity, 50+ Component DSD Stress & Showcase Verification', () => {
  test('54-component Declarative Shadow DOM stress test hydrates with zero CLS and zero duplicate controls', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const dsdHtml = build54ComponentDsdHtml();
    await page.route('**/__dsd-stress.html', (route) => {
      route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: dsdHtml });
    });

    await page.goto('/__dsd-stress.html');

    // Verify native DSD Shadow Roots and visible paint BEFORE any client JS runs
    const preHydration = await page.evaluate(() => {
      window.__clsTotal = 0;
      window.__clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__clsTotal += entry.value;
        }
      });
      window.__clsObs.observe({ type: 'layout-shift', buffered: true });

      const nav = document.querySelector('el-navbar');
      const items = Array.from(document.querySelectorAll('[data-dsd-item]'));
      return {
        totalCount: (nav ? 1 : 0) + items.length,
        allHaveShadowRoot: Boolean(nav?.shadowRoot) && items.every((el) => Boolean(el.shadowRoot)),
        allVisible: items.every((el) => getComputedStyle(el).opacity === '1' && el.getBoundingClientRect().width > 0),
        customElementsDefinedBefore: Boolean(customElements.get('el-button')),
      };
    });

    expect(preHydration.totalCount).toBe(54);
    expect(preHydration.allHaveShadowRoot).toBe(true);
    expect(preHydration.allVisible).toBe(true);
    expect(preHydration.customElementsDefinedBefore).toBe(false);

    // Hydrate dynamically and verify zero CLS & zero duplicate Shadow DOM controls
    const postHydration = await page.evaluate(async () => {
      await import('/src/index.js');
      await Promise.all([
        customElements.whenDefined('el-navbar'),
        customElements.whenDefined('el-button'),
        customElements.whenDefined('el-progress'),
        customElements.whenDefined('el-switch'),
        customElements.whenDefined('el-code-block'),
      ]);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      window.__clsObs.disconnect();

      const buttons = Array.from(document.querySelectorAll('el-button'));
      const progressBars = Array.from(document.querySelectorAll('el-progress'));
      const switches = Array.from(document.querySelectorAll('el-switch'));
      return {
        cls: window.__clsTotal,
        noDuplicateButtons: buttons.length > 0 && buttons.every((b) => b.shadowRoot?.querySelectorAll('button').length === 1),
        noDuplicateBars: progressBars.length > 0 && progressBars.every((p) => p.shadowRoot?.querySelectorAll('[role="progressbar"]').length === 1),
        noDuplicateTracks: switches.length > 0 && switches.every((s) => s.shadowRoot?.querySelectorAll('.track').length === 1),
      };
    });

    expect(postHydration.cls).toBe(0);
    expect(postHydration.noDuplicateButtons).toBe(true);
    expect(postHydration.noDuplicateBars).toBe(true);
    expect(postHydration.noDuplicateTracks).toBe(true);
    expect(errors).toEqual([]);
  });

  test('Framework Interop: @wcomp/elementum/react/runtime, Vue-style v-model events, and keyboard-only FACE form work in Chromium', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/index.html');
    await page.waitForFunction(() =>
      customElements.get('el-input') &&
      customElements.get('el-select') &&
      customElements.get('el-switch') &&
      customElements.get('el-checkbox')
    );

    // 1. Verify React wrapper runtime in real Chromium
    const reactCheck = await page.evaluate(async () => {
      const { createElementumReactComponent } = await import('/src/react/runtime.js');
      const effects = [];
      const MiniReact = {
        forwardRef: (fn) => (props) => fn(props, props?.ref ?? null),
        useRef: (init) => ({ current: init }),
        useEffect: (fn) => { effects.push(fn); },
        createElement: (tag, props, children) => {
          const el = document.createElement(tag);
          for (const [k, v] of Object.entries(props || {})) {
            if (k !== 'ref' && v !== undefined && typeof v !== 'function') el.setAttribute(k, String(v));
          }
          if (children != null) el.textContent = String(children);
          props?.ref?.(el);
          return el;
        },
      };

      const ReactSwitch = createElementumReactComponent(MiniReact, 'el-switch');
      let latestDetail = null;
      const refBox = { current: null };
      const swEl = ReactSwitch({
        ref: refBox,
        checked: true,
        className: 'interop-sw',
        onChange: (e) => { latestDetail = e.detail; },
        children: 'Notify',
      });
      document.body.appendChild(swEl);
      for (const eff of effects) eff();

      swEl.dispatchEvent(new CustomEvent('change', { detail: { checked: false }, bubbles: true, composed: true }));
      const result = {
        refMatches: refBox.current === swEl,
        hasClass: swEl.getAttribute('class') === 'interop-sw',
        hasChecked: swEl.hasAttribute('checked'),
        eventDetail: latestDetail,
      };
      swEl.remove();
      return result;
    });

    expect(reactCheck.refMatches).toBe(true);
    expect(reactCheck.hasClass).toBe(true);
    expect(reactCheck.hasChecked).toBe(true);
    expect(reactCheck.eventDetail).toEqual({ checked: false });

    // 2. Keyboard-only Tab + typing + Space on FACE <form> with Vue-style input/change bindings
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.id = 'kbd-interop-form';
      form.innerHTML = `
        <button id="kbd-start" type="button">Start</button>
        <el-input id="kbd-name" name="username" aria-label="Username" required></el-input>
        <el-checkbox id="kbd-terms" name="terms">Accept Terms</el-checkbox>
        <el-button id="kbd-submit" type="submit">Submit</el-button>
      `;
      window.__vModelEvents = [];
      form.querySelector('#kbd-name').addEventListener('input', (e) => {
        window.__vModelEvents.push({ type: 'input', val: e.detail?.value ?? String(e.target.value ?? '') });
      });
      form.querySelector('#kbd-terms').addEventListener('change', (e) => {
        window.__vModelEvents.push({ type: 'change', checked: Boolean(e.target.checked?.value) });
      });
      document.body.appendChild(form);
    });

    await page.locator('#kbd-start').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.type('Ada');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');

    const kbdFormResult = await page.evaluate(async () => {
      await new Promise((r) => setTimeout(r, 40));
      const form = document.getElementById('kbd-interop-form');
      const fd = Object.fromEntries(new FormData(form).entries());
      const termsChecked = form.querySelector('#kbd-terms').checked.value;
      const events = window.__vModelEvents;
      form.remove();
      return { fd, termsChecked, events };
    });

    expect(kbdFormResult.fd.username).toBe('Ada');
    expect(kbdFormResult.termsChecked).toBe(true);
    expect(kbdFormResult.events.some((e) => e.type === 'input' && e.val === 'Ada')).toBe(true);
    expect(kbdFormResult.events.some((e) => e.type === 'change' && e.checked === true)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('Showcase page (showcase.html) renders all 5 reference apps cleanly and passes WCAG 2.2 AA axe-core', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/showcase.html');
    await page.waitForSelector('el-navbar');
    await page.waitForSelector('el-code-block');

    const linksPresent = await page.evaluate(() => {
      const html = document.body.innerHTML;
      return [
        'examples/saas-admin.html',
        'examples/app.html',
        'examples/ledgerflow.html',
        'examples/ag-ui.html',
        'examples/ssr-demo.html',
      ].every((href) => html.includes(href));
    });
    expect(linksPresent).toBe(true);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const severe = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(severe, `axe-core severe violations on showcase.html: ${JSON.stringify(severe, null, 2)}`).toEqual([]);
    expect(errors).toEqual([]);
  });
});
