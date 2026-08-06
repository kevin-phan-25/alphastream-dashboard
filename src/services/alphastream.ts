/**
 * ======================================================
 * File:
 * src/types/alphastream.ts
 *
 * Description:
 * AlphaStream Dashboard API Types
 *
 * Changes:
 * - Added missing API response types
 * - Matches Go core JSON responses
 * - Supports Cloudflare dashboard build
 * ======================================================
 */


// ======================================================
// HEALTH
// ======================================================

export interface AlphaStreamHealth {
  status: string;
  service: string;
  time?: string;
}


// ======================================================
// STATUS
// ======================================================

export interface AlphaStreamStatus {

  ok: boolean;

  equity: number;

  peakEquity: number;

  buyingPower: number;

  positions: number;

  positionsCount: number;

  hardFlat: boolean;

  degraded: boolean;

  winRate: number;

  drawdownPct: number;

  totalTrades: number;

  lastMag7Sentiment?: number;

  version: string;

}



// ======================================================
// METRICS
// ======================================================

export interface AlphaStreamMetrics {

  equity: number;

  positions: number;

  drawdownPct: number;

  winRate: number;

  totalTrades: number;

}



// ======================================================
// POSITIONS
// ======================================================

export interface AlphaStreamPosition {

  symbol: string;

  qty: number;

  avgEntryPrice?: number;

  marketValue?: number;

  unrealizedPL?: number;

  unrealizedPLPercent?: number;

}



// ======================================================
// TRADES
// ======================================================

export interface AlphaStreamTrade {

  symbol?: string;

  side?: string;

  qty?: number;

  price?: number;

  timestamp?: string;

}


export interface AlphaStreamTrades {

  trades: AlphaStreamTrade[];

}



// ======================================================
// LOGS
// ======================================================

export interface AlphaStreamLogs {

  logs: string[];

}
