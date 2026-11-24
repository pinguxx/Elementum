#!/usr/bin/env node
/**
 * Zero-dependency Elementum CLI (`npx @wcomp/elementum init` / `check` / `mcp`).
 *
 * Detects the host project (Next.js, React, Vue, Svelte, Vite, Vanilla),
 * writes MCP configuration (.mcp.json & .cursor/mcp.json), drops in
 * elementum.rules.md for AI coding agents, and optionally creates starter files.
 * When invoked with no arguments on piped stdio (e.g. `npx -y @wcomp/elementum`)
 * or via `mcp`, starts the read-only JSON-RPC stdio MCP server with zero disk writes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
   - Call \`get_component_doc\` to verify exact tag names, attributes, events, and slots.
   - Call \`validate_component_usage\` and \`lint_accessibility\` on generated HTML before finishing.
2. **Import tokens & components**:
   \`\`\`js
   ${importHint}
   \`\`\`
3. **Key API conventions**:
   - \`<el-dialog>\`: open/close via \`dialog.showModal()\` / \`dialog.close()\` or \`dialog.open = true / false\`.
   - \`<el-input>\` / \`<el-textarea>\`: read \`e.detail?.value ?? e.target.value\` on \`input\` / \`change\`.
   - \`<el-table>\`: assign \`.columns\` and \`.data\` as JS properties (arrays).
   - Styling: override \`--el-*\` design tokens or target \`::part(...)\` selectors (see \`docs/styling-reference.md\`).
4. **A2UI streaming**: use \`createA2UiSurface\` from \`@wcomp/elementum/a2ui\` for declarative agent-generated UIs.
`;
}

export function buildStarterTokensCss() {
  return `/* Elementum custom theme overrides (import after @wcomp/elementum/tokens.css) */
:root {
  --el-color-primary: #2563eb;
  --el-radius-md: 10px;
}

