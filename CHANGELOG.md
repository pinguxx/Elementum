# Changelog

All notable changes to `@wcomp/elementum` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.6] - 2026-11-24

### Added
- **AG-UI Run/Surface Isolation & Patch Allowlist (`src/ag-ui.js`)**: `createAgUiStore(initialState, options)` now enforces stale `runId` and `surfaceId` rejection, optional `strictRunId`, `allowedPaths` RFC 6902 JSON Pointer prefix filtering, `rejectedEvents`, `setSurface()`, and `resetRun()`.
- **Reactive `<el-table filter>` & Safe Match Highlighting (`src/components/el-table.js`)**: Added case-insensitive row filtering, safe DOM-node `<mark part="highlight">` substring highlighting, `highlight-only` mode for server-filtered datasets, and an empty state.
- **Owning Form & `HTMLFormElement` Parity (`src/elementum.js`, `src/components/el-form.js`)**: Added `el.form` getter on `Elementum`, base FACE `formResetCallback()` / `formDisabledCallback()` fallbacks across all 17 controls, and `ElForm` parity (`form`, `elements`, `toFormData()`, `checkValidity()`, `reportValidity()`, `requestSubmit()`).
- **Exhaustive Formal Invariant Verifier & API Surface Audit (`npm run verify:formal`, `npm run audit:api`)**: Added 6-invariant verifier (6,162 states/topologies across `signal.js`, `a2ui.js`, `ag-ui.js`, and `el-toast.js`) and automated 109-component API consistency audit in CI.
- **Events & Authoring Guides (`docs/events.md`, `docs/authoring-components.md`)**: Added dedicated guides for custom event handling and authoring accessible Web Components with `@wcomp/elementum/behaviors`.

### Fixed
- **Dark-Mode Shadow DOM & WCAG 2.2 AA Contrast (0/109 violations)**: Fixed 131 dead `:root[data-theme="dark"]` Shadow DOM selectors across 33 components, calibrated dark-mode tokens and semantic foreground text tokens (`--el-color-primary-text`, etc.), and added `e2e/dark-mode-contrast.spec.js`.
- **Signal Runtime Edge Cases (`src/signal.js`)**: Fixed `batch()` fault isolation so a throwing subscriber never drops sibling notifications, and prevented `AsyncSignal` self-subscription loops when reading own state synchronously inside a fetcher.
- **React 19 Boolean Props (`src/react/runtime.js`)**: Synced boolean props via `setAttribute`/`removeAttribute` in `useIsomorphicLayoutEffect` so React 19 does not assign falsy empty strings to boolean Custom Element properties.
- **WAI-ARIA Keyboard Navigation (`src/components/el-tree-view.js`, `src/components/el-calendar.js`)**: Added arrow-key navigation and `:focus-visible` rings to tree items and calendar day grids.

## [0.8.5] — 2026-11-23 ("A2UI Live Validator & CodePen Export, APG Keyboard E2E, Multi-Arm Benchmark Runner & Toast Stacking Fix")

### Added
- **A2UI Live Schema/Security Validator & CodePen Export (`examples/a2ui.html`)**: Added an editable JSON/JSONL composer with real-time `DEFAULT_A2UI_CATALOG` & security rule validation badge (`✔ Valid A2UI` / `🛡 Security Rule(s) Triggered`), **Copy Standalone HTML 📋**, and 1-click **Open Surface in CodePen ↗**.
- **WAI-ARIA APG Keyboard-Only State Machine Suite (`e2e/a11y-keyboard-apg.spec.js`, `docs/accessibility-audit.md`)**: Added real-browser keyboard state-machine E2E coverage across all 10 high-complexity composite widgets (`el-dialog`, `el-alert-dialog`, `el-drawer`, `el-tabs`, `el-command`, `el-autocomplete`, `el-calendar`, `el-table`, `el-tree-view`, `el-navigation-menu`).
- **Multi-Arm AI-Agent Benchmark Matrix Runner (`benchmarks/agent-eval/run-matrix.js`, `npm run bench:agents`)**: Added automated matrix runner scoring all submissions and computing aggregate mean severe WCAG and mobile overflow deltas.
- **Framework Demo Generator (`npx @wcomp/elementum init --example`) & Homepage 48s Walkthrough (`bin/elementum.js`, `index.html`)**: Added `--example` flag generating `src/ElementumDemo.tsx` / `.vue` / `.svelte`, platform-aware next-step terminal hints, and an interactive 4-step **48-Second Onboarding Walkthrough** + **Open Starter in CodePen ↗** on `index.html`.
- **Expanded Interactive Catalog E2E (`e2e/catalog-sweep.spec.js`, `examples/catalog-data.js`)**: Verified click interactions across `el-tabs`, `el-accordion`, `el-switch`, `el-dropdown`, `el-dialog`, `el-drawer`, `el-toast`, `el-toaster`, and `el-number-flow`, plus `.variation-preview` bounding-box checks across all 109 components.

