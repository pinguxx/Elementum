# AI-Agent UI Benchmark Results

> **Protocol:** See [`PROMPT.md`](./PROMPT.md) for the standardized 4-arm experimental setup.
> **Automated Scorer:** Run `node benchmarks/agent-eval/score.js <path-to-html> --arm="<Label>"` to reproduce any row below using MCP `validate_component_usage`, MCP `lint_accessibility`, headless Chromium runtime checks, and `@axe-core/playwright` WCAG 2.2 AA audits.

## Summary Table

| Arm | LOC | Invalid Component Usage | Runtime Errors | WCAG 2.2 AA (Critical/Serious) | Overflow (Desktop / Mobile) | Correction Turns | Time (s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Reference Baseline** (`examples/saas-admin.html`) | 352 | 0 | 0 | 0 | 0px / 0px | — | — |
| **Arm 1: Elementum + MCP** | *Pending run* | — | — | — | — | — | — |
| **Arm 2: Elementum + Docs Only** | *Pending run* | — | — | — | — | — | — |
| **Arm 3: Conventional UI Library** | *Pending run* | N/A | — | — | — | — | — |
| **Arm 4: No Design-System Context** | *Pending run* | N/A | — | — | — | — | — |

## How to Contribute a Run

1. Run the exact prompt in [`PROMPT.md`](./PROMPT.md) with your target model (record model ID, temperature, and date).
2. Save the unmodified generated output under `benchmarks/agent-eval/submissions/<arm>/index.html`.
3. Run the automated scorer:
   ```bash
   node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/<arm>/index.html --arm="Arm 1: Elementum + MCP (<model>)"
   ```
4. Append the generated Markdown row and raw JSON output to this file in a pull request.
