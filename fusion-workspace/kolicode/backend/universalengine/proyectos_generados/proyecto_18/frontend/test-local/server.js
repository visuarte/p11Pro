// simple websocket chat + command server
// Usage: npm install && node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.PORT || 5175;
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = path.join(LOG_DIR, 'console.log');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Kotguai websocket server\n');
});

const wss = new WebSocket.Server({ server });

function broadcast(obj, wsExclude) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN && c !== wsExclude) c.send(msg);
  });
}

function persistLog(line) {
  const ts = new Date().toISOString();
  fs.appendFile(LOG_FILE, `[${ts}] ${line}\n`, (err) => { if (err) console.error('log write error', err); });
}

wss.on('connection', (ws, req) => {
  ws._meta = { id: Math.random().toString(36).slice(2,9) };
  console.log('client connected', ws._meta.id);

  ws.on('message', (raw) => {
    let data = null;
    try { data = JSON.parse(raw); } catch (e) { console.warn('invalid json', raw.toString()); return; }
    if (!data || !data.type) return;
    switch (data.type) {
      case 'chat': {
        // broadcast chat message to all
        const out = { type: 'chat', user: data.user||'anon', text: data.text||'', ts: Date.now(), id: ws._meta.id };
        broadcast(out);
        break;
      }
      case 'cmd': {
        // persist command and broadcast
        const out = { type: 'cmd', user: data.user||'anon', cmd: data.cmd||'', ts: Date.now(), id: ws._meta.id };
        persistLog(`${out.user}: ${out.cmd}`);
        broadcast(out);
        break;
      }
      case 'log': {
        // client-sent log lines to persist
        const out = { type: 'log', text: data.text||'', ts: Date.now(), user: data.user||'anon' };
        persistLog(`${out.user}: ${out.text}`);
        broadcast(out);
        break;
      }
      default:
        console.warn('unknown type', data.type);
    }
  });

  ws.on('close', () => { console.log('client disconnected', ws._meta.id); });
});

server.listen(PORT, () => {
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
  console.log('Log file:', LOG_FILE);
});

