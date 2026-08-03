/**
 * AlphaStream shared frontend types
 */

export interface AlphaStreamStatus {
  ok: boolean;

  equity: number;
  peakEquity: number;

  drawdown: number;

  positionsCount: number;

  hardFlat: boolean;

  tradingEnabled: boolean;

  lastScan?: string;

  uptime?: string;

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


export interface Position {
  symbol: string;

  qty: number;

  avgEntryPrice: number;

  marketValue?: number;

  unrealizedPnl?: number;
}
