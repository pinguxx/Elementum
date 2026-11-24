# Events and Reactivity (`@wcomp/elementum`)

Every Elementum component dispatches standard browser `CustomEvent` instances via `this.emit(name, detail)`. All emitted events default to:

- `bubbles: true` (events travel up the DOM tree and work with parent event delegation)
- `composed: true` (events cross Shadow DOM boundaries so listeners outside the component receive them)

You can listen to Elementum events the same way you listen to native HTML events.

---

## 1. Reading event payloads (`e.detail` vs `e.target.value`)

On native HTML inputs, `e.target.value` is a string. On Elementum components, reactive properties such as `el.value` and `el.checked` are `Signal` objects.

Always read the structured payload from **`e.detail`**:

```js
const search = document.querySelector('el-input');
const table = document.querySelector('el-table');

search.addEventListener('input', (e) => {
  table.filter.value = e.detail.value;
});
```

If you need to read the current value outside an event handler, read `.value` on the signal (`search.value.value` or `String(search.value)`).

---

## 2. Vanilla JS and event delegation

Because events bubble and are composed, you can attach listeners directly to an element or delegate from a parent container:

```js
// Direct listener
document.querySelector('el-switch').addEventListener('change', (e) => {
  console.log('Checked:', e.detail.checked);
});

// Event delegation on a container or form
document.querySelector('#settings-panel').addEventListener('change', (e) => {
  const target = e.target;
  console.log(target.tagName, e.detail);
});
```

---

## 3. Framework usage

### React 18 and 19 (`@wcomp/elementum/react`)

Use the generated typed wrappers so `onChange`, `onInput`, `onTabChange`, `onSort`, and `onSelectionChange` map automatically to the underlying custom events:

```tsx
import { useState } from 'react';
import { ElInput, ElTable } from '@wcomp/elementum/react';

export function UsersTable({ rows }: { rows: Record<string, unknown>[] }) {
  const [query, setQuery] = useState('');

  return (
    <>
      <ElInput
        placeholder="Filter users..."
        value={query}
        onInput={(e) => setQuery(e.detail?.value ?? '')}
      />
      <ElTable data={rows} filter={query} hover striped />
    </>
  );
}
```

### Vue 3

Bind listeners with `@event-name` directly on `el-*` tags:

```html
<el-input :value="query" @input="query = $event.detail.value" />
<el-table :data="rows" :filter="query" hover />
```

### Svelte 5

Use standard `on<event>` handlers on `el-*` tags:

```svelte
<el-input value={query} oninput={(e) => (query = e.detail.value)} />
<el-table data={rows} filter={query} hover />
```

---

## 4. Common event payload reference

| Components | Event name | `e.detail` shape |
| :--- | :--- | :--- |
| `el-input`, `el-textarea`, `el-prompt-input` | `input`, `change` | `{ value: string }` |
| `el-select`, `el-segmented-control`, `el-datepicker`, `el-otp-input` | `change` | `{ value: string }` |
| `el-checkbox`, `el-switch`, `el-radio`, `el-checkbox-card`, `el-radio-card` | `change` | `{ checked: boolean, value: string }` |
| `el-slider`, `el-rating`, `el-number-field` | `change` | `{ value: number }` |
| `el-autocomplete` | `select`, `change`, `clear`, `remove` | `{ value, item }` / `{ value }` |
| `el-table` | `sort`, `selectionchange` | `{ key, direction }` / `{ selected: number[] }` |
| `el-tabs` | `tabchange` | `{ value: string }` |
| `el-pagination` | `pagechange` | `{ page: number }` |
| `el-dialog`, `el-alert-dialog`, `el-drawer`, `el-dropdown` | `open`, `close` | `null` or `{ reason }` |
| `el-form` | `form-submit`, `form-invalid`, `form-reset` | `{ data: Record<string, any> }` |
| `el-theme-switch` | `themechange` | `{ theme: 'light' \| 'dark' }` |
| `el-tool-call` | `approve`, `reject` | `{ name, callId, args }` |
| `el-sources` | `source-select` | `{ index: number, source }` |

For the complete per-component event list, see `custom-elements.json` or query the MCP tool `get_component_info`.
