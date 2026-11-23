# AI-Agent UI Benchmark Results

> **Protocol:** See [`PROMPT.md`](./PROMPT.md) for the exact task prompt and 4-arm experimental setup.
> **Automated Scorer:** Run `node benchmarks/agent-eval/score.js <path-to-html> --arm="<Label>"` to reproduce any row below using MCP `validate_component_usage`, MCP `lint_accessibility`, headless Chromium runtime checks, and `@axe-core/playwright` WCAG 2.2 AA audits.

## Summary Table

| Arm | Unmodified Raw Output | LOC | Invalid Component Usage | Runtime Errors | WCAG 2.2 AA (Critical/Serious) | Overflow (Desktop / Mobile) | Custom Elements Hydrated |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Reference Baseline** | [`examples/saas-admin.html`](../../examples/saas-admin.html) | 352 | 0 | 0 | 0 | 0px / 0px | 100% |
| **Arm 1: Elementum + MCP** | [`submissions/arm-1-elementum-mcp/index.html`](./submissions/arm-1-elementum-mcp/index.html) | 237 | 0 | 0 | 1 *(color-contrast)* | 0px / 0px | 42 / 42 |
| **Arm 2: Elementum + Docs Only** | [`submissions/arm-2-elementum-docs/index.html`](./submissions/arm-2-elementum-docs/index.html) | 88 | 0 | 0 | 0 | 0px / 0px | 37 / 37 |
| **Arm 3: Conventional CSS** | [`submissions/arm-3-conventional/index.html`](./submissions/arm-3-conventional/index.html) | 99 | N/A | 0 | 5 *(1 critical, 4 serious)* | 0px / 69px | N/A |
| **Arm 4: No Design-System Context** | [`submissions/arm-4-no-ds/index.html`](./submissions/arm-4-no-ds/index.html) | 51 | N/A | 0 | 8 *(1 critical, 7 serious)* | 0px / 585px | N/A |

## Experimental Provenance & Environment (Run `2026-11-22`)

| Parameter | Value |
| :--- | :--- |
| **Task Prompt** | Standardized 6-requirement *"Nova Cloud Team & Billing Console"* specification in [`PROMPT.md`](./PROMPT.md) |
| **Model & Generation Settings** | `claude-3-7-sonnet-20250219`, `temperature: 0.0`, single-pass generation (`1` turn, zero post-generation human edits or retry loops) |
| **Scoring Runtime** | Node.js `v22.22.2`, Playwright `1.58.2` (Headless Chromium), `@axe-core/playwright` `4.11.2` |
| **WCAG Ruleset** | `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` |
| **Tested Viewports** | Desktop `1280×800` and Mobile `375×812` (`document.documentElement.scrollWidth - window.innerWidth`) |

### Key Takeaways

1. **Zero Responsive Overflow on Elementum Arms**: Both Elementum arms (`Arm 1` and `Arm 2`) achieved **0px / 0px** overflow across Desktop (`1280×800`) and Mobile (`375×812`), whereas conventional CSS (`69px`) and raw HTML/CSS (`585px`) overflowed mobile viewports.
2. **Reduction in WCAG 2.2 AA Severe Violations**: Elementum's encapsulated accessible primitives reduced critical/serious `axe-core` findings from **5–8 violations** (`select-name`, `color-contrast`, `html-has-lang`) down to **0–1**.
3. **100% Custom Element Hydration & Zero Runtime Errors**: Every Elementum custom element (`42/42` in Arm 1, `37/37` in Arm 2) upgraded cleanly with zero uncaught page or console errors.

## Qualifications & Scope Limitations

To interpret these results accurately:
- **First-Party Controlled Benchmark (`n = 1` task across 4 arms)**: This experiment was designed and executed within the Elementum repository on a single complex enterprise dashboard prompt. It provides reproducible, inspectable evidence that a verifiable component contract reduces layout and accessibility regressions, **not** an independent multi-task academic guarantee.
- **Single-Pass vs. Multi-Turn Agent Loops**: Submissions above measure **first-pass output** without an iterative `npx @wcomp/elementum check` or Playwright self-correction loop (running `elementum check` + `lint_accessibility` in a 2nd turn resolves the single custom badge contrast finding in Arm 1).
- **Automated `axe-core` Scope**: `@axe-core/playwright` catches deterministic DOM/ARIA/contrast violations (~57% of WCAG criteria) and does not replace manual assistive-technology testing (NVDA / VoiceOver) or human visual craft evaluation.

## Reproduce All 4 Arms Locally

```bash
node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/arm-1-elementum-mcp/index.html --arm="Arm 1: Elementum + MCP"
node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/arm-2-elementum-docs/index.html --arm="Arm 2: Elementum + Docs Only"
node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/arm-3-conventional/index.html --arm="Arm 3: Conventional CSS"
node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/arm-4-no-ds/index.html --arm="Arm 4: No Design-System Context"
```

## How to Contribute an Independent or Multi-Model Run

We actively welcome independent reproductions across different models (Claude, GPT-4o/o3, Gemini, DeepSeek, Qwen) and multiple random seeds:

1. Run the exact prompt in [`PROMPT.md`](./PROMPT.md) with your target model (record model ID, temperature, turn count, and date).
2. Save the unmodified generated output under `benchmarks/agent-eval/submissions/<arm>-<model>/index.html`.
3. Run the automated scorer:
   ```bash
   node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/<arm>-<model>/index.html --arm="Arm 1: Elementum + MCP (<model>)"
   ```
4. Append the generated Markdown row and raw JSON output to this file in a pull request.

