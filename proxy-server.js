/**
 * proxy-server.js — Gemini edition
 *
 * Serves the Chronos static files and proxies /gemini/* requests to
 * the Google Generative Language API, injecting your API key server-side
 * so it is never exposed in client code.
 *
 * Usage:
 *   GEMINI_API_KEY=AIza... node proxy-server.js
 *
 * Then open http://localhost:3000
 *
 * API key: https://aistudio.google.com/app/apikey
 */

const http = require('http');
const https = require('https');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const API_KEY = process.env.GEMINI_API_KEY || '';
const PORT    = process.env.PORT || 3000;

if (!API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set — AI Coach will not work.');
}

// ── MIME types ────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.txt':  'text/plain',
  '.md':   'text/markdown',
  '.ico':  'image/x-icon',
};

// ── Server ────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // CORS — allow any localhost origin during development
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── Proxy: /gemini/* → generativelanguage.googleapis.com ─────
  if (parsed.pathname.startsWith('/gemini/')) {
    // Strip the /gemini prefix, append the API key as a query param
    const apiPath = parsed.pathname.replace('/gemini', '') + `?key=${API_KEY}`;

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path:     apiPath,
        method:   'POST',
        headers:  { 'Content-Type': 'application/json' },
      };

      const proxy = https.request(options, apiRes => {
        res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
        apiRes.pipe(res);
      });

      proxy.on('error', err => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: err.message } }));
      });

      proxy.write(body);
      proxy.end();
    });
    return;
  }

  // ── Static file server ────────────────────────────────────────
  let filePath = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 — not found');
      return;
    }
    const mime = MIME[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n🧠 Chronos + Gemini AI Coach`);
  console.log(`   Running at  → http://localhost:${PORT}`);
  console.log(`   API key     → ${API_KEY ? '✅ set' : '❌ missing (set GEMINI_API_KEY)'}`);
  console.log(`   Model       → gemini-1.5-flash\n`);
});