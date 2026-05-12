// serve-dist-compress.js
// Usage: node serve-dist-compress.js [port]
// Creates .gz and .br precompressed files (if supported) and serves them when client requests.
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const url = require('url');

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

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) walk(fp, filelist);
    else filelist.push(fp);
  });
  return filelist;
}

function precompressAll() {
  if (!fs.existsSync(DIST)) {
    console.warn('Dist directory not found:', DIST);
    return;
  }
  const files = walk(DIST);
  console.log('Precompressing', files.length, 'files...');
  for (const file of files) {
    const rel = path.relative(DIST, file);
    // skip already compressed files
    if (file.endsWith('.gz') || file.endsWith('.br')) continue;
    try {
      const data = fs.readFileSync(file);
      // gzip
      try {
        const gz = zlib.gzipSync(data, { level: zlib.constants.Z_BEST_COMPRESSION });
        fs.writeFileSync(file + '.gz', gz);
      } catch (e) {
        console.warn('gzip failed for', rel, e && e.message);
      }
      // brotli if supported
      if (typeof zlib.brotliCompressSync === 'function') {
        try {
          const br = zlib.brotliCompressSync(data, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 5
            }
          });
          fs.writeFileSync(file + '.br', br);
        } catch (e) {
          console.warn('brotli failed for', rel, e && e.message);
        }
      }
      console.log('Compressed:', rel);
    } catch (err) {
      console.error('Compress error:', file, err && err.message);
    }
  }
  console.log('Precompression finished.');
}

function createServer() {
  return http.createServer((req, res) => {
    const parsed = url.parse(req.url || '/');
    let requested = decodeURIComponent(parsed.pathname);
    if (requested === '/' || requested === '') requested = '/index.html';
    const filePath = path.join(DIST, requested);
    if (!filePath.startsWith(DIST)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const accept = req.headers['accept-encoding'] || '';
    res.setHeader('Vary', 'Accept-Encoding');

    const ext = path.extname(filePath).toLowerCase();
    const ctype = mime[ext] || 'application/octet-stream';
    // prefer brotli
    if (accept.includes('br') && fs.existsSync(filePath + '.br')) {
      res.setHeader('Content-Encoding', 'br');
      res.setHeader('Content-Type', ctype);
      fs.createReadStream(filePath + '.br').pipe(res);
      return;
    }
    if (accept.includes('gzip') && fs.existsSync(filePath + '.gz')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', ctype);
      fs.createReadStream(filePath + '.gz').pipe(res);
      return;
    }
    // fallback: send uncompressed
    res.setHeader('Content-Type', ctype);
    fs.createReadStream(filePath).pipe(res);
  });
}

try {
  precompressAll();
} catch (e) {
  console.warn('Precompression step failed or skipped:', e && e.message);
}

const server = createServer();
server.listen(PORT, () => {
  console.log(`Serving ${DIST} on http://localhost:${PORT}/ (precompressed if available)`);
});

