'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Terminal } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: 100000, unrealized: 0, positions: 0, mode: "LOADING",
    rockets: ["Connecting..."], winRate: 0, logs: []
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const [main, perf] = await Promise.all([
        axios.get(URL, { timeout: 12000 }),
        axios.get(URL + "/performance", { timeout: 12000 }).catch(() => ({ data: { stats: {} } }))
      ]);
      const m = main.data;
      const equity = parseInt(m.equity.replace(/[^0-9]/g, "")) || 100000;
      const unrealized = parseInt(m.unrealized?.replace(/[^0-9-]/g, "") || "0");
      const winRate = parseFloat(perf.data.stats.winRate || "0") || 0;

      setData({
        equity, unrealized,
        positions: m.positions || 0,
        mode: m.mode || "PAPER",
        rockets: m.rockets || [],
        winRate,
        logs: m.logs || []
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 8000); return () => clearInterval(i); }, []);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    try { await axios.post(`${URL}/scan`); } catch {}
    setTimeout(() => setScanning(false), 10000);
  };

  if (loading && data.equity === 100000) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <Activity className="w-12 h-12 text-purple-500 animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-b-2 border-purple-600">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex justify-between items-center">
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            AlphaStream v100 ELITE
          </h1>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${data.mode === "LIVE" ? "bg-red-600" : "bg-gradient-to-r from-emerald-500 to-cyan-600"}`}>
            {data.mode}
          </span>
        </div>
      </header>

      <main className="pt-16 px-4 max-w-4xl mx-auto space-y-5 pb-20">
        <h2 className="text-2xl font-black text-center bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
          ELITE SNIPER ACTIVE
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/10 rounded-xl p-4 border-2 border-purple-500 text-center">
            <p className="text-2xl font-bold text-purple-400">${data.equity.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Equity</p>
          </div>
          <div className={`bg-white/10 rounded-xl p-4 border-2 ${data.unrealized >= 0 ? 'border-green-500' : 'border-red-500'} text-center`}>
            <p className={`text-2xl font-bold ${data.unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.unrealized >= 0 ? '+' : '-'}${Math.abs(data.unrealized).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Unrealized</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border-2 border-yellow-500 text-center">
            <p className="text-2xl font-bold text-yellow-400">{data.winRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">Win Rate</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border-2 border-orange-500 text-center">
            <p className="text-2xl font-bold text-orange-400">{data.positions}</p>
            <p className="text-xs text-gray-400 mt-1">Positions</p>
          </div>
        </div>

        <div className="bg-black/70 rounded-xl p-4 border-2 border-green-500">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-bold text-green-400">LIVE LOGS</h3>
          </div>
          <div className="bg-black/80 rounded-lg p-3 h-64 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs.length > 0 ? data.logs.map((log: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0">{log}</div>
            )) : <div className="text-gray-500 italic">Waiting for action...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {data.rockets[0] !== "Scanning..." && data.rockets.length > 0 && (
          <div className="bg-black/60 rounded-xl p-4 border-2 border-yellow-500">
            <h3 className="text-sm font-bold text-yellow-400 text-center mb-3">ROCKETS FIRED</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.rockets.slice(0, 8).map((r: string, i: number) => {
                const [sym, gain, ...rest] = r.split(' ');
                const pattern = rest.join(' ').replace(/[[\]]/g, '');
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-800 to-pink-800 rounded-lg p-3 text-center border-2 border-yellow-500">
                    <p className="text-lg font-bold">{sym}</p>
                    <p className="text-base text-green-400">{gain}</p>
                    {pattern && <p className="text-xs text-cyan-300 mt-1">{pattern}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center pt-6">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-20 py-8 text-2xl font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all shadow-2xl border-4 border-purple-400 flex items-center gap-6 mx-auto disabled:opacity-60"
          >
            <RefreshCw className={`w-10 h-10 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>
    </div>
  );
}
