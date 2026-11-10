# @wc/elementum

> Ultra-lightweight, signal-driven, frameworkless Web Components for modern design systems.

`Elementum` is inspired by libraries like `uce`, modernizing the developer experience with standard browser primitives:
- **Shadow DOM by default** with automatic Constructable Stylesheet adoption (`new CSSStyleSheet()`).
- **Fine-grained micro-signals** (`signal`, `computed`, `effect`): state updates mutate **only the exact bound DOM text or attribute node**—the component never re-renders, preserving child component state and input focus.
- **Zero build requirement**: Plain ES modules (`<script type="module">`), no Babel, decorators, or compile step needed.
- **Leak-free lifecycle**: Automatically tracks and tears down event listeners and signal subscriptions via `this.signal` (`AbortSignal`).
- **Figma 1:1 Parity**: Direct mapping to Figma Component Variants and Figma Variables.
- **AI Agent & MCP Ready**: Generates standard W3C `custom-elements.json` and includes a built-in MCP server for coding agents.

---

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="./src/tokens.css">
  <script type="module">
    import { Elementum, html, css, signal } from './src/index.js';

    class MyCounter extends Elementum {
      count = signal(0);

      static styles = css`
        button {
          background: var(--el-color-primary);
          color: white;
          padding: var(--el-spacing-sm) var(--el-spacing-md);
          border-radius: var(--el-radius-md);
          border: none;
          cursor: pointer;
        }
      `;

      render() {
        return html`
          <button @click=${() => this.count.value++}>
            Count: ${this.count}
          </button>
        `;
      }
    }
    customElements.define('my-counter', MyCounter);
  </script>
</head>
<body>
  <my-counter></my-counter>
</body>
</html>
```

---

## Project Structure

```
Elementum/
├── src/
│   ├── signal.js            # Micro-signals (~80 lines: signal, computed, effect)
│   ├── template.js          # Tagged template engine (html, css, DOM parts)
│   ├── elementum.js         # Base HTMLElement class with shadow DOM & styles
│   ├── tokens.css           # CSS variables mapped from Figma Variables
│   ├── index.js             # Public exports
│   └── components/
│       ├── el-button.js     # Reference button matching Figma variants
│       └── el-badge.js      # Reference badge component
├── figma/
│   └── el-button.figma.js   # Official Figma Code Connect configuration
├── tokens/
│   └── figma-tokens.json    # W3C design tokens export from Figma
├── custom-elements.json     # W3C Custom Elements Manifest (for agents & docs)
├── examples/
│   └── index.html           # Interactive demo showcase
├── mcp/
│   └── server.js            # Model Context Protocol server for AI coding agents
└── test/                    # Node test runner suite
```

---

## Figma Integration

1. **Tokens**: Export Figma variables into [tokens/figma-tokens.json](file:///c:/dev/Elementum/tokens/figma-tokens.json) and compile to [src/tokens.css](file:///c:/dev/Elementum/src/tokens.css).
2. **Code Connect**: Link Figma canvas components to code with [figma/el-button.figma.js](file:///c:/dev/Elementum/figma/el-button.figma.js).

---

## Agent MCP Server

Elementum includes an MCP server to let agents query the design system:

```bash
node mcp/server.js
```

Exposed tools:
- `list_components`: Lists all design system custom elements.
- `get_component_doc`: Fetches attributes, slots, events, and CSS parts from `custom-elements.json`.
- `list_tokens`: Returns design tokens by category.
- `generate_snippet`: Produces compliant HTML markup for Figma variants.
