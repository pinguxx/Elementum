#!/usr/bin/env node
/**
 * Elementum Design System MCP Server
 * Exposes component schemas, tokens, and markup generation tools to AI coding agents.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Load Custom Elements Manifest and Figma Tokens
const manifestPath = path.join(rootDir, 'custom-elements.json');
const tokensPath = path.join(rootDir, 'tokens', 'figma-tokens.json');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

const TOOLS = [
  {
    name: 'list_components',
    description: 'Lists all available Web Components in the Elementum Design System.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_component_doc',
    description: 'Retrieves attributes, slots, events, and CSS parts for an Elementum component.',
    inputSchema: {
      type: 'object',
      properties: {
        tag: {
          type: 'string',
          description: 'The custom element tag name, e.g. "el-button" or "el-badge"',
        },
      },
      required: ['tag'],
    },
  },
  {
    name: 'list_tokens',
    description: 'Lists Figma design tokens (colors, spacing, radii) for the design system.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['color', 'spacing', 'radius', 'all'],
          description: 'Token category to filter by.',
        },
      },
    },
  },
  {
    name: 'generate_snippet',
    description: 'Generates valid Elementum Web Component HTML markup matching Figma variants.',
    inputSchema: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'Component tag, e.g. "el-button"' },
        variant: { type: 'string', description: 'Visual variant, e.g. "primary", "secondary", "danger"' },
        size: { type: 'string', description: 'Size variant, e.g. "sm", "md", "lg"' },
        label: { type: 'string', description: 'Content text for the default slot' },
        disabled: { type: 'boolean', description: 'Whether the element is disabled' },
      },
      required: ['tag'],
    },
  },
];

function handleToolCall(name, args) {
  if (name === 'list_components') {
    const list = manifest.modules.flatMap((m) =>
      m.declarations.map((d) => ({
        tag: d.tagName,
        name: d.name,
        description: d.description,
      }))
    );
    return { components: list };
  }

  if (name === 'get_component_doc') {
    const match = manifest.modules
      .flatMap((m) => m.declarations)
      .find((d) => d.tagName === args.tag);

    if (!match) {
      return { error: `Component <${args.tag}> not found in manifest.` };
    }
    return match;
  }

  if (name === 'list_tokens') {
    const category = args?.category || 'all';
    if (category === 'all') {
      return tokens;
    }
    return tokens[category] || { error: `Category '${category}' not found.` };
  }

  if (name === 'generate_snippet') {
    const { tag, variant, size, label, disabled } = args;
    const attrs = [];
    if (variant) attrs.push(`variant="${variant}"`);
    if (size) attrs.push(`size="${size}"`);
    if (disabled) attrs.push('disabled');

    const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    const content = label || '';
    return {
      snippet: `<${tag}${attrStr}>${content}</${tag}>`,
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

// JSON-RPC stdio protocol loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', (line) => {
  if (!line.trim()) return;

  try {
    const request = JSON.parse(line);

    if (request.method === 'tools/list') {
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: { tools: TOOLS },
      };
      process.stdout.write(JSON.stringify(response) + '\n');
      return;
    }

    if (request.method === 'tools/call') {
      const { name, arguments: toolArgs } = request.params;
      const result = handleToolCall(name, toolArgs);
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
      process.stdout.write(JSON.stringify(response) + '\n');
      return;
    }

    if (request.method === 'initialize') {
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'elementum-design-system-mcp',
            version: '0.1.0',
          },
        },
      };
      process.stdout.write(JSON.stringify(response) + '\n');
      return;
    }
  } catch (err) {
    const errorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32603, message: err.message },
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});
