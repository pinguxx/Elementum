# Security Policy

## 1. Supported Versions

Security fixes are released on the active `0.7.x` line (leading to `1.0.0`):

| Version | Supported | Notes |
| :--- | :---: | :--- |
| `0.7.x` | ✅ Yes | Active security & stability updates |
| `< 0.7.0` | ❌ No | Upgrade to the latest `0.7.x` release |

---

## 2. Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report suspected vulnerabilities privately via **GitHub Private Vulnerability Reporting** (`Security` → `Advisories` → `Report a vulnerability` on [pinguxx/Elementum](https://github.com/pinguxx/Elementum/security/advisories)), or contact the maintainer listed in npm metadata if advisory submission is unavailable.

Please include:
- Affected entrypoint or component (`src/template.js`, `src/ssr.js`, `mcp/server.js`, `src/components/*`, etc.)
- Minimal reproduction snippet or JSON-RPC / HTML payload
- Expected vs. actual security impact

**Response targets**:
- Initial acknowledgement within **72 hours**
- Triage and severity assessment within **7 days**
- Patch release & coordinated advisory once verified

---

## 3. Untrusted HTML, URL, and State Policies

`@wcomp/elementum` enforces strict escaping and prototype/scheme guards across all core renderers (verified in [`test/security.test.js`](./test/security.test.js)):

1. **Client Templates ([`src/template.js`](./src/template.js))**:
   - Interpolations in child positions are inserted via `document.createTextNode(...)` — never evaluated as HTML.
   - `<el-code-block>` ([`src/components/el-code-block.js`](./src/components/el-code-block.js)) highlights tokens exclusively through structured `<span class="tok-*">` text-node templates without `innerHTML`.
   - `<el-autocomplete>` match highlighting splits text nodes cleanly around `<mark part="highlight">`.
2. **Server-Side Rendering ([`src/ssr.js`](./src/ssr.js))**:
   - `renderTemplateToString()` and `renderComponentToDSD()` HTML-escape all dynamic text and attribute values (`&`, `<`, `>`, `"`, `'`) via `escapeHtml()`.
   - `@event=` / `on<event>=` listeners and `.prop=` bindings are stripped before emitting HTML so server functions are never invoked or serialized.
   - Attribute matchers and code highlighters are written in linear-time `O(n)` scanners to eliminate polynomial ReDoS backtracking.
3. **URL Sanitization ([`src/components/el-sources.js`](./src/components/el-sources.js))**:
   - Citation and external link renderers reject `javascript:`, `data:`, and `vbscript:` schemes (allowing only safe `https:`, `http:`, `mailto:`, or relative paths).
4. **JSON Patch State Updates ([`src/ag-ui.js`](./src/ag-ui.js))**:
   - `applyJsonPatch()` and RFC 6902 pointer helpers block `__proto__`, `constructor`, and `prototype` path segments to prevent prototype pollution.

> **Important boundary**: Setting arbitrary raw `element.innerHTML` from untrusted user strings directly in application code remains the application's responsibility to sanitize.

---

## 4. MCP Server Threat Model ([`mcp/server.js`](./mcp/server.js) & [`api/mcp.js`](./api/mcp.js))

The Elementum Design System MCP server exposes component schemas, design tokens, snippet generation, and static HTML accessibility linting over JSON-RPC 2.0 (`stdio` and Streamable HTTP):

- **Read-Only Tool Execution (`readOnlyHint: true`)**: All 10 tools annotate `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`. No tool writes files, spawns child processes, executes shell commands, modifies environment state, or makes outbound network calls.
- **Input & Payload Bounds**:
  - `MAX_PAYLOAD_BYTES = 128 * 1024` (128 KB) on both stdio and HTTP (`HTTP 413` on oversized bodies).
  - Strict regex validation for custom element tags (`SAFE_TAG_RE`), class names (`SAFE_CLASS_RE`), and attributes (`SAFE_ATTR_RE`), rejecting malformed identifiers rather than interpolating them.
  - Attribute values and slot content in `generate_snippet` are escaped via `escapeAttr()` / `escapeText()`, and `scaffold_component` strips JSDoc comment breakouts (`*/` and newlines) from `description`.
- **Unauthenticated Public Discovery**: Only public, read-only design-system schemas and static linters are served; `api/mcp.js` sets `Cache-Control: no-store` and CORS preflight headers without exposing any user credentials or local workspace files outside `{custom-elements.json, package.json, tokens/figma-tokens.json, mcp/**}`.
- **Penpot CLI Tools (`tools/sync-penpot-mcp.js`, `tools/penpot-to-elementum.js`)**: Separate maintainer CLI scripts (not exposed via `mcp/server.js`). Keep `PENPOT_MCP_TOKEN` / `userToken` JWTs strictly in runtime environment variables or untracked CLI args; never commit them.

---

## 5. Agent Runtime Boundaries (`@wcomp/elementum/agent`)

- **DOM Scope Isolation**: `snapshot(root)` and `act(root, command)` in [`src/agent/index.js`](./src/agent/index.js) operate strictly within the caller-supplied `root` element/shadow subtree. They have no filesystem, network, cookie, or cross-origin `<iframe>` access.
- **Fail-Closed Ref Validation**: `act()` tracks `@eN` refs in a per-snapshot weak map and rejects stale/detached references, `disabled` controls, and `hidden`/`inert` nodes rather than falling back to unconstrained `querySelector` guessing.
- **Declared vs. Verified Accessibility**: `snapshot()` explicitly surfaces structural `warnings` for suspicious ARIA configurations and does not claim automated `aria-label` inspection equals WCAG compliance.

---

## 6. Supply-Chain Transparency

- **Zero Runtime Dependencies**: [`package.json`](./package.json) declares zero `dependencies`; external consumer installs are verified in CI via `npm run verify:consumer` packing a real `.tgz` tarball.
- **Minimal CI & Release Permissions**: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs with read-only `contents: read` permissions and `npm ci` strict lockfile installs.
- **OIDC Provenance Publishing**: [`.github/workflows/publish.yml`](./.github/workflows/publish.yml) publishes to npm only on GitHub `release` events via OIDC Trusted Publishing (`id-token: write`, `npm publish --provenance --access public`) with no long-lived npm tokens stored in repo secrets.
- **Static Analysis**: CodeQL security scanning runs continuously against `src/**` and `mcp/**`.
