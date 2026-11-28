import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePenpotLayerName,
  extractElementumSpec,
  generateAppHtml,
  renderElementumNode,
  generatePageHtml,
} from '../tools/penpot-to-elementum.js';
import { buildLedgerFlowPenpotScript } from '../tools/design-ledgerflow-penpot.js';
import { components as catalogComponents } from '../examples/catalog-data.js';

test('Penpot Codegen: parsePenpotLayerName extracts Elementum tags, props, and validity', () => {
  const valid = parsePenpotLayerName('el-button | variant="primary" label="+ Add Expense"');
  assert.deepEqual(valid, {
    tag: 'el-button',
    props: { variant: 'primary', label: '+ Add Expense' },
    isValidElementum: true,
  });

  const unknown = parsePenpotLayerName('el-not-a-real-widget | foo="bar"');
  assert.equal(unknown.tag, 'el-not-a-real-widget');
  assert.equal(unknown.isValidElementum, false);

  assert.equal(parsePenpotLayerName('BackgroundRect'), null);
});

test('Penpot Codegen: extractElementumSpec & generateAppHtml compile a Penpot layer tree into Elementum HTML', () => {
  const mockTree = {
    fileName: 'LedgerFlow Design',
    pageName: 'LedgerFlow App',
    appShellId: 'shape-123',
    children: [
      {
        name: 'LedgerFlow / App Shell',
        children: [
          { name: 'el-navbar | brand="LedgerFlow" badge="Pro"', children: [] },
          { name: 'PageHeading', text: 'Treasury Overview' },
          { name: 'PageSubtitle', text: 'Live synced from Penpot.' },
          { name: 'el-button | variant="primary" label="+ Record Spend" action="open-add-dialog"', children: [] },
          {
            name: 'el-card | section="kpi" kpi="balance" title="Total Balance"',
            children: [
              { name: 'el-number-flow | value="52000" prefix="$"' },
              { name: 'el-badge | variant="success" label="+14%"' },
            ],
          },
          { name: 'el-meter | label="Cloud Infra" value="72" max="100"' },
          {
            name: 'TxRow_0',
            children: [
              { name: 'Merchant', text: 'Cloudflare' },
              { name: 'Category', text: 'Cloud Infra' },
              { name: 'Date', text: '2026-11-18' },
              { name: 'el-badge | label="Cleared"' },
              { name: 'Amount', text: '-$500.00' },
            ],
          },
        ],
      },
      { name: 'el-drawer | placement="right" heading="Inspect Entry"', children: [] },
      { name: 'el-dialog | heading="New Expense"', children: [] },
    ],
  };

  const spec = extractElementumSpec(mockTree);
  assert.equal(spec.brand, 'LedgerFlow');
  assert.equal(spec.badge, 'Pro');
  assert.equal(spec.heading, 'Treasury Overview');
  assert.equal(spec.primaryCta, '+ Record Spend');
  assert.equal(spec.kpis.length, 1);
  assert.equal(spec.kpis[0].value, 52000);
  assert.equal(spec.budgets.length, 1);
  assert.equal(spec.transactions.length, 1);
  assert.equal(spec.transactions[0].amount, -500);
  assert.equal(spec.unknownTags.length, 0);
  assert.ok(spec.discoveredTags.includes('el-navbar'));
  assert.ok(spec.discoveredTags.includes('el-drawer'));
  assert.ok(spec.discoveredTags.includes('el-dialog'));

  const html = generateAppHtml(spec);
  assert.ok(html.includes('<el-navbar'));
  assert.ok(html.includes('<el-number-flow'));
  assert.ok(html.includes('<el-chart'));
  assert.ok(html.includes('<el-meter'));
  assert.ok(html.includes('<el-drawer'));
  assert.ok(html.includes('<el-dialog'));
  assert.ok(html.includes('Treasury Overview'));
  assert.ok(html.includes('Cloudflare'));
});

test('Penpot Designer: buildLedgerFlowPenpotScript targets requested page name', () => {
  const script = buildLedgerFlowPenpotScript('LedgerFlow App');
  assert.ok(script.includes('"LedgerFlow App"'));
  assert.ok(script.includes('LedgerFlow / App Shell'));
  assert.ok(script.includes('el-navbar'));
  assert.ok(script.includes('el-drawer'));
  assert.ok(script.includes('el-dialog'));
});