### Fixed
- **`<el-toaster>` Duplicate Deck Coordination & Hover Stack Order (`src/components/el-toast.js`)**: Coordinated multiple mounted `<el-toaster>` instances so only the active toaster renders the fixed viewport stack, preserved newest-first card order on hover/expand, wired the `expand` boolean attribute, and added `toast.clear()`.
- **`<el-drawer>` Child Button Click Handling (`src/components/el-drawer.js`)**: Prevented premature `setPointerCapture` on `pointerdown` from swallowing clicks on child `<el-button>` elements inside `<el-drawer>`.

## [0.8.4] — 2026-11-23 ("Vanilla Starter Dark Theme Canvas, Toast Wiring & ElToaster Instance Methods")

### Fixed
- **Vanilla Starter `index.html` Dark Mode & Toast Wiring (`bin/elementum.js`)**: Updated generated `index.html` `body` background to `var(--el-step-1, var(--el-surface-base))` and `elementum-tokens.css` to `--el-color-primary` so toggling `<el-theme-switch>` smoothly switches the entire page canvas between light and dark themes; wired `Trigger Toast` and modal `Create` buttons to `toast.info()` / `toast.success()` reading `<el-input>` signal `.value.value`.
- **`<el-toaster>` Instance Convenience Methods (`src/components/el-toast.js`)**: Added `.show()`, `.success()`, `.error()`, `.warning()`, `.info()`, and `.clear()` instance methods on `ElToaster` (delegating to the `toast` manager) and accepted `opts.title` as a fallback for `opts.message`.

## [0.8.3] — 2026-11-23 ("Windows PowerShell & Symlink CLI Fix + Starter index.html for Vanilla Projects")

### Fixed
- **Windows & Symlink `npx @wcomp/elementum init` / `check` Execution (`bin/elementum.js`, `mcp/server.js`)**: Replaced `new URL(import.meta.url).pathname` (which prefixes `/C:/` on Windows and fails `path.resolve` comparison against `process.argv[1]`) with `fileURLToPath(import.meta.url)` + `fs.realpathSync` symlink resolution so `npx @wcomp/elementum init` and `npx @wcomp/elementum check` execute reliably on Windows PowerShell/CMD, macOS, and Linux.
- **Vanilla Project Starter `index.html` (`bin/elementum.js`)**: When `npx @wcomp/elementum init` detects a `vanilla` project without an existing `index.html`, it now generates a ready-to-open `index.html` starter app alongside `.mcp.json`, `.cursor/mcp.json`, `elementum.rules.md`, and `elementum-tokens.css`.

## [0.8.2] — 2026-11-23 ("A2UI Security Boundaries, Multi-Format MCP Snippets, CLI Linter & IDE Autocomplete")

