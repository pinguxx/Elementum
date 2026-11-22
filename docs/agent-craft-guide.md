# Simple Guidelines for Better UI Development

Practical, opinionated design-engineering guidelines for developers and AI coding agents building interfaces with `@wcomp/elementum`.

> **Design References:** Inspired by modern web craft principles (Emil Kowalski, Paco Coursey, *21st.dev*, *Beautiful UI*) paired with WCAG 2.2 AA accessibility and native Web Platform standards.

---

## 1. Why Structure & Craft Matter

When building a new dashboard, settings screen, or AI workspace quickly, interfaces often default to generic patterns:
- Flat, heavy borders around every container with no visual hierarchy.
- Abrupt state jumps with no loading, empty, or transition feedback.
- Mouse-only flows without keyboard navigation or shortcuts.
- Desktop-sized dialogs that feel cramped on mobile screens.
- Raw `<textarea>` inputs where a dedicated composer or form field would give users much better clarity.

The guidelines below turn high-craft UI habits into simple, repeatable defaults using Elementum's design tokens and components.

---

## 2. Core UI Development Guidelines

### 1. Anchor to a Proven Pattern Before Building
Before composing a new screen from scratch, start from a tested layout structure:
- **AI Workspaces & Prompt Flows**: [`examples/agent-studio.html`](../examples/agent-studio.html) and [`starters/ai-chat/`](../starters/ai-chat)
- **Pricing, Command Menus & Auth**: [`examples/references.html`](../examples/references.html)
- **Dashboards & Forms**: [`examples/app.html`](../examples/app.html) and [`examples/ledgerflow.html`](../examples/ledgerflow.html)
- **Data Tables & Filtering**: [`starters/framework-comparison/`](../starters/framework-comparison)

### 2. Use Subtle Depth Instead of Heavy Borders
Flat, high-contrast gray borders create visual noise when stacked in dashboards. Prefer translucent borders combined with soft, layered elevation tokens that adapt automatically to light and dark themes.

**Avoid:**
```css
border: 1px solid #cbd5e1;
box-shadow: none;
```

**Prefer:**
```css
border: 1px solid var(--el-border-translucent, rgba(15, 23, 42, 0.08));
box-shadow: var(--el-shadow-card, 0 1px 3px rgba(0, 0, 0, 0.06), 0 8px 16px -4px rgba(0, 0, 0, 0.04));
```

Always use semantic surface and text tokens (`--el-surface-base`, `--el-surface-card`, `--el-text-primary`, `--el-text-muted`) rather than hardcoded hex colors so `<el-theme-switch>` and dark mode stay legible everywhere.