test('Penpot Codegen: parsePenpotLayerName parses boolean flags and Penpot library variant paths', () => {
  const withFlags = parsePenpotLayerName('el-code-block | language="js" copyable compact');
  assert.deepEqual(withFlags, {
    tag: 'el-code-block',
    props: { language: 'js', copyable: true, compact: true },
    isValidElementum: true,
  });

  const libDanger = parsePenpotLayerName('Actions & Buttons / el-button / danger');
  assert.deepEqual(libDanger, {
    tag: 'el-button',
    props: { variant: 'danger' },
    isValidElementum: true,
  });

  const libChecked = parsePenpotLayerName('Forms & Inputs / el-switch / checked');
  assert.deepEqual(libChecked, {
    tag: 'el-switch',
    props: { checked: true },
    isValidElementum: true,
  });

  const libSize = parsePenpotLayerName('Actions & Buttons / el-button / sm | disabled');
  assert.deepEqual(libSize, {
    tag: 'el-button',
    props: { size: 'sm', disabled: true },
    isValidElementum: true,
  });

  const libStatus = parsePenpotLayerName('Data Display / el-avatar / online');
  assert.deepEqual(libStatus, {
    tag: 'el-avatar',
    props: { status: 'online' },
    isValidElementum: true,
  });

  const libAi = parsePenpotLayerName('AI & Specialist / el-diff-viewer');
  assert.deepEqual(libAi, {
    tag: 'el-diff-viewer',
    props: {},
    isValidElementum: true,
  });
});

test('Penpot Codegen: renderElementumNode & generatePageHtml compile all 113 components, structural helpers, and escape XSS', () => {
  const catalogList = Array.isArray(catalogComponents)
    ? catalogComponents
    : Object.values(catalogComponents);
  assert.equal(catalogList.length, 114);

  for (const comp of catalogList) {
    const parsed = parsePenpotLayerName(comp.tag);
    assert.equal(parsed?.isValidElementum, true, `${comp.tag} should validate`);
    const html = renderElementumNode({ name: comp.tag, children: [] });
    assert.ok(html.includes(`<${comp.tag}>`), `${comp.tag} opening tag missing`);
    assert.ok(html.includes(`</${comp.tag}>`), `${comp.tag} closing tag missing`);
  }

  const pageTree = {
    pageName: 'AI Workspace <XSS>',
    children: [
      { name: 'DecorativeRect', type: 'rect' },
      { name: 'el-unknown-widget', children: [] },
      {
        name: 'Main Section',
        children: [
          { name: 'el-card | title="Overview" bordered', children: [{ name: 'el-callout | variant="warning" title="Notice" text="Check <script>alert(1)</script>"' }] },
          { name: 'el-code-block | language="js" copyable text="const x = 1;"' },
          { name: 'el-diff-viewer | filename="app.js" approval' },
          { name: 'el-sources | label="Refs" expanded' },
          { name: 'el-task-list | heading="Plan" compact' },
          { name: 'el-insight-card | metric="+24%" delta="+4%" variant="success" title="Velocity"' },
          { name: 'el-button | variant="primary"', children: [{ name: 'Txt', type: 'text', text: 'Deploy' }] },
          { name: 'el-input | placeholder="Email" required' },
          { name: 'el-switch | checked disabled' },
          { name: 'el-tabs | value="one"', children: [{ name: 'el-tab | value="one" label="Tab 1"' }] },
        ],
      },
    ],
  };

  const doc = generatePageHtml(pageTree);
  assert.ok(doc.includes('AI Workspace &lt;XSS&gt;'));
  assert.ok(!doc.includes('<script>alert(1)</script>'));
  assert.ok(doc.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!doc.includes('DecorativeRect'));
  assert.ok(!doc.includes('<el-unknown-widget>'));
  assert.ok(doc.includes('<section class="pp-group" data-layer="Main Section">'));
  assert.ok(doc.includes('<el-card bordered>'));
  assert.ok(doc.includes('<el-card-header><el-card-title>Overview</el-card-title></el-card-header>'));
  assert.ok(doc.includes('<span slot="title">Notice</span>'));
  assert.ok(doc.includes('<el-code-block language="js" copyable>const x = 1;</el-code-block>'));
  assert.ok(doc.includes('<el-diff-viewer filename="app.js" approval></el-diff-viewer>'));
  assert.ok(doc.includes('<el-sources label="Refs" expanded></el-sources>'));
  assert.ok(doc.includes('<el-task-list heading="Plan" compact></el-task-list>'));
  assert.ok(doc.includes('<el-insight-card metric="+24%" delta="+4%" variant="success" title="Velocity"></el-insight-card>'));
  assert.ok(doc.includes('<el-button variant="primary">Deploy</el-button>'));
  assert.ok(doc.includes('<el-input placeholder="Email" required></el-input>'));
  assert.ok(doc.includes('<el-switch checked disabled></el-switch>'));
  assert.ok(doc.includes('<el-tabs value="one">'));

  const emptyDoc = generatePageHtml({ pageName: 'Empty', children: [] });
  assert.ok(emptyDoc.includes('No Elementum (el-*) layers discovered'));
});
