import { z } from "zod";

const n = z.number().finite();
const s = z.string();
const b = z.boolean();
// Validate fields consumed by the UI, while accepting additive backend fields.
const decision = z
  .object({
    id: s.nullish().transform((value) => value ?? undefined),
    timestamp: s.nullish().transform((value) => value ?? undefined),
    symbol: s.nullish().transform((value) => value ?? undefined),
    decision: s.nullish().transform((value) => value ?? undefined),
    reason: s.nullish().transform((value) => value ?? undefined),
    riskCheck: s.nullish().transform((value) => value ?? undefined),
    execution: s.nullish().transform((value) => value ?? undefined),
    source: s.nullish().transform((value) => value ?? undefined),
    phase: s.nullish().transform((value) => value ?? undefined),
    confidence: n.nullish().transform((value) => value ?? undefined),
    positionSize: n.nullish().transform((value) => value ?? undefined),
    quantity: n.nullish().transform((value) => value ?? undefined),
    riskApproved: b.nullish().transform((value) => value ?? undefined),
  })
  .passthrough();
const autonomyFields = {
  entryWindow: s.nullish().transform((value) => value ?? undefined),
  eodFlatten: s.nullish().transform((value) => value ?? undefined),
  reason: s.nullish().transform((value) => value ?? undefined),
  state: s.nullish().transform((value) => value ?? undefined),
  phase: s.nullish().transform((value) => value ?? undefined),
  mode: s.nullish().transform((value) => value ?? undefined),
  version: s.nullish().transform((value) => value ?? undefined),
  message: s.nullish().transform((value) => value ?? undefined),
  error: s.nullish().transform((value) => value ?? undefined),
  timestamp: s.nullish().transform((value) => value ?? undefined),
  ok: b.nullish().transform((value) => value ?? undefined),
  enabled: b.nullish().transform((value) => value ?? undefined),
  autonomous: b.nullish().transform((value) => value ?? undefined),
  inEntryWindow: b.nullish().transform((value) => value ?? undefined),
  manageOnlyOutside: b.nullish().transform((value) => value ?? undefined),
  dailyEntries: n.nullish().transform((value) => value ?? undefined),
  maxTradesDay: n.nullish().transform((value) => value ?? undefined),
  scanIntervalSec: n.nullish().transform((value) => value ?? undefined),
  cycleCount: n.nullish().transform((value) => value ?? undefined),
  completedCycles: n.nullish().transform((value) => value ?? undefined),
  decisionCount: n.nullish().transform((value) => value ?? undefined),
  autonomousDecisions: n.nullish().transform((value) => value ?? undefined),
  executionCount: n.nullish().transform((value) => value ?? undefined),
  autonomousExecutions: n.nullish().transform((value) => value ?? undefined),
  interventionCount: n.nullish().transform((value) => value ?? undefined),
  humanInterventions: n.nullish().transform((value) => value ?? undefined),
  errorCount: n.nullish().transform((value) => value ?? undefined),
  cycleId: z
    .union([s, n])
    .nullish()
    .transform((value) => value ?? undefined),
  uptime: z
    .union([s, n])
    .nullish()
    .transform((value) => value ?? undefined),
  ...Object.fromEntries(
    [
      "lastScan",
      "lastCycleAt",
      "nextCycleAt",
      "lastDecisionAt",
      "lastActionAt",
      "currentPhaseStartedAt",
    ].map((name) => [name, s.nullish()]),
  ),
  lastDecision: decision.nullish(),
  phases: z
    .array(
      z
        .object({
          name: s,
          status: s.nullish().transform((value) => value ?? undefined),
          startedAt: s.nullish(),
          completedAt: s.nullish(),
          durationMs: n.nullish().transform((value) => value ?? undefined),
          message: s.nullish().transform((value) => value ?? undefined),
        })
        .passthrough(),
    )
    .nullish()
    .transform((value) => value ?? undefined),
};
const autonomyBase = z.object(autonomyFields).passthrough();
const autonomy = autonomyBase.extend({
  autonomy: autonomyBase.nullish().transform((value) => value ?? undefined),
});
const lifecycle = z
  .object({
    pending: n.nullish().transform((value) => value ?? undefined),
    registered: n.nullish().transform((value) => value ?? undefined),
    finalized: n.nullish().transform((value) => value ?? undefined),
    orphanExits: n.nullish().transform((value) => value ?? undefined),
    expiredDropped: n.nullish().transform((value) => value ?? undefined),
    persistEnabled: b.nullish().transform((value) => value ?? undefined),
  })
  .passthrough();
