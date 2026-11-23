# Stability Contract & Path to `1.0.0`

This document defines `@wcomp/elementum`'s compatibility promises, current pre-1.0 vs. production-verified guarantees, and the concrete exit criteria for tagging `1.0.0`.

---

## 1. Current Maturity Model (`0.8.x`)

Elementum explicitly distinguishes **verified evidence** from roadmap goals rather than treating every component uniformly. Live automated audit counts are maintained in [`QUALITY.md`](../QUALITY.md) via `npm run quality:report`.

At `0.8.x`, component status is tracked across three evidence-backed tiers:
- **Production Verified**: Schema checked against `custom-elements.json` + unit instantiated + dedicated `test()` coverage + real-browser Playwright interaction test + `@axe-core/playwright` WCAG 2.2 AA audit.
- **Stable**: Schema checked + unit instantiated + dedicated `test()` coverage.
- **Experimental**: Passes automated catalog schema & mount contracts, pending dedicated interactive specs and Playwright E2E coverage.

---

## 2. Subpath Stability Tiers (1.0 Target)

| Package Entrypoint | Target `1.0.0` Tier | Compatibility Commitment |
| :--- | :--- | :--- |
| `@wcomp/elementum` (`signal`, `template`, `Elementum`, components) | **Stable** | Full SemVer guarantees from `1.0.0` onward |
| `@wcomp/elementum/tokens.css` | **Stable** | `--el-*` token names preserved across minor/patch releases |
| `@wcomp/elementum/components/*` | **Stable** | Tag names, observed attributes, and `::part()` names stable |
| `@wcomp/elementum/ssr` | **Stable** | Pure-Node `<template shadowrootmode="open">` contract stable |
| `@wcomp/elementum/behaviors` | **Stable** | Headless interaction, focus, roving-tabindex, and announcer APIs stable |
| `@wcomp/elementum/react` | **Stable** | Auto-generated wrappers tracked 1:1 with `custom-elements.json` |
| `@wcomp/elementum/testing` | **Beta (`0.x` → `1.0`)** | Structural contract validators (`checkAriaPattern`, `checkDirection`, `checkServerRender`, `testComponent`) |
| `@wcomp/elementum/ag-ui` | **Beta (`0.x` → `1.0`)** | AG-UI SSE store + RFC 6902 JSON Patch binding |
| `@wcomp/elementum/a2ui` | **Beta (`0.x` → `1.0`)** | Declarative A2UI JSON surface renderer with locked catalog & two-way signals ([`docs/a2ui.md`](./a2ui.md)) |
| `@wcomp/elementum/agent` | **Experimental** | Shadow-DOM-piercing `snapshot()` / `act()` — may iterate rapidly based on agent testing |

---

## 3. SemVer Promises Starting at `1.0.0`

Once `1.0.0` is tagged, **breaking changes require a major version bump (`2.0.0`)**:
1. **Custom Element Tag Names**: Existing `el-*` tags and Light DOM child tags will not be renamed or removed in minor/patch releases.
2. **Observed Attributes & DOM Events**: Existing attribute names, boolean attribute behavior, `FormData` submission values, and CustomEvent names/`event.detail` fields remain backward-compatible.
3. **CSS Public Surface (`::part()` & `--el-*`)**: Documented `part="..."` names and `--el-*` design tokens in `src/tokens.css` remain stable; internal Shadow DOM markup structure outside `part` selectors remains encapsulated and private.
4. **Migration Notices**: Any future deprecations will log a single one-time dev warning and stay supported across at least one minor cycle before removal in the next major release.

---

## 4. `0.8.x` → `1.0.0` Release Gate Checklist

Elementum will move from `0.8.x` to `1.0.0` only when we can confidently promise API stability, compatibility, and dependable integration across supported agent and framework ecosystems:

