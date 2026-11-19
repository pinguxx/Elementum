import { test, expect } from '@playwright/test';

// Components intentionally 0x0 or overlay-only when closed / headless in default preview
const NON_BOX_DEFAULT_TAGS = new Set([
  'el-visually-hidden',
  'el-dialog',
  'el-alert-dialog',
  'el-drawer',
  'el-toast',
  'el-context-menu',
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

      const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      for (const tag of tags) {
        window.location.hash = '#' + tag;
        await nextFrame();

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
              await nextFrame();
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
            await nextFrame();
          }

          const checkboxes = Array.from(knobsForm.querySelectorAll('input[type="checkbox"]'));
          for (const cb of checkboxes) {
            const propName = cb.dataset.prop || cb.id || 'boolean';
            const origChecked = cb.checked;
            cb.checked = !origChecked;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
            await nextFrame();
            totalPermutations++;

            if (!nonBox.has(tag) && propName !== 'hidden' && propName !== 'open') {
              const liveTarget = stage.querySelector(tag) || stage.firstElementChild;
              if (liveTarget) {
                const r = liveTarget.getBoundingClientRect();
                if (r.width === 0 && r.height === 0) {
                  failures.push(`${tag} [${propName}=${cb.checked}]: preview collapsed to 0x0px`);
                }
              }
            }
            cb.checked = origChecked;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
            await nextFrame();
          }
        }

        // 4. Verify all rendered examples in .variation-card have upgraded <el-*> elements
        const exampleCards = Array.from(document.querySelectorAll('.variation-card'));
        for (const card of exampleCards) {
          totalExamples++;
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
});
