# Authoring Custom Components (`@wcomp/elementum`)

Every team eventually needs a domain-specific component beyond the built-in 113 elements. You can author custom Web Components using the same base class (`Elementum`), micro-signals (`signal`, `computed`), design tokens (`--el-*`), and headless interaction behaviors (`@wcomp/elementum/behaviors`) that power Elementum itself.

---

## 1. Complete example: `<my-action-panel>`

This single-file component supports light and dark mode, unified pointer and keyboard press, WAI-ARIA disclosure attributes, Escape and outside-click dismissal, screen-reader announcements, and automatic cleanup on disconnect:

```js
import { Elementum, html, css, signal } from '@wcomp/elementum';
import {
  createPressBehavior,
  createDisclosureBehavior,
  createDismissableLayer,
  announce,
} from '@wcomp/elementum/behaviors';

export class MyActionPanel extends Elementum {
  static observedAttributes = ['label', 'disabled', 'open'];

  label = signal('Actions');
  disabled = signal(false);
  open = signal(false);

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: var(--el-font-sans, system-ui, sans-serif);
    }

    button {
      padding: 8px 14px;
      border-radius: var(--el-radius-md, 8px);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-card, #ffffff);
      color: var(--el-text-primary, #0f172a);
      cursor: pointer;
    }

    :host([data-pressed]) button {
      transform: scale(0.98);
    }

    .panel {
      margin-top: 8px;
      padding: 12px;
      border-radius: var(--el-radius-md, 8px);
      border: 1px solid var(--el-surface-border, #e2e8f0);
      background: var(--el-surface-elevated, #ffffff);
      color: var(--el-text-primary, #0f172a);
    }
  `;

  attributeChanged(name, _oldVal, newVal) {
    if (name === 'label') this.label.value = newVal || 'Actions';
    if (name === 'disabled') this.disabled.value = newVal !== null && newVal !== 'false';
    if (name === 'open') this.open.value = newVal !== null && newVal !== 'false';
    return true;
  }

  rendered() {
    const trigger = this.root.querySelector('button');
    const panel = this.root.querySelector('.panel');

    // Unified pointer + keyboard (Enter/Space) press and touch-safe hover
    createPressBehavior(this, trigger, {
      isDisabled: () => this.disabled.value,
      signal: this.signal,
    });

    // WAI-ARIA disclosure: manages aria-expanded, aria-controls, hidden, data-state
    const disclosure = createDisclosureBehavior(trigger, panel, {
      initialOpen: this.open.value,
      signal: this.signal,
      onOpenChange: (isOpen) => {
        this.open.value = isOpen;
        this.setHostState('open', isOpen);
        this.emit(isOpen ? 'open' : 'close', { open: isOpen });
        announce(isOpen ? 'Panel opened' : 'Panel closed');
      },
    });

    // Light-dismiss on Escape key or pointer click outside the host
    createDismissableLayer(this, {
      isOpen: () => this.open.value,
      onDismiss: () => disclosure.close(),
      signal: this.signal,
    });
  }

  render() {
    return html`
      <button type="button" part="trigger" ?disabled=${() => this.disabled.value}>
        ${() => this.label.value}
      </button>
      <div class="panel" part="panel">
        <slot></slot>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('my-action-panel')) {
  customElements.define('my-action-panel', MyActionPanel);
}
```

---

## 2. Core authoring rules

### Bind signals as functions inside `html`

Write `${() => this.label.value}`, not `${this.label.value}`. Passing an arrow function creates a fine-grained reactive subscription that updates only that exact text node or attribute when the signal changes.

### Pass `signal: this.signal` for leak-free cleanup

Every `Elementum` instance creates an `AbortController` on connect and aborts `this.signal` automatically in `disconnectedCallback()`. Pass `signal: this.signal` to every behavior from `@wcomp/elementum/behaviors` and every `addEventListener` call so you never need manual cleanup boilerplate.

### Use `--el-*` tokens and `part="..."`

Use semantic tokens (`--el-surface-card`, `--el-surface-elevated`, `--el-surface-border`, `--el-text-primary`, `--el-text-muted`, `--el-color-primary-text`) instead of hardcoded colors so your component works automatically in light and dark themes across Chromium, Firefox, and Safari. Expose `part="..."` attributes so consumers can style internal elements with CSS `::part()` or Tailwind `[&::part(...)]:` variants.

### Emit standard bubbling events

Call `this.emit('change', { value })` to dispatch a `CustomEvent` with `bubbles: true` and `composed: true`. See [`docs/events.md`](./events.md) for event payload conventions across Vanilla JS, React, Vue, and Svelte.

---

## 3. Making your component a Form-Associated Custom Element (FACE)

Add `static formAssociated = true` and call `this.setFormValue(...)` whenever the value changes:

```js
export class MyRatingInput extends Elementum {
  static formAssociated = true;
  static observedAttributes = ['name', 'value', 'disabled'];

  value = signal('0');
  disabled = signal(false);

  setRating(next) {
    if (this.disabled.value) return;
    this.value.value = String(next);
    this.setFormValue(this.value.value);
    this.emit('change', { value: this.value.value });
  }
}
```

By extending `Elementum` with `static formAssociated = true`, your component automatically gets:

- `el.form` returning the owning `<form>` or `<el-form>`
- `formResetCallback()` restoring the initial `value` or `checked` attribute on `<button type="reset">`
- `formDisabledCallback(disabled)` syncing `this.disabled.value` inside `<fieldset disabled>`
- `checkValidity()`, `reportValidity()`, `setValidity()`, and `setCustomValidity()` via `ElementInternals`

---

## 4. Available headless behaviors (`@wcomp/elementum/behaviors`)

| Behavior | What it handles |
| :--- | :--- |
| `createPressBehavior` | Pointer + keyboard (`Enter`/`Space`) press, touch-safe hover, `data-pressed` host state |
| `createDisclosureBehavior` | `aria-expanded`, `aria-controls`, `hidden`, and `data-state="open\|closed"` |
| `createDismissableLayer` | `Escape` key and outside-click light dismissal |
| `createRovingFocus` | Arrow-key roving `tabindex` across toolbars, tabs, menus, and grids |
| `createSelectionBehavior` | Single and multi-select state with range selection |
| `createReorderBehavior` | Keyboard and pointer list reordering |
| `createFocusRecovery` | Restores focus to the triggering element when an overlay closes |
| `createPopupPositioner` | Viewport-aware floating positioning with flip and shift |
| `createPresenceBehavior` | Enter/exit animation lifecycle respecting `prefers-reduced-motion` |
| `createShortcuts` | Scoped keyboard shortcut bindings |
| `announce` | Screen-reader live-region announcements (`polite` or `assertive`) |
| `highlightMatch` / `splitMatchSegments` | Safe substring match highlighting without `innerHTML` |

See [`docs/behaviors-and-agent.md`](./behaviors-and-agent.md) for full parameter details, or run `npm run create` inside the Elementum repo to scaffold a new component.
