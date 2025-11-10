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
    equityCurve: [],
  });

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/webhook/route", {  // ← FIXED: WAS /api/webhook
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
    const id = setInterval(poll, 10_000); // Every 10s for faster feedback
    return () => clearInterval(id);
  }, []);

  const winRate = state.trades.length > 0
    ? ((state.trades.filter((t) => t.pnl > 0).length / state.trades.length) * 100).toFixed(1)
    : 0;

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", background: "#0f172a", color: "white", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", textAlign: "center" }}>AlphaStream v3.1 LIVE</h1>
      <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "1.2rem" }}>
        @Kevin_Phan25 • Gap & Go Scanner •{" "}
        <strong style={{ color: state.signals.length ? "#10b981" : "#f59e0b" }}>
          {state.signals.length ? "LIVE • Receiving Data" : "Connecting..."}
        </strong>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem", margin: "2rem 0" }}>
        <div style={{ background: "#1e293b", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{state.stats.open}</div>
          <div style={{ color: "#94a3b8" }}>Open Trades</div>
        </div>
        <div style={{ background: "#1e293b", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{winRate}%</div>
          <div style={{ color: "#94a3b8" }}>Win Rate</div>
        </div>
        <div style={{ background: "#1e293b", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>${state.stats.pnl.toFixed(2)}</div>
          <div style={{ color: "#94a3b8" }}>Total P&L</div>
        </div>
        <div style={{ background: "#1e293b", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{state.stats.trades}</div>
          <div style={{ color: "#94a3b8" }}>Total Trades</div>
        </div>
      </div>

      {/* Live Scanner Table */}
      <section style={{ marginBottom: "3rem", background: "#1e293b", padding: "1.5rem", borderRadius: "12px" }}>
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.8rem" }}>Live Scanner</h2>
        {state.signals.length === 0 ? (
          <p style={{ textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>Waiting for first scan...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#334155" }}>
                  <th style={{ padding: "1rem", border: "1px solid #475569" }}>Sym</th>
                  <th style={{ padding: "1rem", border: "1px solid #475569" }}>Pattern</th>
                  <th style={{ padding: "1rem", border: "1px solid #475569" }}>Score</th>
                  <th style={{ padding: "1rem", border: "1px solid #475569" }}>Stop</th>
                  <th style={{ padding: "1rem", border: "1px solid #475569" }}>Tgt</th>
                  <th style={{ padding: "1rem", border: "1px solid #475569" }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {state.signals.map((s, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#1e293b" : "#334155" }}>
                    <td style={{ padding: "1rem", textAlign: "center", fontWeight: "bold", fontSize: "1.2rem" }}>{s.s}</td>
                    <td style={{ padding: "1rem", textAlign: "center", color: "#10b981" }}>{s.pattern}</td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>{(s.score * 100).toFixed(0)}%</td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>${Number(s.stop).toFixed(2)}</td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>${Number(s.tgt).toFixed(2)}</td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>{s.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Equity Curve */}
      {state.equityCurve.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>Equity Curve</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={state.equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tickFormatter={(v) => new Date(v).toLocaleTimeString()} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} formatter={(v) => `$${Number(v).toFixed(2)}`} />
              <Line type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  );
}
