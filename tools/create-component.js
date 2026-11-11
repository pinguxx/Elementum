#!/usr/bin/env node
/**
 * Component Scaffolding CLI for Elementum
 * Usage: node tools/create-component.js <tag-name> [--form]
 * Example: node tools/create-component.js el-slider --form
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const tag = process.argv[2];
const isForm = process.argv.includes('--form');

if (!tag) {
  console.error('Error: Please provide a custom element tag name (e.g. el-slider)');
  console.log('Usage: node tools/create-component.js <tag-name> [--form]');
  process.exit(1);
}

if (!tag.includes('-')) {
  console.error('Error: Custom element tag name must contain a hyphen (e.g. el-slider)');
  process.exit(1);
}

const className = tag
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join('');

const componentFilePath = path.join(rootDir, 'src', 'components', `${tag}.js`);
const indexFilePath = path.join(rootDir, 'src', 'index.js');

if (fs.existsSync(componentFilePath)) {
  console.error(`Error: Component file already exists: ${componentFilePath}`);
  process.exit(1);
}

// 1. Generate Component Code
const formAssociatedCode = isForm
  ? `  static formAssociated = true;
  static observedAttributes = ['value', 'disabled', 'required'];

  value = signal('');
  disabled = signal(false);
  required = signal(false);

  connected() {
    this.required.value = this.hasAttribute('required');
    this.setFormValue(this.value.value);
    this.validate();
  }

  formReset() {
    this.value.value = this.getAttribute('value') || '';
    this.setFormValue(this.value.value);
    this.validate();
  }

  validate() {
    if (this.required.value && !this.value.value) {
      this.setValidity({ valueMissing: true }, 'Please fill in this field.');
      this.setAttribute('aria-invalid', 'true');
      return false;
    }
    this.setValidity({});
    this.removeAttribute('aria-invalid');
    return true;
  }
`
  : `  static observedAttributes = ['variant', 'size', 'disabled'];

  variant = signal('primary');
  size = signal('md'); // 'sm' | 'md' | 'lg'
  disabled = signal(false);

  connected() {
    this.variant.value = this.getAttribute('variant') || 'primary';
    this.size.value = this.getAttribute('size') || 'md';
    this.disabled.value = this.hasAttribute('disabled');
  }
`;

const componentContent = `import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ${className} extends Elementum {
${formAssociatedCode}
  static styles = css\`
    :host {
      display: inline-block;
      box-sizing: border-box;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    :host(:focus-visible) {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: 2px;
    }

    .container {
      display: flex;
      align-items: center;
      padding: var(--el-spacing-sm, 8px) var(--el-spacing-md, 16px);
      border-radius: var(--el-radius-md, 8px);
      background: var(--el-surface-card, #ffffff);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      color: var(--el-text-primary, #0f172a);
    }
  \`;

  render() {
    return html\`
      <div class="container" part="container">
        <slot></slot>
      </div>
    \`;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('${tag}')) {
  customElements.define('${tag}', ${className});
}
`;

fs.writeFileSync(componentFilePath, componentContent, 'utf8');
console.log(`✓ Created: src/components/${tag}.js`);

// 2. Export in src/index.js if not already present
let indexContent = fs.readFileSync(indexFilePath, 'utf8');
const exportLine = `export { ${className} } from './components/${tag}.js';\n`;
if (!indexContent.includes(exportLine)) {
  fs.writeFileSync(indexFilePath, indexContent + exportLine, 'utf8');
  console.log(`✓ Exported ${className} in src/index.js`);
}

console.log(`\n🎉 Successfully scaffolded <${tag}>!`);
