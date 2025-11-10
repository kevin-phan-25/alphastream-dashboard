// components/LiveDashboard.js
"use client";
import { useEffect, useState } from "react";

export default function LiveDashboard() {
  const [state, setState] = useState({
    signals: [],
    stats: { open: 0, pnl: 0, trades: 0 },
    initMsg: "LIVE"
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
      padding: "4rem 2rem",
      fontFamily: "system-ui, sans-serif",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "5rem", marginBottom: "1rem" }}>ALPHASTREAM LIVE</h1>
      <p style={{ fontSize: "2.5rem", color: "#00ff9d" }}>
        @Kevin_Phan25 • {new Date().toLocaleTimeString()}
      </p>
      <div style={{ fontSize: "4rem", fontWeight: "bold", color: "#10b981", margin: "2rem 0" }}>
        ${Math.abs(state.stats.pnl || 0).toFixed(2)} P&L
      </div>

      <div style={{
        background: "rgba(255,255,255,0.05)",
        padding: "3rem",
        borderRadius: "24px",
        display: "inline-block",
        minWidth: "700px",
        backdropFilter: "blur(10px)"
      }}>
        <h2 style={{ fontSize: "3rem", color: "#00ff9d", marginBottom: "2rem" }}>LIVE SCANNER</h2>
        {state.signals.length === 0 ? (
          <p style={{ fontSize: "2rem", color: "#f59e0b" }}>Waiting for signal...</p>
        ) : (
          state.signals.map((s, i) => (
            <div key={i} style={{
              fontSize: "3rem",
              margin: "1.5rem",
              padding: "1.5rem",
              background: i === 0 ? "#10b981" : "#1e40af",
              borderRadius: "16px",
              fontWeight: "bold",
              color: i === 0 ? "black" : "white"
            }}>
              #{i+1} {s.s} → {s.pattern} ({(s.score*100).toFixed(0)}%)
            </div>
          ))
        )}
      </div>

      <p style={{ marginTop: "3rem", fontSize: "2rem", color: "#94a3b8" }}>
        {state.initMsg}
      </p>
    </div>
  );
}
