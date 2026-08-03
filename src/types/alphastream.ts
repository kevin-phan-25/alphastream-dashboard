/**
 * AlphaStream shared frontend types
 */

export interface AlphaStreamStatus {
  ok: boolean;

  equity: number;
  peakEquity: number;

  drawdown: number;
  drawdownPct?: number;

  positionsCount: number;
  /** optional compat alias */
  positions?: number;

  hardFlat: boolean;

  tradingEnabled?: boolean;

  winRate?: number;

  lastScan?: string;

  uptime?: string | number;

  message?: string;
}

export interface AlphaStreamLog {
  id?: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
}

export interface Trade {
  id?: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  timestamp: string;
}

/** Alias used by the hook */
export type AlphaStreamTrade = Trade;

export interface Position {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
  marketValue?: number;
  unrealizedPnl?: number;
}

/** Alias used by the hook */
export type AlphaStreamPosition = Position;
