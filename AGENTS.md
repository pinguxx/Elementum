# AGENTS.md — Operational Playbook & Sync Map for `@wcomp/elementum`

> Read this file first before modifying code, docs, starters, MCP servers, or cutting a release.
> Deep architecture & component authoring rules live in [`AGENT_GUIDE.md`](./AGENT_GUIDE.md); UI craft rules for generated apps live in [`docs/agent-craft-guide.md`](./docs/agent-craft-guide.md).

---

## 1. Platform Overview & Hard Invariants

**Elementum** is an AI-native, framework-independent UI engineering platform connecting design systems, 109 zero-dependency Web Components, and AI agents through a shared, verifiable component contract.

**Never violate these invariants:**
1. **Zero Runtime Dependencies**: `package.json` must have **no** `"dependencies"` field. Only optional `peerDependencies: { react: ">=18.0.0" }` and `devDependencies` are allowed.
2. **Line Coverage ≥ 95%**: CI enforces `node --test --experimental-test-coverage --test-coverage-lines=95`.
3. **Gzipped Size Budgets**: All 86 entrypoints must stay within [`size-budget.json`](./size-budget.json) (`npm run check:size`).
4. **109 / 109 Production Verified**: Every registered component in `custom-elements.json` must remain Production Verified in [`QUALITY.md`](./QUALITY.md) (catalog schema + unit instantiation + Playwright real-browser E2E + `@axe-core/playwright` WCAG 2.2 AA).
5. **Vercel Edge Compatibility for MCP**: `mcp/core.js` and `mcp/edge.js` must use **zero Node built-ins** (no `node:fs`, `Buffer`, `readline`), and `api/mcp.js` must **not** use ES2025 `with { type: 'json' }` import attributes (Vercel Edge esbuild rejects them).
6. **Strict TypeScript**: Both `src/index.d.ts` and `src/react/index.d.ts` (zero `[prop: string]: any;`) must pass `tsc --noEmit --strict` and real React 18 & 19 consumer verification (`npm run verify:react`).
7. **No Secrets or Private Drafts in Git**: Never commit Penpot `userToken` JWTs, API keys, or private launch/marketing drafts.

---

## 2. Change → Required Sync Matrix

Whenever you modify a surface in the left column, **update and run everything in the right column before committing**:

| If You Change... | You MUST Also Update / Run... |
| :--- | :--- |
| **Any component (`src/components/el-*.js`)** | 1. Update `custom-elements.json`, `examples/catalog-data.js`, and `src/index.d.ts` if public attributes, events, slots, or signals changed.<br>2. Run `npm run react:generate` (regenerates `src/react/index.js` & `src/react/index.d.ts`).<br>3. Run `npm run mcp:metadata` (regenerates `mcp/component-metadata.json`).<br>4. Run `npm run catalog:diff && npm run check:size && npm test`.<br>5. Add/update Playwright E2E + `axe-core` coverage in `e2e/` and run `npm run quality:report`. |
| **Design tokens (`src/tokens.css`, `tokens/*.json`)** | 1. Run `npm run tokens:sync` (if editing DTCG JSON).<br>2. Run `npm run ssr:static` (refreshes `examples/ssr-demo.html`).<br>3. Run `npm run test:visual` (verify light/dark screenshot snapshots). |
| **MCP server (`mcp/core.js`, `mcp/edge.js`, `mcp/server.js`, `api/mcp.js`)** | 1. Keep `mcp/core.js` & `mcp/edge.js` pure JS (no Node built-ins) and keep `api/mcp.js` free of `with { type: 'json' }`.<br>2. Run `node --test test/mcp.test.js test/security.test.js`.<br>3. If remote URL or version changed, sync `server.json` and `llms.txt`. |
| **React wrapper runtime or generator (`src/react/runtime.js`, `tools/generate-react-wrappers.js`)** | 1. Run `npm run react:generate`.<br>2. Run `node --test test/react-wrapper.test.js`.<br>3. Run `npm run verify:react` (packs real `.tgz` and verifies React 18 & 19 SSR, StrictMode, prop removal, and strict TSX). |
| **SSR / AG-UI / A2UI / Behaviors / Agent / Testing subpaths** | 1. Update `package.json` `exports` + `sideEffects` (`./src/index.js`, `./src/react/index.js`, `./src/components/*.js`, and `./src/tokens.css` have side effects).<br>2. Add/update `.d.ts` definitions and verify with `npm run typecheck`.<br>3. Update `llms.txt`, `README.md`, `AGENT_GUIDE.md`, and `tools/verify-consumer.js`.<br>4. Run `npm run verify:consumer`. |
| **Starter projects (`starters/*`)** | 1. Run `npm run verify:starters` (installs, typechecks, and builds all framework starters).<br>2. Run `npm run bench:frameworks -- --write` (updates measured LOC & gzip table in `starters/framework-comparison/README.md`).<br>3. Keep `starters/README.md`, `README.md`, and `docs/framework-integration.md` synced.<br>4. Keep `vite` and `next` at current patched versions to avoid Dependabot alerts. |
| **Homepage / Examples (`index.html`, `showcase.html`, `examples/*.html`)** | 1. Run `node --test test/pages-smoke.test.js`.<br>2. If adding a major demo, link it from `index.html`, `README.md`, and `llms.txt`. |
| **AI-Agent Benchmark (`benchmarks/agent-eval/*`)** | 1. Score submissions with `node benchmarks/agent-eval/score.js <file.html> --arm="<Label>"`.<br>2. Record reproducible rows in `benchmarks/agent-eval/RESULTS.md`. |

---

## 3. Release & Publishing Checklist (`vX.Y.Z`)

Publishing to npm is automated via `.github/workflows/publish.yml` (OIDC Trusted Publishing) whenever a GitHub Release is published.

Before tagging and publishing a new version `X.Y.Z`:
1. Bump version: `npm version X.Y.Z --no-git-tag-version` (updates `package.json` and `package-lock.json`).
2. Update version references in **all** release-synced files:
   - `server.json` (`version` and `packages[0].version`)
   - `CHANGELOG.md` (add `## [X.Y.Z]` section)
   - `README.md` (`` `vX.Y.Z` `` header)
   - `SECURITY.md` (`` `X.Y.x` `` support row if minor changed)
   - `docs/stability-and-1.0.md` (`` `X.Y.x` `` minor line if minor changed)
   - `index.html` & `showcase.html` (`badge="vX.Y.Z"`)
   - `tools/sync-penpot-mcp.js` & `tools/penpot-to-elementum.js` (`version: 'X.Y.Z'`)
3. Regenerate reports:
   ```bash
   npm run quality:report
   npm run audits:report
   ```
4. Run all gates:
   ```bash
   npm run check:release
   npm run verify:all
   npm run verify:starters
   ```
5. Commit, push `main`, and publish the GitHub Release:
   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z — <Summary>" --notes "<Release Notes>"
   ```

---

## 4. Fast Verification Commands Reference

```bash
npm run verify:all        # catalog:diff, check:release, typecheck, check:size, test, verify:consumer, verify:react, test:e2e
npm run verify:starters   # Build & typecheck verification across starter projects
npm run test:visual       # Playwright light/dark screenshot regression
npm run quality:report    # Regenerate QUALITY.md
npm run audits:report     # Regenerate AUDITS.md
npm run bench:frameworks -- --write  # Re-measure React vs. Vue 3 vs. Vanilla comparison
npm run react:generate    # Regenerate src/react/index.js & src/react/index.d.ts from CEM
npm run mcp:metadata      # Regenerate mcp/component-metadata.json
```
