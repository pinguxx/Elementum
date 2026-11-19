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

## 3. WAI-ARIA, RTL & SSR Contract Testing (`@wcomp/elementum/testing`)

Validate any Elementum component or custom composition against WAI-ARIA Authoring Practices Guide (APG) rules, provider-free RTL detection, and pure Node.js Declarative Shadow DOM SSR:

```js
import { checkAriaPattern, checkDirection, checkServerRender } from '@wcomp/elementum/testing';
import { ElDialog } from '@wcomp/elementum';

const aria = checkAriaPattern(dialogEl, 'dialog');      // button, checkbox, switch, dialog, tabs, accordion, combobox, slider, progressbar
const rtl  = checkDirection(dialogEl);                  // verifies dir="ltr" and dir="rtl" without a provider
const ssr  = checkServerRender('el-dialog', ElDialog);  // verifies DSD <template shadowrootmode="open"> + XSS attribute escaping
```