### Added
- **Explicit A2UI Security Boundary (`@wcomp/elementum/a2ui`, `docs/a2ui.md`)**: Added configurable `maxDepth` (default `32`), `maxComponents` (default `500`), and `maxStringLength` (default `65,536`) resource caps (`A2UI_SECURITY_DEFAULTS`), reactive URL scheme verification inside signal `effect()`s (`href`, `src`, `action`, `formaction`, `poster`, `xlink:href`), dangerous DOM sink/prototype stripping (`innerHTML`, `outerHTML`, `srcdoc`, `__proto__`), and `allowedTypes` option alias.
- **MCP `validate_a2ui_messages` & Multi-Format `generate_snippet` (`mcp/core.js`)**: Expanded the MCP server to 11 tools with declarative A2UI v0.8/v0.9 JSON validation (checking catalog allowlists, missing root/child IDs, cycles, and unsafe URLs) and `format: 'html' | 'react' | 'vue' | 'a2ui'` snippet generation.
- **Local CI / Pre-Commit Linter (`npx @wcomp/elementum check`)**: Added `elementum check [paths...] [--json]` in `bin/elementum.js` to scan `.html`, `.jsx`, `.tsx`, `.vue`, and `.svelte` files against `validate_component_usage` and `lint_accessibility`.
- **Single-File Context & IDE Autocomplete (`llms-full.txt`, `vscode.html-custom-data.json`, `src/ide-types.d.ts`)**: Added `npm run docs:ide` (`tools/generate-ide-and-llms.js`) generating `llms-full.txt`, VS Code HTML Custom Data (`contributes.html.customData`), and global Vue 3 (`GlobalComponents`) + Svelte (`svelteHTML.IntrinsicElements`) tag declarations.
- **Declarative `<el-dialog>` Property Setter & Catalog CodePen Launcher**: Added `dialog.open = true | false` getter/setter on `ElDialog` (`src/components/el-dialog.js`) and 1-click **Open in CodePen ↗** to `examples/index.html`.
- **Benchmark Provenance & Scope Qualifications (`benchmarks/agent-eval/RESULTS.md`)**: Documented tested model ID, temperature, single-pass turn budget, scoring runtime versions, raw output links, and explicit experimental scope limitations.

### Fixed
- **Release Version Sync Gate (`tools/check-release-sync.js`, `showcase.html`, `docs/stability-and-1.0.md`)**: Extended `npm run check:release` to verify topmost `CHANGELOG.md` entry, `showcase.html` audit/evaluator card version references, and `docs/stability-and-1.0.md` evaluator headings.

## [0.8.1] — 2026-11-22 ("Vite/Rollup sideEffects Fix, Scoped Dark Mode & Showcase Polish")

### Fixed
- **Vite / Rollup Custom Element Tree-Shaking (`package.json`)**: Added `./src/index.js` and `./src/react/index.js` to `"sideEffects"` alongside `./src/components/*.js` and `./src/tokens.css`, ensuring Vite/Rollup bundlers never drop custom element registration when importing `@wcomp/elementum` or `@wcomp/elementum/react`.
- **Scoped Dark Mode (`src/tokens.css`)**: Added `[data-theme="dark"]` alongside `:root[data-theme="dark"]` so scoped dark-mode containers receive full dark surface and text tokens.
- **Button Height Normalization (`src/components/el-button.js`)**: Added consistent `line-height: 1.2` and `min-height` across `sm`/`md`/`lg` variants so sibling buttons with icons or Unicode arrows align pixel-for-pixel.
- **Switch Track Collapse (`src/components/el-switch.js`)**: Added `flex-shrink: 0` to `.track` so switch pills never squish in narrow flex layouts.

## [0.8.0] — 2026-11-22 ("A2UI Renderer, 100/100 Edge MCP, 109/109 Production Verified & Init CLI")