[data-theme="dark"],
:root[data-theme="dark"] {
  --el-color-primary: #3b82f6;
}
`;
}

export function buildStarterIndexHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Elementum Starter App</title>
  <link rel="stylesheet" href="https://unpkg.com/@wcomp/elementum/tokens.css" />
  <link rel="stylesheet" href="./elementum-tokens.css" />
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      font-family: var(--el-font-sans, system-ui, sans-serif);
      background: var(--el-step-1, var(--el-surface-base, #f8fafc));
      color: var(--el-text-primary, #0f172a);
    }
    main {
      max-width: 960px;
      margin: 32px auto;
      padding: 0 20px;
      display: grid;
      gap: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
  </style>
</head>
<body>
  <el-navbar sticky brand="⚡ Elementum App" badge="Ready" badge-variant="success">
    <a href="#" active>Overview</a>
    <a href="https://elementum-sage.vercel.app/examples/index.html" target="_blank" rel="noopener">Catalog (113)</a>
    <div slot="actions" style="display:flex;align-items:center;gap:10px;">
      <el-theme-switch></el-theme-switch>
      <el-button id="open-modal" variant="primary" size="sm">New Item</el-button>
    </div>
  </el-navbar>

  <main>
    <el-card bordered>
      <h2 slot="header" style="margin:0;font-size:1.15rem;">Welcome to @wcomp/elementum</h2>
      <p style="margin:0 0 14px;color:var(--el-text-secondary);">
        Your project is configured with 113 zero-dependency Web Components, W3C design tokens, and the Elementum MCP server (<code>.mcp.json</code>).
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <el-input id="quick-input" placeholder="Type a message..." aria-label="Quick message" style="flex:1;min-width:220px;"></el-input>
        <el-button id="toast-btn" variant="secondary">Trigger Toast</el-button>
      </div>
    </el-card>

    <div class="grid">
      <el-card bordered>
        <div style="font-size:0.8rem;color:var(--el-text-secondary);">COMPONENTS READY</div>
        <div style="font-size:1.8rem;font-weight:700;margin:6px 0;">113</div>
        <el-badge variant="success">WCAG 2.2 AA Verified</el-badge>
      </el-card>
      <el-card bordered>
        <div style="font-size:0.8rem;color:var(--el-text-secondary);">RUNTIME DEPENDENCIES</div>
        <div style="font-size:1.8rem;font-weight:700;margin:6px 0;">0</div>
        <el-progress value="100" max="100" aria-label="Setup completion"></el-progress>
      </el-card>
    </div>
  </main>

  <el-dialog id="demo-dialog" title="Create New Item">
    <div style="display:grid;gap:12px;min-width:280px;">
      <el-input id="item-name" aria-label="Item Name" placeholder="e.g. Production API Key" required></el-input>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
        <el-button id="close-modal" variant="secondary">Cancel</el-button>
        <el-button id="save-modal" variant="primary">Create</el-button>
      </div>
    </div>
  </el-dialog>

  <el-toaster id="toaster"></el-toaster>

  <script type="module">
    import { toast } from 'https://unpkg.com/@wcomp/elementum';

    const dialog = document.getElementById('demo-dialog');
    const quickInput = document.getElementById('quick-input');
    const itemNameInput = document.getElementById('item-name');

    const readInput = (el, fallback) => {
      const raw = typeof el?.value === 'object' && el.value !== null && 'value' in el.value
        ? el.value.value
        : (el?.getAttribute('value') || '');
      return String(raw || '').trim() || fallback;
    };

    document.getElementById('open-modal').addEventListener('click', () => dialog.showModal());
    document.getElementById('close-modal').addEventListener('click', () => dialog.close());
    document.getElementById('save-modal').addEventListener('click', () => {
      const name = readInput(itemNameInput, 'New item');
      dialog.close();
      toast.success('Item Created', { description: \`Saved "\${name}" successfully.\` });
    });
    document.getElementById('toast-btn').addEventListener('click', () => {
      const msg = readInput(quickInput, 'Hello from Elementum!');
      toast.info('Notification', { description: msg });
    });
  </script>
</body>
</html>
`;
}

