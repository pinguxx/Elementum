import test from 'node:test';
import assert from 'node:assert/strict';
import '../test-helpers/setup.js';
import '../src/components/el-shimmer-text.js';
import '../src/components/el-hold-button.js';
import '../src/components/el-usage-ring.js';
import '../src/components/el-activity-grid.js';
import '../src/components/el-tabs.js';
import '../src/components/el-segmented-control.js';

const tick = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

test('Motion Components 1: <el-shimmer-text> reflects duration, spread, variant, and paused attributes', () => {
  const el = document.createElement('el-shimmer-text');
  el.textContent = 'Synthesizing modules...';
  document.body.appendChild(el);

  assert.equal(el.duration.value, 2.2);
  assert.equal(el.spread.value, 35);
  assert.equal(el.variant.value, 'muted');
  assert.equal(el.paused.value, false);
  assert.ok(el.shadowRoot.querySelector('[part="text"]'));

  el.setAttribute('duration', '0.1');
  el.setAttribute('spread', '120');
  el.setAttribute('variant', 'accent');
  el.setAttribute('paused', '');
  assert.equal(el.duration.value, 0.4);
  assert.equal(el.spread.value, 80);
  assert.equal(el.variant.value, 'accent');
  assert.equal(el.paused.value, true);

  el.setAttribute('duration', '50');
  el.setAttribute('spread', '2');
  el.setAttribute('paused', 'false');
  assert.equal(el.duration.value, 20);
  assert.equal(el.spread.value, 10);
  assert.equal(el.paused.value, false);

  el.remove();
});

test('Motion Components 2: <el-hold-button> emits confirm after duration and cancel on early release or Escape', async () => {
  const el = document.createElement('el-hold-button');
  el.setAttribute('duration', '200');
  el.setAttribute('confirmed-label', 'Deployed');
  el.setAttribute('variant', 'primary');
  el.setAttribute('size', 'lg');
  el.textContent = 'Hold to deploy';
  document.body.appendChild(el);

  const btn = el.shadowRoot.querySelector('button');
  assert.ok(btn);

  let canceledDetail = null;
  el.addEventListener('cancel', (e) => {
    canceledDetail = e.detail;
  });

  // Early release cancels hold
  btn.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }));
  assert.equal(el.holding.value, true);
  assert.equal(btn.getAttribute('data-state'), 'holding');
  await tick(35);
  btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  assert.equal(el.holding.value, false);
  assert.ok(canceledDetail && typeof canceledDetail.progress === 'number');

  // Keyboard hold & Escape cancellation
  btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  assert.equal(el.holding.value, true);
  btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(el.holding.value, false);

  // Keyup cancels active Enter hold
  btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(el.holding.value, true);
  btn.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  assert.equal(el.holding.value, false);

  // Full hold completes and emits confirm
  let confirmedDetail = null;
  el.addEventListener('confirm', (e) => {
    confirmedDetail = e.detail;
  });
  btn.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }));
  await tick(260);
  assert.deepEqual(confirmedDetail, { duration: 200 });
  assert.equal(el.confirmed.value, true);
  assert.equal(btn.getAttribute('data-state'), 'confirmed');

  // Disabled blocks holding
  el.setAttribute('disabled', '');
  el.startHold();
  assert.equal(el.holding.value, false);

  el.remove();
});

test('Motion Components 3: <el-usage-ring> renders radial SVG segments, clamps values, and exposes progressbar ARIA', () => {
  const el = document.createElement('el-usage-ring');
  document.body.appendChild(el);

  const ring = el.shadowRoot.querySelector('[role="progressbar"]');
  assert.ok(ring);
  assert.equal(ring.getAttribute('aria-valuenow'), '68');
  assert.equal(ring.getAttribute('aria-label'), 'Quota: 68%');
  assert.equal(el.shadowRoot.querySelectorAll('line.seg').length, 24);

  el.setAttribute('value', '150');
  el.setAttribute('max', '200');
  el.setAttribute('segments', '4'); // clamps to min 6
  el.setAttribute('variant', 'success');
  el.setAttribute('label', 'Tokens');
  el.setAttribute('sublabel', 'used today');

  assert.equal(ring.getAttribute('aria-valuenow'), '75');
  assert.equal(ring.getAttribute('aria-label'), 'Tokens: 75%');
  const lines = el.shadowRoot.querySelectorAll('line.seg');
  assert.equal(lines.length, 6);
  assert.equal(el.shadowRoot.querySelectorAll('line.seg.active').length, 5);
  assert.equal(el.shadowRoot.querySelector('[part="sublabel"]')?.textContent, 'used today');

  el.setAttribute('value', '-10');
  assert.equal(ring.getAttribute('aria-valuenow'), '0');

  el.remove();
});

