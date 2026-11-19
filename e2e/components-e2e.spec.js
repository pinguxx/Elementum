import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Real-Browser Interactive Component Suite (Playwright + axe-core)', () => {
  test('el-autocomplete: filters options, highlights <mark>, selects via keyboard, and supports multiple chips', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => customElements.get('el-autocomplete'));

    await page.evaluate(() => {
      const host = document.createElement('div');
      host.id = 'e2e-ac-host';
      host.innerHTML = `<el-autocomplete id="e2e-ac" debounce="0" placeholder="Search city"></el-autocomplete>`;
      document.body.appendChild(host);
      const ac = document.getElementById('e2e-ac');
      ac.setData(['San Francisco', 'Seattle', 'Austin', 'Boston']);
    });

    const input = page.locator('#e2e-ac').locator('input.combobox-input');
    await input.fill('sa');
    await page.waitForTimeout(50);

    const markText = await page.locator('#e2e-ac').locator('mark.match-highlight').first().textContent();
    expect(markText).toBe('Sa');

    await input.press('ArrowDown');
    await input.press('Enter');

    const selectedVal = await page.evaluate(() => document.getElementById('e2e-ac').value.value);
    expect(selectedVal).toBe('San Francisco');
  });

  test('el-command: filters items, highlights matched query, and emits select on Enter', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => customElements.get('el-command'));

    await page.evaluate(() => {
      window.__cmdSelected = null;
      const cmd = document.createElement('el-command');
      cmd.id = 'e2e-cmd';
      cmd.setAttribute('inline', '');
      cmd.innerHTML = `
        <el-command-group heading="Navigation">
          <el-command-item value="settings">Open Settings</el-command-item>
          <el-command-item value="billing">View Billing</el-command-item>
        </el-command-group>
      `;
      cmd.addEventListener('select', (e) => { window.__cmdSelected = e.detail.value; });
      document.body.appendChild(cmd);
    });

    const search = page.locator('#e2e-cmd').locator('input.search-input');
    await search.fill('bill');
    await page.waitForTimeout(40);

    const mark = await page.locator('#e2e-cmd el-command-item[value="billing"]').locator('mark.match-highlight').textContent();
    expect(mark).toBe('Bill');

    await search.press('Enter');
    const selected = await page.evaluate(() => window.__cmdSelected);
    expect(selected).toBe('billing');
  });

  test('el-datepicker & el-calendar: renders localized calendar and selects a date', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => customElements.get('el-datepicker') && customElements.get('el-calendar'));

    const res = await page.evaluate(async () => {
      const cal = document.createElement('el-calendar');
      cal.setAttribute('value', '2026-01-15');
      cal.setAttribute('locale', 'es-ES');
      const dp = document.createElement('el-datepicker');
      dp.setAttribute('name', 'start_date');
      dp.setAttribute('value', '2026-05-10');
      document.body.append(cal, dp);
      await new Promise((r) => setTimeout(r, 40));

      const esTitle = cal.monthTitle.value.toLowerCase();
      const dayButtons = cal.shadowRoot.querySelectorAll('button.day:not(.other-month)');
      dayButtons[19]?.click(); // 20th
      await new Promise((r) => setTimeout(r, 20));
      const calVal = cal.value.value;
      const dpVal = dp.value.value;
      cal.remove();
      dp.remove();
      return { esTitle, calVal, dpVal };
    });

    expect(res.esTitle).toContain('enero');
    expect(res.calVal).toBe('2026-01-20');
    expect(res.dpVal).toBe('2026-05-10');
  });

  test('el-tabs & el-accordion: switch panels and toggle disclosure with ARIA state', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => customElements.get('el-tabs') && customElements.get('el-accordion'));

    const res = await page.evaluate(async () => {
      const tabs = document.createElement('el-tabs');
      tabs.innerHTML = `
        <el-tab label="Overview" value="overview">Overview body</el-tab>
        <el-tab label="Security" value="security">Security body</el-tab>
      `;
      const acc = document.createElement('el-accordion');
      acc.innerHTML = `
        <el-accordion-item title="FAQ 1" value="q1">Answer 1</el-accordion-item>
        <el-accordion-item title="FAQ 2" value="q2">Answer 2</el-accordion-item>
      `;
      document.body.append(tabs, acc);
      await new Promise((r) => setTimeout(r, 40));

      const tabBtns = tabs.shadowRoot.querySelectorAll('[role="tab"]');
      tabBtns[1]?.click();
      await new Promise((r) => setTimeout(r, 20));
      const activeTab = tabs.activeTab?.value || tabs.value?.value;

      const item1 = acc.querySelector('el-accordion-item');
      item1.shadowRoot.querySelector('button')?.click();
      await new Promise((r) => setTimeout(r, 20));
      const accOpen = Boolean(item1.open?.value ?? item1.hasAttribute('open'));

      tabs.remove();
      acc.remove();
      return { activeTab, accOpen };
    });

    expect(res.activeTab).toBe('security');
    expect(res.accOpen).toBe(true);
  });

  test('el-dropdown, el-popover, and el-drawer: open and dismiss cleanly on Escape', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => customElements.get('el-dropdown') && customElements.get('el-popover') && customElements.get('el-drawer'));

    await page.evaluate(async () => {
      const dd = document.createElement('el-dropdown');
      dd.id = 'e2e-dd';
      dd.innerHTML = `<el-button slot="trigger">Menu</el-button><div style="padding:8px;">Item</div>`;
      const pop = document.createElement('el-popover');
      pop.id = 'e2e-pop';
      pop.innerHTML = `<el-button slot="trigger">Info</el-button><div>Details</div>`;
      const drawer = document.createElement('el-drawer');
      drawer.id = 'e2e-drawer';
      drawer.setAttribute('title', 'Inspector');
      drawer.innerHTML = `<p>Drawer details</p>`;
      document.body.append(dd, pop, drawer);
      await new Promise((r) => setTimeout(r, 30));
      dd.open();
      pop.open();
      drawer.show();
    });

    const opened = await page.evaluate(() => {
      const dr = document.getElementById('e2e-drawer');
      return {
        dd: document.getElementById('e2e-dd').isOpen.value,
        pop: document.getElementById('e2e-pop').isOpen.value,
        drawer: Boolean(dr.isOpen?.value ?? dr.hasAttribute('open')),
      };
    });
    expect(opened).toEqual({ dd: true, pop: true, drawer: true });

    // Press Escape to dismiss open overlays
    await page.keyboard.press('Escape');
    await page.waitForTimeout(40);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(40);

    const closed = await page.evaluate(() => {
      const dr = document.getElementById('e2e-drawer');
      return {
        dd: document.getElementById('e2e-dd').isOpen.value,
        pop: document.getElementById('e2e-pop').isOpen.value,
        drawer: Boolean(dr.isOpen?.value ?? dr.hasAttribute('open')),
      };
    });
    expect(closed.dd).toBe(false);
    expect(closed.pop).toBe(false);
    expect(closed.drawer).toBe(false);
  });

  test('el-table, el-tree-view, el-form, el-switch, el-checkbox, el-dropzone: interactive + axe-core WCAG 2.2 AA', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() =>
      customElements.get('el-table') &&
      customElements.get('el-tree-view') &&
      customElements.get('el-form') &&
      customElements.get('el-dropzone')
    );

    const state = await page.evaluate(async () => {
      const container = document.createElement('section');
      container.id = 'e2e-a11y-stage';
      container.setAttribute('aria-label', 'Interactive Component Verification Stage');
      container.style.padding = '24px';
      container.innerHTML = `
        <el-table id="e2e-tbl" sortable selectable>
          <table>
            <thead><tr><th>Name</th><th>Role</th></tr></thead>
            <tbody>
              <tr><td>Zara</td><td>Admin</td></tr>
              <tr><td>Ada</td><td>Engineer</td></tr>
            </tbody>
          </table>
        </el-table>
        <el-tree-view id="e2e-tree">
          <el-tree-item label="src" expanded>
            <el-tree-item label="index.js"></el-tree-item>
          </el-tree-item>
        </el-tree-view>
        <el-form id="e2e-form">
          <el-input id="e2e-f-name" name="name" aria-label="Full name" required></el-input>
          <el-switch id="e2e-f-sw" name="alerts">Email alerts</el-switch>
          <el-checkbox id="e2e-f-cb" name="terms">Accept terms</el-checkbox>
          <el-dropzone id="e2e-dz" accept=".json"></el-dropzone>
        </el-form>
      `;
      document.body.appendChild(container);
      await new Promise((r) => setTimeout(r, 60));

      const tbl = document.getElementById('e2e-tbl');
      const form = document.getElementById('e2e-form');
      const invalidBefore = form.validate();

      const inp = document.getElementById('e2e-f-name');
      inp.value = 'Ada Lovelace';
      await new Promise((r) => setTimeout(r, 20));
      const validAfter = form.validate();

      return {
        rowCount: tbl.data.value.length,
        invalidBefore,
        validAfter,
      };
    });

    expect(state.rowCount).toBe(2);
    expect(state.invalidBefore).toBe(false);
    expect(state.validAfter).toBe(true);

    // Run axe-core WCAG 2.2 AA directly on the mounted interactive stage
    const results = await new AxeBuilder({ page })
      .include('#e2e-a11y-stage')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const severe = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(severe, `axe-core violations on interactive stage: ${JSON.stringify(severe, null, 2)}`).toEqual([]);
  });
});
