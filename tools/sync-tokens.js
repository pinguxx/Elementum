#!/usr/bin/env node
/**
 * Figma Tokens Sync Utility
 * Reads tokens/figma-tokens.json and compiles src/tokens.css
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const tokensPath = path.join(rootDir, 'tokens', 'figma-tokens.json');
const outputPath = path.join(rootDir, 'src', 'tokens.css');

const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

let cssContent = `/**
 * Elementum Design Tokens
 * Auto-generated from tokens/figma-tokens.json
 */

:root,
:root[data-theme="light"] {
  /* Brand Colors */
  --el-color-primary: ${tokens.color.brand.primary.$value};
  --el-color-primary-hover: ${tokens.color.brand['primary-hover'].$value};
  --el-color-secondary: ${tokens.color.brand.secondary.$value};
  --el-color-danger: ${tokens.color.brand.danger.$value};
  --el-color-success: ${tokens.color.brand.success.$value};

  /* Surfaces */
  --el-surface-base: ${tokens.color.surface.base.$value};
  --el-surface-muted: ${tokens.color.surface.muted.$value};
  --el-surface-border: ${tokens.color.surface.border.$value};

  /* Typography Colors */
  --el-text-base: ${tokens.color.text.base.$value};
  --el-text-muted: ${tokens.color.text.muted.$value};
  --el-text-inverse: ${tokens.color.text.inverse.$value};

  /* Spacing */
  --el-spacing-xs: ${tokens.spacing.xs.$value};
  --el-spacing-sm: ${tokens.spacing.sm.$value};
  --el-spacing-md: ${tokens.spacing.md.$value};
  --el-spacing-lg: ${tokens.spacing.lg.$value};
  --el-spacing-xl: ${tokens.spacing.xl.$value};

  /* Radii */
  --el-radius-sm: ${tokens.radius.sm.$value};
  --el-radius-md: ${tokens.radius.md.$value};
  --el-radius-lg: ${tokens.radius.lg.$value};
  --el-radius-full: ${tokens.radius.full.$value};

  color-scheme: light;
}

:root[data-theme="dark"] {
  /* Brand Colors */
  --el-color-primary: #3b82f6;
  --el-color-primary-hover: #60a5fa;
  --el-color-secondary: #9ca3af;
  --el-color-danger: #ef4444;
  --el-color-success: #22c55e;

  /* Surfaces (Dark Mode) */
  --el-surface-base: #0f172a;
  --el-surface-muted: #1e293b;
  --el-surface-border: #334155;

  /* Typography Colors (Dark Mode) */
  --el-text-base: #f8fafc;
  --el-text-muted: #94a3b8;
  --el-text-inverse: #0f172a;

  color-scheme: dark;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="dark"]) {
    --el-color-primary: #3b82f6;
    --el-color-primary-hover: #60a5fa;
    --el-color-secondary: #9ca3af;
    --el-color-danger: #ef4444;
    --el-color-success: #22c55e;

    --el-surface-base: #0f172a;
    --el-surface-muted: #1e293b;
    --el-surface-border: #334155;

    --el-text-base: #f8fafc;
    --el-text-muted: #94a3b8;
    --el-text-inverse: #0f172a;

    color-scheme: dark;
  }
}
`;

fs.writeFileSync(outputPath, cssContent, 'utf8');
console.log('✓ Successfully synchronized tokens from figma-tokens.json to src/tokens.css');
