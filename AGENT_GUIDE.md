# Elementum Agent & Developer Guide

> **Architecture, Reactivity, Accessibility (WCAG 2.2), and MCP Tooling Reference**

This document serves as the canonical guide for AI coding agents and human engineers building, reviewing, and extending components within the **Elementum** repository.

---

## 1. Core Architecture & Philosophy

Elementum is a zero-dependency, signal-driven Web Component library built directly on native browser standards:
- **Custom Elements v1**: Native lifecycle (`connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`).
- **Shadow DOM**: Encapsulated styling and internal structure; styled externally using Design Tokens (CSS Custom Properties) and `::part()`.
- **Preact-style Signals**: Fine-grained reactive state (`signal`, `computed`, `effect`) that updates individual DOM nodes without a Virtual DOM or full-tree diffing.
- **Tagged Template Literals**: `html` and `css` tagged templates compiling down to native `<template>` elements and `CSSStyleSheet` constructable stylesheets.
- **Form-Associated Custom Elements (FACE)**: Standard `<form>` participation using `ElementInternals` (`setFormValue`, `setValidity`, `reportValidity`).
- **WCAG 2.2 Conformance**: Target sizes $\ge 24\times24$px, high-contrast visible focus rings, dialog focus preservation, and accessibility state synchronization.

---

## 2. Directory Layout

```
Elementum/
├── custom-elements.json      # Custom Elements Manifest (CEM v1) for IDEs & MCP
├── package.json              # Package metadata and scripts
├── tokens.css                # Generated CSS design tokens with dark-mode overrides
├── AGENT_GUIDE.md            # Canonical agent and contributor instructions
├── src/
│   ├── index.js              # Primary export entry point
│   ├── index.d.ts            # Complete TypeScript definitions
│   ├── elementum.js          # Elementum base class extending HTMLElement
│   ├── signal.js             # Signals, Computed, Effect reactivity engine
│   ├── template.js           # html, css tagged template parser and renderer
│   ├── tokens.css            # Component-level token definitions
│   └── components/           # Component primitives
│       ├── el-button.js
│       ├── el-input.js
│       ├── el-select.js
│       ├── el-switch.js
│       ├── el-datepicker.js
│       ├── el-dialog.js
│       └── ...
├── docs/                     # Guides (theming, framework-integration)
├── mcp/                      # Model Context Protocol stdio server for AI agents
│   └── server.js
├── test/                     # Unit test suites using Node.js native test runner
└── test-helpers/             # happy-dom environment setup
```

---

## 3. Reactivity Engine (`src/signal.js`)

Elementum reactive state is managed through Signals:

### Creating Signals
```javascript
import { signal, computed, effect } from '../signal.js';

const count = signal(0);
const doubled = computed(() => count.value * 2);

console.log(count.value); // 0
count.value = 5;
console.log(doubled.value); // 10
```

### Critical Rules of Reactivity:
1. **Never unwrap signals prematurely in templates**:
   - ❌ WRONG: `html`\`<div>${this.label.value}</div>\`` (evaluates once at initial render, losing reactivity)
   - ✅ RIGHT: `html`\`<div>${() => this.label.value}</div>\`` (evaluates as a reactive getter attached to DOM text node)
2. **Dynamic attributes and properties**:
   - Passing an arrow function `${() => this.disabled.value ? '' : null}` updates the boolean attribute reactively.
3. **Automatic Cleanup**:
   - `effect(fn, { signal })` accepts an `AbortSignal` (such as `this.signal` from the component base class) to automatically tear down listeners when disconnected.

---

## 4. Authoring an Elementum Component

All components extend `Elementum`:

```javascript
import { Elementum } from '../elementum.js';
import { html, css } from '../template.js';
import { signal } from '../signal.js';

export class ElCard extends Elementum {
  // 1. Specify observed attributes
  static observedAttributes = ['variant', 'disabled'];

  // 2. Declare reactive state signals
  variant = signal('default');
  disabled = signal(false);

  // 3. Encapsulated styles using design tokens
  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      border-radius: var(--el-radius-md, 8px);
      background: var(--el-surface-card, #ffffff);
      border: 1px solid var(--el-surface-border, #e5e7eb);
      padding: var(--el-spacing-md, 16px);
    }

    :host(:focus-visible) {
      outline: 2px solid var(--el-color-primary, #2563eb);
      outline-offset: 2px;
    }
  `;

  // 4. Render template with exposed CSS parts
  render() {
    return html`
      <div class="card-inner" part="card">
        <header part="header"><slot name="header"></slot></header>
        <section part="body"><slot></slot></section>
      </div>
    `;
  }
}