const watchdog = z
  .object({
    enabled: b.nullish().transform((value) => value ?? undefined),
    lastAction: s.nullish().transform((value) => value ?? undefined),
    lastReason: s.nullish().transform((value) => value ?? undefined),
    lastRollback: s.nullish(),
    rollbacksToday: n.nullish().transform((value) => value ?? undefined),
  })
  .passthrough();
const strategy = z
  .object({
    enabled: b.nullish().transform((value) => value ?? undefined),
    lastUpdate: s.nullish(),
    updatesToday: n.nullish().transform((value) => value ?? undefined),
    profileSource: s.nullish().transform((value) => value ?? undefined),
    confidenceFloor: n.nullish().transform((value) => value ?? undefined),
  })
  .passthrough();
const mlAutonomy = z
  .object({
    ok: b.nullish().transform((value) => value ?? undefined),
    enabled: b.nullish().transform((value) => value ?? undefined),
    challengerMode: b.nullish().transform((value) => value ?? undefined),
    running: b.nullish().transform((value) => value ?? undefined),
    canTrain: b.nullish().transform((value) => value ?? undefined),
    reason: s.nullish().transform((value) => value ?? undefined),
    lastSkipReason: s.nullish().transform((value) => value ?? undefined),
    modelScope: s.nullish().transform((value) => value ?? undefined),
    version: s.nullish().transform((value) => value ?? undefined),
    timestamp: s.nullish().transform((value) => value ?? undefined),
    error: s.nullish().transform((value) => value ?? undefined),
    trainsToday: n.nullish().transform((value) => value ?? undefined),
    maxTrainsPerDay: n.nullish().transform((value) => value ?? undefined),
    cooldownSec: n.nullish().transform((value) => value ?? undefined),
    minTotal: n.nullish().transform((value) => value ?? undefined),
    minNew: n.nullish().transform((value) => value ?? undefined),
    epochs: n.nullish().transform((value) => value ?? undefined),
    entryBufferSize: n.nullish().transform((value) => value ?? undefined),
    exitBufferSize: n.nullish().transform((value) => value ?? undefined),
    totalExperiences: n.nullish().transform((value) => value ?? undefined),
    experiencesAtLastTrain: n
      .nullish()
      .transform((value) => value ?? undefined),
    lastTrain: s.nullish(),
    trainKinds: z
      .array(s)
      .nullish()
      .transform((value) => value ?? undefined),
    lastPromotion: z
      .unknown()
      .nullish()
      .transform((value) => value ?? undefined),
    lastResult: z
      .record(z.unknown())
      .nullish()
      .transform((value) => value ?? undefined),
    champion: z
      .record(z.unknown())
      .nullish()
      .transform((value) => value ?? undefined),
    candidate: z
      .record(z.unknown())
      .nullish()
      .transform((value) => value ?? undefined),
    archives: z
      .array(z.unknown())
      .nullish()
      .transform((value) => value ?? undefined),
    watchdog: watchdog.nullish().transform((value) => value ?? undefined),
    strategy: strategy.nullish().transform((value) => value ?? undefined),
    lifecycle: lifecycle.nullish().transform((value) => value ?? undefined),
  })
  .passthrough();
const mlStatus = z
  .object({
    ok: b.nullish().transform((value) => value ?? undefined),
    trainingEnabled: b.nullish().transform((value) => value ?? undefined),
    longOnly: b.nullish().transform((value) => value ?? undefined),
    bootComplete: b.nullish().transform((value) => value ?? undefined),
    version: s.nullish().transform((value) => value ?? undefined),
    modelScope: s.nullish().transform((value) => value ?? undefined),
    timestamp: s.nullish().transform((value) => value ?? undefined),
    error: s.nullish().transform((value) => value ?? undefined),
    entryBufferSize: n.nullish().transform((value) => value ?? undefined),
    exitBufferSize: n.nullish().transform((value) => value ?? undefined),
    totalExperiences: n.nullish().transform((value) => value ?? undefined),
    batchSize: n.nullish().transform((value) => value ?? undefined),
    phase: n.nullish().transform((value) => value ?? undefined),
    lastLoad: s.nullish(),
    lastSave: s.nullish(),
    lastTrain: s.nullish(),
    lifecycle: lifecycle.nullish().transform((value) => value ?? undefined),
    autonomy: mlAutonomy.nullish().transform((value) => value ?? undefined),
  })
  .passthrough();
