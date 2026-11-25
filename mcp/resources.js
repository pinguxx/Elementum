/**
 * Pure-JS MCP resources and Markdown builders (Node stdio & Vercel Edge compatible).
 */

export const RESOURCES = [
  {
    uri: 'elementum://catalog',
    name: 'Elementum Component Catalog',
    description: 'Complete Markdown index of registered Elementum Web Components grouped by category.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'elementum://setup',
    name: 'Elementum Setup & Theme Guide',
    description: 'Installation commands, tree-shaken framework imports, dark-mode theme setup, and reduced-motion contract.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'elementum://tokens',
    name: 'Elementum Design Tokens (W3C DTCG)',
    description: 'Semantic design tokens for colors, spacing, radii, typography, elevation, and motion.',
    mimeType: 'text/markdown',
  },
];

export const RESOURCE_TEMPLATES = [
  {
    uriTemplate: 'elementum://components/{tag}',
    name: 'Elementum Component Reference',
    description: 'Schema, variants, attributes, events, slots, constraints, and examples for a specific <el-*> tag.',
    mimeType: 'text/markdown',
  },
];

function collectTokenRows(node, prefix, rows, limit = 200) {
  if (!node || typeof node !== 'object' || rows.length >= limit) return;
  if (Object.hasOwn(node, '$value') || Object.hasOwn(node, 'value')) {
    const val = Object.hasOwn(node, '$value') ? node.$value : node.value;
    const type = node.$type || node.type || '';
    rows.push({
      name: prefix,
      type: String(type),
      value: typeof val === 'object' ? JSON.stringify(val) : String(val),
    });
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || rows.length >= limit) continue;
    collectTokenRows(v, prefix ? `${prefix}.${k}` : k, rows, limit);
  }
}

