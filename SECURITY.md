# Security Policy

## 1. Supported Versions

Security fixes are released on the active `0.8.x` line (leading to `1.0.0`):

| Version | Supported | Notes |
| :--- | :---: | :--- |
| `0.8.x` | ✅ Yes | Active security & stability updates |
| `< 0.8.0` | ❌ No | Upgrade to the latest `0.8.x` release |

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
4. **JSON Patch & AG-UI State Isolation ([`src/ag-ui.js`](./src/ag-ui.js))**:
   - `applyJsonPatch()` and RFC 6902 pointer helpers block `__proto__`, `constructor`, and `prototype` path segments to prevent prototype pollution.
   - `createAgUiStore()` supports `runId` / `surfaceId` gating (`strictRunId`) and `allowedPaths` isolation for streaming state deltas.
5. **A2UI Declarative Rendering ([`src/a2ui.js`](./src/a2ui.js))**:
   - Locks component rendering to `DEFAULT_A2UI_CATALOG` (or caller-provided subset), rejects inline `on*` attributes and unsafe URL schemes, and blocks prototype-pollution keys (`__proto__`, `constructor`, `prototype`).

> **Important boundary**: Setting arbitrary raw `element.innerHTML` from untrusted user strings directly in application code remains the application's responsibility to sanitize.

---

## 4. MCP Server Threat Model ([`mcp/server.js`](./mcp/server.js), [`mcp/edge.js`](./mcp/edge.js) & [`api/mcp.js`](./api/mcp.js))

The Elementum Design System MCP server exposes component schemas, design tokens, snippet generation, and static HTML accessibility linting over JSON-RPC 2.0 (`stdio` and Streamable HTTP):

- **Read-Only Tool Execution (`readOnlyHint: true`)**: All 11 tools annotate `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`. No tool writes files, spawns child processes, executes shell commands, modifies environment state, or makes outbound network calls.
- **Safe CLI / Stdio Dispatch ([`bin/elementum.js`](./bin/elementum.js))**: Invoking `npx -y @wcomp/elementum` over piped stdio (no arguments and `!process.stdin.isTTY`) or via `npx @wcomp/elementum mcp` starts the read-only stdio MCP server with zero filesystem writes; setup/scaffolding writes occur only when explicitly running `init` or `--*` flags.
- **Input, Batch & Payload Bounds ([`mcp/core.js`](./mcp/core.js))**:
  - `MAX_PAYLOAD_BYTES = 128 * 1024` (128 KB) on both stdio and HTTP (`HTTP 413` on oversized bodies), plus `MAX_BATCH_SIZE = 20` requests per JSON-RPC batch (`-32600` if exceeded) and a 20-term cap on `suggest_component` queries.
  - Strict regex validation for custom element tags (`SAFE_TAG_RE`), class names (`SAFE_CLASS_RE`), and attributes (`SAFE_ATTR_RE`), rejecting malformed identifiers rather than interpolating them.
  - Attribute values and slot content in `generate_snippet` are escaped via `escapeAttr()` / `escapeText()`, `scaffold_component` strips JSDoc comment breakouts (`*/` and newlines) from `description`, and `validate_a2ui_messages` validates against the locked A2UI catalog while rejecting `on*` handlers, unsafe URL schemes, and prototype keys (`__proto__`, `constructor`, `prototype`).
- **Streamable HTTP & Edge Security Headers ([`mcp/edge.js`](./mcp/edge.js) & [`vercel.json`](./vercel.json))**:
  - All HTTP MCP responses include `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `Cross-Origin-Resource-Policy: cross-origin`, and `Cache-Control: no-store`.
  - **DNS-Rebinding & Origin Validation**: `isAllowedOrigin()` validates any `Origin` header, rejecting `'null'`, malformed URLs, non-HTTP schemes, and cleartext non-loopback `http://` origins (`HTTP 403`), with optional strict allowlisting via `allowedOrigins` (`Vary: Origin`).
  - **CSRF / Media-Type & Method Enforcement**: Non-`POST` requests (other than `OPTIONS`/`DELETE` `204`) return `405` with `Allow: POST, DELETE, OPTIONS`; `POST` requests with form content types (`text/html`, `multipart/form-data`, `application/x-www-form-urlencoded`, `text/plain`) or cross-origin non-`application/json` payloads are rejected with `415`.
- **Unauthenticated Public Discovery**: Only public, read-only design-system schemas and static linters are served without exposing user credentials or local workspace files outside `{custom-elements.json, package.json, tokens/figma-tokens.json, mcp/**}`. Similarly, [`api/ssr.js`](./api/ssr.js) restricts requests to `GET`/`HEAD` (`Allow: GET, HEAD`) and attaches `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `HSTS`, `Referrer-Policy`, and `Permissions-Policy`.
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
