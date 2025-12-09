// app/page.tsx — AlphaStream v10000 — WORKING DASHBOARD (Dec 2025)
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
        axios.get(BOT_URL, { timeout: 10000 }).catch(() => ({ data: {} })),
        axios.get(`${BOT_URL}/stats`, { timeout: 10000 }).catch(() => ({ data: {} }))
      ]);
      setData(mainRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 7500);
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
        <Activity className="w-16 h-16 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b border-purple-700 px-6 py-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v10000
            </h1>
          </div>
          <span className="px-6 py-2 rounded-full text-sm font-bold bg-emerald-600 animate-pulse">
              PAPER MODE
            </span>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-6xl mx-auto space-y-8 pb-32">
        {/* EQUITY */}
        <div className="text-center bg-gradient-to-br from-purple-900/20 to-cyan-900/20 rounded-3xl p-10 border border-purple-700">
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
            {data.equity || "$100,000"}
          </div>
          <div className="text-3xl font-bold mt-4 text-gray-400">
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <StatCard icon={<TrendingUp className="w-8 h-8" />} value={data.positions?.length || 0} label="POSITIONS" color="purple" />
          <StatCard icon={<Zap className="w-8 h-8" />} value={data.rockets?.length || 0} label="ROCKETS" color="pink" />
          <StatCard icon={<Trophy className="w-8 h-8" />} value={stats.winRate || "0"} label="WIN %" color="green" />
          <StatCard icon={<Flame className="w-8 h-8" />} value={stats.profitFactor || "∞"} label="PF" color="yellow" />
          <StatCard icon={<Cpu className="w-8 h-8" />} value={data.brainStatus?.match(/\d+/)?.[0] || "0"} label="LEARNED" color="cyan" />
        </div>

        {/* ACTIVE POSITIONS */}
        {data.positions?.length > 0 && (
          <div className="bg-gray-900/90 rounded-3xl p-8 border border-cyan-600">
            <h2 className="text-2xl font-bold text-cyan-400 text-center mb-6">ACTIVE POSITIONS</h2>
            {data.positions.map((p: any, i: number) => {
              const pnl = p.current ? ((p.current - p.entry) / p.entry) * 100 : 0;
              return (
                <div key={i} className={`p-6 rounded-2xl mb-4 border-2 ${pnl >= 0 ? "bg-green-900/30 border-green-500" : "bg-red-900/30 border-red-500"}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-black">{p.sym || p.symbol} ×{p.qty}</span>
                    <span className={`text-3xl font-black ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LIVE ROCKETS */}
        {data.rockets?.length > 0 && (
          <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-3xl p-8 border border-pink-600">
            <h2 className="text-2xl font-bold text-pink-400 text-center mb-6 flex items-center justify-center gap-3">
              <Zap className="w-8 h-8" /> LIVE ROCKETS
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {data.rockets.slice(0, 9).map((r: string, i: number) => (
                <div key={i} className="bg-black/70 rounded-xl p-5 text-center border-2 border-pink-600">
                  <div className="text-xl font-black text-pink-400">{r}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEURO LOGS */}
        <div className="bg-black/90 rounded-3xl p-8 border-2 border-green-700">
          <h2 className="text-2xl font-bold text-green-400 text-center mb-6">NEURO LOGS</h2>
          <div className="bg-black/80 rounded-2xl p-6 h-96 overflow-y-auto font-mono text-sm">
            {data.logs?.slice(-40).map((log: string, i: number) => {
              const text = log.includes("] ") ? log.split("] ")[1] : log;
              return (
                <div key={i} className="py-2 border-b border-gray-800 last:border-0">
                  {text.includes("BUY") || text.includes("ENTRY") ? (
                    <span className="text-cyan-400 font-bold">{text}</span>
                  ) : text.includes("WIN") ? (
                    <span className="text-green-400 font-bold">{text}</span>
                  ) : text.includes("LOSS") ? (
                    <span className="text-red-400 font-bold">{text}</span>
                  ) : text.includes("RUNNER") ? (
                    <span className="text-orange-400">{text}</span>
                  ) : text.includes("AI") ? (
                    <span className="text-purple-400">{text}</span>
                  ) : (
                    <span className="text-gray-500">{text}</span>
                  )}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE HUNT */}
        <div className="text-center pt-10">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-40 py-8 text-3xl font-black rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:scale-110 transition-all disabled:opacity-50 border-4 border-purple-900 shadow-2xl shadow-purple-900/70"
          >
            <RefreshCw className={`inline w-12 h-12 mr-6 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "HUNTING..." : "FORCE HUNT"}
          </button>
        </div>

        {/* STATUS */}
        <div className="text-center py-12">
          <p className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            v10000 • PAPER MODE • AI LEARNING • READY
          </p>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label, color }: any) {
  const colors: any = {
    purple: "border-purple-600 bg-purple-900/20",
    pink: "border-pink-600 bg-pink-900/20",
    green: "border-green-600 bg-green-900/20",
    yellow: "border-yellow-600 bg-yellow-900/20",
    cyan: "border-cyan-600 bg-cyan-900/20"
  };
  return (
    <div className={`rounded-2xl p-6 border-2 ${colors[color]} backdrop-blur`}>
      <div className="flex justify-center mb-3">{icon}</div>
      <div className="text-4xl font-black text-white">{value}</div>
      <div className="text-gray-400 text-sm mt-2">{label}</div>
    </div>
  );
}
