/**
 * Date: 2026-08-29
 * File: src/components/charts/TradePerformanceCharts.tsx
 *
 * Trade performance charts + cumulative PnL equity curve.
 * Interactive tooltips; no extra chart library required.
 */
"use client";

import { useMemo, useState } from "react";

export type TradeLike = {
  pnl?: number;
  PnL?: number;
  timestamp?: string;
  symbol?: string;
  exitReason?: string;
  ExitReason?: string;
};

type Props = {
  byReason: Record<string, { count: number; pnl: number }>;
  wins: number;
  losses: number;
  netPnl: number;
  trades?: TradeLike[];
  startEquity?: number;
};

function sortedReasons(
  byReason: Record<string, { count: number; pnl: number }>
) {
  return Object.entries(byReason)
    .map(([reason, v]) => ({ reason, count: v.count, pnl: v.pnl }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function TooltipBubble({
  show,
  label,
  sub,
}: {
  show: boolean;
  label: string;
  sub?: string;
}) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-xs text-gray-100 shadow-lg">
      <p className="font-medium text-white">{label}</p>
      {sub && <p className="mt-0.5 text-gray-400">{sub}</p>}
    </div>
  );
}

function EquityCurve({
  trades,
  startEquity = 0,
}: {
  trades: TradeLike[];
  startEquity?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const points = useMemo(() => {
    const sorted = [...trades]
      .filter((t) => t.timestamp)
      .sort(
        (a, b) =>
          new Date(a.timestamp || 0).getTime() -
          new Date(b.timestamp || 0).getTime()
      );

    let cum = 0;
    return sorted.map((t, i) => {
      const pnl = Number(t.pnl ?? t.PnL ?? 0);
      cum += pnl;
      return {
        i,
        cum,
        equity: startEquity > 0 ? startEquity + cum : cum,
        pnl,
        ts: t.timestamp || "",
        symbol: t.symbol || "?",
        reason:
          String(t.exitReason ?? t.ExitReason ?? "").split(" ")[0] || "—",
      };
    });
  }, [trades, startEquity]);

  if (points.length < 2) {
    return (
      <p className="text-sm text-gray-500">
        Need at least 2 closed trades with timestamps for an equity curve.
      </p>
    );
  }

  const w = 640;
  const h = 200;
  const pad = { t: 16, r: 16, b: 28, l: 48 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const ys = points.map((p) => (startEquity > 0 ? p.equity : p.cum));
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const ySpan = yMax - yMin || 1;

  const xy = points.map((p, idx) => {
    const x = pad.l + (idx / (points.length - 1)) * innerW;
    const yVal = startEquity > 0 ? p.equity : p.cum;
    const y = pad.t + innerH - ((yVal - yMin) / ySpan) * innerH;
    return { x, y, ...p, yVal };
  });

  const pathD = xy
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaD =
    pathD +
    ` L ${xy[xy.length - 1].x.toFixed(1)} ${(pad.t + innerH).toFixed(1)}` +
    ` L ${xy[0].x.toFixed(1)} ${(pad.t + innerH).toFixed(1)} Z`;

  const last = xy[xy.length - 1];
  const positive = last.yVal >= (startEquity > 0 ? startEquity : 0);
  const hi = hover != null ? xy[hover] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        preserveAspectRatio="none"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.t + innerH * (1 - t);
          return (
            <line
              key={t}
              x1={pad.l}
              x2={w - pad.r}
              y1={y}
              y2={y}
              stroke="#3f3f46"
              strokeWidth={1}
            />
          );
        })}
        <path d={areaD} fill={positive ? "#22c55e18" : "#ef444418"} />
        <path
          d={pathD}
          fill="none"
          stroke={positive ? "#22c55e" : "#ef4444"}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <text
          x={4}
          y={pad.t + 4}
          className="fill-zinc-500"
          style={{ fontSize: 10 }}
        >
          {formatUsd(yMax)}
        </text>
        <text
          x={4}
          y={pad.t + innerH}
          className="fill-zinc-500"
          style={{ fontSize: 10 }}
        >
          {formatUsd(yMin)}
        </text>
        {xy.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === idx ? 5 : 3}
              fill={p.pnl >= 0 ? "#22c55e" : "#ef4444"}
              stroke="#09090b"
              strokeWidth={1}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={12}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHover(idx)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
        {hi && (
          <>
            <line
              x1={hi.x}
              x2={hi.x}
              y1={pad.t}
              y2={pad.t + innerH}
              stroke="#71717a"
              strokeDasharray="3 3"
            />
            <circle
              cx={hi.x}
              cy={hi.y}
              r={6}
              fill="none"
              stroke="#e4e4e7"
              strokeWidth={1.5}
            />
          </>
        )}
      </svg>
      {hi && (
        <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-xs shadow-xl">
          <p className="font-semibold text-white">
            {hi.symbol}{" "}
            <span className={hi.pnl >= 0 ? "text-green-400" : "text-red-400"}>
              {hi.pnl >= 0 ? "+" : ""}
              {hi.pnl.toFixed(2)}
            </span>
          </p>
          <p className="text-gray-400">
            {startEquity > 0 ? "Equity≈" : "Cum PnL"} {formatUsd(hi.yVal)}
          </p>
          <p className="text-gray-500">
            {hi.reason} · {hi.ts ? new Date(hi.ts).toLocaleString() : "—"}
          </p>
        </div>
      )}
      <p className="mt-2 text-center text-[11px] text-gray-500">
        Cumulative closed-trade PnL
        {startEquity > 0
          ? ` (anchored near ${formatUsd(startEquity)})`
          : " from zero"}
        . Hover points for details.
      </p>
    </div>
  );
}

