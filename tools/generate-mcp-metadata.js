#!/usr/bin/env node
/**
 * Generates mcp/component-metadata.json from custom-elements.json,
 * examples/catalog-data.js, live registered Elementum classes, and
 * component sources (static formAssociated & complex signal properties).
 *
 * Separates closed visual/mode `variants`, boolean `states`, general `props`,
 * composition/JS-property `constraints`, and standalone `examples` so MCP coding
 * agents do not confuse example values with constrained API contracts.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REQUIRED_PARENTS } from './audit-catalog-diff.js';
import { components as CATALOG } from '../examples/catalog-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const EXPECTED_CHILDREN = {};
for (const [child, parent] of Object.entries(REQUIRED_PARENTS)) {
  if (!EXPECTED_CHILDREN[parent]) EXPECTED_CHILDREN[parent] = [];
  EXPECTED_CHILDREN[parent].push(child);
}
// Common optional parent/child groupings
const OPTIONAL_GROUP_CHILDREN = {
  'el-avatar-group': ['el-avatar'],
  'el-form': ['el-fieldset'],
  'el-radio-group': ['el-radio'],
  'el-router': ['el-route'],
  'el-toggle-group': ['el-toggle'],
};
for (const [parent, children] of Object.entries(OPTIONAL_GROUP_CHILDREN)) {
  if (!EXPECTED_CHILDREN[parent]) EXPECTED_CHILDREN[parent] = [];
  for (const child of children) {
    if (!EXPECTED_CHILDREN[parent].includes(child)) {
      EXPECTED_CHILDREN[parent].push(child);
    }
  }
}

function toCamelCase(attr) {
  return attr.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
}

function parseUnionLiterals(typeText) {
  if (typeof typeText !== 'string' || !typeText.includes('|')) return [];
  const parts = typeText.split('|').map((s) => s.trim());
  const literals = [];
  for (const part of parts) {
    const m = /^['"]([^'"]+)['"]$/.exec(part);
    if (!m) return [];
    literals.push(m[1]);
  }
  return literals;
}

function cleanDefault(val) {
  if (typeof val !== 'string') return val;
  if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
    return val.slice(1, -1);
  }
  if (val === 'true') return true;
  if (val === 'false') return false;
  return val;
}

function extractClassSlice(source, className) {
  const marker = `class ${className}`;
  const start = source.indexOf(marker);
  if (start === -1) return source;
  const nextExport = source.indexOf('\nexport class ', start + marker.length);
  return source.slice(start, nextExport > start ? nextExport : undefined);
}

function detectComplexSignalProps(classSlice) {
  const found = new Set();
  for (const m of classSlice.matchAll(/Object\.defineProperty\(\s*this\s*,\s*['"]([a-zA-Z0-9_]+)['"]/g)) {
    found.add(m[1]);
  }
  for (const m of classSlice.matchAll(/^\s{2}([a-zA-Z0-9_]+)\s*=\s*signal\(\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*\)/gm)) {
    if (!m[1].startsWith('_')) {
      found.add(m[1]);
    }
  }
  return [...found];
}

export function buildMcpMetadata() {
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'custom-elements.json'), 'utf8'));
  const metadata = {};

  for (const mod of manifest.modules || []) {
    const modPath = path.join(rootDir, mod.path);
    const source = fs.existsSync(modPath) ? fs.readFileSync(modPath, 'utf8') : '';

    for (const decl of mod.declarations || []) {
      const tag = decl.tagName;
      if (!tag) continue;

      const cat = CATALOG[tag] || {};
      const liveTag = tag === 'el-toast' ? 'el-toaster' : tag;
      const Ctor = typeof customElements !== 'undefined' ? customElements.get(liveTag) : undefined;
      const classSlice = extractClassSlice(source, decl.name);

      const observedSet = new Set(
        Array.isArray(Ctor?.observedAttributes) && tag !== 'el-toast'
          ? Ctor.observedAttributes
          : (decl.attributes || []).map((a) => a.name)
      );
      const formAssociated = Boolean(Ctor?.formAssociated || cat.formAssociated || /static\s+formAssociated\s*=\s*true/.test(classSlice));
      const complexProps = detectComplexSignalProps(classSlice);

      const NON_VARIANT_ATTRS = new Set(['value', 'language']);

      // Unify CEM attributes + catalog props + observedAttributes
      const unifiedAttrs = new Map();
      for (const attr of decl.attributes || []) {
        const union = NON_VARIANT_ATTRS.has(attr.name) ? [] : parseUnionLiterals(attr.type?.text);
        unifiedAttrs.set(attr.name, {
          name: attr.name,
          type: attr.type?.text || 'string',
          options: union.length > 0 ? union : null,
          default: attr.default !== undefined ? cleanDefault(attr.default) : undefined,
          description: attr.description || '',
        });
      }

      for (const prop of cat.props || []) {
        const existing = unifiedAttrs.get(prop.name);
        const options = Array.isArray(prop.options) && prop.options.length > 0 ? prop.options : existing?.options || null;
        const treatAsEnum = options && !NON_VARIANT_ATTRS.has(prop.name);
        unifiedAttrs.set(prop.name, {
          name: prop.name,
          type: treatAsEnum ? 'enum' : (prop.type === 'boolean' ? 'boolean' : existing?.type || (prop.type === 'select' ? 'string' : prop.type) || 'string'),
          options: treatAsEnum ? options : null,
          default: prop.default !== undefined ? prop.default : existing?.default,
          description: prop.description || existing?.description || '',
        });
      }

      for (const attrName of observedSet) {
        if (!unifiedAttrs.has(attrName)) {
          unifiedAttrs.set(attrName, {
            name: attrName,
            type: complexProps.includes(attrName) ? 'array | json-string' : 'string',
            options: null,
            default: undefined,
            description: `Observed HTML attribute "${attrName}".`,
          });
        }
      }

      const variants = [];
      const states = [];
      const props = [];

      for (const item of unifiedAttrs.values()) {
        const unionFromCem = NON_VARIANT_ATTRS.has(item.name) ? [] : parseUnionLiterals(item.type);
        const isClosedVariant =
          unionFromCem.length > 0 ||
          (Array.isArray(item.options) && item.options.length > 0);

        if (isClosedVariant) {
          variants.push({
            name: item.name,
            allowedValues: item.options || unionFromCem,
            default: item.default !== undefined ? item.default : (item.options || unionFromCem)[0],
            description: item.description || `Allowed values for "${item.name}".`,
          });
        } else if (item.type === 'boolean') {
          states.push({
            name: item.name,
            type: 'boolean',
            default: Boolean(item.default === true || item.default === 'true'),
            description: item.description || `Boolean state attribute "${item.name}".`,
          });
        } else {
          const isComplex = complexProps.includes(item.name) || complexProps.includes(toCamelCase(item.name));
          props.push({
            name: item.name,
            type: isComplex ? 'array | json-string' : item.type,
            ...(item.default !== undefined ? { default: item.default } : {}),
            htmlAttribute: observedSet.has(item.name) ? item.name : null,
            jsProperty: toCamelCase(item.name),
            description: item.description || '',
          });
        }
      }

      // Add complex signal properties not represented as HTML attributes (e.g., selected, suggestions, selectedItems)
      for (const jsProp of complexProps) {
        if (!unifiedAttrs.has(jsProp)) {
          props.push({
            name: jsProp,
            type: 'array | signal',
            htmlAttribute: null,
            jsProperty: jsProp,
            description: `Reactive signal array/object property (.${jsProp}.value) configured via JavaScript or @wcomp/elementum/react props.`,
          });
        }
      }

      const requiredParent = REQUIRED_PARENTS[tag] || null;
      const expectedChildren = EXPECTED_CHILDREN[tag] || [];
      const jsOnlyProperties = [...new Set(complexProps)];
      const observedAttributes = [...observedSet];

      const a11yNotes = [];
      if (formAssociated) {
        a11yNotes.push('Form-Associated Custom Element (ElementInternals): participates natively in <form> submission, validation, and reset.');
      }
      if (requiredParent) {
        a11yNotes.push(`Composition constraint: <${tag}> must be nested inside <${requiredParent}>.`);
      }
      if (expectedChildren.length > 0) {
        a11yNotes.push(`Container component: pairs with ${expectedChildren.map((c) => `<${c}>`).join(', ')}.`);
      }
      if (jsOnlyProperties.length > 0) {
        a11yNotes.push(
          `Complex signal properties (${jsOnlyProperties.join(', ')}): pass arrays/objects via el.<prop>.value, @wcomp/elementum/react JSX props, or valid JSON strings where supported in observedAttributes.`
        );
      }

      const examples = Array.isArray(cat.examples)
        ? cat.examples.map((ex) => ({
            title: ex.title || 'Example',
            code: ex.code || '',
          }))
        : [];

      metadata[tag] = {
        variants,
        states,
        props,
        constraints: {
          formAssociated,
          requiredParent,
          expectedChildren,
          observedAttributes,
          jsOnlyProperties,
          strictVariantValues: variants.length > 0,
          a11yNotes,
        },
        examples,
      };
    }
  }

  return metadata;
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());

if (isDirectRun) {
  const metadata = buildMcpMetadata();
  const outPath = path.join(rootDir, 'mcp', 'component-metadata.json');
  fs.writeFileSync(outPath, `${JSON.stringify(metadata)}\n`, 'utf8');
  console.log(`Generated ${outPath} (${Object.keys(metadata).length} components).`);
}
