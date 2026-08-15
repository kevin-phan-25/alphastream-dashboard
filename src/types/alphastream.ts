/**
 * Date: 2026-08-15
 * File: src/types/alphastream.ts
 *
 * Changes:
 * - Extended autonomy types for Core /autonomy/status
 * - Extended ML status for GLOBAL, lifecycle, nested autonomy (Phases 1–5)
 * - Added AlphaStreamMLAutonomyStatus for ML /autonomy/status
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
// AUTONOMY (Core)
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

export interface AlphaStreamAutonomyStatus {
  ok?: boolean;

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

  autonomy?: AlphaStreamAutonomyStatus;
}

// ======================================================
// ML
// ======================================================
export interface AlphaStreamMLLifecycle {
  pending?: number;
  registered?: number;
  finalized?: number;
  orphanExits?: number;
  expiredDropped?: number;
  persistEnabled?: boolean;
}

export interface AlphaStreamMLAutonomySummary {
  enabled?: boolean;
  challengerMode?: boolean;
  running?: boolean;
  canTrain?: boolean;
  reason?: string;
  lastSkipReason?: string;
  lastTrain?: string | null;
  trainsToday?: number;
  maxTrainsPerDay?: number;
  trainKinds?: string[];
  lastPromotion?: unknown;
  watchdog?: {
    enabled?: boolean;
    lastAction?: string;
    lastReason?: string;
    lastRollback?: string | null;
    rollbacksToday?: number;
  };
  strategy?: {
    enabled?: boolean;
    lastUpdate?: string | null;
    updatesToday?: number;
    profileSource?: string;
    confidenceFloor?: number;
  };
  lifecycle?: { pending?: number };
}

export interface AlphaStreamMLStatus {
  ok: boolean;
  version?: string;
  entryBufferSize: number;
  exitBufferSize: number;
  totalExperiences: number;
  trainingEnabled: boolean;
  batchSize?: number;
  modelScope?: string;
  longOnly?: boolean;
  phase?: number;
  bootComplete?: boolean;
  lastLoad?: string | null;
  lastSave?: string | null;
  lastTrain?: string | null;
  lifecycle?: AlphaStreamMLLifecycle;
  autonomy?: AlphaStreamMLAutonomySummary;
  timestamp?: string;
  error?: string;
}

/** Full ML GET /autonomy/status */
export interface AlphaStreamMLAutonomyStatus {
  ok?: boolean;
  enabled?: boolean;
  challengerMode?: boolean;
  running?: boolean;
  canTrain?: boolean;
  reason?: string;
  lastSkipReason?: string;
  lastTrain?: string | null;
  trainsToday?: number;
  maxTrainsPerDay?: number;
  cooldownSec?: number;
  minTotal?: number;
  minNew?: number;
  epochs?: number;
  trainKinds?: string[];
  entryBufferSize?: number;
  exitBufferSize?: number;
  totalExperiences?: number;
  experiencesAtLastTrain?: number;
  lastResult?: Record<string, unknown>;
  lastPromotion?: unknown;
  champion?: Record<string, unknown>;
  candidate?: Record<string, unknown>;
  archives?: unknown[];
  watchdog?: Record<string, unknown>;
  strategy?: Record<string, unknown>;
  modelScope?: string;
  version?: string;
  timestamp?: string;
  error?: string;
}

export interface AlphaStreamMLHealth {
  status?: string;
  ok?: boolean;
  service?: string;
  version?: string;
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
  promoted?: boolean;
  modelScope?: string;
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
// LOGS / TRADES / POSITIONS
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