### Added
- **Declarative A2UI Renderer (`@wcomp/elementum/a2ui`)**: Zero-dependency A2UI JSON surface renderer (`createA2UiSurface`) with strict locked-catalog allowlist, two-way micro-signal data model bindings, action dispatching, TypeScript definitions (`src/a2ui.d.ts`), unit tests (`test/a2ui.test.js`), and interactive playground with progressive JSONL agent stream simulation (`examples/a2ui.html`).
- **Zero-Dep Project Setup CLI (`npx @wcomp/elementum init`)**: Added `bin/elementum.js` (with `test/init-cli.test.js`) that auto-detects Next.js, React, Vue, Svelte, Vite, or Vanilla projects, writes `.mcp.json` and `.cursor/mcp.json`, and drops in `elementum.rules.md` + starter `elementum-tokens.css`.
- **100/100 Vercel Edge MCP Server (`mcp/core.js`, `mcp/edge.js`, `api/mcp.js`)**: Extracted pure-JS MCP core with zero Node built-ins, `2025-03-26` / `2025-06-18` protocol negotiation, JSON-RPC batching, structured `isError` responses, and `mcp/component-metadata.json`.
- **109 / 109 Production Verified & Hard-8 Stress Suite (`e2e/hard-8-stress.spec.js`, `AUDITS.md`, `QUALITY.md`)**: Reached 100% Production Verified coverage across all 109 components, plus dedicated stress tests for 1,200-row `<el-table>`, nested `<el-dialog>`, and RTL mobile touch viewports.
- **Auto-Generated Styling Reference & Developer Guides**: Added `npm run docs:styling` (`docs/styling-reference.md`), 1-page Tailwind CSS guide (`docs/tailwind-guide.md`), drop-in agent rules (`docs/agent-rules-snippet.md`), `shadcn/ui` migration table (`docs/migration-guide.md`), `llms.txt`, and `AGENTS.md`.
- **Catalog Framework Tabs & Theme Studio Upgrades**: Added live **HTML / React / Vue 3 / A2UI JSON** copy tabs to `examples/index.html`, and upgraded Theme Studio (`examples/registry.html#theme-studio`) with Font Family selector, live Light/Dark preview, and `tokens.css` / `tokens.dtcg.json` file downloads.
- **4-Arm AI-Agent UI Benchmark (`benchmarks/agent-eval/`)**: Added reproducible Playwright + `axe-core` + MCP scoring harness (`score.js`) and published 4-arm comparison results in `benchmarks/agent-eval/RESULTS.md`.

### Changed
- **Tree-Shaking `sideEffects` (`package.json`)**: Scoped `"sideEffects"` strictly to `["./src/components/*.js", "./src/tokens.css"]` for optimal bundler tree-shaking.
- **150x+ `<el-table>` Render Speedup (`src/components/el-table.js`, `src/template.js`)**: Added `DocumentFragment` fast-path rendering in `NodePart` and `el-table`, reducing 1,200-row render time from ~16s to < 1s.

### Fixed
- **Duplicate Composed `InputEvent` (`src/components/el-input.js`, `src/components/el-textarea.js`)**: Added `e.stopPropagation()` before emitting custom `input`/`change` events so React/Vue/Vanilla listeners always receive `e.detail.value`.
- **`<el-dialog>` Escape `data-state` Sync (`src/components/el-dialog.js`)**: Synced `data-state="closed"` and removed `open` attribute when native `<dialog>` closes via Escape.
- **WCAG 2.2 AA Fixes**: Darkened `<el-badge variant="success">` for WebKit contrast (`6.97:1`), darkened `<el-autocomplete>` `.match-highlight` contrast (`5.3+:1`), and added `?inert` to closed `<el-dropdown>` panels to eliminate `aria-hidden-focus`.
- **A2UI & AG-UI Interactive Demo Polish**: Fixed `<el-chip>` click/toggle race in `src/a2ui.js` `ChoiceChip` binding and synced active primary button states in `examples/a2ui.html` and `examples/ag-ui.html`.

## [0.7.0] — 2026-11-21 ("Hardened React Wrappers, Multi-Framework Starters & 87/109 Production Verified")

