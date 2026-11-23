#!/usr/bin/env node
/**
 * Multi-Arm / Multi-Model AI-Agent UI Benchmark Matrix Runner
 *
 * Automatically discovers and scores all submission files under
 * `benchmarks/agent-eval/submissions/` (plus the reference baseline)
 * using `benchmarks/agent-eval/score.js --json`, computes aggregate
 * summary statistics across Elementum vs. non-Elementum arms, and
 * outputs a reproducible Markdown table or JSON report.
 *
 * Usage:
 *   node benchmarks/agent-eval/run-matrix.js
 *   node benchmarks/agent-eval/run-matrix.js --json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { scoreTarget, startStaticServer } from './score.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');
const submissionsDir = path.join(__dirname, 'submissions');

const jsonMode = process.argv.includes('--json');

const ARM_LABELS = {
  'arm-1-elementum-mcp': 'Arm 1: Elementum + MCP',
  'arm-2-elementum-docs': 'Arm 2: Elementum + Docs Only',
  'arm-3-conventional': 'Arm 3: Conventional CSS',
  'arm-4-no-ds': 'Arm 4: No Design-System Context',
};

function discoverTargets() {
  const targets = [
    {
      label: 'Reference Baseline (`examples/saas-admin.html`)',
      relPath: 'examples/saas-admin.html',
      group: 'baseline',
    },
  ];

  if (fs.existsSync(submissionsDir)) {
    const entries = fs.readdirSync(submissionsDir).sort();
    for (const entry of entries) {
      const htmlPath = path.join(submissionsDir, entry, 'index.html');
      if (fs.existsSync(htmlPath)) {
        const relPath = path.relative(rootDir, htmlPath).replaceAll('\\', '/');
        const baseLabel = ARM_LABELS[entry] || entry;
        const group = entry.includes('elementum') ? 'elementum' : 'control';
        targets.push({
          label: `${baseLabel} (\`${relPath}\`)`,
          relPath,
          group,
        });
      }
    }
  }
  return targets;
}

const targets = discoverTargets();
const results = [];

const { server, port } = await startStaticServer(rootDir);
const browser = await chromium.launch();

try {
  for (const t of targets) {
    const parsed = await scoreTarget(t.relPath, { armLabel: t.label, browser, port });
    results.push({ ...parsed, group: t.group });
  }
} finally {
  await browser.close();
  server.closeAllConnections?.();
  server.close();
}

function mean(nums) {
  if (nums.length === 0) return 0;
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
}

const elRuns = results.filter((r) => r.group === 'elementum');
const ctrlRuns = results.filter((r) => r.group === 'control');

const summary = {
  timestamp: new Date().toISOString(),
  nodeVersion: process.version,
  totalSubmissionsScored: results.length,
  elementumMeanSevereWcag: mean(elRuns.map((r) => (r.axeViolations?.critical || 0) + (r.axeViolations?.serious || 0))),
  controlMeanSevereWcag: mean(ctrlRuns.map((r) => (r.axeViolations?.critical || 0) + (r.axeViolations?.serious || 0))),
  elementumMeanMobileOverflowPx: mean(elRuns.map((r) => r.mobileOverflowPx || 0)),
  controlMeanMobileOverflowPx: mean(ctrlRuns.map((r) => r.mobileOverflowPx || 0)),
  results,
};

if (jsonMode) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log('# AI-Agent UI Benchmark Matrix Run\n');
  console.log(`- **Date**: \`${summary.timestamp}\``);
  console.log(`- **Node**: \`${summary.nodeVersion}\``);
  console.log(`- **Elementum Arms Mean Severe WCAG Violations**: **${summary.elementumMeanSevereWcag}** (vs. **${summary.controlMeanSevereWcag}** without Elementum)`);
  console.log(`- **Elementum Arms Mean Mobile Overflow**: **${summary.elementumMeanMobileOverflowPx}px** (vs. **${summary.controlMeanMobileOverflowPx}px** without Elementum)\n`);
  console.log('| Arm | LOC | Invalid Component Usage | Runtime Errors | WCAG 2.2 AA (Critical/Serious) | Overflow (Desktop / Mobile) | Custom Elements Hydrated |');
  console.log('| :--- | :---: | :---: | :---: | :---: | :---: | :---: |');
  for (const r of results) {
    console.log(r.markdownRow);
  }
}
