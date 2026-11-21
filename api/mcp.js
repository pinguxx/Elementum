/**
 * Vercel Serverless Function for Elementum MCP (Streamable HTTP JSON-RPC).
 * Serves POST /api/mcp (and /mcp via vercel.json rewrite).
 */
import { handleJsonRpcLine } from '../mcp/server.js';

const MAX_BODY_BYTES = 128 * 1024;

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined) {
      resolve(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      return;
    }
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST with JSON-RPC 2.0.' }));
    return;
  }

  let raw;
  try {
    raw = await readRawBody(req);
  } catch {
    res.statusCode = 413;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Payload too large' } }));
    return;
  }

  // JSON-RPC notifications (e.g. notifications/initialized) must not return a response body
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.id === undefined) {
      res.statusCode = 202;
      res.end();
      return;
    }
  } catch {
    // Let handleJsonRpcLine return the standard parse error
  }

  const response = handleJsonRpcLine(raw);
  if (!response) {
    res.statusCode = 202;
    res.end();
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(response));
}
