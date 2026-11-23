# AI-Agent UI Benchmark Results

> **Protocol:** See [`PROMPT.md`](./PROMPT.md) for the standardized 4-arm experimental setup.
> **Automated Scorer:** Run `node benchmarks/agent-eval/score.js <path-to-html> --arm="<Label>"` to reproduce any row below using MCP `validate_component_usage`, MCP `lint_accessibility`, headless Chromium runtime checks, and `@axe-core/playwright` WCAG 2.2 AA audits.

## Summary Table

| Arm | LOC | Invalid Component Usage | Runtime Errors | WCAG 2.2 AA (Critical/Serious) | Overflow (Desktop / Mobile) | Custom Elements Hydrated |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Reference Baseline** (`examples/saas-admin.html`) | 352 | 0 | 0 | 0 | 0px / 0px | 100% |
| **Arm 1: Elementum + MCP** (`submissions/arm-1-elementum-mcp/index.html`) | 237 | 0 | 0 | 1 *(color-contrast)* | 0px / 0px | 42 / 42 |
| **Arm 2: Elementum + Docs Only** (`submissions/arm-2-elementum-docs/index.html`) | 88 | 0 | 0 | 0 | 0px / 0px | 37 / 37 |
| **Arm 3: Conventional CSS** (`submissions/arm-3-conventional/index.html`) | 99 | N/A | 0 | 5 *(1 critical, 4 serious)* | 0px / 69px | N/A |
| **Arm 4: No Design-System Context** (`submissions/arm-4-no-ds/index.html`) | 51 | N/A | 0 | 8 *(1 critical, 7 serious)* | 0px / 585px | N/A |

### Key Takeaways from the Automated Run (2026-11-22)

1. **Zero Responsive Overflow on Elementum Arms**: Both Elementum arms (`Arm 1` and `Arm 2`) achieved **0px / 0px** overflow across Desktop (`1280×800`) and Mobile (`375×812`), whereas conventional CSS (`69px`) and raw HTML/CSS (`585px`) overflowed mobile viewports.
2. **Dramatic Reduction in WCAG 2.2 AA Severe Violations**: Elementum's built-in accessible primitives cut critical/serious `axe-core` findings from **5–8 violations** (`select-name`, `color-contrast`, `html-has-lang`) down to **0–1**.
3. **100% Custom Element Hydration & Zero Runtime Errors**: Every Elementum custom element (`42/42` in Arm 1, `37/37` in Arm 2) upgraded cleanly with zero uncaught page or console errors.

### Reproduce All 4 Arms Locally

```bash
node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/arm-1-elementum-mcp/index.html --arm="Arm 1: Elementum + MCP"
node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/arm-2-elementum-docs/index.html --arm="Arm 2: Elementum + Docs Only"
node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/arm-3-conventional/index.html --arm="Arm 3: Conventional CSS"
node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/arm-4-no-ds/index.html --arm="Arm 4: No Design-System Context"
```

## How to Contribute an Independent Run

1. Run the exact prompt in [`PROMPT.md`](./PROMPT.md) with your target model (record model ID, temperature, and date).
2. Save the unmodified generated output under `benchmarks/agent-eval/submissions/<arm>/index.html`.
3. Run the automated scorer:
   ```bash
   node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/<arm>/index.html --arm="Arm 1: Elementum + MCP (<model>)"
   ```
4. Append the generated Markdown row and raw JSON output to this file in a pull request.
