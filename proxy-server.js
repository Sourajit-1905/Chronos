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

// ── Load .env file automatically ──────────────────────────────────
// Reads KEY=VALUE lines from .env in the same folder as this script.
// Skips comments (#) and blank lines. No npm package needed.
const envPath = path.join(__dirname, '.env');
console.log(`\n📂 Looking for .env at: ${envPath}`);

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  console.log(`📄 .env found — ${lines.length} lines`);
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
      console.log(`   set: ${key.trim()} = ${rest.join('=').trim().slice(0, 8)}...`);
    }
  });
  console.log('✅ Loaded .env');
} else {
  console.warn('❌ .env file NOT found at that path.');
  console.warn('   Create a .env file in the same folder as proxy-server.js');
}

const API_KEY = process.env.GEMINI_API_KEY || '';
const PORT    = process.env.PORT || 3000;
const MODEL   = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

if (!API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY is empty — AI Coach will not work.');
} else {
  console.log(`🔑 API key loaded: ${API_KEY.slice(0, 8)}... (${API_KEY.length} chars)`);
}
console.log(`🤖 Model: ${MODEL}`);

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
    const apiPath = parsed.pathname.replace('/gemini', '') + `?key=${API_KEY}`;
    console.log(`\n→ Proxying to: generativelanguage.googleapis.com${apiPath.split('?')[0]}`);
    console.log(`  Key in request: ${API_KEY ? API_KEY.slice(0,8)+'...' : '❌ EMPTY'}`);

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
        console.log(`  Gemini response: ${apiRes.statusCode}`);
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

    // Inject model name into index.html as a global JS variable
    // so coach.js can read it without hardcoding
    if (parsed.pathname === '/' || parsed.pathname === '/index.html') {
      const html = data.toString().replace(
        '<script type="module" src="js/app.js">',
        `<script>window.__GEMINI_MODEL__ = '${MODEL}';</script>\n  <script type="module" src="js/app.js">`
      );
      res.writeHead(200, { 'Content-Type': mime });
      res.end(html);
      return;
    }

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