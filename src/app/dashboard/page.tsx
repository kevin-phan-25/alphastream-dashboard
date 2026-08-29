/**
 * Date: 2026-08-29
 * File: src/app/dashboard/page.tsx
 *
 * Trade Performance metrics + charts (R:R, exit mix, equity curve tooltips).
 */
"use client";

import { useState } from "react";
import { useAlphaStream } from "@/hooks/useAlphaStream";
import { TradePerformanceCharts } from "@/components/charts/TradePerformanceCharts";
import type {
  AlphaStreamAutonomyPhase,
  AlphaStreamAutonomyStatus,
  AlphaStreamLog,
  AlphaStreamMLStatus,
  MLTrainingLogEntry,
} from "@/types/alphastream";

const AUTONOMY_PHASES: AlphaStreamAutonomyPhase[] = [
  "OBSERVE",
  "ANALYZE",
  "DECIDE",
  "VALIDATE",
  "ACT",
  "MONITOR",
  "EVALUATE",
  "LEARN",
];

type ExitStats = {
  n: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  realizedRR: number | null;
  expectancy: number;
  byReason: Record<string, { count: number; pnl: number }>;
  netPnl: number;
};

function summarizeTrades(
  trades: {
    pnl?: number;
    PnL?: number;
    exitReason?: string;
    ExitReason?: string;
  }[]
): ExitStats {
  const byReason: Record<string, { count: number; pnl: number }> = {};
  let wins = 0;
  let losses = 0;
  let sumWin = 0;
  let sumLoss = 0;
  let netPnl = 0;

  for (const t of trades) {
    const pnl = Number(t.pnl ?? t.PnL ?? 0);
    const raw = String(t.exitReason ?? t.ExitReason ?? "unknown");
    const reason = raw.split(" ")[0] || "unknown";
    netPnl += pnl;
    if (!byReason[reason]) byReason[reason] = { count: 0, pnl: 0 };
    byReason[reason].count += 1;
    byReason[reason].pnl += pnl;
    if (pnl > 0) {
      wins += 1;
      sumWin += pnl;
    } else if (pnl < 0) {
      losses += 1;
      sumLoss += Math.abs(pnl);
    }
  }

  const n = trades.length;
  const avgWin = wins ? sumWin / wins : 0;
  const avgLoss = losses ? sumLoss / losses : 0;
  const realizedRR = avgLoss > 0 ? avgWin / avgLoss : null;
  const winRate = n ? (wins / n) * 100 : 0;
  const expectancy = n ? netPnl / n : 0;

  return {
    n,
    wins,
    losses,
    winRate,
    avgWin,
    avgLoss,
    realizedRR,
    expectancy,
    byReason,
    netPnl,
  };
}

