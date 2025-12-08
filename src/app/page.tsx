// AlphaStream v506 — FINAL — EASTERN TIME LOGS + FULL DASHBOARD
import express from "express";
import cors from "cors";
import axios from "axios";
import { spawn } from "child_process";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 8080;
const FINNHUB_KEY = process.env.FINNHUB_KEY;
if (!FINNHUB_KEY) throw "FINNHUB_KEY REQUIRED";

let brain = {
  minConfidence: 0.87,
  maxPositions: 3,
  riskPct: 0.015,
  tpMultiplier: 1.28,
  slMultiplier: 0.89,
  dailyLossLimit: 0.039,
  requireML: true,
  minPrice: 6,
  maxPrice: 95,
  minVolume: 1_500_000
};

let positions = [];
let logs = [];
let lastRockets = [];
let trades = [];
let accountEquity = 100000;
let dailyPnL = 0;
let lastResetDay = new Date().getDate();

// MULTI-ACCOUNT
const RAW_KEYS = process.env.ALPACA_KEYS || "";
const KEYS_LIST = RAW_KEYS.split(",").map(s => s.trim()).filter(s => s.includes(":"));
let accounts = KEYS_LIST.length > 0
  ? KEYS_LIST.map((pair, i) => {
      const [key, secret] = pair.split(":").map(s => s.trim());
      return { name: `Funded-${i + 1}`, key, secret, isPaper: false, equity: 100000 };
    })
  : [{ name: "Default", key: process.env.ALPACA_KEY?.trim() || "", secret: process.env.ALPACA_SECRET?.trim() || "", isPaper: true, equity: 100000 }];

async function getBestAccount() {
  let best = accounts[0];
  for (const acc of accounts) {
    if (!acc.key) continue;
    try {
      const url = acc.isPaper ? "https://paper-api.alpaca.markets/v2/account" : "https://api.alpaca.markets/v2/account";
      const { data } = await axios.get(url, { 
        headers: { "APCA-API-KEY-ID": acc.key, "APCA-API-SECRET-KEY": acc.secret }, 
        timeout: 8000 
      });
      const equity = parseFloat(data.equity || data.cash || 100000);
      if (equity > (best.equity || 0)) {
        best = { ...acc, equity };
        accountEquity = equity;
      }
    } catch (e) {}
  }
  return best;
}

async function placeOrder(sym, qty, side = "buy") {
  const acc = await getBestAccount();
  try {
    const quote = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${FINNHUB_KEY}`);
    const price = side === "buy" ? (quote.data.c * 1.007).toFixed(2) : (quote.data.c * 0.993).toFixed(2);
    await axios.post(acc.isPaper ? "https://paper-api.alpaca.markets/v2/orders" : "https://api.alpaca.markets/v2/orders", {
      symbol: sym, qty, side, type: "limit", limit_price: price, time_in_force: "day"
    }, { headers: { "APCA-API-KEY-ID": acc.key, "APCA-API-SECRET-KEY": acc.secret } });
    log(`EXECUTED [${acc.name}] ${side.toUpperCase()} ${sym} ×${qty} @ ${price}`);
    return true;
  } catch (e) {
    log(`FAILED ${sym}: ${e.response?.data?.message || e.message}`);
    return false;
  }
}

// EASTERN TIME LOGS — AUTO EDT/EST
function log(msg) {
  const eastern = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).replace(/\//g, "-");

  const line = `[${eastern}] ${msg}`;
  console.log("\x1b[32m%s\x1b[0m", line);
  logs.push(line);
  if (logs.length > 500) logs.shift();
}

async function executeScan() {
  log("SCAN STARTED");
  const estHour = parseInt(new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: "2-digit", hour12: false }));
  const estMin = new Date().getMinutes();
  if (estHour < 9 || (estHour === 9 && estMin < 45) || estHour >= 16) return;

  try {
    const { data } = await axios.get(`https://finnhub.io/api/v1/stock/actives?token=${FINNHUB_KEY}`);
    const candidates = (data?.mostActiveStock || [])
      .filter(s => s.change > 8 && s.price >= brain.minPrice && s.price <= brain.maxPrice && s.volume >= brain.minVolume)
      .slice(0, 15);

    for (const c of candidates) {
      if (positions.length >= brain.maxPositions) break;
      if (positions.some(p => p.symbol === c.symbol)) continue;

      const news = await axios.get(`https://finnhub.io/api/v1/company-news?symbol=${c.symbol}&from=${new Date().toISOString().split("T")[0]}&to=${new Date().toISOString().split("T")[0]}&token=${FINNHUB_KEY}`).catch(() => ({data:[]}));
      if (news.data.some(n => /halt|delist|bankrupt|FDA rejection|offering/i.test(n.headline))) continue;

      const pred = await axios.post("http://127.0.0.1:8081/predict", {
        features: Array(28).fill(0).map((_, i) => i === 0 ? c.change : i === 1 ? c.volume/1e6 : i === 2 ? c.price : 0)
      }).catch(() => ({data: {threshold_met: false}}));

      if (!pred.data.threshold_met || pred.data.probability < brain.minConfidence) continue;

      const qty = Math.max(1, Math.floor(accountEquity * brain.riskPct / c.price));
      if (await placeOrder(c.symbol, qty)) {
        positions.push({ symbol: c.symbol, qty, entry: c.price, current: c.price, tp: c.price * brain.tpMultiplier, sl: c.price * brain.slMultiplier });
        lastRockets.unshift(`${c.symbol} +${c.change.toFixed(1)}%`);
        log(`ROCKET ${c.symbol} ×${qty} | ${(pred.data.probability*100).toFixed(1)}% CONFIDENCE`);
      }
    }
  } catch (e) {
    log("SCAN ERROR: " + e.message);
  }

  setTimeout(executeScan, 60000 + Math.random() * 60000);
}

// FULL DASHBOARD ENDPOINT
app.get("/", async (req, res) => {
  try {
    const acc = await getBestAccount();
    const unreal = positions.reduce((sum, p) => sum + (p.current - p.entry) * p.qty, 0);
    const winRate = trades.length > 0 
      ? ((trades.filter(t => t.pnl > 0).length / trades.length) * 100).toFixed(1)
      : "0.0";

    res.json({
      equity: `$${Math.round(accountEquity).toLocaleString()}`,
      unrealized: unreal >= 0 ? `+$${Math.round(unreal).toLocaleString()}` : `-$${Math.round(Math.abs(unreal)).toLocaleString()}`,
      positions: positions.length,
      mode: acc.isPaper ? "PAPER" : "LIVE",
      activeAccount: acc.name,
      rockets: lastRockets,
      logs: logs.slice(-70),
      winRate: `${winRate}%`,
      totalTrades: trades.length,
      brain: brain,
      positionsData: positions
    });
  } catch (e) {
    res.json({ equity: "$0", unrealized: "+$0", mode: "WARMING", logs: ["Starting..."] });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.post("/scan", async (req, res) => { 
  log("FORCE SCAN FROM DASHBOARD");
  await executeScan(); 
  res.json({ ok: true }); 
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\nALPHASTREAM v506 — FINAL — LIVE ON ${PORT}`);
  log("EASTERN TIME LOGS ENABLED — DASHBOARD CONNECTED");
  spawn("uvicorn", ["predictor.main:app", "--host", "0.0.0.0", "--port", "8081"], { stdio: "inherit" }).unref();
  setTimeout(executeScan, 15000);
});
