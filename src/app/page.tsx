// app/page.tsx — AlphaStream v200000 DASHBOARD (2025–2035+)
// Fully reflects self-learning brain, dynamic config, and adaptation
'use client';
import { RefreshCw, Brain, Zap, TrendingUp, Activity, Cpu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetch = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      setData(res.data);
    } catch (err) {
      console.log("Bot unreachable — retrying...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const i = setInterval(fetch, 7000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceHunt = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setTimeout(() => setScanning(false), 3000);
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <Brain className="w-16 h-16 text-purple-500 animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 bg-black/95 border-b border-purple-800 px-4 py-3 z-50">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Brain className="w-7 h-7 text-purple-400 animate-pulse" />
            <h1 className="text-lg font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v200000
            </h1>
            <span className="text-xs text-cyan-400 animate-pulse">TRUE ADAPTIVE</span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="px-4 py-1 rounded-full font-bold text-sm bg-gradient-to-r from-red-600 to-orange-600">
              SELF-LEARNING LIVE
            </span>
            <span className="text-cyan-300 font-mono">{data.lastUpdate?.slice(11, 19) || "--:--"}</span>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-5xl mx-auto space-y-5 pb-32">
        {/* EQUITY + UNREALIZED */}
        <div className="bg-gradient-to-br from-purple-900/40 via-black to-cyan-900/40 rounded-3xl p-8 text-center border-2 border-purple-600">
          <div className="text-5xl font-black mb-3">{data.equity || "$100,000"}</div>
          <div className={`text-3xl font-bold ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* RL BRAIN STATUS */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-purple-900/50 to-black rounded-2xl p-4 border border-purple-600 text-center">
            <Cpu className="w-8 h-8 mx-auto text-purple-400 mb-2" />
            <div className="text-2xl font-black">{data.brain?.tradesLearned || 0}</div>
            <div className="text-xs text-gray-400">TRADES LEARNED</div>
          </div>
          <div className="bg-gradient-to-r from-cyan-900/50 to-black rounded-2xl p-4 border border-cyan-600 text-center">
            <Activity className="w-8 h-8 mx-auto text-cyan-400 mb-2" />
            <div className="text-2xl font-black">{data.brain?.epsilon ? (data.brain.epsilon * 100).toFixed(1) : "30.0"}%</div>
            <div className="text-xs text-gray-400">EXPLORATION</div>
          </div>
          <div className="bg-gradient-to-r from-pink-900/50 to-black rounded-2xl p-4 border border-pink-600 text-center">
            <Zap className="w-8 h-8 mx-auto text-pink-400 mb-2" />
            <div className="text-2xl font-black">{data.config?.minGapPct || 20}%</div>
            <div className="text-xs text-gray-400">GAP THRESHOLD</div>
          </div>
          <div className="bg-gradient-to-r from-green-900/50 to-black rounded-2xl p-4 border border-green-600 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-green-400 mb-2" />
            <div className="text-2xl font-black">{data.stats?.winRate || "—"}%</div>
            <div className="text-xs text-gray-400">WIN RATE</div>
          </div>
        </div>

        {/* DYNAMIC CONFIG LIVE VALUES */}
        <div className="bg-gray-900/90 rounded-2xl p-5 border-2 border-purple-500">
          <h2 className="text-purple-400 font-bold text-center mb-4 text-sm">EVOLVING STRATEGY PARAMETERS</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center">
              <div className="text-cyan-400 text-xs">RISK PER TRADE</div>
              <div className="text-2xl font-black text-white">{(data.config?.riskPerTrade * 100).toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-cyan-400 text-xs">PARTIAL TAKE PROFIT</div>
              <div className="text-2xl font-black text-white">+{(data.config?.partialProfitTarget * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-pink-400 text-xs">TRAILING STOP</div>
              <div className="text-2xl font-black text-white">{(data.config?.trailingStopPct * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 text-xs">MAX POSITIONS</div>
              <div className="text-2xl font-black text-white">{data.config?.maxPositions || 5}</div>
            </div>
          </div>
        </div>

        {/* POSITIONS */}
        {data.positionsList?.length > 0 ? (
          <div className="bg-gray-900/90 rounded-2xl p-5 border-2 border-cyan-600">
            <h2 className="text-cyan-400 font-bold text-center mb-4">ACTIVE POSITIONS ({data.positionsList.length})</h2>
            {data.positionsList.map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0">
                <div>
                  <span className="font-bold text-lg">{p.symbol}</span>
                  <span className="text-gray-500 ml-3">×{p.qty}</span>
                </div>
                <span className={`text-2xl font-black ${p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <Brain className="w-20 h-20 mx-auto text-gray-700 mb-4" />
            <p className="text-lg">No positions — waiting for elite gap</p>
          </div>
        )}

        {/* LIVE GAPPERS */}
        {data.rockets?.length > 0 && (
          <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-2xl p-5 border-2 border-pink-700">
            <h2 className="text-pink-400 font-bold text-center mb-4">LIVE GAPPERS DETECTED</h2>
            <div className="grid grid-cols-5 gap-3">
              {data.rockets.slice(0, 15).map((r: string, i: number) => (
                <div key={i} className="bg-black/70 rounded-xl p-3 text-center border-2 border-pink-600">
                  <div className="text-lg font-black text-pink-400">{r}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEURO LOGS */}
        <div className="bg-black/90 rounded-2xl p-5 border-2 border-green-700">
          <h2 className="text-green-400 font-bold text-center mb-4">ADAPTIVE BRAIN LOGS</h2>
          <div className="bg-black/80 rounded-xl p-4 h-96 overflow-y-auto font-mono text-xs leading-tight">
            {data.logs?.slice(-35).map((log: string, i: number) => {
              const text = log.split("] ")[1] || log;
              return (
                <div key={i} className="py-1 border-b border-gray-800 last:border-0">
                  {text.includes("RL:") ? (
                    <span className="text-yellow-400 font-bold animate-pulse">{text}</span>
                  ) : text.includes("ENTRY") ? (
                    <span className="text-cyan-400 font-bold">{text}</span>
                  ) : text.includes("WIN") ? (
                    <span className="text-green-400 font-bold">{text}</span>
                  ) : text.includes("LOSS") || text.includes("STOP") ? (
                    <span className="text-red-400 font-bold">{text}</span>
                  ) : text.includes("FORCED") ? (
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

        {/* FORCE HUNT */}
        <div className="text-center pt-10">
          <button
            onClick={forceHunt}
            disabled={scanning}
            className="px-48 py-8 text-3xl font-black rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:scale-110 transition-all disabled:opacity-50 border-4 border-purple-900 shadow-2xl"
          >
            <RefreshCw className={`inline w-12 h-12 mr-8 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "ADAPTING..." : "FORCE HUNT"}
          </button>
        </div>

        <div className="text-center py-12">
          <p className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            v200000 • SELF-LEARNING • WILL NEVER DIE
          </p>
          <p className="text-sm text-gray-500 mt-2">The bot evolves. You just watch.</p>
        </div>
      </main>
    </div>
  );
}
