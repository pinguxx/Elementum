# Contributing to `@wcomp/elementum`

Thank you for contributing! Elementum prioritizes **reliability, accessibility, zero runtime dependencies, and small bundle budgets** over adding new components for their own sake.

---

## 1. Local Development & Prerequisites

- **Node.js**: `20.x`, `22.x`, or `24.x` (uses built-in `node:test`, `node --experimental-test-coverage`, and native ESM — no bundler required)
- **Strict install**:
  ```bash
  npm ci
  npx playwright install chromium   # Required for real-browser E2E & axe-core audits
  ```
- **Run the complete verification pipeline**:
  ```bash
  npm run verify:all
  ```
  This executes, in order:
  1. `npm run catalog:diff` — checks all components against `custom-elements.json` & `examples/catalog-data.js`
  2. `npm run typecheck` — strict TypeScript check on `src/index.d.ts` (also check `src/react/index.d.ts`)
  3. `npm run check:size` — enforces per-entrypoint gzipped byte budgets in [`size-budget.json`](./size-budget.json)
  4. `npm test` — Node.js unit, fuzz, contract, SSR & security tests (CI enforces `--test-coverage-lines=95`)
  5. `npm run verify:consumer` — packs `.tgz` and tests clean external installation
  6. `npm run test:e2e` — real-browser Playwright + `@axe-core/playwright` WCAG 2.2 AA suite

---

## 2. Engineering Rules

1. **Zero Runtime Dependencies**: Never add third-party packages to `dependencies` in `package.json`. Browser standards (`ElementInternals`, Shadow DOM, Popover/Dialog/Anchor/Signals) and composable primitives in [`src/behaviors/index.js`](./src/behaviors/index.js) cover all runtime behavior.
2. **Maintain Coverage & Size Budgets**: Keep all files above **95% line coverage** (`node --test --experimental-test-coverage --test-coverage-lines=95`) and inside [`size-budget.json`](./size-budget.json).
3. **Sync Generated Files After API Changes**:
   - After editing `src/tokens.css` / `tokens/penpot-tokens.json`: run `npm run tokens:sync` and `npm run ssr:static`.
   - After changing public attributes, events, or components in `custom-elements.json`: run `npm run react:generate` (`src/react/index.js` & `index.d.ts`), `npm run quality:report` (`QUALITY.md`), and `npm run catalog:diff`.
   - Do **not** include secrets or Penpot `userToken` JWTs in commits or screenshots.

---

## 3. Component Promotion Criteria (`QUALITY.md`)

Elementum separates component maturity transparently in [`QUALITY.md`](./QUALITY.md):

| Tier | Required Evidence |
| :--- | :--- |
| **🟡 Experimental** | Passes schema alignment (`catalog:diff`) and unit instantiation contracts |
| **🔵 Stable** | All above **plus** dedicated `test/` file(s) covering attributes, slots, events, FACE forms, and edge cases |
| **🟢 Production Verified** | All above **plus** direct Playwright real-browser interaction tests, `@axe-core/playwright` WCAG 2.2 AA audit (0 critical/serious violations), and manual assistive-technology verification below |

If you want to help make the library stronger, promoting an existing `🟡 Experimental` or `🔵 Stable` component to `🟢 Production Verified` is more valuable than proposing a brand-new component.

---

## 4. Manual Accessibility Verification Protocol

Automated `@axe-core/playwright` scans catch roughly 30–50% of WCAG issues (missing labels, invalid ARIA roles, color contrast). Every PR touching interactive components (especially `el-dialog`, `el-datepicker`, `el-autocomplete`, `el-table`, `el-tree-view`, `el-menu*`, `el-select`, and FACE forms) should also verify:

1. **Keyboard-Only Navigation**:
   - Unplug mouse/trackpad; reach every interactive control with `Tab` / `Shift+Tab`, activate with `Enter` / `Space`, move within composite widgets with Arrow keys / `Home` / `End`, and dismiss overlays with `Escape`.
   - Confirm visible focus indicator (`:focus-visible`) on every focusable part and proper focus restoration when overlays (`el-dialog`, `el-drawer`, `el-popover`) close.
2. **Screen Reader Checks** (at least one primary desktop combo):
   - Windows: **NVDA + Chrome / Firefox**
   - macOS: **VoiceOver + Safari**
   - Verify accessible name, role, checked/expanded/pressed/invalid states, error announcements, and Shadow DOM `LiveAnnouncer` polite/assertive messages.
3. **Zoom & Reflow (WCAG 1.4.4 & 1.4.10)**:
   - Test **200% text zoom** and **400% zoom / 320px–375px width** (`scrollWidth <= innerWidth`) with zero clipped controls or overlapping text.
4. **High Contrast & Reduced Motion**:
   - Check Windows High Contrast (`forced-colors: active` emulation in DevTools) to ensure borders, focus rings, and checked indicators stay distinguishable.
   - Verify `@media (prefers-reduced-motion: reduce)` disables non-essential keyframe/transition motion (`createPresenceBehavior`).

Include a brief **Accessibility Verification** note in your PR listing which checks ran (`axe-core`, keyboard-only, AT/OS/browser tested), and log manual screen-reader passes in [`docs/accessibility-audit.md`](./docs/accessibility-audit.md).

---

## 5. Security Reporting

See [`SECURITY.md`](./SECURITY.md) for responsible disclosure, MCP server threat boundaries, and untrusted input rules.
