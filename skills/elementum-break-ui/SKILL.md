---
name: elementum-break-ui
description: Adversarial UI stress-testing skill for Web Components and Elementum pages. Systematically attempts to break layout, contrast, responsiveness, focus management, and reactivity before shipping.
---

# Elementum Break-UI Stress-Test Skill

Before declaring a component or page "done", actively try to break it across every vector in [CATALOG.md](./CATALOG.md).

## Stress-Test Workflow
1. **Viewport & Overflow**: Resize to `320px`, `375px`, `768px`, and `1440px`. Verify zero horizontal page overflow (`document.documentElement.scrollWidth <= window.innerWidth`), responsive `<el-navbar>` collapse, and scrollable `<el-table>` containers.
2. **Dark Mode & Contrast**: Toggle `:root[data-theme="dark"]` and hover/focus every button, badge, toggle, tooltip, and input. Confirm WCAG 2.2 AA contrast (≥ 4.5:1 for text, ≥ 3:1 for UI controls) and ensure isolated preview canvases stay independent of page theme.
3. **Extreme Content**: Test empty states (`""`, `[]`), 1-character labels, 120-character unbroken strings, and 50+ list items. Verify avatars never squish (`flex-shrink: 0`) and numbers never jitter (`tabular-nums`).
4. **Keyboard & Focus**: Tab through the entire flow without a mouse. Verify `<el-dialog>` and `<el-drawer>` restore focus on close, `Escape` dismisses overlays, and roving `tabindex` works on `<el-tabs>`, `<el-toolbar>`, `<el-menubar>`, and `<el-radio-group>`.
5. **Rapid & Edge Interactions**: Double-click submit buttons, open/close drawers rapidly, toggle `disabled` mid-interaction, and verify zero uncaught console errors or leaked listeners after element removal (`disconnected()`).
6. **Automated Gates**: Run `npm test` (including `test/catalog-contract.test.js` and `test/craft-contract.test.js`) and `node --test test/pages-smoke.test.js`.
