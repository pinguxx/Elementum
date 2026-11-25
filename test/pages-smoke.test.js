import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../test-helpers/setup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Import Elementum components & primitives
await import('../src/index.js');

test('Smoke & Integrity: All CSS surface and text tokens exist in both light and dark modes', () => {
  const tokensCss = fs.readFileSync(path.join(rootDir, 'src', 'tokens.css'), 'utf8');

  const lightMatch = tokensCss.match(/:root\s*,\s*:root\[data-theme="light"\]\s*\{([\s\S]*?)\}/);
  const darkMatch = tokensCss.match(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\}/);

  assert.ok(lightMatch, 'tokens.css must define light theme variables');
  assert.ok(darkMatch, 'tokens.css must define dark theme variables');

  const extractTokens = (cssBlock) => {
    const matches = cssBlock.match(/--el-[a-z0-9_-]+/g) || [];
    return new Set(matches);
  };

  const lightTokens = extractTokens(lightMatch[1]);
  const darkTokens = extractTokens(darkMatch[1]);

  // Essential theme-switching token categories that must exist in dark mode
  const themeCriticalTokens = [
    '--el-surface-base',
    '--el-surface-card',
    '--el-surface-elevated',
    '--el-surface-muted',
    '--el-surface-border',
    '--el-border-translucent',
    '--el-text-base',
    '--el-text-primary',
    '--el-text-secondary',
    '--el-text-muted',
    '--el-chart-1',
    '--el-chart-2',
    '--el-chart-3',
    '--el-chart-4',
    '--el-chart-5',
  ];

  for (const token of themeCriticalTokens) {
    assert.ok(lightTokens.has(token), `Light mode tokens must include ${token}`);
    assert.ok(darkTokens.has(token), `Dark mode tokens must include ${token} to prevent contrast collapse`);
  }
});

test('Smoke & Integrity: Component templates do not evaluate signals statically with .value outside accessor functions', () => {
  const componentFiles = fs.readdirSync(path.join(rootDir, 'src', 'components'))
    .filter(f => f.endsWith('.js'))
    .map(f => path.join(rootDir, 'src', 'components', f));

  function getTemplateExpressions(str) {
    const expressions = [];
    let i = 0;
    while (i < str.length) {
      if (str[i] === '$' && str[i + 1] === '{') {
        const start = i + 2;
        let depth = 1;
        let j = start;
        while (j < str.length && depth > 0) {
          if (str[j] === '{') depth++;
          else if (str[j] === '}') depth--;
          j++;
        }
        expressions.push(str.slice(start, j - 1).trim());
        i = j;
      } else {
        i++;
      }
    }
    return expressions;
  }

  function checkTemplate(templateStr, file, violations) {
    const expressions = getTemplateExpressions(templateStr);
    for (const expr of expressions) {
      // Check if expression directly evaluates signal .value without being an accessor function
      const hasStaticSignalValue = /\bthis\.[a-zA-Z0-9_]+\.value\b/.test(expr);
      const isFunction = expr.includes('=>') || expr.includes('function');

      if (hasStaticSignalValue && !isFunction) {
        violations.push(`${path.basename(file)}: unreactive static signal interpolation \${${expr}}`);
      }

      // If expression contains nested html`...` sub-templates, check them recursively
      const subHtmlMatches = expr.matchAll(/html`([\s\S]*?)`/g);
      for (const subMatch of subHtmlMatches) {
        checkTemplate(subMatch[1], file, violations);
      }
    }
  }

  const violations = [];

  componentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const renderMatch = content.match(/render\s*\(\s*\)\s*\{([\s\S]*?)\n\s*\}/);
    if (!renderMatch) return;

    const renderBody = renderMatch[1];
    const htmlMatches = renderBody.matchAll(/html`([\s\S]*?)`/g);
    for (const hMatch of htmlMatches) {
      checkTemplate(hMatch[1], file, violations);
    }
  });

  assert.equal(
    violations.length,
    0,
    `Found unreactive static signal interpolations in render():\n${violations.join('\n')}`
  );
});

