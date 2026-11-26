# @wcomp/elementum

[![npm version](https://img.shields.io/npm/v/@wcomp/elementum.svg)](https://www.npmjs.com/package/@wcomp/elementum)
[![CI](https://github.com/pinguxx/Elementum/actions/workflows/ci.yml/badge.svg)](https://github.com/pinguxx/Elementum/actions/workflows/ci.yml)
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)
![Zero Dependencies](https://img.shields.io/badge/runtime%20deps-0-success)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
[![M8ven Score](https://m8ven.ai/badge/mcp/pinguxx-elementum-yeg3a6?v=f862621d58ec4975d1943f2ea62028c7)](https://m8ven.ai/mcp/pinguxx-elementum-yeg3a6?s=readme)

> **Elementum** (*Latin*: /e.leˈmen.tum/) is a framework-independent UI component library and MCP contract server built on 113 zero-dependency Web Components.

| Component count | Dependencies | Bundle (min+gzip) | Accessibility | License |
| :--- | :---: | :---: | :---: | :---: |
| **113 custom elements** | **0 runtime deps** | **4.77 KB core** · **110.7 KB all 113** | **WCAG 2.2 AA** (`@axe-core/playwright`) | **MIT** |

[**Live Showcase**](https://elementum-sage.vercel.app/) · [**Catalog (113 elements)**](https://elementum-sage.vercel.app/examples/index.html) · [**AG-UI Demo**](https://elementum-sage.vercel.app/examples/ag-ui.html) · [**A2UI Demo**](https://elementum-sage.vercel.app/examples/a2ui.html) · [**WebMCP Demo**](https://elementum-sage.vercel.app/examples/webmcp.html) · [**Live DSD SSR**](https://elementum-sage.vercel.app/ssr) · [**Docs**](https://elementum-sage.vercel.app/docs.html)

## Verification and browser matrix (`v0.8.7`)

- **Core release gate (`npm run verify:all`).** Runs `catalog:diff`, `check:release`, `typecheck`, `check:size`, `verify:formal`, `test` (unit, fuzz, and >= 95% line coverage), `verify:consumer` (packed `.tgz`), `verify:react` (React 18 and 19 SSR/StrictMode), and `test:e2e` (Chromium, Firefox, WebKit Playwright + `axe-core`).
- **Companion workflows.** `npm run audit:api`, `npm run verify:starters`, `npm run test:visual`, `npm run bench:frameworks`, `npm run bench:agents`, `npm run quality:report` ([QUALITY.md](./QUALITY.md)), and `npm run audits:report` ([AUDITS.md](./AUDITS.md)).

| Verification layer | Tooling | Scope |
| :--- | :--- | :--- |
| **Formal invariant verifier** | `npm run verify:formal` | 6 invariants (6,162 states/topologies): 1,440 4-node reactive DAGs, `batch()` fault isolation, `AsyncSignal` self-subscription/races, A2UI cyclic/URL bounds, `ElToaster` active-deck exclusivity, AG-UI `runId`/path isolation |
| **API surface & catalog sync** | `npm run audit:api`, `npm run catalog:diff` | 113 components, 17 FACE controls, canonical variant/size/event naming, source-vs-catalog parity |
| **Unit, fuzz & security suite** | `node:test` + `happy-dom` (Node 20/22/24; Linux, Windows, macOS) | 275+ tests, >= 95% line coverage enforced in CI, 1,000-graph signal fuzzer, XSS/ReDoS/prototype-pollution checks, CodeQL |
| **Gzipped size budgets** | `npm run check:size` (`size-budget.json`) | 90 entrypoints gated in CI (`4.77 KB` min+gzip core, `110.7 KB` min+gzip all 113 components, `2.29 KB` avg unminified component gzip, `38.4 KB` core + behaviors + agent + ssr) |
| **External consumer & React 18/19** | `npm run verify:consumer`, `npm run verify:react` | Real packed `.tgz` install, strict `tsc --noEmit --strict`, React 18 & 19 SSR, StrictMode, and TSX checks |
| **Real browser E2E & WCAG 2.2 AA** | Playwright (Chromium, Firefox, WebKit) + `@axe-core/playwright` | All 113 catalog components, 0/113 dark-mode contrast violations, 10-widget WAI-ARIA APG keyboard suite, zero-JS DSD SSR, AG-UI SSE, A2UI |

## Quick start

### Option A: Zero-build 2-line CDN (HTML, CodePen, Claude Artifacts)

Paste two lines into any HTML file or CodePen with no bundler or `npm install` (pin `@wcomp/elementum@0.8.7` in production):

```html
<link rel="stylesheet" href="https://unpkg.com/@wcomp/elementum/tokens.css" />
<script type="module" src="https://unpkg.com/@wcomp/elementum"></script>
```

### Option B: npm install and one-command setup

```bash
npm install @wcomp/elementum
npx @wcomp/elementum init   # Detects React/Next/Vue/Svelte/Vanilla, writes .mcp.json, .cursor/mcp.json & starter files
```

Import the design tokens CSS and register the Custom Elements in your entry point:

```js
import '@wcomp/elementum/tokens.css';
import '@wcomp/elementum';
```

## Core capabilities

- **113 zero-dependency Web Components.** Shadow DOM with Constructable Stylesheets, WCAG 2.2 AA contrast in light and dark mode, and 17 Form-Associated Custom Elements (`el.form`, native `<form>` submit/reset, `ElementInternals` validation).
- **Fine-grained and async signals.** `signal`, `computed`, `effect`, `batch`, and `asyncSignal` update only the bound DOM text or attribute node without Virtual DOM diffing.
- **Declarative Shadow DOM SSR (`@wcomp/elementum/ssr`).** Pure-Node rendering of `<template shadowrootmode="open">` with zero-JS first paint and client hydration.
- **Headless behaviors & testing (`@wcomp/elementum/behaviors`, `@wcomp/elementum/testing`).** Reusable press, disclosure, roving-focus, dismissable-layer, selection, reorder, spring/FLIP/InView/pointer motion primitives, and WAI-ARIA contract utilities.
- **AI protocol stack (MCP + AG-UI + A2UI).** Build-time MCP contract server (`https://elementum-sage.vercel.app/mcp`), runtime AG-UI SSE store with `runId` isolation and RFC 6902 patch allowlists (`@wcomp/elementum/ag-ui`), and locked-catalog A2UI declarative JSON renderer (`@wcomp/elementum/a2ui`).

## Agent MCP server

Connect Claude Code, Cursor, VS Code, or Windsurf to the hosted Vercel Edge MCP endpoint (0 Node built-ins, 13 read-only tools + resources, prompts & completions):

```bash
claude mcp add --transport http elementum https://elementum-sage.vercel.app/mcp
```

Or run locally over stdio (piped `npx -y @wcomp/elementum` runs the read-only stdio MCP server with zero disk writes, or target `elementum-mcp` / `mcp`):

```json
{
  "mcpServers": {
    "elementum": {
      "command": "npx",
      "args": ["-y", "@wcomp/elementum"]
    }
  }
}
```

Installable agent skills (`npx skills add pinguxx/Elementum`): `elementum`, `elementum-ui`, `elementum-penpot`, `elementum-motion`, `elementum-mobile`, `elementum-unslop`, `elementum-break-ui`.

## Framework starters

Copy-paste starter projects verified in CI (`npm run verify:starters`):

| Starter | Stack | Path |
| :--- | :--- | :--- |
| React 19 + Vite + TypeScript | `@wcomp/elementum/react` typed wrappers | [`starters/react-19/`](./starters/react-19) |
| Next.js App Router (DSD SSR) | Server Components + Declarative Shadow DOM | [`starters/next-app-router/`](./starters/next-app-router) |
| Vue 3 + Vite + TypeScript | Native `el-*` custom elements | [`starters/vue-3/`](./starters/vue-3) |
| Svelte 5 + Vite + TypeScript | Native `el-*` with Runes | [`starters/svelte-5/`](./starters/svelte-5) |
| Angular 19+ (Standalone) | `CUSTOM_ELEMENTS_SCHEMA` + `ngDefaultControl` + WebMCP | [`starters/angular/`](./starters/angular) · [Live Demo](https://angular-wc-e102.vercel.app) |
| Vanilla HTML / AI Chat | Zero-build ES modules + AG-UI | [`starters/vanilla-html/`](./starters/vanilla-html), [`starters/ai-chat/`](./starters/ai-chat) |
| Framework comparison | React 19 vs Vue 3 vs Vanilla LOC & gzip | [`starters/framework-comparison/`](./starters/framework-comparison) |

## Documentation index

| Guide | Topic |
| :--- | :--- |
| [`docs/authoring-components.md`](./docs/authoring-components.md) | Build custom Web Components using `Elementum`, signals, behaviors, and FACE |
| [`docs/events.md`](./docs/events.md) | Custom event bubbling/composition, `e.detail` payloads, Vanilla/React/Vue/Svelte |
| [`docs/theming.md`](./docs/theming.md) | Light/dark theme activation and `--el-*` token overrides |
| [`docs/styling-reference.md`](./docs/styling-reference.md) | Auto-generated `::part()` and CSS custom property reference for all 113 elements |
| [`docs/tailwind-guide.md`](./docs/tailwind-guide.md) | Tailwind CSS `[&::part(...)]:` styling and `unstyled` mode |
| [`docs/framework-integration.md`](./docs/framework-integration.md) | React 18/19, Next.js, Vue 3, Svelte 5, Angular 19+, and Vanilla HTML setup |
| [`docs/migration-guide.md`](./docs/migration-guide.md) | Migrating from Shoelace, Radix, and shadcn/ui |
| [`docs/behaviors-and-agent.md`](./docs/behaviors-and-agent.md) | Headless behaviors (`@wcomp/elementum/behaviors`) and agent runtime (`@wcomp/elementum/agent`) |
| [`docs/a2ui.md`](./docs/a2ui.md) | Declarative A2UI JSON surface renderer and security boundaries |
| [`docs/penpot-workflow.md`](./docs/penpot-workflow.md) | Penpot & Figma design token and MCP codegen workflow |
| [`docs/agent-craft-guide.md`](./docs/agent-craft-guide.md) | UI craft guidelines, component selection matrix, and layout blueprints |
| [`docs/stability-and-1.0.md`](./docs/stability-and-1.0.md) | Pre-1.0 roadmap (`0.9.x` through `0.13.x+`) and SemVer contract |
| [`docs/accessibility-audit.md`](./docs/accessibility-audit.md) | WCAG 2.2 AA automated results and manual NVDA/VoiceOver audit log |
| [`QUALITY.md`](./QUALITY.md) · [`AUDITS.md`](./AUDITS.md) · [`BENCHMARKS.md`](./BENCHMARKS.md) | Automated component maturity matrix, verification ledger, and runtime benchmarks |

## Contributing and license

See [`CONTRIBUTING.md`](./CONTRIBUTING.md), [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md), [`AGENTS.md`](./AGENTS.md), and [`SECURITY.md`](./SECURITY.md). Released under the [MIT License](./LICENSE).
