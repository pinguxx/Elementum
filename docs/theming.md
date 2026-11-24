# Theming and Design Tokens (`@wcomp/elementum`)

Elementum styles Shadow DOM internals with CSS custom properties (`--el-*`) and exposes public `::part()` hooks. Because CSS custom properties pierce Shadow DOM in Chromium, Firefox, and Safari, overriding tokens updates every component with zero runtime overhead.

---

## 1. Importing tokens

Load the base stylesheet once in your app entry point:

```js
import '@wcomp/elementum/tokens.css';
```

Or via CDN:

```html
<link rel="stylesheet" href="https://unpkg.com/@wcomp/elementum/tokens.css" />
```

---

## 2. Light and dark mode activation

### Explicit attribute (recommended)

Set `data-theme` on `<html>` (or any container element) to force light or dark mode, or drop in `<el-theme-switch>`:

```js
document.documentElement.setAttribute('data-theme', 'dark');  // or 'light'
```

### Automatic OS preference

When `data-theme` is not set on `<html>`, `tokens.css` automatically follows `@media (prefers-color-scheme: dark)`.

---

## 3. Core semantic tokens

| Token | Light | Dark | Usage |
| :--- | :--- | :--- | :--- |
| `--el-color-primary` | `#2563eb` | `#2563eb` | Solid primary button/badge fills (WCAG AA >= 4.5:1 with `#ffffff`) |
| `--el-color-primary-text` | `#1d4ed8` | `#93c5fd` | Primary accent foreground text/links on surfaces |
| `--el-color-danger` | `#dc2626` | `#dc2626` | Destructive button/badge fills |
| `--el-color-danger-text` | `#b91c1c` | `#fca5a5` | Error foreground text on surfaces |
| `--el-color-success` | `#15803d` | `#15803d` | Success fills |
| `--el-surface-base` | `#ffffff` | `#0b0f19` | Page background canvas |
| `--el-surface-card` | `#ffffff` | `#111827` | Card and panel surfaces |
| `--el-surface-elevated` | `#ffffff` | `#1e293b` | Popovers, menus, dialogs |
| `--el-surface-border` | `#e2e8f0` | `#334155` | Borders and dividers |
| `--el-text-primary` | `#0f172a` | `#f8fafc` | Headings and primary copy |
| `--el-text-secondary` | `#475569` | `#cbd5e1` | Secondary labels |
| `--el-text-muted` | `#64748b` | `#94a3b8` | Hints, captions, placeholders |

---

## 4. Customization examples

### Brand override

```css
:root {
  --el-color-primary: #4f46e5;
  --el-color-primary-hover: #4338ca;
  --el-radius-md: 10px;
}
```

### Scoped `::part()` styling

```css
el-button::part(button) {
  letter-spacing: 0.02em;
}

el-table::part(highlight) {
  background: rgba(245, 158, 11, 0.25);
  color: inherit;
}
```

---

## 5. Related guides

- **Complete auto-generated `::part()` & token catalog:** [`docs/styling-reference.md`](./styling-reference.md)
- **Tailwind CSS `[&::part(...)]:` & `unstyled` mode:** [`docs/tailwind-guide.md`](./tailwind-guide.md)
- **Penpot & Figma design token sync:** [`docs/penpot-workflow.md`](./penpot-workflow.md)
