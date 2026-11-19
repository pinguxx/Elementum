---
name: elementum-unslop
description: Clean up diffs before committing by removing redundant comments, section banners, filler JSDoc, and dead one-caller wrappers without changing behavior.
---

# Elementum Unslop Pass

Run on `git diff` (or target files) before committing. Behavior must remain 100% identical — all tests, strict TypeScript checks, and gzip size budgets must continue to pass.

## Remove
1. **Comments that restate the next line** (e.g. `// Close on Escape` right above `if (e.key === 'Escape') close()`).
2. **Section banners** (`// ================ Helpers ================`).
3. **History narration comments** (`// Updated to fix...`, `// Added per request...`) — git history owns this.
4. **Filler JSDoc** that repeats parameter/function names without adding type or behavioral constraints.
5. **Defensive checks for impossible internal states** that bloat gzipped bundle size.

## Keep
- Comments explaining a **browser quirk**, **WAI-ARIA APG rule**, **security invariant**, or **non-obvious trade-off** (≤ 3 lines).
- Public API JSDoc where it documents non-obvious options or invariants.

## Verify after cleanup
```bash
npm run check:size && npm run typecheck && npm test
```
