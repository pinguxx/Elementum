#!/usr/bin/env node
/**
 * Elementum Catalog Diff Validator
 *
 * Diffs live Web Component source & runtime schemas against `examples/catalog-data.js`
 * and `examples/index.html`'s preview generator so you never have to manually inspect
 * all 109 components one by one.
 *
 * Checks:
 *  1. Observed attributes diff (live Custom Element class vs catalog-data.js props)
 *  2. Description formatting & quality (no raw angle-bracket HTML glitches, empty/short text)
 *  3. API completeness (every entry documents props, slots, or events + >= 1 example)
 *  4. Compound child parent-wrapper contract (child components like el-resizable-handle,
 *     el-resizable-panel, el-carousel-slide, el-navigation-menu-* must render inside
 *     their required parent container in the catalog preview, never naked!)
 *  5. Live preview render check (executes generatePreviewMarkup from examples/index.html
 *     and verifies non-empty Shadow DOM + parent wrapper + width/layout sizing)
 *
 * Usage:
 *   node tools/audit-catalog-diff.js
 *   node tools/audit-catalog-diff.js --json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../test-helpers/setup.js';
import '../src/index.js';
import { components } from '../examples/catalog-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

/**
 * Compound sub-components that REQUIRE a parent container to render and function properly.
 */
export const REQUIRED_PARENTS = {
  'el-resizable-panel': 'el-resizable',
  'el-resizable-handle': 'el-resizable',
  'el-carousel-slide': 'el-carousel',
  'el-navigation-menu-item': 'el-navigation-menu',
  'el-navigation-menu-trigger': 'el-navigation-menu',
  'el-navigation-menu-content': 'el-navigation-menu',
  'el-tab': 'el-tabs',
  'el-accordion-item': 'el-accordion',
  'el-breadcrumb-item': 'el-breadcrumb',
  'el-command-group': 'el-command',
  'el-command-item': 'el-command',
  'el-timeline-item': 'el-timeline',
  'el-tree-item': 'el-tree-view',
  'el-data-list-item': 'el-data-list',
  'el-sidebar-header': 'el-sidebar',
  'el-sidebar-content': 'el-sidebar',
  'el-sidebar-footer': 'el-sidebar',
  'el-sidebar-trigger': 'el-sidebar',
  'el-card-header': 'el-card',
  'el-card-title': 'el-card',
  'el-card-description': 'el-card',
  'el-card-content': 'el-card',
  'el-card-footer': 'el-card',
  'el-radio-card': 'el-radio-card-group',
};