### Added
- **Multi-Framework Starter Templates & 3-Way Comparison (`starters/`)**: Added copy-paste, StackBlitz-ready starter projects for Vanilla HTML CDN (`starters/vanilla-html`), Next.js App Router + DSD SSR (`starters/next-app-router`), React 19 + TypeScript (`starters/react-19`), Vue 3 (`starters/vue-3`), Svelte 5 (`starters/svelte-5`), and AI Chat UI (`starters/ai-chat`), plus a 3-way measured Team Directory comparison across React, Vue 3, and Vanilla (`starters/framework-comparison`).
- **Ergonomic `renderComponentToDSD` Options Overload (`src/ssr.js`)**: Added 2-argument `renderComponentToDSD(tagName, { children, ...attributes })` support alongside the existing 4-argument class signature, with unit coverage in `test/ssr-dsd.test.js`.
- **Expanded Real-Browser E2E & WCAG 2.2 AA Suite (`e2e/core-and-ai-suite.spec.js`)**: Added Playwright + `@axe-core/playwright` audits across core form controls, navigation/overlays, data display, the full AI specialist suite, and live browser execution of `examples/ledgerflow.html`, raising `QUALITY.md` Production Verified coverage from **42 / 109** to **87 / 109 (79.8%)**.

### Changed
- **Hardened `@wcomp/elementum/react` Runtime & Strict TypeScript (`src/react/runtime.js`, `tools/generate-react-wrappers.js`, `src/react/index.d.ts`)**:
  - Switched complex object/array property sync to isomorphic `useLayoutEffect` (pre-paint in browser, SSR-safe in Node.js with zero warnings).
  - Tracked applied object-prop keys and initial element defaults so removing a React prop cleanly resets stale signals and properties.
  - Removed loose `[prop: string]: any;` from `ElementumReactBaseProps`, added `data-*`, `aria-*`, FACE (`name`, `form`), and standard DOM event types, and derived unwrapped `Signal<T>` component props automatically (`ElementSignalProps<E>`).
  - Verified against real React 18 & React 19 consumers in `tools/verify-react.js` including prop removal and `@ts-expect-error` excess-property rejection.

### Fixed
- **`<el-toaster>` Empty-Viewport Click Interception (`src/components/el-toast.js`)**: Set `pointer-events: none` on `.toaster-viewport` and `.toast-list` (preserving `pointer-events: auto` on `.toast-card`) so empty toasters never intercept clicks on bottom-right page elements.
- **WCAG 2.2 AA Accessibility Fixes (`src/components/el-breadcrumb.js`, `src/components/el-rating.js`, `src/components/el-number-field.js`)**:
  - Added `role="list"` / `role="listitem"` semantics to `<el-breadcrumb>` and `<el-breadcrumb-item>` (WCAG 1.3.1).
  - Removed nested interactive buttons inside `<el-rating role="slider">` to resolve WCAG 2.5.8 target-size obscuration.
  - Forwarded accessible `aria-label` to the inner `role="spinbutton"` input in `<el-number-field>`.

## [0.6.0] — 2026-11-21 ("React Wrappers, Core Hardening & Production Readiness")

### Added
- **Official React 18/19 Wrappers (`@wcomp/elementum/react` & `@wcomp/elementum/react/runtime`)**: Added zero-dependency `createElementumReactComponent` runtime and `tools/generate-react-wrappers.js`, exporting typed React components and strict TypeScript definitions (`src/react/index.d.ts`) for all 109 custom elements with optional `peerDependencies: { react: ">=18.0.0" }`.
- **DSD Stress, Framework Interop & Showcase E2E (`e2e/framework-and-dsd-stress.spec.js`)**: Verified 54-component Declarative Shadow DOM hydration with `CLS === 0` and zero duplicate controls, React 18/19 wrapper & Vue-style event interop, keyboard-only `Tab`/`Space` Form-Associated Custom Element (FACE) `<form>` submission, and WCAG 2.2 AA `axe-core` audit on `showcase.html`.
- **Production Documentation & Showcase (`showcase.html`, `docs/migration-guide.md`, `docs/stability-and-1.0.md`, `SECURITY.md`, `CONTRIBUTING.md`)**: Added multi-component showcase app, migration guides from Shoelace/Radix UI/React Aria/Lit, formal `1.0.0` stability contract and SemVer gates, security disclosure & MCP/Agent threat model policy, and contributor promotion criteria.
- **`<el-code-block>` Syntax Highlighting & Slot Ergonomics**: Added zero-dependency, linear-time ReDoS-safe and XSS-safe tokenizer supporting `js`/`ts`, `html`, `css`, `json`, and `bash`, plus slot auto-dedent and `<template>` child support.
- **MCP Registry & Telemetry Polish (`mcp/server.js`, `server.json`, `icon.png`)**: Added JSON-RPC `ping` handler, MCP `readOnlyHint: true` annotations on all 10 tools, and a `192x192` `icon.png` in `server.json`.
- **Full 109-Component Penpot Sync & Codegen (`tools/sync-penpot-mcp.js`, `tools/penpot-to-elementum.js`)**: Expanded Penpot design-system synchronization and Elementum code generation across all 109 components and tokens.

