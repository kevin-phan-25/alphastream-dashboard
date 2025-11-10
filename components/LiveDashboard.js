// components/LiveDashboard.js
"use client";
import { useEffect, useState } from "react";

export default function LiveDashboard() {
  const [state, setState] = useState({
    signals: [],
    stats: { open: 0, pnl: 0, trades: 0 },
    initMsg: "Connecting to scanner..."
  });

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/webhook/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "POLL" })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.state) setState(json.state);
        }
      } catch (e) { console.error(e); }
    };
    poll();
    const id = setInterval(poll, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a1f3d 0%, #001529 100%)",
      color: "white",
      padding: "3rem",
      fontFamily: "system-ui, sans-serif",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "4.5rem", marginBottom: "1rem" }}>ALPHASTREAM LIVE</h1>
      <p style={{ fontSize: "2rem", color: "#00ff9d", marginBottom: "2rem" }}>
        @Kevin_Phan25 • {new Date().toLocaleString()}
      </p>
      <div style={{ fontSize: "3.5rem", fontWeight: "bold", color: "#10b981" }}>
        ${Math.abs(state.stats.pnl || 0).toFixed(2)} P&L
      </div>

      <div style={{
        marginTop: "3rem",
        background: "rgba(30, 41, 59, 0.8)",
        padding: "2rem",
        borderRadius: "20px",
        display: "inline-block",
        minWidth: "600px"
      }}>
        <h2 style={{ fontSize: "2.5rem", color: "#00ff9d" }}>LIVE GAPPERS</h2>
        {state.signals.length === 0 ? (
          <p style={{ fontSize: "1.8rem", color: "#f59e0b" }}>Waiting for next scan...</p>
        ) : (
          <div>
            {state.signals.map((s, i) => (
              <div key={i} style={{
                fontSize: "2.2rem",
                margin: "1.2rem",
                padding: "1rem",
                background: i === 0 ? "#10b981" : "#1e293b",
                borderRadius: "12px",
                color: i === 0 ? "black" : "white",
                fontWeight: "bold"
              }}>
                #{i + 1} {s.s} → {s.pattern} ({(s.score * 100).toFixed(0)}%)
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ marginTop: "3rem", fontSize: "1.5rem", color: "#94a3b8" }}>
        {state.initMsg}
      </p>
    </div>
  );
}
