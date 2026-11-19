---
name: elementum-ui
description: Compose accessible, zero-dependency user interfaces using @wc/elementum's 105 Web Components, micro-signals, and Form-Associated Custom Elements (FACE). Use when building or refactoring UI with Elementum.
---

# Elementum UI Engineering Skill

Use `@wc/elementum` primitives directly—do **not** reach for React, Tailwind utility walls, or hand-rolled `<div>` modals/inputs when an Elementum Custom Element exists.

## Core Rules
1. **Zero Runtime Dependencies**: Import `@wc/elementum` and `@wc/elementum/tokens.css` via native ES modules (`<script type="module">`).
2. **Verify Schema Before Writing Markup**: Read [CATALOG.md](./CATALOG.md) or query the Elementum MCP server (`list_components`, `get_component_doc`) so you never invent nonexistent attributes or slots.
3. **Reactive Signal Bindings**:
   - Inside `html` tagged templates, pass either the signal object (`${this.count}`) or a closure (`${() => this.count.value}`).
   - **Never** evaluate `${this.count.value}` directly outside an arrow function—it unwraps once at mount and stops updating.
   - Use `.prop=${...}` for JS properties, `?attr=${...}` for boolean attributes, and `@event=${...}` for listeners.
4. **Native Form Participation (FACE)**: Place `<el-input>`, `<el-select>`, `<el-textarea>`, `<el-checkbox>`, `<el-radio-group>`, `<el-switch>`, `<el-slider>`, `<el-datepicker>`, `<el-otp-input>`, `<el-autocomplete>`, and `<el-segmented-control>` inside native `<form>` elements—they integrate with `FormData`, `reportValidity()`, and `form.reset()`.
5. **Theming & Contrast**:
   - Use `--el-*` CSS custom properties (`--el-surface-base`, `--el-surface-card`, `--el-text-primary`, `--el-border-translucent`, `--el-shadow-card`) rather than hardcoded hex colors.
   - Always test both Light (`:root`) and Dark (`:root[data-theme="dark"]`) modes, especially hover states on secondary/ghost controls.
6. **Agentic / AG-UI Frontends**: Use `createAgUiStore()` + `<el-prompt-input>`, `<el-reasoning-card>`, `<el-streaming-text>`, `<el-tool-call>` (HITL approval), and `<el-number-flow>` to bind live SSE agent streams directly to DOM nodes without virtual-DOM re-render cascades.
