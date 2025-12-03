'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Terminal, Trophy, Zap } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: 100000, unrealized: 0, positions: 0, mode: "LOADING",
    rockets: [], winRate: "0.0", trades: 0, logs: []
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app"; // ← your URL

  const fetchData = async () => {
    try {
      const [main, perf] = await Promise.all([
        axios.get(URL, { timeout: 12000 }),
        axios.get(URL + "/performance", { timeout: 12000 }).catch(() => ({ data: {} }))
      ]);
      const m = main.data;
      const equity = parseInt(m.equity.replace(/[^0-9]/g, "")) || 100000;
      const unrealized = parseInt(m.unrealized?.replace(/[^0-9-]/g, "") || "0");
      const winRate = m.winRate || "0.0";
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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 8000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    try { await axios.post(`${URL}/scan`); } catch {}
    setTimeout(() => setScanning(false), 10000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-16 h-16 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-b-2 border-purple-600">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            AlphaStream v101 — FINAL
          </h1>
          <div className="flex gap-4 items-center">
            <span className={`px-5 py-2 rounded-full text-lg font-bold ${data.mode === "LIVE" ? "bg-red-600 animate-pulse" : "bg-gradient-to-r from-emerald-500 to-cyan-600"}`}>
              {data.mode}
            </span>
            <div className="text-right">
              <div className="text-xs text-gray-400">Win Rate</div>
              <div className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <Trophy className="w-7 h-7" />
                {data.winRate}%
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 max-w-4xl mx-auto space-y-6 pb-24">
        <div className="text-center">
          <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-red-500 to-pink-600 bg-clip-text text-transparent">
            SELF-TUNING SNIPER ACTIVE
          </h2>
          <p className="text-gray-400 mt-2">Real trades • Real win-rate • No hard-coding</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-2xl p-5 border-2 border-purple-500 text-center">
            <p className="text-3xl font-bold text-purple-400">${data.equity.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Equity</p>
          </div>
          <div className={`bg-white/10 rounded-2xl p-5 border-2 ${data.unrealized >= 0 ? 'border-green-500' : 'border-red-500'} text-center`}>
            <p className={`text-3xl font-bold ${data.unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.unrealized >= 0 ? '+' : '-'}${Math.abs(data.unrealized).toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">Unrealized</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 border-2 border-yellow-500 text-center">
            <p className="text-3xl font-bold text-yellow-400">{data.totalTrades || 0}</p>
            <p className="text-sm text-gray-400">Total Trades</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 border-2 border-orange-500 text-center">
            <p className="text-3xl font-bold text-orange-400">{data.positions}</p>
            <p className="text-sm text-gray-400">Open Positions</p>
          </div>
        </div>

        <div className="bg-black/70 rounded-2xl p-5 border-2 border-green-500">
          <div className="flex items-center gap-3 mb-3">
            <Terminal className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-bold text-green-400">LIVE LOGS</h3>
          </div>
          <div className="bg-black/80 rounded-xl p-4 h-80 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs.length > 0 ? data.logs.map((log: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0">{log}</div>
            )) : <div className="text-gray-500 italic">Waiting for first rocket...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {data.rockets.length > 0 && (
          <div className="bg-black/60 rounded-2xl p-5 border-2 border-yellow-500">
            <h3 className="text-xl font-bold text-yellow-400 text-center mb-4 flex items-center justify-center gap-3">
              <Zap className="w-8 h-8" />
              LAST ROCKETS FIRED
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.rockets.slice(0, 8).map((r: string, i: number) => {
                const [sym, gain, pattern] = r.split(' ');
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-800 to-pink-800 rounded-xl p-4 text-center border-2 border-yellow-500">
                    <p className="text-2xl font-bold">{sym}</p>
                    <p className="text-xl text-green-400">{gain}</p>
                    {pattern && <p className="text-sm text-cyan-300 mt-1">{pattern.replace(/[[\]]/g, '')}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center pt-8">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-32 py-10 text-4xl font-black rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:scale-105 transition-all shadow-2xl border-8 border-purple-400 flex items-center gap-8 mx-auto disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-14 h-14 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>
    </div>
  );
}
