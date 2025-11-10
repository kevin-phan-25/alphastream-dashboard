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
      padding: "4rem",
      textAlign: "center",
      fontFamily: "system-ui"
    }}>
      <h1 style={{ fontSize: "5rem" }}>ALPHASTREAM LIVE</h1>
      <p style={{ fontSize: "3rem", color: "#00ff9d" }}>@Kevin_Phan25</p>
      <div style={{ fontSize: "4rem", fontWeight: "bold", color: "#10b981" }}>
        ${Math.abs(state.stats.pnl || 0).toFixed(2)} P&L
      </div>
      <div style={{ marginTop: "3rem" }}>
        {state.signals.length === 0 ? (
          <p style={{ fontSize: "2rem", color: "#f59e0b" }}>Waiting for signal...</p>
        ) : (
          state.signals.map((s, i) => (
            <div key={i} style={{ fontSize: "3rem", margin: "1rem", fontWeight: "bold" }}>
              {s.s} → {s.pattern} ({(s.score*100).toFixed(0)}%)
            </div>
          ))
        )}
      </div>
    </div>
  );
}
