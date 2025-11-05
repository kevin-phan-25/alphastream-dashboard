require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let scanner = [], trades = [], stats = { winRate: 0, pnl: 0, mode: 'COLD' };
const wss = new WebSocket.Server({ noServer: true });

function broadcast(type, data) {
  const payload = JSON.stringify({ type, data, timestamp: new Date() });
  wss.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(payload));
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
  const key = process.env.POLYGON_KEY;
  if (!key) return res.json([]);
  const today = new Date().toISOString().split('T')[0];
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/minute/${today}/${today}?adjusted=true&limit=500&apiKey=${key}`;
  try {
    const r = await fetch(url);
    const j = await r.json();
    const bars = j.results?.map(b => ({ t: new Date(b.t), o: b.o, h: b.h, l: b.l, c: b.c, v: b.v })) || [];
    res.json(bars);
  } catch (e) {
    res.json([]);
  }
});

app.use(express.static('public'));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const server = http.createServer(app);
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Dashboard LIVE on port ${PORT}`));
