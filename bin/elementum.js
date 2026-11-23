#!/usr/bin/env node
/**
 * Zero-dependency Elementum setup CLI (`npx @wcomp/elementum init`).
 *
 * Detects the host project (Next.js, React, Vue, Svelte, Vite, Vanilla),
 * writes MCP configuration (.mcp.json & .cursor/mcp.json), drops in
 * elementum.rules.md for AI coding agents, and optionally creates a starter
 * elementum-tokens.css override file.
 */
import fs from 'node:fs';
import path from 'node:path';

export const REMOTE_MCP_URL = 'https://elementum-sage.vercel.app/mcp';

export function detectFramework(projectDir) {
  const pkgPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return 'vanilla';
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.next) return 'next';
    if (deps.svelte || deps['@sveltejs/kit']) return 'svelte';
    if (deps.vue || deps.nuxt) return 'vue';
    if (deps.react) return 'react';
    if (deps.vite) return 'vite';
  } catch {
    return 'vanilla';
  }
  return 'vanilla';
}

export function buildMcpConfig() {
  return {
    mcpServers: {
      elementum: {
        url: REMOTE_MCP_URL,
      },
    },
  };
}

export function buildAgentRulesSnippet(framework) {
  const importHint =
    framework === 'react' || framework === 'next'
      ? `import '@wcomp/elementum/tokens.css';\nimport { ElButton, ElInput, ElDialog } from '@wcomp/elementum/react';`
      : `import '@wcomp/elementum/tokens.css';\nimport '@wcomp/elementum';`;

  return `# Elementum UI Engineering Rules (${framework})

1. **Always verify component APIs via Elementum MCP** (\`${REMOTE_MCP_URL}\`) before writing markup:
   - Call \`get_component_schema\` to verify exact tag names, attributes, events, and slots.
   - Call \`validate_component_usage\` and \`lint_accessibility\` on generated HTML before finishing.
2. **Import tokens & components**:
   \`\`\`js
   ${importHint}
   \`\`\`
3. **Key API conventions**:
   - \`<el-dialog>\`: open/close via \`dialog.showModal()\` and \`dialog.close()\` (do not assign \`dialog.open = true\`).
   - \`<el-input>\` / \`<el-textarea>\`: read \`e.detail?.value ?? e.target.value\` on \`input\` / \`change\`.
   - \`<el-table>\`: assign \`.columns\` and \`.data\` as JS properties (arrays).
   - Styling: override \`--el-*\` design tokens or target \`::part(...)\` selectors (see \`docs/styling-reference.md\`).
4. **A2UI streaming**: use \`createA2UiSurface\` from \`@wcomp/elementum/a2ui\` for declarative agent-generated UIs.
`;
}

export function buildStarterTokensCss() {
  return `/* Elementum custom theme overrides (import after @wcomp/elementum/tokens.css) */
:root {
  --el-accent-primary: #2563eb;
  --el-radius-md: 10px;
}

:root[data-theme="dark"] {
  --el-accent-primary: #60a5fa;
}
`;
}

function mergeJsonFile(filePath, patch, dryRun) {
  let existing = {};
  if (fs.existsSync(filePath)) {
    try {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      existing = {};
    }
  }
  const merged = {
    ...existing,
    mcpServers: {
      ...(existing.mcpServers || {}),
      ...patch.mcpServers,
    },
  };
  if (!dryRun) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  }
  return merged;
}

export function runInit(argv = process.argv.slice(2), cwd = process.cwd()) {
  const args = new Set(argv);
  const dryRun = args.has('--dry-run');
  const mcpOnly = args.has('--mcp-only');
  const dirArg = argv.find((a) => a.startsWith('--dir='));
  const targetDir = dirArg ? path.resolve(cwd, dirArg.slice('--dir='.length)) : cwd;

  const framework = detectFramework(targetDir);
  const written = [];

  const mcpPatch = buildMcpConfig();
  const rootMcp = path.join(targetDir, '.mcp.json');
  mergeJsonFile(rootMcp, mcpPatch, dryRun);
  written.push('.mcp.json');

  const cursorMcp = path.join(targetDir, '.cursor', 'mcp.json');
  mergeJsonFile(cursorMcp, mcpPatch, dryRun);
  written.push('.cursor/mcp.json');

  if (!mcpOnly) {
    const rulesPath = path.join(targetDir, 'elementum.rules.md');
    if (!dryRun) {
      fs.writeFileSync(rulesPath, buildAgentRulesSnippet(framework), 'utf8');
    }
    written.push('elementum.rules.md');

    const tokensFile = path.join(targetDir, 'elementum-tokens.css');
    if (!fs.existsSync(tokensFile)) {
      if (!dryRun) {
        fs.writeFileSync(tokensFile, buildStarterTokensCss(), 'utf8');
      }
      written.push('elementum-tokens.css');
    }
  }

  return { framework, targetDir, dryRun, written };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: npx @wcomp/elementum init [--dir=<path>] [--mcp-only] [--dry-run]`);
    process.exit(0);
  }
  const cmd = args[0] === 'init' ? args.slice(1) : args;
  const result = runInit(cmd);
  const prefix = result.dryRun ? '[dry-run] Would write' : 'Initialized Elementum';
  console.log(`${prefix} (detected: ${result.framework}) in ${result.targetDir}:`);
  for (const f of result.written) {
    console.log(`  - ${f}`);
  }
}