const status = z
  .object({
    ok: b.nullish().transform((value) => value ?? undefined),
    hardFlat: b.nullish().transform((value) => value ?? undefined),
    tradingEnabled: b.nullish().transform((value) => value ?? undefined),
    degraded: b.nullish().transform((value) => value ?? undefined),
    brokerReady: b.nullish().transform((value) => value ?? undefined),
    longOnly: b.nullish().transform((value) => value ?? undefined),
    liveTradingEnabled: b.nullish().transform((value) => value ?? undefined),
    paperTradingEnabled: b.nullish().transform((value) => value ?? undefined),
    entriesDisabled: b.nullish().transform((value) => value ?? undefined),
    equity: n.nullish().transform((value) => value ?? undefined),
    peakEquity: n.nullish().transform((value) => value ?? undefined),
    drawdown: n.nullish().transform((value) => value ?? undefined),
    drawdownPct: n.nullish().transform((value) => value ?? undefined),
    positionsCount: n.nullish().transform((value) => value ?? undefined),
    positions: n.nullish().transform((value) => value ?? undefined),
    winRate: n.nullish().transform((value) => value ?? undefined),
    buyingPower: n.nullish().transform((value) => value ?? undefined),
    totalTrades: n.nullish().transform((value) => value ?? undefined),
    lastMag7Sentiment: n.nullish().transform((value) => value ?? undefined),
    lastScan: s.nullish().transform((value) => value ?? undefined),
    message: s.nullish().transform((value) => value ?? undefined),
    version: s.nullish().transform((value) => value ?? undefined),
    timestamp: s.nullish().transform((value) => value ?? undefined),
    broker: s.nullish().transform((value) => value ?? undefined),
    brokerError: s.nullish().transform((value) => value ?? undefined),
    assetClass: s.nullish().transform((value) => value ?? undefined),
    lastSync: s.nullish().transform((value) => value ?? undefined),
    coinbasePendingOrderId: s
      .nullish()
      .transform((value) => value ?? undefined),
    uptime: z
      .union([s, n])
      .nullish()
      .transform((value) => value ?? undefined),
    symbols: z
      .array(s)
      .nullish()
      .transform((value) => value ?? undefined),
    ml: mlStatus.nullish().transform((value) => value ?? undefined),
    autonomy: autonomy.nullish().transform((value) => value ?? undefined),
  })
  .passthrough();
const metrics = z
  .object({
    equity: n.nullish().transform((value) => value ?? undefined),
    peakEquity: n.nullish().transform((value) => value ?? undefined),
    positions: n.nullish().transform((value) => value ?? undefined),
    drawdown: n.nullish().transform((value) => value ?? undefined),
    drawdownPct: n.nullish().transform((value) => value ?? undefined),
    winRate: n.nullish().transform((value) => value ?? undefined),
    totalTrades: n.nullish().transform((value) => value ?? undefined),
    buyingPower: n.nullish().transform((value) => value ?? undefined),
    autonomy: autonomy.nullish().transform((value) => value ?? undefined),
  })
  .passthrough();
const position = z
  .object({
    symbol: s.min(1),
    qty: n,
    side: z
      .enum(["long", "short"])
      .nullish()
      .transform((value) => value ?? undefined),
    avgEntryPrice: n.nullish().transform((value) => value ?? undefined),
    entry: n.nullish().transform((value) => value ?? undefined),
    marketValue: n.nullish().transform((value) => value ?? undefined),
    unrealizedPnl: n.nullish().transform((value) => value ?? undefined),
    unrealizedPL: n.nullish().transform((value) => value ?? undefined),
    unrealizedPLPercent: n.nullish().transform((value) => value ?? undefined),
    availableQty: n.nullish().transform((value) => value ?? undefined),
    mlConfidence: n.nullish().transform((value) => value ?? undefined),
    stopLossPct: n.nullish().transform((value) => value ?? undefined),
    takeProfitPct: n.nullish().transform((value) => value ?? undefined),
    openedAt: s.nullish().transform((value) => value ?? undefined),
    decisionId: s.nullish().transform((value) => value ?? undefined),
  })
  .passthrough();
const trade = z
  .object({
    symbol: s.min(1),
    qty: n,
    price: n,
    timestamp: s,
    side: z.enum(["BUY", "SELL", "buy", "sell", "long", "short"]),
    pnl: n.nullish().transform((value) => value ?? undefined),
    PnL: n.nullish().transform((value) => value ?? undefined),
    fees: n.nullish().transform((value) => value ?? undefined),
    holdTimeMs: n.nullish().transform((value) => value ?? undefined),
    id: s.nullish().transform((value) => value ?? undefined),
    exitReason: s.nullish().transform((value) => value ?? undefined),
    ExitReason: s.nullish().transform((value) => value ?? undefined),
    orderId: s.nullish().transform((value) => value ?? undefined),
    regime: s.nullish().transform((value) => value ?? undefined),
  })
  .passthrough();
