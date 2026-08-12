// Local dev server: serves the static site AND runs the real
// netlify/functions/get-sheet.js handler for /.netlify/functions/get-sheet,
// so the dashboard gets LIVE Google Sheets data on your computer too —
// no Netlify CLI/account needed, and production is untouched (same handler
// file either way, so what works here works once deployed).
//
// Run:  node dev-server.js   then open http://localhost:8888
const http = require('http');
const fs = require('fs');
const path = require('path');
const { handler } = require('./netlify/functions/get-sheet.js');

const ROOT = __dirname;
const PORT = process.env.PORT || 8888;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.toml': 'text/plain',
    '.json': 'application/json'
};

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/.netlify/functions/get-sheet') {
        const office = url.searchParams.get('office');
        const result = await handler({ queryStringParameters: { office } });
        res.writeHead(result.statusCode, {
            'Content-Type': (result.headers && result.headers['Content-Type']) || 'text/plain',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(result.isBase64Encoded ? Buffer.from(result.body, 'base64') : result.body);
        return;
    }

    const filePath = path.join(ROOT, url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, () => console.log(`Dev server (live Google Sheets data) → http://localhost:${PORT}`));
