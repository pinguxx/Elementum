# Elementum Architecture & Internal Agent Guide

> Operational sync rules and release checklists live in [`AGENTS.md`](./AGENTS.md). Consumer-facing component authoring lives in [`docs/authoring-components.md`](./docs/authoring-components.md). UI craft guidelines live in [`docs/agent-craft-guide.md`](./docs/agent-craft-guide.md).

---

## 1. Core Architecture

`@wcomp/elementum` is a zero-dependency Web Components library built directly on browser standards:

- **Shadow DOM + Constructable Stylesheets (`src/elementum.js`)**: Every component extending `Elementum` adopts `static styles = css\`...\`` via `adoptedStyleSheets` (falling back to `<style>` when unsupported) and exposes `this.signal` (`AbortSignal`) for automatic listener/behavior cleanup on `disconnectedCallback()`.
- **Tagged Template Engine (`src/template.js`)**: Compiles `html\`...\`` once per template literal and binds fine-grained text, attribute (`?bool`, `.prop`, `@event`), and cross-realm `Node`/`DocumentFragment` slots with zero Virtual DOM diffing.
- **Declarative Shadow DOM SSR (`src/ssr.js`)**: Pure-Node renderer emitting `<template shadowrootmode="open">` with zero browser globals.
- **Subpath Exports (`package.json`)**: Core (`@wcomp/elementum`), tokens (`tokens.css`), individual components (`components/*`), React wrappers (`react`), SSR (`ssr`), headless behaviors (`behaviors`), agent runtime (`agent`), AG-UI (`ag-ui`), A2UI (`a2ui`), and testing contracts (`testing`).

---

## 2. Reactivity Engine (`src/signal.js`)

Exports: `signal`, `computed`, `effect`, `batch`, `asyncSignal`, `isSignal`, `isPending`, `NotReadyError`.

### Non-negotiable reactivity rules

1. **Always wrap reactive template expressions in arrow functions:** Write `${() => this.count.value}`, never `${this.count.value}`.
2. **Batch multi-signal writes:** Use `batch(() => { a.value = 1; b.value = 2; })` so downstream effects run once and never observe intermediate states. `batch()` flushes all queued subscribers before rethrowing the first uncaught error.
3. **Use `.peek()` inside non-tracking reads:** Reading `.value` inside an `effect()` or `computed()` subscribes the active effect; `.peek()` reads without subscribing.
4. **Async race safety:** `asyncSignal(fetcher)` cancels superseded runs via `AbortSignal`, preserves stale-while-revalidate `.value`, ignores out-of-order settlements from older `runId`s, and strips self-subscriptions to `[this, this.pending, this.status, this.error]`.

---

## 3. Component & Accessibility Rules

1. **Authoring new components:** Follow [`docs/authoring-components.md`](./docs/authoring-components.md) or scaffold with `npm run create`.
2. **Dark-mode safety:** Never write `:root[data-theme="dark"]` inside Shadow DOM CSS (`:root` matches nothing in a ShadowRoot). Prefer `--el-*` CSS custom properties (`--el-surface-card`, `--el-text-primary`, `--el-color-primary-text`) so Chromium, Firefox, and Safari render identically.
3. **FACE controls:** Set `static formAssociated = true` and call `this.setFormValue(...)`. `Elementum` provides `el.form`, `formResetCallback()`, `formDisabledCallback()`, and `ElementInternals` validity automatically.
4. **WCAG 2.2 AA & Motion:** Minimum 24x24px hit targets, visible `:focus-visible` outlines, no `transition: all`, and `@media (prefers-reduced-motion: reduce)` whenever `@keyframes` is declared.
5. **Security:** Never inject untrusted strings into `innerHTML`. Use `textContent`, `document.createTextNode`, or `html\`...\`` text bindings.

---

## 4. MCP Server Internals (`mcp/` & `api/mcp.js`)

- **`mcp/core.js` & `mcp/edge.js`:** Pure JavaScript with **zero Node built-ins** (no `node:fs`, `Buffer`, `readline`) so the same 11 read-only tools run locally over stdio (`mcp/server.js`) and remotely on Vercel Edge (`api/mcp.js`).
- **No ES2025 import attributes in `api/mcp.js`:** Do not use `with { type: 'json' }` (Vercel Edge esbuild rejects it).
- **11 read-only tools:** `list_components`, `get_component_doc`, `list_tokens`, `generate_snippet`, `scaffold_component`, `lint_accessibility`, `validate_accessibility`, `suggest_component`, `validate_component_usage`, `validate_a2ui_messages`, `get_component_maturity`.
- After editing component attributes, events, or slots, regenerate metadata:
  ```bash
  npm run react:generate && npm run mcp:metadata && npm run docs:styling && npm run docs:ide
  ```

---

## 5. Verification Commands

```bash
npm run verify:formal    # 6 formal invariants (6,162 states/topologies across signal, a2ui, ag-ui, el-toast)
npm run audit:api        # 109-component API surface & 17-FACE consistency audit
npm run catalog:diff     # Source observedAttributes vs custom-elements.json & catalog-data.js
npm run check:size       # 86 entrypoints against size-budget.json
npm run check:release    # Version sync across lockfile, server.json, docs, HTML badges, Penpot tools
npm run verify:all       # Full local release gate (tests >= 95% coverage, consumer, React 18/19, E2E)
```
