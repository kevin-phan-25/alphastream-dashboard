import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

let scanner = [];
let trades = [];
let stats = { winRate: 0, pnl: 0, mode: 'COLD' };

const wss = new WebSocketServer({ noServer: true });

function broadcast(type, data) {
  const payload = JSON.stringify({ type, data, timestamp: new Date() });
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
}

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'INIT', scanner, trades, stats }));
});

app.post('/webhook', (req, res) => {
  const { type, data } = req.body;
  if (type === 'SCANNER') scanner = data;
  if (type === 'TRADE') trades = [data, ...trades].slice(0, 20);
  if (type === 'STATS') stats = { ...stats, ...data };
  broadcast(type, data);
  res.sendStatus(200);
});

app.get('/chart/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const apiKey = process.env.POLYGON_KEY;
  if (!apiKey) return res.status(500).json({ error: 'POLYGON_KEY missing' });

  const today = new Date().toISOString().split('T')[0];
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/minute/${today}/${today}?adjusted=true&limit=500&apiKey=${apiKey}`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Polygon ${resp.status}`);
    const json = await resp.json();
    const bars = (json.results || []).map(r => ({
      t: new Date(r.t),
      o: r.o, h: r.h, l: r.l, c: r.c, v: r.v
    }));
    res.json(bars);
  } catch (e) {
    console.error('Chart error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const server = createServer(app);
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`ALPHASTREAM v5.9 LIVE → ${PORT}`));
