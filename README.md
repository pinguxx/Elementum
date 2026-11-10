# @wc/elementum

> Ultra-lightweight, signal-driven, frameworkless Web Components for modern design systems.

`Elementum` is inspired by libraries like `uce`, modernizing the developer experience with standard browser primitives:
- **Shadow DOM by default** with automatic Constructable Stylesheet adoption (`new CSSStyleSheet()`).
- **Fine-grained micro-signals** (`signal`, `computed`, `effect`): state updates mutate **only the exact bound DOM text or attribute node**—the component never re-renders, preserving child component state and input focus.
- **Form-Associated Custom Elements (FACE)**: `static formAssociated = true` enables native `<form>` submission, reset, and validation via `ElementInternals`.
- **Zero build requirement**: Plain ES modules (`<script type="module">`), no Babel, decorators, or compile step needed. Runs in SSR / Node.js cleanly.
- **Light & Dark Mode**: Built-in CSS custom property theme tokens with automatic `prefers-color-scheme` and `<el-theme-switch>`.
- **Leak-free lifecycle**: Automatically tracks and tears down event listeners and signal subscriptions via `this.signal` (`AbortSignal`).
- **Figma 1:1 Parity**: Direct mapping to Figma Component Variants and Figma Variables.
- **AI Agent & MCP Ready**: Generates standard W3C `custom-elements.json` and includes a built-in MCP server for coding agents.
- **CI/CD & Automation**: GitHub Actions multi-OS / multi-Node matrix test runner and Dependabot automated dependency updates.

---

## Component Catalog

| Component | Tag Name | Description |
| :--- | :--- | :--- |
| **Button** | `<el-button>` | 1:1 Figma variant parity (`primary`, `secondary`, `danger`, `ghost`, sizes `sm`/`md`/`lg`). |
| **Badge** | `<el-badge>` | Status indicator pill (`default`, `success`, `danger`). |
| **Input** | `<el-input>` | Form-associated input with `prefix` and `suffix` icon slots. |
| **Dropdown** | `<el-dropdown>` | Popover container with light-dismiss (closes on outside click or <kbd>Esc</kbd>). |
| **Calendar** | `<el-calendar>` | Standalone 42-day accessible month grid with traversal. |
| **Datepicker** | `<el-datepicker>` | Form-associated composite datepicker combining input, dropdown, calendar, and quick actions. |
| **Dialog / Modal** | `<el-dialog>` | Native `<dialog>` modal with backdrop blur, overscroll containment, and light-dismiss. |
| **Tabs** | `<el-tabs>`, `<el-tab>` | W3C accessible tablist with keyboard arrow navigation. |
| **Select** | `<el-select>` | Form-associated custom dropdown selection. |
| **Theme Switch** | `<el-theme-switch>` | Toggles between Light ☀️ and Dark 🌙 mode with `localStorage` persistence. |
| **Toast** | `<el-toaster>` | Viewport overlay for programmatic notifications (`toast.success()`, `toast.error()`). |

---

## Interactive Examples

- **[examples/app.html](file:///c:/dev/Elementum/examples/app.html)**: Complete **Skyline Travel** booking dashboard demonstrating native form validation, confirmation modal dialogs, toast notifications, tabs, and theme toggling.
- **[examples/index.html](file:///c:/dev/Elementum/examples/index.html)**: Component showcase with standalone controls and live signal-reactive counter.

---

## Project Structure

```
Elementum/
├── .github/
│   ├── dependabot.yml       # Automated weekly dependencies & actions updates
│   └── workflows/ci.yml     # Multi-node, multi-OS CI test workflow
├── src/
│   ├── signal.js            # Micro-signals (~80 lines: signal, computed, effect)
│   ├── template.js          # Tagged template engine (html, css, surgical DOM parts)
│   ├── elementum.js         # Base class with Shadow DOM, styles, and formAssociated
│   ├── tokens.css           # Light & Dark CSS custom properties from Figma
│   ├── index.js             # Public library exports
│   └── components/
│       ├── el-button.js     # Reference button matching Figma variants
│       ├── el-badge.js      # Reference badge component
│       ├── el-input.js      # Form-associated input
│       ├── el-dropdown.js   # Light-dismiss dropdown overlay
│       ├── el-calendar.js   # Standalone calendar grid
│       ├── el-datepicker.js # Composite datepicker
│       ├── el-dialog.js     # Native modal dialog with backdrop containment
│       ├── el-tabs.js       # Accessible W3C tabs with keyboard navigation
│       ├── el-select.js     # Form-associated custom select
│       ├── el-toast.js      # Programmatic toast notification system
│       └── el-theme-switch.js # Light / Dark mode toggle
├── figma/
│   └── el-button.figma.js   # Official Figma Code Connect configuration
├── tokens/
│   └── figma-tokens.json    # W3C design tokens export from Figma
├── tools/
│   └── sync-tokens.js       # CLI to compile figma-tokens.json into tokens.css
├── custom-elements.json     # W3C Custom Elements Manifest (for agents & Storybook)
├── examples/
│   ├── app.html             # Full travel booking mini-app
│   └── index.html           # Component showcase
├── mcp/
│   └── server.js            # Model Context Protocol server for AI coding agents
└── test/                    # Node.js automated test runner suite
```

---

## Figma Token Synchronization

Synchronize design tokens from `tokens/figma-tokens.json` to `src/tokens.css`:

```bash
npm run tokens:sync
```

---

## Agent MCP Server

Run the built-in MCP server for AI coding agents:

```bash
node mcp/server.js
```
Exposed tools: `list_components`, `get_component_doc`, `list_tokens`, and `generate_snippet`.
