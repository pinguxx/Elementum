# Elementum Motion & UI Craft Standards

| Problem | Elementum Standard |
| :--- | :--- |
| Random properties animate or stutter | Ban `transition: all`; list exact properties (`transform`, `opacity`, `background-color`, `border-color`). |
| Buttons / toggles feel unresponsive | Apply `transform: scale(0.97)` on `:active:not(:disabled)` (reset under `prefers-reduced-motion`). |
| Dropdowns / tooltips feel sluggish | Use `ease-out` / `var(--el-ease-out-expo)` under `250ms`; never use `ease-in` for entrances. |
| Popover grows from wrong spot | Set `transform-origin` toward the trigger edge (modals remain centered). |
| Avatars squish in flex containers | Always set `flex-shrink: 0` on `:host` in `<el-avatar>`. |
| Numbers jitter during live updates | Set `font-variant-numeric: tabular-nums` on `<el-number-flow>`, `<el-number-field>`, `<el-meter>`, `<el-progress>`, `<el-pagination>`, and `<el-table>`. |
| Motion causes vestibular discomfort | Guard every `@keyframes` and transform transition with `@media (prefers-reduced-motion: reduce)`. |
| Long prose lines fatigue readers | Constrain body paragraphs with `max-width: 65ch` and tighten large headings (`letter-spacing: -0.02em`). |
| Flat 1px opaque borders look generic | Prefer `--el-border-translucent` (`rgba(15, 23, 42, 0.08)`) paired with layered ambient `--el-shadow-card`. |

These rules are enforced automatically in CI by `test/craft-contract.test.js`.
