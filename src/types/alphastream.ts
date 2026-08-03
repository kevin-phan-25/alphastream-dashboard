/**
 * AlphaStream Dashboard Types
 *
 * Shared contracts between:
 * - alphastream-core (Go service)
 * - dashboard frontend
 */

export interface AlphaStreamStatus {
  status: string;

  service?: string;

  timestamp?: string;

  uptime?: string;

  version?: string;


  equity: number;

  cash: number;

  buyingPower: number;


  drawdown: number;

  winRate: number;


  positions: number;

  maxPositions: number;


  mlExperiences: number;


  tradingEnabled?: boolean;

  marketOpen?: boolean;


  lastScan?: string;

  lastTrade?: string;


  error?: string;
}


export interface AlphaStreamPosition {

  symbol: string;

  qty: number;

  entryPrice: number;

  currentPrice: number;

  pnl: number;

  pnlPercent: number;

  side: "LONG" | "SHORT";

}


export interface AlphaStreamDecision {

  symbol: string;

  action:
    | "BUY"
    | "SELL"
    | "HOLD"
    | "NONE";


  confidence: number;


  reason?: string;


  timestamp?: string;

}



export interface AlphaStreamScanResult {

  scanned: number;

  signals: AlphaStreamDecision[];

  timestamp?: string;

}



export interface AlphaStreamActionResponse {

  success: boolean;

  message: string;

  timestamp?: string;

}
