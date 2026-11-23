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

> For the operational **"If you change X → update Y"** checklist and release process, see [`AGENTS.md`](./AGENTS.md).

```
Elementum/
├── AGENTS.md                 # Cross-chat agent playbook, sync matrix & release checklist
├── AGENT_GUIDE.md            # Architecture, reactivity, accessibility & MCP reference
├── AUDITS.md                 # Permanent verification hub (tool versions, findings & repro)
├── QUALITY.md                # Auto-generated 109/109 per-component verification matrix
├── llms.txt                  # Compact LLM/agent index served at site root
├── custom-elements.json      # Custom Elements Manifest (CEM v1, 109 tags) for IDEs & MCP
├── server.json               # MCP Registry metadata (stdio + hosted /mcp Edge endpoint)
├── package.json              # Package metadata, subpath exports, sideEffects & scripts
├── size-budget.json          # Per-entrypoint gzipped byte budgets enforced in CI
├── skills.sh.json            # Distributable agent skills manifest (skills/)
├── vercel.json               # Vercel rewrites (/mcp -> Edge, /ssr -> Node)
├── api/
│   ├── mcp.js                # Vercel Edge Function for Streamable HTTP MCP (/mcp)
│   └── ssr.js                # Vercel Serverless Function for DSD SSR (/ssr)
├── mcp/
│   ├── core.js               # Pure-JS, runtime-agnostic MCP core (10 tools, 2025-03-26)
│   ├── edge.js               # Pure-JS Web Fetch adapter for Edge runtimes
│   ├── server.js             # Node.js stdio CLI entrypoint (npx elementum-mcp)
│   └── component-metadata.json # Separated variants, states, props, constraints & examples
├── src/
│   ├── index.js / index.d.ts # Primary exports & strict TypeScript definitions
│   ├── elementum.js          # Base class (Shadow DOM, unstyled mode, FACE)
│   ├── signal.js             # Signals, Computed, Effect, Batch & AsyncSignal kernel
│   ├── template.js           # html, svg, css tagged template parser and renderer
│   ├── ssr.js                # Pure Node.js Declarative Shadow DOM SSR
│   ├── ag-ui.js              # AG-UI streaming event store & RFC 6902 JSON Patch
│   ├── a2ui.js / a2ui.d.ts   # Locked-catalog declarative A2UI JSON surface renderer
│   ├── react/                # Auto-generated React 18/19 wrappers & strict TS types
│   ├── behaviors/index.js    # 16 headless interaction, focus, motion & overlay behaviors
│   ├── agent/index.js        # Shadow-DOM-piercing agent runtime bridge (snapshot, act)
│   ├── testing/index.js      # WAI-ARIA APG, RTL & DSD SSR contract validators
│   ├── tokens.css            # W3C DTCG design tokens (light & dark mode)
│   └── components/           # 109 zero-dependency Web Components
├── starters/                 # CI-verified starters (Vanilla, Next.js, React 19, Vue 3, Svelte 5, AI Chat, 3-way comparison)
├── benchmarks/agent-eval/    # 4-arm AI-agent UI benchmark protocol & Playwright/axe/MCP scorer
├── docs/                     # agent-craft-guide.md, behaviors-and-agent.md, theming.md, framework-integration.md, penpot-workflow.md, accessibility-audit.md, stability-and-1.0.md
├── examples/                 # Interactive demos (index, app, agent-studio, ag-ui, a2ui, ledgerflow, references, ssr-demo)
├── e2e/                      # Playwright + axe-core WCAG 2.2 AA & visual regression suites
└── test/                     # Node.js unit, fuzz, behavior, contract, React, A2UI & security tests
```

---

## 3. Reactivity Engine (`src/signal.js`)

Elementum reactive state is managed through Signals:

### Creating Signals, Batching & Async Signals
```javascript
import { signal, computed, effect, batch, asyncSignal, isPending } from '@wcomp/elementum';

const query = signal('web');
const results = asyncSignal(async (abortSignal) => {
  const q = query.value; // automatically tracked; stale in-flight fetches auto-abort
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: abortSignal });
  return res.json();
});

// Atomic multi-write without intermediate glitches
batch(() => {
  query.value = 'signals';
});

// Inspect loading & structured error details (stale-while-revalidate preserves last `.value`)
// results.pending.value | results.status.value | results.error.value | isPending(() => results.read())
```

### Critical Rules of Reactivity:
1. **Never unwrap signals prematurely in templates**:
   - ❌ WRONG: `html`\`<div>${this.label.value}</div>\`` (evaluates once at initial render, losing reactivity)
   - ✅ RIGHT: `html`\`<div>${() => this.label.value}</div>\`` (evaluates as a reactive getter attached to DOM text node)
2. **Dynamic attributes and properties**:
   - Passing an arrow function `${() => this.disabled.value ? '' : null}` or `?disabled=${this.disabled}` updates boolean attributes reactively.
3. **Automatic Cleanup & Error Boundaries**:
   - `effect(fn, { signal, onError })` accepts an `AbortSignal` (`this.signal`) for leak-free teardown and an optional `onError` handler to isolate reactive exceptions without crashing sibling bindings.
   - `asyncSignal(fetcher, { signal, onError })` automatically aborts stale in-flight requests on dependency updates and exposes structured `.error` details (`message`, `cause`, `status`, `timestamp`, `attempt`).

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

