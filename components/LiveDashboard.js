// components/LiveDashboard.js
"use client";
import { useEffect, useState } from "react";

export default function LiveDashboard() {
  const [state, setState] = useState({
    signals: [],
    trades: [],
    stats: { open: 0, pnl: 0, trades: 0 },
    initMsg: "Connecting...",
  });

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/webhook/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "POLL" }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.state) setState(json.state);
        }
      } catch (e) {
        console.error("Poll failed:", e);
      }
    };
    poll();
    const id = setInterval(poll, 10000); // Every 10 seconds
    return () => clearInterval(id);
  }, []);

  const winRate = state.trades.length > 0
    ? ((state.trades.filter(t => t.pnl > 0).length / state.trades.length) * 100).toFixed(1)
    : 0;

  return (
    <div style={{ padding: "2rem", background: "#0f172a", color: "white", minHeight: "100vh", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: "3rem", textAlign: "center", marginBottom: "0.5rem" }}>
        AlphaStream LIVE
      </h1>
      <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "1.3rem" }}>
        @Kevin_Phan25 • {state.initMsg || "Scanner Active"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", margin: "2rem 0" }}>
        <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold" }}>{state.stats.open}</div>
          <div style={{ color: "#94a3b8" }}>Open Trades</div>
        </div>
        <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold" }}>{winRate}%</div>
          <div style={{ color: "#94a3b8" }}>Win Rate</div>
        </div>
        <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#10b981" }}>
            ${Math.abs(state.stats.pnl).toFixed(2)}
          </div>
          <div style={{ color: "#94a3b8" }}>Total P&L</div>
        </div>
        <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold" }}>{state.stats.trades}</div>
          <div style={{ color: "#94a3b8" }}>Trades</div>
        </div>
      </div>

      <div style={{ background: "#1e293b", padding: "2rem", borderRadius: "16px", marginTop: "2rem" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Live Scanner</h2>
        {state.signals.length === 0 ? (
          <p style={{ textAlign: "center", color: "#f59e0b", fontStyle: "italic" }}>
            No signals yet — waiting for next scan...
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#334155" }}>
                  {["Sym", "Pattern", "Score", "Stop", "Tgt", "Qty"].map(h => (
                    <th key={h} style={{ padding: "1rem", border: "1px solid #475569" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.signals.map((s, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#1e293b" : "#334155" }}>
                    <td style={{ padding: "1rem", textAlign: "center", fontWeight: "bold", fontSize: "1.3rem" }}>{s.s}</td>
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
      </div>
    </div>
  );
}
