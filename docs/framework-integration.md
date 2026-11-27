# Framework Integration Guide

`@wcomp/elementum` components are standard native Custom Elements with Form-Associated Custom Elements (FACE) support. They can be used directly without a build step or inside modern frontend frameworks.

---

## 1. React 19 & Next.js (App Router)

React 19 natively supports Custom Elements properties, boolean attributes, and form-associated custom elements.

### Setup
Install or import the package:
```bash
npm install @wcomp/elementum
```

Import design tokens in your root layout (`app/layout.tsx` or `_app.tsx`):
```tsx
import '@wcomp/elementum/tokens.css';
```

### Client Component Usage
Because Custom Elements register on `customElements` in the browser, import the components on the client side:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import '@wcomp/elementum';
import type { ElTable, TableColumn } from '@wcomp/elementum';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('users');
  const tableRef = useRef<ElTable>(null);

  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.columns.value = [
        { key: 'name', label: 'Full Name', sortable: true },
        { key: 'role', label: 'Role', sortable: true },
      ];
      tableRef.current.data.value = [
        { name: 'Ada Lovelace', role: 'Engineer' },
        { name: 'Grace Hopper', role: 'Architect' },
      ];
    }
  }, []);

  return (
    <div>
      <el-tabs value={activeTab} ontabchange={(e: any) => setActiveTab(e.detail.value)}>
        <el-tab label="Users" value="users">
          <el-table ref={tableRef} selectable></el-table>
        </el-tab>
        <el-tab label="Settings" value="settings">
          <el-switch checked>Enable Notifications</el-switch>
        </el-tab>
      </el-tabs>
    </div>
  );
}
```

---

## 2. Vue 3 (Vite / Nuxt)

Vue 3 has first-class custom element support via `isCustomElement`.

### Configure `vite.config.ts`
```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('el-'),
        },
      },
    }),
  ],
});
```

### Component Usage in Vue 3
```vue
<script setup lang="ts">
import { ref } from 'vue';
import '@wcomp/elementum';
import '@wcomp/elementum/tokens.css';

const autoSave = ref(true);
function onChange(e: CustomEvent) {
  autoSave.value = e.detail.checked;
}
</script>

<template>
  <el-switch :checked="autoSave" @change="onChange">
    Auto-save Drafts
  </el-switch>
</template>
```

---

## 3. Svelte 5

Svelte treats custom elements natively without special wrappers:

```svelte
<script lang="ts">
  import '@wcomp/elementum';
  import '@wcomp/elementum/tokens.css';

  let departure = $state('San Francisco');
</script>

<el-input placeholder="Departure City" bind:value={departure}>
  <span slot="prefix">🛫</span>
</el-input>
```

---

## 4. Angular 19+ (Standalone Components)

Angular has native Web Components support via `CUSTOM_ELEMENTS_SCHEMA`.

1. **Import tokens & register components** (in `src/styles.css` and `src/main.ts`):

```css
/* src/styles.css */
@import '@wcomp/elementum/tokens.css';
```

```ts
// src/main.ts
import '@wcomp/elementum';
```

2. **Add `CUSTOM_ELEMENTS_SCHEMA` to your standalone component:**

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toast } from '@wcomp/elementum';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <el-card bordered>
      <div slot="header" style="display:flex;justify-content:space-between;align-items:center;">
        <strong>Elementum + Angular</strong>
        <el-theme-switch></el-theme-switch>
      </div>
      <el-input
        name="email"
        label="Work Email"
        placeholder="ada@example.com"
        ngDefaultControl
        [(ngModel)]="email"
      ></el-input>
      <el-button variant="primary" (click)="save()">Save</el-button>
    </el-card>
    <el-toaster></el-toaster>
  `,
})
export class AppComponent {
  email = signal('ada@example.com');

  save() {
    toast.success(`Saved ${this.email()}`);
  }
}
```

- **Events:** Bind Elementum custom events with standard Angular syntax: `(change)="onChange($event)"`, `(form-submit)="onSubmit($event)"`. Read values via `($event as CustomEvent).detail?.value ?? ($event.target as HTMLInputElement).value`.
- **Reactive / Template Forms:** Add `ngDefaultControl` on Form-Associated Custom Elements (`<el-input>`, `<el-textarea>`, `<el-select>`, `<el-checkbox>`, `<el-switch>`) when using `formControlName` or `[(ngModel)]`.
- **Complex Props:** Bind arrays/objects as DOM properties (`[columns]="cols"`, `[data]="rows"` on `<el-table>`).

---

## 5. TypeScript Autocomplete (`tsconfig.json`)

`@wcomp/elementum` includes ambient typings for `HTMLElementTagNameMap` and `JSX.IntrinsicElements`. Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "lib": ["DOM", "DOM.Iterable", "ESNext"]
  }
}
```
Now, `document.querySelector('el-button')` will automatically be typed as `ElButton`, and `<el-button>` in JSX/TSX will have full type safety.

---

## 6. Declarative Shadow DOM (DSD) SSR (Node.js / Next.js)

Prevent layout shift (CLS) by pre-rendering shadow boundaries on the server using pure Node.js Declarative Shadow DOM helpers:

```js
import { renderComponentToDSD } from '@wcomp/elementum/ssr';

// Emits standard HTML string with inline <template shadowrootmode="open">
const html = renderComponentToDSD('el-button', {
  variant: 'primary',
  children: 'Server Rendered Button'
});

console.log(html);
// Output: <el-button variant="primary"><template shadowrootmode="open">...</template>Server Rendered Button</el-button>
```

---

## 7. Starter Projects

Tested, minimal copy-paste starter templates are available in the repository under [`starters/`](../starters):
- [**Vanilla HTML (Zero-Build CDN)**](../starters/vanilla-html)
- [**Next.js App Router + DSD SSR**](../starters/next-app-router)
- [**React 19 + TypeScript + Vite**](../starters/react-19)
- [**Vue 3 + Vite**](../starters/vue-3)
- [**Svelte 5 + Vite**](../starters/svelte-5)
- [**Angular 19+ (Standalone)**](../starters/angular) · [Live Demo](https://elementum-angular.vercel.app)
- [**AI Chat UI**](../starters/ai-chat)
- [**3-Way Framework Comparison (React vs. Vue 3 vs. Vanilla)**](../starters/framework-comparison)

