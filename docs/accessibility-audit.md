# Accessibility & Manual Assistive-Technology Audit Log

Automated checks catch roughly 30–50% of WCAG issues (missing labels, invalid ARIA attribute combinations, target sizes, and color contrast). `@wcomp/elementum` separates **automated continuous proof** from **human screen-reader and keyboard sign-off** required before tagging `1.0.0`.

---

## 1. Automated Continuous Verification (`109 / 109` Components)

| Verification Layer | Command | Scope & Coverage |
| :--- | :--- | :--- |
| **`@axe-core/playwright` WCAG 2.2 AA** | `npm run test:e2e` | **109 / 109** components verified in live Chromium, Firefox & WebKit (`QUALITY.md`: 109 Production Verified) |
| **WAI-ARIA APG Pattern Validators** | `npm test` (`checkAriaPattern()`) | Automated role, focusability, `aria-*` state, and Shadow DOM structural checks |
| **Keyboard-Only APG State Machines (10 Complex Widgets)** | `e2e/a11y-keyboard-apg.spec.js`, `e2e/browser-verification.spec.js`, `e2e/framework-and-dsd-stress.spec.js` | Real `Arrow` / `Home` / `End` / `Tab` / `Space` / `Enter` / `Escape` keyboard state machines across all 10 composite widgets + modal `<dialog>` focus restoration |
| **Mobile Reflow & Touch Target Check** | Playwright `375px` + WCAG 2.5.8 | Verifies `scrollWidth <= innerWidth` and `>= 24x24px` target sizes on interactive controls |

---

## 2. Manual Assistive-Technology Sign-Off Matrix (Pre-`1.0.0` Release Gate)

Human sign-off is tracked separately from CI automation. Before removing pre-release status and tagging `1.0.0`, test each high-complexity composite widget with **NVDA + Chrome/Firefox (Windows)**, **VoiceOver + Safari (macOS)**, **keyboard-only**, **200%/400% zoom**, and **Windows High Contrast (`forced-colors: active`)**:

| Component | Automated Contract | Keyboard Sequence to Verify | Expected Screen Reader & Focus Behavior | Manual AT Sign-Off |
| :--- | :---: | :--- | :--- | :---: |
| `<el-dialog>` | ✅ Verified | `Enter`/`Space` open -> `Tab` cycles modal -> `Escape` closes | Announced as `dialog` with accessible title; focus trapped inside and restored to trigger on close | ⏳ Pending (`1.0.0-rc.1`) |
| `<el-alert-dialog>` | ✅ Verified | `Tab` between Cancel/Confirm -> `Escape` / Confirm action | Announced as `alertdialog`; urgent description read automatically; focus restores cleanly | ⏳ Pending (`1.0.0-rc.1`) |
| `<el-autocomplete>` | ✅ Verified | Type query -> `ArrowDown`/`ArrowUp` -> `Enter` -> `Backspace` (multi-chip) | `combobox` announces expanded state, `aria-activedescendant` option, and result count via `announce()` | ⏳ Pending (`1.0.0-rc.1`) |
| `<el-command>` | ✅ Verified | `Ctrl+K`/`Cmd+K` open -> type filter -> `ArrowUp`/`Down` -> `Enter` -> `Escape` | Search input focused immediately; group labels and highlighted option announced without lag | ⏳ Pending (`1.0.0-rc.1`) |
| `<el-datepicker>` | ✅ Verified | Open calendar -> Arrow keys move days -> `Enter` picks date -> `Escape` | Selected month/year and focused day date read unambiguously; selected date reflected to field | ⏳ Pending (`1.0.0-rc.1`) |
| `<el-tabs>` | ✅ Verified | `Tab` enters active tab -> `ArrowLeft`/`ArrowRight`/`Home`/`End` -> `Tab` into panel | `tablist` / `tab` (`aria-selected="true"`) / `tabpanel` (`aria-labelledby`) relationship announced | ⏳ Pending (`1.0.0-rc.1`) |
| `<el-table>` | ✅ Verified | `Tab` to sortable header -> `Enter`/`Space` toggle sort -> Row checkboxes | Column headers announce `aria-sort`; row selection checkboxes announce row context | ⏳ Pending (`1.0.0-rc.1`) |
| `<el-tree-view>` | ✅ Verified | `ArrowDown`/`Up` walk nodes -> `ArrowRight` expand -> `ArrowLeft` collapse | Announces item label, `aria-expanded`, level (`aria-level`), and selection state | ⏳ Pending (`1.0.0-rc.1`) |
| `<el-navigation-menu>` | ✅ Verified | `Enter`/`Space` trigger button -> `Tab` into panel links -> `Escape` closes | Trigger button updates `aria-expanded`; Escape closes viewport without trapping focus | ⏳ Pending (`1.0.0-rc.1`) |
| `<el-drawer>` | ✅ Verified | Trigger opens drawer -> `Tab` through panel controls -> `Escape` closes | Slide-over region traps focus properly, prevents background scroll, and restores focus on close | ⏳ Pending (`1.0.0-rc.1`) |

---

## 3. Recording Manual Test Sessions

Contributors completing a manual assistive-technology verification pass (see [`CONTRIBUTING.md`](../CONTRIBUTING.md#4-manual-accessibility-verification-protocol)) should append a dated entry below with exact **OS, Browser, AT version, Components tested, Findings, and Remediation PR**:

| Date | Reviewer | Environment (OS / Browser / AT) | Components Verified | Outcome / Notes |
| :--- | :--- | :--- | :--- | :--- |
| _TBD_ | _Open for `1.0.0-rc.1` audit_ | Windows + NVDA / macOS + VoiceOver | All 10 complex widgets above | Baseline template created for `1.0.0` release gate |
