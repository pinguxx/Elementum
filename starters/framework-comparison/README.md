# 3-Way Framework Comparison: React vs. Vue 3 vs. Vanilla

To evaluate Elementum's framework-independent architecture under identical conditions, this directory implements the **exact same interactive Team Directory application** three times using the same 9 Elementum components (`<el-card>`, `<el-badge>`, `<el-button>`, `<el-theme-switch>`, `<el-input>`, `<el-select>`, `<el-table>`, `<el-dialog>`, and `<el-toaster>` + `toast`):

1. [**`react/`**](./react) — React 19 using typed `@wcomp/elementum/react` wrappers
2. [**`vue/`**](./vue) — Vue 3 using native Custom Elements (`isCustomElement`)
3. [**`vanilla/`**](./vanilla) — Zero-build HTML5 + `@wcomp/elementum` micro-signals (`signal`, `computed`, `effect`)

## Measured Comparison

| Metric | React (`@wcomp/elementum/react`) | Vue 3 (Native Custom Elements) | Vanilla (Micro-Signals + CDN) |
| :--- | :---: | :---: | :---: |
| **App Implementation File** | `src/App.jsx` | `src/App.vue` | `index.html` (complete app) |
| **Lines of Code (LOC)** | **102** | **93** | **105** (includes full HTML shell) |
| **App Source Size (Raw / Gzip)** | 3.93 KB / **1.34 KB** | 3.64 KB / **1.28 KB** | 4.47 KB / **1.51 KB** |
| **Build Step Required** | Vite + `@vitejs/plugin-react` | Vite + `@vitejs/plugin-vue` | **None (0 build)** |
| **Framework Runtime Added** | `react` + `react-dom` | `vue` | **0 KB** |
| **Complex Array Props (`<el-table>`)** | Direct JSX props (`columns`, `data`) via `useLayoutEffect` | `ref` + `watchEffect` on `.data.value` | Direct `.data.value` inside `effect()` |
| **Strict TypeScript Props** | Generated per-component types (`src/react/index.d.ts`) | Native `HTMLElementTagNameMap` | Native `HTMLElementTagNameMap` |
| **Accessibility & Theming** | Identical Shadow DOM + WCAG 2.2 AA | Identical Shadow DOM + WCAG 2.2 AA | Identical Shadow DOM + WCAG 2.2 AA |
| **Live Demo** | [elementum-comparison-react.vercel.app](https://elementum-comparison-react.vercel.app) | [elementum-comparison-vue.vercel.app](https://elementum-comparison-vue.vercel.app) | [elementum-sage.vercel.app/starters/...](https://elementum-sage.vercel.app/starters/framework-comparison/vanilla/index.html) |

## Key Takeaways

- **Consistent Ergonomics**: All three implementations weigh in at ~93–105 lines of code with identical component structure, slots, theming (`<el-theme-switch>`), and toast notifications (`toast.success()`).
- **Zero Component Duplication**: None of the three versions re-implement table sorting, modal focus trapping, form controls, or theme tokens—every framework shares the exact same Custom Element implementation.
- **Progressive Integration**: Teams can adopt Elementum in an existing React or Vue app today and share components across micro-frontends or zero-build HTML pages without rewriting UI logic.
