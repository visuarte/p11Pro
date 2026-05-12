// serve-dist-on-the-fly.cjs
// Small Node server that serves files from dist/ and applies compression on-the-fly
// Usage: node serve-dist-on-the-fly.cjs [port]
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DIST = path.resolve(__dirname, 'dist');
const PORT = parseInt(process.argv[2] || process.env.PORT || '5000', 10);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm'
};

function safeJoin(base, target) {
  const targetPath = path.join(base, target);
  if (!targetPath.startsWith(base)) return null;
  return targetPath;
}

function createServer() {
  return http.createServer((req, res) => {
    // determine requested path using WHATWG URL
    let base = 'http://localhost';
    if (req.headers && req.headers.host) base = 'http://' + req.headers.host;
    let requested;
    try {
      requested = new URL(req.url || '/', base).pathname;
    } catch (e) {
      requested = req.url || '/';
    }
    if (!requested || requested === '/') requested = '/index.html';

    const filePath = safeJoin(DIST, decodeURIComponent(requested));
    if (!filePath) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const ctype = mime[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', ctype);
    res.setHeader('Vary', 'Accept-Encoding');

    const accept = req.headers['accept-encoding'] || '';
    const stream = fs.createReadStream(filePath);

    // prefer brotli
    if (accept.includes('br') && typeof zlib.createBrotliCompress === 'function') {
      res.setHeader('Content-Encoding', 'br');
      const brotli = zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } });
      stream.pipe(brotli).pipe(res);
      return;
    }

    if (accept.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      const gzip = zlib.createGzip({ level: zlib.constants.Z_BEST_SPEED });
      stream.pipe(gzip).pipe(res);
      return;
    }

    // no compression
    stream.pipe(res);
  });
}

const server = createServer();
server.listen(PORT, () => {
  console.log(`Serving ${DIST} on http://localhost:${PORT}/ (on-the-fly compression if client accepts it)`);
});

