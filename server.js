require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let scanner = [];
let trades = [];
let stats = { winRate: 0, pnl: 0, mode: 'COLD' };

const wss = new WebSocket.Server({ noServer: true });

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
  if (type === 'SCANNER') scanner = data;
  if (type === 'TRADE') trades = [data, ...trades].slice(0, 20);
  if (type === 'STATS') stats = { ...stats, ...data };
  broadcast(type, data);
  res.sendStatus(200);
});

app.get('/chart/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const apiKey = process.env.POLYGON_KEY;
  if (!apiKey) return res.json([]); // Fallback empty

  const today = new Date().toISOString().split('T')[0];
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/minute/${today}/${today}?adjusted=true&limit=500&apiKey=${apiKey}`;
  try {
    const resp = await fetch(url);
    const json = await resp.json();
    const bars = json.results?.map(r => ({
      t: new Date(r.t),
      o: r.o, h: r.h, l: r.l, c: r.c, v: r.v
    })) || [];
    res.json(bars);
  } catch (e) {
    res.json([]);
  }
});

app.use(express.static('public'));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const server = http.createServer(app);
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, ws => {
    wss.emit('connection', ws, request);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`LIVE on ${PORT}`));