const log = z.union([
  s,
  z
    .object({
      id: z
        .union([s, n])
        .nullish()
        .transform((value) => value ?? undefined),
      timestamp: s,
      level: s,
      message: s,
    })
    .passthrough(),
]);
const health = z
  .object({
    status: s,
    service: s.nullish().transform((value) => value ?? undefined),
    time: s.nullish().transform((value) => value ?? undefined),
  })
  .passthrough();
const mlHealth = z
  .object({
    status: s.nullish().transform((value) => value ?? undefined),
    ok: b.nullish().transform((value) => value ?? undefined),
    service: s.nullish().transform((value) => value ?? undefined),
    version: s.nullish().transform((value) => value ?? undefined),
  })
  .passthrough()
  .refine((v) => v.status !== undefined || v.ok !== undefined);
export const readinessSchema = z
  .object({
    ready: b,
    broker: s.nullish().transform((value) => value ?? undefined),
    brokerReady: b.nullish().transform((value) => value ?? undefined),
    tradingEnabled: b.nullish().transform((value) => value ?? undefined),
    error: s.nullish().transform((value) => value ?? undefined),
    checks: z
      .record(z.unknown())
      .nullish()
      .transform((value) => value ?? undefined),
  })
  .passthrough();

function observed<T extends z.AnyZodObject>(schema: T) {
  const names = Object.keys(schema.shape).filter(
    (key) => key !== "error" && key !== "message",
  );
  return schema.refine(
    (value) => names.some((key) => value[key] !== undefined),
    "No recognized telemetry fields",
  );
}
export const telemetrySchemas = {
  health,
  status: observed(status),
  metrics: observed(metrics),
  autonomy: observed(autonomy),
  mlAutonomy: observed(mlAutonomy),
  mlStatus: observed(mlStatus),
  mlHealth,
  positions: z.array(position),
  trades: z.array(trade),
  logs: z.array(log),
  ready: readinessSchema,
  mlReady: readinessSchema,
};
export type TelemetryEndpoint = keyof typeof telemetrySchemas;
export function parseTelemetry(endpoint: TelemetryEndpoint, input: unknown) {
  const result = telemetrySchemas[endpoint].safeParse(input);
  // Never echo upstream payloads (which can include sensitive fields) in errors.
  if (!result.success)
    throw new Error(`Invalid ${endpoint} response from service`);
  return result.data;
}

export const portfolioSchema = z.object({ name: s, uuid: s.uuid(), type: s });
export const portfoliosSchema = z.object({
  portfolios: z.array(portfolioSchema),
});
export const coinbaseStatusSchema = z.object({
  storageConfigured: b,
  readOnly: b,
  saved: b,
  connected: b,
  activeFingerprint: s.nullish().transform((value) => value ?? undefined),
  fingerprint: s.nullish().transform((value) => value ?? undefined),
  maskedKey: s.nullish().transform((value) => value ?? undefined),
  portfolioId: s.nullish().transform((value) => value ?? undefined),
  savedAt: s.nullish().transform((value) => value ?? undefined),
  storageError: s.nullish().transform((value) => value ?? undefined),
  brokerError: s.nullish().transform((value) => value ?? undefined),
  verification: z
    .object({
      running: b,
      fingerprint: s.nullish().transform((value) => value ?? undefined),
      completedAt: s.nullish().transform((value) => value ?? undefined),
      checks: z.array(z.object({ name: s, ok: b, message: s })),
    })
    .nullish()
    .transform((value) => value ?? undefined),
});
export type CoinbaseStatus = z.infer<typeof coinbaseStatusSchema>;
export type CoinbasePortfolio = z.infer<typeof portfolioSchema>;
export function parseCoinbaseStatus(input: unknown): CoinbaseStatus {
  const result = coinbaseStatusSchema.safeParse(input);
  if (!result.success)
    throw new Error(
      "Invalid Coinbase connection status. Deploy a compatible Core service.",
    );
  return result.data;
}
export function parsePortfolios(input: unknown) {
  const result = portfoliosSchema.safeParse(input);
  if (!result.success) throw new Error("Invalid Coinbase portfolio response.");
  return result.data;
}
