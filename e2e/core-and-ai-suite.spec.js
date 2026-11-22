import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Core Forms, Navigation, Data Display, AI Suite & LedgerFlow (Playwright + axe-core)', () => {
  test('Core form controls: interactive state updates + WCAG 2.2 AA axe-core audit', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => customElements.get('el-textarea') && customElements.get('el-slider'));

    await page.evaluate(() => {
      const stage = document.createElement('section');
      stage.id = 'e2e-forms-stage';
      stage.setAttribute('aria-label', 'Core Forms Stage');
      stage.style.padding = '24px';
      stage.style.background = 'var(--el-surface-bg, #ffffff)';
      stage.innerHTML = `
        <el-fieldset legend="Profile Settings">
          <el-field label="Bio">
            <el-textarea id="e2e-textarea" name="bio" placeholder="Tell us about yourself"></el-textarea>
          </el-field>
          <el-radio-group id="e2e-radio-group" name="plan" value="pro">
            <el-radio value="free">Free</el-radio>
            <el-radio value="pro">Pro</el-radio>
          </el-radio-group>
          <el-radio-card-group id="e2e-rc-group" name="tier" value="team">
            <el-radio-card value="solo" title="Solo">1 seat</el-radio-card>
            <el-radio-card value="team" title="Team">Up to 10 seats</el-radio-card>
          </el-radio-card-group>
          <el-checkbox-card id="e2e-cc" name="sso" title="Enable SSO">SAML 2.0 support</el-checkbox-card>
          <el-slider id="e2e-slider" name="volume" min="0" max="100" value="40" aria-label="Volume"></el-slider>
          <el-number-field id="e2e-num" name="seats" value="5" min="1" max="50" label="Seats"></el-number-field>
          <el-otp-input id="e2e-otp" length="4" aria-label="Verification Code"></el-otp-input>
          <el-rating id="e2e-rating" value="4" max="5" aria-label="Satisfaction"></el-rating>
          <el-segmented-control id="e2e-seg" value="monthly">
            <button value="monthly">Monthly</button>
            <button value="yearly">Yearly</button>
          </el-segmented-control>
          <el-toggle-group id="e2e-tgroup" value="bold">
            <el-toggle value="bold" aria-label="Bold">B</el-toggle>
            <el-toggle value="italic" aria-label="Italic">I</el-toggle>
          </el-toggle-group>
        </el-fieldset>
      `;
      document.body.appendChild(stage);
    });

    await page.waitForTimeout(60);

    const state = await page.evaluate(() => {
      const ta = document.getElementById('e2e-textarea');
      const nativeTa = ta.shadowRoot?.querySelector('textarea');
      if (nativeTa) {
        nativeTa.value = 'Building AI-native UIs';
        nativeTa.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const cc = document.getElementById('e2e-cc');
      cc.shadowRoot?.querySelector('[role="checkbox"], input, .card')?.click();

      const seg = document.getElementById('e2e-seg');
      const num = document.getElementById('e2e-num');
      const otp = document.getElementById('e2e-otp');
      const rating = document.getElementById('e2e-rating');
      const slider = document.getElementById('e2e-slider');
      const rg = document.getElementById('e2e-radio-group');
      const rcg = document.getElementById('e2e-rc-group');
      const tg = document.getElementById('e2e-tgroup');

      return {
        textareaVal: ta.value?.value ?? ta.value,
        hasShadowRoots: [ta, cc, seg, num, otp, rating, slider, rg, rcg, tg].every((el) => Boolean(el?.shadowRoot)),
      };
    });

    expect(state.hasShadowRoots).toBe(true);
    expect(state.textareaVal).toBe('Building AI-native UIs');

    const results = await new AxeBuilder({ page })
      .include('#e2e-forms-stage')
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(serious).toEqual([]);
  });

  test('Navigation & overlay components: real-browser interaction + axe-core WCAG 2.2 AA', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => customElements.get('el-breadcrumb') && customElements.get('el-pagination'));

    await page.evaluate(() => {
      const stage = document.createElement('section');
      stage.id = 'e2e-nav-stage';
      stage.setAttribute('aria-label', 'Navigation and Overlays Stage');
      stage.style.padding = '24px';
      stage.style.background = 'var(--el-surface-bg, #ffffff)';
      stage.innerHTML = `
        <el-toaster id="e2e-toaster"></el-toaster>
        <el-breadcrumb id="e2e-bc">
          <el-breadcrumb-item href="#home">Home</el-breadcrumb-item>
          <el-breadcrumb-item current>Components</el-breadcrumb-item>
        </el-breadcrumb>
        <el-pagination id="e2e-pag" total="50" page-size="10" page="1"></el-pagination>
        <el-tooltip id="e2e-tt" content="Helpful hint">
          <el-button variant="secondary">Hover target</el-button>
        </el-tooltip>
        <el-menubar id="e2e-menubar" aria-label="Workspace menu">
          <button role="menuitem">File</button>
          <button role="menuitem">Edit</button>
        </el-menubar>
        <el-navigation-menu id="e2e-navmenu" aria-label="Primary links">
          <a href="#docs">Docs</a>
        </el-navigation-menu>
        <el-toolbar id="e2e-toolbar" aria-label="Formatting">
          <el-button variant="ghost" size="sm">Bold</el-button>
          <el-button variant="ghost" size="sm">Italic</el-button>
        </el-toolbar>
        <el-sidebar id="e2e-sidebar" open>
          <p>Sidebar navigation</p>
        </el-sidebar>
        <el-context-menu id="e2e-ctx">
          <div>Right-click target</div>
        </el-context-menu>
        <el-preview-card id="e2e-preview">
          <a slot="trigger" href="#preview">Preview Link</a>
          <p>Preview details</p>
        </el-preview-card>
      `;
      document.body.appendChild(stage);
    });

    await page.waitForTimeout(60);

    const navState = await page.evaluate(() => {
      const pag = document.getElementById('e2e-pag');
      let changedPage = null;
      pag.addEventListener('pagechange', (e) => { changedPage = e.detail?.page; });
      const nextBtn = pag.shadowRoot?.querySelector('button[aria-label*="Next"], button.next, button[data-page="2"]');
      nextBtn?.click();

      const ids = [
        'e2e-toaster', 'e2e-bc', 'e2e-pag', 'e2e-tt', 'e2e-menubar',
        'e2e-navmenu', 'e2e-toolbar', 'e2e-sidebar', 'e2e-ctx', 'e2e-preview',
      ];
      return {
        allHydrated: ids.every((id) => Boolean(document.getElementById(id)?.shadowRoot)),
        changedPage,
      };
    });

    expect(navState.allHydrated).toBe(true);

    const results = await new AxeBuilder({ page })
      .include('#e2e-nav-stage')
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(serious).toEqual([]);
  });

  test('Data display & layout components: real-browser render + axe-core WCAG 2.2 AA', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => customElements.get('el-chip') && customElements.get('el-data-list'));

    await page.evaluate(() => {
      const stage = document.createElement('section');
      stage.id = 'e2e-display-stage';
      stage.setAttribute('aria-label', 'Data Display Stage');
      stage.style.padding = '24px';
      stage.style.background = 'var(--el-surface-bg, #ffffff)';
      stage.innerHTML = `
        <el-theme-switch id="e2e-theme"></el-theme-switch>
        <el-chip id="e2e-chip" selectable>TypeScript</el-chip>
        <el-kbd id="e2e-kbd">⌘K</el-kbd>
        <el-separator id="e2e-sep"></el-separator>
        <el-avatar-group id="e2e-ag">
          <el-avatar name="Ada Lovelace"></el-avatar>
          <el-avatar name="Grace Hopper"></el-avatar>
        </el-avatar-group>
        <el-data-list id="e2e-dl">
          <el-data-list-item label="Region">us-west-2</el-data-list-item>
          <el-data-list-item label="Status">Healthy</el-data-list-item>
        </el-data-list>
        <el-timeline id="e2e-tl">
          <el-timeline-item title="Deployed v0.6.0" date="Today">All checks passed.</el-timeline-item>
        </el-timeline>
        <el-empty-state id="e2e-empty" title="No incidents" description="All systems operational."></el-empty-state>
        <el-chart id="e2e-chart" type="bar" title="Latency (ms)"></el-chart>
      `;
      document.body.appendChild(stage);
      const chart = document.getElementById('e2e-chart');
      if (chart?.data) {
        chart.data.value = [
          { label: 'Mon', value: 18 },
          { label: 'Tue', value: 14 },
          { label: 'Wed', value: 12 },
        ];
      }
    });

    await page.waitForTimeout(60);

    const displayOk = await page.evaluate(() => {
      const ids = ['e2e-theme', 'e2e-chip', 'e2e-kbd', 'e2e-sep', 'e2e-ag', 'e2e-dl', 'e2e-tl', 'e2e-empty', 'e2e-chart'];
      return ids.every((id) => Boolean(document.getElementById(id)?.shadowRoot));
    });
    expect(displayOk).toBe(true);

    const results = await new AxeBuilder({ page })
      .include('#e2e-display-stage')
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(serious).toEqual([]);
  });

  test('AI specialist component suite: prompt, reasoning, tool-call, streaming, sources, diff, tasks, insights', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => customElements.get('el-prompt-input') && customElements.get('el-tool-call'));

    await page.evaluate(() => {
      const stage = document.createElement('section');
      stage.id = 'e2e-ai-stage';
      stage.setAttribute('aria-label', 'AI Specialist Suite Stage');
      stage.style.padding = '24px';
      stage.style.background = 'var(--el-surface-bg, #ffffff)';
      stage.innerHTML = `
        <el-reasoning-card id="e2e-reasoning" summary="Analyzed 3 files" open>
          Checked strict TypeScript definitions and SSR output.
        </el-reasoning-card>
        <el-tool-call id="e2e-tool" name="run_tests" status="completed" args='{"suite":"react"}' result='{"passed":true}'></el-tool-call>
        <el-streaming-text id="e2e-stream" text="All 109 custom elements verified." speed="5"></el-streaming-text>
        <el-sources id="e2e-sources" sources='[{"title":"Elementum Docs","url":"https://elementum-sage.vercel.app/docs.html"}]'></el-sources>
        <el-diff-viewer id="e2e-diff" before="const x = 1;" after="const x = 2;" filename="app.js"></el-diff-viewer>
        <el-task-list id="e2e-tasks" tasks='[{"label":"Verify React 19","status":"done"},{"label":"Run axe-core","status":"done"}]'></el-task-list>
        <el-insight-card id="e2e-insight" title="Zero CLS" metric="0.00" trend="+100%">Declarative Shadow DOM SSR</el-insight-card>
        <el-prompt-input id="e2e-prompt" placeholder="Ask Elementum agent..."></el-prompt-input>
      `;
      document.body.appendChild(stage);
    });

    await page.waitForTimeout(80);

    const aiState = await page.evaluate(() => {
      const prompt = document.getElementById('e2e-prompt');
      let submitted = null;
      prompt.addEventListener('submit', (e) => { submitted = e.detail?.value; });
      const ta = prompt.shadowRoot?.querySelector('textarea');
      if (ta) {
        ta.value = 'Audit accessibility';
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
      prompt.submit();

      const ids = ['e2e-reasoning', 'e2e-tool', 'e2e-stream', 'e2e-sources', 'e2e-diff', 'e2e-tasks', 'e2e-insight', 'e2e-prompt'];
      return {
        allHydrated: ids.every((id) => Boolean(document.getElementById(id)?.shadowRoot)),
        submitted,
      };
    });

    expect(aiState.allHydrated).toBe(true);
    expect(aiState.submitted).toBe('Audit accessibility');

    const results = await new AxeBuilder({ page })
      .include('#e2e-ai-stage')
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(serious).toEqual([]);
  });

  test('LedgerFlow Penpot->MCP generated app executes cleanly in real browser with 0 errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/examples/ledgerflow.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);

    const stats = await page.evaluate(() => {
      const customEls = Array.from(document.querySelectorAll('*')).filter((el) => el.tagName.includes('-'));
      const hydrated = customEls.filter((el) => Boolean(el.shadowRoot));
      return { total: customEls.length, hydrated: hydrated.length };
    });

    expect(errors).toEqual([]);
    expect(stats.total).toBeGreaterThan(10);
    expect(stats.hydrated).toBeGreaterThan(10);
  });
});
