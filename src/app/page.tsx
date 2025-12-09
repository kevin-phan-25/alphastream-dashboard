// app/page.tsx — AlphaStream v10000 — ELITE DASHBOARD
'use client';
import {RefreshCw, Activity, Brain, Zap, TrendingUp, DollarSign, Cpu, Trophy, Flame} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetch = async () => {
    try {
      const [mainRes, statsRes] = await Promise.all([
        axios.get(BOT_URL).catch(() => ({ data: {} })),
        axios.get(`${BOT_URL}/stats`).catch(() => ({ data: {} }))
      ]);
      setData(mainRes.data);
      setStats(statsRes.data);
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setTimeout(() => setScanning(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  const brainHealth = data.brainStatus || "AI ACTIVE";
  const isLive = !data.paper;

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b border-purple-700 px-4 py-3">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              v10000
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-xs font-bold ${isLive ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
              {isLive ? "LIVE FIRE" : "PAPER"}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-5xl mx-auto space-y-6 pb-24">
        {/* EQUITY CARD */}
        <div className="bg-gradient-to-br from-purple-900/30 via-black to-cyan-900/30 rounded-2xl p-8 text-center border border-purple-700 backdrop-blur">
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            {data.equity || "$100,000"}
          </div>
          <div className={`text-2xl font-bold mt-3 ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={<TrendingUp />} value={data.positions?.length || 0} label="POS" color="purple" />
          <StatCard icon={<Zap />} value={data.rockets?.length || 0} label="ROCKETS" color="pink" />
          <StatCard icon={<Trophy />} value={stats.winRate || "0"} label="WIN%" color="green" />
          <StatCard icon={<Flame />} value={stats.profitFactor || "∞"} label="PF" color="yellow" />
          <StatCard icon={<Cpu />} value={data.brainStatus?.match(/\d+/)?.[0] || "0"} label="LEARNED" color="cyan" />
        </div>

        {/* POSITIONS */}
        {data.positions?.length > 0 && (
          <div className="bg-gray-900/80 rounded-2xl p-5 border border-cyan-600">
            <h3 className="text-cyan-400 font-bold mb-3 text-center">ACTIVE POSITIONS</h3>
            {data.positions.map((p: any, i: number) => {
              const pnl = p.current ? ((p.current - p.entry) / p.entry) * 100 : 0;
              return (
                <div key={i} className={`p-4 rounded-lg mb-3 border ${pnl >= 0 ? "bg-green-900/30 border-green-600" : "bg-red-900/30 border-red-600"}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">{p.sym || p.symbol} ×{p.qty}</span>
                    <span className={`font-black text-xl ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
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
          <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 rounded-2xl p-5 border border-pink-700">
            <h3 className="text-pink-400 font-bold mb-3 text-center flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" /> LIVE ROCKETS
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {data.rockets.slice(0, 9).map((r: string, i: number) => (
                <div key={i} className="bg-black/60 rounded-lg p-3 text-center border border-pink-600">
                  <div className="text-pink-400 font-bold">{r}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEURO LOGS */}
        <div className="bg-black/90 rounded-2xl p-5 border border-green-700">
          <h3 className="text-green-400 font-bold mb-4 text-center text-lg">NEURO LOGS</h3>
          <div className="bg-black/80 rounded-xl p-4 h-96 overflow-y-auto font-mono text-xs leading-tight">
            {data.logs?.slice(-40).map((log: string, i: number) => {
              const text = log.split("] ")[1] || log;
              return (
                <div key={i} className="py-1 border-b border-gray-800 last:border-0">
                  {text.includes("BUY") || text.includes("ENTRY") ? (
                    <span className="text-cyan-400 font-bold">{text}</span>
                  ) : text.includes("WIN") ? (
                    <span className="text-green-400 font-bold">{text}</span>
                  ) : text.includes("LOSS") ? (
                    <span className="text-red-400 font-bold">{text}</span>
                  ) : text.includes("LEARNED") ? (
                    <span className="text-yellow-400 font-bold">{text}</span>
                  ) : text.includes("RUNNER") ? (
                    <span className="text-orange-400">{text}</span>
                  ) : (
                    <span className="text-gray-500">{text}</span>
                  )}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE HUNT BUTTON */}
        <div className="text-center pt-6">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-32 py-6 text-2xl font-black rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:scale-105 transition-all disabled:opacity-50 border-4 border-purple-800 shadow-2xl shadow-purple-900/50"
          >
            <RefreshCw className={`inline w-10 h-10 mr-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "HUNTING..." : "FORCE HUNT"}
          </button>
        </div>

        {/* STATUS BAR */}
        <div className="text-center py-8">
          <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse">
            v10000 • {brainHealth} • AI FULLY ACTIVE
          </p>
        </div>
      </main>
    </div>
  );
}

// Reusable stat card
function StatCard({ icon, value, label, color }: any) {
  const colors: any = {
    purple: "border-purple-700 text-purple-400",
    pink: "border-pink-700 text-pink-400",
    green: "border-green-700 text-green-400",
    yellow: "border-yellow-700 text-yellow-400",
    cyan: "border-cyan-700 text-cyan-400"
  };
  return (
    <div className={`bg-gray-900/80 rounded-xl p-5 border ${colors[color]} backdrop-blur`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-gray-500 text-xs mt-1">{label}</div>
    </div>
  );
}
