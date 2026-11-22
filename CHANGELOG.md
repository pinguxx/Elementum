# Changelog

All notable changes to `@wcomp/elementum` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
