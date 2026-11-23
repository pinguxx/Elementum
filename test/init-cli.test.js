import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  detectFramework,
  buildMcpConfig,
  buildAgentRulesSnippet,
  runInit,
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
    assert.ok(tokens.includes('--el-accent-primary'));

    // Second run with --mcp-only skips rules & tokens
    const mcpOnlyRes = runInit(['--mcp-only'], tmp);
    assert.deepEqual(mcpOnlyRes.written, ['.mcp.json', '.cursor/mcp.json']);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('buildAgentRulesSnippet adapts import hint for vanilla vs react', () => {
  assert.ok(buildAgentRulesSnippet('vanilla').includes("import '@wcomp/elementum';"));
  assert.ok(buildAgentRulesSnippet('next').includes("from '@wcomp/elementum/react';"));
});
