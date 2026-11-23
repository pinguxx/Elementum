# AI-Agent UI Benchmark Protocol (4-Arm Controlled Experiment)

This benchmark measures the real-world impact of connecting an AI coding agent to a **verifiable component contract (MCP)** versus docs-only, a conventional UI library, or no design-system context.

## Experimental Design (4 Arms)

Run the **exact same task prompt** below with the **same LLM model, temperature, and max-turn budget** across four isolated arms:

| Arm | Context Given to Agent |
| :--- | :--- |
| **Arm 1: Elementum + MCP** | Connected to `npx elementum-mcp` (or `https://elementum-sage.vercel.app/mcp`) |
| **Arm 2: Elementum + Docs Only** | Provided [`docs/agent-craft-guide.md`](../../docs/agent-craft-guide.md) (no MCP server) |
| **Arm 3: Conventional UI Library** | Instructed to use a conventional library (e.g., Tailwind + shadcn/ui or Shoelace) |
| **Arm 4: No Design-System Context** | Plain prompt with no component library or design-system instructions |

---

## Standardized Task Prompt

> Build a single-page **Team & Billing Console** web application (`index.html`) with the following requirements:
>
> 1. **Top Navigation Bar**: Sticky header with brand name `"Nova Cloud"`, status badge `"Pro"`, navigation links (`Overview`, `Team`, `Billing`), and a working light/dark theme toggle.
> 2. **KPI Summary Row**: 3 cards showing Active Seats (`18`), Monthly Spend (`$432/mo`), and API Quota (`74%`) with a visual meter or progress bar.
> 3. **Interactive Team Directory**:
>    - Search input to filter members by name in real time.
>    - Role filter dropdown (`All`, `Engineer`, `Architect`, `Researcher`).
>    - Sortable, selectable data table pre-populated with at least 4 team members.
>    - Empty state shown when filters match 0 members.
> 4. **Invite Member Modal**:
>    - Clicking `"Invite Member"` opens an accessible modal dialog (keyboard focus trap + `Esc` to close).
>    - Form with required Name input, Email input, and Role selector.
>    - Submitting adds the new member to the table, closes the modal, and displays a toast confirmation.
> 5. **AI Billing Assistant Panel**:
>    - Prompt composer where the user can ask a billing question and submit with `Enter`.
>    - Displays a collapsible reasoning/thought section, a tool-call status card (`query_usage`), streaming response text, and clickable source citations.
> 6. **Accessibility & Responsiveness**:
>    - Must pass WCAG 2.2 AA (`@axe-core/playwright`, 0 critical/serious violations).
>    - Must have zero horizontal overflow on both desktop (`1280x800`) and mobile (`375x812`).
>    - Must produce zero uncaught console or page errors.

---

## Scoring Protocol (Objective & Reproducible)

Save each arm's unmodified output to `benchmarks/agent-eval/submissions/<arm>/index.html` and run the automated scorer:

```bash
node benchmarks/agent-eval/score.js benchmarks/agent-eval/submissions/<arm>/index.html --arm="<Arm Name>"
```

### Metrics Recorded per Arm
1. **Invalid Component Usage** (Elementum arms): Count of invalid tags, unknown attributes, closed-enum violations, and parent/child constraint errors via MCP `validate_component_usage`.
2. **Static A11y Lint Findings**: Count of static findings via MCP `lint_accessibility`.
3. **Real-Browser Runtime Errors**: Count of `console.error` + uncaught `pageerror` exceptions in headless Chromium.
4. **WCAG 2.2 AA Violations**: Count of `critical` and `serious` violations via `@axe-core/playwright`.
5. **Responsive Layout Integrity**: Desktop (`1280x800`) and Mobile (`375x812`) horizontal overflow check (`scrollWidth <= innerWidth`).
6. **Manual Process Metrics** (logged by the experimenter):
   - Total implementation wall-clock time (seconds)
   - Number of correction turns required before passing all checks
   - Total prompt + completion tokens
   - Human visual craft score (1–5 rubric: hierarchy, spacing, dark mode, polish)
