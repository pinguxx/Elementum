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
| `createSpringEasing` | Zero-dependency damped harmonic spring `linear(...)` timing generator (`snappy`, `gentle`, `bouncy`, `stiff` + custom stiffness/damping/mass) |
| `createFlipBehavior` | WAAPI First-Last-Invert-Play (FLIP) layout transitions & sliding indicator helper (`glideIndicator`) honoring `prefers-reduced-motion` |
| `createInViewBehavior` | `IntersectionObserver`-backed viewport reveal signal (`inView`, `data-in-view`, `once`, `AbortSignal`) with reduced-motion fallback |
| `createPointerTracker` | Normalized pointer tracking writing `--el-pointer-x/y`, `--el-tilt-x/y`, and `--el-shift-x/y` CSS variables with auto-reset and `AbortSignal` |

### Practical Behavior Recipes

Every behavior primitive is **framework-free**, **zero-dependency**, and accepts an optional `{ signal }` (`AbortSignal`) or returns a `cleanup()` / `destroy()` function so listeners tear down automatically when an element disconnects.

#### Recipe A: Headless Accessible Menu / Popover
Combine `createDisclosureBehavior`, `createPopupPositioner`, `createDismissableLayer`, and `createRovingFocus` to build a WAI-ARIA menu with collision flipping, Escape/outside-click dismiss, and RTL-aware arrow navigation:

```js
import {
  createDisclosureBehavior,
  createPopupPositioner,
  createDismissableLayer,
  createRovingFocus,
} from '@wcomp/elementum/behaviors';

const trigger = document.getElementById('menu-btn');
const menu = document.getElementById('menu-panel');

const positioner = createPopupPositioner(trigger, menu, {
  placement: 'bottom-start',
  offset: 6,
  flip: true,
});

const disclosure = createDisclosureBehavior(trigger, menu, {
  onOpenChange: (isOpen) => {
    if (isOpen) positioner.update();
  },
});

const dismiss = createDismissableLayer(menu, {
  isOpen: () => disclosure.open.value,
  onDismiss: () => disclosure.close(),
  ignoreElements: [trigger],
});

const roving = createRovingFocus(menu, {
  selector: '[role="menuitem"]',
  orientation: 'vertical',
  loop: true,
  typeahead: true,
});

// On teardown:
// disclosure.destroy(); positioner.destroy(); dismiss.destroy(); roving.destroy();
```

#### Recipe B: Multi-Select + Keyboard Reorderable List
Combine `createSelectionBehavior`, `createReorderBehavior`, and `announce` for accessible list management with Shift-range selection and screen-reader feedback:

```js
import {
  createSelectionBehavior,
  createReorderBehavior,
  announce,
} from '@wcomp/elementum/behaviors';

const selection = createSelectionBehavior({
  mode: 'multiple',
  items: () => ['task-1', 'task-2', 'task-3'],
  onSelectionChange: (keys) => console.log('Selected:', [...keys]),
});

const reorder = createReorderBehavior(listContainer, {
  itemSelector: '[data-item-id]',
  onReorder: ({ fromIndex, toIndex }) => {
    announce(`Moved item from position ${fromIndex + 1} to ${toIndex + 1}`);
  },
});
```

#### Recipe C: Animated Enter/Exit + Focus Recovery + Reduced Motion
Use `createPresenceBehavior` to wait for real CSS transitions (`Element.getAnimations()`) before unmounting, `prefersReducedMotion` to respect OS motion settings, and `createFocusRecovery` so focus never drops to `document.body` if a focused item is deleted:

```js
import {
  createPresenceBehavior,
  createFocusRecovery,
  prefersReducedMotion,
} from '@wcomp/elementum/behaviors';

const reduced = prefersReducedMotion();
const presence = createPresenceBehavior(drawerEl, {
  present: false,
  reducedMotion: () => reduced.value,
});

const stopRecovery = createFocusRecovery(drawerEl, {
  fallback: () => triggerBtn,
});

// Trigger open/close transitions:
presence.setPresent(true);
```

#### Recipe D: Cross-Platform Shortcuts, Undo/Redo History & Search Highlighting
```js
import {
  createShortcuts,
  createHistory,
  splitMatchSegments,
} from '@wcomp/elementum/behaviors';

const history = createHistory({ title: 'Untitled' }, { limit: 50 });

const stopShortcuts = createShortcuts(window, {
  'Mod+K': () => document.querySelector('el-command')?.open(),
  'Mod+Z': () => history.undo(),
  'Mod+Shift+Z': () => history.redo(),
});

// XSS-safe highlighted search segments (no innerHTML required):
const segments = splitMatchSegments('Elementum Behaviors', 'behav');
// [{ text: 'Elementum ', match: false }, { text: 'Behav', match: true }, { text: 'iors', match: false }]
```

#### Recipe E: Zero-Leak Integration Inside an `Elementum` Component
Pass `this.signal` (Elementum's built-in lifecycle `AbortSignal`) or register cleanup in `disconnected()` so behaviors are guaranteed to clean up when the custom element is removed from the DOM:

```js
import { Elementum, html } from '@wcomp/elementum';
import { createPressBehavior, setHostState } from '@wcomp/elementum/behaviors';

class MyHeadlessButton extends Elementum {
  connected() {
    this.#stopPress = createPressBehavior(this.root.querySelector('button'), {
      onPress: () => this.emit('press'),
      onPressChange: (pressed) => setHostState(this, 'pressed', pressed),
    });
  }
  disconnected() {
    this.#stopPress?.();
  }
  render() {
    return html`<button type="button" part="button"><slot></slot></button>`;
  }
}
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
