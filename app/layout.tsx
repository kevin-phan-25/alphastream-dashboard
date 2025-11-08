// components/LiveDashboard.js
"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function LiveDashboard() {
  const [state, setState] = useState({
    signals: [],
    trades: [],
    stats: { open: 0, pnl: 0, trades: 0 },
    backtests: [],
    equityCurve: []
  });

  // Poll every 15 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "POLL" }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.state) setState(json.state);
        }
      } catch (e) {
        console.error("Poll error:", e);
      }
    };

    poll();
    const id = setInterval(poll, 15_000);
    return () => clearInterval(id);
  }, []);

  const winRate =
    state.trades.length > 0
      ? ((state.trades.filter((t) => t.pnl > 0).length / state.trades.length) * 100).toFixed(1)
      : 0;

  return (
    <div style={{ padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>AlphaStream v3.1</h1>
      <p style={{ marginBottom: "1rem", color: "#555" }}>
        Gap & Go + Full Risk + Backtested | <strong>Live</strong>
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div><strong>{state.stats.open}</strong> Open</div>
        <div><strong>{winRate}%</strong> Win Rate</div>
        <div><strong>${state.stats.pnl.toFixed(2)}</strong> Total P&L</div>
        <div><strong>{state.stats.trades}</strong> Trades</div>
      </div>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Live Scanner</h2>
        {state.signals.length === 0 ? (
          <p>No signals yet...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Sym</th>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Pattern</th>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Score</th>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Stop</th>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Tgt</th>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {state.signals.map((s, i) => (
                <tr key={i}>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    {s.s}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    {s.pattern}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    {s.score}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    ${s.stop?.toFixed?.(2) ?? "-"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    ${s.tgt?.toFixed?.(2) ?? "-"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    {s.qty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Recent Trades</h2>
        {state.trades.length === 0 ? (
          <p>No trades yet</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Sym</th>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Qty</th>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {state.trades.slice(-5).map((t, i) => (
                <tr key={i}>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    {t.sym ?? t.s}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    {t.qty}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    {new Date(t.time).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Equity Curve (Live + Backtest)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={state.equityCurve}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickFormatter={(v) => new Date(v).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(v) => new Date(v).toLocaleString()}
              formatter={(value) => `$${Number(value).toFixed(2)}`}
            />
            <Legend />
            <Line type="monotone" dataKey="pnl" stroke="#8884d8" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section>
        <h2>Backtest Results</h2>
        {state.backtests.length === 0 ? (
          <p>No backtest data yet</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Date</th>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Sym</th>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>PnL</th>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Win</th>
                <th style={{ border: "1px solid #ddd", padding: "0.5rem" }}>Pattern</th>
              </tr>
            </thead>
            <tbody>
              {state.backtests.map((row, i) => (
                <tr key={i}>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    {row[0]}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    {row[1]}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    ${row[4]}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    {row[6]}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "0.5rem", textAlign: "center" }}>
                    {row[10]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