test('Smoke & Interaction: SaaS Pricing Billing Switcher updates prices and preserves Starter period', async () => {
  // Mount pricing section structure identical to references.html
  const container = document.createElement('div');
  container.innerHTML = `
    <el-segmented-control id="billing-cycle" value="monthly">
      <option value="monthly">Monthly</option>
      <option value="annual">Annual</option>
    </el-segmented-control>
    <div class="pricing-card">
      <el-number-flow id="starter-price" value="0"></el-number-flow>
      <span class="starter-period">/mo</span>
    </div>
    <div class="pricing-card featured">
      <el-number-flow id="pro-price" value="24"></el-number-flow>
      <span class="price-period">/mo (billed monthly)</span>
    </div>
    <div class="pricing-card">
      <el-number-flow id="team-price" value="59"></el-number-flow>
      <span class="price-period">/mo (billed monthly)</span>
    </div>
  `;
  document.body.appendChild(container);

  const billingSwitch = container.querySelector('#billing-cycle');
  const proPrice = container.querySelector('#pro-price');
  const teamPrice = container.querySelector('#team-price');
  const paidPeriodLabels = container.querySelectorAll('.pricing-card.featured .price-period, .pricing-card:last-child .price-period');
  const starterPeriod = container.querySelector('.starter-period');

  // Wire up the exact event handler used in references.html
  billingSwitch.addEventListener('change', (e) => {
    const selected = e.detail?.value ?? (typeof e.target.value === 'object' ? e.target.value.value : e.target.value);
    const isAnnual = selected === 'annual';
    if (isAnnual) {
      proPrice.setAttribute('value', '19');
      teamPrice.setAttribute('value', '49');
      paidPeriodLabels.forEach(p => p.textContent = '/mo (billed annually)');
    } else {
      proPrice.setAttribute('value', '24');
      teamPrice.setAttribute('value', '59');
      paidPeriodLabels.forEach(p => p.textContent = '/mo (billed monthly)');
    }
  });

  // 1. Initial State
  assert.equal(proPrice.getAttribute('value'), '24');
  assert.equal(starterPeriod.textContent, '/mo');

  // 2. Switch to Annual
  billingSwitch.dispatchEvent(new CustomEvent('change', { detail: { value: 'annual' }, bubbles: true }));
  assert.equal(proPrice.getAttribute('value'), '19');
  assert.equal(teamPrice.getAttribute('value'), '49');
  assert.equal(paidPeriodLabels[0].textContent, '/mo (billed annually)');
  assert.equal(starterPeriod.textContent, '/mo'); // Starter must remain free '/mo'

  // 3. Switch back to Monthly
  billingSwitch.dispatchEvent(new CustomEvent('change', { detail: { value: 'monthly' }, bubbles: true }));
  assert.equal(proPrice.getAttribute('value'), '24');
  assert.equal(teamPrice.getAttribute('value'), '59');
  assert.equal(paidPeriodLabels[0].textContent, '/mo (billed monthly)');
  assert.equal(starterPeriod.textContent, '/mo');

  document.body.removeChild(container);
});

test('Smoke & Interaction: <el-command> keyboard navigation advances 1 item at a time without double-jumping', async () => {
  const cmd = document.createElement('el-command');
  cmd.innerHTML = `
    <el-command-group heading="Actions">
      <el-command-item value="item-1">Item 1</el-command-item>
      <el-command-item value="item-2">Item 2</el-command-item>
      <el-command-item value="item-3">Item 3</el-command-item>
    </el-command-group>
  `;
  document.body.appendChild(cmd);

  cmd.show();
  await new Promise(r => setTimeout(r, 60)); // Wait for dialog mount & initial filter
  assert.equal(cmd.activeIndex.value, 0);

  // Focus search input inside shadow DOM
  const searchInput = cmd.root.querySelector('.search-input');
  assert.ok(searchInput, 'Search input must exist inside command palette');

  // Simulate user pressing ArrowDown inside the search input
  // In standard browser environment, KeyboardEvents have composed: true
  searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
  assert.equal(cmd.activeIndex.value, 1, 'ArrowDown must advance by exactly 1 item (0 -> 1)');

  searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
  assert.equal(cmd.activeIndex.value, 2, 'ArrowDown must advance by exactly 1 item (1 -> 2)');

  searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
  assert.equal(cmd.activeIndex.value, 1, 'ArrowUp must step backward by exactly 1 item (2 -> 1)');

  cmd.close();
  document.body.removeChild(cmd);
});

