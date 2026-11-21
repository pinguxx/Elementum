# Vanilla HTML Starter (Zero-Build via unpkg CDN)

A minimal, zero-build starter demonstrating Elementum Web Components and micro-signals running natively in the browser without Webpack, Vite, or npm installs.

## Usage

Simply open `index.html` in your browser, or serve it locally:

```bash
npx serve .
```

## Highlights

- **0 Dependencies & 0 Build Steps**: Everything is loaded via `<link>` and `<script type="module">` from unpkg CDN.
- **Micro-Signals**: Uses `@wcomp/elementum/src/signal.js` for fine-grained reactivity.
- **Web Components**: Integrates `<el-card>`, `<el-button>`, and `<el-dialog>`.
