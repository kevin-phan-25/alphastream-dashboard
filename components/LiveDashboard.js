// components/LiveDashboard.js
"use client";
import { useEffect, useState } from "react";

export default function LiveDashboard() {
  const [state, setState] = useState({
    signals: [],
    stats: { open: 0, pnl: 0, trades: 0 },
    initMsg: "Connecting..."
  });

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/webhook", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    poll();
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      padding: "3rem",
      background: "#0f172a",
      color: "white",
      minHeight: "100vh",
      fontFamily: "system-ui"
    }}>
      <h1 style={{ fontSize: "4rem", textAlign: "center" }}>ALPHASTREAM LIVE</h1>
      <p style={{ textAlign: "center", color: "#00ff9d", fontSize: "2rem" }}>
        {state.initMsg || "@Kevin_Phan25"}
      </p>
      <div style={{
        fontSize: "3rem",
        textAlign: "center",
        color: "#10b981",
        margin: "2rem 0"
      }}>
        ${Math.abs(state.stats?.pnl || 0).toFixed(2)} P&L
      </div>
      <div style={{
        background: "#1e293b",
        padding: "2rem",
        borderRadius: "16px"
      }}>
        <h2 style={{ fontSize: "2.5rem" }}>LIVE SIGNALS</h2>
        {state.signals?.length === 0 ? (
          <p style={{
            color: "#f59e0b",
            textAlign: "center",
            fontSize: "1.8rem"
          }}>No signals yet...</p>
        ) : (
          <div>
            {state.signals.map((s, i) => (
              <div key={i} style={{
                fontSize: "2.5rem",
                margin: "1rem",
                fontWeight: "bold"
              }}>
                #{i + 1} {s.s} → {s.pattern} ({(s.score * 100).toFixed(0)}%)
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
