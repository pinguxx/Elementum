# Headless Behaviors, Agent Runtime & Testing Contracts

Elementum separates **reusable UI behavior**, **AI agent operation**, and **WAI-ARIA contract testing** into zero-dependency subpath exports so you can compose custom interfaces or audit existing ones without coupling to a framework.

---

## 1. Headless Behaviors (`@wcomp/elementum/behaviors`)

Use any `<el-*>` component with the `unstyled` attribute to strip default Shadow DOM styles while preserving ARIA, keyboard navigation, and `data-state` / `data-starting-style` / `data-ending-style` hooks — or compose behaviors directly in your own custom elements:

| Primitive | Purpose |
| :--- | :--- |
| `createPressBehavior` | Normalizes mouse, touch, and keyboard (`Enter`/`Space`) press without sticky touch hover |
| `createRovingFocus` | Horizontal/vertical/grid arrow-key focus, `Home`/`End`, Unicode typeahead, and automatic RTL reversal |
| `createDismissableLayer` | Nested overlay stack handling `Escape` and outside pointer clicks (top-most layer first) |
| `createFocusRecovery` | Watches a container via `MutationObserver` and restores focus to a fallback when a focused node disappears |
| `createShortcuts` | Cross-platform keyboard shortcuts (`Mod+K` → `⌘K` on macOS, `Ctrl+K` elsewhere), ignoring editable inputs |
| `createDisclosureBehavior` | Wires `aria-expanded`, `aria-controls`, `hidden`, and `data-state="open"\|"closed"` for trigger/panel pairs |
| `createPopupPositioner` | Viewport-aware anchor positioning with automatic collision flipping (`bottom`↔`top`, `right`↔`left`) |
| `createPresenceBehavior` | Enter/exit lifecycle (`unmounted` → `entering` → `entered` → `exiting`) waiting on `Element.getAnimations()` |
| `prefersReducedMotion` | Reactive `Signal<boolean>` synced to `matchMedia('(prefers-reduced-motion: reduce)')` |
| `createSelectionBehavior` | Single, multiple, `Shift`-range, `selectAll`, and `disabledKeys` selection state |
| `createReorderBehavior` | Accessible keyboard grab/move/drop/cancel + HTML5 pointer drag-and-drop with screen-reader announcements |
| `splitMatchSegments` / `highlightMatch` | XSS-safe case-insensitive search highlighting with `<mark part="highlight">` |
| `announce` / `clearAnnouncer` | Polite & assertive ARIA live-region announcements |
| `setHostState` | Dual state reflection to `data-<state>` attributes and `ElementInternals.states` (`:state(...)`) |
| `createHistory` | Signal-backed undo/redo state history (`push`, `undo`, `redo`, `canUndo`, `canRedo`, `limit`) |
| `isRTL` / `formatLocaleNumber` / `formatLocaleDate` | Provider-free RTL detection and native `Intl` formatting |

```js
import { createFocusRecovery, createShortcuts, createPresenceBehavior } from '@wcomp/elementum/behaviors';

const stopShortcuts = createShortcuts(window, {
  'Mod+K': () => document.querySelector('el-command')?.open(),
});
```

---

## 2. Shadow-DOM Agent Runtime (`@wcomp/elementum/agent`)

Standard browser automation struggles with Shadow DOM encapsulation. `@wcomp/elementum/agent` provides a zero-dependency WebMCP runtime bridge:

- **`snapshot(root)`** — Pierces open Shadow DOM and emits a compact, deterministic list of interactive controls (`ref` handles `@e1`, `@e2`, `tag`, `role`, `name`, `value`, `state`, and supported `actions`).
- **`act(root, command, { guard })`** — Executes semantic actions (`click`, `type`, `toggle`, `open`, `close`, `focus`, `press`) by `ref`, CSS `selector`, or `role` + `name`, with an optional `guard` hook to gate destructive actions.
- **`registerWebMCP(root, { guard })`** — Registers `elementum_snapshot` and `elementum_act` with the browser's `navigator.modelContext` API when available.

```js
import { snapshot, act } from '@wcomp/elementum/agent';

const tree = snapshot(document.body);
act(document.body, { role: 'textbox', name: 'Work Email', action: 'type', value: 'ada@example.com' });
act(document.body, { role: 'switch', name: 'Enable Alerts', action: 'toggle' });
act(document.body, { role: 'button', name: 'Save Settings', action: 'click' });
```

---

## 3. WAI-ARIA, RTL, SSR & Declarative Component Testing (`@wcomp/elementum/testing`)

> **Scope note:** `checkAriaPattern` is a **structural contract validator** (roles and ARIA attributes), not a substitute for real-browser focus/keyboard and `@axe-core/playwright` verification. Combine it with `testComponent()` and Playwright E2E for full behavioral coverage.

```js
import { checkAriaPattern, checkDirection, checkServerRender, testComponent } from '@wcomp/elementum/testing';
import { ElDialog } from '@wcomp/elementum';

const aria = checkAriaPattern(dialogEl, 'dialog');      // button, checkbox, switch, dialog, tabs, accordion, combobox, slider, progressbar
const rtl  = checkDirection(dialogEl);                  // verifies dir="ltr" and dir="rtl" without a provider
const ssr  = checkServerRender('el-dialog', ElDialog);  // verifies DSD <template shadowrootmode="open"> + XSS attribute escaping

// Declarative agent-powered component test
const result = await testComponent('el-switch', {
  attrs: { label: 'Email Digest' },
  actions: [{ action: 'toggle' }],
  assertions: [
    { type: 'checked', equals: true },
    { type: 'accessible-name', includes: 'Email Digest' },
    { type: 'aria-pattern', pattern: 'switch' },
  ],
});
```

---

## 4. Async Signals, Batching & Error Details (`@wcomp/elementum`)

Elementum's micro-signal engine (`src/signal.js`) includes first-class async primitives inspired by async-first reactive graphs:

- **`batch(fn)`** — Coalesces multiple signal writes into a single atomic notification pass while keeping `computed()` reads fresh inside the batch.
- **`asyncSignal(fetcher, { initialValue, immediate, signal, onError })`** — Tracks synchronous signal reads inside `fetcher(abortSignal)`, cancels stale in-flight requests automatically via `AbortSignal`, preserves the last resolved `.value` during refreshes (stale-while-revalidate), and exposes `.pending`, `.status` (`'idle' | 'pending' | 'resolved' | 'errored'`), structured `.error` (`{ message, name, cause, status, timestamp, attempt }`), `.refetch()`, `.abort()`, `.mutate()`, and `.read()` (throws `NotReadyError` while initial load is unresolved).
- **`isPending(source)`** — Checks whether an `AsyncSignal` or reactive getter calling `.read()` is pending, safely catching `NotReadyError`.
- **`effect(fn, { signal, onError })` & `Computed.error`** — Isolates and reports reactive exceptions cleanly without crashing sibling bindings.

```js
import { signal, asyncSignal, batch, isPending, effect } from '@wcomp/elementum';

const userId = signal(1);
const user = asyncSignal(async (abortSignal) => {
  const id = userId.value;
  const res = await fetch(`/api/users/${id}`, { signal: abortSignal });
  if (!res.ok) throw Object.assign(new Error('Failed to load user'), { status: res.status });
  return res.json();
});

effect(() => {
  if (isPending(user)) console.log('Loading...');
  else if (user.error.value) console.log('Error:', user.error.value.message, user.error.value.status);
  else console.log('User:', user.value);
});
```
