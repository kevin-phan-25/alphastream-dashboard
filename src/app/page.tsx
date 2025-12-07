'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Brain, Zap, Activity } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: 100000, unrealized: 0, positions: 0, mode: "LOADING",
    rockets: [], winRate: "0.0", totalTrades: 0, logs: [], brain: {}
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetch = async () => {
    try {
      const res = await axios.get(URL, { timeout: 8000 });
      const d = res.data;
      setData({
        equity: parseInt(d.equity?.replace(/[^0-9]/g, "") || "100000"),
        unrealized: parseInt((d.unrealized || "0").replace(/[^0-9-]/g, "")) * (d.unrealized?.includes('-') ? -1 : 1),
        positions: d.positions || 0,
        mode: d.mode || "PAPER",
        rockets: d.rockets || [],
        winRate: d.winRate?.replace("%", "") || "0.0",
        totalTrades: d.totalTrades || 0,
        logs: d.logs || [],
        brain: d.brain || {}
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); const i = setInterval(fetch, 8000); return () => clearInterval(i); }, []);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    try { await axios.post(`${URL}/scan`); } catch {}
    setTimeout(() => setScanning(false), 6000);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Activity className="w-10 h-10 text-purple-500 animate-spin" />
    </div>
  );

  const live = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur border-b border-purple-600">
        <div className="max-w-2xl mx-auto px-4 py-2 flex justify-between items-center text-sm">
          <h1 className="font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            AlphaStream v400
          </h1>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${live ? "bg-red-600" : "bg-emerald-600"}`}>
              {data.mode}
            </span>
            <div className="text-right">
              <div className="text-xs text-gray-400">AI WinRate</div>
              <div className="font-black text-yellow-400">{data.winRate}%</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16 px-4 max-w-2xl mx-auto space-y-4 pb-24">
        {/* Equity */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-5 text-center border border-purple-600">
          <p className="text-3xl font-black">${data.equity.toLocaleString()}</p>
          <p className={`text-lg font-bold ${data.unrealized >= 0 ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized >= 0 ? "+" : ""}${Math.abs(data.unrealized).toLocaleString()}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-gray-900/80 rounded-lg p-3 border border-purple-600">
            <p className="text-xl font-bold">{data.totalTrades}</p>
            <p className="text-xs text-gray-400">Trades</p>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-cyan-600">
            <p className="text-xl font-bold">{data.positions}</p>
            <p className="text-xs text-gray-400">Live</p>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-yellow-600">
            <p className="text-xl font-bold">{data.rockets.length}</p>
            <p className="text-xs text-gray-400">Rockets</p>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-pink-600">
            <p className="text-xl font-bold">{data.winRate}%</p>
            <p className="text-xs text-gray-400">WinRate</p>
          </div>
        </div>

        {/* Rockets */}
        {data.rockets.length > 0 && (
          <div className="bg-gray-900/90 rounded-xl p-4 border border-yellow-600">
            <h3 className="text-sm font-bold text-yellow-400 mb-2 text-center flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> LAST ROCKETS
            </h3>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {data.rockets.slice(0, 10).map((r: string, i: number) => {
                const [sym, gain] = r.split(' ');
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-900 to-pink-900 rounded p-2">
                    <div className="font-bold">{sym}</div>
                    <div className="text-green-400">{gain}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Brain */}
        <div className="bg-gray-900/90 rounded-xl p-4 border border-cyan-600 text-xs">
          <h3 className="font-bold text-cyan-400 mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4" /> AI BRAIN
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>Conf: {(data.brain.minConfidence || 0.78).toFixed(2)}</div>
            <div>Risk: {((data.brain.riskPct || 0.03) * 100).toFixed(1)}%</div>
            <div>Max Pos: {data.brain.maxPositions || 5}</div>
            <div>TP: {(data.brain.tpMultiplier || 1.15).toFixed(2)}×</div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-900/90 rounded-xl p-4 border border-green-700">
          <h3 className="text-xs font-bold text-green-400 mb-2">Live Logs</h3>
          <div className="bg-black/70 rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-gray-600">Waiting for market open...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Force Scan */}
        <div className="text-center pt-4">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-12 py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all border-2 border-purple-500 disabled:opacity-60"
          >
            <RefreshCw className={`inline w-5 h-5 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>
    </div>
  );
}
