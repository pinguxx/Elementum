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

### 3. Typography, Spacing & Visual Rhythm
Follow consistent numeric rules rather than eyeballing values:
- **One primary CTA per view or card**: Use `<el-button variant="primary">` for the single most important action; use `secondary` or `ghost` for supporting actions and `danger` only for destructive actions.
- **Spacing scale**:
  - `8px` between tightly related controls (e.g., button pairs, icon + label)
  - `12px–16px` inside form groups and filter bars
  - `20px–24px` card inner padding
  - `24px–32px` between page sections
- **Readable typography**:
  - Constrain body prose to `max-width: 65ch`.
  - Apply `font-variant-numeric: tabular-nums` to tables, KPIs, and timers so digits stay aligned as values update.
  - Keep nested radii harmonious (`outer radius ≈ inner radius + padding`, e.g., `12px` card containing `8px` inputs/buttons).

### 4. Keep Motion Purposeful, Fast, and Accessible
- **Keep micro-interactions under 300ms** with natural `ease-out` curves (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Smooth numeric changes** for prices, counters, and live metrics with `<el-number-flow>`:
  ```html
  <el-number-flow value="24" prefix="$" suffix="/mo"></el-number-flow>
  ```
- **Respect `prefers-reduced-motion`**: Never force decorative animations when a user has reduced motion enabled. Elementum's built-in components and `prefersReducedMotion()` in `@wcomp/elementum/behaviors` handle this automatically.

### 5. Design Every State: Loading, Empty, Error, and Success
A polished UI handles more than just the happy path:
- **Loading**: Use `<el-skeleton>` to match the shape of incoming content instead of a blank box or layout-shifting spinner.
- **Empty**: Use `<el-empty-state>` with a clear next action instead of an empty table or blank panel.
- **Feedback**: Confirm mutations immediately with `<el-toaster>` (`toast.success()`, `toast.error()`, `toast.promise()`).
- **Form Validation**: Wrap inputs in `<el-form>` and `<el-field>` so native HTML5 Constraint Validation (`ElementInternals`) surfaces clear inline errors without custom boilerplate.

### 6. Make Keyboard Navigation First-Class
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

### 7. Build Mobile-Native Layouts From the Start
- Use `100dvh` instead of `100vh` for full-height shells so mobile browser chrome doesn't clip content.
- Keep interactive touch targets at least **24×24px** (WCAG 2.2 AA) and ideally **40–44px** on mobile.
- Use `font-size: 16px` on mobile text inputs to prevent unwanted iOS Safari auto-zoom.
- Prefer slide-up sheets (`<el-drawer side="bottom">`) over cramped centered modals on narrow viewports, and apply `overscroll-behavior: contain` inside scrollable overlays.

### 8. Use Purpose-Built Primitives for AI & Agentic Interfaces
When building chat, copilot, or agent workflows, reach for dedicated accessible components instead of assembling ad-hoc `<div>`s:
- **`<el-prompt-input>`** for auto-expanding prompt composition with `slot="tools"` and `slot="actions"`.
- **`<el-reasoning-card>`** for collapsible multi-step thought disclosure with live thinking indicators.
- **`<el-tool-call>`** for structured tool execution logs, JSON arguments/results, and Human-in-the-Loop (HITL) approvals.
- **`<el-streaming-text>`** for smooth token-by-token streaming output.
- **`<el-sources>`** for RAG grounding citations and expandable source cards.
- **`<el-diff-viewer>`** for reviewing unified or side-by-side code changes.

---

## 3. Component Selection Decision Matrix

Choose the exact semantic primitive instead of overloading a generic container:

| Need | Choose | Instead of |
| :--- | :--- | :--- |
| Complex form or focused modal task | `<el-dialog>` | `<el-popover>` |
| Destructive confirmation ("Delete account?") | `<el-alert-dialog>` | `<el-dialog>` |
| Mobile bottom sheet or side detail inspector | `<el-drawer>` | Cramped centered `<el-dialog>` |
| Lightweight contextual menu / inline panel | `<el-popover>` or `<el-dropdown>` | Full-screen modal |
| Transient action confirmation ("Saved") | `<el-toaster>` + `toast.success()` | Inline `<el-alert>` |
| Persistent page-level warning or error | `<el-alert>` or `<el-callout>` | Toast notification |
| Switching full content views | `<el-tabs>` + `<el-tab>` | `<el-segmented-control>` |
| Toggling compact view mode (Monthly / Yearly) | `<el-segmented-control>` | `<el-tabs>` |
| Read-only status or count pill | `<el-badge>` | `<el-chip>` |
| Interactive selectable or removable filter tag | `<el-chip selectable removable>` | `<el-badge>` |
| Key-value metadata list (account details) | `<el-data-list>` + `<el-data-list-item>` | `<el-table>` |
| Sortable, multi-row tabular dataset | `<el-table>` | Hand-rolled `<table>` |

---

## 4. Exact Elementum API & Wiring Cheat Sheet

Avoid common Web Component mistakes by using the exact Elementum APIs:

| Area | Correct Usage | Common Pitfall to Avoid |
| :--- | :--- | :--- |
| **Dialogs** | `dialog.showModal()` / `dialog.close()` | Setting `dialog.open = true` directly |
| **Signal Properties (Vanilla / Vue)** | `table.columns.value = cols; table.data.value = rows;` | Assigning `table.data = rows` (overwrites the Signal object) |
| **React Wrappers (`@wcomp/elementum/react`)** | `<ElTable columns={cols} data={rows} />` | Manually wiring `useEffect` refs for array props |
| **Input / Select Events** | Read `e.detail?.value` on `input` / `change` | Assuming `e.target.value` is a string (it is a `Signal` on `<el-input>`) |
| **AI Streaming Text** | Set attribute `stream.setAttribute('text', fullText)` or `stream.text.value = fullText` | Doing `stream.text += chunk` (corrupts the Signal) |
| **AI Tool Call Status** | `name="..."`, `status="running \| awaiting-approval \| completed \| error"` | Using `tool-name` or `status="pending"` |
| **AI Reasoning Card** | Boolean attributes `open` and `thinking` | Using `state="expanded"` |
| **AI Sources** | `sources.sources.value = [...]` or `sources='[...]'` | Setting `sources.items = [...]` |
| **Named Slots** | `slot="header"`, `slot="footer"`, `slot="prefix"`, `slot="suffix"`, `slot="actions"`, `slot="tools"` | Wrapping header content without `slot="header"` |
| **DSD Server Rendering** | Add `<html data-dsd>` when using `renderComponentToDSD(...)` | Omitting `data-dsd` (causes FOUC rules to hide pre-rendered elements) |

---

## 5. Three Canonical Layout Blueprints

### Blueprint A: Application Shell (Navbar + Sidebar + Command Palette)
```html
<el-navbar sticky brand="Acme Cloud" badge="Pro" badge-variant="primary">
  <a href="#overview" active>Overview</a>
  <a href="#analytics">Analytics</a>
  <el-theme-switch slot="actions"></el-theme-switch>
</el-navbar>

<div style="display: grid; grid-template-columns: 240px 1fr; min-height: calc(100dvh - 56px);">
  <el-sidebar open>
    <el-sidebar-content>
      <!-- Navigation links -->
    </el-sidebar-content>
  </el-sidebar>
  <main style="padding: 24px 32px; max-width: 1200px; width: 100%;">
    <!-- Page content -->
  </main>
</div>

<el-command placeholder="Jump to page or run action..."></el-command>
<el-toaster></el-toaster>
```

### Blueprint B: Data Table + Filter Bar + Modal CRUD
```html
<el-card bordered>
  <div slot="header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <h2 style="margin: 0;">Team Directory</h2>
      <el-badge variant="primary">12 members</el-badge>
    </div>
    <el-button id="btn-add" variant="primary">Add Member</el-button>
  </div>

  <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
    <el-input id="search" placeholder="Filter by name..."></el-input>
    <el-select id="role" value="all">
      <option value="all">All Roles</option>
      <option value="engineer">Engineer</option>
    </el-select>
  </div>

  <el-table id="table" selectable></el-table>
</el-card>

<el-dialog id="modal">
  <h3 slot="header" style="margin: 0;">Invite Member</h3>
  <!-- <el-form> fields -->
  <div slot="footer" style="display: flex; gap: 8px; justify-content: flex-end;">
    <el-button variant="secondary">Cancel</el-button>
    <el-button variant="primary">Invite</el-button>
  </div>
</el-dialog>
```

### Blueprint C: AI Agent / Chat Workspace
```html
<div style="max-width: 720px; margin: 0 auto; padding: 24px 16px; display: flex; flex-direction: column; gap: 16px;">
  <el-reasoning-card summary="Thought for 2.1s" open>
    Inspecting schema and verifying WCAG 2.2 AA contrast...
  </el-reasoning-card>

  <el-tool-call
    name="get_component_doc"
    status="completed"
    args='{"tag":"el-table"}'
    result='{"attributes":["selectable"],"events":["sort","selectionchange"]}'
  ></el-tool-call>

  <el-card bordered>
    <el-streaming-text speed="18" text="Here is the verified table configuration..."></el-streaming-text>
  </el-card>

  <el-sources
    label="Sources"
    sources='[{"title":"Elementum Docs","url":"https://elementum-sage.vercel.app/docs.html"}]'
  ></el-sources>

  <el-prompt-input placeholder="Ask the agent anything... (Enter to send)"></el-prompt-input>
</div>
```

---

## 6. Agent Self-Verification Loop (MCP + Runtime)

Before finishing a UI task, coding agents should run this 3-step verification loop:

1. **Inspect before writing (MCP)**: Call `get_component_doc` and `list_tokens` on `npx elementum-mcp` (or `https://elementum-sage.vercel.app/mcp`) instead of guessing attributes, slots, or token names.
2. **Audit accessibility statically (MCP)**: Pass generated HTML through the MCP `lint_accessibility` tool to catch missing labels, invalid ARIA roles, or form issues immediately.
3. **Verify live interactions (`@wcomp/elementum/agent`)**: Use `snapshot(root)` and `act(root, command)` to confirm the rendered Shadow DOM components are reachable by role/name and respond to semantic actions (`click`, `type`, `toggle`, `open`, `close`):
   ```js
   import { snapshot, act } from '@wcomp/elementum/agent';

   const tree = snapshot(document.body);
   act(document.body, { role: 'textbox', name: 'Filter by name...', action: 'type', value: 'Ada' });
   act(document.body, { role: 'button', name: 'Add Member', action: 'click' });
   ```

---

## 7. Quick Pre-Ship UI Checklist

Before shipping a screen or component, run through this 60-second check:

1. **Hierarchy**: Is there only one primary CTA per card/view, with secondary actions visually quieter?
2. **Light & Dark Mode**: Toggle `<el-theme-switch>` — do all text, badges, borders, and hover states maintain ≥ 4.5:1 contrast?
3. **Keyboard-Only**: Can you `Tab`, `Enter`, `Space`, and `Escape` through the entire flow without touching a mouse?
4. **320px Mobile**: Does the layout stack cleanly at 320px–375px width with zero horizontal overflow?
5. **Edge States**: What happens when data is loading, empty, very long (200+ characters), or fails?
6. **Zero Layout Shift**: Are images/cards sized predictably, and are server-rendered components using `renderComponentToDSD` with `<html data-dsd>`?

---

## 8. Ready-to-Copy Instructions for AI Coding Agents

Use the canonical rules snippet in [`docs/agent-rules-snippet.md`](./agent-rules-snippet.md) (written automatically by `npx @wcomp/elementum init`).
