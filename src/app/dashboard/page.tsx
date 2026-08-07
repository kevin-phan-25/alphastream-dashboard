"use client";

import { useAlphaStream } from "@/hooks/useAlphaStream";
import type { AlphaStreamLog } from "@/types/alphastream";

export default function DashboardPage() {
  const {
    status,
    metrics,
    positions,
    trades,
    logs,
    connected,
    error,
    loading,
    refresh,
  } = useAlphaStream();

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AlphaStream Dashboard</h1>
          <p className="text-gray-400">Core Service Monitoring</p>
        </div>
        <button
          onClick={refresh}
          className="rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        <span className={connected ? "text-green-400" : "text-red-400"}>
          {connected ? "● Core Connected" : "● Core Offline"}
        </span>
        {error && <p className="mt-2 text-red-400">{error}</p>}
      </div>

      {/* Key Metrics */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          value={`${(status?.winRate ?? metrics?.winRate ?? 0).toFixed(1)}%`}
        />
        <MetricCard
          title="Drawdown"
          value={`${(
            status?.drawdownPct ??
            status?.drawdown ??
            metrics?.drawdownPct ??
            metrics?.drawdown ??
            0
          ).toFixed(2)}%`}
        />
      </section>

      {/* Extra metrics row */}
      <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          title="Peak Equity"
          value={formatCurrency(status?.peakEquity ?? metrics?.peakEquity ?? 0)}
        />
        <MetricCard
          title="Buying Power"
          value={formatCurrency(status?.buyingPower ?? metrics?.buyingPower ?? 0)}
        />
        <MetricCard
          title="Total Trades"
          value={status?.totalTrades ?? metrics?.totalTrades ?? trades.length ?? 0}
        />
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
                  <th className="p-4">Qty</th>
                  <th className="p-4">Avg Entry</th>
                  <th className="p-4">Market Value</th>
                  <th className="p-4">Unrealized P&L</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => (
                  <tr key={pos.symbol} className="border-b border-zinc-800">
                    <td className="p-4 font-medium">{pos.symbol}</td>
                    <td className="p-4">{pos.qty}</td>
                    <td className="p-4">{formatCurrency(pos.avgEntryPrice)}</td>
                    <td className="p-4">
                      {formatCurrency(pos.marketValue ?? 0)}
                    </td>
                    <td
                      className={`p-4 ${
                        (pos.unrealizedPnl ?? pos.unrealizedPL ?? 0) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatCurrency(
                        pos.unrealizedPnl ?? pos.unrealizedPL ?? 0
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Recent Trades */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Recent Trades</h2>
        <div className="overflow-x-auto rounded-xl bg-zinc-900">
          {trades.length === 0 ? (
            <p className="p-5 text-gray-400">No trades yet</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-700 text-gray-400">
                <tr>
                  <th className="p-4">Time</th>
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Side</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Price</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 20).map((t, i) => (
                  <tr key={t.id ?? i} className="border-b border-zinc-800">
                    <td className="p-4 text-gray-400">
                      {new Date(t.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium">{t.symbol}</td>
                    <td
                      className={`p-4 ${
                        t.side === "BUY" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {t.side}
                    </td>
                    <td className="p-4">{t.qty}</td>
                    <td className="p-4">{formatCurrency(t.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* System Logs */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">System Logs</h2>
        <div className="max-h-96 overflow-y-auto rounded-xl bg-zinc-900 p-5 font-mono text-sm">
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
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}
