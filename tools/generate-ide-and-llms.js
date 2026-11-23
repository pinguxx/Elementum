#!/usr/bin/env node
/**
 * Auto-generates:
 *   1. llms-full.txt — Complete single-file reference for AI agents (all 109 component schemas,
 *      exact API rules, A2UI catalog, and --el-* design tokens).
 *   2. vscode.html-custom-data.json — VS Code HTML Custom Data v1.1 for native HTML attribute
 *      and enum autocomplete across all 109 <el-*> custom elements.
 *   3. src/ide-types.d.ts — Vue 3 (GlobalComponents) & Svelte (svelteHTML.IntrinsicElements)
 *      type declarations for full IDE autocomplete across frameworks.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const cem = JSON.parse(fs.readFileSync(path.join(rootDir, 'custom-elements.json'), 'utf8'));
const llmsIndex = fs.readFileSync(path.join(rootDir, 'llms.txt'), 'utf8');
const agentRules = fs.readFileSync(path.join(rootDir, 'docs', 'agent-rules-snippet.md'), 'utf8');
const a2uiDocs = fs.readFileSync(path.join(rootDir, 'docs', 'a2ui.md'), 'utf8');
const stylingRef = fs.readFileSync(path.join(rootDir, 'docs', 'styling-reference.md'), 'utf8');

const declarations = [];
for (const mod of cem.modules || []) {
  for (const decl of mod.declarations || []) {
    if (decl.tagName) declarations.push(decl);
  }
}
declarations.sort((a, b) => a.tagName.localeCompare(b.tagName));

function parseUnionValues(typeText) {
  if (!typeText || !typeText.includes("'")) return [];
  const vals = [];
  const re = /'([^']+)'/g;
  let m;
  while ((m = re.exec(typeText)) !== null) {
    vals.push(m[1]);
  }
  return vals;
}

// 1. Build vscode.html-custom-data.json
const vscodeTags = declarations.map((d) => {
  const attributes = (d.attributes || []).map((attr) => {
    const unionVals = parseUnionValues(attr.type?.text || '');
    const entry = {
      name: attr.name,
      description: attr.description || `${attr.name} attribute on <${d.tagName}>`,
    };
    if (attr.type?.text === 'boolean') {
      entry.valueSet = 'v';
    } else if (unionVals.length > 0) {
      entry.values = unionVals.map((v) => ({ name: v }));
    }
    return entry;
  });

  return {
    name: d.tagName,
    description: d.description || `<${d.tagName}> Elementum Web Component`,
    attributes,
    references: [
      {
        name: 'Elementum Component Catalog',
        url: `https://elementum-sage.vercel.app/examples/index.html#${d.tagName}`,
      },
    ],
  };
});

const vscodeCustomData = {
  version: 1.1,
  tags: vscodeTags,
};
const vscodeOutPath = path.join(rootDir, 'vscode.html-custom-data.json');
fs.writeFileSync(vscodeOutPath, JSON.stringify(vscodeCustomData, null, 2) + '\n', 'utf8');

// 2. Build src/ide-types.d.ts for Vue 3 (Volar) & Svelte
const ideLines = [
  '/**',
  ' * Auto-generated Vue 3 (Volar GlobalComponents) and Svelte (svelteHTML.IntrinsicElements)',
  ' * IDE type definitions for @wcomp/elementum.',
  ' */',
  "import './index.d.ts';",
  '',
  'declare module "vue" {',
  '  export interface GlobalComponents {',
];
for (const d of declarations) {
  ideLines.push(`    '${d.tagName}': HTMLElementTagNameMap['${d.tagName}'] & Record<string, any>;`);
}
ideLines.push(
  '  }',
  '}',
  '',
  'declare namespace svelteHTML {',
  '  interface IntrinsicElements {'
);
for (const d of declarations) {
  ideLines.push(`    '${d.tagName}': Partial<HTMLElementTagNameMap['${d.tagName}']> & Record<string, any>;`);
}
ideLines.push('  }', '}', '');
fs.writeFileSync(path.join(rootDir, 'src', 'ide-types.d.ts'), ideLines.join('\n'), 'utf8');

// 3. Build llms-full.txt
const fullLines = [
  llmsIndex.trim(),
  '',
  '---',
  '',
  '# Complete 109-Component Schema Contract (`custom-elements.json`)',
  '',
  '| Tag | Class | Attributes | Events | Slots | Summary |',
  '| :--- | :--- | :--- | :--- | :--- | :--- |',
];

for (const d of declarations) {
  const attrs = (d.attributes || [])
    .map((a) => (a.type?.text ? `${a.name}: ${a.type.text}` : a.name))
    .join(', ') || '—';
  const events = (d.events || []).map((e) => e.name).join(', ') || '—';
  const slots = (d.slots || []).map((s) => s.name || '(default)').join(', ') || '—';
  const desc = (d.description || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  fullLines.push(`| \`<${d.tagName}>\` | \`${d.name || ''}\` | ${attrs.replace(/\|/g, '\\|')} | ${events} | ${slots} | ${desc} |`);
}

fullLines.push(
  '',
  '---',
  '',
  agentRules.trim(),
  '',
  '---',
  '',
  a2uiDocs.trim(),
  '',
  '---',
  '',
  stylingRef.trim(),
  ''
);

const llmsFullPath = path.join(rootDir, 'llms-full.txt');
fs.writeFileSync(llmsFullPath, fullLines.join('\n'), 'utf8');

console.log(
  `Generated llms-full.txt (${declarations.length} components), vscode.html-custom-data.json, and src/ide-types.d.ts.`
);