export function buildFrameworkExample(framework) {
  if (framework === 'react' || framework === 'next') {
    return {
      filename: 'ElementumDemo.tsx',
      code: `import '@wcomp/elementum/tokens.css';
import { ElCard, ElButton, ElInput, ElBadge, ElThemeSwitch, ElToaster } from '@wcomp/elementum/react';
import { toast } from '@wcomp/elementum';

export function ElementumDemo() {
  return (
    <div style={{ maxWidth: 640, margin: '32px auto', display: 'grid', gap: 16 }}>
      <ElCard bordered>
        <div slot="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>⚡ Elementum Ready</strong>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ElBadge variant="success">WCAG 2.2 AA</ElBadge>
            <ElThemeSwitch />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ElInput placeholder="Type a notification..." aria-label="Notification text" />
          <ElButton variant="primary" onClick={() => toast.success('Elementum is live!')}>
            Trigger Toast
          </ElButton>
        </div>
      </ElCard>
      <ElToaster />
    </div>
  );
}
`,
    };
  }
  if (framework === 'vue') {
    return {
      filename: 'ElementumDemo.vue',
      code: `<script setup>
import '@wcomp/elementum/tokens.css';
import { toast } from '@wcomp/elementum';

function notify() {
  toast.success('Elementum is live in Vue 3!');
}
</script>

<template>
  <div style="max-width: 640px; margin: 32px auto; display: grid; gap: 16px;">
    <el-card bordered>
      <div slot="header" style="display: flex; justify-content: space-between; align-items: center;">
        <strong>⚡ Elementum Ready</strong>
        <el-theme-switch></el-theme-switch>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <el-input placeholder="Type a notification..." aria-label="Notification text"></el-input>
        <el-button variant="primary" @click="notify">Trigger Toast</el-button>
      </div>
    </el-card>
    <el-toaster></el-toaster>
  </div>
</template>
`,
    };
  }
  if (framework === 'svelte') {
    return {
      filename: 'ElementumDemo.svelte',
      code: `<script>
  import '@wcomp/elementum/tokens.css';
  import { toast } from '@wcomp/elementum';
</script>

<div style="max-width: 640px; margin: 32px auto; display: grid; gap: 16px;">
  <el-card bordered>
    <div slot="header" style="display: flex; justify-content: space-between; align-items: center;">
      <strong>⚡ Elementum Ready</strong>
      <el-theme-switch></el-theme-switch>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
      <el-input placeholder="Type a notification..." aria-label="Notification text"></el-input>
      <el-button variant="primary" onclick={() => toast.success('Elementum is live in Svelte 5!')}>
        Trigger Toast
      </el-button>
    </div>
  </el-card>
  <el-toaster></el-toaster>
</div>
`,
    };
  }
  return {
    filename: 'index.html',
    code: buildStarterIndexHtml(),
  };
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
  const withExample = args.has('--example');
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

    if (framework === 'vanilla') {
      const indexHtmlFile = path.join(targetDir, 'index.html');
      if (!fs.existsSync(indexHtmlFile)) {
        if (!dryRun) {
          fs.writeFileSync(indexHtmlFile, buildStarterIndexHtml(), 'utf8');
        }
        written.push('index.html');
      }
    } else if (withExample) {
      const ex = buildFrameworkExample(framework);
      const srcDir = fs.existsSync(path.join(targetDir, 'src')) ? path.join(targetDir, 'src') : targetDir;
      const exPath = path.join(srcDir, ex.filename);
      const relExPath = path.relative(targetDir, exPath).replaceAll('\\', '/');
      if (!fs.existsSync(exPath)) {
        if (!dryRun) {
          fs.writeFileSync(exPath, ex.code, 'utf8');
        }
        written.push(relExPath);
      }
    }
  }

  return { framework, targetDir, dryRun, written };
}

const CHECK_EXTENSIONS = new Set(['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte']);
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.vercel', 'coverage', 'test-results', 'playwright-report']);

function collectSourceFiles(targetPath, acc = []) {
  if (!fs.existsSync(targetPath)) return acc;
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    if (CHECK_EXTENSIONS.has(path.extname(targetPath).toLowerCase())) {
      acc.push(targetPath);
    }
    return acc;
  }
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath)) {
      if (IGNORE_DIRS.has(entry)) continue;
      collectSourceFiles(path.join(targetPath, entry), acc);
    }
  }
  return acc;
}

export async function runCheck(argv = [], cwd = process.cwd()) {
  const { handleToolCall } = await import('../mcp/server.js');
  const rawTargets = argv.filter((a) => !a.startsWith('--'));
  const targets = rawTargets.length > 0 ? rawTargets.map((t) => path.resolve(cwd, t)) : [cwd];

  const files = [];
  for (const t of targets) {
    collectSourceFiles(t, files);
  }

  let totalTagsChecked = 0;
  const fileReports = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('<el-')) continue;
    const usage = handleToolCall('validate_component_usage', { markup: content });
    const a11y = handleToolCall('lint_accessibility', { markup: content });
    totalTagsChecked += usage.checkedCount || 0;
    const usageIssues = Array.isArray(usage.issues) ? usage.issues : [];
    const a11yIssues = Array.isArray(a11y.issues) ? a11y.issues : [];
    if (usageIssues.length > 0 || a11yIssues.length > 0) {
      fileReports.push({
        file: path.relative(cwd, file) || path.basename(file),
        usageIssues,
        a11yIssues,
      });
    }
  }

  const errorCount = fileReports.reduce(
    (sum, r) =>
      sum +
      r.usageIssues.filter((i) => i.severity === 'error').length +
      r.a11yIssues.filter((i) => i.severity === 'error').length,
    0
  );
  const warningCount = fileReports.reduce(
    (sum, r) =>
      sum +
      r.usageIssues.filter((i) => i.severity !== 'error').length +
      r.a11yIssues.filter((i) => i.severity !== 'error').length,
    0
  );

  return {
    valid: errorCount === 0,
    filesScanned: files.length,
    totalTagsChecked,
    errorCount,
    warningCount,
    fileReports,
  };
}