export function createResourceReaders({
  allDeclarations,
  declByTag,
  getResolvedMetadata,
  tokens,
  pkg,
  setupGuides,
  toPascalCase,
  safeTagRe,
}) {
  function buildCatalogMarkdown() {
    const byCategory = new Map();
    for (const d of allDeclarations) {
      const meta = getResolvedMetadata(d);
      const cat = String(meta.category || 'general');
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push({ decl: d, meta });
    }
    const lines = [
      `# Elementum Component Catalog (v${pkg.version})`,
      '',
      `Total components: **${allDeclarations.length}** | Zero runtime dependencies | WCAG 2.2 AA`,
      '',
    ];
    for (const cat of [...byCategory.keys()].sort()) {
      lines.push(`## ${cat} (${byCategory.get(cat).length})`, '');
      for (const { decl, meta } of byCategory.get(cat)) {
        const flags = [];
        if (meta.hasMotion) flags.push('motion');
        if (meta.constraints?.formAssociated) flags.push('FACE');
        const suffix = flags.length ? ` _[${flags.join(', ')}]_` : '';
        lines.push(`- \`<${decl.tagName}>\` — ${decl.description || ''}${suffix}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  function buildSetupMarkdown() {
    const lines = [
      `# Elementum Setup & Integration Guide (${pkg.name} v${pkg.version})`,
      '',
      'Zero runtime dependencies. Works with plain HTML, React 18/19, Next.js SSR (DSD), Vue 3, and Svelte.',
      '',
    ];
    for (const [fw, guide] of Object.entries(setupGuides)) {
      lines.push(`## ${fw}`, '', `Install: \`${guide.install}\``, '', '```js', ...guide.imports, '```', '');
    }
    lines.push(
      '## Dark Mode & Reduced Motion',
      '',
      '- Dark theme activates via `[data-theme="dark"]` on `<html>` / `:root` after loading `@wcomp/elementum/tokens.css`.',
      '- All CSS animations and JS motion behaviors (`createSpringEasing`, `createFlipBehavior`, `createInViewBehavior`, `createPointerTracker`) honor `@media (prefers-reduced-motion: reduce)`.',
      '',
    );
    return lines.join('\n');
  }

  function buildTokensMarkdown() {
    const lines = [`# Elementum Design Tokens (${pkg.name} v${pkg.version})`, ''];
    for (const [category, group] of Object.entries(tokens || {})) {
      if (category.startsWith('$')) continue;
      const rows = [];
      collectTokenRows(group, category, rows, 80);
      lines.push(`## ${category} (${rows.length})`, '');
      for (const row of rows) {
        lines.push(`- \`${row.name}\`${row.type ? ` (${row.type})` : ''}: \`${row.value}\``);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  function buildComponentMarkdown(decl) {
    const meta = getResolvedMetadata(decl);
    const lines = [
      `# \`<${decl.tagName}>\` (${decl.name || toPascalCase(decl.tagName)})`,
      '',
      decl.description || '',
      '',
      `- **Category:** ${meta.category || 'general'}`,
      `- **Motion:** ${Boolean(meta.hasMotion)}`,
      `- **Form-associated (FACE):** ${Boolean(meta.constraints?.formAssociated)}`,
      `- **Import:** \`import '@wcomp/elementum/components/${decl.tagName}.js';\``,
      '',
    ];
    const attrs = Array.isArray(decl.attributes) ? decl.attributes : [];
    if (attrs.length > 0) {
      lines.push('## Attributes', '');
      for (const attr of attrs) {
        lines.push(`- \`${attr.name}\` (${attr.type?.text || 'string'}): ${attr.description || ''}`);
      }
      lines.push('');
    }
    if (Array.isArray(meta.variants) && meta.variants.length > 0) {
      lines.push('## Variants', '');
      for (const v of meta.variants) {
        lines.push(`- \`${v.name || v.attribute}\`: ${(v.allowedValues || []).join(', ')}`);
      }
      lines.push('');
    }
    const events = Array.isArray(decl.events) ? decl.events : [];
    if (events.length > 0) {
      lines.push('## Events', '');
      for (const ev of events) {
        lines.push(`- \`${ev.name}\`: ${ev.description || ''}`);
      }
      lines.push('');
    }
    const slots = Array.isArray(decl.slots) ? decl.slots : [];
    if (slots.length > 0) {
      lines.push('## Slots', '');
      for (const slot of slots) {
        lines.push(`- \`${slot.name || '(default)'}\`: ${slot.description || ''}`);
      }
      lines.push('');
    }
    if (Array.isArray(meta.examples) && meta.examples.length > 0) {
      lines.push('## Examples', '');
      for (const ex of meta.examples) {
        lines.push(`### ${ex.title || 'Example'}`, '', '```html', ex.code || '', '```', '');
      }
    }
    return lines.join('\n');
  }

  function readResource(rawUri) {
    const uri = typeof rawUri === 'string' ? rawUri.trim() : '';
    if (!uri) {
      return { error: { code: -32602, message: 'Invalid params: uri is required.' } };
    }
    if (uri === 'elementum://catalog') {
      return { result: { contents: [{ uri, mimeType: 'text/markdown', text: buildCatalogMarkdown() }] } };
    }
    if (uri === 'elementum://setup') {
      return { result: { contents: [{ uri, mimeType: 'text/markdown', text: buildSetupMarkdown() }] } };
    }
    if (uri === 'elementum://tokens') {
      return { result: { contents: [{ uri, mimeType: 'text/markdown', text: buildTokensMarkdown() }] } };
    }
    if (uri.startsWith('elementum://components/')) {
      const tag = uri.slice('elementum://components/'.length).trim().toLowerCase();
      const decl = safeTagRe.test(tag) ? declByTag.get(tag) : null;
      if (!decl) {
        return { error: { code: -32602, message: `Unknown component resource URI: ${uri}` } };
      }
      return { result: { contents: [{ uri, mimeType: 'text/markdown', text: buildComponentMarkdown(decl) }] } };
    }
    return { error: { code: -32602, message: `Unknown resource URI: ${uri}` } };
  }

  return { readResource };
}
