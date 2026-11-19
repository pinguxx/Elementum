# Elementum Agent Craft Guide: "Ban the AI Look"

> **Reference Inspiration:** Griffin Wooldridge (*"UI Libraries for Claude Code: Ban the AI Look"*), Emil Kowalski's design engineering skills (`emilkowalski/skills`), and modern craft systems (*Beautiful UI*, *21st.dev*, *Magic UI*).

---

## 1. The Core Problem: Why AI Generates "AI Slop"

When an AI coding agent (Claude Code, Gemini, Cursor) is asked to *"create a dashboard"* or *"build a settings page"*, it defaults to training data averages:
- Harsh, repetitive `1px solid #e2e8f0` borders around every card.
- Generic, abrupt state updates (e.g. counts jump from 10 to 25 with no transition).
- Stiff, standard `<textarea>` elements without auto-resize or model badges.
- Mouse-only navigation with no keyboard shortcuts.
- Clunky desktop modals on mobile viewports.

This guide provides concrete rules, design tokens, and components to ensure agents build **high-craft, human-designed interfaces**.

---

## 2. The 5 Cardinal Rules for Agents

### Rule 1: Always Anchor to a Reference (Never Invent From Scratch)
Before writing HTML, identify the reference pattern:
- **AI Studio / Prompts**: Reference [`examples/agent-studio.html`](file:///c:/dev/Elementum/examples/agent-studio.html) and *Beautiful UI*.
- **SaaS Pricing & Dashboards**: Reference [`examples/references.html`](file:///c:/dev/Elementum/examples/references.html) and *21st.dev*.
- **Command & Search**: Reference `<el-command>` and Paco Coursey's *cmdk*.
- **PIN & Verification**: Reference `<el-otp-input>` and Emil Kowalski's *input-otp*.

### Rule 2: Ban Flat 1px Solid Borders
❌ **Wrong (The AI Look):**
```css
border: 1px solid #e2e8f0;
box-shadow: none;
```

✅ **Right (The Craft Look):**
```css
border: 1px solid var(--el-border-translucent, rgba(15, 23, 42, 0.08));
box-shadow: var(--el-shadow-card, 0 1px 3px rgba(0,0,0,0.06), 0 8px 16px -4px rgba(0,0,0,0.04));
```

### Rule 3: Use Physical Motion (Never Linear or Jarring)
❌ **Wrong:** Abrupt number changes or linear CSS transitions:
```html
<span>$24/mo</span>
```

✅ **Right:** Odometer rolling numbers with physical exponential easing:
```html
<el-number-flow value="24" prefix="$" suffix="/mo"></el-number-flow>
```

### Rule 4: Keyboard-First Command Palette
Always provide an `<el-command>` instance toggled with <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> for power users:
```html
<el-command placeholder="Type a command or search...">
  <el-command-group heading="Actions">
    <el-command-item value="deploy" shortcut="⌘D">Deploy</el-command-item>
  </el-command-group>
</el-command>
```

### Rule 5: Specialized AI Primitives for AI Products
When building AI features, use dedicated Web Component primitives:
- Use **`<el-prompt-input>`** instead of raw `<textarea>`.
- Use **`<el-reasoning-card>`** for multi-step reasoning / extended thinking.
- Use **`<el-streaming-text>`** for token-by-token generation with blinking cursor.
- Use **`<el-border-beam>`** for active card highlights.

---

## 3. Ready-to-Copy System Prompt for Agents

You can paste this block into your agent's system prompt or `.cursorrules` / `GEMINI.md`:

```markdown
You are building user interfaces using @wcomp/elementum. Follow these design craft principles:
1. BAN THE AI LOOK: Do not use flat 1px solid gray borders (#e2e8f0) or generic gray cards. Use layered translucent elevation:
   - border: 1px solid var(--el-border-translucent, rgba(15, 23, 42, 0.08));
   - box-shadow: var(--el-shadow-card, 0 1px 3px rgba(0,0,0,0.06), 0 8px 16px -4px rgba(0,0,0,0.04));
2. ROLLING METRICS: For prices, token counts, or live stats, use <el-number-flow value="..." prefix="..." suffix="...">.
3. COMMAND PALETTE: Always provide keyboard shortcuts and <el-command> with ⌘K.
4. AI PROMPT COMPOSER: Use <el-prompt-input> with slot="tools" for model selection and prompt submission.
5. PINS & OTP: Use <el-otp-input length="6"> for code verification.
6. ZERO RUNTIME DEPENDENCIES: Elementum components require 0 external npm dependencies and run on native Web Components.
7. REFERENCE PATTERNS: Consult examples/agent-studio.html and examples/references.html for reference layouts.
```
