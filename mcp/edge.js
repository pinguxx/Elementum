/**
 * Pure-JS Web Fetch handler for Elementum MCP (Vercel Edge Runtime / Cloudflare Workers / Deno).
 */
import { createMcpHandler } from './core.js';

const MAX_BODY_BYTES = 128 * 1024;
const textEncoder = new TextEncoder();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version',
  'Cache-Control': 'no-store',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export function createEdgeMcpHandler({ manifest, tokens, pkg }) {
  const { handleJsonRpcLine } = createMcpHandler({ manifest, tokens, pkg });

  return async function handler(request) {
    if (request.method === 'OPTIONS' || request.method === 'DELETE') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method Not Allowed. Use POST with JSON-RPC 2.0.' }, 405);
    }

    const contentLength = Number(request.headers.get('content-length') || '0');
    if (contentLength > MAX_BODY_BYTES) {
      return jsonResponse(
        { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Payload too large' } },
        413
      );
    }

    const raw = await request.text();
    if (textEncoder.encode(raw).length > MAX_BODY_BYTES) {
      return jsonResponse(
        { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Payload too large' } },
        413
      );
    }

    const response = handleJsonRpcLine(raw);
    if (!response) {
      return new Response(null, { status: 202, headers: CORS_HEADERS });
    }

    return jsonResponse(response, 200);
  };
}
