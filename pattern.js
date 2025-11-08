import { useEffect, useState } from "react";

export default function LiveDashboard() {
  const [scan, setScan] = useState([]);
  const [stats, setStats] = useState({});
  const [backtest, setBacktest] = useState([]);

  const loadData = async () => {
    try {
      const [scanRes, statsRes, backtestRes] = await Promise.all([
        fetch("/data/scan.json").then(r => r.json()),
        fetch("/data/stats.json").then(r => r.json()),
        fetch("/data/backtest.json").then(r => r.json()),
      ]);
      setScan(scanRes?.data?.signals || []);
      setStats(statsRes?.data || {});
      setBacktest(backtestRes?.data || []);
    } catch (e) {
      console.error("Load error:", e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">AlphaStream Live Dashboard</h1>
      <h2 className="mt-4 font-semibold">Live Scanner</h2>
      <table className="w-full border text-sm">
        <thead>
          <tr><th>Symbol</th><th>Qty</th><th>Stop</th><th>Target</th><th>Pattern</th><th>Score</th></tr>
        </thead>
        <tbody>
          {scan.map((s, i) => (
            <tr key={i}>
              <td>{s.s}</td>
              <td>{s.qty}</td>
              <td>{s.stop.toFixed(2)}</td>
              <td>{s.tgt.toFixed(2)}</td>
              <td>{s.pattern}</td>
              <td>{(s.score * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6">
        <h2 className="font-semibold">Stats</h2>
        <p>Trades: {stats.trades}</p>
        <p>PnL: ${stats.pnl}</p>
      </div>
    </div>
  );
}
