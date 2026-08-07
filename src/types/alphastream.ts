/**
 * Date: 2026-08-07
 * File: src/types/alphastream.ts
 *
 * Changes:
 * - Added ML service types
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
  drawdown: number;
  drawdownPct?: number;
  positionsCount: number;
  positions?: number;
  hardFlat: boolean;
  tradingEnabled?: boolean;
  winRate?: number;
  lastScan?: string;
  uptime?: string | number;
  message?: string;
  buyingPower?: number;
  degraded?: boolean;
  totalTrades?: number;
  lastMag7Sentiment?: number;
  version?: string;
}

// ======================================================
// METRICS
// ======================================================
export interface AlphaStreamMetrics {
  equity: number;
  peakEquity?: number;
  positions: number;
  drawdown: number;
  drawdownPct?: number;
  winRate: number;
  totalTrades: number;
  buyingPower?: number;
}

// ======================================================
// LOGS
// ======================================================
export interface AlphaStreamLog {
  id?: string | number;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | string;
  message: string;
}

export interface AlphaStreamLogs {
  logs: AlphaStreamLog[] | string[];
}

// ======================================================
// TRADES
// ======================================================
export interface Trade {
  id?: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  timestamp: string;
}

export type AlphaStreamTrade = Trade;

export interface AlphaStreamTrades {
  trades: AlphaStreamTrade[];
}

// ======================================================
// POSITIONS
// ======================================================
export interface Position {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
  marketValue?: number;
  unrealizedPnl?: number;
  unrealizedPL?: number;
  unrealizedPLPercent?: number;
}

export type AlphaStreamPosition = Position;

export interface AlphaStreamPositions {
  positions: AlphaStreamPosition[];
}

// ======================================================
// ML SERVICE
// ======================================================
export interface AlphaStreamMLStatus {
  ok: boolean;
  version?: string;
  entryBufferSize: number;
  exitBufferSize: number;
  totalExperiences: number;
  trainingEnabled: boolean;
  timestamp?: string;
}

export interface AlphaStreamMLHealth {
  status: string;
  service: string;
}
