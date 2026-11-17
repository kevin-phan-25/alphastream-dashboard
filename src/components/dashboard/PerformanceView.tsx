"use client";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowDownToLine, Database } from "lucide-react";
import type { Trade } from "@/types/alphastream";
import {
  MAG7,
  filterTrades,
  summarizeTrades,
  tradesCsv,
} from "@/lib/performance";
import { money, number, percent } from "@/lib/display";
import { Panel, Stat, Empty } from "./primitives";
import { TradeTable } from "./tables";
import { TradePerformanceCharts } from "@/components/charts/TradePerformanceCharts";
export default function PerformanceView({
  trades,
  tradeKnown,
  freshness,
}: {
  trades: Trade[];
  tradeKnown: boolean;
  freshness: ReactNode;
}) {
  const [symbol, setSymbol] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const rangeInvalid = Boolean(from && to && from > to);
  const filtered = useMemo(
    () => (rangeInvalid ? [] : filterTrades(trades, symbol, from, to)),
    [trades, symbol, from, to, rangeInvalid],
  );
  const stats = useMemo(() => summarizeTrades(filtered), [filtered]);
  function exportTrades() {
    const blob = new Blob([tradesCsv(filtered)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `alphastream-${symbol.toLowerCase()}-${from || "start"}-${to || "latest"}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <div className="filter-bar">
        <label>
          Symbol
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            <option value="ALL">All symbols</option>
            {Array.from(new Set([...MAG7, ...trades.map((t) => t.symbol)])).map(
              (ticker) => (
                <option key={ticker}>{ticker}</option>
              ),
            )}
          </select>
        </label>
        <label>
          From (UTC)
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Through (UTC)
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className="button button-quiet"
          onClick={() => {
            setSymbol("ALL");
            setFrom("");
            setTo("");
          }}
        >
          Reset
        </button>
        <button
          className="button export-button"
          onClick={exportTrades}
          disabled={!filtered.length || rangeInvalid}
        >
          <ArrowDownToLine size={15} />
          Export CSV
        </button>
      </div>
      {rangeInvalid && (
        <p className="negative" role="alert">
          The start date must be on or before the end date.
        </p>
      )}
      <p className="coverage-note">
        <Database size={14} />
        {tradeKnown
          ? `${trades.length} retained closed trades · ${filtered.length} selected · Core retains up to 500`
          : "Trade history unavailable"}
        {stats.excluded > 0
          ? ` · ${stats.excluded} outcomes excluded because PnL is missing or invalid`
          : ""}
      </p>
      {freshness}
      <div className="stats-grid">
        <Stat
          label="Realized PnL"
          value={money(stats.netPnl)}
          tone={
            stats.netPnl != null && stats.netPnl < 0 ? "negative" : "positive"
          }
        />
        <Stat
          label="Win rate"
          value={percent(stats.winRate)}
          note={`${stats.wins} wins / ${stats.n} valid outcomes`}
        />
        <Stat label="Expectancy per trade" value={money(stats.expectancy)} />
        <Stat
          label="Average win / average loss"
          value={
            stats.payoffRatio === null
              ? "—"
              : `${number(stats.payoffRatio)} : 1`
          }
          note="Observed payoff ratio"
        />
      </div>
      <TradePerformanceCharts
        key={`${symbol}-${from}-${to}`}
        trades={filtered}
      />
      <div className="two-columns">
        <Panel
          title="Exit reasons"
          subtitle="Selected trades with valid realized PnL"
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>Count</th>
                  <th>Net PnL</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.byReason)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([reason, value]) => (
                    <tr key={reason}>
                      <td>{reason.replace(/_/g, " ")}</td>
                      <td>{value.count}</td>
                      <td className={value.pnl < 0 ? "negative" : "positive"}>
                        {money(value.pnl)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!stats.n && <Empty>No outcomes in this selection.</Empty>}
        </Panel>
        <Panel title="Performance context" subtitle="Coverage and accounting">
          <dl className="detail-list">
            <div>
              <dt>Average win</dt>
              <dd>{money(stats.avgWin)}</dd>
            </div>
            <div>
              <dt>Average loss</dt>
              <dd>{money(stats.avgLoss)}</dd>
            </div>
            <div>
              <dt>Reported exit fees</dt>
              <dd>{money(stats.fees)}</dd>
            </div>
          </dl>
          <p className="footnote">
            Core’s realized PnL includes allocated entry fees and exit fees.
            Reported exit fees are shown separately and are not subtracted
            again.
          </p>
          <p className="footnote">
            This is retained trade history, not a complete account ledger.
            Historical account-equity snapshots and cash-flow-adjusted returns
            are not available.
          </p>
        </Panel>
      </div>
      <Panel
        title="Closed-trade ledger"
        subtitle="All trades in the current selection"
      >
        <TradeTable trades={filtered} known={tradeKnown} />
      </Panel>
    </>
  );
}
