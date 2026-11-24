/**
 * Vercel Serverless Function for live Elementum Declarative Shadow DOM (DSD) SSR.
 * Serves /ssr?hydrate=1 (Progressive Hydration) and /ssr?hydrate=0 (Pure Zero-JS DSD).
 */
import { renderSsrPage } from '../examples/ssr-server.js';

export const SSR_SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

export default function handler(req, res) {
  for (const [key, value] of Object.entries(SSR_SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }

  const method = String(req?.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end('Method Not Allowed');
    return;
  }

  const url = new URL(req?.url || '/ssr', 'https://elementum-sage.vercel.app');
  const hydrate = url.searchParams.get('hydrate') !== '0';

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (method === 'HEAD') {
    res.end();
    return;
  }

  const html = renderSsrPage({
    hydrate,
    staticMode: false,
    basePath: '/ssr',
    requestPath: `/ssr${url.search}`,
  });

  res.end(html);
}
