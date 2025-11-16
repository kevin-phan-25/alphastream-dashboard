"use client";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Home() {
  const [data, setData] = useState({
    equity: 99998.93,
    positions: 0,
    dailyLoss: 0,
    lastScan: "11:52:29 AM",
    winRate: 0,
    trades: [],
    logs: ["Waiting for data..."],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/data.json?t=" + Date.now());
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {}
    };
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, []);

  const chartData = data.trades
    .slice()
    .reverse()
    .map((t, i) => ({
      name: `T${i + 1}`,
      equity: data.equity + (t.pnl || 0),
    }));

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#0f0f0f",
        color: "white",
        fontFamily: "monospace",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "260px",
          backgroundColor: "#1a1a1a",
          padding: "20px",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#a0a0a0", marginBottom: "12px" }}>Settings</h3>
          <input
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "#333",
              border: "none",
              color: "white",
              borderRadius: "4px",
              marginBottom: "12px",
            }}
            defaultValue="Alphastream"
          />
          <input type="file" accept="image/*" style={{ width: "100%" }} />
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              style={{
                flex: 1,
                padding: "8px",
                backgroundColor: "#333",
                border: "none",
                color: "white",
                borderRadius: "4px",
              }}
            >
              Dark
            </button>
            <button
              style={{
                flex: 1,
                padding: "8px",
                backgroundColor: "#333",
                border: "none",
                color: "white",
                borderRadius: "4px",
              }}
            >
              Light
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#10b981", marginBottom: "12px" }}>Risk Limits</h3>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Daily Loss Cap:{" "}
            <input
              style={{
                width: "60px",
                padding: "4px",
                backgroundColor: "#333",
                border: "none",
                color: "white",
              }}
              defaultValue={300}
            />
          </label>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Max Positions:{" "}
            <input
              style={{
                width: "60px",
                padding: "4px",
                backgroundColor: "#333",
                border: "none",
                color: "white",
              }}
              defaultValue={3}
            />
          </label>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Max Drawdown:{" "}
            <input
              style={{
                width: "60px",
                padding: "4px",
                backgroundColor: "#333",
                border: "none",
                color: "white",
              }}
              defaultValue={15}
            />{" "}
            %
          </label>
        </div>

        <div>
          <h3 style={{ color: "#a0a0a0", marginBottom: "12px" }}>Panels</h3>
          <label style={{ display: "block", marginBottom: "6px" }}>
            <input type="checkbox" defaultChecked /> Equity
          </label>
          <label style={{ display: "block", marginBottom: "6px" }}>
            <input type="checkbox" defaultChecked /> Daily P&L
          </label>
          <label style={{ display: "block", marginBottom: "6px" }}>
            <input type="checkbox" defaultChecked /> Positions
          </label>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "20px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#10b981",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              KP
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "24px" }}>Alphastream</h1>
              <p
                style={{
                  margin: 0,
                  color: "#a0a0a0",
                  fontSize: "14px",
                }}
              >
                @Kevin_Phan25 •{" "}
                {new Date().toLocaleTimeString("en-US", {
                  timeZone: "America/New_York",
                })}{" "}
                EST
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                backgroundColor: "#10b981",
                padding: "8px 16px",
                borderRadius: "9999px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              {data.winRate}% Win Rate
            </div>
            <button
              style={{
                padding: "8px 16px",
                backgroundColor: "#333",
                border: "none",
                color: "white",
                borderRadius: "4px",
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {[
            { label: "Equity", value: `$ ${data.equity.toLocaleString()}` },
            { label: "Positions", value: `${data.positions}/3` },
            { label: "Daily Loss", value: `$ ${data.dailyLoss}/300` },
            { label: "Last Scan", value: data.lastScan },
          ].map((m, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#1a1a1a",
                padding: "16px",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <div style={{ color: "#a0a0a0", fontSize: "14px" }}>{m.label}</div>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Equity Curve */}
        <div
          style={{
            backgroundColor: "#1a1a1a",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ color: "#10b981" }}>Equity Curve</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "none", color: "white" }}
              />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Live Activity */}
        <div
          style={{
            backgroundColor: "#1a1a1a",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ color: "#10b981" }}>Live Activity</span>
          </h3>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {data.logs.map((log, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #333",
                  color: "#a0a0a0",
                }}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
