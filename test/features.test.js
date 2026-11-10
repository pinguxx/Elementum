import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toast } from '../src/components/el-toast.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

test('ToastManager dispatches, stores, and dismisses notifications', () => {
  const initialCount = toast.toasts.value.length;
  const id = toast.success('Action succeeded!');

  assert.equal(toast.toasts.value.length, initialCount + 1);
  const found = toast.toasts.value.find((t) => t.id === id);
  assert.equal(found.message, 'Action succeeded!');
  assert.equal(found.variant, 'success');

  toast.dismiss(id);
  assert.equal(toast.toasts.value.length, initialCount);
});

test('Tokens sync utility produces valid tokens.css with dark mode rules', async () => {
  const tokensPath = path.join(rootDir, 'src', 'tokens.css');
  const content = fs.readFileSync(tokensPath, 'utf8');

  assert.ok(content.includes('--el-color-primary'));
  assert.ok(content.includes('[data-theme="dark"]'));
  assert.ok(content.includes('prefers-color-scheme: dark'));
});

test('Custom elements manifest lists all 10 components', () => {
  const manifestPath = path.join(rootDir, 'custom-elements.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const tags = manifest.modules.flatMap((m) => m.declarations.map((d) => d.tagName));

  const expected = [
    'el-button',
    'el-badge',
    'el-input',
    'el-dropdown',
    'el-calendar',
    'el-datepicker',
    'el-dialog',
    'el-tabs',
    'el-tab',
    'el-select',
    'el-theme-switch',
    'el-toaster'
  ];

  for (const exp of expected) {
    assert.ok(tags.includes(exp), `Expected tag ${exp} in manifest`);
  }
});