- [x] Zero runtime dependencies enforced by external consumer tarball install (`npm run verify:consumer`)
- [x] ≥ 95% automated line coverage, strict TypeScript checking (`npm run typecheck`), and per-entrypoint gzip budgets (`npm run check:size`)
- [x] Cross-browser E2E + WCAG 2.2 AA `axe-core` checks (`npm run test:e2e`) across Chromium, Firefox, and WebKit including 50+ component zero-CLS DSD hydration, React/Vue/FACE interop (`e2e/framework-and-dsd-stress.spec.js`), and Hard-8 stress tests (`e2e/hard-8-stress.spec.js`)
- [x] Official React wrapper entrypoint (`@wcomp/elementum/react`) verified against real React 18 & 19 consumers (`npm run verify:react`)
- [x] Public migration guides (`docs/migration-guide.md`, `docs/tailwind-guide.md`), auto-generated `::part()` reference (`docs/styling-reference.md`), and connected platform showcase (`showcase.html`)
- [x] Full Playwright E2E + `axe-core` audit coverage across all `109 / 109` components in [`QUALITY.md`](../QUALITY.md)
- [ ] **External developer validation**: First-attempt integration feedback from independent teams using `npm install @wcomp/elementum && npx @wcomp/elementum init`
- [ ] **Independent multi-model AI benchmark runs**: External runs recorded in [`benchmarks/agent-eval/RESULTS.md`](../benchmarks/agent-eval/RESULTS.md)
- [ ] **Manual screen-reader sign-off** (NVDA / VoiceOver) in [`docs/accessibility-audit.md`](./accessibility-audit.md)
- [ ] **Published `1.0.0-rc.1`** reviewed for any final attribute, event, or `::part()` cleanup prior to freezing `1.0.0`

---

## 5. 5-Minute `v0.8.3` Architecture & Release-Readiness Evaluation

Independent reviewers can reproduce every architectural, type-safety, performance, and accessibility claim locally without trusting pre-generated reports:

```bash
# 1. Verify zero-dep tarball packaging, ESM subpath exports & strict TypeScript consumer
npm run verify:consumer

# 2. Verify React 18 & 19 SSR, StrictMode, prop removal & excess-prop rejection
npm run verify:react

# 3. Verify all framework starters build & typecheck cleanly
npm run verify:starters

# 4. Run Hard-8 complex widget stress tests (1,200-row table, nested modals, RTL mobile, axe-core)
npx playwright test e2e/hard-8-stress.spec.js

# 5. Re-score any arm of the 4-arm AI-agent UI benchmark in headless Chromium
node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/arm-1-elementum-mcp/index.html --arm="Arm 1: Elementum + MCP"
```

### Known Trade-Offs (Honest Caveats at `v0.8.3`)
- **Surface area vs. depth**: 109 components is a wide catalog; while all 109 pass unit + Playwright + `axe-core` gates, complex widgets (`el-table`, `el-datepicker`, `el-autocomplete`, `el-command`, `el-tree-view`) are our highest priority for real-world edge-case hardening before `1.0.0`.
- **Shadow DOM & Tailwind**: Global utility classes do not pierce Shadow DOM; teams use `--el-*` tokens, `[&::part(...)]:` variants ([`docs/tailwind-guide.md`](./tailwind-guide.md)), or `unstyled` mode + `@wcomp/elementum/behaviors`.
- **Protocol maturity**: `@wcomp/elementum/a2ui`, `@wcomp/elementum/ag-ui`, and `@wcomp/elementum/agent` remain `Beta` / `Experimental` while upstream agent UI protocols continue to evolve.

---

## 6. Browser Compatibility Matrix

Elementum relies exclusively on baseline modern web standards (zero polyfills required in supported browsers):

| Capability | Chrome / Edge | Firefox | Safari (macOS / iOS) | Fallback / Notes |
| :--- | :---: | :---: | :---: | :--- |
| Custom Elements v1 & Open Shadow DOM | `100+` | `101+` | `16.4+` | Baseline standard across all evergreen browsers |
| Constructable Stylesheets (`adoptedStyleSheets`) | `73+` | `101+` | `16.4+` | [`src/elementum.js`](../src/elementum.js) falls back to injected `<style>` if unsupported |
| Form-Associated Custom Elements (`ElementInternals`) | `90+` | `93+` | `16.4+` | Graceful `#validity` fallback tracked on instance |
| Declarative Shadow DOM (`shadowrootmode="open"`) | `111+` | `123+` | `16.4+` | Add `data-dsd` on `<html data-dsd>` when serving SSR markup |
| Verified Automated CI E2E Browsers | Latest Chromium | Latest Firefox | Latest WebKit | Enforced on `push` / `pull_request` via Playwright in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
