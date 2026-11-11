# Theming & Customization in Elementum

Elementum provides a design-token architecture that bridges Figma Design Tokens and native Web Components through CSS Custom Properties and standard CSS `::part()` selectors.

---

## 1. Quick Start: Importing Design Tokens

To apply the design system's default tokens and automatic dark-mode support, import `tokens.css`:

```html
<!-- Via HTML CDN or local path -->
<link rel="stylesheet" href="./src/tokens.css">
```

```javascript
// In modern bundlers (Vite, Webpack, etc.)
import '@wc/elementum/tokens.css';
```

---

## 2. CSS Custom Properties (Design Tokens)

All tokens are scoped under the `--el-*` namespace and defined at `:root`.

### Colors & Surfaces

| Token | Default (Light) | Dark Mode Override | Description |
| :--- | :--- | :--- | :--- |
| `--el-surface-bg` | `#f8fafc` | `#0f172a` | Page-level background canvas |
| `--el-surface-card` | `#ffffff` | `#1e293b` | Elevation surface (cards, dialogs, dropdowns) |
| `--el-surface-muted` | `#f1f5f9` | `#334155` | Secondary/subtle background |
| `--el-surface-border` | `#e2e8f0` | `#475569` | Standard structural borders & dividers |
| `--el-color-primary` | `#2563eb` | `#3b82f6` | Brand accent & primary call-to-action |
| `--el-color-primary-hover` | `#1d4ed8` | `#2563eb` | Hover state for primary controls |
| `--el-color-danger` | `#ef4444` | `#f87171` | Destructive actions, invalid validation states |
| `--el-color-danger-hover` | `#dc2626` | `#ef4444` | Hover state for destructive actions |
| `--el-color-success` | `#10b981` | `#34d399` | Positive confirmations & success badges |
| `--el-text-primary` | `#0f172a` | `#f8fafc` | High-contrast body & heading typography |
| `--el-text-muted` | `#64748b` | `#94a3b8` | Placeholders, captions, secondary details |
| `--el-text-disabled` | `#94a3b8` | `#64748b` | Inactive & disabled text |

### Typography

| Token | Default Value | Description |
| :--- | :--- | :--- |
| `--el-font-sans` | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | Clean interface font stack |
| `--el-font-mono` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` | Code and tabular numeric font |

### Spacing

| Token | Value | Visual Reference |
| :--- | :--- | :--- |
| `--el-spacing-xs` | `4px` | Tight icon spacing, pill padding |
| `--el-spacing-sm` | `8px` | Small button padding, compact gaps |
| `--el-spacing-md` | `16px` | Standard form field and card padding |
| `--el-spacing-lg` | `24px` | Section padding, dialog content padding |
| `--el-spacing-xl` | `32px` | Large container gutters |

### Border Radii

| Token | Value | Intended Usage |
| :--- | :--- | :--- |
| `--el-radius-sm` | `4px` | Badges, small inputs, tags |
| `--el-radius-md` | `8px` | Buttons, standard inputs, cards |
| `--el-radius-lg` | `16px` | Modal dialogs, floating overlays |
| `--el-radius-full` | `9999px` | Round pills, toggle switch thumbs |

### Elevation & Shadows

| Token | Value |
| :--- | :--- |
| `--el-shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| `--el-shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` |
| `--el-shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` |

---

## 3. Dark Theme Activation

Elementum supports two switching modes:

### Explicit Attribute Selection (Recommended)
Set `data-theme="dark"` on `<html>` or `<body>`:

```html
<html data-theme="dark">
  ...
</html>
```

The bundled `<el-theme-switch>` component handles this automatically and synchronizes preference with `localStorage`.

### Automatic System Preference
If `data-theme` is not explicitly set, Elementum automatically honors the OS setting via media query:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* Dark mode tokens are applied */
  }
}
```

---

## 4. Shadow DOM `::part()` Customization Catalog

Because Elementum components use Shadow DOM for encapsulation and performance, styles from outside cannot leak in inadvertently. To style internal elements from your app stylesheet, use standard CSS `::part()` selectors.

### Component Parts Reference

| Component Tag | Exposed `::part()` Names | Target Elements |
| :--- | :--- | :--- |
| `<el-button>` | `part="button"` | Internal native `<button>` element |
| `<el-badge>` | `part="badge"` | Badge pill container |
| `<el-input>` | `part="base"`, `part="input"` | Outer wrapper (`base`) and internal `<input>` |
| `<el-dropdown>` | `part="panel"` | Floating overlay dropdown menu |
| `<el-calendar>` | `part="calendar"` | Calendar month grid container |
| `<el-datepicker>` | `part="trigger"`, `part="panel"` | Composite picker trigger and calendar dropdown |
| `<el-dialog>` | `part="dialog"`, `part="body"`, `part="footer"` | Native `<dialog>`, content body, and action footer |
| `<el-tabs>` | `part="tablist"`, `part="tab"` | Tab button strip and individual tab indicators |
| `<el-select>` | `part="base"`, `part="select"` | Outer wrapper and native select box |
| `<el-switch>` | `part="track"`, `part="thumb"` | Switch sliding track and circular toggle thumb |
| `<el-tooltip>` | `part="tooltip"` | Floating tooltip container popup |
| `<el-accordion-item>` | `part="header"`, `part="content"` | Disclosure trigger bar and collapsible body |
| `<el-table>` | `part="table"` | Native HTML `<table>` wrapper |
| `<el-progress>` | `part="track"`, `part="bar"` | Outer progress track and dynamic progress fill bar |
| `<el-spinner>` | `part="spinner"` | Animated SVG spinner icon |
| `<el-avatar>` | `part="avatar"`, `part="initials"`, `part="status"` | Avatar container, fallback initials, and status dot |
| `<el-drawer>` | `part="panel"`, `part="header"`, `part="body"`, `part="footer"` | Slide-over drawer container and sections |
| `<el-segmented-control>` | `part="group"`, `part="segment"` | Pill switcher container and individual radio buttons |
| `<el-pagination>` | `part="pagination"`, `part="prev-button"`, `part="next-button"`, `part="page-button"`, `part="active-page"` | Full pagination nav and page buttons |
| `<el-chip>` | `part="chip"`, `part="remove-button"` | Tag/pill container and remove button |
| `<el-autocomplete>` | `part="wrapper"`, `part="input"`, `part="listbox"`, `part="option"`, `part="clear-button"`, `part="spinner"` | Combobox input, floating listbox, options, clear button, and spinner |

---

## 5. Practical Customization Examples

### Example 1: Brand Override for Primary Buttons
```css
/* Change primary color globally */
:root {
  --el-color-primary: #7c3aed; /* Purple 600 */
  --el-color-primary-hover: #6d28d9; /* Purple 700 */
  --el-radius-md: 12px;
}
```

### Example 2: Component-Specific Style via `::part()`
```css
/* Custom gradient and glow on login dialog */
.login-dialog::part(dialog) {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Custom switch thumb animation or style */
el-switch::part(thumb) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Custom rounded search input */
el-input.search-bar::part(base) {
  border-radius: 9999px;
  padding-left: 12px;
}
```

### Example 3: Accessibility High-Contrast Focus Indicator
```css
/* High-visibility focus indicators for WCAG 2.2 SC 2.4.11 */
:focus-visible {
  outline: 3px solid var(--el-color-primary);
  outline-offset: 3px;
}
```
