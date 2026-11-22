#!/usr/bin/env node
/**
 * Elementum Design System MCP Server (Node.js stdio entrypoint)
 * Exposes component schemas, tokens, and markup generation tools to AI coding agents.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';
import { createMcpHandler } from './core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'custom-elements.json'), 'utf8'));
const tokens = JSON.parse(fs.readFileSync(path.join(rootDir, 'tokens', 'figma-tokens.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const metadata = JSON.parse(fs.readFileSync(path.join(rootDir, 'mcp', 'component-metadata.json'), 'utf8'));

export const { TOOLS, handleToolCall, handleJsonRpcLine } = createMcpHandler({
  manifest,
  tokens,
  pkg,
  metadata,
});

// Start JSON-RPC stdio loop only when executed directly as CLI
const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', (line) => {
    const response = handleJsonRpcLine(line);
    if (response) {
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  });
}
