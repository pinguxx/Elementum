import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePenpotLayerName,
  extractElementumSpec,
  generateAppHtml,
} from '../tools/penpot-to-elementum.js';
import { buildLedgerFlowPenpotScript } from '../tools/design-ledgerflow-penpot.js';

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
