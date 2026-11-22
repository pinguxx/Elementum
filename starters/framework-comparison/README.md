# 3-Way Framework Comparison: React vs. Vue 3 vs. Vanilla

> Auto-updated by `npm run bench:frameworks -- --write`. Every figure below is computed directly from the three source files in this directory.

To evaluate Elementum's framework-independent architecture under identical conditions, this directory implements the **exact same interactive Team Directory application** three times using the same 9 Elementum components (`<el-card>`, `<el-badge>`, `<el-button>`, `<el-theme-switch>`, `<el-input>`, `<el-select>`, `<el-table>`, `<el-dialog>`, and `<el-toaster>` + `toast`):

1. [**`react/`**](./react) — React 19 using typed `@wcomp/elementum/react` wrappers
2. [**`vue/`**](./vue) — Vue 3 using native Custom Elements (`isCustomElement`)
3. [**`vanilla/`**](./vanilla) — Zero-build HTML5 + `@wcomp/elementum` micro-signals (`signal`, `computed`, `effect`)

## Measured Comparison

| Metric | React (`@wcomp/elementum/react`) | Vue 3 (Native Custom Elements) | Vanilla (Micro-Signals + CDN) |
| :--- | :---: | :---: | :---: |
| **App Implementation File** | `src/App.jsx` | `src/App.vue` | `index.html` (complete app) |
| **Non-Empty LOC (Total LOC)** | **103** (112) | **90** (101) | **98** (108, includes full HTML shell) |
| **App Source Size (Raw / Gzip)** | 4.20 KB / **1.36 KB** | 3.86 KB / **1.30 KB** | 4.54 KB / **1.51 KB** |
| **Build Step Required** | Vite + `@vitejs/plugin-react` | Vite + `@vitejs/plugin-vue` | **None (0 build)** |
| **Framework Runtime Added** | `react` + `react-dom` | `vue` | **0 KB** |
| **Complex Array Props (`<el-table>`)** | Direct JSX props (`columns`, `data`) via `useLayoutEffect` | `ref` + `watchEffect` on `.data.value` | Direct `.data.value` inside `effect()` |
| **Strict TypeScript Props** | Generated per-component types (`src/react/index.d.ts`) | Native `HTMLElementTagNameMap` | Native `HTMLElementTagNameMap` |
| **Accessibility & Theming** | Identical Shadow DOM + WCAG 2.2 AA | Identical Shadow DOM + WCAG 2.2 AA | Identical Shadow DOM + WCAG 2.2 AA |
| **Live Demo** | [elementum-comparison-react.vercel.app](https://elementum-comparison-react.vercel.app) | [elementum-comparison-vue.vercel.app](https://elementum-comparison-vue.vercel.app) | [elementum-sage.vercel.app/starters/...](https://elementum-sage.vercel.app/starters/framework-comparison/vanilla/index.html) |

## Key Takeaways

- **Consistent Ergonomics**: All three implementations weigh in at ~90–103 non-empty lines (1.36–1.51 KB gzipped) with identical component structure, slots, theming (`<el-theme-switch>`), and toast notifications (`toast.success()`).
- **Zero Component Duplication**: None of the three versions re-implement table sorting, modal focus trapping, form controls, or theme tokens—every framework shares the exact same Custom Element implementation.
- **Progressive Integration**: Teams can adopt Elementum in an existing React or Vue app today and share components across micro-frontends or zero-build HTML pages without rewriting UI logic.
