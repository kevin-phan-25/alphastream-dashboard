export interface CoreStatus {
  ok:boolean;

  equity:number;

  peakEquity:number;

  buyingPower:number;

  positions:number[];

  positionsCount:number;

  hardFlat:boolean;

  degraded:boolean;

  winRate:number;

  drawdownPct:number;

  totalTrades:number;

  lastMag7Sentiment:number;

  version:string;
}


export interface CoreLogs {
  logs:string[];
}
