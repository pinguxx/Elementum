# Changelog

All notable changes to `@wcomp/elementum` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
