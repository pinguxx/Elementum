import '../test-helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import '../src/index.js';
import { ElButton } from '../src/components/el-button.js';
import { components } from '../examples/catalog-data.js';

import { runCatalogDiffAudit } from '../tools/audit-catalog-diff.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function loadCatalogRuntime() {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'examples', 'index.html'), 'utf8');
  const startIdx = indexHtml.indexOf('    function escapeHtml(str)');
  const endIdx = indexHtml.indexOf('    // Initial render');
  assert.ok(startIdx !== -1 && endIdx !== -1, 'Could not locate catalog helper functions in examples/index.html');

  const runtimeSnippet = indexHtml.slice(startIdx, endIdx);
  return new Function(
    'components',
    `${runtimeSnippet}; return { escapeHtml, buildComponentMarkup, syncDeclaredPropsToStage };`
  )(components);
}

const componentSources = fs
  .readdirSync(path.join(rootDir, 'src', 'components'))
  .filter((f) => f.endsWith('.js'))
  .map((f) => ({
    file: f,
    content: fs.readFileSync(path.join(rootDir, 'src', 'components', f), 'utf8'),
  }));

function findSourceForTag(tag) {
  return (
    componentSources.find((src) => src.file === `${tag}.js`) ||
    componentSources.find(
      (src) => src.content.includes(`define('${tag}'`) || src.content.includes(`define("${tag}"`)
    ) ||
    componentSources.find((src) => src.content.includes(`'${tag}'`) || src.content.includes(`"${tag}"`))
  );
}

const { buildComponentMarkup, syncDeclaredPropsToStage } = loadCatalogRuntime();

const PREVIEW_CONTENT_PROPS = new Set(['label', 'message', 'content']);
const ALLOWED_OMITTED_OBSERVED_ATTRS = new Set([
  'data',
  'columns',
  'options',
  'x-key',
  'y-key',
  'secondary-key',
  'heading',
  'autoplay',
]);

test('Catalog Contract 1: Every catalog entry matches live Custom Elements observedAttributes schema', () => {
  const errors = [];

  for (const [tag, comp] of Object.entries(components)) {
    if (tag === 'el-toast') continue; // Imperative toast helper preview

    const Ctor = customElements.get(tag);
    if (!Ctor) {
      errors.push(`${tag}: custom element not registered in customElements`);
      continue;
    }

    const observed = new Set(Ctor.observedAttributes || []);
    const propNames = new Set((comp.props || []).map((p) => p.name));

    for (const prop of comp.props || []) {
      if (!observed.has(prop.name) && !PREVIEW_CONTENT_PROPS.has(prop.name)) {
        errors.push(`${tag}.${prop.name}: catalog prop is missing from observedAttributes ([${[...observed].join(', ')}])`);
      }
    }

    for (const attr of observed) {
      if (!propNames.has(attr) && !ALLOWED_OMITTED_OBSERVED_ATTRS.has(attr)) {
        errors.push(`${tag}.${attr}: observedAttribute is missing from catalog-data.js`);
      }
    }
  }

  assert.deepEqual(errors, [], `Catalog schema drift detected:\n${errors.join('\n')}`);
});

test('Catalog Contract 2: Zero dead knobs — every catalog prop mutates preview markup and live DOM cleanly', () => {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const errors = [];

  try {
    for (const [tag, comp] of Object.entries(components)) {
      const baseProps = {};
      for (const p of comp.props || []) {
        baseProps[p.name] = p.default;
      }

      const baseMarkup = buildComponentMarkup(comp, baseProps);
      assert.ok(typeof baseMarkup === 'string' && baseMarkup.length > 0, `${tag} baseline markup empty`);

      for (const prop of comp.props || []) {
        let testVal;
        if (prop.type === 'boolean') {
          testVal = !prop.default;
        } else if (prop.type === 'select') {
          testVal = (prop.options || []).find((o) => o !== prop.default) ?? prop.options?.[0];
        } else if (prop.type === 'number') {
          testVal = (Number(prop.default) || 0) + 7;
        } else {
          testVal = (prop.default || '') + '_TEST';
        }

        const modProps = { ...baseProps, [prop.name]: testVal };
        const modMarkup = buildComponentMarkup(comp, modProps);

        if (modMarkup === baseMarkup) {
          errors.push(`${tag}.${prop.name}: changing '${prop.default}' -> '${testVal}' had no effect on buildComponentMarkup`);
          continue;
        }

        if (tag === 'el-toast') continue;

        stage.innerHTML = baseMarkup;
        const baseTarget = syncDeclaredPropsToStage(stage, comp, baseProps);
        const baseAttrs = baseTarget
          ? baseTarget.getAttributeNames().sort().map((a) => `${a}=${baseTarget.getAttribute(a)}`).join(';') + `|text=${baseTarget.textContent}`
          : '';

        stage.innerHTML = modMarkup;
        const modTarget = syncDeclaredPropsToStage(stage, comp, modProps);
        if (!modTarget) {
          errors.push(`${tag}.${prop.name}: target <${tag}> not rendered in preview stage`);
          continue;
        }

        const modAttrs =
          modTarget.getAttributeNames().sort().map((a) => `${a}=${modTarget.getAttribute(a)}`).join(';') +
          `|text=${modTarget.textContent}`;

        if (modAttrs === baseAttrs) {
          errors.push(`${tag}.${prop.name}: markup changed outside <${tag}>, target element did not update`);
        }
      }
    }
  } finally {
    stage.remove();
  }

  assert.deepEqual(errors, [], `Dead or disconnected catalog knobs found:\n${errors.join('\n')}`);
});