### Fixed
- **`Computed` Error Recovery (`src/signal.js`)**: Subscribes `activeEffect` before evaluation, resets `_dirty` in `finally`, and re-throws cached `_error` cleanly on `.value` / `.peek()` reads.
- **`NodePart` Child Effect & Listener Cleanup (`src/template.js`)**: Scoped reactive child bindings via per-commit `AbortController` to prevent memory leaks across dynamic list/branch updates.
- **`<el-otp-input>` DOM Identity (`src/components/el-otp-input.js`)**: Bound cell `.value` reactively per index so input elements preserve DOM identity and focus across keystrokes.
- **`Elementum` Lifecycle Controller (`src/elementum.js`)**: Aborts stale `#abortController` instances on reconnect and resets on disconnect.
- **MCP Scaffold Comment Sanitization (`mcp/server.js`)**: Sanitized `description` inputs in `scaffold_component` (`*/` → `* /`, collapsed newlines) to prevent JSDoc comment injection.
- **SSR Attribute Stripping & FOUC Prevention (`src/ssr.js`, `src/tokens.css`)**: Added tag-scoped SSR attribute stripping, pure-Node Map attribute shim, and `:root:not([data-dsd]) :defined` FOUC guard.

## [0.5.0] — 2026-11-19 ("Async Signals, Agent Runtime & Full-Catalog Proof")

### Added
- **Async-First Signals & Error Details (`src/signal.js`)**: Added `batch()`, `asyncSignal()` (automatic reactive dependency tracking, `AbortSignal` stale-request cancellation, stale-while-revalidate `.value`, `.pending`, `.status`, structured `.error` details, `.refetch()`, `.abort()`, `.mutate()`, `.read()`), `NotReadyError`, `isPending()`, `Computed.error`, and `effect(fn, { onError })`.
- **Expanded Headless Behaviors (`@wcomp/elementum/behaviors`, 16 primitives)**: Added `prefersReducedMotion()`, `createPresenceBehavior()`, `createFocusRecovery()`, `createShortcuts()`, `createDisclosureBehavior()`, `createPopupPositioner()`, and `createHistory()`.
- **Shadow-DOM Agent Runtime Bridge (`@wcomp/elementum/agent`)**: Added `snapshot(root)`, `act(root, command, { guard })`, and `registerWebMCP(root)` (`navigator.modelContext`) so AI agents can inspect and operate Shadow DOM interfaces cleanly.
- **Automated WAI-ARIA, RTL & DSD SSR Contract Checkers (`@wcomp/elementum/testing`)**: Added `checkAriaPattern()` (9 WAI-ARIA APG patterns across nested Shadow DOM), `checkDirection()`, and `checkServerRender()`.
- **Per-Entrypoint Gzipped Size Budget Gate (`size-budget.json`, `npm run check:size`)**: Tracks all 86 entrypoints in CI (`core + behaviors + agent + ssr`: 31.8 KB, average component: 2.20 KB gzip).
- **Real-Browser 109-Component Catalog Sweep (`e2e/catalog-sweep.spec.js`, `npm run test:catalog`) & CSS Enum Gate (`tools/audit-catalog-diff.js`)**: Verifies all 109 components, every `select`/`boolean` permutation, and every example in live Chromium.
- **Distributable Agent Skills (`skills.sh.json`, `skills/elementum`, `skills/elementum-unslop`)** and **[docs/behaviors-and-agent.md](./docs/behaviors-and-agent.md)**.

