# Break-UI Failure Vector Checklist

| Vector | What to Try | Expected Resilience |
| :--- | :--- | :--- |
| **320px Mobile** | Narrow viewport on navbar, tables, segmented controls, dialogs | Zero horizontal body scroll; navbar collapses cleanly; tables scroll internally. |
| **Dark Mode Hover** | Hover secondary, ghost, and canvas-toggle buttons in dark mode | High-contrast text and surface tokens remain legible (never white-on-light-gray). |
| **Long Unbroken Text** | Pass 100-char label into `<el-button>`, `<el-chip>`, `<el-badge>`, `<el-card>` | Graceful truncation or wrapping without breaking sibling alignment. |
| **Empty / Null Data** | Pass `data="[]"`, `options=""`, or omit slotted children | Renders fallback `label` attribute or `<el-empty-state>` without throwing. |
| **Keyboard Only** | Operate `<el-command>`, `<el-tabs>`, `<el-dropdown>`, `<el-select>`, `<el-dialog>` with keyboard | Full arrow navigation, Enter/Space activation, Escape close, and focus restoration. |
| **Form Reset** | Mutate `<el-input>`, `<el-switch>`, `<el-select>`, `<el-slider>` then call `form.reset()` | Restores initial HTML default attributes cleanly via `formReset()`. |
| **Mount / Unmount Churn** | Append and remove component 20× in a loop | Zero memory/listener leaks (`this.signal` `AbortController` cleans up all listeners). |
