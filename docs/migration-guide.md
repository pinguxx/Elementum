# Migrating to `@wcomp/elementum`

This guide compares `@wcomp/elementum` with **Shoelace / Web Awesome**, **Radix UI**, and **React Aria / Lit**, with concrete side-by-side examples for teams evaluating or migrating an application.

---

## 1. Quick Architectural Comparison

| Capability | `@wcomp/elementum` | Shoelace / Web Awesome | Radix UI + React Aria | Lit |
| :--- | :--- | :--- | :--- | :--- |
| **Runtime dependencies** | **0** (core + behaviors + SSR + MCP) | Floating UI / Lit runtime | React + Radix / Aria packages | `lit` (`@lit/reactive-element`, `lit-html`) |
| **Core bundle (gzip)** | **18.82 KB** transitive (`elementum + signal + template`) | ~14–40 KB+ depending on kit | React runtime + per-primitive packages | ~6–16 KB+ base runtime |
| **Reactivity model** | Fine-grained `signal()` / `computed()` / `effect()` | Lit reactive properties | React hooks + virtual DOM re-renders | Dirty-checking `requestUpdate()` cycle |
| **Form participation** | Native **FACE** (`ElementInternals`) | Custom form controller | Controlled React state or form libraries | Manual or community controllers |
| **Declarative Shadow DOM SSR** | Built-in (`@wcomp/elementum/ssr`) | Requires `@lit-labs/ssr` | React SSR (no Shadow DOM encapsulation) | Requires `@lit-labs/ssr` |
| **Headless / unstyled mode** | Built-in `unstyled` attribute + `@wcomp/elementum/behaviors` | Limited CSS parts | Unstyled by default | Bring your own styling |
| **React ergonomics** | Native in React 19 + `@wcomp/elementum/react` (109 typed wrappers) | `@shoelace-style/shoelace/dist/react` | Native React JSX | `@lit/react` manual wrappers |
| **AI agent & design tooling** | Built-in MCP server, `@wcomp/elementum/agent`, `@wcomp/elementum/ag-ui`, Penpot/Figma DTCG | External / community | External | External |

> See [`BENCHMARKS.md`](../BENCHMARKS.md) and [`size-budget.json`](../size-budget.json) for measured micro-benchmark methodology and CI-enforced entrypoint budgets.

---

## 2. Migrating from Shoelace / Web Awesome

Both libraries ship standard Custom Elements with Shadow DOM and CSS `::part()` selectors. The primary differences are **attribute/event naming**, **native `ElementInternals` forms**, and **signal reactivity**.

### Component Mapping

| Shoelace | Elementum | Notes |
| :--- | :--- | :--- |
| `<sl-button>` | `<el-button>` | Uses `variant="primary \| secondary \| outline \| danger \| ghost"` and `size="sm \| md \| lg"` |
| `<sl-badge>` | `<el-badge>` | Use `count` attribute or slotted text with `variant="default \| info \| success \| warning \| destructive"` |
| `<sl-input>` | `<el-input>` | Native FACE form validation (`required`, `minlength`, `pattern`, `FormData`) |
| `<sl-select>` | `<el-select>` | Supports native form reset and `change` / `input` events |
| `<sl-switch>` | `<el-switch>` | Boolean `checked`, native form value, standard `change` event |
| `<sl-dialog>` | `<el-dialog>` | Top-layer focus restoration, Escape dismiss (`close` event) |
| `<sl-drawer>` | `<el-drawer>` | Supports `placement="left \| right \| top \| bottom"` |
| `<sl-tab-group>` / `<sl-tab>` | `<el-tabs>` / `<el-tab>` | Emits standard `tabchange` (`e.detail.value`) and `change` |
| `<sl-tooltip>` | `<el-tooltip>` | Tokenized with `--el-tooltip-bg` / `--el-tooltip-text` |
| `<sl-alert>` | `<el-alert>` | Supports `closable` + `dismiss` / `close` events |

### Event & Styling Differences

- **Standard DOM Events (`change` / `input`) instead of prefixed events**:
  Replace `sl-change` / `sl-input` listeners with standard `change` and `input` events (`e.detail` still carries structured state where useful, while `target.value` / `FormData` works natively):
  ```html
  <!-- Shoelace -->
  <sl-input value="hello" onchange="..."></sl-input>
  <script>el.addEventListener('sl-input', (e) => console.log(e.target.value));</script>

  <!-- Elementum -->
  <el-input value="hello"></el-input>
  <script>el.addEventListener('input', (e) => console.log(e.target.value));</script>
  ```
- **CSS Design Tokens & `::part()`**:
  Replace `--sl-color-primary-600` with `--el-color-primary` (auto-themed via `:root[data-theme="dark"]` and `prefers-color-scheme: dark` in `@wcomp/elementum/tokens.css`).
- **Declarative Shadow DOM SSR**:
  Use [`@wcomp/elementum/ssr`](../src/ssr.js) directly in Node/edge runtimes and put `data-dsd` on `<html>` (`<html lang="en" data-dsd>`) so FOUC rules do not hide pre-rendered components before JS loads.

---

## 3. Migrating from Radix UI

