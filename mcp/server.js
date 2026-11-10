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
  {
    name: 'scaffold_component',
    description: 'Scaffolds standard boilerplate JavaScript code for a new Elementum Web Component adhering to design system standards.',
    inputSchema: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'Component tag, e.g. "el-card"' },
        name: { type: 'string', description: 'Component class name, e.g. "ElCard"' },
        description: { type: 'string', description: 'Component description' },
        formAssociated: { type: 'boolean', description: 'Whether the component associates with forms' },
        attributes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Observed attributes, e.g. ["variant", "disabled"]',
        },
      },
      required: ['tag'],
    },
  },
  {
    name: 'validate_accessibility',
    description: 'Audits Elementum component usage or HTML markup against WCAG 2.2 accessibility standards.',
    inputSchema: {
      type: 'object',
      properties: {
        markup: { type: 'string', description: 'HTML markup snippet to inspect' },
      },
      required: ['markup'],
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

  if (name === 'scaffold_component') {
    const tag = args.tag.toLowerCase();
    const className =
      args.name ||
      tag
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
    const formAssociated = !!args.formAssociated;
    const attrs = args.attributes || ['disabled', 'size'];
    const observed = attrs.map((a) => `'${a}'`).join(', ');

    const signalDefs = attrs
      .map((a) => {
        if (a === 'disabled') return `  disabled = signal(false);`;
        if (a === 'size') return `  size = signal('md'); // 'sm' | 'md' | 'lg'`;
        return `  ${a} = signal('');`;
      })
      .join('\n');

    const formAssocCode = formAssociated ? `  static formAssociated = true;\n` : '';
    const formCallbacks = formAssociated
      ? `
  connected() {
    this.setFormValue(this.value?.value || '');
    this.validate?.();
  }

  formReset() {
    this.value.value = this.getAttribute('value') || '';
    this.setFormValue(this.value.value);
    this.validate?.();
  }

  validate() {
    this.setValidity({});
    return true;
  }
`
      : '';

    const code = `import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

/**
 * ${args.description || `${className} component`}
 */
export class ${className} extends Elementum {
${formAssocCode}  static observedAttributes = [${observed}];

${signalDefs}
${formCallbacks}
  static styles = css\`
    :host {
      display: inline-block;
      box-sizing: border-box;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    :host(:focus-visible) {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: 2px;
    }

    .container {
      display: flex;
      align-items: center;
      padding: var(--el-spacing-sm, 8px) var(--el-spacing-md, 16px);
      border-radius: var(--el-radius-md, 8px);
      background: var(--el-surface-card, #ffffff);
      border: 1px solid var(--el-surface-border, #e5e7eb);
    }
  \`;

  render() {
    return html\`
      <div class="container" part="container">
        <slot></slot>
      </div>
    \`;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('${tag}')) {
  customElements.define('${tag}', ${className});
}
`;
    return {
      tag,
      className,
      code,
    };
  }

  if (name === 'validate_accessibility') {
    const markup = args.markup || '';
    const violations = [];
    const warnings = [];
    const passed = [];

    // WCAG 4.1.2: Form elements must have accessible labels
    const inputMatches = markup.match(/<el-input[^>]*>/gi) || [];
    for (const match of inputMatches) {
      const hasAriaLabel = /aria-label=/i.test(match);
      const hasAriaLabelledby = /aria-labelledby=/i.test(match);
      const hasId = /id=["']([^"']+)["']/i.test(match);
      if (!hasAriaLabel && !hasAriaLabelledby && !hasId) {
        violations.push({
          criterion: 'WCAG 4.1.2 (Name, Role, Value)',
          element: match,
          message:
            '<el-input> is missing an accessible name. Provide an aria-label, aria-labelledby, or an id associated with a <label for="...">.',
        });
      } else {
        passed.push({
          criterion: 'WCAG 4.1.2',
          message: '<el-input> has accessible label attributes.',
        });
      }
    }

    // WCAG 4.1.2 / 1.1.1: Icon buttons or buttons with missing label
    const buttonMatches = markup.match(/<el-button[^>]*>([\s\S]*?)<\/el-button>/gi) || [];
    for (const match of buttonMatches) {
      const tagOpen = match.match(/<el-button[^>]*>/i)?.[0] || '';
      const textContent = match.replace(/<[^>]+>/g, '').trim();
      const hasAriaLabel = /aria-label=/i.test(tagOpen);
      if (!textContent && !hasAriaLabel) {
        violations.push({
          criterion: 'WCAG 1.1.1 (Non-text Content) / WCAG 4.1.2 (Name, Role, Value)',
          element: tagOpen,
          message: '<el-button> has no text content and is missing an aria-label.',
        });
      } else {
        passed.push({
          criterion: 'WCAG 4.1.2',
          message: '<el-button> has accessible text or aria-label.',
        });
      }
    }

    // WCAG 1.1.1: Image without alt
    const imgMatches = markup.match(/<img[^>]*>/gi) || [];
    for (const match of imgMatches) {
      if (!/alt=/i.test(match)) {
        violations.push({
          criterion: 'WCAG 1.1.1 (Non-text Content)',
          element: match,
          message: '<img> is missing an alt attribute. Provide descriptive alt text or alt="" for decorative images.',
        });
      }
    }

    // WCAG 2.5.8: Target Size Minimum (24x24px) / Text size
    if (/font-size:\s*([0-9]+)px/i.test(markup)) {
      const sizeMatch = markup.match(/font-size:\s*([0-9]+)px/i);
      if (sizeMatch && Number(sizeMatch[1]) < 12) {
        warnings.push({
          criterion: 'WCAG 1.4.4 (Resize text)',
          message: `Text size ${sizeMatch[1]}px may be too small for readability. Recommend >= 12px.`,
        });
      }
    }

    // WCAG 3.3.1: Error identification
    if (
      /aria-invalid="true"/i.test(markup) &&
      !/aria-describedby=/i.test(markup) &&
      !/aria-errormessage=/i.test(markup)
    ) {
      warnings.push({
        criterion: 'WCAG 3.3.1 (Error Identification)',
        message:
          'Element has aria-invalid="true" but lacks aria-describedby or aria-errormessage linking to the validation error explanation.',
      });
    }

    return {
      valid: violations.length === 0,
      violationsCount: violations.length,
      warningsCount: warnings.length,
      violations,
      warnings,
      passed,
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
