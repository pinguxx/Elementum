/**
 * Pure-JS, runtime-agnostic Elementum MCP Core (Node.js stdio + Vercel Edge Runtime).
 * Zero Node built-ins so Edge isolates cold-start in ~10ms.
 */

import { RESOURCES, RESOURCE_TEMPLATES, createResourceReaders } from './resources.js';
import { PROMPTS, createPromptHandlers } from './prompts.js';

const textEncoder = new TextEncoder();
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

export function createMcpHandler({ manifest, tokens, pkg, metadata = {}, sizeBudgets = {} }) {
  const MAX_PAYLOAD_BYTES = 128 * 1024;
  const MAX_BATCH_SIZE = 20;
  const SAFE_TAG_RE = /^[a-z][a-z0-9]*-[a-z0-9-]+$/;
  const SAFE_CLASS_RE = /^[A-Z][A-Za-z0-9_]*$/;
  const SAFE_ATTR_RE = /^[a-z][a-z0-9-]*$/;
  const FORBIDDEN_PROTO_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
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

  function hasVisibleText(htmlSnippet) {
    let inTag = false;
    for (let i = 0; i < htmlSnippet.length; i++) {
      const ch = htmlSnippet[i];
      if (ch === '<') {
        inTag = true;
      } else if (ch === '>') {
        inTag = false;
      } else if (!inTag && !/\s/.test(ch)) {
        return true;
      }
    }
    return false;
  }
  
  const allDeclarations = manifest.modules.flatMap((m) =>
    (m.declarations || []).map((d) => ({ ...d, modulePath: m.path }))
  );
  const declByTag = new Map(allDeclarations.map((d) => [d.tagName, d]));

  function parseLiteralUnion(typeText) {
    if (typeof typeText !== 'string' || !typeText.includes('|')) return [];
    const parts = typeText.split('|').map((s) => s.trim());
    const out = [];
    for (const p of parts) {
      const m = /^['"]([^'"]+)['"]$/.exec(p);
      if (!m) return [];
      out.push(m[1]);
    }
    return out;
  }

  function getResolvedMetadata(decl) {
    if (metadata && metadata[decl.tagName]) {
      return metadata[decl.tagName];
    }
    const variants = [];
    const states = [];
    const props = [];
    const observedAttributes = [];
    for (const attr of decl.attributes || []) {
      observedAttributes.push(attr.name);
      const union = parseLiteralUnion(attr.type?.text);
      if (union.length > 0 && attr.name !== 'value') {
        variants.push({
          name: attr.name,
          allowedValues: union,
          default: union[0],
          description: attr.description || '',
        });
      } else if (attr.type?.text === 'boolean') {
        states.push({
          name: attr.name,
          type: 'boolean',
          default: attr.default === 'true' || attr.default === true,
          description: attr.description || '',
        });
      } else {
        props.push({
          name: attr.name,
          type: attr.type?.text || 'string',
          ...(attr.default !== undefined ? { default: attr.default } : {}),
          htmlAttribute: attr.name,
          jsProperty: attr.name.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase()),
          description: attr.description || '',
        });
      }
    }
    return {
      category: 'general',
      hasMotion: false,
      variants,
      states,
      props,
      constraints: {
        formAssociated: false,
        requiredParent: null,
        expectedChildren: [],
        observedAttributes,
        jsOnlyProperties: [],
        strictVariantValues: variants.length > 0,
        a11yNotes: [],
      },
      examples: [],
    };
  }
  
  const READ_ONLY_ANNOTATIONS = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };

  const toPascalCase = (tag) =>
    String(tag || '')
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');

  const SETUP_GUIDES = {
    cdn: {
      install: 'No build step required',
      imports: [
        '<link rel="stylesheet" href="https://unpkg.com/@wcomp/elementum/tokens.css" />',
        '<script type="module" src="https://unpkg.com/@wcomp/elementum"></script>',
      ],
    },
    vanilla: {
      install: 'npm install @wcomp/elementum',
      imports: ["import '@wcomp/elementum/tokens.css';", "import '@wcomp/elementum';"],
    },
    react: {
      install: 'npm install @wcomp/elementum',
      imports: [
        "import '@wcomp/elementum/tokens.css';",
        "import { ElButton, ElCard, ElTabs } from '@wcomp/elementum/react';",
      ],
    },
    next: {
      install: 'npm install @wcomp/elementum',
      imports: [
        "import '@wcomp/elementum/tokens.css';",
        "import { renderComponentToDSD } from '@wcomp/elementum/ssr';",
        "import { ElButton } from '@wcomp/elementum/react';",
      ],
    },
    vue: {
      install: 'npm install @wcomp/elementum',
      imports: ["import '@wcomp/elementum/tokens.css';", "import '@wcomp/elementum';"],
    },
    svelte: {
      install: 'npm install @wcomp/elementum',
      imports: ["import '@wcomp/elementum/tokens.css';", "import '@wcomp/elementum';"],
    },
    angular: {
      install: 'npm install @wcomp/elementum',
      imports: [
        "import '@wcomp/elementum/tokens.css';",
        "import '@wcomp/elementum';",
        "import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';",
      ],
      notes: 'Add CUSTOM_ELEMENTS_SCHEMA to your standalone component schemas array. Use ngDefaultControl when binding FACE inputs with formControlName or [(ngModel)].',
    },
  };
  
  const TOOLS = [
    {
      name: 'list_components',
      title: 'List components',
      description: 'Lists available Web Components in the Elementum Design System with optional filtering by category, form association, or motion support.',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            maxLength: 32,
            description: 'Optional category filter (e.g. "actions", "forms", "data", "feedback", "overlays", "navigation", "layout", "ai").',
          },
          formAssociated: {
            type: 'boolean',
            description: 'Filter to Form-Associated Custom Elements (FACE) when true, or non-FACE when false.',
          },
          hasMotion: {
            type: 'boolean',
            description: 'Filter to components with CSS/WAAPI motion or reduced-motion rules.',
          },
        },
      },
    },
    {
      name: 'get_component_doc',
      title: 'Get component documentation',
      description:
        'Retrieves structured component API metadata (separated closed variants, boolean states, props, composition/JS constraints, events, slots, CSS parts, and standalone usage examples) for an Elementum component.',
      inputSchema: {
        type: 'object',
        properties: {
          tag: {
            type: 'string',
            minLength: 3,
            maxLength: 64,
            description: 'The custom element tag name, e.g. "el-button" or "el-badge"',
          },
          section: {
            type: 'string',
            enum: ['all', 'schema', 'examples'],
            description:
              "Optional filter: 'schema' returns variants, states, props, constraints, events, slots & parts without usage examples; 'examples' returns only usage examples; 'all' (default) returns both as separate sections.",
          },
        },
        required: ['tag'],
      },
    },
    {
      name: 'list_tokens',
      title: 'List design tokens',
      description: 'Lists Figma/Penpot W3C DTCG design tokens (colors, spacing, radii) for the design system.',
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
      title: 'Generate component snippet',
      description: 'Generates valid Elementum snippet in HTML, React TSX, Vue 3 SFC, or declarative A2UI JSON format.',
      inputSchema: {
        type: 'object',
        properties: {
          tag: { type: 'string', minLength: 3, maxLength: 64, description: 'Component tag, e.g. "el-button"' },
          variant: { type: 'string', maxLength: 48, description: 'Visual variant, e.g. "primary", "secondary", "danger"' },
          size: { type: 'string', maxLength: 16, description: 'Size variant, e.g. "sm", "md", "lg"' },
          label: { type: 'string', maxLength: 500, description: 'Content text for the default slot' },
          disabled: { type: 'boolean', description: 'Whether the element is disabled' },
          format: {
            type: 'string',
            enum: ['html', 'react', 'vue', 'a2ui'],
            description: 'Target snippet format (default: "html").',
          },
        },
        required: ['tag'],
      },
    },
    {
      name: 'scaffold_component',
      title: 'Scaffold custom component',
      description: 'Scaffolds standard boilerplate JavaScript code for a new Elementum Web Component adhering to design system standards.',
      inputSchema: {
        type: 'object',
        properties: {
          tag: { type: 'string', minLength: 3, maxLength: 64, description: 'Component tag, e.g. "el-card"' },
          name: { type: 'string', maxLength: 64, description: 'Component class name, e.g. "ElCard"' },
          description: { type: 'string', maxLength: 500, description: 'Component description' },
          formAssociated: { type: 'boolean', description: 'Whether the component associates with forms' },
          attributes: {
            type: 'array',
            maxItems: 30,
            items: { type: 'string', maxLength: 48 },
            description: 'Observed attributes, e.g. ["variant", "disabled"]',
          },
        },
        required: ['tag'],
      },
    },
    {
      name: 'lint_accessibility',
      title: 'Lint HTML accessibility',
      description: 'Static HTML accessibility linter for common WCAG 2.2 labeling and attribute issues (not a substitute for real-browser axe-core auditing).',
      inputSchema: {
        type: 'object',
        properties: {
          markup: { type: 'string', minLength: 1, maxLength: 65536, description: 'HTML markup snippet to inspect' },
        },
        required: ['markup'],
      },
    },
    {
      name: 'validate_accessibility',
      title: 'Validate HTML accessibility',
      description: 'Alias for lint_accessibility: static HTML accessibility linter for common WCAG 2.2 labeling issues.',
      inputSchema: {
        type: 'object',
        properties: {
          markup: { type: 'string', minLength: 1, maxLength: 65536, description: 'HTML markup snippet to inspect' },
        },
        required: ['markup'],
      },
    },
    {
      name: 'suggest_component',
      title: 'Suggest matching components',
      description: 'Recommends Elementum Web Components that best match a UI requirement or natural-language query.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', minLength: 1, maxLength: 200, description: 'UI requirement, e.g. "date picker", "code diff", "command palette"' },
          limit: { type: 'integer', minimum: 1, maximum: 20, default: 5, description: 'Maximum results to return (default 5)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'validate_component_usage',
      title: 'Validate component markup',
      description: 'Validates <el-*> tags and attributes in an HTML snippet against the live Custom Elements Manifest to catch hallucinated tags or props.',
      inputSchema: {
        type: 'object',
        properties: {
          markup: { type: 'string', minLength: 1, maxLength: 65536, description: 'HTML snippet containing <el-*> components' },
        },
        required: ['markup'],
      },
    },
    {
      name: 'validate_a2ui_messages',
      title: 'Validate A2UI messages',
      description: 'Validates A2UI JSON messages (createSurface, beginRendering, surfaceUpdate, dataModelUpdate, deleteSurface) against Elementum DEFAULT_A2UI_CATALOG and security rules.',
      inputSchema: {
        type: 'object',
        properties: {
          messages: {
            type: 'array',
            minItems: 1,
            maxItems: 100,
            items: { type: 'object' },
            description: 'Array of A2UI JSON message objects to validate.',
          },
          allowedTypes: {
            type: 'array',
            maxItems: 50,
            items: { type: 'string', maxLength: 48 },
            description: 'Optional subset of allowed A2UI component types.',
          },
        },
        required: ['messages'],
      },
    },
    {
      name: 'get_component_maturity',
      title: 'Get package maturity & metrics',
      description: 'Returns machine-readable package version, component count, stability tier, and browser/testing verification metadata.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_setup',
      title: 'Get project setup',
      description: 'Returns zero-dependency installation commands, framework imports, dark-mode theme attribute setup, and reduced-motion notes.',
      inputSchema: {
        type: 'object',
        properties: {
          framework: {
            type: 'string',
            enum: ['vanilla', 'react', 'next', 'vue', 'svelte', 'angular', 'cdn'],
            description: 'Target framework or CDN workflow (optional; omits to return all).',
          },
        },
      },
    },
    {
      name: 'get_bundle_plan',
      title: 'Plan tree-shaken bundle',
      description: 'Plans tree-shaken imports and computes per-component and total gzipped byte budgets from size-budget.json for a list of tags.',
      inputSchema: {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            minItems: 1,
            maxItems: 50,
            items: { type: 'string', minLength: 3, maxLength: 64 },
            description: 'Array of Elementum custom element tags, e.g. ["el-button", "el-hold-button"].',
          },
          framework: {
            type: 'string',
            enum: ['html', 'react', 'vue', 'svelte', 'angular'],
            description: 'Target framework for import code (default: "html").',
          },
        },
        required: ['tags'],
      },
    },
  ].map((tool) => ({ ...tool, annotations: READ_ONLY_ANNOTATIONS, execution: { taskSupport: 'forbidden' } }));
  
  function handleToolCall(name, rawArgs) {
    const args = rawArgs && typeof rawArgs === 'object' && !Array.isArray(rawArgs) ? rawArgs : {};
  
    if (name === 'list_components') {
      const catFilter = typeof args.category === 'string' && args.category.trim() ? args.category.trim().toLowerCase() : null;
      const hasFaceFilter = typeof args.formAssociated === 'boolean';
      const hasMotionFilter = typeof args.hasMotion === 'boolean';

      const list = [];
      for (const d of allDeclarations) {
        const meta = getResolvedMetadata(d);
        const category = String(meta.category || 'general');
        const formAssociated = Boolean(meta.constraints?.formAssociated);
        const hasMotion = Boolean(meta.hasMotion);
        if (catFilter && category.toLowerCase() !== catFilter) continue;
        if (hasFaceFilter && formAssociated !== args.formAssociated) continue;
        if (hasMotionFilter && hasMotion !== args.hasMotion) continue;
        list.push({
          tag: d.tagName,
          name: d.name,
          description: d.description,
          category,
          formAssociated,
          hasMotion,
        });
      }
      return {
        count: list.length,
        filtersApplied: {
          ...(catFilter ? { category: catFilter } : {}),
          ...(hasFaceFilter ? { formAssociated: args.formAssociated } : {}),
          ...(hasMotionFilter ? { hasMotion: args.hasMotion } : {}),
        },
        components: list,
      };
    }
  
    if (name === 'get_component_doc') {
      const tag = typeof args.tag === 'string' ? args.tag.trim().toLowerCase() : '';
      const match = declByTag.get(tag);

      if (!match) {
        return { error: `Component <${tag || 'unknown'}> not found in manifest.` };
      }

      const rawSection = args.section === undefined || args.section === '' ? 'all' : String(args.section).trim().toLowerCase();
      if (!['all', 'schema', 'examples'].includes(rawSection)) {
        return { error: `Invalid section '${rawSection}'. Expected 'all', 'schema', or 'examples'.` };
      }

      const meta = getResolvedMetadata(match);

      if (rawSection === 'examples') {
        return {
          tagName: match.tagName,
          name: match.name,
          description: match.description,
          examples: meta.examples,
        };
      }

      if (rawSection === 'schema') {
        return {
          ...match,
          variants: meta.variants,
          states: meta.states,
          props: meta.props,
          constraints: meta.constraints,
        };
      }

      return {
        ...match,
        variants: meta.variants,
        states: meta.states,
        props: meta.props,
        constraints: meta.constraints,
        examples: meta.examples,
      };
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
      const fmt = typeof args.format === 'string' ? args.format.trim().toLowerCase() : 'html';
      const attrs = [];
      if (variant !== undefined && variant !== '') attrs.push(`variant="${escapeAttr(variant)}"`);
      if (size !== undefined && size !== '') attrs.push(`size="${escapeAttr(size)}"`);
      if (disabled) attrs.push('disabled');

      const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
      const content = escapeText(label || '');
      const htmlSnippet = `<${tag}${attrStr}>${content}</${tag}>`;

      if (fmt === 'react') {
        const pascal = toPascalCase(tag);
        return {
          format: 'react',
          snippet: `import '@wcomp/elementum/tokens.css';\nimport { ${pascal} } from '@wcomp/elementum/react';\n\nexport function Example() {\n  return <${pascal}${attrStr}>${content}</${pascal}>;\n}`,
        };
      }
      if (fmt === 'vue') {
        return {
          format: 'vue',
          snippet: `<script setup>\nimport '@wcomp/elementum/tokens.css';\nimport '@wcomp/elementum/components/${tag}.js';\n</script>\n\n<template>\n  ${htmlSnippet}\n</template>`,
        };
      }
      if (fmt === 'a2ui') {
        const a2uiMap = {
          'el-button': 'Button', 'el-card': 'Card', 'el-input': 'TextField', 'el-textarea': 'TextArea',
          'el-select': 'Select', 'el-badge': 'Badge', 'el-switch': 'Switch', 'el-checkbox': 'CheckBox',
          'el-slider': 'Slider', 'el-datepicker': 'DatePicker', 'el-chip': 'ChoiceChip', 'el-tabs': 'Tabs',
          'el-dialog': 'Dialog', 'el-meter': 'Meter', 'el-progress': 'Progress', 'el-callout': 'Callout',
          'el-alert': 'Alert', 'el-avatar': 'Avatar', 'el-code-block': 'CodeBlock', 'el-separator': 'Divider',
          'el-prompt-input': 'PromptInput', 'el-reasoning-card': 'ReasoningCard', 'el-tool-call': 'ToolCall',
          'el-streaming-text': 'StreamingText', 'el-sources': 'Sources',
        };
        const a2uiType = a2uiMap[tag] || toPascalCase(tag.replace(/^el-/, ''));
        const props = {};
        if (variant) props.variant = String(variant);
        if (size) props.size = String(size);
        if (disabled) props.disabled = true;
        if (label) props.label = { literalString: String(label) };
        return {
          format: 'a2ui',
          snippet: JSON.stringify(
            [
              { surfaceUpdate: { surfaceId: 'main', components: [{ id: 'root', component: { [a2uiType]: props } }] } },
              { beginRendering: { surfaceId: 'main', root: 'root' } },
            ],
            null,
            2
          ),
        };
      }
      return {
        format: 'html',
        snippet: htmlSnippet,
      };
    }
  
    if (name === 'scaffold_component') {
      const tag = typeof args.tag === 'string' ? args.tag.trim().toLowerCase() : '';
      if (!SAFE_TAG_RE.test(tag)) {
        return { error: `Invalid custom element tag name: '${tag}'. Expected lowercase kebab-case with hyphen.` };
      }
      const derivedName = toPascalCase(tag);
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
        const hasText = hasVisibleText(match);
        const hasAriaLabel = /aria-label=/i.test(tagOpen);
        if (!hasText && !hasAriaLabel) {
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
  
      // UI Craft & Anti-Slop Checks (deterministic)
      if (/transition\s*:\s*all\b/i.test(markup)) {
        warnings.push({
          criterion: 'UI Craft (Motion)',
          message: 'Avoid `transition: all`; list explicit properties (transform, opacity, background-color, border-color) to prevent layout jank.',
        });
      }

      if (/style=["'][^"']*(?:color|background(?:-color)?|border(?:-color)?)\s*:\s*#[0-9a-f]{3,8}\b/i.test(markup)) {
        warnings.push({
          criterion: 'UI Craft (Tokens & Dark Mode)',
          message: 'Inline style uses a hardcoded hex color. Use semantic `--el-*` tokens (e.g. `var(--el-surface-card)`, `var(--el-text-primary)`) so dark mode stays legible.',
        });
      }

      if (/<el-card\b[^>]*>(?:(?!<\/el-card>)[\s\S])*<el-card\b/i.test(markup)) {
        warnings.push({
          criterion: 'UI Craft (Visual Hierarchy)',
          message: 'Nested `<el-card>` inside `<el-card>` detected. Use whitespace, `<el-separator>`, or subtle surface contrast instead of card-in-card borders.',
        });
      }

      if (/:host-context\([^)]*\)\s*(?::host\(|\[)/i.test(markup)) {
        warnings.push({
          criterion: 'UI Craft (Shadow DOM CSS)',
          message: 'Invalid `:host-context(...):host(...)` or `:host-context(...)[attr]` selector detected; drive dark mode via `--el-*` custom properties instead.',
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
      const terms = query.split(/\s+/).filter(Boolean).slice(0, 20);
  
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
      const tagMatches = [...markup.matchAll(/<(el-[a-z0-9-]+)([^>]*)>/gi)];
      const presentTags = new Set(tagMatches.map((m) => m[1].toLowerCase()));
      const seenMissingParent = new Set();

      for (const match of tagMatches) {
        const tag = match[1].toLowerCase();
        const attrChunk = match[2] || '';
        checkedTags.push(tag);
        const decl = declByTag.get(tag);
        if (!decl) {
          issues.push({ severity: 'error', tag, message: `Unknown Elementum tag <${tag}> (not in custom-elements.json).` });
          continue;
        }

        const meta = getResolvedMetadata(decl);
        const requiredParent = meta.constraints?.requiredParent;
        if (requiredParent && !presentTags.has(requiredParent) && !seenMissingParent.has(tag)) {
          seenMissingParent.add(tag);
          issues.push({
            severity: 'warning',
            tag,
            requiredParent,
            message: `<${tag}> must be nested inside <${requiredParent}>.`,
          });
        }

        const observedSet = new Set([
          ...(meta.constraints?.observedAttributes || []),
          ...(decl.attributes || []).map((a) => a.name),
        ]);
        const allowed = new Set([
          ...observedSet,
          ...(meta.variants || []).map((v) => v.name),
          ...(meta.states || []).map((s) => s.name),
          ...(meta.props || []).filter((p) => p.htmlAttribute).map((p) => p.htmlAttribute),
        ]);
        const variantByName = new Map((meta.variants || []).map((v) => [v.name, v]));
        const jsOnlyMap = new Map((meta.constraints?.jsOnlyProperties || []).map((p) => [p.toLowerCase(), p]));

        for (const attrMatch of attrChunk.matchAll(/\s([a-zA-Z_:][a-zA-Z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
          const attr = attrMatch[1].toLowerCase();
          const hasValue = attrMatch[2] !== undefined || attrMatch[3] !== undefined || attrMatch[4] !== undefined;
          const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

          if (
            GLOBAL_HTML_ATTRS.has(attr) ||
            attr.startsWith('aria-') ||
            attr.startsWith('data-') ||
            attr.startsWith('on')
          ) {
            continue;
          }

          if (jsOnlyMap.has(attr)) {
            const realProp = jsOnlyMap.get(attr);
            if (!observedSet.has(realProp) && !observedSet.has(attr)) {
              issues.push({
                severity: 'warning',
                tag,
                attribute: attr,
                jsProperty: realProp,
                message: `Property "${realProp}" on <${tag}> is a JavaScript signal property (not an HTML attribute). Set el.${realProp}.value = ... or pass ${realProp}={...} via @wcomp/elementum/react.`,
              });
              continue;
            }
            if (hasValue) {
              const trimmed = attrVal.trim();
              let validJsonObjectOrArray = false;
              if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                try {
                  const parsed = JSON.parse(trimmed);
                  validJsonObjectOrArray = parsed !== null && typeof parsed === 'object';
                } catch {}
              }
              if (trimmed && !validJsonObjectOrArray) {
                issues.push({
                  severity: 'warning',
                  tag,
                  attribute: attr,
                  jsProperty: realProp,
                  message: `Attribute "${attr}" on <${tag}> expects valid JSON array/object syntax in HTML, or set el.${realProp}.value / @wcomp/elementum/react props instead of "${attrVal}".`,
                });
              }
            }
          }

          if (!allowed.has(attr)) {
            issues.push({
              severity: 'warning',
              tag,
              attribute: attr,
              message: `Attribute "${attr}" is not declared on <${tag}>. Allowed: ${[...allowed].join(', ') || '(none)'}.`,
            });
            continue;
          }

          const variantSpec = variantByName.get(attr);
          if (variantSpec && hasValue && !variantSpec.allowedValues.includes(attrVal)) {
            issues.push({
              severity: 'error',
              tag,
              attribute: attr,
              value: attrVal,
              allowedValues: variantSpec.allowedValues,
              message: `Invalid value "${attrVal}" for variant attribute "${attr}" on <${tag}>. Allowed values: ${variantSpec.allowedValues.join(', ')}.`,
            });
          }
        }
      }

      return {
        valid: issues.filter((i) => i.severity === 'error').length === 0,
        checkedCount: checkedTags.length,
        issues,
      };
    }
  
    if (name === 'validate_a2ui_messages') {
      const messages = Array.isArray(args.messages) ? args.messages : [];
      const defaultCatalogTypes = new Set([
        'Column', 'Row', 'List', 'Divider', 'Card', 'Text', 'Badge', 'Callout', 'Alert',
        'Progress', 'Meter', 'Avatar', 'CodeBlock', 'Button', 'TextField', 'TextArea',
        'Select', 'Switch', 'CheckBox', 'Slider', 'DatePicker', 'ChoiceChip', 'Tabs',
        'Dialog', 'PromptInput', 'ReasoningCard', 'ToolCall', 'StreamingText', 'Sources',
      ]);
      const allowedSet = Array.isArray(args.allowedTypes) && args.allowedTypes.length > 0
        ? new Set(args.allowedTypes.filter((t) => defaultCatalogTypes.has(t)))
        : defaultCatalogTypes;

      const issues = [];
      let componentCount = 0;

      for (let idx = 0; idx < messages.length; idx++) {
        const msg = messages[idx];
        if (!msg || typeof msg !== 'object') {
          issues.push({ severity: 'error', messageIndex: idx, message: 'Message must be a non-null JSON object.' });
          continue;
        }
        const knownKeys = ['dataModelUpdate', 'surfaceUpdate', 'beginRendering', 'createSurface', 'deleteSurface'];
        const hasKnown = knownKeys.some((k) => k in msg);
        if (!hasKnown) {
          issues.push({
            severity: 'error',
            messageIndex: idx,
            message: `Unknown A2UI message envelope. Expected one of: ${knownKeys.join(', ')}.`,
          });
          continue;
        }
        if (msg.surfaceUpdate && Array.isArray(msg.surfaceUpdate.components)) {
          for (const rawNode of msg.surfaceUpdate.components) {
            componentCount++;
            if (!rawNode || typeof rawNode.id !== 'string' || !rawNode.id.trim()) {
              issues.push({ severity: 'error', messageIndex: idx, message: 'Every A2UI component node requires a non-empty string "id".' });
              continue;
            }
            let typeName = typeof rawNode.type === 'string' ? rawNode.type : '';
            let props = rawNode.props && typeof rawNode.props === 'object' ? rawNode.props : {};
            if (!typeName && rawNode.component && typeof rawNode.component === 'object') {
              const keys = Object.keys(rawNode.component);
              typeName = keys[0] || '';
              props = (typeName && rawNode.component[typeName]) || {};
            }
            if (!allowedSet.has(typeName)) {
              issues.push({
                severity: 'error',
                messageIndex: idx,
                nodeId: rawNode.id,
                type: typeName,
                message: `Disallowed or unregistered A2UI component type "${typeName}" on node "${rawNode.id}". Allowed: ${[...allowedSet].join(', ')}.`,
              });
            }
            for (const [k, v] of Object.entries(props || {})) {
              if (FORBIDDEN_PROTO_KEYS.has(k)) {
                issues.push({
                  severity: 'error',
                  messageIndex: idx,
                  nodeId: rawNode.id,
                  attribute: k,
                  message: `Forbidden prototype key "${k}" in A2UI component props.`,
                });
                continue;
              }
              if (/^on/i.test(k)) {
                issues.push({
                  severity: 'error',
                  messageIndex: idx,
                  nodeId: rawNode.id,
                  attribute: k,
                  message: `Inline event handler attribute "${k}" is forbidden in A2UI surfaces.`,
                });
              }
              if ((k === 'href' || k === 'src') && typeof v === 'string' && !/^(https?:\/\/|\/|#)/i.test(v.trim())) {
                issues.push({
                  severity: 'error',
                  messageIndex: idx,
                  nodeId: rawNode.id,
                  attribute: k,
                  message: `Unsafe URL scheme in "${k}" on node "${rawNode.id}".`,
                });
              }
            }
          }
        }
      }

      return {
        valid: issues.filter((i) => i.severity === 'error').length === 0,
        messageCount: messages.length,
        componentCount,
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

    if (name === 'get_setup') {
      const fw = typeof args.framework === 'string' ? args.framework.trim().toLowerCase() : '';
      if (fw && !Object.hasOwn(SETUP_GUIDES, fw)) {
        return {
          error: `Unsupported framework '${fw}'. Expected one of: ${Object.keys(SETUP_GUIDES).join(', ')}.`,
        };
      }
      const shared = {
        package: pkg.name,
        version: pkg.version,
        zeroRuntimeDependencies: !pkg.dependencies || Object.keys(pkg.dependencies).length === 0,
        themeContract: {
          darkModeAttribute: 'data-theme="dark"',
          targetElement: '<html> / :root (document.documentElement.setAttribute("data-theme", "dark"))',
          tokensStylesheet: '@wcomp/elementum/tokens.css',
        },
        reducedMotionContract:
          'Honors @media (prefers-reduced-motion: reduce) across CSS animations/transitions and spring, FLIP, InView, and pointer behaviors.',
      };
      if (fw) {
        return { framework: fw, ...SETUP_GUIDES[fw], ...shared };
      }
      return { frameworks: SETUP_GUIDES, ...shared };
    }

    if (name === 'get_bundle_plan') {
      if (!Array.isArray(args.tags) || args.tags.length === 0) {
        return { error: 'tags must be a non-empty array of Elementum custom element tag names.' };
      }
      if (args.tags.length > 50) {
        return { error: 'tags cannot exceed 50 items.' };
      }
      const fw = typeof args.framework === 'string' && args.framework.trim()
        ? args.framework.trim().toLowerCase()
        : 'html';
      if (!['html', 'react', 'vue', 'svelte', 'angular'].includes(fw)) {
        return { error: `Unsupported framework '${fw}'. Expected html, react, vue, svelte, or angular.` };
      }

      const uniqueTags = [];
      const seen = new Set();
      const invalidTags = [];
      const unknownTags = [];
      for (const rawTag of args.tags) {
        const tag = typeof rawTag === 'string' ? rawTag.trim().toLowerCase() : '';
        if (!SAFE_TAG_RE.test(tag)) {
          invalidTags.push(String(rawTag));
          continue;
        }
        if (seen.has(tag)) continue;
        seen.add(tag);
        if (!declByTag.has(tag)) {
          unknownTags.push(tag);
          continue;
        }
        uniqueTags.push(tag);
      }

      if (invalidTags.length > 0 || unknownTags.length > 0) {
        const parts = [];
        if (invalidTags.length > 0) parts.push(`Invalid tag(s): ${invalidTags.join(', ')}`);
        if (unknownTags.length > 0) parts.push(`Unknown component tag(s): ${unknownTags.join(', ')}`);
        return { error: parts.join('; ') };
      }

      const sharedCoreKeys = [
        '@wcomp/elementum/signal',
        '@wcomp/elementum/template',
        '@wcomp/elementum/elementum',
      ];
      let sharedCoreBudgetBytes = 0;
      for (const k of sharedCoreKeys) {
        if (Object.hasOwn(sizeBudgets, k) && typeof sizeBudgets[k] === 'number') {
          sharedCoreBudgetBytes += sizeBudgets[k];
        }
      }

      let componentBudgetBytes = 0;
      const components = uniqueTags.map((tag) => {
        const subpath = `@wcomp/elementum/components/${tag}`;
        const budgetBytes =
          Object.hasOwn(sizeBudgets, subpath) && typeof sizeBudgets[subpath] === 'number'
            ? sizeBudgets[subpath]
            : null;
        if (budgetBytes !== null) componentBudgetBytes += budgetBytes;
        return {
          tag,
          pascalName: toPascalCase(tag),
          subpath,
          budgetGzipBytes: budgetBytes,
        };
      });

      const imports =
        fw === 'react'
          ? [
              "import '@wcomp/elementum/tokens.css';",
              `import { ${uniqueTags.map(toPascalCase).join(', ')} } from '@wcomp/elementum/react';`,
            ]
          : [
              "import '@wcomp/elementum/tokens.css';",
              ...uniqueTags.map((tag) => `import '@wcomp/elementum/components/${tag}.js';`),
            ];

      const totalEstimatedGzipBytes = sharedCoreBudgetBytes + componentBudgetBytes;
      return {
        framework: fw,
        tags: uniqueTags,
        componentCount: uniqueTags.length,
        imports,
        components,
        sharedCoreBudgetBytes,
        componentBudgetBytes,
        totalEstimatedGzipBytes,
        totalEstimatedGzipKb: Number((totalEstimatedGzipBytes / 1024).toFixed(2)),
      };
    }
  
    throw new Error(`Unknown tool: ${name}`);
  }

  const { readResource } = createResourceReaders({
    allDeclarations,
    declByTag,
    getResolvedMetadata,
    tokens,
    pkg,
    setupGuides: SETUP_GUIDES,
    toPascalCase,
    safeTagRe: SAFE_TAG_RE,
  });

  const { getPrompt, completeArgument } = createPromptHandlers({
    allDeclarations,
    declByTag,
    getResolvedMetadata,
    forbiddenProtoKeys: FORBIDDEN_PROTO_KEYS,
  });

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

    if (request.method === 'resources/list') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { resources: RESOURCES },
      };
    }

    if (request.method === 'resources/templates/list') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { resourceTemplates: RESOURCE_TEMPLATES },
      };
    }

    if (request.method === 'resources/read') {
      const params = request.params && typeof request.params === 'object' && !Array.isArray(request.params)
        ? request.params
        : {};
      const out = readResource(params.uri);
      return out.error
        ? { jsonrpc: '2.0', id: request.id, error: out.error }
        : { jsonrpc: '2.0', id: request.id, result: out.result };
    }

    if (request.method === 'prompts/list') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { prompts: PROMPTS },
      };
    }

    if (request.method === 'prompts/get') {
      const params = request.params && typeof request.params === 'object' && !Array.isArray(request.params)
        ? request.params
        : {};
      const out = getPrompt(params);
      return out.error
        ? { jsonrpc: '2.0', id: request.id, error: out.error }
        : { jsonrpc: '2.0', id: request.id, result: out.result };
    }

    if (request.method === 'completion/complete') {
      const params = request.params && typeof request.params === 'object' && !Array.isArray(request.params)
        ? request.params
        : {};
      const out = completeArgument(params);
      return out.error
        ? { jsonrpc: '2.0', id: request.id, error: out.error }
        : { jsonrpc: '2.0', id: request.id, result: out.result };
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
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
            completions: {},
          },
          serverInfo: {
            name: 'elementum-design-system-mcp',
            title: 'Elementum Design System MCP',
            version: pkg.version,
            websiteUrl: 'https://elementum-sage.vercel.app/',
            icons: [
              {
                src: 'https://elementum-sage.vercel.app/icon.png',
                mimeType: 'image/png',
                sizes: ['192x192'],
              },
            ],
          },
          instructions: [
            'Elementum Design System MCP (zero-dependency Web Components & W3C DTCG tokens). Recommended workflow:',
            '1. Call get_setup or read elementum://setup for zero-dep install commands, dark mode ([data-theme="dark"]), and prefers-reduced-motion setup.',
            '2. Call list_components (filter by category, formAssociated, or hasMotion) or read elementum://catalog to discover components.',
            '3. Inspect component APIs via get_component_doc (or elementum://components/<tag>) and tokens via list_tokens (or elementum://tokens).',
            '4. Plan tree-shaken imports & gzipped budgets with get_bundle_plan and generate markup via generate_snippet.',
            '5. Audit generated markup before shipping with lint_accessibility, validate_component_usage, or validate_a2ui_messages.',
          ].join('\n'),
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
      if (parsed.length > MAX_BATCH_SIZE) {
        return { jsonrpc: '2.0', id: null, error: { code: -32600, message: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} requests.` } };
      }
      const responses = parsed.map(handleSingleRequest).filter((r) => r !== null);
      return responses.length > 0 ? responses : null;
    }

    return handleSingleRequest(parsed);
  }

  return { TOOLS, RESOURCES, PROMPTS, handleToolCall, handleJsonRpcLine };
}
