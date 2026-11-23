import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  detectFramework,
  buildMcpConfig,
  buildAgentRulesSnippet,
  runInit,
  runCheck,
  isCliEntry,
  REMOTE_MCP_URL,
} from '../bin/elementum.js';

test('detectFramework identifies Next.js, React, Vue, Svelte, Vite, and Vanilla projects', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'el-init-detect-'));
  try {
    assert.equal(detectFramework(tmp), 'vanilla');

    fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ dependencies: { next: '^16.0.0', react: '^19.0.0' } }));
    assert.equal(detectFramework(tmp), 'next');

    fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ dependencies: { react: '^19.0.0' } }));
    assert.equal(detectFramework(tmp), 'react');

    fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ dependencies: { vue: '^3.5.0' } }));
    assert.equal(detectFramework(tmp), 'vue');

    fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ devDependencies: { svelte: '^5.0.0' } }));
    assert.equal(detectFramework(tmp), 'svelte');

    fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ devDependencies: { vite: '^8.0.0' } }));
    assert.equal(detectFramework(tmp), 'vite');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('runInit writes .mcp.json, .cursor/mcp.json, elementum.rules.md, and elementum-tokens.css while preserving existing MCP servers', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'el-init-run-'));
  try {
    fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ dependencies: { react: '^19.0.0' } }));
    fs.writeFileSync(path.join(tmp, '.mcp.json'), JSON.stringify({ mcpServers: { existing: { url: 'https://example.com/mcp' } } }));

    // Dry run should not create .cursor/mcp.json
    const dry = runInit(['--dry-run'], tmp);
    assert.equal(dry.framework, 'react');
    assert.equal(dry.dryRun, true);
    assert.equal(fs.existsSync(path.join(tmp, '.cursor', 'mcp.json')), false);

    // Real run
    const res = runInit([], tmp);
    assert.equal(res.framework, 'react');
    assert.deepEqual(res.written, ['.mcp.json', '.cursor/mcp.json', 'elementum.rules.md', 'elementum-tokens.css']);

    const mcp = JSON.parse(fs.readFileSync(path.join(tmp, '.mcp.json'), 'utf8'));
    assert.equal(mcp.mcpServers.existing.url, 'https://example.com/mcp');
    assert.equal(mcp.mcpServers.elementum.url, REMOTE_MCP_URL);

    const cursorMcp = JSON.parse(fs.readFileSync(path.join(tmp, '.cursor', 'mcp.json'), 'utf8'));
    assert.deepEqual(cursorMcp, buildMcpConfig());

    const rules = fs.readFileSync(path.join(tmp, 'elementum.rules.md'), 'utf8');
    assert.ok(rules.includes('@wcomp/elementum/react'));
    assert.ok(rules.includes('showModal()'));

    const tokens = fs.readFileSync(path.join(tmp, 'elementum-tokens.css'), 'utf8');
    assert.ok(tokens.includes('--el-color-primary'));

    // Second run with --mcp-only skips rules & tokens
    const mcpOnlyRes = runInit(['--mcp-only'], tmp);
    assert.deepEqual(mcpOnlyRes.written, ['.mcp.json', '.cursor/mcp.json']);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('runInit in a vanilla project creates a working starter index.html and works when invoked via symlinked bin', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'el-init-vanilla-'));
  try {
    fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ dependencies: { '@wcomp/elementum': '^0.8.2' } }));
    const binDir = path.join(tmp, 'node_modules', '.bin');
    fs.mkdirSync(binDir, { recursive: true });
    const symlinkBin = path.join(binDir, 'elementum');
    const realBin = path.resolve('bin/elementum.js');
    fs.symlinkSync(realBin, symlinkBin);

    assert.equal(isCliEntry(new URL(`file://${realBin}`).href, symlinkBin), true);

    const stdout = execFileSync(process.execPath, [symlinkBin, 'init'], {
      cwd: tmp,
      encoding: 'utf8',
    });
    assert.ok(stdout.includes('Initialized Elementum (detected: vanilla)'));
    assert.ok(fs.existsSync(path.join(tmp, '.mcp.json')));
    assert.ok(fs.existsSync(path.join(tmp, '.cursor', 'mcp.json')));
    assert.ok(fs.existsSync(path.join(tmp, 'elementum.rules.md')));
    assert.ok(fs.existsSync(path.join(tmp, 'elementum-tokens.css')));
    assert.ok(fs.existsSync(path.join(tmp, 'index.html')));

    // Verify generated starter index.html passes `elementum check` with 0 errors and 0 warnings
    const checkReport = await runCheck(['index.html'], tmp);
    assert.equal(checkReport.valid, true);
    assert.equal(checkReport.errorCount, 0);
    assert.equal(checkReport.warningCount, 0);
    assert.ok(checkReport.totalTagsChecked >= 8);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('buildAgentRulesSnippet adapts import hint for vanilla vs react', () => {
  assert.ok(buildAgentRulesSnippet('vanilla').includes("import '@wcomp/elementum';"));
  assert.ok(buildAgentRulesSnippet('next').includes("from '@wcomp/elementum/react';"));
});

test('runCheck scans HTML/TSX files and reports invalid component usage or passes valid markup', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'el-check-run-'));
  try {
    const validFile = path.join(tmp, 'valid.html');
    fs.writeFileSync(validFile, '<el-button variant="primary">Save</el-button>');
    const okReport = await runCheck(['valid.html'], tmp);
    assert.equal(okReport.valid, true);
    assert.equal(okReport.filesScanned, 1);
    assert.equal(okReport.totalTagsChecked, 1);
    assert.equal(okReport.errorCount, 0);

    const invalidFile = path.join(tmp, 'invalid.html');
    fs.writeFileSync(invalidFile, '<el-button variant="not-a-variant">Bad</el-button><el-unknown-widget></el-unknown-widget>');
    const badReport = await runCheck([], tmp);
    assert.equal(badReport.valid, false);
    assert.equal(badReport.filesScanned, 2);
    assert.ok(badReport.errorCount >= 2);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('ElDialog supports dialog.open = true / false property assignment as an alias for showModal() and close()', async () => {
  await import('../test-helpers/setup.js');
  await import('../src/components/el-dialog.js');
  const dlg = document.createElement('el-dialog');
  dlg.setAttribute('title', 'Property Open Test');
  document.body.appendChild(dlg);
  try {
    assert.equal(dlg.open, false);
    dlg.open = true;
    assert.equal(dlg.open, true);
    assert.equal(dlg.getAttribute('data-state'), 'open');
    dlg.open = false;
    assert.equal(dlg.open, false);
    assert.equal(dlg.getAttribute('data-state'), 'closed');
  } finally {
    dlg.remove();
  }
});