test('Catalog Contract 3: Every select option in catalog-data.js is valid and mountable', () => {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const errors = [];

  try {
    for (const [tag, comp] of Object.entries(components)) {
      const srcInfo = findSourceForTag(tag);
      const Ctor = customElements.get(tag);
      const cssText = Ctor?.styles?.cssText || '';
      const baseProps = {};
      for (const p of comp.props || []) baseProps[p.name] = p.default;

      for (const prop of comp.props || []) {
        if (prop.type !== 'select' || !Array.isArray(prop.options)) continue;

        for (const opt of prop.options) {
          const optProps = { ...baseProps, [prop.name]: opt };
          const markup = buildComponentMarkup(comp, optProps);
          stage.innerHTML = markup;
          const target = tag === 'el-toast' ? stage.firstElementChild : syncDeclaredPropsToStage(stage, comp, optProps);
          assert.ok(target, `${tag}.${prop.name}="${opt}" failed to render`);

          if (tag === 'el-toast' || prop.name === 'value' || (tag === 'el-input' && prop.name === 'type')) {
            continue; // Passed directly to toast handler, slotted child value/route, or native <input type>
          }

          const inSource = srcInfo ? srcInfo.content.includes(opt) : false;
          const inCss = cssText.includes(opt);
          if (!inSource && !inCss) {
            errors.push(`${tag}.${prop.name} option '${opt}' not found in ${srcInfo?.file || 'source'} or component styles`);
          }
        }
      }
    }
  } finally {
    stage.remove();
  }

  assert.deepEqual(errors, [], `Unimplemented select options detected:\n${errors.join('\n')}`);
});

test('Catalog Contract 4: All catalog example snippets mount and render without throwing', () => {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const errors = [];

  try {
    for (const [tag, comp] of Object.entries(components)) {
      for (const ex of comp.examples || []) {
        try {
          stage.innerHTML = ex.code;
          assert.ok(stage.firstElementChild, `${tag} example "${ex.title}" rendered empty`);
        } catch (err) {
          errors.push(`${tag} example "${ex.title}": ${err.message}`);
        }
      }
    }
  } finally {
    stage.remove();
  }

  assert.deepEqual(errors, [], `Catalog example render errors:\n${errors.join('\n')}`);
});

test('Catalog Contract 5: Dark mode button hover contrast & isolated preview canvas tokens', () => {
  const btnCss = ElButton.styles?.cssText || '';
  assert.ok(!btnCss.includes('background-color: #e5e7eb'), 'Secondary button hover must not hardcode #e5e7eb');
  assert.ok(btnCss.includes('var(--el-step-4, var(--el-surface-border'), 'Secondary button hover must chain var(--el-step-4, var(--el-surface-border)');
  assert.ok(btnCss.includes('var(--el-text-primary'), 'Secondary button must use var(--el-text-primary)');

  const indexHtml = fs.readFileSync(path.join(rootDir, 'examples', 'index.html'), 'utf8');
  assert.ok(
    !indexHtml.includes(':root[data-theme="dark"] .canvas-stage'),
    'Page dark theme must not override .canvas-stage background'
  );
  assert.ok(
    indexHtml.includes('.canvas-stage:not(.dark-canvas)') && indexHtml.includes('.canvas-stage.dark-canvas'),
    'Canvas stage must scope light/dark tokens independently'
  );
  assert.ok(
    indexHtml.includes('el-button[variant="secondary"]::part(button):hover'),
    'Preview toolbar secondary buttons must define high-contrast ::part(button):hover styles'
  );
  assert.ok(
    indexHtml.includes('let isDarkCanvas = false;') && indexHtml.includes('class="canvas-stage${isDarkCanvas'),
    'Canvas theme selection must persist across component navigation'
  );
});

test('Catalog Contract 6: Automated Source-vs-Catalog Diff Validator passes with 0 findings', () => {
  const report = runCatalogDiffAudit();
  assert.equal(report.previewGeneratorFound, true, 'Must locate buildComponentMarkup in examples/index.html');
  assert.deepEqual(
    report.findings,
    [],
    `Catalog diff audit found issues:\n${JSON.stringify(report.findings, null, 2)}`
  );
});