export function TradePerformanceCharts({
  byReason,
  wins,
  losses,
  netPnl,
  trades = [],
  startEquity = 0,
}: Props) {
  const [tip, setTip] = useState<{
    key: string;
    label: string;
    sub?: string;
  } | null>(null);

  const rows = sortedReasons(byReason);
  const maxCount = Math.max(1, ...rows.map((r) => r.count));
  const maxAbsPnl = Math.max(1, ...rows.map((r) => Math.abs(r.pnl)));
  const outcomeTotal = Math.max(1, wins + losses);
  const winPct = (wins / outcomeTotal) * 100;
  const lossPct = (losses / outcomeTotal) * 100;

  if (rows.length === 0 && trades.length < 2) {
    return (
      <p className="rounded-xl bg-zinc-900 p-5 text-sm text-gray-400">
        No closed trades to chart yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-1 text-sm font-semibold text-gray-200">
          Equity curve (from trades)
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Running sum of closed-trade PnL — not a broker snapshot stream.
        </p>
        <EquityCurve trades={trades} startEquity={startEquity} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-1 text-sm font-semibold text-gray-200">
            Exits by reason (count)
          </h3>
          <p className="mb-4 text-xs text-gray-500">Hover a bar for details</p>
          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={r.reason}
                className="relative"
                onMouseEnter={() =>
                  setTip({
                    key: `c-${r.reason}`,
                    label: r.reason,
                    sub: `${r.count} exits · net ${formatUsd(r.pnl)}`,
                  })
                }
                onMouseLeave={() => setTip(null)}
              >
                <TooltipBubble
                  show={tip?.key === `c-${r.reason}`}
                  label={tip?.label || ""}
                  sub={tip?.sub}
                />
                <div className="mb-1 flex justify-between text-xs text-gray-400">
                  <span className="truncate font-medium text-gray-300">
                    {r.reason}
                  </span>
                  <span>{r.count}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${(r.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-1 text-sm font-semibold text-gray-200">
            Net PnL by exit reason
          </h3>
          <p className="mb-4 text-xs text-gray-500">Hover a bar for details</p>
          <div className="space-y-3">
            {rows.map((r) => {
              const width = (Math.abs(r.pnl) / maxAbsPnl) * 100;
              const positive = r.pnl >= 0;
              return (
                <div
                  key={`pnl-${r.reason}`}
                  className="relative"
                  onMouseEnter={() =>
                    setTip({
                      key: `p-${r.reason}`,
                      label: r.reason,
                      sub: `${r.count} trades · ${formatUsd(r.pnl)} net`,
                    })
                  }
                  onMouseLeave={() => setTip(null)}
                >
                  <TooltipBubble
                    show={tip?.key === `p-${r.reason}`}
                    label={tip?.label || ""}
                    sub={tip?.sub}
                  />
                  <div className="mb-1 flex justify-between text-xs text-gray-400">
                    <span className="truncate font-medium text-gray-300">
                      {r.reason}
                    </span>
                    <span
                      className={positive ? "text-green-400" : "text-red-400"}
                    >
                      {r.pnl >= 0 ? "+" : ""}
                      {r.pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${
                        positive ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-200">
                Win / loss split
              </h3>
              <p className="text-xs text-gray-500">
                {wins} wins · {losses} losses · net{" "}
                <span
                  className={netPnl >= 0 ? "text-green-400" : "text-red-400"}
                >
                  {netPnl >= 0 ? "+" : ""}
                  {netPnl.toFixed(2)}
                </span>
              </p>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-green-400">Wins {winPct.toFixed(0)}%</span>
              <span className="text-red-400">Losses {lossPct.toFixed(0)}%</span>
            </div>
          </div>
          <div className="flex h-4 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-green-500"
              style={{ width: `${winPct}%` }}
              title={`${wins} wins`}
            />
            <div
              className="h-full bg-red-500"
              style={{ width: `${lossPct}%` }}
              title={`${losses} losses`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
