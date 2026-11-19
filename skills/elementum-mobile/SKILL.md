---
name: elementum-mobile
description: Mobile-native CSS and interaction standards for @wc/elementum Web Components — preventing sticky hover states, tap highlight flashes, iOS input auto-zoom, 100vh clipping, and background scroll bleed.
---

# Elementum Mobile-Native Craft Skill

Use this skill when building or auditing mobile views, PWAs, bottom sheets, or touch interactions with Elementum Web Components.

## Mobile-Native Checklist
1. **Eliminate Tap Delay & Grey Flash**: Set `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` on interactive buttons, toggles, chips, and segmented controls.
2. **Prevent Sticky Touch Hover**: Guard decorative `:hover` effects with `@media (hover: hover) and (pointer: fine)` when hover states would otherwise stick after a tap.
3. **Prevent iOS Safari Input Auto-Zoom**: Inside `@media (pointer: coarse)`, ensure `input`, `select`, and `textarea` use `font-size: max(16px, 1em)` so focusing a field never zooms the page.
4. **Use Dynamic Viewport (`100dvh`) + Safe Areas**: Never rely on bare `100vh` for sheets or modals—pair with `100dvh` and `env(safe-area-inset-bottom, 0px)` so iOS home indicators and dynamic toolbars never obscure controls.
5. **Contain Overlay Scroll**: Set `overscroll-behavior: contain` on `<el-drawer>`, `<el-dialog>`, and scrollable menus so scrolling inside an overlay never triggers pull-to-refresh or scrolls the background page.
6. **Prevent Accidental Text Selection**: Keep `user-select: none` on buttons, tabs, and drag handles so long-pressing doesn't highlight UI labels.

These rules are automatically enforced by `test/craft-contract.test.js`.
