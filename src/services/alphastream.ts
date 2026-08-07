/**
 * AlphaStream shared frontend types
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
// LOGS
// ======================================================

export interface AlphaStreamLog {
  id?: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
}

export interface AlphaStreamLogs {
  logs: string[];
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
}

export type AlphaStreamPosition = Position;