### Fixed
- **Animations & Presence**: Preserved DOM identity in `<el-number-flow>` so odometer reels transition smoothly and honor `animated="false"` / `prefers-reduced-motion`; upgraded `<el-accordion>` panels to smooth CSS Grid `0fr -> 1fr` transitions; verified live `Element.getAnimations()` across 9 animated components in Playwright.
- **Component Reactivity & Catalog Bugs**: Fixed circular `<el-skeleton>` collapsing to `0px` with percentage width, `<el-toggle-group>` `single`/`multiple`/`value`/`disabled` sync and double-click unselect, `<el-otp-input>` reactive `type="password"`/`length`, `<el-number-field>` reactive stepper states, `<el-segmented-control>` `?disabled` boolean attribute, `<el-select>` & `<el-datepicker>` dynamic `attributeChanged()`, `<el-context-menu>` named `trigger` slot, `<el-pagination>` default `total="100"`, `<el-alert>` redundant `label` prop, `<el-menubar>` example tags, and `docs.html` sidebar scrollspy & click highlighting.
- **Security (CodeQL → 0 Open Alerts)**: Remediated ReDoS regexes in `src/ssr.js` & `src/template.js`, added `permissions: { contents: read }` to `.github/workflows/ci.yml`, escaped single quotes in catalog `escapeHtml()`, added inline prototype-pollution guards in `src/ag-ui.js`, and added `vbscript:` coverage in `test/security.test.js`.

## [0.4.0] — 2026-11-19 ("Real-Browser Proof")

### Added
- **Honest, Evidence-Based Quality Matrix (`QUALITY.md` via `tools/generate-quality-report.js`)**: Replaced naive string matching with structured checks for unit instantiation, dedicated `test()` blocks, direct Playwright browser E2E, `@axe-core/playwright` audits, and explicit maturity tiers (`🟢 Production Verified`, `🔵 Stable`, `🟡 Experimental`).
- **Expanded Real-Browser Playwright + `axe-core` Component E2E (`e2e/components-e2e.spec.js`)**: Direct real-browser interaction, keyboard, and WCAG 2.2 AA verification for `el-autocomplete`, `el-command`, `el-datepicker`, `el-calendar`, `el-tabs`, `el-accordion`, `el-dropdown`, `el-popover`, `el-drawer`, `el-table`, `el-tree-view`, `el-form`, `el-switch`, `el-checkbox`, and `el-dropzone`.
- **Zero-Shortcut SaaS Admin Dogfooding App (`examples/saas-admin.html` + `e2e/saas-admin.spec.js`)**: Complete admin console built exclusively with public `@wcomp/elementum` APIs (validated auth screen, searchable/filterable sortable table, invite modal dialog, activity drawer, `⌘K` command palette, dark mode, toasts, 375px mobile check, and WCAG 2.2 AA `axe-core` verified).
- **Dynamic-Topology Signal Rewiring Fuzzer (`test/signal-torture.test.js`)**: 500-step randomized dynamic branch switching proving exact equivalence and zero stale subscriber leaks.
- **Shared Search Highlighting Behavior (`@wcomp/elementum/behaviors`)**: Added `splitMatchSegments()` and `highlightMatch()` wired into both `<el-autocomplete>` and `<el-command>`.
- **Downloadable CI Quality Artifacts (`.github/workflows/ci.yml`)**: Uploads `playwright-e2e-report` and `quality-matrix` on every CI run.

## [0.3.0] — 2026-11-18 ("Verified & Consumable")

