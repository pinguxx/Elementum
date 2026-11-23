#!/usr/bin/env node
/**
 * Automated Objective Scorer for the 4-Arm AI-Agent UI Benchmark
 *
 * Evaluates any generated HTML page across:
 *   1. Static Component Contract Validation (MCP `validate_component_usage` for `el-*` tags)
 *   2. Static Accessibility Lint (MCP `lint_accessibility`)
 *   3. Real-Browser Runtime Errors (Chromium `pageerror` + `console.error`)
 *   4. Real-Browser WCAG 2.2 AA Audit (`@axe-core/playwright` critical/serious/moderate/minor)
 *   5. Responsive Overflow Checks (Desktop 1280x800 & Mobile 375x812)
 *   6. Custom Element Hydration Ratio
 *
 * Usage:
 *   node benchmarks/agent-eval/score.js examples/saas-admin.html --arm="Reference Baseline"
 *   node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/arm1/index.html --arm="Arm 1: Elementum + MCP" --json
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { handleToolCall } from '../../mcp/server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');

const args = process.argv.slice(2);
const targetArg = args.find((a) => !a.startsWith('--'));
const armFlag = args.find((a) => a.startsWith('--arm='));
const jsonOnly = args.includes('--json');

if (!targetArg) {
  console.error('Usage: node benchmarks/agent-eval/score.js <path-to-html> [--arm="Label"] [--json]');
  process.exit(1);
}

const targetPath = path.resolve(rootDir, targetArg);
if (!fs.existsSync(targetPath)) {
  console.error(`File not found: ${targetPath}`);
  process.exit(1);
}

const armLabel = armFlag ? armFlag.slice('--arm='.length) : path.relative(rootDir, targetPath);
const htmlSource = fs.readFileSync(targetPath, 'utf8');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function startStaticServer(baseDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
      let filePath = path.join(baseDir, decodeURIComponent(reqUrl.pathname));
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      if (!filePath.startsWith(baseDir) || !fs.existsSync(filePath)) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
  });
}

// 1. Static MCP contract & accessibility checks
const hasElementumTags = /<el-[a-z0-9-]+[\s>]/i.test(htmlSource);
let invalidUsageCount = 0;
let invalidUsageDetails = [];
if (hasElementumTags) {
  const usage = handleToolCall('validate_component_usage', { html: htmlSource });
  const issues = usage?.issues || usage?.errors || [];
  invalidUsageCount = Array.isArray(issues) ? issues.length : 0;
  invalidUsageDetails = Array.isArray(issues) ? issues.slice(0, 10) : [];
}

const staticLint = handleToolCall('lint_accessibility', { html: htmlSource });
const staticLintCount = Array.isArray(staticLint?.issues) ? staticLint.issues.length : 0;

// 2. Real-browser Playwright + axe-core evaluation
const { server, port } = await startStaticServer(rootDir);
const relUrlPath = '/' + path.relative(rootDir, targetPath).split(path.sep).join('/');
const url = `http://127.0.0.1:${port}${relUrlPath}`;

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage', '--disable-gpu', '--no-sandbox'] });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(
    () => {
      const first = Array.from(document.querySelectorAll('*')).find((el) => el.tagName.includes('-'));
      return !first || Boolean(customElements.get(first.tagName.toLowerCase()));
    },
    { timeout: 5000 }
  ).catch(() => {});
  await page.waitForTimeout(300);

  const desktopMetrics = await page.evaluate(() => {
    const customEls = Array.from(document.querySelectorAll('*')).filter((el) => el.tagName.includes('-'));
    const hydrated = customEls.filter((el) => Boolean(el.shadowRoot));
    return {
      desktopOverflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      customElementCount: customEls.length,
      hydratedCount: hydrated.length,
    };
  });

  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of axe.violations) {
    if (v.impact in byImpact) byImpact[v.impact] += v.nodes.length;
  }

  // Mobile viewport overflow check
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(150);
  const mobileOverflowPx = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - window.innerWidth)
  );

  const report = {
    arm: armLabel,
    file: path.relative(rootDir, targetPath),
    linesOfCode: htmlSource.trim().split('\n').length,
    hasElementumTags,
    invalidComponentUsage: invalidUsageCount,
    staticA11yLintIssues: staticLintCount,
    runtimeErrors: pageErrors.length + consoleErrors.length,
    pageErrors,
    consoleErrors,
    axeViolations: byImpact,
    axeRuleIds: axe.violations.map((v) => `${v.id} (${v.impact})`),
    desktopOverflowPx: desktopMetrics.desktopOverflowPx,
    mobileOverflowPx,
    customElementCount: desktopMetrics.customElementCount,
    hydratedCount: desktopMetrics.hydratedCount,
  };

  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const severeAxe = byImpact.critical + byImpact.serious;
    console.log(`\n📊 AI-Agent UI Benchmark Report: ${report.arm}`);
    console.log(`   File:                     ${report.file} (${report.linesOfCode} LOC)`);
    console.log(`   Invalid Component Usage:  ${report.invalidComponentUsage}${hasElementumTags ? '' : ' (N/A - non-Elementum)'}`);
    console.log(`   Static A11y Lint Issues:  ${report.staticA11yLintIssues}`);
    console.log(`   Runtime Errors:           ${report.runtimeErrors}`);
    console.log(`   WCAG 2.2 AA Severe (C/S): ${severeAxe} (critical: ${byImpact.critical}, serious: ${byImpact.serious}, moderate: ${byImpact.moderate})`);
    console.log(`   Overflow (Desktop/Mob):   ${report.desktopOverflowPx}px / ${report.mobileOverflowPx}px`);
    console.log(`   Custom Elements Hydrated: ${report.hydratedCount} / ${report.customElementCount}`);
    if (invalidUsageDetails.length > 0) {
      console.log('   Sample usage issues:', JSON.stringify(invalidUsageDetails.slice(0, 3)));
    }
    if (report.axeRuleIds.length > 0) {
      console.log('   Axe rule IDs:', report.axeRuleIds.join(', '));
    }
    console.log('\nMarkdown Table Row:');
    console.log(
      `| ${report.arm} | ${report.linesOfCode} | ${hasElementumTags ? report.invalidComponentUsage : 'N/A'} | ${report.runtimeErrors} | ${severeAxe} | ${report.desktopOverflowPx}px / ${report.mobileOverflowPx}px | — | — |`
    );
  }
} finally {
  await browser.close();
  server.closeAllConnections?.();
  server.close();
}
