import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Real Browser Verification (Chromium / Firefox / WebKit)', () => {
  test('Homepage loads with zero errors, sticky navbar, and zero horizontal overflow on mobile (375px)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/index.html');
    await page.waitForSelector('el-button');

    // Verify no horizontal overflow on narrow mobile viewport
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);

    // Verify <el-navbar sticky> has computed position: sticky
    const navPosition = await page.evaluate(() => {
      const nav = document.querySelector('el-navbar');
      return getComputedStyle(nav).position;
    });
    expect(navPosition).toBe('sticky');
    expect(errors).toEqual([]);
  });

  test('Real <el-dialog> opens modally, closes on Escape, and restores focus to trigger', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => customElements.get('el-dialog'));

    const result = await page.evaluate(async () => {
      const trigger = document.createElement('button');
      trigger.id = 'test-dialog-trigger';
      trigger.textContent = 'Open Modal';

      const dialog = document.createElement('el-dialog');
      dialog.setAttribute('heading', 'Real Browser Modal');
      dialog.innerHTML = '<p>Dialog body content</p>';

      document.body.append(trigger, dialog);
      trigger.focus();
      dialog.showModal();
      await new Promise((r) => setTimeout(r, 30));

      const nativeDialog = dialog.shadowRoot?.querySelector('dialog');
      const isOpen = Boolean(nativeDialog?.open || dialog.hasAttribute('open'));
      return { isOpen };
    });

    expect(result.isOpen).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(50);

    const afterClose = await page.evaluate(() => {
      const dialog = document.querySelector('el-dialog');
      const nativeDialog = dialog?.shadowRoot?.querySelector('dialog');
      return {
        isOpen: Boolean(nativeDialog?.open),
        activeId: document.activeElement?.id || null,
      };
    });
    expect(afterClose.isOpen).toBe(false);
    expect(afterClose.activeId).toBe('test-dialog-trigger');
  });

  test('Real ElementInternals <form> submission & reset work with <el-input> and <el-select>', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => customElements.get('el-input') && customElements.get('el-select'));

    const formResult = await page.evaluate(async () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <el-input name="email" value="ada@elementum.dev" required></el-input>
        <el-select name="role" value="engineer">
          <option value="engineer">Engineer</option>
          <option value="designer">Designer</option>
        </el-select>
      `;
      document.body.appendChild(form);
      await new Promise((r) => setTimeout(r, 50));

      const fdBefore = Object.fromEntries(new FormData(form).entries());
      const input = form.querySelector('el-input');
      input.value = 'changed@elementum.dev';
      await new Promise((r) => setTimeout(r, 20));
      const fdChanged = Object.fromEntries(new FormData(form).entries());

      form.reset();
      await new Promise((r) => setTimeout(r, 20));
      const fdAfterReset = Object.fromEntries(new FormData(form).entries());
      form.remove();
      return { fdBefore, fdChanged, fdAfterReset };
    });

    expect(formResult.fdBefore.email).toBe('ada@elementum.dev');
    expect(formResult.fdBefore.role).toBe('engineer');
    expect(formResult.fdChanged.email).toBe('changed@elementum.dev');
    expect(formResult.fdAfterReset.email).toBe('ada@elementum.dev');
  });

  test('AG-UI live demo streams SSE events with zero console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/examples/ag-ui.html');
    await page.waitForSelector('#btn-scenario-patch');
    await page.click('#btn-scenario-patch');

    await page.waitForFunction(() => {
      const badge = document.getElementById('run-status-badge');
      return badge?.getAttribute('count') === 'finished';
    }, { timeout: 10_000 });

    const progress = await page.locator('#progress-caption').textContent();
    expect(progress).toBe('100%');
    expect(errors).toEqual([]);
  });

  test('Declarative Shadow DOM SSR: Zero-JS mode (?hydrate=0) attaches real Shadow Roots natively', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    const response = await page.goto('http://127.0.0.1:3333/?hydrate=0');
    expect(response.status()).toBe(200);

    const dsdState = await page.evaluate(() => {
      const nav = document.querySelector('el-navbar');
      const btn = document.querySelector('el-button');
      return {
        navHasShadow: Boolean(nav?.shadowRoot),
        btnHasShadow: Boolean(btn?.shadowRoot),
        btnRenderedButton: Boolean(btn?.shadowRoot?.querySelector('button')),
      };
    });

    expect(dsdState.navHasShadow).toBe(true);
    expect(dsdState.btnHasShadow).toBe(true);
    expect(dsdState.btnRenderedButton).toBe(true);
    await context.close();
  });

  test('Declarative Shadow DOM SSR: Hydrated mode (?hydrate=1) hydrates cleanly without duplicate styles', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto('http://127.0.0.1:3333/?hydrate=1');
    expect(response.status()).toBe(200);
    await page.waitForFunction(() => customElements.get('el-button'));

    const hydrated = await page.evaluate(() => {
      const btn = document.querySelector('el-button');
      return {
        defined: Boolean(customElements.get('el-button')),
        buttonCount: btn?.shadowRoot?.querySelectorAll('button').length || 0,
      };
    });

    expect(hydrated.defined).toBe(true);
    expect(hydrated.buttonCount).toBe(1);
    expect(errors).toEqual([]);
  });

  test('WCAG 2.2 AA automated axe-core audit passes on Home, AG-UI, and SSR pages (0 critical/serious violations)', async ({ page }) => {
    for (const url of ['/index.html', '/examples/ag-ui.html', 'http://127.0.0.1:3333/?hydrate=1']) {
      await page.goto(url);
      await page.waitForSelector('el-navbar');
      await page.waitForTimeout(100);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const severe = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(severe, `axe-core severe violations on ${url}: ${JSON.stringify(severe, null, 2)}`).toEqual([]);
    }
  });

  test('Docs sidebar highlights active section on click and tracks scrollspy while scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/docs.html');
    await page.waitForSelector('.docs-sidebar');

    // Click "Micro-Signals Kernel" in sidebar -> immediately becomes active
    await page.locator('.docs-sidebar a[href="#signals"]').click();
    await expect(page.locator('.docs-sidebar .sidebar-item.active a')).toHaveAttribute('href', '#signals');

    // Scroll to #mcp-server -> scrollspy updates active highlight automatically
    await page.evaluate(() => {
      document.getElementById('mcp-server').scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(100);
    await expect(page.locator('.docs-sidebar .sidebar-item.active a')).toHaveAttribute('href', '#mcp-server');
  });
});
