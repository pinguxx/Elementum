---
name: elementum-penpot
description: Bidirectional Penpot MCP design system workflow for Elementum — syncing W3C DTCG tokens, 165 component variants into Penpot, and generating live Web Components apps from Penpot pages.
---

# Elementum Penpot MCP Skill

Use this skill when syncing Elementum's design system into [Penpot](https://design.penpot.app) or generating live Elementum Web Components apps from a Penpot design file.

## Security First
- **Never** hardcode, log, or commit a user's personal `userToken` JWT into source control or docs.
- Always pass it via `PENPOT_MCP_URL`, `PENPOT_MCP_TOKEN`, or runtime `--url` / `--token` CLI flags.
- Only publish Penpot's read-only viewer share URLs (`https://design.penpot.app/?screen=viewer&...&share-id=...`) in public docs.

## Workflows

### 1. Code → Penpot Design System (`npm run penpot:mcp`)
Generates 54 W3C DTCG tokens (`Elementum Core`, `Elementum Light`, `Elementum Dark`), 28 library colors, `00 · Foundations`, and 8 category pages (`01 · Actions & Buttons` .. `08 · AI & Specialist`) with 165 Master Component variants:
```bash
npm run penpot:mcp -- --url "https://design.penpot.app/mcp/stream?userToken=<YOUR_TOKEN>"
# Validate locally without network:
npm run penpot:mcp -- --dry-run
```

### 2. Penpot → Live Elementum App (`npm run penpot:generate`)
Name Penpot component boards using `el-*` annotations (e.g., `el-navbar | brand="LedgerFlow" badge="Finance"`), then extract the Penpot tree, validate tags against Elementum's catalog, export a PNG mockup, and generate a working zero-dependency HTML app:
```bash
npm run penpot:generate -- \
  --url "https://design.penpot.app/mcp/stream?userToken=<YOUR_TOKEN>" \
  --page "LedgerFlow App" \
  --out examples/ledgerflow.html \
  --export-png docs/assets/ledgerflow-penpot.png
```

### 3. Penpot → CSS Tokens (`npm run tokens:sync`)
Export W3C DTCG JSON from Penpot to `tokens/penpot-tokens.json` and compile to `src/tokens.css`:
```bash
npm run tokens:sync tokens/penpot-tokens.json
```

## Penpot API Gotchas
- `penpot.createPage()` takes **0 arguments**; assign `page.name = '...'` and `await penpot.openPage(page)` before creating shapes.
- Penpot's default font supports weights `200, 300, 400, 600, 700, 900` (not `500`).
- Use uppercase 6-digit hex strings (`#2563EB`) for `fills`, `strokes`, and `LibraryColor.color`.
- Keep the Penpot browser tab active/visible so Chrome does not throttle the Penpot MCP Plugin heartbeat.