test('Motion Components 4: <el-activity-grid> builds WAI-ARIA 7-row grid, parses data JSON, supports keyboard nav and select', () => {
  const el = document.createElement('el-activity-grid');
  el.setAttribute('weeks', '4');
  el.setAttribute('variant', 'accent');
  el.setAttribute('label', 'Deploys');
  el.setAttribute('show-legend', '');
  el.setAttribute(
    'data',
    JSON.stringify([
      { date: '2026-03-01', count: 6 },
      { date: '2026-03-02', count: 12, level: 4 },
    ])
  );
  document.body.appendChild(el);

  const grid = el.shadowRoot.querySelector('[role="grid"]');
  assert.ok(grid);
  assert.equal(el.shadowRoot.querySelectorAll('[role="row"]').length, 7);
  const cells = el.shadowRoot.querySelectorAll('[role="gridcell"]');
  assert.equal(cells.length, 28);
  assert.ok(el.shadowRoot.querySelector('[part="legend"]'));

  const cell0 = el.shadowRoot.querySelector('[data-index="0"]');
  const cell1 = el.shadowRoot.querySelector('[data-index="1"]');
  assert.equal(cell0.getAttribute('data-level'), '2');
  assert.equal(cell1.getAttribute('data-level'), '4');

  // Arrow key navigation
  cell0.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.equal(el.selectedIndex.value, 1);
  cell1.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(el.selectedIndex.value, 8);
  el.shadowRoot.querySelector('[data-index="8"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  assert.equal(el.selectedIndex.value, 1);
  cell1.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(el.selectedIndex.value, 27);
  el.shadowRoot.querySelector('[data-index="27"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(el.selectedIndex.value, 0);

  let selectedDetail = null;
  el.addEventListener('select', (e) => {
    selectedDetail = e.detail;
  });
  cell1.click();
  assert.equal(selectedDetail?.index, 1);
  assert.equal(selectedDetail?.date, '2026-03-02');
  assert.equal(selectedDetail?.level, 4);

  el.remove();
});

function withMockTabMetrics(fn) {
  const origWidth = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'offsetWidth');
  const origLeft = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'offsetLeft');
  Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() {
      const role = this.getAttribute?.('role');
      if (role === 'tab' || role === 'radio') return 68;
      return origWidth?.get ? origWidth.get.call(this) : 0;
    },
  });
  Object.defineProperty(window.HTMLElement.prototype, 'offsetLeft', {
    configurable: true,
    get() {
      const role = this.getAttribute?.('role');
      if (role === 'tab' || role === 'radio') {
        const siblings = Array.from(this.parentElement?.querySelectorAll(`[role="${role}"]`) || []);
        return 4 + Math.max(0, siblings.indexOf(this)) * 72;
      }
      return origLeft?.get ? origLeft.get.call(this) : 0;
    },
  });
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (origWidth) Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', origWidth);
      else delete window.HTMLElement.prototype.offsetWidth;
      if (origLeft) Object.defineProperty(window.HTMLElement.prototype, 'offsetLeft', origLeft);
      else delete window.HTMLElement.prototype.offsetLeft;
    });
}

test('Motion Components 5: <el-tabs variant="pill"> glides .tab-indicator across tab buttons', async () => {
  await withMockTabMetrics(async () => {
    const el = document.createElement('el-tabs');
    el.setAttribute('variant', 'pill');
    el.setAttribute('value', 'one');
    el.innerHTML = `
      <el-tab value="one" label="One">Panel One</el-tab>
      <el-tab value="two" label="Two">Panel Two</el-tab>
    `;
    document.body.appendChild(el);
    await tick(30);

    const buttons = el.shadowRoot.querySelectorAll('[role="tab"]');
    assert.equal(buttons.length, 2);

    buttons[1].click();
    await tick(30);

    const indicator = el.shadowRoot.querySelector('.tab-indicator');
    const tablist = el.shadowRoot.querySelector('.tablist');
    assert.ok(indicator);
    assert.equal(indicator.style.width, '68px');
    assert.equal(indicator.style.transform, 'translateX(76px)');
    assert.equal(tablist.getAttribute('data-indicator-ready'), 'true');

    el.remove();
  });
});

test('Motion Components 6: <el-segmented-control> glides .active-pill across segments', async () => {
  await withMockTabMetrics(async () => {
    const el = document.createElement('el-segmented-control');
    el.setAttribute('value', 'day');
    el.innerHTML = `
      <option value="day">Day</option>
      <option value="week">Week</option>
    `;
    document.body.appendChild(el);
    await tick(30);

    const segments = el.shadowRoot.querySelectorAll('[role="radio"]');
    assert.equal(segments.length, 2);

    segments[1].click();
    await tick(30);

    const pill = el.shadowRoot.querySelector('.active-pill');
    const group = el.shadowRoot.querySelector('.segmented-group');
    assert.ok(pill);
    assert.equal(pill.style.width, '68px');
    assert.equal(pill.style.transform, 'translateX(76px)');
    assert.equal(group.getAttribute('data-pill-ready'), 'true');

    el.remove();
  });
});
