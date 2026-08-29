/**
 * Date: 2026-08-29
 * File: src/app/dashboard/page.tsx
 *
 * Features:
 * - Autonomy Control Center + last decision
 * - Core metrics, hard-flat controls
 * - Trade Performance: R:R, expectancy, exit mix, charts, equity curve
 * - ML status with live vs challenger subtitle
 * - Force Scan / Force Autonomy Train / Refresh
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
    const reason =
      String(t.exitReason ?? t.ExitReason ?? "unknown").split(" ")[0] ||
      "unknown";
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

  return {
    n,
    wins,
    losses,
    winRate: n ? (wins / n) * 100 : 0,
    avgWin,
    avgLoss,
    realizedRR: avgLoss > 0 ? avgWin / avgLoss : null,
    expectancy: n ? netPnl / n : 0,
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
      setTrainingLogs((prev) =>
        [
          {
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
          } as MLTrainingLogEntry,
          ...prev,
        ].slice(0, 20)
      );
    } catch (err: any) {
      setTrainingLogs((prev) =>
        [
          {
            id: `${Date.now()}`,
            timestamp: new Date().toISOString(),
            ok: false,
            trained: false,
            message: err?.message || "Training request failed",
            error: err?.message || String(err),
          } as MLTrainingLogEntry,
          ...prev,
        ].slice(0, 20)
      );
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
    } catch (e) {
      console.error(e);
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg =
          (data as any)?.error || (data as any)?.message || "unknown";
        alert(
          res.status === 401
            ? "Force Scan unauthorized (401). Set ADMIN_KEY in Cloudflare Pages to match Core."
            : `Force Scan failed (${res.status}): ${errMsg}`
        );
        return;
      }
      setTimeout(() => void refresh(), 1500);
    } catch (e) {
      console.error(e);
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
  const challengerMode =
    mlAutonomy?.challengerMode ?? ml?.autonomy?.challengerMode;

  const tradeStats = summarizeTrades(trades);
  const openUnrealized = positions.reduce(
    (s, p) => s + Number(p.unrealizedPnl ?? p.unrealizedPL ?? 0),
    0
  );
  const equityAnchor = Math.max(
    0,
    Number(status?.equity ?? metrics?.equity ?? 0) - tradeStats.netPnl
  );
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
    (autonomyRaw as any).autonomy &&
    typeof (autonomyRaw as any).autonomy === "object"
      ? ((autonomyRaw as any).autonomy as AlphaStreamAutonomyStatus)
      : (autonomyRaw as AlphaStreamAutonomyStatus | null);

  const autonomyEnabled = Boolean(
    autonomyInfo?.enabled ?? autonomyInfo?.autonomous ?? false
  );
  const autonomyTelemetryAvailable =
    autonomyConnected || Boolean(autonomyInfo);
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

        {/* Autonomy strip */}
        <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="mb-4 text-2xl font-bold">Autonomy Control Center</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Enabled"
              value={autonomyEnabled ? "Yes" : "No"}
            />
            <MetricCard
              title="In Entry Window"
              value={autonomyInfo?.inEntryWindow ? "Yes" : "No"}
            />
            <MetricCard
              title="Daily Entries"
              value={autonomyInfo?.dailyEntries ?? 0}
            />
            <MetricCard
              title="Max Trades / Day"
              value={autonomyInfo?.maxTradesDay ?? "—"}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Entry Window"
              value={autonomyInfo?.entryWindow ?? "—"}
            />
            <MetricCard
              title="EOD Flatten"
              value={autonomyInfo?.eodFlatten ?? "—"}
            />
            <MetricCard
              title="Scan Interval"
              value={
                autonomyInfo?.scanIntervalSec != null
                  ? `${autonomyInfo.scanIntervalSec}s`
                  : "—"
              }
            />
            <MetricCard
              title="Current Reason"
              value={
                autonomyInfo?.reason
                  ? String(autonomyInfo.reason).replace(/_/g, " ")
                  : "—"
              }
            />
          </div>
          <div className="mt-6 rounded-xl border border-zinc-800 bg-black/40 p-5">
            <h3 className="mb-3 text-lg font-semibold">
              Last Autonomous Decision{" "}
              <span className="text-xs text-green-400">
                {lastDecision?.source ?? "UNKNOWN"}
              </span>
            </h3>
            {!lastDecision ? (
              <p className="text-sm text-gray-500">
                No autonomous decision telemetry available yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricCard title="Symbol" value={lastDecision.symbol ?? "—"} />
                <MetricCard
                  title="Decision"
                  value={lastDecision.decision ?? "—"}
                />
                <MetricCard
                  title="Confidence"
                  value={
                    lastDecision.confidence != null
                      ? `${Number(lastDecision.confidence).toFixed(1)}%`
                      : "—"
                  }
                />
                <MetricCard
                  title="Time"
                  value={formatTs(lastDecision.timestamp)}
                />
              </div>
            )}
            {lastDecision?.reason && (
              <p className="mt-3 text-sm text-gray-300">
                Reason: {lastDecision.reason}
              </p>
            )}
          </div>
        </section>

        {(hardFlat || degraded) && (
          <div className="mb-6 rounded-xl border border-red-500/60 bg-red-950/50 p-5">
            <p className="text-lg font-semibold text-red-400">
              Trading Halted
              {hardFlat && " — Hard Flat"}
              {degraded && " — Degraded"}
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
            value={formatCurrency(
              status?.peakEquity ?? metrics?.peakEquity ?? 0
            )}
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

        {/* Trade Performance */}
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Trade Performance</h2>
          <p className="mb-4 text-xs text-gray-500">
            From closed trades on Core. Equity curve = cumulative trade PnL.
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
            <MetricCard
              title="Avg win"
              value={formatCurrency(tradeStats.avgWin)}
            />
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
                    <td colSpan={3} className="p-4 text-gray-400">
                      No trades to summarize
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ML */}
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
            <MetricCard title="Pending Entries" value={pendingEntries ?? "—"} />
            <MetricCard
              title="Confidence Floor"
              value={confidenceFloor ?? "—"}
            />
            <MetricCard
              title="Challenger Mode"
              value={
                challengerMode == null ? "—" : challengerMode ? "Yes" : "No"
              }
            />
            <MetricCard
              title="Last Train"
              value={formatTs(
                mlAutonomy?.lastTrain ?? ml?.autonomy?.lastTrain ?? ml?.lastTrain
              )}
            />
          </div>
          {lastSkipReason && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Autonomy Skip / Last Reason
              </p>
              <p className="mt-1 text-sm text-gray-200">
                {String(lastSkipReason)}
              </p>
            </div>
          )}
        </section>

        {/* Training logs */}
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">ML Training Logs</h2>
          <div className="overflow-x-auto rounded-xl bg-zinc-900 p-5">
            {trainingLogs.length === 0 ? (
              <p className="text-gray-400">
                No training runs yet this session.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {trainingLogs.map((log) => (
                  <li key={log.id} className="text-gray-300">
                    {new Date(log.timestamp).toLocaleString()} —{" "}
                    {log.trained ? "Trained" : log.ok ? "Skipped" : "Failed"} —{" "}
                    {log.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Positions */}
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

        {/* Trades */}
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

        {/* Logs */}
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">System Logs</h2>
          <div className="max-h-80 overflow-y-auto rounded-xl bg-zinc-900 p-5 font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-400">No logs available</p>
            ) : (
              logs.map((log, index) => (
                <p key={index} className="mb-1 text-gray-300">
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