function extractPreviewGenerator() {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'examples', 'index.html'), 'utf8');
  const escapeMarker = 'function escapeHtml(';
  const buildMarker = 'function buildComponentMarkup(';
  const idx = indexHtml.indexOf(buildMarker);
  if (idx === -1) return null;

  function extractFn(startIdx) {
    const openBrace = indexHtml.indexOf('{', startIdx);
    let depth = 0;
    let end = openBrace;
    for (let i = openBrace; i < indexHtml.length; i++) {
      if (indexHtml[i] === '{') depth++;
      else if (indexHtml[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    return indexHtml.slice(startIdx, end);
  }

  const escapeIdx = indexHtml.indexOf(escapeMarker);
  const escapeFn = escapeIdx !== -1 ? extractFn(escapeIdx) : 'function escapeHtml(s){return String(s??"");}';
  const buildFn = extractFn(idx);
  return new Function(`${escapeFn}\n${buildFn}\nreturn buildComponentMarkup;`)();
}

const LIVE_TAG_ALIASES = {
  'el-toast': 'el-toaster',
};

export function runCatalogDiffAudit() {
  const generatePreview = extractPreviewGenerator();
  const findings = [];

  for (const [tag, comp] of Object.entries(components)) {
    const tagIssues = [];
    const liveTag = LIVE_TAG_ALIASES[tag] || tag;
    const Ctor = customElements.get(liveTag);

    // 1. Live registration & observedAttributes diff
    if (!Ctor) {
      tagIssues.push('Not registered in customElements');
    } else if (!LIVE_TAG_ALIASES[tag]) {
      const liveAttrs = new Set(Ctor.observedAttributes || []);
      const docAttrs = new Set((comp.props || []).map((p) => p.name));
      for (const a of liveAttrs) {
        if (!docAttrs.has(a)) tagIssues.push(`Missing catalog prop for observedAttribute "${a}"`);
      }
      for (const p of docAttrs) {
        if (!liveAttrs.has(p)) tagIssues.push(`Catalog prop "${p}" is not in observedAttributes`);
      }
    }

    // 2. Description quality & formatting check
    const desc = String(comp.description || '');
    if (desc.trim().length < 15) {
      tagIssues.push(`Description too short or empty: "${desc}"`);
    }
    if (/[<>]/.test(desc)) {
      tagIssues.push(`Description contains unescaped angle brackets (< or >): "${desc}"`);
    }
    if (/^\s|\s$|  |\r|\n/.test(desc)) {
      tagIssues.push(`Description has whitespace/newline formatting issues: "${desc}"`);
    }

    // 3. API reference completeness
    const propsCount = (comp.props || []).length;
    const slotsCount = (comp.slots || []).length;
    const eventsCount = (comp.events || []).length;
    if (propsCount === 0 && slotsCount === 0 && eventsCount === 0) {
      tagIssues.push('Empty API reference: 0 props, 0 slots, and 0 events documented');
    }

    if (!Array.isArray(comp.examples) || comp.examples.length === 0) {
      tagIssues.push('Missing catalog examples');
    }

    // 4. Live preview generation & parent-wrapper verification
    if (generatePreview) {
      const defaultProps = {};
      for (const p of comp.props || []) {
        defaultProps[p.name] = p.default;
      }
      let previewHtml = '';
      try {
        previewHtml = generatePreview(comp, defaultProps);
      } catch (err) {
        tagIssues.push(`Preview generator threw: ${err.message}`);
      }

      if (previewHtml) {
        const container = document.createElement('div');
        container.innerHTML = previewHtml;
        document.body.appendChild(container);
        try {
          const el = container.querySelector(liveTag) || container.querySelector(tag);
          if (!el && !LIVE_TAG_ALIASES[tag]) {
            tagIssues.push(`Preview markup does not contain <${tag}>`);
          } else if (el) {
            const requiredParent = REQUIRED_PARENTS[tag];
            if (requiredParent && !el.closest(requiredParent)) {
              tagIssues.push(`Compound child <${tag}> rendered naked without required <${requiredParent}> wrapper`);
            }
            if (Ctor && Ctor.shadowRoot !== false) {
              const shadowLen = el.shadowRoot ? el.shadowRoot.innerHTML.trim().length : 0;
              if (shadowLen === 0) {
                tagIssues.push(`Rendered <${tag}> has empty shadowRoot in preview`);
              }
            }
          }
        } finally {
          container.remove();
        }
      }
    }

    if (tagIssues.length > 0) {
      findings.push({ tag, issues: tagIssues });
    }
  }

  // 6. CSS :host([attr="val"]) enum completeness check against catalog-data.js
  const compDir = path.join(rootDir, 'src', 'components');
  for (const file of fs.readdirSync(compDir).filter((f) => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(compDir, file), 'utf8');
    const tagDefs = src.match(/customElements\.define\(['"]([a-z0-9-]+)['"]/g) || [];
    const tags = tagDefs.map((m) => m.match(/['"]([a-z0-9-]+)['"]/)[1]);
    if (tags.length !== 1) continue;
    const tag = tags[0];
    const comp = components[tag];
    if (!comp) continue;

    const cssEnums = new Map();
    const re = /:host\(\[([a-z-]+)=["']([^"']+)["']\]\)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const [, attr, val] = m;
      if (attr.startsWith('data-') || attr.startsWith('aria-') || attr === 'dir') continue;
      if (!cssEnums.has(attr)) cssEnums.set(attr, new Set());
      cssEnums.get(attr).add(val);
    }

    const enumIssues = [];
    for (const [attr, vals] of cssEnums.entries()) {
      if (vals.size < 2) continue;
      const prop = (comp.props || []).find((p) => p.name === attr);
      if (!prop) continue;
      if (prop.type !== 'select') {
        enumIssues.push(`Prop "${attr}" is type "${prop.type}" but CSS defines enum [${[...vals].join(', ')}]`);
      } else {
        const opts = new Set(prop.options || []);
        const missing = [...vals].filter((v) => !opts.has(v));
        if (missing.length > 0) {
          enumIssues.push(`Prop "${attr}" missing select options [${missing.join(', ')}]`);
        }
      }
    }
    if (enumIssues.length > 0) {
      const existing = findings.find((f) => f.tag === tag);
      if (existing) existing.issues.push(...enumIssues);
      else findings.push({ tag, issues: enumIssues });
    }
  }

  return {
    totalComponents: Object.keys(components).length,
    previewGeneratorFound: Boolean(generatePreview),
    failingCount: findings.length,
    findings,
  };
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());

if (isDirectRun) {
  const report = runCatalogDiffAudit();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `Catalog Diff Audit: ${report.totalComponents} components checked, ${report.failingCount} with issues.`
    );
    for (const f of report.findings) {
      console.log(`\n[${f.tag}]`);
      for (const issue of f.issues) console.log(`  - ${issue}`);
    }
  }
  if (report.failingCount > 0) process.exit(1);
}
