/**
 * Vercel Serverless Function for live Elementum Declarative Shadow DOM (DSD) SSR.
 * Serves /ssr?hydrate=1 (Progressive Hydration) and /ssr?hydrate=0 (Pure Zero-JS DSD).
 */
import { renderSsrPage } from '../examples/ssr-server.js';

export default function handler(req, res) {
  const url = new URL(req.url || '/ssr', 'https://elementum.vercel.app');
  const hydrate = url.searchParams.get('hydrate') !== '0';

  const html = renderSsrPage({
    hydrate,
    staticMode: false,
    basePath: '/ssr',
    requestPath: `/ssr${url.search}`,
  });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(html);
}
