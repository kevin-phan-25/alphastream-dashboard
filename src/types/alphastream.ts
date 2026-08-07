/**
 * Date: 2026-08-07
 * File: src/types/alphastream.ts
 *
 * Changes:
 *  - Added ML service types
 *  - Added dashboard compatibility fields
 *  - Added position/trade aliases for Core API responses
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

  /**
   * Compatibility alias
   */
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

  side: "BUY" | "SELL" | "buy" | "sell";

  qty: number;

  price: number;

  timestamp: string;

  /**
   * Compatibility fields
   */
  pnl?: number;

  PnL?: number;

  exitReason?: string;

  ExitReason?: string;
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

  /**
   * Position direction.
   * AlphaStream is currently long-only.
   */
  side?: "long" | "short";

  /**
   * Entry price compatibility
   */
  avgEntryPrice?: number;

  entry?: number;

  /**
   * Current valuation
   */
  marketValue?: number;

  /**
   * Unrealized profit/loss
   */
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