Elementum provides a spec-compliant (`2025-03-26` / `2025-06-18`) MCP server powered by a shared pure-JS core (`mcp/core.js`):
- **Local stdio**: `npx elementum-mcp` (via `mcp/server.js`)
- **Hosted Streamable HTTP (Vercel Edge)**: `https://elementum-sage.vercel.app/mcp` (via `api/mcp.js` + `mcp/edge.js`)

### Available MCP Tools (10 Read-Only Tools)

| Tool Name | Parameters | Purpose |
| :--- | :--- | :--- |
| `list_components` | `{}` | Lists all 109 registered components with tags and descriptions |
| `get_component_doc` | `{ tag, section? }` | Structured metadata (`variants`, `states`, `props`, `constraints`, `examples`, slots, events, parts) from CEM + `mcp/component-metadata.json` |
| `get_component_maturity` | `{ tag }` | Evidence-based maturity tier from test & E2E verification |
| `suggest_component` | `{ query }` | Recommends components for a UI goal |
| `validate_component_usage` | `{ html }` | Validates attributes, closed enum variants, and parent/child constraints |
| `list_tokens` | `{ category }` | Queries design tokens (`color`, `spacing`, `radius`, `all`) |
| `generate_snippet` | `{ tag, variant, size, label, disabled }` | Generates compliant HTML snippets |
| `scaffold_component` | `{ tag, name, description, formAssociated, attributes }` | Generates ready-to-use component boilerplate |
| `lint_accessibility` | `{ html }` | Static HTML accessibility linter (`static-html-lint`) |
| `validate_accessibility` | `{ html }` | Detailed WCAG 2.2 AA static accessibility audit |

### Running & Regenerating MCP Metadata
```bash
# Start stdio server
npx elementum-mcp

# Regenerate separated component metadata after CEM changes
npm run mcp:metadata
```

---

## 8. Headless Behaviors, Agent Runtime, A2UI & Testing Contracts

Prefer reusing Elementum's shared primitives rather than re-implementing interaction or accessibility logic per component (full reference in [docs/behaviors-and-agent.md](./docs/behaviors-and-agent.md)):

- **`@wcomp/elementum/behaviors`**: 16 primitives (`createPressBehavior`, `createRovingFocus`, `createDismissableLayer`, `createFocusRecovery`, `createShortcuts`, `createDisclosureBehavior`, `createPopupPositioner`, `createPresenceBehavior`, `prefersReducedMotion`, `createSelectionBehavior`, `createReorderBehavior`, `createHistory`, `highlightMatch`, `announce`, `setHostState`, `isRTL`).
- **`@wcomp/elementum/agent`**: `snapshot(root)` and `act(root, command)` for Shadow-DOM-piercing agent inspection and interaction.
- **`@wcomp/elementum/a2ui`**: Locked-catalog declarative A2UI JSON surface renderer with two-way micro-signal bindings (`createA2UiSurface`, `DEFAULT_A2UI_CATALOG`).
- **`@wcomp/elementum/ag-ui`**: AG-UI streaming event store & RFC 6902 JSON Patch state deltas.
- **`@wcomp/elementum/testing`**: `checkAriaPattern(el, pattern)`, `checkDirection(el)`, and `checkServerRender(tag, Ctor)`.
- **`unstyled` mode**: Any `<el-*>` element accepts `unstyled` to disable default Shadow DOM stylesheets while keeping ARIA, keyboard behavior, and `data-*` state attributes.

---

## 9. Development & Verification Workflow

See [`AGENTS.md`](./AGENTS.md) for the full **Change → Required Sync Matrix** and release checklist.

```bash
# Run the complete verification pipeline
npm run verify:all

# Individual gates & generators
npm run catalog:diff                 # Verify all 109 components match catalog-data.js
npm run check:release                # Verify version sync across all 12 release files
npm run typecheck                    # Strict TypeScript check on src/index.d.ts
npm run check:size                   # Enforce per-entrypoint gzipped byte budgets (size-budget.json)
npm test                             # Unit, fuzz, behavior, A2UI, MCP & security tests (>= 95% line coverage)
npm run verify:consumer              # Pack .tgz and verify external consumer imports + strict TS
npm run verify:react                 # Verify @wcomp/elementum/react on real React 18 & 19
npm run verify:starters              # Install, typecheck & build all framework starters
npm run test:e2e                     # Playwright + axe-core WCAG 2.2 AA real-browser suite
npm run test:visual                  # Playwright light/dark screenshot regression
npm run quality:report               # Regenerate QUALITY.md
npm run audits:report                # Regenerate AUDITS.md
npm run react:generate               # Regenerate src/react/index.js & index.d.ts
npm run mcp:metadata                 # Regenerate mcp/component-metadata.json
npm run bench:frameworks -- --write  # Re-measure React vs. Vue 3 vs. Vanilla comparison
```

When authoring new features or components:
- Maintain $\ge 95\%$ line coverage across all files and keep gzipped sizes within `size-budget.json`.
- Verify WAI-ARIA patterns (`checkAriaPattern`), RTL (`checkDirection`), and DSD SSR (`checkServerRender`).
- Always expose internal elements through `part="..."` and reflect states with `setHostState` / `data-state`.
