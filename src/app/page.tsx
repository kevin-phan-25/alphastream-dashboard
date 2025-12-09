// app/page.tsx — AlphaStream v9000 — COMPACT ELITE EDITION
'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Brain, Zap, TrendingUp, DollarSign, Cpu, Trophy, Flame } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetch = async () => {
    try {
      const [main, st] = await Promise.all([
        axios.get(BOT_URL),
        axios.get(`${BOT_URL}/stats`).catch(() => ({ data: {} }))
      ]);
      setData(main.data);
      setStats(st.data);
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const i = setInterval(fetch, 8000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setTimeout(() => setScanning(false), 2500);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Activity className="w-10 h-10 text-cyan-500 animate-spin" />
    </div>
  );

  const ml = data.ml || { tradesLearned: 0 };
  const isLive = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b border-purple-700 px-4 py-2">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-sm font-bold text-purple-300">v9000</h1>
          </div>
          <span className={`px-3 py-1 rounded text-xs font-bold ${isLive ? "bg-red-600" : "bg-emerald-600"}`}>
            {data.mode || "PAPER"}
          </span>
        </div>
      </header>

      <main className="pt-12 px-4 max-w-4xl mx-auto space-y-4 pb-20">

        {/* EQUITY */}
        <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-xl p-4 text-center border border-purple-700">
          <div className="text-3xl font-black">{data.equity || "$100,000"}</div>
          <div className={`text-xl font-bold mt-1 ${data.unrealized?.[0] === '+' ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-5 gap-3 text-center">
          <div className="bg-gray-900/80 rounded-lg p-3 border border-purple-700">
            <TrendingUp className="w-5 h-5 mx-auto text-purple-400 mb-1" />
            <div className="text-lg font-bold">{data.positions || 0}/4</div>
            <div className="text-gray-500 text-xs">POS</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-pink-700">
            <Zap className="w-5 h-5 mx-auto text-pink-400 mb-1" />
            <div className="text-lg font-bold">{data.rockets?.length || 0}</div>
            <div className="text-gray-500 text-xs">ROCKETS</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-green-700">
            <Trophy className="w-5 h-5 mx-auto text-green-400 mb-1" />
            <div className="text-lg font-bold text-green-400">{stats.winRate || data.winRate || "0"}%</div>
            <div className="text-gray-500 text-xs">WIN</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-yellow-700">
            <Flame className="w-5 h-5 mx-auto text-yellow-400 mb-1" />
            <div className="text-lg font-bold text-yellow-400">{stats.profitFactor || "∞"}</div>
            <div className="text-gray-500 text-xs">PF</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-cyan-700">
            <Cpu className="w-5 h-5 mx-auto text-cyan-400 mb-1 animate-pulse" />
            <div className="text-lg font-bold text-cyan-400">{ml.tradesLearned || 0}</div>
            <div className="text-gray-500 text-xs">LEARNED</div>
          </div>
        </div>

        {/* POSITIONS */}
        {data.positionsData?.length > 0 && (
          <div className="bg-gray-900/90 rounded-xl p-4 border border-cyan-600">
            {data.positionsData.map((p: any, i: number) => {
              const pnl = ((p.current - p.entry) / p.entry) * 100;
              return (
                <div key={i} className={`p-3 rounded mb-2 border ${pnl >= 0 ? "bg-green-900/40 border-green-600" : "bg-red-900/40 border-red-600"}`}>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold">{p.symbol} ×{p.qty}</span>
                    <span className={pnl >= 0 ? "text-green-400" : "text-red-400"}>
                      {pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LOGS */}
        <div className="bg-black/90 rounded-xl p-4 border border-green-700">
          <h3 className="text-xs font-bold text-green-400 mb-2 text-center">NEURO LOGS</h3>
          <div className="bg-black/70 rounded p-3 h-64 overflow-y-auto text-xs font-mono text-gray-300">
            {data.logs?.slice(-30).map((l: string, i: number) => (
              <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">
                {l.includes("ENTRY") ? <span className="text-cyan-400">{l.split("] ")[1]}</span> :
                 l.includes("WIN") ? <span className="text-green-400">{l.split("] ")[1]}</span> :
                 l.includes("LOSS") ? <span className="text-red-400">{l.split("] ")[1]}</span> :
                 l.includes("LEARNED") ? <span className="text-yellow-400 font-bold">{l.split("] ")[1]}</span> :
                 <span className="text-gray-500">{l.split("] ")[1]}</span>}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN */}
        <div className="text-center pt-4">
          <button onClick={forceScan} disabled={scanning}
            className="px-20 py-4 text-lg font-black rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:scale-105 transition-all border-2 border-purple-800 disabled:opacity-50">
            <RefreshCw className={`inline w-6 h-6 mr-3 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "HUNTING..." : "FORCE HUNT"}
          </button>
        </div>

        {/* STATUS */}
        <div className="text-center py-6">
          <p className="text-lg font-bold text-cyan-400 animate-pulse">
            v9000 • {ml.tradesLearned} LEARNED • AI ACTIVE
          </p>
        </div>
      </main>
    </div>
  );
}