export function isCliEntry(metaUrl, argv1 = process.argv[1]) {
  if (!argv1) return false;
  const selfPath = path.resolve(fileURLToPath(metaUrl));
  const argPath = path.resolve(argv1);
  if (argPath === selfPath) return true;
  try {
    return fs.realpathSync(argPath) === fs.realpathSync(selfPath);
  } catch {
    return path.basename(argPath).replace(/\.(js|mjs|cjs|cmd|ps1)$/i, '') === 'elementum';
  }
}

if (isCliEntry(import.meta.url)) {
  const args = process.argv.slice(2);
  const usageText =
    `Usage:\n  npx @wcomp/elementum init [--dir=<path>] [--example] [--mcp-only] [--dry-run]\n  npx @wcomp/elementum check [files-or-dirs...] [--json]\n  npx @wcomp/elementum mcp`;

  if (args[0] === 'mcp' || (args.length === 0 && !process.stdin.isTTY)) {
    const { startStdioServer } = await import('../mcp/server.js');
    startStdioServer();
  } else if (args.includes('--help') || args.includes('-h') || (args.length === 0 && process.stdin.isTTY)) {
    console.log(usageText);
    process.exit(0);
  } else if (args[0] === 'check') {
    const checkArgs = args.slice(1);
    const report = await runCheck(checkArgs);
    if (checkArgs.includes('--json')) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(
        `Elementum Check: scanned ${report.filesScanned} file(s), ${report.totalTagsChecked} <el-*> tag(s) (${report.errorCount} error(s), ${report.warningCount} warning(s)).`
      );
      for (const r of report.fileReports) {
        console.log(`  ${r.file}:`);
        for (const i of [...r.usageIssues, ...r.a11yIssues]) {
          console.log(`    [${i.severity || 'warning'}] ${i.message}`);
        }
      }
    }
    process.exit(report.valid ? 0 : 1);
  } else if (args[0] === 'init' || args[0]?.startsWith('--')) {
    const cmd = args[0] === 'init' ? args.slice(1) : args;
    const result = runInit(cmd);
    const prefix = result.dryRun ? '[dry-run] Would write' : 'Initialized Elementum';
    console.log(`${prefix} (detected: ${result.framework}) in ${result.targetDir}:`);
    for (const f of result.written) {
      console.log(`  - ${f}`);
    }
    if (!result.dryRun) {
      if (result.framework === 'vanilla' && result.written.includes('index.html')) {
        const openCmd = process.platform === 'win32' ? 'start index.html' : process.platform === 'darwin' ? 'open index.html' : 'xdg-open index.html';
        console.log(`\nNext steps:\n  1. Open your starter page: ${openCmd}\n  2. Validate markup & accessibility anytime: npx @wcomp/elementum check`);
      } else {
        const importLine =
          result.framework === 'react' || result.framework === 'next'
            ? `import '@wcomp/elementum/tokens.css';\n     import { ElButton, ElCard, ElDialog } from '@wcomp/elementum/react';`
            : `import '@wcomp/elementum/tokens.css';\n     import '@wcomp/elementum';`;
        console.log(`\nNext steps:\n  1. Import in your app entry:\n     ${importLine}\n  2. Validate markup & accessibility anytime: npx @wcomp/elementum check`);
      }
    }
  } else {
    console.error(`Unknown command: ${args[0]}\n\n${usageText}`);
    process.exit(1);
  }
}
