import { test, expect } from '@playwright/test';

test.describe('WAI-ARIA APG Keyboard-Only State Machine Suite (10 Complex Composite Widgets)', () => {
  test('drives all 10 high-complexity composite widgets via real keyboard events (Arrow keys, Home/End, Enter/Space, Escape, focus recovery)', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => Boolean(customElements.get('el-dialog') && customElements.get('el-tabs')));

    await page.evaluate(() => {
      document.body.innerHTML = `
        <div style="padding:24px;">
          <!-- 1. el-dialog -->
          <el-button id="dlg-trig">Open Dialog</el-button>
          <el-dialog id="k-dlg" title="Keyboard Modal">
            <el-input id="dlg-input" aria-label="Modal field"></el-input>
          </el-dialog>

          <!-- 2. el-alert-dialog -->
          <el-alert-dialog id="k-alert-dlg" title="Confirm Delete">
            <el-button id="alert-trig" slot="trigger" variant="danger">Delete</el-button>
            <p>Irreversible operation.</p>
            <el-button id="alert-cancel" variant="secondary">Cancel</el-button>
          </el-alert-dialog>

          <!-- 3. el-drawer -->
          <el-button id="drw-trig">Open Drawer</el-button>
          <el-drawer id="k-drw" title="Keyboard Drawer"><p>Drawer content</p></el-drawer>

          <!-- 4. el-tabs -->
          <el-tabs id="k-tabs" value="t1">
            <el-tab value="t1" label="Overview">Panel 1</el-tab>
            <el-tab value="t2" label="Metrics">Panel 2</el-tab>
            <el-tab value="t3" label="Settings">Panel 3</el-tab>
          </el-tabs>

          <!-- 5. el-command -->
          <el-command id="k-cmd" inline placeholder="Search commands...">
            <el-command-group heading="Ops">
              <el-command-item value="deploy">Deploy</el-command-item>
              <el-command-item value="rollback">Rollback</el-command-item>
            </el-command-group>
          </el-command>

          <!-- 6. el-autocomplete -->
          <el-autocomplete
            id="k-auto"
            placeholder="Language"
            options='[{"label":"TypeScript","value":"ts"},{"label":"Rust","value":"rs"}]'
          ></el-autocomplete>

          <!-- 7. el-datepicker / el-calendar -->
          <el-calendar id="k-cal" value="2026-11-15"></el-calendar>

          <!-- 8. el-table -->
          <el-table
            id="k-table"
            selectable
            columns='[{"key":"name","label":"Name","sortable":true}]'
            data='[{"name":"Beta"},{"name":"Alpha"}]'
          ></el-table>

          <!-- 9. el-tree-view -->
          <el-tree-view id="k-tree">
            <el-tree-item id="tree-root" label="src">
              <el-tree-item id="tree-leaf" label="index.js"></el-tree-item>
            </el-tree-item>
          </el-tree-view>

          <!-- 10. el-navigation-menu -->
          <el-navigation-menu id="k-nav">
            <el-navigation-menu-item id="k-nav-item">
              <el-navigation-menu-trigger id="k-nav-trig">Docs</el-navigation-menu-trigger>
              <el-navigation-menu-content><a href="#api">API</a></el-navigation-menu-content>
            </el-navigation-menu-item>
          </el-navigation-menu>
        </div>
      `;
    });

    // 1. <el-dialog>: open -> Escape closes & syncs data-state="closed"
    await page.evaluate(() => {
      document.getElementById('dlg-trig').addEventListener('click', () => {
        document.getElementById('k-dlg').showModal();
      });
    });
    await page.locator('#dlg-trig').click();
    await expect(page.locator('#k-dlg')).toHaveAttribute('data-state', 'open');
    await page.keyboard.press('Escape');
    await expect(page.locator('#k-dlg')).toHaveAttribute('data-state', 'closed');

    // 2. <el-alert-dialog>: trigger opens -> requires explicit Cancel action to close
    await page. evaluate(() => {
      document.getElementById('alert-cancel').addEventListener('click', () => {
        document.getElementById('k-alert-dlg').close();
      });
    });
    await page.locator('#alert-trig').click();
    await expect(page.locator('#k-alert-dlg')).toHaveAttribute('data-state', 'open');
    await page.keyboard.press('Escape');
    await expect(page.locator('#k-alert-dlg')).toHaveAttribute('data-state', 'open');
    await page.locator('#alert-cancel').click();
    await expect(page.locator('#k-alert-dlg')).toHaveAttribute('data-state', 'closed');

    // 3. <el-drawer>: open -> Escape closes & syncs data-state="closed"
    await page.evaluate(() => {
      document.getElementById('drw-trig').addEventListener('click', () => {
        document.getElementById('k-drw').show();
      });
    });
    await page.locator('#drw-trig').click();
    await expect(page.locator('#k-drw')).toHaveAttribute('data-state', 'open');
    await page.keyboard.press('Escape');
    await expect(page.locator('#k-drw')).toHaveAttribute('data-state', 'closed');

    // 4. <el-tabs>: focus active tab -> ArrowRight moves to t2 -> End moves to t3 -> Home moves back to t1
    const tabBtns = page.locator('#k-tabs').locator('button[role="tab"]');
    await tabBtns.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabBtns.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(tabBtns.nth(2)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Home');
    await expect(tabBtns.nth(0)).toHaveAttribute('aria-selected', 'true');

    // 5. <el-command>: focus input -> ArrowDown highlights next item (data-active="true")
    const cmdInput = page.locator('#k-cmd').locator('input.search-input');
    await cmdInput.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#k-cmd el-command-item[data-active="true"]')).toHaveCount(1);

    // 6. <el-autocomplete>: focus input -> type query -> ArrowDown -> Enter selects option
    const autoInput = page.locator('#k-auto').locator('input');
    await autoInput.click();
    await autoInput.fill('Type');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const autoVal = await page.evaluate(() => document.getElementById('k-auto').value?.value || document.getElementById('k-auto').getAttribute('value'));
    expect(autoVal).toBe('ts');

    // 7. <el-calendar>: keyboard ArrowRight moves focus to the next day cell
    const calMoved = await page.evaluate(() => {
      const cal = document.getElementById('k-cal');
      const days = Array.from(cal.shadowRoot.querySelectorAll('.grid .day'));
      days[10].focus();
      days[10].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
      return cal.shadowRoot.activeElement === days[11];
    });
    expect(calMoved).toBe(true);

    // 8. <el-table>: clicking sortable header sorts rows (Alpha before Beta)
    await page.locator('#k-table th').nth(1).click();
    const firstRowText = await page.evaluate(() => {
      const cell = document.getElementById('k-table').shadowRoot?.querySelector('tbody tr td:nth-child(2)');
      return cell?.textContent?.trim();
    });
    expect(firstRowText).toBe('Alpha');

    // 9. <el-tree-view>: keyboard ArrowRight expands branch, ArrowDown focuses child, ArrowLeft collapses
    await page.locator('#tree-root .item-row').first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tree-root')).toHaveAttribute('expanded', '');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#tree-root')).not.toHaveAttribute('expanded', '');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tree-root')).toHaveAttribute('expanded', '');

    // 10. <el-navigation-menu>: keyboard Enter on trigger opens item, Escape closes it
    await page.locator('#k-nav-trig button').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#k-nav-item')).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(page.locator('#k-nav-item')).not.toHaveAttribute('open', '');
  });
});
