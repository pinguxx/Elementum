# @wcomp/elementum

[![CI](https://github.com/pinguxx/Elementum/actions/workflows/ci.yml/badge.svg)](https://github.com/pinguxx/Elementum/actions/workflows/ci.yml)
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)
![Zero Dependencies](https://img.shields.io/badge/runtime%20deps-0-success)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

> **Elementum** (*Latin*: /e.leˈmen.tum/) — **An AI-native, framework-independent UI engineering platform** built on standard Custom Elements, fine-grained micro-signals, W3C DTCG tokens, Declarative Shadow DOM SSR, and MCP/AG-UI tooling.
>
> **Live Showcase:** https://elementum-sage.vercel.app/ · **Catalog (109 elements):** https://elementum-sage.vercel.app/examples/index.html · **AG-UI Demo:** https://elementum-sage.vercel.app/examples/ag-ui.html · **Live DSD SSR:** https://elementum-sage.vercel.app/ssr

---

## 🧪 Verification & Browser Matrix (Beta — `v0.2.0`)

Every architectural claim in Elementum is backed by automated verification in CI:

| Verification Layer | Tooling | Scope |
| :--- | :--- | :--- |
| **Core Signals & Fuzzing** | `node:test` (`test/signal-torture.test.js`) | Cycle detection, stale-dep cleanup, AbortSignal disposal, 100-graph randomized DAG fuzzer |
| **Unit & Contract Suite** | `node:test` + `happy-dom` (Node 20/22/24, Ubuntu & Windows) | **208+ tests**, **≥ 95% line coverage**, automated Source-vs-Catalog Diff (`npm run catalog:diff`) |
| **Real Browser E2E** | Playwright (`npm run test:e2e`) — Chromium, Firefox, WebKit | Native `<dialog>` focus restoration, `ElementInternals` `<form>` submit/reset, mobile `375px` overflow, AG-UI SSE |
| **Declarative Shadow DOM SSR** | Playwright (`/?hydrate=0` Zero-JS & `/?hydrate=1` Hydrated) | Native `<template shadowrootmode="open">` attachment with JS disabled + clean client hydration |
| **Accessibility** | `@axe-core/playwright` (WCAG 2.2 AA ruleset) + MCP `lint_accessibility` | Automated real-browser `axe-core` checks on Home, AG-UI, and SSR pages |
| **Security & MCP Hardening** | `test/security.test.js` | XSS escaping in `template.js` & `ssr.js`, URL sanitization, prototype-pollution guards, 128 KB MCP payload cap |
| **Performance Benchmarks** | `npm run bench` (`tools/benchmark.js`) | 10,000 signal updates in ~7 ms · 1,000 DSD SSR renders in ~15 ms · 1,000 DOM mounts in ~60 ms |

---

## ⚡ Quick Start

Elementum runs directly in any modern browser without Webpack, Vite, or Babel.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- 1. Include Design Tokens -->
  <link rel="stylesheet" href="https://unpkg.com/@wcomp/elementum/tokens.css" />

  <!-- 2. Import Component Library -->
  <script type="module" src="https://unpkg.com/@wcomp/elementum"></script>
</head>
<body>
  <!-- Native Form with Form-Associated Custom Elements -->
  <form id="my-form">
    <el-input name="username" placeholder="Enter username...">
      <span slot="prefix">👤</span>
    </el-input>

    <el-select name="role" value="member">
      <option value="member">Team Member</option>
      <option value="admin">Administrator</option>
    </el-select>

    <el-button type="submit" variant="primary">Save Changes</el-button>
  </form>
</body>
</html>
```

---

## 💡 Core Principles

`Elementum` is inspired by minimalist libraries like `uce`, modernizing the developer experience with standard browser primitives:
- **Shadow DOM by default** with automatic Constructable Stylesheet adoption (`new CSSStyleSheet()`).
- **Fine-grained micro-signals** (`signal`, `computed`, `effect`): state updates mutate **only the exact bound DOM text or attribute node**—the component never re-renders, preserving child component state and input focus.
- **Form-Associated Custom Elements (FACE)**: `static formAssociated = true` enables native `<form>` submission, reset, and validation via `ElementInternals`.
- **Zero build requirement**: Plain ES modules (`<script type="module">`), no Babel, decorators, or compile step needed. Runs in SSR / Node.js cleanly.
- **Light & Dark Mode**: Built-in CSS custom property theme tokens with automatic `prefers-color-scheme` and `<el-theme-switch>`.
- **Leak-free lifecycle**: Automatically tracks and tears down event listeners and signal subscriptions via `this.signal` (`AbortSignal`).
- **WCAG 2.2 AA Compliant**: Built-in 24x24px minimum target sizes, high-contrast `:focus-visible` rings, dialog focus preservation, and HTML5 Constraint Validation API (`ElementInternals.setValidity`).
- **Figma 1:1 Parity**: Direct mapping to Figma Component Variants and Figma Variables.
- **AI Agent & MCP Ready**: Generates standard W3C `custom-elements.json` and includes a built-in MCP server for coding agents.
- **CI/CD & Automation**: GitHub Actions multi-OS / multi-Node matrix test runner and Dependabot automated dependency updates.

---

## Component Catalog

| Component | Tag Name | Description |
| :--- | :--- | :--- |
| **Button** | `<el-button>` | 1:1 Figma variant parity (`primary`, `secondary`, `danger`, `ghost`, sizes `sm`/`md`/`lg`). |
| **Badge** | `<el-badge>` | Status indicator pill (`default`, `success`, `danger`). |
| **Input** | `<el-input>` | Form-associated input with `prefix` and `suffix` icon slots. |
| **Dropdown** | `<el-dropdown>` | Popover container with light-dismiss (closes on outside click or <kbd>Esc</kbd>). |
| **Calendar** | `<el-calendar>` | Standalone 42-day accessible month grid with traversal. |
| **Datepicker** | `<el-datepicker>` | Form-associated composite datepicker combining input, dropdown, calendar, and quick actions. |
| **Dialog / Modal** | `<el-dialog>` | Native `<dialog>` modal with backdrop blur, overscroll containment, and light-dismiss. |
| **Tabs** | `<el-tabs>`, `<el-tab>` | W3C accessible tablist with keyboard arrow navigation. |
| **Select** | `<el-select>` | Form-associated custom dropdown selection. |
| **Switch** | `<el-switch>` | Form-associated toggle switch with keyboard navigation (<kbd>Space</kbd>/<kbd>Enter</kbd>). |
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
| **Command Palette** | `<el-command>` | Accessible keyboard-first command menu (*cmdk* style) with <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> shortcut, fuzzy search, and group headers. |
| **Prompt Input** | `<el-prompt-input>` | Beautiful UI-style auto-expanding AI prompt composer with action bar slots, model chips, and Enter-to-submit handling. |
| **Reasoning Card** | `<el-reasoning-card>` | Collapsible AI thought disclosure with active breathing pulse dot, elapsed duration timer, and smooth accordion expansion. |
| **Border Beam** | `<el-border-beam>` | Hardware-accelerated luminous gradient ray traveling around container perimeters (Magic UI style). |
| **Streaming Text** | `<el-streaming-text>` | Organic token-by-token streaming typewriter text with customizable cadence, blinking cursor, and completion events. |

---

## Interactive Examples & Showcase

- **[examples/ledgerflow.html](examples/ledgerflow.html)**: **LedgerFlow (Penpot → MCP Generated App)**: End-to-end fintech dashboard designed in **[Penpot](https://design.penpot.app/?screen=viewer&file-id=42288968-6e5e-808d-8008-f77162b618ca&page-id=d8ded059-05ee-80c0-8008-f774c97dd053&section=interactions&index=0&share-id=8218fc5e-f68d-4bab-8fd7-283dd92586e8)** and compiled via `npm run penpot:generate` into 15 validated Elementum Web Components (`<el-number-flow>`, `<el-chart>`, `<el-meter>`, `<el-drawer>`, `<el-dialog>`, `<el-toaster>`).
- **[examples/references.html](file:///c:/dev/Elementum/examples/references.html)**: **Reference Hub (Anti-AI Slop)**: Real-world patterns reconstructed from curated galleries (SaaS Pricing with rolling odometers & border beams, Linear-style command menu, and segmented PIN auth).
- **[examples/agent-studio.html](file:///c:/dev/Elementum/examples/agent-studio.html)**: **AI Agent Studio & Command Center** demonstrating `<el-command>` (⌘K), `<el-prompt-input>`, `<el-reasoning-card>`, `<el-number-flow>` live token odometer, `<el-otp-input>` security key authorization, and `<el-border-beam>`.
- **[index.html](file:///c:/dev/Elementum/index.html)**: Interactive landing portal directing to the applications. Run `npx serve .` to launch locally.
- **[examples/app.html](file:///c:/dev/Elementum/examples/app.html)**: Complete **Skyline Travel** booking dashboard demonstrating native form validation, confirmation modal dialogs, toast notifications, tabs, and theme toggling.
- **[examples/index.html](file:///c:/dev/Elementum/examples/index.html)**: Component showcase with standalone controls and live signal-reactive counter.

---

## Design Engineering & Agent Guides

### Installable Agent Skills (`npx skills add`)
Install Elementum's modular AI coding skills directly into Antigravity, Claude Code, Cursor, or Gemini CLI:

```bash
npx skills@latest add pinguxx/Elementum
```

Included skills under [`skills/`](skills/):
- **`elementum-ui`**: Composing Elementum's 105 Web Components, signals, FACE forms, and AG-UI streams.
- **`elementum-motion`**: Shadow DOM motion physics, sub-300ms `ease-out`, origin-aware overlays, and reduced-motion standards.
- **`elementum-break-ui`**: Adversarial stress-testing checklist (320px mobile, dark mode hover contrast, keyboard-only, extreme content).
- **`elementum-mobile`**: Mobile-native CSS standards (`touch-action`, `100dvh`, safe areas, `overscroll-behavior`, iOS 16px input zoom prevention).
- **`elementum-penpot`**: Two-way Penpot MCP design system sync and Penpot-to-Elementum app codegen.

- **[docs/penpot-workflow.md](file:///c:/dev/Elementum/docs/penpot-workflow.md)**: Free & open-source design token workflow with Penpot (W3C DTCG JSON) and automated compilation.
- **[docs/agent-craft-guide.md](file:///c:/dev/Elementum/docs/agent-craft-guide.md)**: Guide and system prompt rules for AI coding agents to banish generic AI look and adhere to high-craft standards.
- **[docs/theming.md](file:///c:/dev/Elementum/docs/theming.md)**: Complete design tokens, CSS custom properties, and `::part()` customization guide.

---

## Framework Integration

`@wcomp/elementum` works natively in vanilla HTML, React 19, Vue 3, Svelte 5, and Next.js. See **[docs/framework-integration.md](file:///c:/dev/Elementum/docs/framework-integration.md)** for complete setup instructions and TypeScript configuration.

---

## Project Structure

```
Elementum/
├── .github/
│   ├── dependabot.yml       # Automated weekly dependencies & actions updates
│   └── workflows/
│       └── ci.yml           # Multi-node, multi-OS CI test workflow
├── docs/
│   └── framework-integration.md # React 19, Vue 3, Svelte 5, and Next.js guide
├── src/
│   ├── signal.js            # Micro-signals (~80 lines: signal, computed, effect)
│   ├── template.js          # Tagged template engine (html, css, surgical DOM parts)
│   ├── elementum.js         # Base class with Shadow DOM, styles, and formAssociated
│   ├── tokens.css           # Light & Dark CSS custom properties from Figma
│   ├── index.js             # Public library exports
│   ├── index.d.ts           # Complete TypeScript ambient definitions
│   └── components/
│       ├── el-button.js     # Reference button matching Figma variants
│       ├── el-badge.js      # Reference badge component
│       ├── el-input.js      # Form-associated input
│       ├── el-dropdown.js   # Light-dismiss dropdown overlay
│       ├── el-calendar.js   # Standalone calendar grid
│       ├── el-datepicker.js # Composite datepicker
│       ├── el-dialog.js     # Native modal dialog with backdrop containment
│       ├── el-tabs.js       # Accessible W3C tabs with keyboard navigation
│       ├── el-select.js     # Form-associated custom select
│       ├── el-switch.js     # Form-associated toggle switch
│       ├── el-tooltip.js    # Accessible anchored tooltip
│       ├── el-accordion.js  # Accessible disclosure accordion
│       ├── el-table.js      # Reactive data table with sorting and selection
│       ├── el-toast.js      # Programmatic toast notification system
│       ├── el-theme-switch.js # Light / Dark mode toggle
│       ├── el-progress.js   # Determinate & indeterminate progress bar
│       ├── el-spinner.js    # Animated accessible SVG spinner
│       ├── el-avatar.js     # User avatar & avatar group with fallback
│       ├── el-drawer.js     # Accessible slide-over drawer overlay
│       ├── el-segmented-control.js # Form-associated pill switcher
│       ├── el-pagination.js # Accessible numeric pagination controls
│       ├── el-chip.js       # Interactive filter chips & pills
│       └── el-autocomplete.js # Form-associated combobox & remote search
├── tools/
│   ├── sync-tokens.js       # CLI to compile penpot/figma DTCG tokens into tokens.css
│   ├── sync-penpot-mcp.js   # CLI to generate tokens, colors & 105 components in Penpot via MCP
│   └── create-component.js  # CLI to scaffold new components (npm run create)
├── custom-elements.json     # W3C Custom Elements Manifest (for agents & Storybook)
├── AGENT_GUIDE.md           # Instructions for AI coding agents & developers
├── docs/
│   ├── theming.md           # Design tokens and ::part() customization guide
│   └── framework-integration.md # React, Vue, Svelte, Angular integration
├── examples/
│   ├── app.html             # Full travel booking mini-app
│   └── index.html           # Component showcase
├── index.html               # Live documentation and demo portal
├── mcp/
│   └── server.js            # Model Context Protocol server for AI coding agents
└── test/                    # Node.js automated test runner suite
```

---

## 🎨 Theming & Accessibility (WCAG 2.2)

- **Theming Guide**: See [docs/theming.md](docs/theming.md) for the full catalog of design tokens and exposed CSS ::part() selectors.
- **Agent Guide**: See [AGENT_GUIDE.md](AGENT_GUIDE.md) for guidelines on building, testing, and reviewing Elementum components.
- **Framework Integration**: See [docs/framework-integration.md](docs/framework-integration.md) for React, Vue, Svelte, and Angular setup.

---

## 🚀 Declarative Shadow DOM (DSD) SSR

Elementum includes built-in server-side rendering support emitting standard `<template shadowrootmode="open">` for zero-CLS first paint in Next.js, Nuxt, Astro, and Node.js:

```javascript
import { renderComponentToDSD } from '@wcomp/elementum/ssr';
import { ElButton } from '@wcomp/elementum';

// Outputs HTML with Declarative Shadow DOM and encapsulated styles
const html = renderComponentToDSD('el-button', ElButton, { variant: 'primary' }, 'Submit');
```

Run the live zero-dependency Node.js SSR server (`?hydrate=0` for pure Zero-JS DSD, `?hydrate=1` for progressive hydration) or view the pre-rendered snapshot [`examples/ssr-demo.html`](examples/ssr-demo.html):

```bash
npm run ssr
```

---

## Penpot & Figma Design System Sync

### Code → Penpot (MCP Server Sync)
Generate all **54 W3C DTCG tokens** (Core, Light, Dark sets), **28 library colors**, and **105 Master Components** (across 8 categories) directly inside an open **[Penpot](https://design.penpot.app)** file connected via the Penpot MCP Plugin:

```bash
npm run penpot:mcp -- --url "https://design.penpot.app/mcp/stream?userToken=<YOUR_TOKEN>"
# Or via environment variable:
PENPOT_MCP_URL="https://design.penpot.app/mcp/stream?userToken=<YOUR_TOKEN>" npm run penpot:mcp
```

### Penpot / Figma → Code (Token Compiler)
Synchronize exported W3C DTCG tokens from `tokens/penpot-tokens.json` (or `tokens/figma-tokens.json`) into `src/tokens.css`:

```bash
npm run tokens:sync tokens/penpot-tokens.json
```

See **[docs/penpot-workflow.md](docs/penpot-workflow.md)** for full setup instructions, CLI flags (`--url`, `--token`, `--dry-run`), and Penpot MCP security notes.

---

## Agent MCP Server

Run the built-in MCP server for AI coding agents:

```bash
node mcp/server.js
# Or via package bin
npx elementum-mcp
```

Exposed tools:
- `list_components`: Lists all components in Elementum
- `get_component_doc`: Retrieves attributes, slots, events, and CSS parts
- `list_tokens`: Queries design tokens by category (color, spacing, radius)
- `generate_snippet`: Generates valid HTML markup matching Figma variants
- `scaffold_component`: Scaffolds standard boilerplate code for new components
- `validate_accessibility`: Audits component markup against WCAG 2.2 rules
