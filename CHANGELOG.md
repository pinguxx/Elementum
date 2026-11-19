# Changelog

All notable changes to `@wcomp/elementum` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **Real-Browser Playwright + `@axe-core/playwright` E2E Suite (`test/e2e/`)**:
  - Automated Chromium, Firefox & WebKit CI verification for `<el-dialog>` focus restoration, `ElementInternals` forms, live `/ssr?hydrate=0` & `/ssr?hydrate=1` DSD hydration, and WCAG 2.2 AA `axe-core` audits.
- **Security & MCP Hardening (`test/security.test.js`, `mcp/server.js`)**:
  - Added `lint_accessibility` (with explicit static-lint disclosure), `suggest_component`, `validate_component_usage`, and `get_component_maturity`.
  - Added 128 KB payload cap, tag/attribute injection guards, and XSS/prototype-pollution security tests.
- **Interactive AG-UI Live Demo (`examples/ag-ui.html`)** and reproducible benchmark runner (`npm run bench`).

## [0.1.0] — 2026-11-18

### Added
- Initial release of `@wcomp/elementum` with 109 zero-dependency Web Components, micro-signals, W3C DTCG tokens, Declarative Shadow DOM SSR, AG-UI adapter, Penpot/Figma token sync, and MCP server.
