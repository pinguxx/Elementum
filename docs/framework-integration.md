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

## 4. TypeScript Autocomplete (`tsconfig.json`)

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

## 5. Declarative Shadow DOM (DSD) SSR (Node.js / Next.js)

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

## 6. Starter Projects

Tested, minimal copy-paste starter templates are available in the repository under [`starters/`](../starters):
- [**Vanilla HTML (Zero-Build CDN)**](../starters/vanilla-html)
- [**Next.js App Router + DSD SSR**](../starters/next-app-router)
- [**React 19 + TypeScript + Vite**](../starters/react-19)
- [**AI Chat UI**](../starters/ai-chat)

