---
name: elementum-motion
description: Author, audit, and refine CSS animations, micro-interactions, and motion physics in Shadow DOM Web Components. Use when adding transitions, reviewing motion diffs, or removing sluggish/unnecessary animations.
---

# Elementum Motion & Craft Skill

High-craft UI motion feels crisp, physical, and unobtrusive. Follow [STANDARDS.md](./STANDARDS.md) whenever authoring or reviewing Shadow DOM component CSS.

## Quick Rules
1. **Never use `transition: all`**: Explicitly list transitioned properties (`transform`, `opacity`, `background-color`, `border-color`, `box-shadow`).
2. **Choose the Right Easing & Duration**:
   - Entrances & popovers: `ease-out` or `--el-ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`), **120ms–250ms** (never `ease-in` on entrances).
   - Micro-feedback (`:active` press): **100ms–150ms** with `transform: scale(0.97)`.
3. **Origin-Aware Overlays**: Popovers, dropdowns, tooltips, and context menus scale from their trigger edge (`transform-origin: bottom center` when placed `top`, `top center` when `bottom`, etc.). Modals (`<el-dialog>`) stay centered.
4. **Compositor-Only Motion**: Animate `transform` and `opacity` (and keep animated `blur()` ≤ `20px`). Avoid animating `width`, `height`, `top`, or `left` on high-frequency interactions.
5. **Respect Reduced Motion**: Every component with `@keyframes` or transform transitions must include `@media (prefers-reduced-motion: reduce)` to disable or calm animations.
6. **Know What NOT to Animate**: Keep keyboard-driven interactions (`<el-command>` `⌘K` selection, `<el-tabs>` arrow switching, table row focus) snappy and instant—motion should clarify spatial changes, never delay power users.
