# Using `@wcomp/elementum` with Tailwind CSS (1-Page Guide)

Elementum encapsulates component internals in **Shadow DOM**, which protects widgets from accidental CSS cascade leaks. Tailwind CSS works seamlessly alongside Elementum using three clean patterns—no `tailwind.config` hacks required.

---

## 1. Layout & Spacing on the Host Element (Works Out of the Box)

Tailwind utility classes (`flex`, `grid`, `gap-4`, `p-6`, `w-full`, `max-w-md`, `mt-4`) apply directly to any `<el-*>` host element:

```html
<div class="mx-auto grid max-w-4xl grid-cols-1 gap-6 p-6 md:grid-cols-2">
  <el-card bordered class="w-full">
    <el-card-header>
      <el-card-title>Monthly Usage</el-card-title>
    </el-card-header>
    <el-card-content class="flex flex-col gap-4">
      <el-meter value="74" max="100" label="API Quota"></el-meter>
      <el-button variant="primary" class="self-end">Upgrade Plan</el-button>
    </el-card-content>
  </el-card>
</div>
```

---

## 2. Style Shadow Internals via Tailwind `[&::part(...)]:` Variants

Tailwind v3.2+ and v4 support CSS Shadow Parts directly via arbitrary variants. Consult the auto-generated [**Styling Reference (`docs/styling-reference.md`)**](./styling-reference.md) for every exposed `::part()` selector across all 109 components:

```html
<el-button
  variant="primary"
  class="[&::part(button)]:rounded-full [&::part(button)]:px-6 [&::part(button)]:tracking-wide"
>
  Launch Workspace
</el-button>

<el-input
  placeholder="Search team..."
  class="[&::part(input)]:bg-slate-50 dark:[&::part(input)]:bg-slate-900"
></el-input>
```

---

## 3. Override `--el-*` Design Tokens Inline or Globally

Elementum's color, radius, typography, and spacing tokens inherit through Shadow DOM boundaries. Map them to Tailwind's palette in your global CSS or inline with Tailwind's arbitrary property syntax:

```css
/* app.css (loaded after @wcomp/elementum/tokens.css) */
:root {
  --el-accent-primary: theme('colors.indigo.600');
  --el-surface-base: theme('colors.white');
  --el-surface-border: theme('colors.slate.200');
  --el-radius-md: 0.75rem;
}

.dark,
:root[data-theme='dark'] {
  --el-accent-primary: theme('colors.indigo.400');
  --el-surface-base: theme('colors.slate.950');
  --el-surface-border: theme('colors.slate.800');
}
```

Or scope overrides to a single subtree:

```html
<section class="[--el-accent-primary:#7c3aed] [--el-radius-md:14px]">
  <el-button variant="primary">Purple Scoped CTA</el-button>
</section>
```

---

## 4. Full Tailwind Takeover (`unstyled` Mode)

Add the `unstyled` attribute to any `<el-*>` component to strip its built-in Shadow DOM styles while keeping **100% of WAI-ARIA roles, keyboard roving focus, focus trapping, and `ElementInternals` form participation**:

```html
<el-button
  unstyled
  class="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
>
  Headless Tailwind Button
</el-button>
```

---

## Next Steps
- Browse every `::part()` selector and `--el-*` token: [**`docs/styling-reference.md`**](./styling-reference.md)
- Full theming & Penpot/Figma DTCG workflow: [**`docs/theming.md`**](./theming.md)
- Live Theme Studio (pick colors/radius & export CSS or DTCG JSON): [**`examples/registry.html#theme-studio`**](../examples/registry.html#theme-studio)
