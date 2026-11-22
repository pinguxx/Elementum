/**
 * Pure-JS, runtime-agnostic Elementum MCP Core (Node.js stdio + Vercel Edge Runtime).
 * Zero Node built-ins so Edge isolates cold-start in ~10ms.
 */

const textEncoder = new TextEncoder();
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

export function createMcpHandler({ manifest, tokens, pkg }) {
  const MAX_PAYLOAD_BYTES = 128 * 1024;
  const SAFE_TAG_RE = /^[a-z][a-z0-9]*-[a-z0-9-]+$/;
  const SAFE_CLASS_RE = /^[A-Z][A-Za-z0-9_]*$/;
  const SAFE_ATTR_RE = /^[a-z][a-z0-9-]*$/;
  const GLOBAL_HTML_ATTRS = new Set([
    'id', 'class', 'style', 'slot', 'part', 'title', 'lang', 'dir', 'hidden',
    'tabindex', 'role', 'draggable', 'contenteditable', 'spellcheck', 'translate',
    'unstyled', 'name', 'value', 'disabled', 'required', 'readonly', 'autofocus',
  ]);
  
  function escapeAttr(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  
  function escapeText(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  
  const allDeclarations = manifest.modules.flatMap((m) =>
    (m.declarations || []).map((d) => ({ ...d, modulePath: m.path }))
  );
  const declByTag = new Map(allDeclarations.map((d) => [d.tagName, d]));
  
  const READ_ONLY_ANNOTATIONS = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };
  
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
      name: 'lint_accessibility',
      description: 'Static HTML accessibility linter for common WCAG 2.2 labeling and attribute issues (not a substitute for real-browser axe-core auditing).',
      inputSchema: {
        type: 'object',
        properties: {
          markup: { type: 'string', description: 'HTML markup snippet to inspect' },
        },
        required: ['markup'],
      },
    },
    {
      name: 'validate_accessibility',
      description: 'Alias for lint_accessibility: static HTML accessibility linter for common WCAG 2.2 labeling issues.',
      inputSchema: {
        type: 'object',
        properties: {
          markup: { type: 'string', description: 'HTML markup snippet to inspect' },
        },
        required: ['markup'],
      },
    },
    {
      name: 'suggest_component',
      description: 'Recommends Elementum Web Components that best match a UI requirement or natural-language query.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'UI requirement, e.g. "date picker", "code diff", "command palette"' },
          limit: { type: 'number', description: 'Maximum results to return (default 5)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'validate_component_usage',
      description: 'Validates <el-*> tags and attributes in an HTML snippet against the live Custom Elements Manifest to catch hallucinated tags or props.',
      inputSchema: {
        type: 'object',
        properties: {
          markup: { type: 'string', description: 'HTML snippet containing <el-*> components' },
        },
        required: ['markup'],
      },
    },
    {
      name: 'get_component_maturity',
      description: 'Returns machine-readable package version, component count, stability tier, and browser/testing verification metadata.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ].map((tool) => ({ ...tool, annotations: READ_ONLY_ANNOTATIONS }));
  
  function handleToolCall(name, rawArgs) {
    const args = rawArgs && typeof rawArgs === 'object' && !Array.isArray(rawArgs) ? rawArgs : {};
  
    if (name === 'list_components') {
      const list = allDeclarations.map((d) => ({
        tag: d.tagName,
        name: d.name,
        description: d.description,
      }));
      return { count: list.length, components: list };
    }
  
    if (name === 'get_component_doc') {
      const tag = typeof args.tag === 'string' ? args.tag.trim().toLowerCase() : '';
      const match = declByTag.get(tag);
  
      if (!match) {
        return { error: `Component <${tag || 'unknown'}> not found in manifest.` };
      }
      return match;
    }
  
    if (name === 'list_tokens') {
      const category = typeof args.category === 'string' ? args.category : 'all';
      if (category === 'all') {
        return tokens;
      }
      return tokens[category] || { error: `Category '${category}' not found.` };
    }
  
    if (name === 'generate_snippet') {
      const tag = typeof args.tag === 'string' ? args.tag.trim().toLowerCase() : '';
      if (!SAFE_TAG_RE.test(tag)) {
        return { error: `Invalid custom element tag name: '${tag}'. Expected lowercase kebab-case with hyphen.` };
      }
      const { variant, size, label, disabled } = args;
      const attrs = [];
      if (variant !== undefined && variant !== '') attrs.push(`variant="${escapeAttr(variant)}"`);
      if (size !== undefined && size !== '') attrs.push(`size="${escapeAttr(size)}"`);
      if (disabled) attrs.push('disabled');
  
      const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
      const content = escapeText(label || '');
      return {
        snippet: `<${tag}${attrStr}>${content}</${tag}>`,
      };
    }
  
    if (name === 'scaffold_component') {
      const tag = typeof args.tag === 'string' ? args.tag.trim().toLowerCase() : '';
      if (!SAFE_TAG_RE.test(tag)) {
        return { error: `Invalid custom element tag name: '${tag}'. Expected lowercase kebab-case with hyphen.` };
      }
      const derivedName = tag
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
      const className = typeof args.name === 'string' && SAFE_CLASS_RE.test(args.name) ? args.name : derivedName;
      const formAssociated = !!args.formAssociated;
      const rawAttrs = Array.isArray(args.attributes) ? args.attributes : ['disabled', 'size'];
      const attrs = rawAttrs.filter((a) => typeof a === 'string' && SAFE_ATTR_RE.test(a));
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
  
      const safeDescription = typeof args.description === 'string' && args.description.trim()
        ? args.description.replace(/\*\//g, '* /').replace(/[\r\n]+/g, ' ').trim()
        : `${className} component`;
  
      const code = `import { Elementum } from '../elementum.js';
  import { html, css } from '../template.js';
  import { signal } from '../signal.js';
  
  /**
   * ${safeDescription}
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
  
    if (name === 'validate_accessibility' || name === 'lint_accessibility') {
      const markup = typeof args.markup === 'string' ? args.markup : '';
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
        scope: 'static-html-lint',
        disclaimer:
          'Static HTML lint only — run `npm run test:e2e` (@axe-core/playwright) in real browsers for full WCAG 2.2 AA auditing.',
        valid: violations.length === 0,
        violationsCount: violations.length,
        warningsCount: warnings.length,
        violations,
        warnings,
        passed,
      };
    }
  
    if (name === 'suggest_component') {
      const query = typeof args.query === 'string' ? args.query.trim().toLowerCase() : '';
      if (!query) return { suggestions: [] };
      const limit = Math.max(1, Math.min(20, Number(args.limit) || 5));
      const terms = query.split(/\s+/).filter(Boolean);
  
      const scored = allDeclarations
        .map((d) => {
          const hay = `${d.tagName} ${d.name} ${d.description || ''} ${(d.attributes || []).map((a) => a.name).join(' ')}`.toLowerCase();
          let score = 0;
          for (const t of terms) {
            if (d.tagName.includes(t)) score += 4;
            if ((d.name || '').toLowerCase().includes(t)) score += 3;
            if (hay.includes(t)) score += 1;
          }
          return { tag: d.tagName, name: d.name, description: d.description || '', score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
  
      return { query, suggestions: scored };
    }
  
    if (name === 'validate_component_usage') {
      const markup = typeof args.markup === 'string' ? args.markup : '';
      const issues = [];
      const checkedTags = [];
  
      for (const match of markup.matchAll(/<(el-[a-z0-9-]+)([^>]*)>/gi)) {
        const tag = match[1].toLowerCase();
        const attrChunk = match[2] || '';
        checkedTags.push(tag);
        const decl = declByTag.get(tag);
        if (!decl) {
          issues.push({ severity: 'error', tag, message: `Unknown Elementum tag <${tag}> (not in custom-elements.json).` });
          continue;
        }
        const allowed = new Set((decl.attributes || []).map((a) => a.name));
        for (const attrMatch of attrChunk.matchAll(/\s([a-zA-Z_:][a-zA-Z0-9_.:-]*)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g)) {
          const attr = attrMatch[1].toLowerCase();
          if (
            allowed.has(attr) ||
            GLOBAL_HTML_ATTRS.has(attr) ||
            attr.startsWith('aria-') ||
            attr.startsWith('data-') ||
            attr.startsWith('on')
          ) {
            continue;
          }
          issues.push({
            severity: 'warning',
            tag,
            attribute: attr,
            message: `Attribute "${attr}" is not declared on <${tag}>. Allowed: ${[...allowed].join(', ') || '(none)'}.`,
          });
        }
      }
  
      return {
        valid: issues.filter((i) => i.severity === 'error').length === 0,
        checkedCount: checkedTags.length,
        issues,
      };
    }
  
    if (name === 'get_component_maturity') {
      return {
        package: pkg.name,
        version: pkg.version,
        maturity: 'beta',
        componentCount: allDeclarations.length,
        zeroRuntimeDependencies: !pkg.dependencies || Object.keys(pkg.dependencies).length === 0,
        testing: {
          unitRunner: 'node:test + happy-dom',
          browserE2E: 'playwright (Chromium, Firefox, WebKit) + @axe-core/playwright',
        },
        subpathExports: Object.keys(pkg.exports || {}),
      };
    }
  
    throw new Error(`Unknown tool: ${name}`);
  }

  function handleSingleRequest(request) {
    if (!request || typeof request !== 'object' || Array.isArray(request)) {
      return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid JSON-RPC request object.' } };
    }

    // JSON-RPC notifications (no id) MUST NOT produce a response per spec
    if (request.id === undefined) {
      return null;
    }

    if (request.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { tools: TOOLS },
      };
    }

    if (request.method === 'tools/call') {
      const params = request.params && typeof request.params === 'object' ? request.params : {};
      try {
        const result = handleToolCall(params.name, params.arguments);
        const isError = Boolean(result && typeof result === 'object' && 'error' in result);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
            ...(isError ? { isError: true } : {}),
          },
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
            isError: true,
          },
        };
      }
    }

    if (request.method === 'ping') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {},
      };
    }

    if (request.method === 'initialize') {
      const requested = request.params?.protocolVersion;
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
        ? requested
        : '2025-03-26';
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion,
          capabilities: { tools: {} },
          serverInfo: {
            name: 'elementum-design-system-mcp',
            title: 'Elementum Design System MCP',
            version: pkg.version,
          },
          instructions:
            'Query Elementum Web Components schemas, W3C DTCG design tokens, snippet generation, and WCAG 2.2 AA accessibility lint checks.',
        },
      };
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      error: { code: -32601, message: `Method not found: ${request.method}` },
    };
  }

  function handleJsonRpcLine(line) {
    if (typeof line !== 'string' || !line.trim()) return null;
    if (textEncoder.encode(line).length > MAX_PAYLOAD_BYTES) {
      return {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32600, message: `Payload exceeds maximum size of ${MAX_PAYLOAD_BYTES} bytes.` },
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: `Parse error: ${err.message}` },
      };
    }

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid empty batch.' } };
      }
      const responses = parsed.map(handleSingleRequest).filter((r) => r !== null);
      return responses.length > 0 ? responses : null;
    }

    return handleSingleRequest(parsed);
  }

  return { TOOLS, handleToolCall, handleJsonRpcLine };
}
