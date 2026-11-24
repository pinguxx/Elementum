---
name: elementum
description: Build zero-dependency, signal-driven, accessible Web Components and AI-operable interfaces with @wcomp/elementum (components, behaviors, agent runtime, testing contracts, and Declarative Shadow DOM SSR).
---

# Elementum (`@wcomp/elementum`)

Elementum is a zero-runtime-dependency, signal-driven Web Components UI platform with 113 custom elements, standalone headless behaviors, Declarative Shadow DOM SSR, AG-UI streaming, and a Shadow-DOM-aware agent runtime bridge.

## Installation & Subpath Exports

```bash
npm install @wcomp/elementum
```

- `@wcomp/elementum` — Core runtime (`Elementum`, `html`, `css`, `signal`, `computed`, `effect`) + all components + behaviors
- `@wcomp/elementum/components/<tag>` — Tree-shakeable single component import (e.g. `@wcomp/elementum/components/el-dialog`)
- `@wcomp/elementum/behaviors` — Headless interaction, focus, motion, overlay, selection, and i18n primitives
- `@wcomp/elementum/agent` — Shadow-DOM-piercing `snapshot(root)` & `act(root, command)` for AI agents
- `@wcomp/elementum/testing` — WAI-ARIA APG (`checkAriaPattern`), RTL (`checkDirection`), and DSD SSR (`checkServerRender`) validators
- `@wcomp/elementum/ssr` — Pure Node.js Declarative Shadow DOM (`renderComponentToDSD`, `renderTemplateToString`)
- `@wcomp/elementum/ag-ui` — AG-UI streaming event store (`createAgUiStore`, `applyJsonPatch`)
- `@wcomp/elementum/tokens.css` — Design tokens (`--el-*`) with light & `[data-theme="dark"]` palettes

## Core Patterns

### 1. Native Web Components (Works in React, Vue, Svelte, Solid, and Plain HTML)
```html
<el-button variant="primary">Save</el-button>
<el-dialog heading="Invite Member">
  <el-input label="Email" name="email" type="email" required></el-input>
  <el-button slot="footer" variant="primary">Send Invite</el-button>
</el-dialog>
```

### 2. Headless `unstyled` Mode + Composable Behaviors
Add `unstyled` to any `<el-*>` element to strip default Shadow DOM styles while keeping ARIA, keyboard navigation, and `data-state` / `data-starting-style` / `data-ending-style` hooks:
```js
import {
  createPressBehavior,
  createRovingFocus,
  createDismissableLayer,
  createFocusRecovery,
  createShortcuts,
  createDisclosureBehavior,
  createPopupPositioner,
  createPresenceBehavior,
  prefersReducedMotion,
  createSelectionBehavior,
  createReorderBehavior,
  highlightMatch,
  announce,
} from '@wcomp/elementum/behaviors';
```

### 3. Shadow-DOM Agent Runtime (`@wcomp/elementum/agent`)
```js
import { snapshot, act } from '@wcomp/elementum/agent';

const tree = snapshot(document.body);
act(document.body, { role: 'textbox', name: 'Email', action: 'type', value: 'ada@example.com' });
act(document.body, { role: 'button', name: 'Send Invite', action: 'click' });
```

### 4. WAI-ARIA, RTL & SSR Verification (`@wcomp/elementum/testing`)
```js
import { checkAriaPattern, checkDirection, checkServerRender } from '@wcomp/elementum/testing';
```

## Rules for Agents Writing Elementum Code
1. Always inspect `custom-elements.json` (or use the `elementum-mcp` server) before guessing component attributes or events.
2. Prefer native `<el-form>` + form-associated components (`el-input`, `el-select`, `el-checkbox`, `el-switch`, `el-slider`, `el-textarea`, `el-autocomplete`).
3. Respect `prefers-reduced-motion` via `prefersReducedMotion()` and `createPresenceBehavior()`.
4. Never use `innerHTML` with untrusted strings; Elementum's `html` tagged template and `highlightMatch()` escape dynamic values automatically.
