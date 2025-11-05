require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let scanner = [];
let trades = [];
let stats = { winRate: 0, pnl: 0, mode: 'COLD', lastUpdate: new Date() };

function broadcast(type, data) {
  const payload = JSON.stringify({ type, data, timestamp: new Date() });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'INIT', scanner, trades, stats }));
});

app.post('/webhook', (req, res) => {
  const { type, data } = req.body;
  console.log(`[WEBHOOK] ${type}:`, data);
  if (type === 'SCANNER') scanner = data;
  if (type === 'TRADE') trades = [data, ...trades].slice(0, 20);
  if (type === 'STATS') stats = { ...stats, ...data };
  broadcast(type, data);
  res.sendStatus(200);
});

app.get('/chart/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const today = new Date().toISOString().split('T')[0];
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/minute/${today}/${today}?adjusted=true&limit=500&apiKey=${process.env.POLYGON_KEY}`;
  try {
    const resp = await fetch(url);
    const json = await resp.json();
    const bars = json.results?.map(r => ({
      t: new Date(r.t),
      o: r.o, h: r.h, l: r.l, c: r.c, v: r.v
    })) || [];
    res.json(bars);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`DASHBOARD LIVE on port ${PORT}`));
