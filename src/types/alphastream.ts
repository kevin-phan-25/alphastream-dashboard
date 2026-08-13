/**
 * Date: 2026-08-13
 * File: src/types/alphastream.ts
 *
 * Changes:
 * - Extended autonomy types to match current Core /autonomy/status shape
 * - Kept future-rich fields (state/phase/cycles/decision trace) for when Core adds them
 * - Nested autonomy support on Core status + metrics
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
// AUTONOMY
// ======================================================
export type AlphaStreamAutonomyPhase =
  | "IDLE"
  | "OBSERVE"
  | "ANALYZE"
  | "DECIDE"
  | "VALIDATE"
  | "ACT"
  | "MONITOR"
  | "EVALUATE"
  | "LEARN"
  | "ERROR"
  | string;

export type AlphaStreamAutonomyState =
  | "DISABLED"
  | "IDLE"
  | "RUNNING"
  | "PAUSED"
  | "DEGRADED"
  | "ERROR"
  | string;

export type AlphaStreamAutonomyDecision =
  | "BUY"
  | "SELL"
  | "EXIT"
  | "HOLD"
  | "SKIP"
  | "WAIT"
  | "NONE"
  | string;

export interface AlphaStreamAutonomyDecisionTrace {
  id?: string;
  timestamp?: string;
  symbol?: string;
  decision?: AlphaStreamAutonomyDecision;
  confidence?: number;
  reason?: string;
  riskCheck?: string;
  riskApproved?: boolean;
  positionSize?: number;
  quantity?: number;
  execution?: string;
  source?: "AUTONOMY" | "HUMAN" | "SYSTEM" | string;
  phase?: AlphaStreamAutonomyPhase;
}

export interface AlphaStreamAutonomyPhaseStatus {
  name: AlphaStreamAutonomyPhase;
  status?: "PENDING" | "RUNNING" | "COMPLETE" | "FAILED" | "SKIPPED" | string;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number;
  message?: string;
}

/**
 * Autonomy telemetry.
 * Supports both:
 * 1. Current Core shape (entry window, dailyEntries, reason, …)
 * 2. Future rich shape (state, phase, cycles, lastDecision, phases[])
 */
export interface AlphaStreamAutonomyStatus {
  ok?: boolean;

  // --- Current Core fields (2026-08-13) ---
  enabled?: boolean;
  autonomous?: boolean;
  dailyEntries?: number;
  entryWindow?: string;
  eodFlatten?: string;
  inEntryWindow?: boolean;
  lastScan?: string | null;
  manageOnlyOutside?: boolean;
  maxTradesDay?: number;
  reason?: string;
  scanIntervalSec?: number;

  // --- Future / rich fields ---
  state?: AlphaStreamAutonomyState;
  phase?: AlphaStreamAutonomyPhase;

  cycleId?: number | string;
  cycleCount?: number;
  completedCycles?: number;

  decisionCount?: number;
  autonomousDecisions?: number;

  executionCount?: number;
  autonomousExecutions?: number;

  interventionCount?: number;
  humanInterventions?: number;

  errorCount?: number;

  lastCycleAt?: string | null;
  nextCycleAt?: string | null;

  lastDecisionAt?: string | null;
  lastActionAt?: string | null;

  lastDecision?: AlphaStreamAutonomyDecisionTrace | null;

  phases?: AlphaStreamAutonomyPhaseStatus[];

  currentPhaseStartedAt?: string | null;

  uptime?: string | number;

  mode?: string;
  version?: string;

  message?: string;
  error?: string;

  timestamp?: string;

  // Allow nested form when /autonomy/status returns full status payload
  autonomy?: AlphaStreamAutonomyStatus;
}

// ======================================================
// ML
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

  ml?: AlphaStreamMLStatus;
  autonomy?: AlphaStreamAutonomyStatus;
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
  autonomy?: AlphaStreamAutonomyStatus;
}

// ======================================================
// LOGS / TRADES / POSITIONS (unchanged)
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
