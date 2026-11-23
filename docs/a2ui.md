# A2UI Declarative Renderer (`@wcomp/elementum/a2ui`)

`@wcomp/elementum/a2ui` is a zero-dependency, signal-driven **Agent-to-UI (A2UI)** renderer that maps declarative A2UI JSON messages (`createSurface`, `beginRendering`, `surfaceUpdate`, `dataModelUpdate`, `deleteSurface`) onto a **locked catalog** of native Elementum Web Components.

Instead of letting an LLM generate raw HTML or executable JavaScript, your agent streams safe, structured JSON messages—and Elementum renders them into accessible Shadow DOM components with two-way micro-signal data bindings and zero `innerHTML`.

> **Live Playground:** Try the interactive A2UI renderer (including the **▶ Simulate Agent Stream (JSONL)** progressive streaming demo and locked-catalog security test) at [`examples/a2ui.html`](https://elementum-sage.vercel.app/examples/a2ui.html).

---

## 1. How MCP, AG-UI, and A2UI Fit Together

| Protocol / Layer | Role in Elementum | Entrypoint |
| :--- | :--- | :--- |
| **MCP** (Build / Prompt Time) | Gives coding agents live schemas, design tokens, and WCAG validation when writing application code. | `https://elementum-sage.vercel.app/mcp` / `npx elementum-mcp` |
| **AG-UI** (Runtime Event Stream) | Streams agent execution lifecycle, reasoning text, tool calls, and RFC 6902 JSON Patch state deltas. | `@wcomp/elementum/ag-ui` (`createAgUiStore`) |
| **A2UI** (Runtime Declarative UI) | Lets an agent compose safe, interactive UI surfaces on the fly from a locked catalog of Elementum components. | `@wcomp/elementum/a2ui` (`createA2UiSurface`) |

---

## 2. Quick Start

```js
import '@wcomp/elementum/tokens.css';
import '@wcomp/elementum';
import { effect } from '@wcomp/elementum';
import { createA2UiSurface } from '@wcomp/elementum/a2ui';

const surface = createA2UiSurface({
  onAction: (event) => {
    // Dispatched when the user clicks a Button with an `action` payload
    console.log('Agent action:', event.actionName, event.context);
  },
});

surface.mount(document.getElementById('a2ui-host'));

// React to two-way data model updates via Elementum micro-signals
effect(() => {
  console.log('Current form state:', surface.dataModel.value);
});

// Feed A2UI messages (supports both v0.8 nested and v0.9 flat formats)
surface.processMessages([
  {
    dataModelUpdate: {
      path: '/',
      contents: [
        { key: 'seat', valueString: '14C' },
        { key: 'note', valueString: '' },
      ],
    },
  },
  {
    surfaceUpdate: {
      surfaceId: 'rebook',
      components: [
        { id: 'root', component: { Card: { title: { literalString: 'Rebook Flight' }, bordered: true, child: 'col' } } },
        { id: 'col', component: { Column: { gap: '12px', children: ['seat14', 'seat9', 'note', 'confirm'] } } },
        { id: 'seat14', component: { ChoiceChip: { label: { literalString: '14C · Main Aisle' }, value: '14C', selected: { path: '/seat' } } } },
        { id: 'seat9', component: { ChoiceChip: { label: { literalString: '9F · Exit Aisle' }, value: '9F', selected: { path: '/seat' } } } },
        { id: 'note', component: { TextField: { placeholder: 'Optional note...', value: { path: '/note' } } } },
        {
          id: 'confirm',
          component: {
            Button: {
              variant: 'primary',
              label: { literalString: 'Confirm Rebooking' },
              action: {
                name: 'confirm_rebooking',
                context: [
                  { key: 'seat', value: { path: '/seat' } },
                  { key: 'note', value: { path: '/note' } },
                ],
              },
            },
          },
        },
      ],
    },
  },
  { beginRendering: { surfaceId: 'rebook', root: 'root' } },
]);
```

---

## 3. Supported A2UI Message Types

| Message Key | Purpose |
| :--- | :--- |
| `dataModelUpdate` | Updates values at a JSON Pointer `path` (e.g. `/`, `/user/email`) in the reactive `surface.dataModel` signal. |
| `surfaceUpdate` | Upserts flat component nodes by `id` into the surface graph and triggers incremental DOM reconciliation. |
| `beginRendering` / `createSurface` | Declares the `root` component ID for the surface and mounts the rendered Elementum tree. |
| `deleteSurface` | Tears down active signal effects, event listeners, and DOM nodes for the surface. |

---

## 4. Progressive JSONL Streaming

Because `surface.processMessage(msg)` accepts one message at a time and merges updates incrementally, you can pipe any streaming NDJSON / JSONL LLM response directly into Elementum:

```js
async function streamA2UiResponse(url, surface) {
  const res = await fetch(url);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) surface.processMessage(JSON.parse(trimmed));
    }
  }
}
```

---

## 5. Built-In Locked Catalog (`DEFAULT_A2UI_CATALOG`)

| Category | A2UI Component Type | Rendered Elementum Element |
| :--- | :--- | :--- |
| **Layout** | `Column`, `Row`, `List`, `Divider` | Flex `div`, `<el-separator>` |
| **Surfaces & Display** | `Card`, `Text`, `Badge`, `Callout`, `Alert`, `Progress`, `Meter`, `Avatar`, `CodeBlock` | `<el-card>`, `<span>`, `<el-badge>`, `<el-callout>`, `<el-alert>`, `<el-progress>`, `<el-meter>`, `<el-avatar>`, `<el-code-block>` |
| **Forms & Controls** | `Button`, `TextField`, `TextArea`, `Select`, `Switch`, `CheckBox`, `Slider`, `DatePicker`, `ChoiceChip`, `Tabs`, `Dialog` | `<el-button>`, `<el-input>`, `<el-textarea>`, `<el-select>`, `<el-switch>`, `<el-checkbox>`, `<el-slider>`, `<el-datepicker>`, `<el-chip>`, `<el-tabs>`, `<el-dialog>` |
| **AI Primitives** | `PromptInput`, `ReasoningCard`, `ToolCall`, `StreamingText`, `Sources` | `<el-prompt-input>`, `<el-reasoning-card>`, `<el-tool-call>`, `<el-streaming-text>`, `<el-sources>` |

---

## 6. Explicit A2UI Security Boundary (Untrusted Agent Input)

Agent-generated structured UI is still **untrusted input**. `@wcomp/elementum/a2ui` enforces a strict, inspectable boundary across six attack surfaces:

| Vector | What the Renderer Accepts | What the Renderer Rejects / Clamps |
| :--- | :--- | :--- |
| **1. Unknown Component Types** | Only types present in `DEFAULT_A2UI_CATALOG` (27 Elementum primitives) and, when configured, `options.allowlist` / `options.allowedTypes`. | Unregistered or non-allowlisted types (e.g., `RawScript`, `CustomIframe`, `<script>`) are never instantiated and are appended to `surface.blockedTypes.value`. |
| **2. Unsupported Properties & DOM Sinks** | Declarative attributes, two-way bound form props (`value`, `checked`, `selected`), and safe layout props (`gap`, `align`, `usageHint`). | Inline event handlers matching `/^on/i` (`onclick`, `onerror`, `onload`), dangerous DOM sinks (`innerHTML`, `outerHTML`, `srcdoc`), and prototype keys (`__proto__`, `constructor`, `prototype`) are stripped on both props and `dataModelUpdate` JSON Pointers. |
| **3. Invalid or Oversized Messages** | Well-formed object messages up to `maxComponents` (default **`500`** nodes per surface) and string values up to `maxStringLength` (default **`65,536`** chars). | Non-object payloads are ignored; new component insertions past `maxComponents` are dropped; oversized strings and `actionName` (>256 chars) are clamped to prevent browser tab DoS. |
| **4. Nested Structures & Maximum Depth** | Acyclic component trees up to `maxDepth` (default **`32`** levels). | Circular `child` / `children` references are broken per branch (`visited` set), and subtrees deeper than `maxDepth` are pruned to prevent stack overflow. |
| **5. URL-Bearing Properties** | `href`, `src`, `action`, `formaction`, `poster`, and `xlink:href` matching `/^(https?:\/\/|\/|#)/i`. | `javascript:`, `data:`, `vbscript:`, and `file:` URLs are stripped **both** on initial `surfaceUpdate` and reactively inside `effect()` whenever a bound `dataModelUpdate` mutates a path. |
| **6. Event / Action Trust Boundary** | User interactions on `Button` (`click`) or `PromptInput` (`submit`) with a declarative `action` descriptor emit a plain `{ surfaceId, actionName, sourceComponentId, context }` object to `onAction`. | No dynamic code evaluation (`eval`, `new Function`) ever occurs. **Host responsibility:** Treat `event.actionName` and `event.context` as untrusted intent—validate and authorize every action on the host/server before mutating application state or invoking privileged tools. |

```js
// Lock an untrusted agent to a 4-component allowlist with tighter resource budgets
const restrictedSurface = createA2UiSurface({
  allowlist: ['Card', 'Column', 'Text', 'Button'],
  maxDepth: 12,
  maxComponents: 100,
  maxStringLength: 4096,
  onAction: (ev) => {
    // Always validate actionName & context on the host before executing mutations
    if (ev.actionName === 'confirm_rebooking') handleSafeRebooking(ev.context);
  },
});
```

---

## 7. API Reference

```ts
import {
  createA2UiSurface,
  DEFAULT_A2UI_CATALOG,
  A2UI_SECURITY_DEFAULTS,
  type A2UiSurfaceOptions,
  type A2UiSurface,
  type A2UiActionEvent,
} from '@wcomp/elementum/a2ui';
```

- `surface.mount(container)`: Mounts the surface into a DOM element.
- `surface.processMessage(message)`: Applies a single A2UI JSON message.
- `surface.processMessages(messages)`: Applies an array of A2UI JSON messages.
- `surface.dataModel`: Reactive `Signal<Record<string, unknown>>` holding the live two-way bound data model.
- `surface.blockedTypes`: Reactive `Signal<string[]>` listing any disallowed component types dropped by the locked catalog.
- `surface.destroy()`: Disposes all signal effects, removes event listeners, and clears mounted DOM nodes.
