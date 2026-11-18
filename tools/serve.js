#!/usr/bin/env node
/**
 * Elementum Dev Server with Mobile Network & Proxy Tunnel Support
 * Zero-dependency static server with CORS, MIME resolution, LAN IP discovery,
 * and automatic public tunnel forwarding for mobile devices.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const PORT = parseInt(process.env.PORT, 10) || 3000;
const enableProxy = process.argv.includes('--proxy') || process.argv.includes('--tunnel');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

const server = http.createServer((req, res) => {
  // CORS & No-Cache Headers for Development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Normalize path & prevent directory traversal
  let safePath = path.normalize(path.join(rootDir, pathname));
  if (!safePath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Directory handling
  try {
    const stat = fs.statSync(safePath);
    if (stat.isDirectory()) {
      const indexCandidate = path.join(safePath, 'index.html');
      if (fs.existsSync(indexCandidate)) {
        safePath = indexCandidate;
      }
    }
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404 Not Found: ${pathname}`);
    return;
  }

  const ext = path.extname(safePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(safePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`500 Server Error: ${err.message}`);
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const lanIps = getNetworkAddresses();
  const primaryLan = lanIps[0] || 'localhost';

  console.log('\n======================================================');
  console.log('⚡ Elementum Dev Server Active');
  console.log('======================================================');
  console.log(`  Local:            http://localhost:${PORT}`);
  console.log(`  Network (Wi-Fi):  http://${primaryLan}:${PORT}`);
  console.log('------------------------------------------------------');
  console.log('  Direct Entry Points:');
  console.log(`  - Reference Hub:  http://${primaryLan}:${PORT}/examples/references.html`);
  console.log(`  - AI Studio:      http://${primaryLan}:${PORT}/examples/agent-studio.html`);
  console.log(`  - Showcase:       http://${primaryLan}:${PORT}/examples/index.html`);
  console.log(`  - Travel App:     http://${primaryLan}:${PORT}/examples/app.html`);
  console.log('======================================================\n');

  if (enableProxy) {
    console.log('🌐 Starting public Cloudflare tunnel for mobile testing...');
    const tunnel = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--url', `http://127.0.0.1:${PORT}`], {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    tunnel.stdout.on('data', (data) => {
      const out = data.toString();
      const match = out.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (match) {
        console.log(`\n🚀 Cloudflare Tunnel Ready: ${match[0]}`);
      }
    });

    tunnel.stderr.on('data', (data) => {
      const err = data.toString();
      const match = err.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (match) {
        console.log(`\n🚀 Cloudflare Tunnel Ready: ${match[0]}`);
      }
    });

    process.on('SIGINT', () => tunnel.kill());
    process.on('SIGTERM', () => tunnel.kill());
  }
});
