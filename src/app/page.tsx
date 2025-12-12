// app/page.tsx — AlphaStream v200000 DASHBOARD (COMPACT MODE)
'use client';
import { RefreshCw, Brain, Zap, TrendingUp, Cpu } from 'lucide-react';
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
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(); const i = setInterval(fetch, 7000); return () => clearInterval(i); }, []);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data.logs]);

  const forceHunt = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setTimeout(() => setScanning(false), 2500);
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <Brain className="w-10 h-10 text-purple-500 animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 bg-black/95 border-b border-purple-800 px-4 py-2 z-50">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-sm font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v200000
            </h1>
          </div>
          <span className="px-3 py-1 rounded text-xs font-bold bg-gradient-to-r from-red-600 to-orange-600">
            ADAPTIVE LIVE
          </span>
        </div>
      </header>

      <main className="pt-14 px-4 max-w-4xl mx-auto space-y-4 pb-24">
        {/* EQUITY */}
        <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-xl p-5 text-center border border-purple-700">
          <div className="text-3xl font-black">{data.equity || "$100,000"}</div>
          <div className={`text-xl font-bold ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* BRAIN + STATS */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-gray-900/80 rounded-lg p-3 border border-purple-600">
            <Cpu className="w-6 h-6 mx-auto text-purple-400" />
            <div className="text-lg font-bold mt-1">{data.brain?.tradesLearned || 0}</div>
            <div className="text-2xs text-gray-500">LEARNED</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border-cyan-600">
            <Zap className="w-6 h-6 mx-auto text-cyan-400" />
            <div className="text-lg font-bold">{data.config?.minGapPct || 20}%</div>
            <div className="text-2xs text-gray-500">GAP</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border-pink-600">
            <TrendingUp className="w-6 h-6 mx-auto text-pink-400" />
            <div className="text-lg font-bold">{data.stats?.winRate || "—"}%</div>
            <div className="text-2xs text-gray-500">WIN RATE</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border-green-600">
            <div className="text-lg font-bold">{data.positions || 0}</div>
            <div className="text-2xs text-gray-500">POS</div>
          </div>
        </div>

        {/* POSITIONS */}
        {data.positionsList?.length > 0 ? (
          <div className="bg-gray-900/90 rounded-xl p-4 border border-cyan-600">
            <div className="text-cyan-400 font-bold text-center mb-2 text-xs">POSITIONS</div>
            {data.positionsList.map((p: any, i: number) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-800 last:border-0 text-xs">
                <span className="font-bold">{p.symbol} ×{p.qty}</span>
                <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-600 text-xs">No positions — waiting for signal</div>
        )}

        {/* ROCKETS */}
        {data.rockets?.length > 0 && (
          <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 rounded-xl p-4 border border-pink-700">
            <div className="grid grid-cols-6 gap-2 text-center text-2xs">
              {data.rockets.slice(0, 12).map((r: string, i: number) => (
                <div key={i} className="bg-black/70 rounded p-2 font-bold text-pink-400 border border-pink-600">
                  {r}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGS */}
        <div className="bg-black/90 rounded-xl p-4 border border-green-700">
          <div className="text-green-400 font-bold text-center mb-2 text-xs">BRAIN LOGS</div>
          <div className="bg-black/70 rounded p-3 h-64 overflow-y-auto font-mono text-2xs">
            {data.logs?.slice(-28).map((log: string, i: number) => {
              const text = log.split("] ")[1] || log;
              return (
                <div key={i} className="py-0.5">
                  {text.includes("RL:") ? <span className="text-yellow-400 font-bold">{text}</span> :
                   text.includes("ENTRY") ? <span className="text-cyan-400">{text}</span> :
                   text.includes("WIN") ? <span className="text-green-400">{text}</span> :
                   text.includes("STOP") ? <span className="text-red-400">{text}</span> :
                   <span className="text-gray-500">{text}</span>}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE HUNT */}
        <div className="text-center pt-6">
          <button
            onClick={forceHunt}
            disabled={scanning}
            className="px-32 py-5 text-xl font-black rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:scale-105 transition disabled:opacity-50 border-2 border-purple-800"
          >
            <RefreshCw className={`inline w-8 h-8 mr-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "ADAPTING..." : "FORCE HUNT"}
          </button>
        </div>

        <div className="text-center py-6 text-cyan-400 text-xs font-bold animate-pulse">
          v200000 • SELF-LEARNING • WILL NEVER DIE
        </div>
      </main>
    </div>
  );
}
