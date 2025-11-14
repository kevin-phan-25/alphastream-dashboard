import { getGappers, getBars } from './polygon.js';
import { getEquity, getPositions, placeOrder } from './alpaca.js';
import { log } from '../utils/logger.js';
import { CONFIG } from '../config/config.js';
import pool from '../db/pool.js';

const PENDING = new Map();

const calcVWAP = (bars) => {
  let vp = 0, vol = 0;
  for (const b of bars) { const typ = (b.h + b.l + b.c) / 3; vp += typ * b.v; vol += b.v; }
  return vol ? vp / vol : bars[bars.length-1].c;
};

const ema = (values, period) => {
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
};

const rsi = (prices) => {
  let gains = 0, losses = 0;
  for (let i = 1; i <= 14; i++) {
    const diff = prices[prices.length - i] - prices[prices.length - i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  return 100 - (100 / (1 + gains / (Math.abs(losses) || 0.0001)));
};

const atr = (bars) => {
  let sum = 0;
  for (let i = 1; i <= 14; i++) {
    const prev = bars[bars.length - i - 1], curr = bars[bars.length - i];
    sum += Math.max(curr.h - curr.l, Math.abs(curr.h - prev.c), Math.abs(curr.l - prev.c));
  }
  return sum / 14;
};

export const scan = async () => {
  const now = new Date();
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hour = ny.getHours() + ny.getMinutes() / 60;
  if (hour < CONFIG.SCAN_WINDOW.start || hour >= CONFIG.SCAN_WINDOW.end) return;

  await log('HEARTBEAT', '', 'v20.9.6');

  const equity = await getEquity();
  const positions = await getPositions();
  if (positions.length >= CONFIG.MAX_POS) return;

  const tickers = await getGappers();
  if (!tickers.length) return;

  const barsMap = {};
  for (const t of tickers) barsMap[t.sym] = await getBars(t.sym);

  const signals = [];
  for (const t of tickers.slice(0, 6)) {
    const bars = barsMap[t.sym] || [];
    if (bars.length < 50) continue;
    const closes = bars.map(b => b.c);
    const last = bars[bars.length - 1];
    if (last.c <= calcVWAP(bars) || ema(closes, 8) <= ema(closes, 15) || rsi(closes) > 70) continue;

    const entry = parseFloat(last.c.toFixed(2));
    const stop = parseFloat((entry * (1 - CONFIG.STOP_PCT)).toFixed(2));
    const target = parseFloat((entry + CONFIG.ATR_MULT * atr(bars)).toFixed(2));
    const qty = Math.max(1, Math.floor((equity * CONFIG.RISK_PCT) / (entry * CONFIG.STOP_PCT)));

    if (PENDING.has(t.sym)) continue;
    PENDING.set(t.sym, Date.now() + 20 * 60 * 1000);

    await placeOrder({ symbol: t.sym, price: entry, stop, target, qty });
    await pool.query('INSERT INTO trades (symbol, qty, entry_price, stop_price, target_price) VALUES ($1,$2,$3,$4,$5)', [t.sym, qty, entry, stop, target]);
  }
};
