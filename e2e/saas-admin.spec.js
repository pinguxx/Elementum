import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('SaaS Admin Dogfooding App (Zero-Shortcut Public API Verification)', () => {
  test('Full SaaS workflow: Sign-in, filter table, invite member via dialog, open drawer, mobile check, and axe-core WCAG 2.2 AA', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/examples/saas-admin.html');
    await page.waitForSelector('#btn-signin');

    // 1. Audit auth screen with axe-core
    const authAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const authSevere = authAxe.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(authSevere, `Auth screen axe violations: ${JSON.stringify(authSevere, null, 2)}`).toEqual([]);

    // 2. Sign in via validated <el-form>
    await page.click('#btn-signin');
    await page.waitForSelector('#admin-view:not(.hidden)');

    // 3. Filter directory table via <el-input>
    const searchInput = page.locator('#member-search').locator('input');
    await searchInput.fill('ada');
    await page.waitForTimeout(40);
    await expect(page.locator('#visible-count-badge')).toHaveAttribute('count', '1 members');
    await searchInput.fill('');
    await page.waitForTimeout(40);
    await expect(page.locator('#visible-count-badge')).toHaveAttribute('count', '4 members');

    // 4. Invite a new member via <el-dialog> + <el-form>
    await page.click('#btn-open-invite');
    await page.waitForTimeout(40);
    await page.locator('#invite-name').locator('input').fill('Grace Hopper');
    await page.locator('#invite-email').locator('input').fill('grace@acme.dev');
    await page.click('#btn-submit-invite');
    await page.waitForTimeout(50);
    await expect(page.locator('#visible-count-badge')).toHaveAttribute('count', '5 members');

    // 5. Open & dismiss slide-over <el-drawer>
    await page.click('#btn-open-drawer');
    await page.waitForTimeout(40);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(40);

    // 6. Audit authenticated admin dashboard with axe-core WCAG 2.2 AA
    const adminAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const adminSevere = adminAxe.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(adminSevere, `Admin screen axe violations: ${JSON.stringify(adminSevere, null, 2)}`).toEqual([]);

    // 7. Mobile 375px zero-overflow check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(50);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
    expect(errors).toEqual([]);
  });
});
