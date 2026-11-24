# @wcomp/elementum

[![npm version](https://img.shields.io/npm/v/@wcomp/elementum.svg)](https://www.npmjs.com/package/@wcomp/elementum)
[![CI](https://github.com/pinguxx/Elementum/actions/workflows/ci.yml/badge.svg)](https://github.com/pinguxx/Elementum/actions/workflows/ci.yml)
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)
![Zero Dependencies](https://img.shields.io/badge/runtime%20deps-0-success)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
[![M8ven Score](https://m8ven.ai/badge/mcp/pinguxx-elementum-yeg3a6?v=f862621d58ec4975d1943f2ea62028c7)](https://m8ven.ai/mcp/pinguxx-elementum-yeg3a6?s=readme)

> **Elementum** (*Latin*: /e.leˈmen.tum/) is a framework-independent UI component library and MCP contract server built on 109 zero-dependency Web Components.

| Component count | Dependencies | Avg gzip | Accessibility | License |
| ----- | ----- | ----- | ----- | ----- |
| **109 custom elements** | **0 runtime deps** | **2.25 KB** | **WCAG 2.2 AA** (`@axe-core/playwright`) | **MIT** |

[**Live Showcase**](https://elementum-sage.vercel.app/) · [**Catalog (109 elements)**](https://elementum-sage.vercel.app/examples/index.html) · [**AG-UI Demo**](https://elementum-sage.vercel.app/examples/ag-ui.html) · [**A2UI Demo**](https://elementum-sage.vercel.app/examples/a2ui.html) · [**Live DSD SSR**](https://elementum-sage.vercel.app/ssr) · [**Deep Dive (Dev.to)**](https://dev.to/pinguxx/elementum-an-ai-native-ui-platform-with-built-in-mcp-agent-runtime-109-zero-dep-web-components-9oi)

## Verification and browser matrix (`v0.8.6`)

- **Core release gate (`npm run verify:all`).** Runs `catalog:diff`, `check:release`, `typecheck`, `check:size`, `verify:formal` (6,147 states/topologies), `test` (unit, fuzz, and >= 95% line coverage), `verify:consumer` (packed `.tgz` tarball), `verify:react` (React 18 and 19 SSR/StrictMode), and `test:e2e` (3-browser Playwright and `axe-core`).
- **Companion workflows.** `npm run verify:starters` builds and typechecks all framework starters, `npm run test:visual` checks light and dark screenshots, `npm run bench:frameworks` measures React/Vue/Vanilla parity, `npm run bench:agents` scores AI-agent submissions in headless Chromium, and `npm run audits:report` / `npm run quality:report` regenerate [AUDITS.md](https://github.com/pinguxx/Elementum/blob/main/AUDITS.md) and [QUALITY.md](https://github.com/pinguxx/Elementum/blob/main/QUALITY.md).

Every check below runs in CI:

| Verification layer | Tooling | Scope |
| ----- | ----- | ----- |
| **Formal invariant verifier** | `npm run verify:formal` (`tools/verify-formal-invariants.js`) | Exhaustive check of 1,440 4-node reactive DAGs, `batch()` fault isolation, `AsyncSignal` self-subscription and race permutations, A2UI cyclic/URL security bounds, and 4,681 `ElToaster` state paths |
| **Core signals and fuzzing** | `node:test` (`test/signal-torture.test.js`) | Cycle detection, stale-dep cleanup, `AbortSignal` disposal, 1,000-graph multi-seed DAG fuzzer, and 500-step dynamic topology fuzzer |
| **Unit, behavior, and contract suite** | `node:test` + `happy-dom` (Node 20/22/24, Ubuntu, Windows, macOS) | 226+ tests, >= 95% line coverage enforced in CI, WAI-ARIA/RTL/SSR contract checks (`@wcomp/elementum/testing`), source-vs-catalog diff (`npm run catalog:diff`) |
| **Gzipped size budgets** | `npm run check:size` (`size-budget.json`) | 86 entrypoints gated in CI (`core + behaviors + agent + ssr`: 34.9 KB, avg component: 2.25 KB gzip) |
| **External consumer tarball** | `npm run verify:consumer` (`tools/verify-consumer.js`) | Packs real `.tgz`, installs into an isolated temp app, verifies all ESM subpaths and `tsc --noEmit --strict` |
| **Real browser E2E** | Playwright (`npm run test:e2e`) in Chromium, Firefox, WebKit | 30+ E2E tests across 10 specs: all 109 catalog components, 10-widget WAI-ARIA APG keyboard state machines, `<dialog>` focus restoration, `ElementInternals` `<form>` submit/reset, live CSS transitions, AG-UI SSE, and A2UI |
| **Declarative Shadow DOM SSR** | Playwright (`/?hydrate=0` zero-JS and `/?hydrate=1` hydrated) | Native `<template shadowrootmode="open">` attachment with JS disabled plus client hydration |
| **Accessibility** | `@axe-core/playwright` (WCAG 2.2 AA) + `@wcomp/elementum/testing` | Real-browser `axe-core` audits in light and dark mode, WAI-ARIA APG validators, and static MCP `lint_accessibility` |
| **Security and MCP hardening** | `test/security.test.js` + GitHub CodeQL | XSS escaping in `template.js` and `ssr.js`, URL scheme allowlist, prototype-pollution guards, ReDoS-safe parsers, 128 KB MCP payload cap |
| **Performance benchmarks** | `npm run bench` ([BENCHMARKS.md](https://github.com/pinguxx/Elementum/blob/main/BENCHMARKS.md)) | Median and p95 suite with CPU, OS, and Node metadata (`node tools/benchmark.js --write`) |

## Quick start

### Option A: Zero-build 2-line CDN (HTML, CodePen, Claude Artifacts)

Paste two lines into any HTML file or CodePen with no build step, bundler, or `npm install` required (for production, pin a version such as `@wcomp/elementum@0.8.6`):

```html
<link rel="stylesheet" href="https://unpkg.com/@wcomp/elementum/tokens.css" />
<script type="module" src="https://unpkg.com/@wcomp/elementum"></script>
```

Or import individual tree-shakeable components with an ES import map:

```html
<script type="importmap">
  {
    "imports": {
      "@wcomp/elementum": "https://unpkg.com/@wcomp/elementum",
      "@wcomp/elementum/": "https://unpkg.com/@wcomp/elementum/src/"
    }
  }
</script>
<script type="module">
  import '@wcomp/elementum/components/el-button.js';
  import '@wcomp/elementum/components/el-input.js';
</script>
```

### Option B: npm install and one-command setup

```bash
npm install @wcomp/elementum
npx @wcomp/elementum init   # Detects React/Next/Vue/Svelte/Vanilla, writes .mcp.json, .cursor/mcp.json & elementum.rules.md
```

Import the design tokens CSS and register the Custom Elements in your app entry point:

```js
import '@wcomp/elementum/tokens.css';
import '@wcomp/elementum';
```

> Using Tailwind CSS, handling custom events, building custom elements, or migrating from shadcn/Radix? See [**Authoring Components**](docs/authoring-components.md), [**Events Guide**](docs/events.md), [**Tailwind CSS 1-Page Guide**](docs/tailwind-guide.md), [**Auto-Generated `::part()` & Token Reference**](docs/styling-reference.md), [**Migration Guide**](docs/migration-guide.md), and [**Theme Studio**](https://elementum-sage.vercel.app/examples/registry.html#theme-studio).

## Core principles

Elementum uses standard browser APIs with zero runtime dependencies:

* **Shadow DOM by default.** Each component adopts Constructable Stylesheets (`new CSSStyleSheet()`) automatically.
* **Fine-grained and async signals.** `signal`, `computed`, `effect`, `batch`, `asyncSignal`, `isPending`, and `NotReadyError` update only the bound DOM text or attribute node. `asyncSignal` cancels superseded requests with `AbortSignal`, keeps stale-while-revalidate `.value`, and exposes structured `.error` details.
* **Form-Associated Custom Elements (FACE).** `static formAssociated = true` enables native `<form>` submission, reset, and validation through `ElementInternals`.
* **Zero build requirement.** Plain ES modules (`<script type="module">`) run directly in browsers and Node.js SSR without a compiler.
* **Light and dark mode.** CSS custom property tokens support `prefers-color-scheme` and `<el-theme-switch>`.
* **Leak-free lifecycle.** Each component tracks and tears down event listeners and signal subscriptions through `this.signal` (`AbortSignal`).
* **WCAG 2.2 AA compliance.** Components include 24x24px minimum targets, `:focus-visible` outlines, dialog focus restoration, and `ElementInternals.setValidity`.
* **Figma 1:1 parity.** Component attributes and CSS custom properties map directly to Figma Component Variants and Figma Variables.
* **Built-in MCP server.** Ships W3C `custom-elements.json` plus a local stdio and hosted Streamable HTTP MCP server for coding agents.
* **CI and provenance.** GitHub Actions tests Node 20, 22, and 24 across Linux, Windows, and macOS, and publishes to npm with OIDC provenance.

## Component catalog

Selected components below. Browse all 109 elements interactively in the [**Component Catalog**](https://elementum-sage.vercel.app/examples/index.html).

| Component | Tag Name | Description | 
| ----- | ----- | ----- | 
| **Button** | `<el-button>` | 1:1 Figma variant parity (`primary`, `secondary`, `danger`, `ghost`, sizes `sm`/`md`/`lg`). | 
| **Badge** | `<el-badge>` | Status indicator pill (`default`, `success`, `danger`). | 
| **Input** | `<el-input>` | Form-associated input with `prefix` and `suffix` icon slots. | 
| **Dropdown** | `<el-dropdown>` | Popover container with light-dismiss (closes on outside click or &lt;kbd&gt;Esc&lt;/kbd&gt;). | 
| **Calendar** | `<el-calendar>` | Standalone 42-day accessible month grid with traversal. | 
| **Datepicker** | `<el-datepicker>` | Form-associated composite datepicker combining input, dropdown, calendar, and quick actions. | 
| **Dialog / Modal** | `<el-dialog>` | Native `<dialog>` modal with backdrop blur, overscroll containment, and light-dismiss. | 
| **Tabs** | `<el-tabs>`, `<el-tab>` | W3C accessible tablist with keyboard arrow navigation. | 
| **Select** | `<el-select>` | Form-associated custom dropdown selection. | 
| **Switch** | `<el-switch>` | Form-associated toggle switch with keyboard navigation (&lt;kbd&gt;Space&lt;/kbd&gt;/&lt;kbd&gt;Enter&lt;/kbd&gt;). | 
| **Tooltip** | `<el-tooltip>` | Lightweight tooltip bubble with top/bottom/left/right placement. | 
| **Accordion** | `<el-accordion>`, `<el-accordion-item>` | W3C accessible disclosure accordion supporting single or multi-expand. | 
| **Table** | `<el-table>` | Signal-driven data grid with column sorting and multi-row selection. | 
| **Theme Switch** | `<el-theme-switch>` | Toggles between Light ☀️ and Dark 🌙 mode with `localStorage` persistence. | 
| **Toast** | `<el-toaster>` | Viewport overlay for programmatic notifications (`toast.success()`, `toast.error()`). | 
| **Progress** | `<el-progress>` | Determinate & indeterminate animated progress bar (`role="progressbar"`). | 
| **Spinner** | `<el-spinner>` | Accessible SVG loading spinner (`role="status"`). | 
| **Avatar** | `<el-avatar>`, `<el-avatar-group>` | User avatar with image fallback, automatic initials, and status dot. | 
| **Drawer** | `<el-drawer>` | Slide-over drawer overlay (`left`, `right`, `top`, `bottom`) with focus trap. | 
| **Segmented** | `<el-segmented-control>` | Form-associated pill switcher with keyboard arrow navigation. | 
| **Pagination** | `<el-pagination>` | Accessible numeric page navigation with ellipsis windowing and `pagechange` events. | 
| **Chip / Pill** | `<el-chip>` | Interactive tag with `selectable` and `removable` dismiss modes (`role="button"`). | 
| **Autocomplete** | `<el-autocomplete>` | Form-associated combobox supporting single or multiselect (`multiple`) with inline chips, remote URL debouncing, and ARIA 1.2 / WCAG 2.2 accessibility. | 
| **Number Flow** | `<el-number-flow>` | Smooth vertical rolling odometer number reels (*NumberFlow* style) with physical easing and reduced-motion fallback. | 
| **OTP Input** | `<el-otp-input>` | Form-associated segmented PIN / verification code input with auto-advance, backspace retreat, and paste splitting. | 
| **Command Palette** | `<el-command>` | Accessible keyboard-first command menu (*cmdk* style) with &lt;kbd&gt;⌘K&lt;/kbd&gt; / &lt;kbd&gt;Ctrl+K&lt;/kbd&gt; shortcut, fuzzy search, and group headers. | 
| **Prompt Input** | `<el-prompt-input>` | Beautiful UI-style auto-expanding AI prompt composer with action bar slots, model chips, and Enter-to-submit handling. | 
| **Reasoning Card** | `<el-reasoning-card>` | Collapsible AI thought disclosure with active breathing pulse dot, elapsed duration timer, and smooth accordion expansion. | 
| **Border Beam** | `<el-border-beam>` | Hardware-accelerated luminous gradient ray traveling around container perimeters (Magic UI style). | 
| **Streaming Text** | `<el-streaming-text>` | Organic token-by-token streaming typewriter text with customizable cadence, blinking cursor, and completion events. | 

## Interactive Examples & Showcase

* [examples/ledgerflow.html](https://github.com/pinguxx/Elementum/blob/main/examples/ledgerflow.html): **LedgerFlow (Penpot → MCP Generated App)**: End-to-end fintech dashboard designed in [**Penpot**](https://design.penpot.app/?screen=viewer&file-id=42288968-6e5e-808d-8008-f77162b618ca&page-id=d8ded059-05ee-80c0-8008-f774c97dd053&section=interactions&index=0&share-id=8218fc5e-f68d-4bab-8fd7-283dd92586e8) and compiled via `npm run penpot:generate` into 15 validated Elementum Web Components (`<el-number-flow>`, `<el-chart>`, `<el-meter>`, `<el-drawer>`, `<el-dialog>`, `<el-toaster>`).

* [examples/references.html](https://github.com/pinguxx/Elementum/blob/main/examples/references.html): **Reference Hub (UI Craft Patterns)**: Real-world patterns reconstructed from curated galleries (SaaS Pricing with rolling odometers & border beams, Linear-style command menu, and segmented PIN auth).

* [examples/agent-studio.html](https://github.com/pinguxx/Elementum/blob/main/examples/agent-studio.html): **AI Agent Studio & Command Center** demonstrating `<el-command>` (⌘K), `<el-prompt-input>`, `<el-reasoning-card>`, `<el-number-flow>` live token odometer, `<el-otp-input>` security key authorization, and `<el-border-beam>`.

* [index.html](https://github.com/pinguxx/Elementum/blob/main/index.html): Interactive landing portal directing to the applications. Run `npm run serve` to launch locally.

* [examples/app.html](https://github.com/pinguxx/Elementum/blob/main/examples/app.html): Complete **Pulse Cloud** showcase dashboard demonstrating native form validation, confirmation modal dialogs, toast notifications, tabs, and theme toggling.

* [examples/index.html](https://github.com/pinguxx/Elementum/blob/main/examples/index.html): Interactive component catalog with live prop editors and signal-reactive previews.

* [starters/framework-comparison/README.md](https://github.com/pinguxx/Elementum/blob/main/starters/framework-comparison/README.md): **3-Way Framework Comparison (React vs. Vue 3 vs. Vanilla)** implementing the identical Team Directory app across all three stacks (`npm run bench:frameworks`).

* [showcase.html](https://github.com/pinguxx/Elementum/blob/main/showcase.html): **Showcase & Starter Hub** linking all reference applications, starter templates (`npm run verify:starters`), and framework parity benchmarks.

## Headless Behaviors, Agent Runtime & Testing Contracts

Beyond 109 ready-to-use styled Web Components (all supporting opt-in `unstyled` headless mode), Elementum exports three focused zero-dependency subpaths:

* **`@wcomp/elementum/behaviors`** — 15 composable interaction, focus, motion, and overlay primitives (`createPressBehavior`, `createRovingFocus`, `createDismissableLayer`, `createFocusRecovery`, `createShortcuts`, `createDisclosureBehavior`, `createPopupPositioner`, `createPresenceBehavior`, `prefersReducedMotion`, `createSelectionBehavior`, `createReorderBehavior`, `highlightMatch`, `announce`, `setHostState`, `isRTL`).

* **`@wcomp/elementum/agent`** — Shadow-DOM-piercing `snapshot(root)` and `act(root, command)` so AI agents can inspect live UI state and execute semantic actions (`click`, `type`, `toggle`, `open`, `close`) without brittle DOM scraping.

* **`@wcomp/elementum/testing`** — Reusable WAI-ARIA APG (`checkAriaPattern`), provider-free RTL (`checkDirection`), and DSD SSR (`checkServerRender`) contract validators.

See [docs/behaviors-and-agent.md](https://github.com/pinguxx/Elementum/blob/main/docs/behaviors-and-agent.md) for full API examples.

## Design Engineering & Agent Guides

### Installable Agent Skills (`npx skills add`)

Install Elementum's modular AI coding skills directly into Antigravity, Claude Code, Cursor, or Gemini CLI (configured via [skills.sh.json](https://github.com/pinguxx/Elementum/blob/main/skills.sh.json)):

```
npx skills@latest add pinguxx/Elementum --skill elementum

```

Included skills under [skills/](https://github.com/pinguxx/Elementum/tree/main/skills):

* **`elementum`**: Canonical platform skill covering components, `unstyled` mode, `@wcomp/elementum/behaviors`, `@wcomp/elementum/agent`, `@wcomp/elementum/testing`, and DSD SSR.

* **`elementum-ui`**: Composing Elementum's 109 Web Components, signals, FACE forms, and AG-UI streams.

* **`elementum-motion`**: Shadow DOM motion physics, sub-300ms `ease-out`, origin-aware overlays, and reduced-motion standards.

* **`elementum-break-ui`**: Adversarial stress-testing checklist (320px mobile, dark mode hover contrast, keyboard-only, extreme content).

* **`elementum-mobile`**: Mobile-native CSS standards (`touch-action`, `100dvh`, safe areas, `overscroll-behavior`, iOS 16px input zoom prevention).

* **`elementum-penpot`**: Two-way Penpot MCP design system sync and Penpot-to-Elementum app codegen.

* [docs/behaviors-and-agent.md](https://github.com/pinguxx/Elementum/blob/main/docs/behaviors-and-agent.md): API reference for `@wcomp/elementum/behaviors`, `@wcomp/elementum/agent`, and `@wcomp/elementum/testing`.

* [docs/penpot-workflow.md](https://github.com/pinguxx/Elementum/blob/main/docs/penpot-workflow.md): Free & open-source design token workflow with Penpot (W3C DTCG JSON) and automated compilation.

* [docs/agent-craft-guide.md](https://github.com/pinguxx/Elementum/blob/main/docs/agent-craft-guide.md): Simple guidelines for better UI development — practical visual hierarchy, motion, accessibility, mobile, and AI UI patterns for developers and coding agents.

* [docs/theming.md](https://github.com/pinguxx/Elementum/blob/main/docs/theming.md): Complete design tokens, CSS custom properties, and `::part()` customization guide.

## Framework Integration & Starters

`@wcomp/elementum` works natively in vanilla HTML, React 18/19 (including official auto-generated React wrappers via `@wcomp/elementum/react`), Vue 3, Svelte 5, and Next.js. See [docs/framework-integration.md](https://github.com/pinguxx/Elementum/blob/main/docs/framework-integration.md), [docs/migration-guide.md](https://github.com/pinguxx/Elementum/blob/main/docs/migration-guide.md), and the [Live App Showcase](https://github.com/pinguxx/Elementum/blob/main/showcase.html).

### Copy-Paste Starter Projects

Clone or copy complete, runnable templates from [**`starters/`**](https://github.com/pinguxx/Elementum/tree/main/starters):

| Starter | Stack | Live Demo | Description |
| ------- | ----- | --------- | ----------- |
| [**vanilla-html**](https://github.com/pinguxx/Elementum/tree/main/starters/vanilla-html) | HTML5 + unpkg CDN | [Live Demo](https://elementum-sage.vercel.app/starters/vanilla-html/index.html) | Zero-build Custom Elements with fine-grained micro-signals counter & dialog. |
| [**next-app-router**](https://github.com/pinguxx/Elementum/tree/main/starters/next-app-router) | Next.js 16 / React 19 | [Live Demo](https://elementum-next-dsd.vercel.app) | Pure Node.js Declarative Shadow DOM SSR (`renderComponentToDSD`) with zero CLS. |
| [**react-19**](https://github.com/pinguxx/Elementum/tree/main/starters/react-19) | React 19 + TypeScript + Vite | — | Native Custom Elements properties, boolean attributes, and event handling. |
| [**vue-3**](https://github.com/pinguxx/Elementum/tree/main/starters/vue-3) | Vue 3 + Vite | — | Native Custom Elements integration with `compilerOptions.isCustomElement`. |
| [**svelte-5**](https://github.com/pinguxx/Elementum/tree/main/starters/svelte-5) | Svelte 5 (Runes) + Vite | — | Zero-wrapper Svelte 5 Runes integration with Elementum Custom Elements. |
| [**ai-chat**](https://github.com/pinguxx/Elementum/tree/main/starters/ai-chat) | HTML5 + AI Specialist Elements | [Live Demo](https://elementum-sage.vercel.app/starters/ai-chat/index.html) | Agent UI with `<el-prompt-input>`, `<el-reasoning-card>`, `<el-tool-call>`, and `<el-streaming-text>`. |
| [**framework-comparison**](https://github.com/pinguxx/Elementum/tree/main/starters/framework-comparison) | React vs. Vue 3 vs. Vanilla | [React](https://elementum-comparison-react.vercel.app) · [Vue](https://elementum-comparison-vue.vercel.app) · [Vanilla](https://elementum-sage.vercel.app/starters/framework-comparison/vanilla/index.html) | Same Team Directory app built 3 ways with measured LOC, gzip size, and ergonomics. |

### Quick Framework Snippets

#### React 19
React 19 supports Custom Elements natively—attributes, properties, and standard events pass directly:

```tsx
import '@wcomp/elementum/tokens.css';
import '@wcomp/elementum';

export function QuickForm() {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <el-input placeholder="Enter query..." />
      <el-button variant="primary" onClick={() => alert('Submitted!')}>
        Submit
      </el-button>
    </div>
  );
}
```

#### Vue 3
Configure Vue's compiler to treat `el-*` tags as custom elements in `vite.config.js`:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('el-')
        }
      }
    })
  ]
});
```

* **Stability & `1.0.0` Roadmap**: See [docs/stability-and-1.0.md](https://github.com/pinguxx/Elementum/blob/main/docs/stability-and-1.0.md) for SemVer guarantees and per-subpath maturity tiers.

## Project Structure

```
Elementum/
├── .github/workflows/
│   ├── ci.yml                 # Multi-OS/Node CI: coverage >= 95%, strict TS, size budgets, tarball & 3-browser E2E
│   └── publish.yml            # OIDC Trusted Publishing with provenance on GitHub release
├── api/
│   ├── mcp.js                 # Vercel Serverless Streamable HTTP MCP endpoint (/mcp)
│   └── ssr.js                 # Vercel Serverless Declarative Shadow DOM SSR endpoint (/ssr)
├── src/
│   ├── signal.js              # Fine-grained signals with cycle detection & re-entrancy guards
│   ├── template.js            # Tagged template engine (html, svg, css, surgical DOM parts)
│   ├── elementum.js           # Base class: Shadow DOM, Constructable Stylesheets, unstyled mode, FACE
│   ├── ssr.js                 # Pure Node.js Declarative Shadow DOM SSR
│   ├── ag-ui.js               # AG-UI streaming event store & RFC 6902 JSON Patch
│   ├── a2ui.js                # Declarative A2UI JSON surface renderer (see docs/a2ui.md)
│   ├── behaviors/index.js     # 15 composable headless interaction, focus, motion & overlay behaviors
│   ├── agent/index.js         # Shadow-DOM-piercing agent runtime bridge (snapshot, act)
│   ├── testing/index.js       # WAI-ARIA APG, RTL & DSD SSR contract validators
│   ├── tokens.css             # Light & Dark W3C DTCG CSS custom properties
│   ├── index.js / index.d.ts  # Public exports & strict TypeScript definitions
│   └── components/            # 109 zero-dependency Custom Elements (avg 2.19 KB gzip)
├── docs/                      # behaviors-and-agent.md, theming.md, framework-integration.md, penpot-workflow.md
├── skills/ & skills.sh.json   # Installable AI agent skills (npx skills@latest add pinguxx/Elementum)
├── mcp/server.js              # Hardened Model Context Protocol stdio & HTTP server (elementum-mcp)
├── tools/                     # check-size.js, verify-consumer.js, generate-quality-report.js, audit-catalog-diff.js, benchmark.js
├── size-budget.json           # Per-entrypoint gzipped byte budgets enforced in CI
├── custom-elements.json       # W3C Custom Elements Manifest (109 tags)
├── QUALITY.md                 # Auto-generated evidence-based per-component maturity matrix
├── e2e/                       # Playwright + @axe-core/playwright real-browser tests
└── test/                      # 226+ Node.js unit, fuzz, behavior, contract & security tests

```

## 🎨 Theming & Accessibility (WCAG 2.2)

* **Theming Guide**: See [docs/theming.md](https://github.com/pinguxx/Elementum/blob/main/docs/theming.md) for the full catalog of design tokens and exposed CSS `::part()` selectors.

* **Agent Guide**: See [AGENT\_GUIDE.md](https://github.com/pinguxx/Elementum/blob/main/AGENT_GUIDE.md) for guidelines on building, testing, and reviewing Elementum components.

* **Framework Integration**: See [docs/framework-integration.md](https://github.com/pinguxx/Elementum/blob/main/docs/framework-integration.md) for React, Vue, Svelte, and Angular setup.

## 🚀 Declarative Shadow DOM (DSD) SSR

Elementum includes built-in server-side rendering support emitting standard `<template shadowrootmode="open">` for zero-CLS first paint in Next.js, Nuxt, Astro, and Node.js:

```
import { renderComponentToDSD } from '@wcomp/elementum/ssr';
import { ElButton } from '@wcomp/elementum';

// Outputs HTML with Declarative Shadow DOM and encapsulated styles
const html = renderComponentToDSD('el-button', ElButton, { variant: 'primary' }, 'Submit');

```

Include `data-dsd` on the document root (`<html lang="en" data-dsd>`) so `tokens.css` FOUC rules (`:root:not([data-dsd]) :not(:defined)`) do not hide pre-rendered Shadow DOM components in zero-JS or pre-hydration states.

Run the live zero-dependency Node.js SSR server (`?hydrate=0` for pure Zero-JS DSD, `?hydrate=1` for progressive hydration) or view the pre-rendered snapshot [examples/ssr-demo.html](https://github.com/pinguxx/Elementum/blob/main/examples/ssr-demo.html):

```
npm run ssr

```

## Penpot & Figma Design System Sync

### Code → Penpot (MCP Server Sync)

Generate all **73 W3C DTCG tokens** (Core, Light, Dark sets), **43 library colors**, and **109 Master Components** (across 8 categories) directly inside an open [**Penpot**](https://design.penpot.app) file connected via the Penpot MCP Plugin:

```
npm run penpot:mcp -- --url "https://design.penpot.app/mcp/stream?userToken=<YOUR_TOKEN>"
# Or via environment variable:
PENPOT_MCP_URL="https://design.penpot.app/mcp/stream?userToken=<YOUR_TOKEN>" npm run penpot:mcp

```

### Penpot / Figma → Code (Token Compiler)

Synchronize exported W3C DTCG tokens from `tokens/penpot-tokens.json` (or `tokens/figma-tokens.json`) into `src/tokens.css`:

```
npm run tokens:sync tokens/penpot-tokens.json

```

See [docs/penpot-workflow.md](https://github.com/pinguxx/Elementum/blob/main/docs/penpot-workflow.md) for full setup instructions, CLI flags (`--url`, `--token`, `--dry-run`), and Penpot MCP security notes.

## Agent MCP Server

### One-Click & Copy-Paste Setup (Hosted Edge Endpoint — 100/100 on `mcptry.com`)

Endpoint: **`https://elementum-sage.vercel.app/mcp`** (Streamable HTTP, zero install required).

- **Cursor (One-Click)**: [Install in Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=elementum&config=eyJ1cmwiOiJodHRwczovL2VsZW1lbnR1bS1zYWdlLnZlcmNlbC5hcHAvbWNwIn0%3D) or add to `.cursor/mcp.json`:
  ```json
  { "mcpServers": { "elementum": { "url": "https://elementum-sage.vercel.app/mcp" } } }
  ```
- **Claude Code**:
  ```bash
  claude mcp add --transport http elementum https://elementum-sage.vercel.app/mcp
  ```
- **VS Code Copilot (`.vscode/mcp.json`)**:
  ```json
  { "servers": { "elementum": { "type": "http", "url": "https://elementum-sage.vercel.app/mcp" } } }
  ```
- **Windsurf / Antigravity (`.mcp.json`)**:
  ```json
  { "mcpServers": { "elementum": { "url": "https://elementum-sage.vercel.app/mcp" } } }
  ```
- **Auto-configure any repo + drop-in rules**: Run `npx @wcomp/elementum init` or copy [`docs/agent-rules-snippet.md`](docs/agent-rules-snippet.md) into `CLAUDE.md` / `.cursorrules`.
- **Stdio-only proxy**: `npx mcp-remote https://elementum-sage.vercel.app/mcp`

### Local (stdio)

Run the built-in MCP server locally for AI coding agents:

```
node mcp/server.js
# Or via package bin
npx elementum-mcp

```

Exposed tools (11 read-only tools):

* `list_components`: Lists all 109 components in Elementum

* `get_component_doc`: Retrieves attributes, slots, events, and CSS parts from `custom-elements.json`

* `get_component_maturity`: Reports evidence-based maturity tier (`production-verified`, `stable`, `experimental`)

* `suggest_component`: Recommends components for a given UI goal

* `validate_component_usage`: Checks HTML markup against declared attributes, closed enums, and parent/child slot rules

* `validate_a2ui_messages`: Validates declarative A2UI v0.8/v0.9 JSON message arrays against `DEFAULT_A2UI_CATALOG`, checking missing root/child IDs, cycles, and unsafe URLs

* `list_tokens`: Queries design tokens by category (color, spacing, radius)

* `get_theme_tokens`: Returns light & dark CSS custom property token values

* `generate_snippet`: Generates valid markup in `html`, `react` (`@wcomp/elementum/react`), `vue`, or `a2ui` JSON formats

* `scaffold_component`: Scaffolds standard boilerplate code for new components

* `lint_accessibility`: Static HTML accessibility linter (`static-html-lint`; pair with Playwright `axe-core` for full WCAG verification)

## Contributing & License

Issues and pull requests are welcome on [GitHub](https://github.com/pinguxx/Elementum/issues).

Licensed under the [MIT License](https://github.com/pinguxx/Elementum/blob/main/LICENSE).