### Added
- **External Consumer Tarball Verification (`npm run verify:consumer`)**: Packs the real npm `.tgz`, installs it into an isolated external temp project, and verifies all 7 ESM subpath exports, pure-Node DSD SSR, AG-UI, Behaviors, and strict TypeScript consumer compilation (`tsc --noEmit --strict`).
- **Strict TypeScript Release Gate (`npm run typecheck`)**: Fixed `ElNumberFlow.prefix` and `ElOtpInput.autofocus` `lib.dom.d.ts` clashes so `src/index.d.ts` compiles cleanly under `--strict`.
- **1,000-Graph Multi-Seed Signal Fuzzer (`test/signal-torture.test.js`)**: Expanded from 100 to 1,000 randomized DAGs across 5 deterministic seeds with deep chains, mid-run subscription disposal, and effect exception-recovery testing.
- **Deep Behavior-Layer Edge-Case Suite (`test/behaviors.test.js`)**: Hidden/disabled/dynamic item skipping and Unicode typeahead in `createRovingFocus`, 3-level nesting & `AbortSignal` disconnect cleanup in `createDismissableLayer`, and keyboard-vs-pointer final-order parity in `createReorderBehavior`.
- **Auto-Generated Component Quality Matrix (`QUALITY.md` via `npm run quality:report`)** and **One-Command Full Verification (`npm run verify:all`)**.
- **Stricter CI Matrix (`.github/workflows/ci.yml`)**: Added `macos-latest` (9-way Node/OS matrix), enforced strict `npm ci`, enforced `--test-coverage-lines=95`, and added the `typecheck-and-consumer` job.

## [0.2.0] — 2026-11-18 ("Trust & Proof")

### Added
- **React-Aria-Inspired Behavior Layer (`@wcomp/elementum/behaviors`)**:
  - `createPressBehavior` (mouse/touch/keyboard normalization, no sticky mobile `:hover`)
  - `createRovingFocus` (Arrow/Home/End, 500ms typeahead, automatic `dir="rtl"` reversal)
  - `createDismissableLayer` (top-most-first nested overlay Escape & outside-click stack)
  - `createSelectionBehavior` (single, multiple, `Shift`-range, `selectAll`, `disabledKeys`)
  - `createReorderBehavior` (keyboard grab/move/drop/cancel + pointer HTML5 DnD + live announcements)
  - `announce()` / `clearAnnouncer()` WCAG screen-reader LiveAnnouncer
  - `setHostState()` reflecting both `data-*` attributes and native `ElementInternals.states`
  - Zero-dependency native `Intl` locale support (`locale` attribute on `<el-calendar>` & `<el-number-flow>`)
- **Headless `unstyled` Mode**: Opt-in `unstyled` attribute on any Elementum component to skip Shadow DOM stylesheets while keeping behavior, `::part()`, and `[data-*]` states.
- **Core Signal Engine Hardening & Fuzzing (`test/signal-torture.test.js`)**:
  - Circular dependency detection in `Computed` (throws safely instead of stack overflow).
  - Re-entrancy guard in `ReactiveEffect` (prevents infinite self-mutation loops).
  - Fresh `Computed.peek()` evaluation + 100-graph randomized DAG fuzzer.
- **Real-Browser Playwright + `@axe-core/playwright` E2E Suite (`e2e/`)**:
  - Automated Chromium, Firefox & WebKit CI verification for `<el-dialog>` focus restoration, `ElementInternals` forms, live `/ssr?hydrate=0` & `/ssr?hydrate=1` DSD hydration, and WCAG 2.2 AA `axe-core` audits.
- **Security & MCP Hardening (`test/security.test.js`, `mcp/server.js`)**:
  - Added `lint_accessibility` (with explicit static-lint disclosure), `suggest_component`, `validate_component_usage`, and `get_component_maturity`.
  - Added 128 KB payload cap, tag/attribute injection guards, and XSS/prototype-pollution security tests.
- **Interactive AG-UI Live Demo (`examples/ag-ui.html`)** and reproducible benchmark runner (`npm run bench`).

## [0.1.0] — 2026-11-18

### Added
- Initial release of `@wcomp/elementum` with 109 zero-dependency Web Components, micro-signals, W3C DTCG tokens, Declarative Shadow DOM SSR, AG-UI adapter, Penpot/Figma token sync, and MCP server.
