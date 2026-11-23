# Styling Reference: `::part()` Selectors & `--el-*` Design Tokens

> Auto-generated from `src/components/el-*.js` and `src/tokens.css` via `npm run docs:styling`.
> Use this cheat sheet to style Elementum components with Tailwind CSS (`[&::part(...)]:...`), custom CSS, or design-system overrides without reading component source files.

- **Components scanned**: 78
- **Components exposing `::part()`**: 65 (201 part selectors total)
- **Global `--el-*` design tokens in `src/tokens.css`**: 78

## Quick Usage Recipes

```css
/* Override tokens globally or scoped to any container */
.brand-surface {
  --el-accent-primary: #7c3aed;
  --el-radius-md: 12px;
}

/* Target internal Shadow DOM parts directly */
el-button::part(button) {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

```html
<!-- Tailwind CSS v3/v4 arbitrary ::part() + token classes -->
<el-card class="[&::part(card)]:rounded-2xl [--el-surface-border:#e2e8f0]">
  <el-button variant="primary" class="[&::part(button)]:shadow-md">Deploy</el-button>
</el-card>
```

---

## Per-Component `::part()` & Token Matrix

| Component | Exposed `::part(...)` Selectors | Consumed `--el-*` Tokens |
| :--- | :--- | :--- |
| `<el-accordion>` | `chevron`, `header`, `panel`, `title` | `--el-color-primary`, `--el-radius-md`, `--el-radius-sm`, `--el-spacing-md`, `--el-surface-base`, `--el-surface-border`, `--el-text-base`, `--el-text-muted` |
| `<el-alert-dialog>` | `dialog` | `--el-font-sans`, `--el-radius-lg`, `--el-surface-base`, `--el-surface-border`, `--el-surface-elevated`, `--el-text-primary` |
| `<el-alert>` | `alert`, `content`, `description`, `dismiss`, `icon`, `title` | `--el-font-sans`, `--el-radius-md`, `--el-radius-sm`, `--el-surface-base`, `--el-surface-border`, `--el-text-muted`, `--el-text-primary`, `--el-text-secondary` |
| `<el-aspect-ratio>` | `container` | _(inherits root tokens)_ |
| `<el-autocomplete>` | `actions`, `announcer`, `chip`, `chips`, `clear-button`, `input`, `listbox`, `option`, `prefix`, `spinner`, `wrapper` | `--el-color-primary`, `--el-font-sans`, `--el-radius-md`, `--el-radius-sm`, `--el-surface-border`, `--el-surface-card`, `--el-surface-muted`, `--el-text-muted` _(+1 more)_ |
| `<el-avatar>` | `avatar`, `initials`, `overflow`, `status` | `--el-avatar-overlap`, `--el-color-danger`, `--el-color-success`, `--el-font-sans`, `--el-radius-full`, `--el-radius-md`, `--el-surface-border`, `--el-surface-card` _(+3 more)_ |
| `<el-badge>` | `badge` | `--el-color-primary`, `--el-font-sans`, `--el-radius-full`, `--el-surface-border`, `--el-surface-muted`, `--el-text-muted`, `--el-text-primary` |
| `<el-border-beam>` | _(tokens / slots)_ | `--el-color-accent`, `--el-color-primary` |
| `<el-breadcrumb>` | `list`, `nav`, `separator` | `--el-font-sans`, `--el-text-muted`, `--el-text-primary` |
| `<el-button>` | `button` | `--el-color-danger`, `--el-color-primary`, `--el-color-primary-hover`, `--el-radius-md`, `--el-spacing-lg`, `--el-spacing-md`, `--el-spacing-sm`, `--el-spacing-xs` _(+6 more)_ |
| `<el-calendar>` | `calendar` | `--el-color-primary`, `--el-radius-sm`, `--el-spacing-sm`, `--el-spacing-xs`, `--el-surface-base`, `--el-surface-border`, `--el-surface-muted`, `--el-text-base` _(+2 more)_ |
| `<el-callout>` | _(tokens / slots)_ | `--el-radius-md`, `--el-surface-border`, `--el-surface-muted`, `--el-text-secondary`, `--el-text-sm` |
| `<el-card>` | `body`, `header` | `--el-color-primary`, `--el-font-sans`, `--el-radius-lg`, `--el-surface-base`, `--el-surface-border`, `--el-text-muted`, `--el-text-primary` |
| `<el-carousel>` | `controls`, `dots`, `track`, `viewport` | `--el-color-primary`, `--el-font-sans`, `--el-radius-md`, `--el-surface-border`, `--el-surface-elevated`, `--el-surface-muted`, `--el-text-primary` |
| `<el-chart>` | _(tokens / slots)_ | `--el-chart-1`, `--el-chart-2`, `--el-color-primary`, `--el-font-sans`, `--el-radius-md`, `--el-surface-base`, `--el-surface-border`, `--el-text-muted` _(+4 more)_ |
| `<el-checkbox-card>` | _(tokens / slots)_ | `--el-primary`, `--el-primary-subtle`, `--el-radius-lg`, `--el-radius-sm`, `--el-surface-border`, `--el-surface-card`, `--el-surface-muted`, `--el-text-base` _(+3 more)_ |
| `<el-checkbox>` | `box` | `--el-color-primary`, `--el-font-sans`, `--el-radius-sm`, `--el-surface-base`, `--el-surface-border`, `--el-surface-card`, `--el-text-primary` |
| `<el-chip>` | `chip`, `remove-button` | `--el-color-danger`, `--el-color-primary`, `--el-ease-out-expo`, `--el-font-sans`, `--el-radius-full`, `--el-surface-border`, `--el-surface-muted`, `--el-text-primary` _(+1 more)_ |
| `<el-code-block>` | `body`, `code`, `container`, `copy-button`, `header`, `language`, `pre` | `--el-code-attr`, `--el-code-bg`, `--el-code-border`, `--el-code-comment`, `--el-code-fg`, `--el-code-fn`, `--el-code-header-bg`, `--el-code-keyword` _(+8 more)_ |
| `<el-collapsible>` | `content`, `trigger` | `--el-font-sans`, `--el-text-primary` |
| `<el-command>` | `backdrop`, `content`, `dialog`, `empty`, `footer`, `heading`, `input`, `items`, `list`, `search-bar`, `shortcut` | `--el-border-translucent`, `--el-color-primary`, `--el-font-mono`, `--el-radius-lg`, `--el-radius-md`, `--el-shadow-popover`, `--el-surface-border`, `--el-surface-card` _(+3 more)_ |
| `<el-context-menu>` | `menu`, `trigger` | `--el-color-primary`, `--el-font-sans`, `--el-radius-md`, `--el-radius-sm`, `--el-surface-base`, `--el-surface-border`, `--el-surface-muted`, `--el-text-base` |
| `<el-data-list>` | _(tokens / slots)_ | `--el-radius-sm`, `--el-surface-border`, `--el-surface-muted`, `--el-text-muted`, `--el-text-primary`, `--el-text-sm` |
| `<el-datepicker>` | `dropdown`, `input`, `panel-content` | `--el-radius-sm`, `--el-spacing-sm`, `--el-spacing-xs`, `--el-surface-border`, `--el-surface-muted`, `--el-text-base`, `--el-text-muted` |
| `<el-dialog>` | `body`, `dialog`, `footer` | `--el-radius-lg`, `--el-radius-sm`, `--el-spacing-lg`, `--el-spacing-md`, `--el-spacing-sm`, `--el-surface-base`, `--el-surface-border`, `--el-surface-muted` _(+2 more)_ |
| `<el-diff-viewer>` | `body`, `container`, `footer`, `header` | `--el-color-danger`, `--el-color-primary`, `--el-color-success`, `--el-ease-out-expo`, `--el-font-mono`, `--el-font-sans`, `--el-radius-md`, `--el-shadow-subtle` _(+6 more)_ |
| `<el-drawer>` | `body`, `footer`, `handle`, `header`, `panel` | `--el-color-primary`, `--el-drawer-size`, `--el-font-sans`, `--el-radius-md`, `--el-radius-xl`, `--el-spacing-lg`, `--el-spacing-md`, `--el-spacing-sm` _(+6 more)_ |
| `<el-dropdown>` | `panel`, `trigger` | `--el-radius-md`, `--el-spacing-sm`, `--el-spacing-xs`, `--el-surface-base`, `--el-surface-border` |
| `<el-dropzone>` | `dropzone`, `file-list`, `headline`, `icon`, `subtext` | `--el-color-primary`, `--el-font-sans`, `--el-radius-lg`, `--el-radius-sm`, `--el-surface-base`, `--el-surface-border`, `--el-surface-muted`, `--el-text-muted` _(+2 more)_ |
| `<el-empty-state>` | `actions`, `description`, `icon`, `title` | `--el-font-sans`, `--el-radius-lg`, `--el-surface-base`, `--el-surface-border`, `--el-surface-muted`, `--el-text-muted`, `--el-text-primary`, `--el-text-secondary` |
| `<el-field>` | `control`, `description`, `error`, `label` | `--el-color-danger`, `--el-font-sans`, `--el-spacing-xs`, `--el-text-muted`, `--el-text-primary` |
| `<el-form>` | `form`, `legend` | `--el-font-sans`, `--el-radius-md`, `--el-surface-base`, `--el-surface-border`, `--el-text-primary` |
| `<el-input>` | `input`, `wrapper` | `--el-color-primary`, `--el-radius-md`, `--el-spacing-sm`, `--el-spacing-xs`, `--el-surface-base`, `--el-surface-border`, `--el-surface-muted`, `--el-text-base` _(+1 more)_ |
| `<el-inset>` | _(tokens / slots)_ | `--el-radius-md` |
| `<el-insight-card>` | `card` | `--el-color-primary`, `--el-ease-out-expo`, `--el-font-sans`, `--el-radius-md`, `--el-shadow-card`, `--el-surface-base`, `--el-surface-border`, `--el-text-primary` _(+1 more)_ |
| `<el-kbd>` | `key` | `--el-font-mono`, `--el-radius-sm`, `--el-surface-border`, `--el-surface-muted`, `--el-text-secondary` |
| `<el-menubar>` | `menubar` | `--el-color-primary`, `--el-font-sans`, `--el-radius-md`, `--el-radius-sm`, `--el-surface-base`, `--el-surface-border`, `--el-surface-muted`, `--el-text-base` |
| `<el-meter>` | `fill`, `track` | `--el-color-danger`, `--el-color-primary`, `--el-color-success`, `--el-color-warning`, `--el-font-sans`, `--el-surface-muted` |
| `<el-navbar>` | `actions`, `brand`, `header`, `nav`, `start`, `toggle` | `--el-color-primary`, `--el-font-sans`, `--el-radius-md`, `--el-step-4`, `--el-surface-border`, `--el-surface-card`, `--el-surface-muted`, `--el-text-primary` _(+1 more)_ |
| `<el-navigation-menu>` | _(tokens / slots)_ | `--el-primary`, `--el-radius-lg`, `--el-radius-md`, `--el-surface-border`, `--el-surface-card`, `--el-surface-muted`, `--el-text-primary`, `--el-text-sm` |
| `<el-number-field>` | `decrement`, `increment`, `input`, `prefix`, `suffix`, `wrapper` | `--el-color-danger`, `--el-color-primary`, `--el-font-sans`, `--el-radius-md`, `--el-radius-sm`, `--el-shadow-subtle`, `--el-surface-base`, `--el-surface-border` _(+4 more)_ |
| `<el-number-flow>` | `digits`, `prefix`, `suffix`, `wrapper` | _(inherits root tokens)_ |
| `<el-otp-input>` | `cell`, `container` | `--el-color-primary`, `--el-font-sans`, `--el-radius-md`, `--el-surface-border`, `--el-surface-card`, `--el-surface-muted`, `--el-text-primary` |
| `<el-pagination>` | `next-button`, `pagination`, `prev-button` | `--el-color-primary`, `--el-font-sans`, `--el-radius-md`, `--el-surface-border`, `--el-surface-card`, `--el-surface-muted`, `--el-text-muted`, `--el-text-primary` |
| `<el-popover>` | `arrow`, `popup`, `trigger` | `--el-font-sans`, `--el-radius-md`, `--el-shadow-popover`, `--el-surface-border`, `--el-surface-card`, `--el-surface-elevated`, `--el-text-primary` |
| `<el-preview-card>` | `card`, `trigger` | `--el-font-sans`, `--el-radius-lg`, `--el-surface-border`, `--el-surface-card`, `--el-surface-elevated`, `--el-text-primary` |
| `<el-progress>` | `bar`, `track` | `--el-color-danger`, `--el-color-info`, `--el-color-primary`, `--el-color-success`, `--el-color-warning`, `--el-radius-full`, `--el-surface-border`, `--el-surface-muted` _(+1 more)_ |
| `<el-prompt-input>` | `actions`, `bottom-bar`, `container`, `submit-button`, `textarea`, `tools` | `--el-border-translucent`, `--el-color-primary`, `--el-color-primary-focus`, `--el-color-primary-hover`, `--el-font-sans`, `--el-radius-full`, `--el-radius-xl`, `--el-shadow-card` _(+6 more)_ |
| `<el-radio-card>` | _(tokens / slots)_ | `--el-primary`, `--el-primary-subtle`, `--el-radius-lg`, `--el-surface-border`, `--el-surface-card`, `--el-surface-muted`, `--el-text-base`, `--el-text-muted` _(+2 more)_ |
| `<el-radio>` | `circle`, `dot` | `--el-color-primary`, `--el-font-sans`, `--el-surface-base`, `--el-surface-border`, `--el-surface-card`, `--el-text-primary` |
| `<el-rating>` | _(tokens / slots)_ | `--el-font-sans`, `--el-radius-sm`, `--el-surface-border` |
| `<el-reasoning-card>` | `body`, `chevron`, `container`, `header`, `indicator`, `title` | `--el-border-translucent`, `--el-color-primary`, `--el-font-mono`, `--el-font-sans`, `--el-radius-full`, `--el-radius-lg`, `--el-shadow-subtle`, `--el-surface-elevated` _(+5 more)_ |
| `<el-resizable>` | `handle` | `--el-color-primary`, `--el-radius-md`, `--el-surface-border`, `--el-surface-card` |
| `<el-router>` | _(tokens / slots)_ | `--el-color-primary`, `--el-route-link-active-color` |
| `<el-scroll-area>` | `viewport` | `--el-font-sans`, `--el-surface-border`, `--el-text-muted` |
| `<el-segmented-control>` | `group`, `segment` | `--el-color-primary`, `--el-ease-out-expo`, `--el-font-sans`, `--el-radius-md`, `--el-shadow-sm`, `--el-surface-border`, `--el-surface-card`, `--el-surface-muted` _(+2 more)_ |
| `<el-select>` | `select`, `wrapper` | `--el-color-primary`, `--el-radius-md`, `--el-spacing-md`, `--el-surface-base`, `--el-surface-border`, `--el-text-base`, `--el-text-muted` |
| `<el-separator>` | `separator` | `--el-spacing-sm`, `--el-surface-border` |
| `<el-sidebar>` | _(tokens / slots)_ | `--el-font-sans`, `--el-radius-lg`, `--el-radius-md`, `--el-radius-sm`, `--el-surface-border`, `--el-surface-card`, `--el-surface-elevated`, `--el-surface-muted` _(+2 more)_ |
| `<el-skeleton>` | `skeleton` | `--el-radius-md`, `--el-radius-sm`, `--el-skeleton-bg`, `--el-skeleton-shimmer` |
| `<el-slider>` | `range`, `thumb`, `track` | `--el-color-primary`, `--el-color-primary-hover`, `--el-font-sans`, `--el-surface-base`, `--el-surface-border` |
| `<el-sources>` | `container`, `list`, `pills` | `--el-color-primary`, `--el-ease-out-expo`, `--el-font-sans`, `--el-radius-md`, `--el-shadow-subtle`, `--el-surface-base`, `--el-surface-border`, `--el-surface-muted` _(+2 more)_ |
| `<el-spinner>` | `label`, `spinner` | `--el-color-danger`, `--el-color-info`, `--el-color-primary`, `--el-color-success`, `--el-color-warning`, `--el-font-sans`, `--el-text-muted`, `--el-text-primary` _(+1 more)_ |
| `<el-streaming-text>` | `cursor`, `text` | `--el-color-primary` |
| `<el-switch>` | `label`, `thumb`, `track` | `--el-color-primary`, `--el-spacing-sm`, `--el-surface-border`, `--el-text-base` |
| `<el-table>` | `table` | `--el-color-primary`, `--el-surface-border`, `--el-surface-muted`, `--el-text-base`, `--el-text-muted`, `--el-text-secondary` |
| `<el-tabs>` | `panels`, `tablist` | `--el-color-primary`, `--el-spacing-md`, `--el-spacing-sm`, `--el-surface-border`, `--el-surface-muted`, `--el-text-base`, `--el-text-muted` |
| `<el-task-list>` | `container`, `header`, `list` | `--el-font-mono`, `--el-font-sans`, `--el-radius-md`, `--el-surface-base`, `--el-surface-border`, `--el-surface-muted`, `--el-text-muted`, `--el-text-primary` _(+1 more)_ |
| `<el-textarea>` | `footer`, `textarea`, `wrapper` | `--el-color-primary`, `--el-font-sans`, `--el-radius-md`, `--el-surface-base`, `--el-surface-border`, `--el-surface-muted`, `--el-text-muted`, `--el-text-primary` |
| `<el-theme-switch>` | `button` | `--el-color-primary`, `--el-radius-full`, `--el-spacing-xs`, `--el-step-4`, `--el-surface-border`, `--el-surface-muted`, `--el-text-primary` |
| `<el-timeline>` | `content`, `date`, `description`, `gutter`, `line`, `node`, `title` | `--el-color-danger`, `--el-color-primary`, `--el-color-success`, `--el-font-sans`, `--el-surface-base`, `--el-surface-border`, `--el-text-muted`, `--el-text-primary` _(+1 more)_ |
| `<el-toast>` | _(tokens / slots)_ | `--el-color-danger`, `--el-color-primary`, `--el-color-primary-hover`, `--el-color-success`, `--el-font-sans`, `--el-radius-lg`, `--el-radius-md`, `--el-surface-border` _(+4 more)_ |
| `<el-toggle>` | `button` | `--el-color-danger`, `--el-color-info`, `--el-color-primary`, `--el-color-primary-hover`, `--el-color-success`, `--el-color-warning`, `--el-ease-out-expo`, `--el-font-sans` _(+8 more)_ |
| `<el-tool-call>` | `approval`, `approve-button`, `args`, `badge`, `body`, `container`, `header`, `icon`, `name`, `reject-button`, `result` | `--el-color-danger`, `--el-color-primary`, `--el-color-success`, `--el-font-mono`, `--el-font-sans`, `--el-radius-lg`, `--el-radius-md`, `--el-shadow-subtle` _(+6 more)_ |
| `<el-toolbar>` | `toolbar` | `--el-font-sans`, `--el-radius-md`, `--el-spacing-xs`, `--el-surface-base`, `--el-surface-border` |
| `<el-tooltip>` | `bubble` | `--el-radius-sm`, `--el-tooltip-bg`, `--el-tooltip-border`, `--el-tooltip-text` |
| `<el-tree-view>` | `icon`, `item`, `label`, `subtree` | `--el-color-primary`, `--el-font-sans`, `--el-radius-sm`, `--el-surface-border`, `--el-surface-muted`, `--el-text-muted`, `--el-text-primary`, `--el-text-secondary` |
| `<el-visually-hidden>` | _(tokens / slots)_ | _(inherits root tokens)_ |

---

## Global Root Tokens (`src/tokens.css`)

| Token | Light Default |
| :--- | :--- |
| `--el-color-primary` | `#2563eb` |
| `--el-color-primary-hover` | `#1d4ed8` |
| `--el-color-secondary` | `#4b5563` |
| `--el-color-danger` | `#dc2626` |
| `--el-color-success` | `#16a34a` |
| `--el-color-warning` | `#d97706` |
| `--el-color-info` | `#0284c7` |
| `--el-color-accent` | `#7c3aed` |
| `--el-surface-base` | `#ffffff` |
| `--el-surface-card` | `#ffffff` |
| `--el-surface-elevated` | `#ffffff` |
| `--el-surface-muted` | `#f3f4f6` |
| `--el-surface-border` | `#e5e7eb` |
| `--el-border-translucent` | `rgba(15, 23, 42, 0.08)` |
| `--el-shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` |
| `--el-shadow-subtle` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` |
| `--el-shadow-card` | `0 1px 3px rgba(0, 0, 0, 0.06), 0 8px 16px -4px rgba(0, 0, 0, 0.04)` |
| `--el-shadow-popover` | `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)` |
| `--el-shadow-glow` | `0 0 20px -5px rgba(37, 99, 235, 0.25)` |
| `--el-ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--el-ease-in-fast` | `cubic-bezier(0.7, 0, 0.84, 0)` |
| `--el-transition-snappy` | `150ms var(--el-ease-in-fast)` |
| `--el-transition-fluid` | `280ms var(--el-ease-out-expo)` |
| `--el-text-base` | `#111827` |
| `--el-text-primary` | `#0f172a` |
| `--el-text-secondary` | `#475569` |
| `--el-text-muted` | `#6b7280` |
| `--el-text-inverse` | `#ffffff` |
| `--el-font-sans` | `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| `--el-font-mono` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` |
| `--el-spacing-xs` | `4px` |
| `--el-spacing-sm` | `8px` |
| `--el-spacing-md` | `16px` |
| `--el-spacing-lg` | `24px` |
| `--el-spacing-xl` | `32px` |
| `--el-radius-sm` | `4px` |
| `--el-radius-md` | `8px` |
| `--el-radius-lg` | `16px` |
| `--el-radius-xl` | `24px` |
| `--el-radius-full` | `9999px` |
| `--el-chart-1` | `#2563eb` |
| `--el-chart-2` | `#10b981` |
| `--el-chart-3` | `#f59e0b` |
| `--el-chart-4` | `#8b5cf6` |
| `--el-chart-5` | `#ec4899` |
| `--el-code-bg` | `#0f172a` |
| `--el-code-fg` | `#e2e8f0` |
| `--el-code-border` | `#1e293b` |
| `--el-code-header-bg` | `rgba(15, 23, 42, 0.85)` |
| `--el-code-comment` | `#94a3b8` |
| `--el-code-string` | `#86efac` |
| `--el-code-keyword` | `#c084fc` |
| `--el-code-number` | `#fbbf24` |
| `--el-code-tag` | `#f472b6` |
| `--el-code-attr` | `#7dd3fc` |
| `--el-code-fn` | `#60a5fa` |
| `--el-typeset-size` | `1rem` |
| `--el-typeset-leading` | `1.75` |
| `--el-typeset-flow` | `1.25em` |
| `--el-typeset-font-body` | `var(--el-font-sans)` |
| `--el-step-1` | `#fbfcfd` |
| `--el-step-2` | `#f8fafc` |
| `--el-step-3` | `#f1f5f9` |
| `--el-step-4` | `#e2e8f0` |
| `--el-step-5` | `#cbd5e1` |
| `--el-step-6` | `#e2e8f0` |
| `--el-step-7` | `#cbd5e1` |
| `--el-step-8` | `#94a3b8` |
| `--el-step-9` | `#2563eb` |
| `--el-step-10` | `#1d4ed8` |
| `--el-step-11` | `#475569` |
| `--el-step-12` | `#0f172a` |
| `--el-typeset-font-heading` | `var(--el-font-sans)` |
| `--el-tooltip-bg` | `#0f172a` |
| `--el-tooltip-text` | `#ffffff` |
| `--el-tooltip-border` | `rgba(255, 255, 255, 0.12)` |
| `--el-skeleton-bg` | `#e2e8f0` |
| `--el-skeleton-shimmer` | `rgba(255, 255, 255, 0.6)` |
