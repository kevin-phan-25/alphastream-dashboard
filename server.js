// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// === LIVE DATA STORE ===
let scanner = [];
let trades = [];
let positions = [];
let stats = { winRate: 0, pnl: 0, mode: 'COLD', lastUpdate: new Date() };

// === BROADCAST TO ALL CLIENTS ===
function broadcast(type, data) {
  const payload = JSON.stringify({ type, data, timestamp: new Date() });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}

// === WEBSOCKET CONNECTION ===
wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'INIT', scanner, trades, positions, stats }));
});

// === WEBHOOK FROM GOOGLE APPS SCRIPT ===
app.post('/webhook', express.json(), (req, res) => {
  const { type, data } = req.body;
  console.log(`[WEBHOOK] ${type}:`, data);

  if (type === 'SCANNER') scanner = data;
  if (type === 'TRADE') trades = [data, ...trades].slice(0, 20);
  if (type === 'POSITION') positions = data;
  if (type === 'STATS') stats = { ...stats, ...data, lastUpdate: new Date() };

  broadcast(type, data);
  res.sendStatus(200);
});

// === CHART DATA API (Polygon.io) ===
app.get('/chart/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const today = new Date().toISOString().split('T')[0];
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/minute/${today}/${today}?adjusted=true&https://github.com/kevin-phan-25/alphastream-dashboard/tree/mainlimit=500&apiKey=${process.env.POLYGON_KEY}`;

  try {
    const resp = await fetch(url);
    const json = await resp.json();
    const bars = json.results.map(r => ({
      t: new Date(r.t),
      o: r.o, h: r.h, l: r.l, c: r.c, v: r.v
    }));
    res.json(bars);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === SERVE DASHBOARD ===
app.use(express.static('public'));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`ALPHASTREAM DASHBOARD LIVE → http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});