export default function DashboardPage() {
  const {
    status,
    metrics,
    autonomy,
    mlAutonomy,
    positions,
    trades,
    logs,
    mlStatus,
    connected,
    mlConnected,
    autonomyConnected,
    error,
    loading,
    refresh,
    startTraining,
  } = useAlphaStream();

  const [training, setTraining] = useState(false);
  const [clearingFlat, setClearingFlat] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [trainingLogs, setTrainingLogs] = useState<MLTrainingLogEntry[]>([]);

  async function handleTrain() {
    setTraining(true);
    try {
      const result: any = await startTraining();
      const entry: MLTrainingLogEntry = {
        id: `${Date.now()}`,
        timestamp: new Date().toISOString(),
        ok: Boolean(result?.ok ?? true),
        trained: Boolean(result?.trained),
        promoted: Boolean(result?.promoted),
        message:
          result?.message ||
          result?.reason ||
          (result?.trained
            ? `Autonomy train complete steps=${result?.steps ?? 0}`
            : result?.error || "Autonomy train finished"),
        steps: result?.steps,
        epochs: result?.epochs,
        avgLoss: result?.avgLoss ?? null,
        elapsedSec: result?.elapsedSec,
        entryBufferSize: result?.entryBufferSize,
        exitBufferSize: result?.exitBufferSize,
        totalExperiences: result?.totalExperiences,
        error: result?.error,
        reason: result?.reason,
        modelScope: result?.modelScope || "GLOBAL",
      };
      setTrainingLogs((prev) => [entry, ...prev].slice(0, 20));
    } catch (err: any) {
      console.error("Training failed:", err);
      const entry: MLTrainingLogEntry = {
        id: `${Date.now()}`,
        timestamp: new Date().toISOString(),
        ok: false,
        trained: false,
        message: err?.message || "Training request failed",
        error: err?.message || String(err),
      };
      setTrainingLogs((prev) => [entry, ...prev].slice(0, 20));
    } finally {
      setTraining(false);
    }
  }

  async function handleClearHardFlat() {
    setClearingFlat(true);
    try {
      const res = await fetch("/api/admin/clear-hard-flat", {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to clear hard flat");
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setClearingFlat(false);
    }
  }

  async function handleScan() {
    setScanLoading(true);
    try {
      const res = await fetch("/api/admin/scan", {
        method: "POST",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        console.error("Force scan failed", res.status, data);
        const errMsg =
          (typeof data === "object" && data && "error" in data
            ? String((data as { error?: unknown }).error)
            : null) ||
          (typeof data === "object" && data && "message" in data
            ? String((data as { message?: unknown }).message)
            : null) ||
          "unknown";
        alert(
          res.status === 401
            ? "Force Scan unauthorized (401). Set ADMIN_KEY in Cloudflare Pages to match Core, then redeploy the dashboard."
            : `Force Scan failed (${res.status}): ${errMsg}`
        );
        return;
      }
      setTimeout(() => {
        void refresh();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Force Scan request failed — see console");
    } finally {
      setScanLoading(false);
    }
  }

  const hardFlat = status?.hardFlat ?? false;
  const degraded = status?.degraded ?? false;

  const ml: AlphaStreamMLStatus | null =
    status?.ml && status.ml.ok !== undefined ? status.ml : mlStatus;

  const canTrain = mlAutonomy?.canTrain ?? ml?.autonomy?.canTrain ?? null;
  const lastSkipReason =
    mlAutonomy?.lastSkipReason ||
    ml?.autonomy?.lastSkipReason ||
    ml?.autonomy?.reason ||
    null;
  const trainsToday =
    mlAutonomy?.trainsToday ?? ml?.autonomy?.trainsToday ?? null;
  const maxTrains =
    mlAutonomy?.maxTrainsPerDay ?? ml?.autonomy?.maxTrainsPerDay ?? null;
  const pendingEntries =
    ml?.lifecycle?.pending ?? ml?.autonomy?.lifecycle?.pending ?? null;
  const confidenceFloor =
    ml?.autonomy?.strategy?.confidenceFloor ??
    (typeof mlAutonomy?.strategy === "object" &&
    mlAutonomy?.strategy &&
    "confidenceFloor" in (mlAutonomy.strategy as object)
      ? (mlAutonomy.strategy as { confidenceFloor?: number }).confidenceFloor
      : undefined);
  const modelScope = ml?.modelScope ?? mlAutonomy?.modelScope ?? "GLOBAL";
  const longOnly = ml?.longOnly;

  const tradeStats = summarizeTrades(trades);
  const openUnrealized = positions.reduce(
    (s, p) => s + Number(p.unrealizedPnl ?? p.unrealizedPL ?? 0),
    0
  );
  const equityAnchor = Math.max(
    0,
    Number(status?.equity ?? metrics?.equity ?? 0) - tradeStats.netPnl
  );
  const challengerMode =
    mlAutonomy?.challengerMode ?? ml?.autonomy?.challengerMode;
  const mlSubtitle = `${modelScope} · ${
    longOnly === true
      ? "long-only"
      : longOnly === false
        ? "long+short"
        : "long/short"
  } · ${challengerMode ? "challenger train" : "live train"}`;

  const autonomyRaw = autonomy ?? status?.autonomy ?? null;
  const autonomyInfo: AlphaStreamAutonomyStatus | null =
    autonomyRaw &&
    typeof autonomyRaw === "object" &&
    autonomyRaw.autonomy &&
    typeof autonomyRaw.autonomy === "object"
      ? (autonomyRaw.autonomy as AlphaStreamAutonomyStatus)
      : (autonomyRaw as AlphaStreamAutonomyStatus | null);

  const autonomyEnabled = Boolean(
    autonomyInfo?.enabled ?? autonomyInfo?.autonomous ?? false
  );
  const autonomyTelemetryAvailable =
    autonomyConnected || Boolean(autonomyInfo);

  const autonomyState =
    autonomyInfo?.state ??
    (autonomyEnabled
      ? autonomyInfo?.inEntryWindow
        ? "RUNNING"
        : "IDLE"
      : "DISABLED");
  const autonomyPhase = autonomyInfo?.phase ?? "UNKNOWN";
  const currentCycle =
    autonomyInfo?.cycleId ??
    autonomyInfo?.cycleCount ??
    autonomyInfo?.completedCycles ??
    0;
  const completedCycles =
    autonomyInfo?.completedCycles ?? autonomyInfo?.cycleCount ?? 0;
  const decisionCount =
    autonomyInfo?.autonomousDecisions ?? autonomyInfo?.decisionCount ?? 0;
  const executionCount =
    autonomyInfo?.autonomousExecutions ?? autonomyInfo?.executionCount ?? 0;
  const interventionCount =
    autonomyInfo?.humanInterventions ?? autonomyInfo?.interventionCount ?? 0;
  const lastDecision = autonomyInfo?.lastDecision ?? null;

  return (
    <main className="min-h-screen bg-black p-6 text-white md:p-8">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              AlphaStream Dashboard
            </h1>
            <p className="text-gray-400">
              Core + ML + Autonomous Trading System
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleScan}
              disabled={scanLoading || !connected}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {scanLoading ? "Scanning…" : "Force Scan"}
            </button>
            <button
              onClick={() => void refresh()}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-6 text-sm">
          <span className={connected ? "text-green-400" : "text-red-400"}>
            ● Core {connected ? "Connected" : "Offline"}
          </span>
          <span className={mlConnected ? "text-green-400" : "text-red-400"}>
            ● ML {mlConnected ? "Connected" : "Offline"}
          </span>
          <span
            className={
              autonomyTelemetryAvailable ? "text-green-400" : "text-yellow-400"
            }
          >
            ● Autonomy{" "}
            {autonomyTelemetryAvailable
              ? "Telemetry Connected"
              : "Telemetry Unavailable"}
          </span>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-300">
            <p className="font-semibold text-red-400">Some endpoints failed</p>
            <p className="mt-1 break-words text-red-200/80">{error}</p>
          </div>
        )}

        <AutonomyControlCenter
          autonomy={autonomyInfo}
          enabled={autonomyEnabled}
          state={String(autonomyState)}
          phase={String(autonomyPhase)}
          telemetryAvailable={autonomyTelemetryAvailable}
          cycle={currentCycle}
          completedCycles={completedCycles}
          decisions={decisionCount}
          executions={executionCount}
          interventions={interventionCount}
          lastDecision={lastDecision}
        />

        {(hardFlat || degraded) && (
          <div className="mb-6 rounded-xl border border-red-500/60 bg-red-950/50 p-5">
            <p className="text-lg font-semibold text-red-400">
              ⚠️ Trading Halted
              {hardFlat && " — Hard Flat Active"}
              {degraded && " — Degraded Mode"}
            </p>
            <p className="mt-1 text-sm text-red-300/90">
              New entries are blocked. Existing positions are still managed.
            </p>
            <button
              onClick={handleClearHardFlat}
              disabled={clearingFlat}
              className="mt-4 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {clearingFlat ? "Clearing…" : "Clear Hard Flat / Degraded"}
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Equity"
            value={formatCurrency(status?.equity ?? metrics?.equity ?? 0)}
          />
          <MetricCard
            title="Positions"
            value={
              status?.positionsCount ??
              status?.positions ??
              metrics?.positions ??
              positions.length ??
              0
            }
          />
          <MetricCard
            title="Win Rate"
            value={`${Number(status?.winRate ?? metrics?.winRate ?? 0).toFixed(1)}%`}
          />
          <MetricCard
            title="Drawdown"
            value={`${Number(
              status?.drawdownPct ??
                status?.drawdown ??
                metrics?.drawdownPct ??
                metrics?.drawdown ??
                0
            ).toFixed(2)}%`}
          />
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            title="Peak Equity"
            value={formatCurrency(status?.peakEquity ?? metrics?.peakEquity ?? 0)}
          />
          <MetricCard
            title="Buying Power"
            value={formatCurrency(
              status?.buyingPower ?? metrics?.buyingPower ?? 0
            )}
          />
          <MetricCard
            title="Total Trades"
            value={
              status?.totalTrades ?? metrics?.totalTrades ?? trades.length ?? 0
            }
          />
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Trade Performance</h2>
          <p className="mb-4 text-xs text-gray-500">
            From closed trades on Core. Equity curve = cumulative trade PnL
            (anchored so the last point aligns with current equity when the
            sample is complete).
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Sample (closed)" value={tradeStats.n} />
            <MetricCard
              title="Realized R:R"
              value={
                tradeStats.realizedRR != null
                  ? `${tradeStats.realizedRR.toFixed(2)} : 1`
                  : "—"
              }
            />
            <MetricCard
              title="Expectancy / trade"
              value={formatCurrency(tradeStats.expectancy)}
            />
            <MetricCard
              title="Net closed PnL"
              value={formatCurrency(tradeStats.netPnl)}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Win rate (trades)"
              value={`${tradeStats.winRate.toFixed(1)}%`}
            />
            <MetricCard title="Avg win" value={formatCurrency(tradeStats.avgWin)} />
            <MetricCard
              title="Avg loss"
              value={formatCurrency(tradeStats.avgLoss)}
            />
            <MetricCard
              title="Open unrealized"
              value={formatCurrency(openUnrealized)}
            />
          </div>

          <div className="mt-6">
            <TradePerformanceCharts
              byReason={tradeStats.byReason}
              wins={tradeStats.wins}
              losses={tradeStats.losses}
              netPnl={tradeStats.netPnl}
              trades={trades}
              startEquity={equityAnchor}
            />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-700 text-gray-400">
                <tr>
                  <th className="p-4">Exit reason</th>
                  <th className="p-4">Count</th>
                  <th className="p-4">Net PnL</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tradeStats.byReason)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([reason, v]) => (
                    <tr key={reason} className="border-b border-zinc-800">
                      <td className="p-4 font-medium">{reason}</td>
                      <td className="p-4">{v.count}</td>
                      <td
                        className={`p-4 ${
                          v.pnl >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {formatCurrency(v.pnl)}
                      </td>
                    </tr>
                  ))}
                {tradeStats.n === 0 && (
                  <tr>
                    <td className="p-4 text-gray-400" colSpan={3}>
                      No trades to summarize
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">ML Service</h2>
              <p className="mt-1 text-xs text-gray-500">{mlSubtitle}</p>
            </div>
            <button
              onClick={handleTrain}
              disabled={training || !mlConnected}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {training ? "Training…" : "Force Autonomy Train"}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Entry Buffer" value={ml?.entryBufferSize ?? 0} />
            <MetricCard title="Exit Buffer" value={ml?.exitBufferSize ?? 0} />
            <MetricCard
              title="Total Experiences"
              value={ml?.totalExperiences ?? 0}
            />
            <MetricCard
              title="Training Enabled"
              value={ml?.trainingEnabled ? "Yes" : "No"}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Model Scope" value={modelScope} />
            <MetricCard
              title="Long Only"
              value={longOnly == null ? "—" : longOnly ? "Yes" : "No"}
            />
            <MetricCard
              title="Can Train"
              value={canTrain == null ? "—" : canTrain ? "Yes" : "No"}
            />
            <MetricCard
              title="Trains Today"
              value={
                trainsToday != null ? `${trainsToday}/${maxTrains ?? "—"}` : "—"
              }
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Pending Entries" value={pendingEntries ?? "—"} />
            <MetricCard
              title="Confidence Floor"
              value={confidenceFloor ?? "—"}
            />
            <MetricCard
              title="Boot Complete"
              value={ml?.bootComplete ? "Yes" : "No"}
            />
            <MetricCard
              title="Last Train"
              value={formatTs(
                mlAutonomy?.lastTrain ?? ml?.autonomy?.lastTrain ?? ml?.lastTrain
              )}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Last Load" value={formatTs(ml?.lastLoad)} />
            <MetricCard title="Last Save" value={formatTs(ml?.lastSave)} />
            <MetricCard
              title="Challenger Mode"
              value={
                challengerMode == null ? "—" : challengerMode ? "Yes" : "No"
              }
            />
            <MetricCard
              title="Train Kinds"
              value={
                (mlAutonomy?.trainKinds ?? ml?.autonomy?.trainKinds)?.join(
                  ", "
                ) ?? "entry"
              }
            />
          </div>
          {lastSkipReason && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Autonomy Skip / Last Reason
              </p>
              <p className="mt-1 text-sm font-medium text-gray-200">
                {String(lastSkipReason)}
              </p>
            </div>
          )}
          {(ml?.version || ml?.timestamp) && (
            <p className="mt-3 text-sm text-gray-400">
              {ml?.version && <>Version: {ml.version}</>}
              {ml?.timestamp && (
                <>
                  {ml.version ? " • " : ""}
                  Last update: {new Date(ml.timestamp).toLocaleString()}
                </>
              )}
            </p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">ML Training Logs</h2>
          <div className="overflow-x-auto rounded-xl bg-zinc-900">
            {trainingLogs.length === 0 ? (
              <p className="p-5 text-gray-400">
                No training runs yet. Click “Force Autonomy Train” to see
                results here.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-700 text-gray-400">
                  <tr>
                    <th className="p-4">Time</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Message</th>
                    <th className="p-4">Steps</th>
                    <th className="p-4">Avg Loss</th>
                    <th className="p-4">Elapsed</th>
                    <th className="p-4">Buffers (E/X)</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingLogs.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-800">
                      <td className="whitespace-nowrap p-4 text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={
                            log.trained
                              ? "text-green-400"
                              : log.ok
                                ? "text-yellow-400"
                                : "text-red-400"
                          }
                        >
                          {log.trained
                            ? log.promoted
                              ? "Trained+Promoted"
                              : "Trained"
                            : log.ok
                              ? "Skipped"
                              : "Failed"}
                        </span>
                      </td>
                      <td className="max-w-xs truncate p-4" title={log.message}>
                        {log.message}
                      </td>
                      <td className="p-4">{log.steps ?? "—"}</td>
                      <td className="p-4">
                        {log.avgLoss != null
                          ? Number(log.avgLoss).toFixed(4)
                          : "—"}
                      </td>
                      <td className="p-4">
                        {log.elapsedSec != null ? `${log.elapsedSec}s` : "—"}
                      </td>
                      <td className="p-4">
                        {log.entryBufferSize != null ||
                        log.exitBufferSize != null
                          ? `${log.entryBufferSize ?? "—"} / ${
                              log.exitBufferSize ?? "—"
                            }`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Open Positions</h2>
          <div className="overflow-x-auto rounded-xl bg-zinc-900">
            {positions.length === 0 ? (
              <p className="p-5 text-gray-400">No open positions</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-700 text-gray-400">
                  <tr>
                    <th className="p-4">Symbol</th>
                    <th className="p-4">Side</th>
                    <th className="p-4">Qty</th>
                    <th className="p-4">Avg Entry</th>
                    <th className="p-4">Market Value</th>
                    <th className="p-4">Unrealized P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => {
                    const pnl = pos.unrealizedPnl ?? pos.unrealizedPL ?? 0;
                    return (
                      <tr key={pos.symbol} className="border-b border-zinc-800">
                        <td className="p-4 font-medium">{pos.symbol}</td>
                        <td className="p-4 capitalize">{pos.side ?? "long"}</td>
                        <td className="p-4">{pos.qty}</td>
                        <td className="p-4">
                          {formatCurrency(pos.avgEntryPrice ?? pos.entry ?? 0)}
                        </td>
                        <td className="p-4">
                          {formatCurrency(pos.marketValue ?? 0)}
                        </td>
                        <td
                          className={`p-4 ${
                            pnl >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {formatCurrency(pnl)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Recent Trades</h2>
          <div className="overflow-x-auto rounded-xl bg-zinc-900">
            {trades.length === 0 ? (
              <p className="p-5 text-gray-400">No closed trades yet</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-700 text-gray-400">
                  <tr>
                    <th className="p-4">Time</th>
                    <th className="p-4">Symbol</th>
                    <th className="p-4">Side</th>
                    <th className="p-4">P&L</th>
                    <th className="p-4">Exit Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {trades
                    .slice()
                    .reverse()
                    .slice(0, 30)
                    .map((t: any, i: number) => (
                      <tr key={t.id ?? i} className="border-b border-zinc-800">
                        <td className="p-4 text-gray-400">
                          {t.timestamp
                            ? new Date(t.timestamp).toLocaleString()
                            : "—"}
                        </td>
                        <td className="p-4 font-medium">{t.symbol}</td>
                        <td className="p-4 capitalize">{t.side ?? "—"}</td>
                        <td
                          className={`p-4 ${
                            (t.pnl ?? t.PnL ?? 0) >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {formatCurrency(t.pnl ?? t.PnL ?? 0)}
                        </td>
                        <td className="p-4 text-gray-400">
                          {t.exitReason ?? t.ExitReason ?? "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">System Logs</h2>
          <div className="max-h-80 overflow-y-auto rounded-xl bg-zinc-900 p-5 font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-400">No logs available</p>
            ) : (
              logs.map((log, index) => (
                <p
                  key={
                    typeof log === "string"
                      ? index
                      : (log as AlphaStreamLog).id ?? index
                  }
                  className="mb-1 text-gray-300"
                >
                  {typeof log === "string"
                    ? log
                    : `[${(log as AlphaStreamLog).level ?? "INFO"}] ${
                        (log as AlphaStreamLog).timestamp ?? ""
                      } ${(log as AlphaStreamLog).message ?? ""}`.trim()}
                </p>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function AutonomyControlCenter({
  autonomy,
  enabled,
  state,
  phase,
  telemetryAvailable,
  cycle,
  completedCycles,
  decisions,
  executions,
  interventions,
  lastDecision,
}: {
  autonomy: AlphaStreamAutonomyStatus | null;
  enabled: boolean;
  state: string;
  phase: string;
  telemetryAvailable: boolean;
  cycle: number | string;
  completedCycles: number;
  decisions: number;
  executions: number;
  interventions: number;
  lastDecision: AlphaStreamAutonomyStatus["lastDecision"];
}) {
  const normalizedState = String(state).toUpperCase();
  const normalizedPhase = String(phase).toUpperCase();
  const isRunning =
    (normalizedState === "RUNNING" || Boolean(autonomy?.inEntryWindow)) &&
    enabled;
  const isError = normalizedState === "ERROR";
  const isDegraded = normalizedState === "DEGRADED";

  const stateLabel = !telemetryAvailable
    ? "TELEMETRY UNAVAILABLE"
    : !enabled
      ? "DISABLED"
      : autonomy?.inEntryWindow
        ? "IN ENTRY WINDOW"
        : autonomy?.reason
          ? String(autonomy.reason).replace(/_/g, " ").toUpperCase()
          : normalizedState;

  return (
    <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`h-3 w-3 rounded-full ${
                isRunning
                  ? "bg-green-400"
                  : isError
                    ? "bg-red-400"
                    : isDegraded
                      ? "bg-yellow-400"
                      : enabled
                        ? "bg-blue-400"
                        : "bg-zinc-500"
              }`}
            />
            <h2 className="text-2xl font-bold">Autonomy Control Center</h2>
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Autonomous decision-loop telemetry
          </p>
        </div>
        <div
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${
            isRunning
              ? "border-green-500/40 bg-green-950/40 text-green-400"
              : isError
                ? "border-red-500/40 bg-red-950/40 text-red-400"
                : enabled
                  ? "border-blue-500/40 bg-blue-950/40 text-blue-400"
                  : "border-zinc-700 bg-zinc-900 text-gray-400"
          }`}
        >
          {stateLabel}
        </div>
      </div>

      {!telemetryAvailable && (
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-950/20 p-4">
          <p className="font-semibold text-yellow-400">
            Autonomy telemetry unavailable
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AutonomyMetric
          title="Enabled"
          value={telemetryAvailable ? (enabled ? "Yes" : "No") : "—"}
        />
        <AutonomyMetric
          title="In Entry Window"
          value={
            telemetryAvailable
              ? autonomy?.inEntryWindow
                ? "Yes"
                : "No"
              : "—"
          }
        />
        <AutonomyMetric
          title="Daily Entries"
          value={telemetryAvailable ? (autonomy?.dailyEntries ?? 0) : "—"}
        />
        <AutonomyMetric
          title="Max Trades / Day"
          value={telemetryAvailable ? (autonomy?.maxTradesDay ?? "—") : "—"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AutonomyMetric
          title="Entry Window"
          value={telemetryAvailable ? autonomy?.entryWindow ?? "—" : "—"}
        />
        <AutonomyMetric
          title="EOD Flatten"
          value={telemetryAvailable ? autonomy?.eodFlatten ?? "—" : "—"}
        />
        <AutonomyMetric
          title="Scan Interval"
          value={
            telemetryAvailable && autonomy?.scanIntervalSec != null
              ? `${autonomy.scanIntervalSec}s`
              : "—"
          }
        />
        <AutonomyMetric
          title="Manage Only Outside"
          value={
            telemetryAvailable
              ? autonomy?.manageOnlyOutside
                ? "Yes"
                : "No"
              : "—"
          }
        />
      </div>

      {autonomy?.reason && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Current Reason
          </p>
          <p className="mt-1 text-sm font-medium text-gray-200">
            {String(autonomy.reason).replace(/_/g, " ")}
          </p>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Autonomous Pipeline</h3>
          <span className="text-xs uppercase tracking-wider text-gray-500">
            8 phases
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
          {AUTONOMY_PHASES.map((phaseName) => {
            const isCurrent =
              normalizedPhase === String(phaseName).toUpperCase();
            return (
              <div
                key={phaseName}
                className={`rounded-xl border p-3 ${
                  isCurrent
                    ? "border-blue-500/60 bg-blue-950/40"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <p className="text-xs font-semibold">{phaseName}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-black/40 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Last Autonomous Decision</h3>
          <span className="rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-400">
            {lastDecision?.source ?? "UNKNOWN"}
          </span>
        </div>
        {!lastDecision ? (
          <p className="text-sm text-gray-500">
            No autonomous decision telemetry available yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <DecisionField label="Symbol" value={lastDecision.symbol ?? "—"} />
            <DecisionField
              label="Decision"
              value={lastDecision.decision ?? "—"}
            />
            <DecisionField
              label="Confidence"
              value={
                lastDecision.confidence != null
                  ? `${(
                      Number(lastDecision.confidence) > 1
                        ? Number(lastDecision.confidence)
                        : Number(lastDecision.confidence) * 100
                    ).toFixed(1)}%`
                  : "—"
              }
            />
            <DecisionField
              label="Time"
              value={formatTs(lastDecision.timestamp)}
            />
          </div>
        )}
        {lastDecision?.reason && (
          <div className="mt-4 rounded-lg bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Decision Reason
            </p>
            <p className="mt-1 text-sm text-gray-300">{lastDecision.reason}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function AutonomyMetric({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs uppercase tracking-wider text-gray-500">{title}</p>
      <p className="mt-2 text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function DecisionField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-gray-200">{value}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-zinc-900 p-5">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatTs(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