### 3. Keep Motion Purposeful, Fast, and Accessible
- **Keep micro-interactions under 300ms** with natural `ease-out` curves (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Smooth numeric changes** for prices, counters, and live metrics with `<el-number-flow>`:
  ```html
  <el-number-flow value="24" prefix="$" suffix="/mo"></el-number-flow>
  ```
- **Respect `prefers-reduced-motion`**: Never force decorative animations when a user has reduced motion enabled. Elementum's built-in components and `prefersReducedMotion()` in `@wcomp/elementum/behaviors` handle this automatically.

### 4. Design Every State: Loading, Empty, Error, and Success
A polished UI handles more than just the happy path:
- **Loading**: Use `<el-skeleton>` to match the shape of incoming content instead of a blank box or layout-shifting spinner.
- **Empty**: Use `<el-empty-state>` with a clear next action instead of an empty table or blank panel.
- **Feedback**: Confirm mutations immediately with `<el-toaster>` (`toast.success()`, `toast.error()`, `toast.promise()`).
- **Form Validation**: Wrap inputs in `<el-form>` and `<el-field>` so native HTML5 Constraint Validation (`ElementInternals`) surfaces clear inline errors without custom boilerplate.

### 5. Make Keyboard Navigation First-Class
- Provide a global command palette (`<el-command>`) bound to <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> for quick navigation and actions:
  ```html
  <el-command placeholder="Type a command or search...">
    <el-command-group heading="Actions">
      <el-command-item value="deploy" shortcut="⌘D">Deploy</el-command-item>
    </el-command-group>
  </el-command>
  ```
- Preserve visible `:focus-visible` outlines on every interactive control.
- Ensure dialogs (`<el-dialog>`) and drawers (`<el-drawer>`) trap focus while open, close on <kbd>Esc</kbd>, and return focus to the trigger element on close.

### 6. Build Mobile-Native Layouts From the Start
- Use `100dvh` instead of `100vh` for full-height shells so mobile browser chrome doesn't clip content.
- Keep interactive touch targets at least **24×24px** (WCAG 2.2 AA) and ideally **40–44px** on mobile.
- Use `font-size: 16px` on mobile text inputs to prevent unwanted iOS Safari auto-zoom.
- Prefer slide-up sheets (`<el-drawer side="bottom">`) over cramped centered modals on narrow viewports, and apply `overscroll-behavior: contain` inside scrollable overlays.

### 7. Use Purpose-Built Primitives for AI & Agentic Interfaces
When building chat, copilot, or agent workflows, reach for dedicated accessible components instead of assembling ad-hoc `<div>`s:
- **`<el-prompt-input>`** for auto-expanding prompt composition with `slot="tools"` and `slot="actions"`.
- **`<el-reasoning-card>`** for collapsible multi-step thought disclosure with live thinking indicators.
- **`<el-tool-call>`** for structured tool execution logs, JSON arguments/results, and Human-in-the-Loop (HITL) approvals.
- **`<el-streaming-text>`** for smooth token-by-token streaming output.
- **`<el-sources>`** for RAG grounding citations and expandable source cards.
- **`<el-diff-viewer>`** for reviewing unified or side-by-side code changes.

---

## 3. Quick Pre-Ship UI Checklist

Before shipping a screen or component, run through this 60-second check:

1. **Hierarchy**: Is the primary action obvious at a glance, with secondary actions visually quieter?
2. **Light & Dark Mode**: Toggle `<el-theme-switch>` — do all text, badges, borders, and hover states maintain ≥ 4.5:1 contrast?
3. **Keyboard-Only**: Can you `Tab`, `Enter`, `Space`, and `Escape` through the entire flow without touching a mouse?
4. **320px Mobile**: Does the layout stack cleanly at 320px–375px width with zero horizontal overflow?
5. **Edge States**: What happens when data is loading, empty, very long (200+ characters), or fails?
6. **Zero Layout Shift**: Are images/cards sized predictably, and are server-rendered components using `renderComponentToDSD` with `data-dsd`?

---

## 4. Ready-to-Copy Instructions for AI Coding Agents

Paste this block into your `.cursorrules`, `CLAUDE.md`, `GEMINI.md`, or system prompt:

```markdown
When building user interfaces with @wcomp/elementum, follow these UI engineering guidelines:
1. USE SEMANTIC TOKENS: Use Elementum CSS custom properties (--el-surface-card, --el-text-primary, --el-border-translucent, --el-shadow-card) so light and dark themes work seamlessly with >= 4.5:1 contrast.
2. DESIGN ALL STATES: Handle loading (<el-skeleton>), empty (<el-empty-state>), error (<el-alert> / toast.error), and confirmation (toast.success) states.
3. SMOOTH METRICS & MOTION: Use <el-number-flow> for live numbers/prices and keep transitions under 300ms with ease-out easing while respecting prefers-reduced-motion.
4. KEYBOARD & FORMS: Provide <el-command> (⌘K) for power actions, preserve :focus-visible rings, and use native <el-form>/<el-field> with Form-Associated Custom Elements.
5. DEDICATED AI PRIMITIVES: Use <el-prompt-input>, <el-reasoning-card>, <el-tool-call>, <el-streaming-text>, <el-sources>, and <el-diff-viewer> for AI interfaces.
6. MOBILE FIRST: Test at 320px width, avoid horizontal overflow, use 100dvh, and keep touch targets >= 24x24px.
7. REFERENCE PATTERNS: Follow layouts in examples/agent-studio.html, examples/references.html, and starters/.
```
