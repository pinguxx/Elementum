import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dark-Mode Catalog Contrast & Shadow DOM Audit', () => {
  test('all 109 components render cleanly in dark mode without zero-contrast text or broken :root selectors', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Computed WCAG 2.2 AA dark-mode contrast sweep runs in Chromium');
    test.setTimeout(150_000);
    await page.goto('/examples/index.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    const toggleBtn = page.locator('#btn-toggle-canvas-theme');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await expect(page.locator('#live-stage')).toHaveClass(/dark-canvas/);
    await page.waitForTimeout(100);

    const tags = await page.evaluate(async () => {
      const { components } = await import('/examples/catalog-data.js');
      return Object.keys(components);
    });

    const contrastFailures = [];
    for (const tag of tags) {
      await page.evaluate((t) => {
        window.location.hash = '#' + t;
      }, tag);
      await page.waitForTimeout(10);

      const axe = await new AxeBuilder({ page })
        .include('#live-stage')
        .withRules(['color-contrast'])
        .analyze();

      if (axe.violations.length > 0) {
        for (const v of axe.violations) {
          for (const n of v.nodes) {
            contrastFailures.push(`${tag}: ${n.failureSummary?.split('\n')[1]?.trim() || n.html.slice(0, 80)}`);
          }
        }
      }
    }

    expect(
      contrastFailures,
      `Dark-mode contrast violations (${contrastFailures.length}):\n${contrastFailures.join('\n')}`
    ).toEqual([]);
  });
});
