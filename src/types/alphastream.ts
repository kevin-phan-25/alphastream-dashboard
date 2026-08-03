/**
 * -----------------------------------------------------------------------------
 * Date: 2026-08-03
 * File: src/types/alphastream.ts
 *
 * Description:
 * Shared AlphaStream dashboard TypeScript types.
 *
 * Changes:
 * • Added AlphaStreamStatus interface
 * • Added position types
 * • Added trading state types
 * • Added API response types
 * • Matches Go Core service responses
 * -----------------------------------------------------------------------------
 */


export interface AlphaStreamStatus {

  status: string;

  running: boolean;

  equity: number;

  cash: number;

  buyingPower: number;

  drawdown: number;

  winRate: number;

  positions: number;

  maxPositions: number;

  tradesToday?: number;

  lastScan?: string;

  uptime?: string;

}



export interface AlphaStreamPosition {

  symbol: string;

  qty: number;

  entryPrice: number;

  currentPrice: number;

  pnl: number;

  pnlPercent: number;

}



export interface AlphaStreamTrade {

  id?: string;

  symbol: string;

  side: "BUY" | "SELL";

  qty: number;

  price: number;

  timestamp: string;

}



export interface AlphaStreamLog {

  timestamp: string;

  level: "INFO" | "WARN" | "ERROR";

  message: string;

}



export interface ScanResponse {

  success: boolean;

  message?: string;

  signals?: number;

}



export interface ActionResponse {

  success: boolean;

  message: string;

}
