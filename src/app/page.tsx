// app/page.tsx — AlphaStream v10000 — COMPACT MODE (40% smaller)
'use client';
import { RefreshCw, Activity, Brain, Zap, TrendingUp, Cpu, Trophy, Flame } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const [mainRes, statsRes] = await Promise.all([
        axios.get(BOT_URL).catch(() => ({ data: {} })),
        axios.get(`${BOT_URL}/stats`).catch(() => ({ data: {} }))
      ]);
      setData(mainRes.data);
      setStats(statsRes.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 7500);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

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

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b border-purple-700 px-4 py-2">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-sm font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              v10000
            </h1>
          </div>
          <span className="px-3 py-1 rounded text-xs font-bold bg-emerald-600">
            PAPER
          </span>
        </div>
      </header>

      <main className="pt-12 px-4 max-w-4xl mx-auto space-y-4 pb-20">
        {/* EQUITY */}
        <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-xl p-4 text-center border border-purple-700">
          <div className="text-2xl font-black">{data.equity || "$100,000"}</div>
          <div className={`text-lg font-bold mt-1 ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-5 gap-2">
          <Stat icon={<TrendingUp className="w-4 h-4" />} value={data.positions?.length || 0} label="POS" />
          <Stat icon={<Zap className="w-4 h-4" />} value={data.rockets?.length || 0} label="ROCKETS" />
          <Stat icon={<Trophy className="w-4 h-4" />} value={stats.winRate || "0"} label="WIN%" />
          <Stat icon={<Flame className="w-4 h-4" />} value={stats.profitFactor || "∞"} label="PF" />
          <Stat icon={<Cpu className="w-4 h-4" />} value={data.brainStatus?.match(/\d+/)?.[0] || "0"} label="LEARNED" />
        </div>

        {/* POSITIONS */}
        {data.positions?.length > 0 && (
          <div className="bg-gray-900/80 rounded-xl p-3 border border-cyan-600">
            {data.positions.map((p: any, i: number) => {
              const pnl = p.current ? ((p.current - p.entry) / p.entry) * 100 : 0;
              return (
                <div key={i} className={`p-2 rounded mb-1 text-xs border ${pnl >= 0 ? "border-green-600" : "border-red-600"}`}>
                  <div className="flex justify-between">
                    <span className="font-bold">{p.sym || p.symbol} ×{p.qty}</span>
                    <span className={pnl >= 0 ? "text-green-400" : "text-red-400"}>
                      {pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ROCKETS */}
        {data.rockets?.length > 0 && (
          <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 rounded-xl p-3 border border-pink-700">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {data.rockets.slice(0, 8).map((r: string, i: number) => (
                <div key={i} className="bg-black/60 rounded p-2 border border-pink-600">
                  <div className="font-bold text-pink-400">{r}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGS */}
        <div className="bg-black/90 rounded-xl p-3 border border-green-700">
          <h3 className="text-xs font-bold text-green-400 text-center mb-2">NEURO LOGS</h3>
          <div className="bg-black/70 rounded p-2 h-56 overflow-y-auto text-xs font-mono">
            {data.logs?.slice(-25).map((l: string, i: number) => {
              const text = l.includes("] ") ? l.split("] ")[1] : l;
              return (
                <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">
                  {text.includes("BUY") || text.includes("ENTRY") ? <span className="text-cyan-400">{text}</span> :
                   text.includes("WIN") ? <span className="text-green-400">{text}</span> :
                   text.includes("LOSS") ? <span className="text-red-400">{text}</span> :
                   text.includes("RUNNER") ? <span className="text-orange-400">{text}</span> :
                   <span className="text-gray-500">{text}</span>}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE HUNT */}
        <div className="text-center pt-4">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-16 py-3 text-sm font-black rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:scale-105 transition disabled:opacity-50 border-2 border-purple-800"
          >
            <RefreshCw className={`inline w-5 h-5 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "HUNTING..." : "FORCE HUNT"}
          </button>
        </div>

        {/* STATUS */}
        <div className="text-center py-4">
          <p className="text-sm font-bold text-cyan-400 animate-pulse">
            v10000 • PAPER • AI ACTIVE
          </p>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, value, label }: any) {
  return (
    <div className="bg-gray-900/80 rounded-lg p-3 text-center border border-purple-700">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-gray-500 text-xs">{label}</div>
    </div>
  );
}
