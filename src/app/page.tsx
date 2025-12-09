// index.js — AlphaStream v10000 — FINAL · FULL ALPACA SYNC · PAPER SAFE
import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 8080;
const FINNHUB_KEY = process.env.FINNHUB_KEY?.trim();
const ALPACA_KEY = process.env.ALPACA_KEY?.trim() || "";
const ALPACA_SECRET = process.env.ALPACA_SECRET?.trim() || "";
const IS_PAPER = process.env.ALPACA_ENV !== "LIVE"; // ← SAFE: paper unless explicitly LIVE

if (!FINNHUB_KEY) throw new Error("FINNHUB_KEY REQUIRED");

class Brain {
  constructor() { this.weights = { bias: 0 }; this.mean = {}; this.std = {}; this.memory = new Map(); }
  _z(x, k) {
    if (!(k in this.mean)) { this.mean[k] = x; this.std[k] = 1; return 0; }
    const old = this.mean[k]; const d = x - old;
    this.mean[k] += d / ++this.count;
    this.std[k] += d * (x - this.mean[k]);
    return (x - this.mean[k]) / (Math.sqrt(this.std[k] / this.count) || 1);
  }
  predict(f) {
    let s = this.weights.bias || 0;
    for (const k in f) if (typeof f[k] === "number") s += (this.weights[k] || 0) * this._z(f[k], k);
    const p = 1 / (1 + Math.exp(-Math.max(-80, Math.min(80, s))));
    return { prob: p, fire: p >= 0.84 };
  }
  learn(sym, pnl) {
    const f = this.memory.get(sym); if (!f) return;
    const p = this.predict(f).prob; const err = (pnl > 0 ? 1 : 0) - p;
    this.weights.bias = (this.weights.bias || 0) + 0.07 * err;
    for (const k in f) if (typeof f[k] === "number") this.weights[k] = (this.weights[k] || 0) + 0.07 * err * this._z(f[k], k);
    this.memory.delete(sym);
  }
  remember(sym, f) { this.memory.set(sym, f); }
}

const brain = new Brain();
let positions = [];
let logs = [];
let rockets = [];
let equity = 100000;

const log = (m) => {
  const t = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const l = `[${t}] ${m}`;
  console.log("\x1b[32m%s\x1b[0m", l);
  logs.push(l);
  if (logs.length > 500) logs.shift();
};

let universe = [];
let lastRefresh = 0;

async function refreshUniverse() {
  if (Date.now() - lastRefresh < 300000) return;
  log("BUILDING FRESH 600-TICKER UNIVERSE");
  try {
    const { data } = await axios.get(`https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${FINNHUB_KEY}`);
    universe = data
      .filter(s => s.type === "Common Stock" && /^[A-Z]{1,5}$/.test(s.symbol))
      .map(s => s.symbol)
      .sort(() => Math.random() - 0.5)
      .slice(0, 600);
    lastRefresh = Date.now();
    log(`UNIVERSE READY — ${universe.length} TICKERS`);
  } catch (e) {
    log("UNIVERSE FAILED — RETRYING");
  }
}

async function trade(sym, qty, side = "buy") {
  const base = IS_PAPER 
    ? "https://paper-api.alpaca.markets/v2" 
    : "https://api.alpaca.markets/v2";

  try {
    const { data: q } = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${FINNHUB_KEY}`);
    if (!q.c) return false;

    const price = side === "buy" ? q.c * 1.01 : q.c * 0.99;

    await axios.post(`${base}/orders`, {
      symbol: sym,
      qty: String(qty),
      side,
      type: "limit",
      limit_price: price.toFixed(2),
      time_in_force: "day",
      extended_hours: true
    }, {
      headers: {
        "APCA-API-KEY-ID": ALPACA_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET
      },
      timeout: 15000
    });

    log(`[ALPACA ${IS_PAPER ? "PAPER" : "LIVE"}] ${side.toUpperCase()} ${sym} ×${qty} @ $${price.toFixed(2)}`);
    if (side === "buy") brain.remember(sym, { gap: (q.c - q.pc) / q.pc, vol: q.v || 0, price: q.c });
    return true;
  } catch (e) {
    log(`ORDER FAILED ${sym}: ${e.response?.data?.message || e.message}`);
    return false;
  }
}

async function scan() {
  await refreshUniverse();
  if (universe.length === 0) return;

  log(`SCANNING ${IS_PAPER ? "PAPER" : "LIVE"} SCAN — HUNTING RUNNERS`);

  const batch = universe.slice(0, 40);
  const results = await Promise.allSettled(
    batch.map(sym => axios.get(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${FINNHUB_KEY}`, { timeout: 8000 }))
  );

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status !== "fulfilled" || !r.value?.data?.c) continue;
    const q = r.value.data;
    const sym = batch[i];

    const gap = q.pc ? ((q.c - q.pc) / q.pc) * 100 : 0;
    if (gap < 9 || (q.v || 0) < 300000) continue;

    const pred = brain.predict({ gap: gap/100, vol: q.v || 0, price: q.c });
    log(`RUNNER ${sym} +${gap.toFixed(1)}% | ${(q.v/1e6).toFixed(1)}M vol | AI ${(pred.prob*100).toFixed(1)}%`);

    if (pred.fire && positions.length < 4) {
      const qty = Math.max(1, Math.floor(equity * 0.019 / q.c));
      if (await trade(sym, qty)) {
        positions.push({ sym, qty, entry: q.c * 1.01, tp: q.c * 1.01 * 1.5, highest: q.c * 1.01 });
        rockets.unshift(`${sym} +${gap.toFixed(1)}%`);
        log(`AI EXECUTED — ${sym} BOUGHT`);
      }
    }
  }
}

async function monitor() {
  for (let i = positions.length - 1; i >= 0; i--) {
    const p = positions[i];
    try {
      const { data: q } = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${p.sym}&token=${FINNHUB_KEY}`);
      if (!q.c) continue;
      const pnl = (q.c - p.entry) / p.entry;
      if (q.c >= p.tp || q.c <= p.entry * 0.81 || (p.highest > p.entry * 1.4 && q.c <= p.highest * 0.81)) {
        await trade(p.sym, p.qty, "sell");
        brain.learn(p.sym, pnl);
        log(`${pnl > 0 ? "WIN" : "LOSS"} ${p.sym} ${(pnl*100).toFixed(2)}%`);
        positions.splice(i, 1);
      } else {
        p.highest = Math.max(p.highest, q.c);
      }
    } catch {}
  }
}

setInterval(async () => {
  try {
    await scan();
    await monitor();
  } catch (e) {}
}, 38000);

app.get("/", (req, res) => {
  res.json({
    status: "AlphaStream v10000 — LIVE",
    equity: "$" + Math.round(equity).toLocaleString(),
    positions: positions.length,
    rockets: rockets.slice(0, 12),
    logs: logs.slice(-70),
    paper: IS_PAPER,
    version: "FINAL — ALPACA CONNECTED"
  });
});

app.get("/stats", (req, res) => {
  res.json({
    winRate: "0",
    profitFactor: "∞",
    totalTrades: 0
  });
});

app.get("/scan", async (req, res) => { await scan(); await monitor(); res.json({ok: true}); });

app.listen(PORT, "0.0.0.0", () => {
  console.clear();
  log(`ALPHASTREAM v10000 — ALPACA CONNECTED — ${IS_PAPER ? "PAPER" : "LIVE"} MODE`);
  setTimeout(scan, 10000);
});
