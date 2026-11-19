import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../test-helpers/setup.js';
import '../src/components/el-tooltip.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const componentsDir = path.join(rootDir, 'src', 'components');
const skillsDir = path.join(rootDir, 'skills');

function readComponent(filename) {
  return fs.readFileSync(path.join(componentsDir, filename), 'utf8');
}

test('Craft Contract 1: Zero `transition: all` across all component stylesheets', () => {
  const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith('.js')).sort();
  const offenders = files.filter((f) => /transition\s*:\s*all\b/i.test(readComponent(f)));
  assert.deepEqual(
    offenders,
    [],
    `Found forbidden "transition: all" in: ${offenders.join(', ')}. List explicit CSS properties instead.`
  );
});

test('Craft Contract 2: Every component with @keyframes respects prefers-reduced-motion', () => {
  const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith('.js')).sort();
  const offenders = files.filter((f) => {
    const src = readComponent(f);
    return /@keyframes\b/.test(src) && !/prefers-reduced-motion/.test(src);
  });
  assert.deepEqual(
    offenders,
    [],
    `Components with @keyframes missing @media (prefers-reduced-motion: reduce): ${offenders.join(', ')}`
  );
});

test('Craft Contract 3: Interactive action primitives have tactile :active scale(0.97) press feedback', () => {
  for (const file of ['el-button.js', 'el-toggle.js', 'el-chip.js', 'el-segmented-control.js']) {
    const src = readComponent(file);
    assert.match(
      src,
      /:active[\s\S]{0,120}scale\(0\.97\)/,
      `${file} should apply transform: scale(0.97) on :active press`
    );
  }
});

test('Craft Contract 4: Avatars prevent flex squish and numeric displays use tabular-nums', () => {
  assert.match(readComponent('el-avatar.js'), /flex-shrink\s*:\s*0/, 'el-avatar.js must set flex-shrink: 0');

  for (const file of [
    'el-number-flow.js',
    'el-number-field.js',
    'el-meter.js',
    'el-progress.js',
    'el-pagination.js',
    'el-table.js',
  ]) {
    assert.match(
      readComponent(file),
      /font-variant-numeric\s*:\s*tabular-nums/,
      `${file} must enable font-variant-numeric: tabular-nums`
    );
  }
});

test('Craft Contract 5: Anchored overlays declare origin-aware transform-origin', () => {
  for (const file of ['el-popover.js', 'el-dropdown.js', 'el-tooltip.js', 'el-context-menu.js']) {
    assert.match(
      readComponent(file),
      /transform-origin\s*:/,
      `${file} must declare transform-origin for origin-aware motion`
    );
  }
});

test('Craft Contract 6: All installable Agent Skills have valid YAML frontmatter (name + description)', () => {
  assert.ok(fs.existsSync(skillsDir), 'skills/ directory must exist');
  const skillFolders = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  assert.ok(skillFolders.length >= 5, 'Expected at least 5 installable skills under skills/');

  for (const folder of skillFolders) {
    const skillMdPath = path.join(skillsDir, folder, 'SKILL.md');
    assert.ok(fs.existsSync(skillMdPath), `Missing SKILL.md in skills/${folder}`);
    const content = fs.readFileSync(skillMdPath, 'utf8');
    assert.match(content, /^---\r?\n[\s\S]*?\r?\n---/, `skills/${folder}/SKILL.md must start with YAML frontmatter`);
    assert.match(content, /^name:\s*.+$/m, `skills/${folder}/SKILL.md frontmatter must define name`);
    assert.match(content, /^description:\s*.+$/m, `skills/${folder}/SKILL.md frontmatter must define description`);
  }
});

test('Craft Contract 7: Mobile-native CSS rules (touch-action, 100dvh, overscroll-behavior, iOS zoom guard, no ease-in)', () => {
  const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith('.js')).sort();
  const easeInOffenders = files.filter((f) => /\bease-in\b(?!-out)/.test(readComponent(f)));
  assert.deepEqual(easeInOffenders, [], `Avoid slow ease-in on UI animations: ${easeInOffenders.join(', ')}`);

  const bareVhOffenders = files.filter((f) => {
    const src = readComponent(f);
    return /100vh/.test(src) && !/100dvh/.test(src);
  });
  assert.deepEqual(bareVhOffenders, [], `Pair 100vh with 100dvh in: ${bareVhOffenders.join(', ')}`);

  for (const file of ['el-button.js', 'el-toggle.js', 'el-chip.js', 'el-segmented-control.js']) {
    const src = readComponent(file);
    assert.match(src, /touch-action\s*:\s*manipulation/, `${file} must set touch-action: manipulation`);
    assert.match(src, /-webkit-tap-highlight-color\s*:\s*transparent/, `${file} must disable tap highlight flash`);
  }

  for (const file of ['el-drawer.js', 'el-dialog.js']) {
    const src = readComponent(file);
    assert.match(src, /overscroll-behavior\s*:\s*contain/, `${file} must set overscroll-behavior: contain`);
    assert.match(src, /safe-area-inset-bottom/, `${file} must respect safe-area-inset-bottom`);
  }

  for (const file of ['el-input.js', 'el-textarea.js', 'el-select.js', 'el-autocomplete.js', 'el-prompt-input.js']) {
    assert.match(
      readComponent(file),
      /@media\s*\(pointer:\s*coarse\)[\s\S]{0,120}max\(16px,\s*1em\)/,
      `${file} must guard against iOS Safari auto-zoom on coarse pointers`
    );
  }
});

test('Craft Contract 8: <el-tooltip> skips open delay when switching immediately between tooltips in a group', () => {
  const tipA = document.createElement('el-tooltip');
  tipA.setAttribute('delay', '0');
  const tipB = document.createElement('el-tooltip');
  tipB.setAttribute('delay', '250');
  document.body.append(tipA, tipB);

  tipA.show();
  assert.equal(tipA.visible.value, true);
  tipA.hide();
  assert.equal(tipA.visible.value, false);

  // Immediately hovering tipB within 350ms opens synchronously without waiting 250ms
  tipB.show();
  assert.equal(tipB.visible.value, true);

  tipB.hide();
  tipA.remove();
  tipB.remove();
});
