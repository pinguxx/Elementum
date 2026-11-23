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

## 6. Security Model (Zero Executable Code)

`@wcomp/elementum/a2ui` enforces defense-in-depth by default:

1. **Locked Catalog Allowlist**: Only component types present in `DEFAULT_A2UI_CATALOG` (or your custom `catalog` / `allowedTypes` subset) can render. Unregistered types (e.g. `RawScript`, `CustomIframe`) are silently dropped and recorded in `surface.blockedTypes.value`.
2. **Zero `innerHTML`**: All text and labels are bound via `textContent` and fine-grained signal `effect()`s.
3. **Inline Event Handler Stripping**: Any attribute matching `/^on/i` (`onclick`, `onerror`, etc.) is rejected.
4. **URL Scheme Allowlist**: `href` and `src` attributes only allow `https://`, `http://`, `/`, or `#` URLs (`javascript:` and `data:` are blocked).

```js
// Restrict an untrusted agent to a minimal 4-component subset
const restrictedSurface = createA2UiSurface({
  allowedTypes: ['Card', 'Column', 'Text', 'Button'],
  onAction: (ev) => handleSafeAction(ev),
});
```

---

## 7. API Reference

```ts
import {
  createA2UiSurface,
  DEFAULT_A2UI_CATALOG,
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
