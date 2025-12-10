// app/page.tsx — AlphaStream v80000 — FINAL DASHBOARD (LIVE & CONNECTED)
'use client';
import { RefreshCw, Brain, Zap, TrendingUp, Trophy, Cpu, Activity } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // YOUR LIVE BOT URL — 100% CORRECT
  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 12000 });
      setData(res.data);
      setError(null);
    } catch (err: any) {
      console.error("Bot unreachable:", err.message);
      setError("Bot is offline or sleeping");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    try {
      await axios.post(`${BOT_URL}/scan`, {}, { timeout: 8000 });
    } catch {}
    setTimeout(() => setScanning(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Brain className="w-20 h-20 text-purple-600 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 text-center px-8">
        <div>
          <Brain className="w-20 h-20 mx-auto mb-8 animate-pulse" />
          <h1 className="text-3xl font-black mb-4">BOT OFFLINE</h1>
          <p className="text-xl mb-8">{error}</p>
          <button
            onClick={fetchData}
            className="px-10 py-4 bg-purple-700 rounded-xl hover:bg-purple-600 font-bold text-lg"
          >
            RECONNECT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur border-b border-purple-800 px-6 py-4">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              ALPHASTREAM v80000
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <span className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-cyan-600 font-bold text-sm animate-pulse">
              LIVE
            </span>
            <span className="text-cyan-300 font-mono text-lg">
              PPO ACTIVE
            </span>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-5xl mx-auto space-y-6 pb-32">
        {/* EQUITY */}
        <div className="bg-gradient-to-br from-purple-900/30 via-black to-cyan-900/30 rounded-3xl p-10 text-center border-2 border-purple-700">
          <div className="text-6xl font-black mb-3">
            {data.equity || "$100,000"}
          </div>
          <div className={`text-3xl font-bold ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
          <div className="text-sm text-gray-500 mt-3">
            Last sync: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* CORE STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
          <Stat icon={<TrendingUp className="w-8 h-8" />} value={data.positions || 0} label="POSITIONS" />
          <Stat icon={<Zap className="w-8 h-8" />} value={data.rockets?.length || 0} label="ROCKETS" />
          <Stat icon={<Trophy className="w-8 h-8" />} value={data.stats?.winRate || "—"} label="WIN%" />
          <Stat icon={<Cpu className="w-8 h-8" />} value={data.step || 0} label="STEPS" />
          <Stat icon={<Brain className="w-8 h-8" />} value={data.memory || 0} label="EXPERIENCES" />
        </div>

        {/* POSITIONS */}
        {data.positionsList?.length > 0 && (
          <div className="bg-gray-900/90 rounded-3xl p-6 border-2 border-cyan-600">
            <h2 className="text-cyan-400 font-bold text-center text-lg mb-5">
              ACTIVE POSITIONS
            </h2>
            {data.positionsList.map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0">
                <span className="font-bold text-lg">{p.symbol} ×{p.qty}</span>
                <span className={`text-2xl font-black ${p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ROCKETS */}
        {data.rockets?.length > 0 && (
          <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-3xl p-6 border-2 border-pink-700">
            <h2 className="text-pink-400 font-bold text-center text-lg mb-5 flex items-center justify-center gap-3">
              <Zap className="w-8 h-8" /> LIVE ROCKETS
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {data.rockets.slice(0, 12).map((r: string, i: number) => (
                <div key={i} className="bg-black/70 rounded-xl p-4 text-center border-2 border-pink-600">
                  <div className="text-xl font-black text-pink-400">{r.split(" ")[0]}</div>
                  <div className="text-xs text-pink-300">{r.split(" ").slice(1).join(" ")}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEURO LOGS */}
        <div className="bg-black/90 rounded-3xl p-6 border-2 border-green-700">
          <h2 className="text-green-400 font-bold text-center text-lg mb-5">
            NEURO LOGS
          </h2>
          <div className="bg-black/80 rounded-2xl p-4 h-96 overflow-y-auto font-mono text-xs leading-relaxed">
            {data.logs?.slice(-35).map((log: string, i: number) => {
              const text = log.split("] ")[1] || log;
              return (
                <div key={i} className="py-1 border-b border-gray-800 last:border-0">
                  {text.includes("FIRE") || text.includes("BUY") || text.includes("EXECUTED") ? (
                    <span className="text-cyan-400 font-bold">{text}</span>
                  ) : text.includes("WIN") ? (
                    <span className="text-green-400 font-bold">{text}</span>
                  ) : text.includes("LOSS") ? (
                    <span className="text-red-400 font-bold">{text}</span>
                  ) : text.includes("SAVED") || text.includes("UPDATED") ? (
                    <span className="text-yellow-400">{text}</span>
                  ) : text.includes("PPO") || text.includes("DQN") ? (
                    <span className="text-purple-400 font-bold">{text}</span>
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
            className="px-40 py-6 text-2xl font-black rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:scale-110 transition-all disabled:opacity-50 border-4 border-purple-900 shadow-2xl shadow-purple-800/70"
          >
            <RefreshCw className={`inline w-10 h-10 mr-6 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "HUNTING..." : "FORCE HUNT"}
          </button>
        </div>

        {/* FINAL STATUS */}
        <div className="text-center py-12">
          <p className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            v80000 • PPO • LIVE • LEARNING • UNSTOPPABLE
          </p>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, value, label }: any) {
  return (
    <div className="bg-gray-900/90 rounded-2xl p-5 text-center border-2 border-purple-700">
      <div className="flex justify-center mb-3 text-cyan-400">{icon}</div>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-gray-500 text-xs mt-2">{label}</div>
    </div>
  );
}
