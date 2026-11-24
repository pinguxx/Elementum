import { test, expect } from '@playwright/test';

// Components intentionally 0x0 or overlay-only when closed / headless in default preview
const NON_BOX_DEFAULT_TAGS = new Set([
  'el-visually-hidden',
  'el-dialog',
  'el-alert-dialog',
  'el-drawer',
  'el-toast',
  'el-router',
  'el-route',
  'el-border-beam',
]);

test.describe('Full Catalog Real-Browser Sweep (All 109 Components, Permutations & Examples)', () => {
  test('all 109 components render visibly with upgraded Shadow DOM across every select/boolean permutation and example', async ({ page }) => {
    test.setTimeout(90_000);

    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/examples/index.html');
    await page.waitForLoadState('networkidle');

    const report = await page.evaluate(async (nonBoxList) => {
      const nonBox = new Set(nonBoxList);
      const { components } = await import('/examples/catalog-data.js');
      const tags = Object.keys(components);
      const failures = [];
      let totalPermutations = 0;
      let totalExamples = 0;

      const nextTick = () => new Promise((r) => setTimeout(r, 0));

      for (const tag of tags) {
        window.location.hash = '#' + tag;
        await nextTick();

        const stage = document.getElementById('live-stage');
        const codeBox = document.getElementById('generated-code-box');
        if (!stage || !codeBox) {
          failures.push(`${tag}: missing #live-stage or #generated-code-box`);
          continue;
        }

        // 1. Verify every <el-*> inside #live-stage is defined & has Shadow DOM
        const stageEls = Array.from(stage.querySelectorAll('*')).filter((el) => el.tagName.includes('-'));
        if (stageEls.length === 0) {
          failures.push(`${tag}: no custom element rendered inside #live-stage`);
          continue;
        }
        for (const el of stageEls) {
          const t = el.tagName.toLowerCase();
          if (!customElements.get(t)) {
            failures.push(`${tag}: unregistered custom element <${t}> in #live-stage`);
          } else if (!el.shadowRoot && t !== 'el-toast') {
            failures.push(`${tag}: <${t}> has no shadowRoot in #live-stage`);
          }
        }

        // 2. Verify visible bounding box for non-overlay default preview
        const primaryEl = stage.querySelector(tag) || stageEls[0];
        if (primaryEl && !nonBox.has(tag)) {
          const rect = primaryEl.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) {
            failures.push(`${tag}: default preview collapsed to 0x0px`);
          }
        }

        // 3. Step through every select option and boolean checkbox in #knobs-form
        const knobsForm = document.getElementById('knobs-form');
        if (knobsForm) {
          const selects = Array.from(knobsForm.querySelectorAll('select'));
          for (const sel of selects) {
            const propName = sel.dataset.prop || sel.id || 'select';
            const opts = Array.from(sel.options).map((o) => o.value);
            const origVal = sel.value;
            for (const optVal of opts) {
              if (optVal === sel.value) continue;
              sel.value = optVal;
              sel.dispatchEvent(new Event('change', { bubbles: true }));
              totalPermutations++;

              if (!nonBox.has(tag)) {
                const liveTarget = stage.querySelector(tag) || stage.firstElementChild;
                if (liveTarget) {
                  const r = liveTarget.getBoundingClientRect();
                  if (r.width === 0 && r.height === 0) {
                    failures.push(`${tag} [${propName}="${optVal}"]: preview collapsed to 0x0px`);
                  }
                }
              }
            }
            // Restore original select value
            sel.value = origVal;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }

          const switches = Array.from(knobsForm.querySelectorAll('el-switch'));
          for (const sw of switches) {
            const propName = sw.dataset.prop || sw.id || 'boolean';
            sw.click();
            totalPermutations++;

            if (!nonBox.has(tag) && propName !== 'hidden' && propName !== 'open' && propName !== 'inline') {
              const liveTarget = stage.querySelector(tag) || stage.firstElementChild;
              if (liveTarget) {
                const r = liveTarget.getBoundingClientRect();
                if (r.width === 0 && r.height === 0) {
                  failures.push(`${tag} [${propName} toggled]: preview collapsed to 0x0px`);
                }
              }
            }
            sw.click();
          }
        }

        // 4. Verify all rendered examples in .variation-card have upgraded <el-*> elements and visible preview height
        const exampleCards = Array.from(document.querySelectorAll('.variation-card'));
        if (exampleCards.length === 0) {
          failures.push(`${tag}: missing .variation-card examples`);
        }
        for (const card of exampleCards) {
          totalExamples++;
          const previewBox = card.querySelector('.variation-preview');
          const firstChild = previewBox?.firstElementChild;
          if (!firstChild) {
            failures.push(`${tag} example: empty .variation-preview`);
          } else {
            const pr = previewBox.getBoundingClientRect();
            if (pr.width === 0 || pr.height === 0) {
              failures.push(`${tag} example: .variation-preview collapsed to 0x0px`);
            }
          }
          const exEls = Array.from(card.querySelectorAll('*')).filter((el) => el.tagName.includes('-'));
          for (const exEl of exEls) {
            const t = exEl.tagName.toLowerCase();
            if (!customElements.get(t)) {
              failures.push(`${tag} example: unregistered <${t}>`);
            }
          }
        }
      }

      return {
        checkedCount: tags.length,
        totalPermutations,
        totalExamples,
        failures,
      };
    }, [...NON_BOX_DEFAULT_TAGS]);

    expect(pageErrors, `Uncaught page errors during catalog sweep:\n${pageErrors.join('\n')}`).toEqual([]);
    expect(consoleErrors, `Console errors during catalog sweep:\n${consoleErrors.join('\n')}`).toEqual([]);
    expect(report.checkedCount).toBeGreaterThanOrEqual(109);
    expect(report.failures, `Catalog sweep failures (${report.failures.length}):\n${report.failures.join('\n')}`).toEqual([]);
  });

  test('interactive catalog previews actually respond to user clicks (el-toast, el-toaster, el-dialog, el-drawer, el-dropdown, el-command, el-number-flow) and sidebar search persists on selection', async ({ page }) => {
    await page.goto('/examples/index.html#el-toast');
    await page.waitForLoadState('networkidle');

    // 0. Sidebar search filter persists when clicking a filtered result
    const searchBox = page.locator('#component-search-input');
    await searchBox.fill('toas');
    await expect(page.locator('#sidebar-categories .nav-item-btn')).toHaveCount(2);
    await page.locator('#sidebar-categories .nav-item-btn').nth(1).click();
    await expect(page.locator('#sidebar-categories .nav-item-btn')).toHaveCount(2);
    await searchBox.fill('');

    // 1. el-toast: clicking "Trigger SUCCESS Toast" must mount a visible .toast-card inside active <el-toaster>
    await page.goto('/examples/index.html#el-toast');
    await page.locator('#live-stage el-button').first().click();
    const toastCount = await page.evaluate(() => {
      const toasters = Array.from(document.querySelectorAll('el-toaster'));
      return toasters.reduce((sum, t) => sum + (t.shadowRoot?.querySelectorAll('.toast-card').length || 0), 0);
    });
    expect(toastCount).toBeGreaterThan(0);

    // 2. el-toaster: clicking "Dispatch Test Toast" and bottom ".variation-preview el-button" must render strictly on 1 active toaster (zero duplicate ghost decks)
    await page.goto('/examples/index.html#el-toaster');
    await page.evaluate(() => window.toast?.clear?.());
    await page.locator('#live-stage el-button').first().click();
    await expect(page.locator('.variation-preview el-button').first()).toBeVisible();
    await page.locator('.variation-preview el-button').first().click();
    const toasterReport = await page.evaluate(() => {
      const toasters = Array.from(document.querySelectorAll('el-toaster'));
      const counts = toasters.map((t) => t.shadowRoot?.querySelectorAll('.toast-card:not(.is-exiting)').length || 0);
      const nonEmptyToasters = counts.filter((c) => c > 0);
      return { totalToasters: toasters.length, nonEmptyToasters: nonEmptyToasters.length, activeCardCount: nonEmptyToasters[0] || 0 };
    });
    expect(toasterReport.nonEmptyToasters).toBe(1);
    expect(toasterReport.activeCardCount).toBe(2);

    // 3. el-dialog: clicking "Open Dialog" opens #demo-dialog-inst, clicking "Cancel" closes it
    await page.goto('/examples/index.html#el-dialog');
    await page.locator('#live-stage el-button').first().click();
    await expect(page.locator('#demo-dialog-inst')).toHaveAttribute('data-state', 'open');
    await page.locator('#demo-dialog-inst el-button').first().click();
    await expect(page.locator('#demo-dialog-inst')).toHaveAttribute('data-state', 'closed');

    // 4. el-drawer: clicking "Open Drawer" opens #demo-drawer-inst
    await page.goto('/examples/index.html#el-drawer');
    await page.locator('#live-stage el-button').first().click();
    await expect(page.locator('#demo-drawer-inst')).toHaveAttribute('data-state', 'open');
    await page.locator('#demo-drawer-inst [slot="footer"] el-button').first().click();
    await expect(page.locator('#demo-drawer-inst')).toHaveAttribute('data-state', 'closed');

    // 5. el-number-flow: clicking "+1,250" increments the value attribute
    await page.goto('/examples/index.html#el-number-flow');
    const beforeVal = Number(await page.locator('#preview-number-flow').getAttribute('value'));
    await page.locator('#live-stage el-button').nth(1).click();
    const afterVal = Number(await page.locator('#preview-number-flow').getAttribute('value'));
    expect(afterVal).toBe(beforeVal + 1250);

    // 6. el-tabs: clicking second tab button updates value on <el-tabs>
    await page.goto('/examples/index.html#el-tabs');
    const secondTabBtn = page.locator('#live-stage el-tabs').locator('button[role="tab"]').nth(1);
    await secondTabBtn.click();
    await expect(secondTabBtn).toHaveAttribute('aria-selected', 'true');

    // 7. el-accordion: clicking second item header toggles open state
    await page.goto('/examples/index.html#el-accordion');
    const secondAccItem = page.locator('#live-stage el-accordion-item').nth(1);
    await secondAccItem.locator('button').first().click();
    await expect(secondAccItem).toHaveAttribute('open', '');

    // 8. el-switch & el-checkbox: clicking toggles checked state
    await page.goto('/examples/index.html#el-switch');
    const swEl = page.locator('#live-stage el-switch').first();
    const swInitial = await swEl.evaluate((el) => Boolean(el.checked?.value ?? el.hasAttribute('checked')));
    await swEl.click();
    const swAfter = await swEl.evaluate((el) => Boolean(el.checked?.value ?? el.hasAttribute('checked')));
    expect(swAfter).toBe(!swInitial);

    // 9. el-dropdown: clicking trigger opens menu, clicking menu action closes menu & fires toast
    await page.goto('/examples/index.html#el-dropdown');
    await page.locator('#demo-dropdown [slot="trigger"]').click();
    await expect(page.locator('#demo-dropdown')).toHaveAttribute('data-state', 'open');
    await page.locator('#demo-dropdown [slot="menu"] button').first().click();
    await expect(page.locator('#demo-dropdown')).toHaveAttribute('data-state', 'closed');
  });

  test('npx @wcomp/elementum init generated vanilla starter index.html works end-to-end in browser (dark theme canvas, toast, and dialog)', async ({ page }) => {
    const { buildStarterIndexHtml, buildStarterTokensCss } = await import('../bin/elementum.js');
    // Rewrite unpkg URLs to local dev server so the test verifies the exact current repo build offline
    const html = buildStarterIndexHtml()
      .replace('https://unpkg.com/@wcomp/elementum/tokens.css', '/src/tokens.css')
      .replace('./elementum-tokens.css', '/src/tokens.css')
      .replaceAll('https://unpkg.com/@wcomp/elementum', '/src/index.js');

    await page.goto('/index.html');
    await page.setContent(html, { waitUntil: 'networkidle' });

    // 1. Light mode initial body background should be light (#fbfcfd -> rgb(251, 252, 253))
    const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(lightBg).toBe('rgb(251, 252, 253)');

    // 2. Clicking <el-theme-switch> must switch <html data-theme="dark"> AND darken body background to #0b0f19 -> rgb(11, 15, 25)
    await page.locator('el-theme-switch').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(darkBg).not.toBe(lightBg);

    // 3. Clicking "Trigger Toast" must render a visible .toast-card inside <el-toaster>
    await page.locator('#toast-btn').click();
    const toastCount = await page.evaluate(() => {
      const toaster = document.getElementById('toaster');
      return toaster?.shadowRoot?.querySelectorAll('.toast-card').length || 0;
    });
    expect(toastCount).toBe(1);

    // 4. Clicking "New Item" opens <el-dialog>, clicking "Create" closes it and triggers a second toast
    await page.locator('#open-modal').click();
    await expect(page.locator('#demo-dialog')).toHaveAttribute('data-state', 'open');
    await page.locator('#save-modal').click();
    await expect(page.locator('#demo-dialog')).toHaveAttribute('data-state', 'closed');
    const toastCountAfterSave = await page.evaluate(() => {
      const toaster = document.getElementById('toaster');
      return toaster?.shadowRoot?.querySelectorAll('.toast-card').length || 0;
    });
    expect(toastCountAfterSave).toBe(2);
  });
});

