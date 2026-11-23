#!/usr/bin/env node
/**
 * Auto-generates docs/styling-reference.md by scanning:
 *  - src/components/el-*.js for `part="..."` selectors and `var(--el-...)` tokens
 *  - custom-elements.json for component summaries
 *  - src/tokens.css for root design token defaults
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const componentsDir = path.join(rootDir, 'src', 'components');
const tokensPath = path.join(rootDir, 'src', 'tokens.css');
const outPath = path.join(rootDir, 'docs', 'styling-reference.md');

function parseRootTokens(cssText) {
  const tokens = [];
  const rootMatch = cssText.match(/:root[^{]*\{([^}]*)\}/);
  if (!rootMatch) return tokens;
  const re = /(--el-[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(rootMatch[1])) !== null) {
    tokens.push({ name: m[1].trim(), value: m[2].trim() });
  }
  return tokens;
}

function scanComponentFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const tag = path.basename(filePath, '.js');

  const parts = new Set();
  const partRe = /\bpart\s*=\s*["']([^"']+)["']/g;
  let m;
  while ((m = partRe.exec(source)) !== null) {
    for (const token of m[1].split(/\s+/)) {
      if (token && !token.includes('${')) parts.add(token);
    }
  }

  const tokens = new Set();
  const varRe = /var\(\s*(--el-[a-z0-9-]+)/gi;
  while ((m = varRe.exec(source)) !== null) {
    tokens.add(m[1]);
  }

  const supportsUnstyled = /\bunstyled\b/.test(source);

  return {
    tag,
    parts: [...parts].sort(),
    tokens: [...tokens].sort(),
    supportsUnstyled,
  };
}

const files = fs
  .readdirSync(componentsDir)
  .filter((f) => f.startsWith('el-') && f.endsWith('.js'))
  .sort();

const rows = files.map((f) => scanComponentFile(path.join(componentsDir, f)));
const rootTokens = parseRootTokens(fs.readFileSync(tokensPath, 'utf8'));

const totalParts = rows.reduce((acc, r) => acc + r.parts.length, 0);
const componentsWithParts = rows.filter((r) => r.parts.length > 0).length;

const lines = [
  '# Styling Reference: `::part()` Selectors & `--el-*` Design Tokens',
  '',
  '> Auto-generated from `src/components/el-*.js` and `src/tokens.css` via `npm run docs:styling`.',
  '> Use this cheat sheet to style Elementum components with Tailwind CSS (`[&::part(...)]:...`), custom CSS, or design-system overrides without reading component source files.',
  '',
  `- **Components scanned**: ${rows.length}`,
  `- **Components exposing \`::part()\`**: ${componentsWithParts} (${totalParts} part selectors total)`,
  `- **Global \`--el-*\` design tokens in \`src/tokens.css\`**: ${rootTokens.length}`,
  '',
  '## Quick Usage Recipes',
  '',
  '```css',
  '/* Override tokens globally or scoped to any container */',
  '.brand-surface {',
  '  --el-accent-primary: #7c3aed;',
  '  --el-radius-md: 12px;',
  '}',
  '',
  '/* Target internal Shadow DOM parts directly */',
  'el-button::part(button) {',
  '  text-transform: uppercase;',
  '  letter-spacing: 0.04em;',
  '}',
  '```',
  '',
  '```html',
  '<!-- Tailwind CSS v3/v4 arbitrary ::part() + token classes -->',
  '<el-card class="[&::part(card)]:rounded-2xl [--el-surface-border:#e2e8f0]">',
  '  <el-button variant="primary" class="[&::part(button)]:shadow-md">Deploy</el-button>',
  '</el-card>',
  '```',
  '',
  '---',
  '',
  '## Per-Component `::part()` & Token Matrix',
  '',
  '| Component | Exposed `::part(...)` Selectors | Consumed `--el-*` Tokens |',
  '| :--- | :--- | :--- |',
];

for (const r of rows) {
  const partStr = r.parts.length ? r.parts.map((p) => `\`${p}\``).join(', ') : '_(tokens / slots)_';
  const shownTokens = r.tokens.slice(0, 8).map((t) => `\`${t}\``).join(', ');
  const more = r.tokens.length > 8 ? ` _(+${r.tokens.length - 8} more)_` : '';
  const tokenStr = r.tokens.length ? `${shownTokens}${more}` : '_(inherits root tokens)_';
  lines.push(`| \`<${r.tag}>\` | ${partStr} | ${tokenStr} |`);
}

lines.push(
  '',
  '---',
  '',
  '## Global Root Tokens (`src/tokens.css`)',
  '',
  '| Token | Light Default |',
  '| :--- | :--- |'
);

for (const t of rootTokens) {
  lines.push(`| \`${t.name}\` | \`${t.value.replace(/\|/g, '\\|')}\` |`);
}

lines.push('');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Generated ${path.relative(rootDir, outPath)} (${rows.length} components, ${rootTokens.length} root tokens).`);
