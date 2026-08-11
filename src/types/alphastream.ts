/**
 * Date: 2026-08-11
 * File: src/types/alphastream.ts
 *
 * Changes:
 * - Expanded ML status (bootComplete, lastLoad/Save/Train)
 * - Core status now carries nested `ml` block
 * - Added MLTrainingLogEntry for training activity view
 * - Dashboard compatibility fields kept
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
// ML (nested inside Core status + standalone /ml/status)
// ======================================================
export interface AlphaStreamMLStatus {
  ok: boolean;
  version?: string;
  entryBufferSize: number;
  exitBufferSize: number;
  totalExperiences: number;
  trainingEnabled: boolean;
  bootComplete?: boolean;
  lastLoad?: string | null;
  lastSave?: string | null;
  lastTrain?: string | null;
  timestamp?: string;
  error?: string;
}

export interface AlphaStreamMLHealth {
  status: string;
  service: string;
}

/** Result of a single "Start Training" call (client-side history) */
export interface MLTrainingLogEntry {
  id: string;
  timestamp: string;
  ok: boolean;
  trained: boolean;
  message: string;
  steps?: number;
  epochs?: number;
  avgLoss?: number | null;
  elapsedSec?: number;
  entryBufferSize?: number;
  exitBufferSize?: number;
  totalExperiences?: number;
  error?: string;
  reason?: string;
}

// ======================================================
// STATUS (Core)
// ======================================================
export interface AlphaStreamStatus {
  ok: boolean;
  equity: number;
  peakEquity: number;
  drawdown: number;
  drawdownPct?: number;
  positionsCount: number;
  /** Compatibility alias */
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
  timestamp?: string;

  /** Nested ML snapshot returned by Core /status */
  ml?: AlphaStreamMLStatus;
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
  side: "BUY" | "SELL" | "buy" | "sell" | "long" | "short";
  qty: number;
  price: number;
  timestamp: string;
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
  side?: "long" | "short";
  avgEntryPrice?: number;
  entry?: number;
  marketValue?: number;
  unrealizedPnl?: number;
  unrealizedPL?: number;
  unrealizedPLPercent?: number;
}

export type AlphaStreamPosition = Position;

export interface AlphaStreamPositions {
  positions: AlphaStreamPosition[];
}
