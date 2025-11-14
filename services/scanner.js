import { getGappers, getBars } from './polygon.js';
import { getEquity, getPositions, placeOrder } from './alpaca.js';
import { log } from '../utils/logger.js';
import { CONFIG } from '../config/config.js';
import pool from '../db/pool.js';

const PENDING = new Map();

export const scan = async () => {
  if (!isScanWindow()) return;
  cleanupPending();

  log('HEARTBEAT', '', 'Node v20.9.6');
  await dashboard('HEARTBEAT', { up: true, version: 'v20.9.6' });

  const equity = await getEquity();
  const positions = await getPositions();
  if (.positions.length >= CONFIG.MAX_POS) return;

  const tickers = await getGappers();
  if (!tickers.length) return;

  const symbols = tickers.map(t => t.sym);
  const barsMap = {};
  for (const sym of symbols) {
    barsMap[sym] = await getBars(sym);
  }

  const signals = [];
  for (const t of tickers.slice(0, 6)) {
    const sig = await generateSignal(t, barsMap);
    if (sig) signals.push(sig);
  }

  const slots = CONFIG.MAX_POS - positions.length;
  for (const sig of signals.slice(0, slots)) {
    if (PENDING.has(sig.symbol)) continue;
    PENDING.set(sig.symbol, Date.now() + 20 * 60 * 1000);
    await placeOrder(sig);
  }
};

const generateSignal = async (t, barsMap) => {
  const bars = barsMap[t.sym] || [];
  if (bars.length < 50) return null;

  const closes = bars.map(b => b.c);
  const vwap = calcVWAP(bars);
  const ema8 = ema(closes, 8);
  const ema15 = ema(closes, 15);
  const rsi = calcRSI(closes);
  const atr = calcATR(bars);

  const last = bars[bars.length - 1];
  if (last.c <= vwap || last.c <= ema8 || ema8 <= ema15 || rsi > CONFIG.RSI_MAX) return null;

  const entry = parseFloat(last.c.toFixed(2));
  const stop = parseFloat((entry * (1 - CONFIG.STOP_PCT)).toFixed(2));
  const target = parseFloat((entry + CONFIG.ATR_MULT * atr).toFixed(2));
  const qty = Math.max(1, Math.floor((equity * CONFIG.RISK_PCT) / (entry * CONFIG.STOP_PCT)));

  return { symbol: t.sym, price: entry, stop, target, qty };
};

// Indicators
const calcVWAP = (bars) => {
  let vp = 0, vol = 0;
  for (const b of bars) { const typ = (b.h + b.l + b.c) / 3; vp += typ * b.v; vol += b.v; }
  return vol ? vp / vol : bars[bars.length-1].c;
};

const ema = (values, period) => {
  if (values.length < period) return values[values.length-1];
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
};

const calcRSI = (prices, period = 14) => {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[prices.length - i] - prices[prices.length - i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const rs = gains / (Math.abs(losses) || 0.0001);
  return 100 - (100 / (1 + rs));
};

const calcATR = (bars, period = 14) => {
  if (bars.length < period + 1) return 0.5;
  let sum = 0;
  for (let i = 1; i <= period; i++) {
    const prev = bars[bars.length - i - 1], curr = bars[bars.length - i];
    sum += Math.max(curr.h - curr.l, Math.abs(curr.h - prev.c), Math.abs(curr.l - prev.c));
  }
  return sum / period;
};

const isScanWindow = () => {
  const now = new Date();
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const h = ny.getHours() + ny.getMinutes() / 60;
  return h >= CONFIG.SCAN_WINDOW.start && h < CONFIG.SCAN_WINDOW.end;
};

const cleanupPending = () => {
  const now = Date.now();
  for (const [sym, exp] of PENDING) if (now > exp) PENDING.delete(sym);
};
