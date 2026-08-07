/**
 * AlphaStream shared frontend types
 */

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
  /** compatibility alias */
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
  id?: string;

  timestamp: string;

  level: "INFO" | "WARN" | "ERROR";

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

/** Alias used throughout dashboard */
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

/** Alias used throughout dashboard */
export type AlphaStreamPosition = Position;
