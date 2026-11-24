## Summary

Describe the changes made and reference any related issues.

## Security & Quality Checklist

- [ ] **Zero runtime dependencies**: `package.json` still has no `"dependencies"` field
- [ ] **Coverage >= 95%**: `node --test --experimental-test-coverage --test-coverage-lines=95` passes
- [ ] **Size budgets**: `npm run check:size` passes all entrypoints
- [ ] **Sync & TypeScript**: Ran `npm run catalog:diff`, `npm run typecheck`, `npm run verify:consumer`, and `npm run verify:react`
- [ ] **Security boundaries preserved**: No unsanitized `innerHTML`, unsafe URL schemes (`javascript:`/`data:`/`vbscript:`), prototype pollution (`__proto__`/`constructor`/`prototype`), ReDoS regexes, or Node built-ins in `mcp/core.js` / `mcp/edge.js`
- [ ] **Accessibility (WCAG 2.2 AA)**: Checked `:focus-visible`, contrast (light & dark), reduced motion, and `npm run test:e2e` where UI changed
