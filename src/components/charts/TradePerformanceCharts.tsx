"use client";
import { memo, useMemo, useState } from "react";
import type { Trade } from "@/types/alphastream";
import { cumulativePnl, summarizeTrades } from "@/lib/performance";

export const TradePerformanceCharts = memo(function TradePerformanceCharts({
  trades,
}: {
  trades: Trade[];
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const points = useMemo(() => cumulativePnl(trades), [trades]);
  const stats = useMemo(() => summarizeTrades(trades), [trades]);
  const values = [0, ...points.map((point) => point.value)];
  const low = Math.min(...values),
    high = Math.max(...values);
  const span = high - low || 1;
  const y = (value: number) => 170 - ((value - low) / span) * 140;
  const x = (index: number) => 54 + (index / Math.max(1, points.length)) * 640;
  const path = values
    .map((value, index) => `${index ? "L" : "M"}${x(index)},${y(value)}`)
    .join(" ");
  const active =
    (selected !== null ? points[selected] : undefined) ??
    points[points.length - 1];
  const money = (value: number) =>
    value.toLocaleString("en-US", { style: "currency", currency: "USD" });
  return (
    <div className="chart-grid">
      <section className="panel pnl-chart">
        <div className="panel-heading">
          <div>
            <h3>Cumulative realized PnL</h3>
            <p>Closed trades in the selected period · starts at $0</p>
          </div>
          <strong
            className={(active?.value ?? 0) >= 0 ? "positive" : "negative"}
          >
            {active ? money(active.value) : "—"}
          </strong>
        </div>
        {points.length ? (
          <>
            <svg
              viewBox="0 0 720 200"
              role="img"
              aria-label="Cumulative realized profit and loss, starting at zero"
            >
              {[low, low + span / 2, high].map((value, i) => (
                <g key={i}>
                  <line
                    x1="54"
                    x2="694"
                    y1={y(value)}
                    y2={y(value)}
                    stroke="#243138"
                    strokeDasharray="4 5"
                  />
                  <text x="0" y={y(value) + 4} fill="#8d9da6" fontSize="10">
                    {money(value)}
                  </text>
                </g>
              ))}
              <path d={path} fill="none" stroke="#5ee4bd" strokeWidth="2.5" />
              {points.map((point, index) => (
                <circle
                  key={index}
                  cx={x(index + 1)}
                  cy={y(point.value)}
                  r={selected === index ? 5 : 3}
                  fill="#5ee4bd"
                  tabIndex={0}
                  role="button"
                  aria-label={`${point.trade.symbol}: cumulative ${money(point.value)}`}
                  onFocus={() => setSelected(index)}
                  onMouseEnter={() => setSelected(index)}
                  onClick={() => setSelected(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(index);
                    }
                  }}
                >
                  <title>
                    {point.trade.symbol}: {money(point.value)}
                  </title>
                </circle>
              ))}
            </svg>
            <p className="chart-caption">
              {active?.trade.symbol} ·{" "}
              {active?.trade.timestamp
                ? new Date(active.trade.timestamp).toLocaleString()
                : "—"}{" "}
              · {points.length} dated outcomes
            </p>
          </>
        ) : (
          <div className="empty">No dated, closed-trade outcomes to chart.</div>
        )}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Trade outcomes</h3>
            <p>Includes breakeven trades</p>
          </div>
        </div>
        <div className="outcome-bar" aria-hidden="true">
          {[
            { n: stats.wins, color: "#5ee4bd" },
            { n: stats.losses, color: "#fb7185" },
            { n: stats.breakeven, color: "#83959e" },
          ].map((item, i) => (
            <span
              key={i}
              style={{
                width: `${stats.n ? (item.n / stats.n) * 100 : 0}%`,
                background: item.color,
              }}
            />
          ))}
        </div>
        <dl className="detail-list">
          <div>
            <dt>Wins</dt>
            <dd className="positive">{stats.wins}</dd>
          </div>
          <div>
            <dt>Losses</dt>
            <dd className="negative">{stats.losses}</dd>
          </div>
          <div>
            <dt>Breakeven</dt>
            <dd>{stats.breakeven}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
});
