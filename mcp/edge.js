/**
 * Pure-JS Web Fetch handler for Elementum MCP (Vercel Edge Runtime / Cloudflare Workers / Deno).
 */
import { createMcpHandler } from './core.js';

const MAX_BODY_BYTES = 128 * 1024;
const textEncoder = new TextEncoder();

const FORBIDDEN_FORM_CONTENT_TYPES = new Set([
  'text/html',
  'multipart/form-data',
  'application/x-www-form-urlencoded',
  'text/plain',
]);

export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Cache-Control': 'no-store',
};

const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version',
};

function isLoopbackHostname(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

export function isAllowedOrigin(origin, allowedOrigins = null) {
  if (typeof origin !== 'string' || !origin || origin === 'null') {
    return { allowed: false, origin: null };
  }
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    return { allowed: false, origin: null };
  }
  if (!parsed.origin || parsed.origin === 'null') {
    return { allowed: false, origin: null };
  }
  if (allowedOrigins !== null && allowedOrigins !== undefined) {
    const allowedSet = allowedOrigins instanceof Set ? allowedOrigins : new Set(allowedOrigins);
    return allowedSet.has(parsed.origin)
      ? { allowed: true, origin: parsed.origin }
      : { allowed: false, origin: null };
  }
  const allowed =
    parsed.protocol === 'https:' ||
    (parsed.protocol === 'http:' && isLoopbackHostname(parsed.hostname));
  return { allowed, origin: allowed ? parsed.origin : null };
}

function buildResponseHeaders(corsHeaders, extraHeaders = {}) {
  return {
    ...SECURITY_HEADERS,
    ...corsHeaders,
    ...extraHeaders,
  };
}

function jsonResponse(body, status = 200, corsHeaders = {}, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: buildResponseHeaders(corsHeaders, {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    }),
  });
}

export function createEdgeMcpHandler({ manifest, tokens, pkg, metadata = {}, allowedOrigins = null }) {
  const { handleJsonRpcLine } = createMcpHandler({ manifest, tokens, pkg, metadata });
  const hasExplicitAllowlist = allowedOrigins !== null && allowedOrigins !== undefined;

  return async function handler(request) {
    const originHeader = request.headers.get('origin');
    let corsHeaders = hasExplicitAllowlist
      ? { ...BASE_CORS_HEADERS, Vary: 'Origin' }
      : { ...BASE_CORS_HEADERS, 'Access-Control-Allow-Origin': '*' };

    if (originHeader !== null) {
      const check = isAllowedOrigin(originHeader, allowedOrigins);
      if (!check.allowed) {
        return jsonResponse(
          { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Origin not allowed.' } },
          403,
          BASE_CORS_HEADERS
        );
      }
      if (hasExplicitAllowlist) {
        corsHeaders = {
          ...BASE_CORS_HEADERS,
          'Access-Control-Allow-Origin': check.origin,
          Vary: 'Origin',
        };
      }
    }

    if (request.method === 'OPTIONS' || request.method === 'DELETE') {
      return new Response(null, { status: 204, headers: buildResponseHeaders(corsHeaders) });
    }

    if (request.method !== 'POST') {
      return jsonResponse(
        { error: 'Method Not Allowed. Use POST with JSON-RPC 2.0.' },
        405,
        corsHeaders,
        { Allow: 'POST, DELETE, OPTIONS' }
      );
    }

    const rawContentType = request.headers.get('content-type') || '';
    const mediaType = rawContentType.split(';')[0].trim().toLowerCase();
    if (
      FORBIDDEN_FORM_CONTENT_TYPES.has(mediaType) ||
      (originHeader !== null && mediaType !== 'application/json')
    ) {
      return jsonResponse(
        { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Unsupported Content-Type. Expected application/json.' } },
        415,
        corsHeaders
      );
    }

    const contentLength = Number(request.headers.get('content-length') || '0');
    if (contentLength > MAX_BODY_BYTES) {
      return jsonResponse(
        { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Payload too large' } },
        413,
        corsHeaders
      );
    }

    const raw = await request.text();
    if (textEncoder.encode(raw).length > MAX_BODY_BYTES) {
      return jsonResponse(
        { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Payload too large' } },
        413,
        corsHeaders
      );
    }

    const response = handleJsonRpcLine(raw);
    if (!response) {
      return new Response(null, { status: 202, headers: buildResponseHeaders(corsHeaders) });
    }

    return jsonResponse(response, 200, corsHeaders);
  };
}
