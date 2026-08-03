/**
 * ---------------------------------------------------------
 * Date: 2026-08-03
 * File: src/app/dashboard/page.tsx
 *
 * Changes:
 * - Fixed useAlphaStream return mismatch
 * - Removed unsupported loading property
 * - Added connected/error state display
 * - Kept Phase 1 Core dashboard monitoring
 * - Fixed property names to match AlphaStreamStatus
 *   (positionsCount, winRate, drawdownPct/drawdown)
 * - Fixed logs rendering for AlphaStreamLog objects
 * ---------------------------------------------------------
 */

"use client";

import { useAlphaStream } from "@/hooks/useAlphaStream";

export default function DashboardPage() {
  const { status, logs, connected, error, refresh } = useAlphaStream();

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">AlphaStream Dashboard</h1>
          <p className="text-gray-400">Core Service Monitoring</p>
        </div>

        <button
          onClick={refresh}
          className="rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <span className={connected ? "text-green-400" : "text-red-400"}>
          {connected ? "● Core Connected" : "● Core Offline"}
        </span>

        {error && <p className="mt-2 text-red-400">{error}</p>}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Equity" value={status?.equity ?? 0} />

        <MetricCard
          title="Positions"
          value={status?.positionsCount ?? status?.positions ?? 0}
        />

        <MetricCard title="Win Rate" value={`${status?.winRate ?? 0}%`} />

        <MetricCard
          title="Drawdown"
          value={`${status?.drawdownPct ?? status?.drawdown ?? 0}%`}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">System Logs</h2>

        <div className="rounded-xl bg-zinc-900 p-5">
          {logs.length === 0 && (
            <p className="text-gray-400">No logs available</p>
          )}

          {logs.map((log, index) => (
            <p key={typeof log === "string" ? index : log.id ?? index} className="text-sm text-gray-300">
              {typeof log === "string"
                ? log
                : `[${log.level ?? "INFO"}] ${log.timestamp ?? ""} ${log.message ?? ""}`.trim()}
            </p>
          ))}
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
