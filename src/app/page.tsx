'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Zap } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: 100000, unrealized: 0, positions: 0, mode: "LOADING",
    rockets: [], winRate: "0.0", trades: 0, logs: []
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(URL, { timeout: 10000 });
      const m = res.data;

      const equity = parseInt(m.equity.replace(/[^0-9]/g, "")) || 100000;
      const unrealized = parseInt(m.unrealized?.replace(/[^0-9-]/g, "") || "0");
      const winRate = m.winRate?.replace("%", "") || "0.0";
      const totalTrades = m.trades || 0;

      setData({
        equity, unrealized,
        positions: m.positions || 0,
        mode: m.mode || "PAPER",
        rockets: m.rockets || [],
        winRate,
        totalTrades,
        logs: m.logs || []
      });
    } catch (e) { console.error("Dashboard fetch failed", e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 7000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    try { await axios.post(`${URL}/scan`); } catch {}
    setTimeout(() => setScanning(false), 8000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-14 h-14 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b-4 border-purple-600">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            AlphaStream v101
          </h1>
          <div className="flex items-center gap-6">
            <span className={`px-5 py-2 rounded-full text-lg font-bold ${data.mode === "LIVE" ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
              {data.mode}
            </span>
            <div className="text-right">
              <div className="text-xs text-gray-400">WIN RATE</div>
              <div className="text-3xl font-black text-yellow-400">
                {data.winRate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="pt-20 px-4 max-w-5xl mx-auto space-y-5 pb-24">
        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-purple-900/50 backdrop-blur rounded-xl p-5 border-2 border-purple-500 text-center">
            <p className="text-2xl font-bold">${data.equity.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Equity</p>
          </div>
          <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 border-2 ${data.unrealized >= 0 ? 'border-green-500' : 'border-red-500'} text-center`}>
            <p className={`text-2xl font-bold ${data.unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.unrealized >= 0 ? '+' : '-'}${Math.abs(data.unrealized).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Unrealized</p>
          </div>
          <div className="bg-orange-900/50 rounded-xl p-5 border-2 border-orange-500 text-center">
            <p className="text-2xl font-bold">{data.totalTrades}</p>
            <p className="text-xs text-gray-400">Trades</p>
          </div>
          <div className="bg-cyan-900/50 rounded-xl p-5 border-2 border-cyan-500 text-center">
            <p className="text-2xl font-bold">{data.positions}</p>
            <p className="text-xs text-gray-400">Positions</p>
          </div>
        </div>

        {/* ROCKETS */}
        {data.rockets.length > 0 && (
          <div className="bg-gray-900/80 rounded-xl p-5 border-2 border-yellow-500">
            <h3 className="text-xl font-bold text-yellow-400 mb-4 text-center flex items-center justify-center gap-3">
              <Zap className="w-7 h-7" />
              LAST ROCKETS
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {data.rockets.slice(0, 12).map((r: string, i: number) => {
                const [sym, gain] = r.split(' ');
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-800 to-pink-800 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">{sym}</div>
                    <div className="text-green-400 text-sm">{gain}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LOGS */}
        <div className="bg-gray-900/90 rounded-xl p-4 border-2 border-green-600">
          <h3 className="text-sm font-bold text-green-400 mb-2">LIVE LOGS</h3>
          <div className="bg-black/80 rounded-lg p-3 h-64 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-gray-600">Waiting for action...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN BUTTON */}
        <div className="text-center pt-4">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-24 py-8 text-3xl font-black rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all shadow-2xl border-4 border-purple-400 disabled:opacity-60"
          >
            <RefreshCw className={`inline-block w-12 h-12 mr-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>
    </div>
  );
}
