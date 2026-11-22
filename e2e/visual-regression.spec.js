import { test, expect } from '@playwright/test';

async function waitForPageSettled(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
    const customEls = Array.from(document.querySelectorAll('*'))
      .filter((el) => el.tagName.includes('-'))
      .map((el) => el.tagName.toLowerCase());
    await Promise.all([...new Set(customEls)].map((tag) => customElements.whenDefined(tag)));
  });
  await page.waitForTimeout(200);
}

test.describe('Visual Regression Baselines (Light / Dark / Mobile / Components)', () => {
  test('showcase.html desktop light & dark themes match visual baselines', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/showcase.html');
    await waitForPageSettled(page);

    await expect(page).toHaveScreenshot('showcase-desktop-light.png', {
      fullPage: false,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(150);

    await expect(page).toHaveScreenshot('showcase-desktop-dark.png', {
      fullPage: false,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });

  test('showcase.html mobile (375x812) light theme matches visual baseline', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/showcase.html');
    await waitForPageSettled(page);

    await expect(page).toHaveScreenshot('showcase-mobile-light.png', {
      fullPage: false,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });

  test('examples/ledgerflow.html desktop light & dark themes match visual baselines', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/examples/ledgerflow.html');
    await waitForPageSettled(page);

    await expect(page).toHaveScreenshot('ledgerflow-desktop-light.png', {
      fullPage: false,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(150);

    await expect(page).toHaveScreenshot('ledgerflow-desktop-dark.png', {
      fullPage: false,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });

  test('Core UI primitives kitchen-sink stage matches light & dark baselines', async ({ page }) => {
    await page.setViewportSize({ width: 960, height: 720 });
    await page.goto('/index.html');
    await waitForPageSettled(page);

    await page.evaluate(() => {
      document.body.innerHTML = '';
      document.body.style.margin = '0';
      document.body.style.padding = '24px';
      document.body.style.background = 'var(--el-surface-base, #ffffff)';
      const stage = document.createElement('main');
      stage.id = 'visual-primitives-stage';
      stage.style.cssText = 'display:grid;gap:16px;max-width:760px;padding:24px;border-radius:12px;background:var(--el-surface-base,#ffffff);';
      stage.innerHTML = `
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <el-button variant="primary">Primary</el-button>
          <el-button variant="secondary">Secondary</el-button>
          <el-button variant="danger">Danger</el-button>
          <el-badge variant="success">Verified</el-badge>
          <el-badge variant="warning">Beta</el-badge>
          <el-switch checked>Live Sync</el-switch>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <el-input label="Workspace Name" value="Elementum Core"></el-input>
          <el-input label="API Endpoint" placeholder="https://example.com" disabled></el-input>
        </div>
        <el-alert variant="info" title="Visual Snapshot Coverage">Core primitives rendered in Shadow DOM with zero external CSS.</el-alert>
        <el-card>
          <el-card-header bordered>
            <el-card-title>Release Status</el-card-title>
            <el-card-description>Light & dark surface token verification</el-card-description>
          </el-card-header>
          <el-card-content>
            <el-tabs value="overview">
              <el-tab label="Overview" value="overview">
                <p style="margin:8px 0 0;">All 109 Custom Elements upgraded deterministically.</p>
              </el-tab>
              <el-tab label="Tokens" value="tokens">
                <p style="margin:8px 0 0;">Design tokens synchronized.</p>
              </el-tab>
            </el-tabs>
          </el-card-content>
        </el-card>
      `;
      document.body.appendChild(stage);
    });
    await page.waitForTimeout(200);

    const stage = page.locator('#visual-primitives-stage');
    await expect(stage).toHaveScreenshot('primitives-stage-light.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.background = '#0f172a';
      const el = document.getElementById('visual-primitives-stage');
      if (el) el.style.background = '#0f172a';
    });
    await page.waitForTimeout(200);

    await expect(stage).toHaveScreenshot('primitives-stage-dark.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });
});