// 5. Safe Custom Element definition
if (typeof customElements !== 'undefined' && !customElements.get('el-card')) {
  customElements.define('el-card', ElCard);
}
```

---

## 5. Form-Associated Components & Constraint Validation

For components that submit values with a native `<form>`:
1. Declare `static formAssociated = true;`
2. Initialize `ElementInternals` through `this.internals` (handled automatically by `Elementum`).
3. Sync value changes using `this.setFormValue(val)`.
4. Implement standard constraint validation using `this.setValidity(flags, message, anchor)` and `this.validate()`.

### Example: Form Validation Pattern
```javascript
export class ElMyInput extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['value', 'required'];

  value = signal('');
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
    const val = String(this.value.value || '').trim();
    if (this.required.value && !val) {
      this.setValidity({ valueMissing: true }, 'Please fill in this field.');
      this.setAttribute('aria-invalid', 'true');
      return false;
    }
    this.setValidity({});
    this.removeAttribute('aria-invalid');
    return true;
  }
}
```

---

## 6. WCAG 2.2 Accessibility Compliance Rules

Every component must satisfy WCAG 2.2 Level AA:

1. **Target Size Minimum (SC 2.5.8 - Level AA)**:
   - Interactive elements (buttons, inputs, switches, tabs) must have a clickable area of at least **$24 \times 24$ CSS pixels**.
   - Standard button sizes: `sm`: 32px height, `md`: 40px height, `lg`: 48px height.
2. **Focus Visible & Focus Not Obscured (SC 2.4.7, 2.4.11, 2.4.12)**:
   - Always define `:host(:focus-visible)` or internal interactive `:focus-visible` with a high-contrast ring (`outline: 2px solid var(--el-color-primary); outline-offset: 2px;`).
3. **Modal Dialog Focus Management (SC 2.4.3 - Level A)**:
   - `<el-dialog>` caches `document.activeElement` prior to `showModal()`.
   - On `close()`, focus is returned to the previously focused element.
4. **Accessible Name & Roles (SC 4.1.2 - Level A)**:
   - Form inputs expose `<input>` or appropriate ARIA roles (`role="combobox"`, `role="switch"`).
   - Icon-only buttons must provide an `aria-label`.
5. **Error Identification (SC 3.3.1 - Level A)**:
   - Set `aria-invalid="true"` when `validity.valid === false`.

---

## 7. Model Context Protocol (MCP) Server for Agents

Elementum provides an MCP server (`mcp/server.js`) that agents can query over stdio JSON-RPC.

### Available MCP Tools

| Tool Name | Parameters | Purpose |
| :--- | :--- | :--- |
| `list_components` | `{}` | Lists all registered components with tags and descriptions |
| `get_component_doc` | `{ tag }` | Full metadata (attributes, slots, events, parts) from CEM |
| `list_tokens` | `{ category }` | Queries Figma design tokens (color, spacing, radius, all) |
| `generate_snippet` | `{ tag, variant, size, label, disabled }` | Generates compliant HTML snippets |
| `scaffold_component` | `{ tag, name, description, formAssociated, attributes }` | Generates ready-to-use component boilerplate |
| `validate_accessibility`| `{ markup }` | Audits HTML markup against WCAG 2.2 rules |

### Running the MCP Server
```bash
# Start stdio server
node mcp/server.js

# Or via package bin
npx elementum-mcp
```

---

## 8. Development & Verification Workflow

```bash
# Run tests and verify code coverage
npm test

# Scaffold a new component
npm run create el-my-element [--form]

# Generate tokens.css from tokens/figma-tokens.json
npm run tokens:sync
```

When authoring new features or components:
- Maintain $\ge 80\%$ test coverage across all files.
- Ensure strict adherence to WCAG 2.2 guidelines.
- Always expose internal elements through `part="..."` for design system theming.
