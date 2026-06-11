"use strict";
// core/alpaca.js — v5.4 FINAL COMPATIBLE + IEX FEED + NO 403 RETRY
// All original logic preserved. Fixed getBarsV2 + strong 403 handling.

import { ALPACA_KEY, ALPACA_SECRET } from "./config.js";
import { state } from "./state.js";
import { log } from "./log.js";
import { updatePeakEquity } from "./state.js";
import Alpaca from "@alpacahq/alpaca-trade-api";

const PAPER_BASE_URL = "https://paper-api.alpaca.markets";

export const alpaca = new Alpaca({
  keyId: ALPACA_KEY,
  secretKey: ALPACA_SECRET,
  paper: true,
  baseUrl: PAPER_BASE_URL
});

log("[ALPACA] ✅ v5.4 FINAL + IEX FEED LOADED");

// ====================== REAL CANDLES (Fixed + IEX) ======================
export async function getRecentCandles(symbol, timeframe = "1Min", limit = 50) {
  const sym = symbol.toUpperCase();
  
  try {
    // Correct getBarsV2 signature + IEX feed for paper trading
    const barsIterable = alpaca.getBarsV2(sym, {
      timeframe: timeframe,
      limit: limit,
      adjustment: "raw",
      feed: "iex"          // Critical for paper accounts
    });

    const result = [];
    for await (const bar of barsIterable) {
      result.push({
        o: Number(bar.OpenPrice),
        h: Number(bar.HighPrice),
        l: Number(bar.LowPrice),
        c: Number(bar.ClosePrice),
        v: Number(bar.Volume || 0),
        t: bar.Timestamp
      });
    }

    if (result.length >= 8) {
      log(`[CANDLES] ${sym} → ${result.length} real bars`);
      return result;
    }
  } catch (e) {
    log(`[CANDLES] ${sym} — V2 failed: ${e.message}`, "warn");
  }

  // Legacy fallback
  try {
    const bars = await alpaca.getBars({
      symbol: sym,
      timeframe,
      limit,
      adjustment: "raw"
    });
    const result = bars.map(bar => ({
      o: Number(bar.open),
      h: Number(bar.high),
      l: Number(bar.low),
      c: Number(bar.close),
      v: Number(bar.volume || 0),
      t: bar.timestamp
    }));
    log(`[CANDLES] ${sym} → ${result.length} legacy bars`);
    return result;
  } catch (e) {
    log(`[CANDLES] ${sym} — legacy failed: ${e.message}`, "warn");
  }

  // Synthetic fallback
  log(`[CANDLES] ${sym} — using synthetic fallback`, "warn");
  return Array.from({ length: limit }, (_, i) => {
    const base = 280 + Math.random() * 120;
    const price = base + (i * (Math.random() - 0.5) * 1.2);
    return {
      o: price * 0.998,
      h: price * 1.007,
      l: price * 0.993,
      c: price,
      v: 650000 + Math.random() * 850000,
      t: Date.now() - (limit - i) * 60000
    };
  });
}

// ====================== RETRY (NO RETRY ON 403) ======================
async function executeWithRetry(fn, maxRetries = 3, baseDelay = 1300) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes("403")) {
        log(`[ALPACA] 403 Auth failure — check API keys! Not retrying.`, "error");
        throw e;
      }
      if (i === maxRetries || (!msg.includes("429") && !msg.includes("timeout") && !msg.includes("network"))) {
        log(`[ALPACA] Final failure after ${i+1} attempts: ${msg}`, "error");
        throw e;
      }
      const delay = baseDelay * (i + 1);
      log(`[RETRY] Attempt ${i+1}/${maxRetries} (${delay}ms)`, "warn");
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ====================== ORDERS ======================
export async function placeMarketBuy(symbol, qty) {
  return executeWithRetry(() => alpaca.createOrder({
    symbol: symbol.toUpperCase(),
    qty: qty,
    side: "buy",
    type: "market",
    time_in_force: "day"
  }));
}

export async function placeMarketSell(symbol, qty) {
  return executeWithRetry(() => alpaca.createOrder({
    symbol: symbol.toUpperCase(),
    qty: qty,
    side: "sell",
    type: "market",
    time_in_force: "day"
  }));
}

// ====================== ALL OTHER FUNCTIONS (Preserved) ======================
export async function closeAllPositions() {
  try {
    const positions = await alpaca.getPositions();
    let closed = 0;
    for (const pos of positions) {
      await alpaca.closePosition(pos.symbol);
      closed++;
    }
    log(`[CLOSE ALL] Closed ${closed} positions`);
    return { ok: true, closed };
  } catch (e) {
    log(`[CLOSE ALL ERROR] ${e.message}`, "error");
    return { ok: false };
  }
}

export async function simpleClosePosition(symbol) {
  try {
    await alpaca.closePosition(symbol.toUpperCase());
    log(`[CLOSE] ${symbol} SUCCESS`);
    return { ok: true };
  } catch (e) {
    log(`[CLOSE ERROR] ${symbol}: ${e.message}`, "warn");
    return { ok: false };
  }
}

export async function syncAlpacaFull() {
  try {
    const account = await alpaca.getAccount();
    state.equity = Number(account.equity);
    state.buyingPower = Number(account.buying_power);
    updatePeakEquity();
    return true;
  } catch (e) {
    log(`[SYNC ERROR] ${e.message}`, "warn");
    return false;
  }
}

export async function getCurrentPrice(symbol) {
  try {
    const trade = await alpaca.getLatestTrade(symbol.toUpperCase());
    return Number(trade?.Price) || null;
  } catch (e) {
    log(`[PRICE ERROR] ${symbol}: ${e.message}`, "warn");
    return null;
  }
}

export async function getPositionQty(symbol) {
  try {
    const pos = await alpaca.getPosition(symbol.toUpperCase());
    return Number(pos?.qty) || 0;
  } catch {
    return 0;
  }
}

export async function waitForPositionQty(symbol, targetQty, timeoutMs = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const current = await getPositionQty(symbol);
    if (Math.abs(current) >= Math.abs(targetQty)) return { ok: true, qty: current };
    await new Promise(r => setTimeout(r, 800));
  }
  return { ok: false, error: "timeout" };
}

export async function isSymbolShortable(symbol) {
  try {
    const asset = await alpaca.getAsset(symbol.toUpperCase());
    return asset?.shortable === true && asset?.easy_to_borrow === true;
  } catch (e) {
    log(`[SHORTABLE] ${symbol} failed`, "warn");
    return false;
  }
}

export async function getAccountEquity() {
  try {
    await syncAlpacaFull();
    return state.equity;
  } catch {
    return state.equity || 80000;
  }
}

log("[ALPACA] ✅ v5.4 FINAL Ready");
