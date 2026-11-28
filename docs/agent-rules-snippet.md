# Drop-in AI Agent Rules (`CLAUDE.md` / `.cursorrules` / `AGENTS.md`)

Copy the block below into your project's `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`, or `AGENTS.md` (or run `npx @wcomp/elementum init` to generate `elementum.rules.md`, `.mcp.json`, and `.cursor/mcp.json` automatically).

---

```markdown
## Elementum UI Rules (`@wcomp/elementum`)

1. **Always verify component APIs via Elementum MCP** (`https://elementum-sage.vercel.app/mcp`):
   - Before writing UI markup, call `get_component_schema` or `list_components` so you never invent tag names, attributes, or enum values.
   - Before finishing, call `validate_component_usage` and `lint_accessibility` on the generated HTML.

2. **Imports**:
   - Granular per-component imports (recommended when using `< 15` components for ~5x smaller bundles):
     ```js
     import '@wcomp/elementum/tokens.css';
     import '@wcomp/elementum/components/el-button.js';
     import '@wcomp/elementum/components/el-input.js';
     ```
   - Full barrel (Plain HTML / Vue / Svelte / Lit):
     ```js
     import '@wcomp/elementum/tokens.css';
     import '@wcomp/elementum';
     ```
   - React 18 / 19 & Next.js (strict typed wrappers):
     ```tsx
     import '@wcomp/elementum/tokens.css';
     import { ElButton, ElInput, ElDialog, ElTable } from '@wcomp/elementum/react';
     ```
   - Zero-build CDN (import map):
     ```html
     <link rel="stylesheet" href="https://unpkg.com/@wcomp/elementum/tokens.css" />
     <script type="module" src="https://unpkg.com/@wcomp/elementum"></script>
     ```

3. **Exact Component Conventions**:
   - **Dialogs**: Open/close `<el-dialog>` with `dialog.showModal()` and `dialog.close()` (never assign `dialog.open = true`).
   - **Boolean vs. Value Events**: Read `e.detail?.checked` on `<el-switch>` / `<el-checkbox>`, and `e.detail?.value ?? e.target.value` on `<el-input>`, `<el-textarea>`, `<el-select>`, and `<el-segmented-control>`.
   - **Tables**: Pass `.columns` and `.data` as JS array properties (or React props on `<ElTable>`).
   - **Badges**: Put text inside the `count` attribute (`<el-badge variant="success" count="Active"></el-badge>`) or default slot.
   - **Styling**: Override `--el-*` design tokens or target `::part(...)` selectors (see `docs/styling-reference.md`). Add `unstyled` to strip default Shadow DOM styles while preserving ARIA & keyboard behavior.
   - **Declarative Agent UI (A2UI)**: Use `createA2UiSurface` from `@wcomp/elementum/a2ui` to stream safe JSON surfaces into locked Elementum components.
```
