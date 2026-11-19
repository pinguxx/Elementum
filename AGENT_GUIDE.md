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
├── custom-elements.json      # Custom Elements Manifest (CEM v1, 109 tags) for IDEs & MCP
├── package.json              # Package metadata, subpath exports, and verification scripts
├── size-budget.json          # Per-entrypoint gzipped byte budgets enforced in CI
├── skills.sh.json            # Distributable agent skills manifest (skills/elementum/SKILL.md)
├── QUALITY.md                # Auto-generated per-component verification matrix
├── AGENT_GUIDE.md            # Canonical agent and contributor instructions
├── src/
│   ├── index.js              # Primary export entry point
│   ├── index.d.ts            # Strict TypeScript definitions (tsc --noEmit --strict)
│   ├── elementum.js          # Elementum base class (Shadow DOM, unstyled mode, FACE)
│   ├── signal.js             # Signals, Computed, Effect reactivity engine
│   ├── template.js           # html, svg, css tagged template parser and renderer
│   ├── ssr.js                # Pure Node.js Declarative Shadow DOM SSR
│   ├── ag-ui.js              # AG-UI streaming event store & RFC 6902 JSON Patch
│   ├── behaviors/index.js    # 15 headless interaction, focus, motion & overlay behaviors
│   ├── agent/index.js        # Shadow-DOM-piercing agent runtime bridge (snapshot, act)
│   ├── testing/index.js      # WAI-ARIA APG, RTL & DSD SSR contract validators
│   ├── tokens.css            # W3C DTCG design tokens (light & dark mode)
│   └── components/           # 109 zero-dependency Web Components
├── docs/                     # behaviors-and-agent.md, theming.md, framework-integration.md, penpot-workflow.md
├── mcp/server.js             # Hardened Model Context Protocol stdio server
├── e2e/                      # Real-browser Playwright + axe-core WCAG 2.2 AA tests
└── test/                     # 226+ Node.js unit, fuzz, behavior, contract & security tests
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
| `list_components` | `{}` | Lists all 109 registered components with tags and descriptions |
| `get_component_doc` | `{ tag }` | Full metadata (attributes, slots, events, parts) from CEM |
| `get_component_maturity` | `{ tag }` | Evidence-based maturity tier from test & E2E verification |
| `suggest_component` | `{ query }` | Recommends components for a UI goal |
| `validate_component_usage` | `{ markup }` | Validates attributes and slots against CEM |
| `list_tokens` | `{ category }` | Queries design tokens (color, spacing, radius, all) |
| `generate_snippet` | `{ tag, variant, size, label, disabled }` | Generates compliant HTML snippets |
| `scaffold_component` | `{ tag, name, description, formAssociated, attributes }` | Generates ready-to-use component boilerplate |
| `lint_accessibility` | `{ markup }` | Static HTML accessibility linter (`static-html-lint`) |

### Running the MCP Server
```bash
# Start stdio server
node mcp/server.js

# Or via package bin
npx elementum-mcp
```

---

## 8. Headless Behaviors, Agent Runtime & Testing Contracts

Prefer reusing Elementum's shared primitives rather than re-implementing interaction or accessibility logic per component (full reference in [docs/behaviors-and-agent.md](./docs/behaviors-and-agent.md)):

- **`@wcomp/elementum/behaviors`**: `createPressBehavior`, `createRovingFocus`, `createDismissableLayer`, `createFocusRecovery`, `createShortcuts`, `createDisclosureBehavior`, `createPopupPositioner`, `createPresenceBehavior`, `prefersReducedMotion`, `createSelectionBehavior`, `createReorderBehavior`, `highlightMatch`, `announce`, `setHostState`, `isRTL`.
- **`@wcomp/elementum/agent`**: `snapshot(root)` and `act(root, command)` for Shadow-DOM-piercing agent inspection and interaction.
- **`@wcomp/elementum/testing`**: `checkAriaPattern(el, pattern)`, `checkDirection(el)`, and `checkServerRender(tag, Ctor)`.
- **`unstyled` mode**: Any `<el-*>` element accepts `unstyled` to disable default Shadow DOM stylesheets while keeping ARIA, keyboard behavior, and `data-*` state attributes.

---

## 9. Development & Verification Workflow

```bash
# Run the complete verification pipeline (catalog diff, strict TS, size budgets, unit tests, tarball consumer, Playwright E2E)
npm run verify:all

# Individual checks
npm run catalog:diff       # Verify all 109 components match catalog-data.js
npm run typecheck          # Strict TypeScript check on src/index.d.ts
npm run check:size         # Enforce per-entrypoint gzipped byte budgets (size-budget.json)
npm test                   # 226+ unit, fuzz, behavior & security tests (>= 95% line coverage)
npm run verify:consumer    # Pack .tgz and verify external consumer imports + strict TS
npm run test:e2e           # Playwright + axe-core WCAG 2.2 AA real-browser suite

# Scaffold a new component or sync design tokens
npm run create el-my-element [--form]
npm run tokens:sync tokens/penpot-tokens.json
```

When authoring new features or components:
- Maintain $\ge 95\%$ line coverage across all files and keep gzipped sizes within `size-budget.json`.
- Verify WAI-ARIA patterns (`checkAriaPattern`), RTL (`checkDirection`), and DSD SSR (`checkServerRender`).
- Always expose internal elements through `part="..."` and reflect states with `setHostState` / `data-state`.