Radix UI provides unstyled, accessible React primitives. Elementum gives you **cross-framework custom elements** with built-in accessible themes **or** completely unstyled headless mode (`unstyled` attribute + `@wcomp/elementum/behaviors`).

### Primitive Mapping

| Radix UI | Elementum | React Wrapper (`@wcomp/elementum/react`) |
| :--- | :--- | :--- |
| `<Dialog.Root>` + Content/Trigger | `<el-dialog>` | `<ElDialog open={open} onClose={() => setOpen(false)}>` |
| `<Tabs.Root>` + List/Trigger/Content | `<el-tabs>` + `<el-tab>` | `<ElTabs value={tab} onTabChange={(e) => setTab(e.detail.value)}>` |
| `<Accordion.Root>` + Item | `<el-accordion>` + `<el-accordion-item>` | `<ElAccordion onChange={...}>` |
| `<Select.Root>` | `<el-select>` | `<ElSelect value={val} onChange={(e) => setVal(e.detail.value)}>` |
| `<Popover.Root>` | `<el-popover>` | `<ElPopover>` |
| `<Tooltip.Root>` | `<el-tooltip>` | `<ElTooltip>` |
| `<Switch.Root>` | `<el-switch>` | `<ElSwitch checked={on} onChange={(e) => setOn(e.detail.checked)} />` |
| `@radix-ui/colors` | Built-in `--el-step-1`..`--el-step-12` | Included in `@wcomp/elementum/tokens.css` |

### Keeping Tailwind / Custom Design Systems (Headless Mode)

If you chose Radix specifically to style with Tailwind CSS or your own CSS architecture without overriding Shadow DOM styles, add the `unstyled` attribute (supported by `Elementum` base class) or compose primitives from `@wcomp/elementum/behaviors` directly (`createPressBehavior`, `createRovingFocus`, `createDismissableLayer`, `trapFocus`, `announce`).

---

## 4. Migrating from React Aria & Lit

### From React Aria (`useButton`, `useSelect`, `useFocusRing`)

- React Aria binds behavior through React-only hooks tied to React component re-renders.
- With Elementum, keyboard/ARIA/focus-recovery logic runs inside zero-dependency Shadow DOM primitives or `@wcomp/elementum/behaviors`, while state updates flow through fine-grained signals (`signal()`, `computed()`, `effect()`) without Virtual DOM diffing.
- For React 18 & 19 applications, import typed forward-ref wrappers directly from `@wcomp/elementum/react`:

```tsx
import { useState } from 'react';
import '@wcomp/elementum/tokens.css';
import { ElButton, ElInput, ElTable } from '@wcomp/elementum/react';

export function ProfileForm() {
  const [name, setName] = useState('');

  return (
    <form>
      <ElInput
        value={name}
        placeholder="Display name"
        required
        onInput={(e) => setName((e.target as HTMLInputElement).value)}
      />
      <ElButton type="submit" variant="primary">
        Save Profile
      </ElButton>
    </form>
  );
}
```

### From Lit (`LitElement`, `@property`)

- Instead of `@property()` decorator reflection triggering asynchronous `update()` cycles across the template, Elementum fields use direct synchronous signals (`variant = signal('primary')`) reflected cleanly via `observedAttributes`.
- Authoring custom components alongside Elementum works directly in plain ES modules with zero build transforms (`html`, `css`, `signal`, `Elementum`). See [`docs/framework-integration.md`](./framework-integration.md) for Vue 3, Svelte 5, and Next.js App Router setup.

---

## 5. Coming from `shadcn/ui` + Radix

Teams using `shadcn/ui` love owning clean, accessible primitives without fighting heavy runtime frameworks. Elementum gives you that same control **across React, Vue, Svelte, Next.js, and Vanilla HTML** without maintaining 40+ copied component files in your repo:

| `shadcn/ui` Pattern | Elementum Equivalent | Benefit |
| :--- | :--- | :--- |
| `npx shadcn add button dialog table` | `npm install @wcomp/elementum` + `npx @wcomp/elementum init` | 109 tree-shakeable components (`sideEffects` configured), 0 runtime deps |
| `<Button variant="destructive">` | `<el-button variant="danger">` or `<ElButton variant="danger">` | Native focus ring, WCAG 2.2 AA contrast, zero React re-render overhead |
| `<Dialog>` + `<DialogTrigger>` + `<DialogContent>` | `<el-dialog title="...">` + `dialog.showModal()` | Native top-layer `<dialog>`, Escape dismiss, focus restoration |
| `cn("rounded-xl", className)` | `class="[&::part(card)]:rounded-xl"` or `unstyled` | Keep Tailwind utilities directly—see [`docs/tailwind-guide.md`](./tailwind-guide.md) & [`docs/styling-reference.md`](./styling-reference.md) |
| Copy-pasting Tailwind theme vars | `--el-*` DTCG tokens (`src/tokens.css`) + [Theme Studio](../examples/registry.html#theme-studio) | 1:1 light/dark mode + Penpot/Figma sync |
| Prompting AI without schema validation | Hosted MCP (`https://elementum-sage.vercel.app/mcp`) + [`docs/agent-rules-snippet.md`](./agent-rules-snippet.md) | Verifies tags, attributes, and WCAG 2.2 AA before shipping |

