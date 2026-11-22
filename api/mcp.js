/**
 * Vercel Edge Function for Elementum MCP (Streamable HTTP JSON-RPC).
 * Serves POST /api/mcp (and /mcp via vercel.json rewrite) with ~15ms global latency and zero Node cold starts.
 */
import manifest from '../custom-elements.json' with { type: 'json' };
import tokens from '../tokens/figma-tokens.json' with { type: 'json' };
import pkg from '../package.json' with { type: 'json' };
import { createMcpHandler } from '../mcp/core.js';

export const config = {
  runtime: 'edge',
};

const MAX_BODY_BYTES = 128 * 1024;
const textEncoder = new TextEncoder();
const { handleJsonRpcLine } = createMcpHandler({ manifest, tokens, pkg });

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

export default async function handler(request) {
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
}