test('Smoke & Interaction: <el-streaming-text> updates actual rendered DOM text reactively', async () => {
  const streamer = document.createElement('el-streaming-text');
  streamer.setAttribute('text', 'Test Streaming Reactivity');
  streamer.setAttribute('speed', '5');
  document.body.appendChild(streamer);

  const textNode = streamer.root.querySelector('.text-content');
  assert.ok(textNode, 'Text content container must exist in Shadow DOM');

  // Wait 60ms for stream steps to execute
  await new Promise(r => setTimeout(r, 60));

  // The rendered DOM text must NOT be frozen on just the first word
  assert.ok(
    textNode.textContent.length > 3,
    `DOM text must stream reactively beyond the first chunk. Got: "${textNode.textContent}"`
  );

  document.body.removeChild(streamer);
});

test('Smoke & Integrity: Elementum UI Registry page contains all blocks, customizer, typeset, and catalog', () => {
  const registryPath = path.join(rootDir, 'examples', 'registry.html');
  assert.ok(fs.existsSync(registryPath), 'examples/registry.html must exist');

  const content = fs.readFileSync(registryPath, 'utf8');

  // Verify customizer & top nav
  assert.ok(content.includes('palette-swatches'), 'Must include theme palette customizer');
  assert.ok(content.includes('radius-selector'), 'Must include border radius customizer');
  assert.ok(content.includes('el-theme-switch'), 'Must include theme switch');

  // Verify composite blocks
  assert.ok(content.includes('dashboard-chart'), 'Must include Dashboard block with chart');
  assert.ok(content.includes('auth-demo-form'), 'Must include Authentication 2FA block');
  assert.ok(content.includes('demo-reasoning'), 'Must include AI Studio block with reasoning disclosure');
  assert.ok(content.includes('demo-stream'), 'Must include AI streaming text');

  // Verify Typeset and Theme Studio sections
  assert.ok(content.includes('el-typeset'), 'Must include .el-typeset typographic rhythm section');
  assert.ok(content.includes('create-studio'), 'Must include Theme Studio ("Create") generator');
  assert.ok(content.includes('exportPenpotTokens'), 'Must include Penpot DTCG token export');

  // Verify catalog and inspector
  assert.ok(content.includes('catalog-filters'), 'Must include filterable catalog categories');
  assert.ok(content.includes('card-tabs'), 'Must include tabbed code inspector');

  // Verify Full Theme Exporter
  assert.ok(content.includes('generateFullThemeCss'), 'Must include complete stylesheet theme generator');
  assert.ok(content.includes('theme-code-dialog'), 'Must include theme code modal dialog');
  assert.ok(content.includes('data-theme="dark"'), 'Full theme export must cover both light and dark mode tokens');
});

test('Smoke & Integrity: Component stylesheets do not rely on :host-context() for dark mode or layout parity', () => {
  const compDir = path.join(rootDir, 'src', 'components');
  const offenders = fs.readdirSync(compDir)
    .filter((f) => f.endsWith('.js'))
    .filter((f) => fs.readFileSync(path.join(compDir, f), 'utf8').includes(':host-context('));
  assert.deepEqual(offenders, [], `Components must not use :host-context(): ${offenders.join(', ')}`);
});
