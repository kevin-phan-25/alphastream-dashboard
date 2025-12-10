// app/page.tsx — AlphaStream v80000 — COMPACT + REAL ALPACA EQUITY + LOGS FIXED
'use client';
import { RefreshCw, Brain, Zap, TrendingUp } from 'lucide-react';
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
    } catch (e) {
      console.log("Bot sleeping...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const i = setInterval(fetch, 9000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView();
  }, [data.logs]);

  const force = async () => {
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
      <header className="fixed top-0 inset-x-0 bg-black/90 border-b border-purple-800 px-4 py-2 z-50">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              v80000
            </h1>
          </div>
          <span className="px-3 py-1 rounded text-xs font-bold bg-emerald-600">
            LIVE
          </span>
        </div>
      </header>

      <main className="pt-12 px-4 max-w-4xl mx-auto space-y-3 pb-20">
        {/* EQUITY — NOW SHOWS REAL ALPACA BALANCE */}
        <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-lg p-4 text-center border border-purple-700">
          <div className="text-2xl font-black">
            {data.equity || "$100,000"}
          </div>
          <div className={`text-lg font-bold ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-900/80 rounded p-3 border border-purple-700">
            <TrendingUp className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
            <div className="font-bold">{data.positions || 0}</div>
            <div className="text-gray-500 text-xs">POS</div>
          </div>
          <div className="bg-gray-900/80 rounded p-3 border border-pink-700">
            <Zap className="w-5 h-5 mx-auto text-pink-400 mb-1" />
            <div className="font-bold">{data.rockets?.length || 0}</div>
            <div className="text-gray-500 text-xs">FIRE</div>
          </div>
          <div className="bg-gray-900/80 rounded p-3 border border-green-700">
            <div className="font-bold">{data.stats?.winRate || "—"}%</div>
            <div className="text-gray-500 text-xs">WIN</div>
          </div>
          <div className="bg-gray-900/80 rounded p-3 border border-orange-700">
            <div className="font-bold">{data.step || 0}</div>
            <div className="text-gray-500 text-xs">STEPS</div>
          </div>
        </div>

        {/* POSITIONS */}
        {data.positionsList?.length > 0 && (
          <div className="bg-gray-900/80 rounded-lg p-3 border border-cyan-700">
            {data.positionsList.map((p: any, i: number) => (
              <div key={i} className="flex justify-between py-1 text-xs">
                <span>{p.symbol} ×{p.qty}</span>
                <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* LOGS — FIXED & WORKING */}
        <div className="bg-black/90 rounded-lg p-3 border border-green-700">
          <div className="text-xs font-bold text-green-400 text-center mb-1">LOGS</div>
          <div className="bg-black/70 rounded p-2 h-48 overflow-y-auto text-xs font-mono">
            {data.logs?.slice(-20).map((l: string, i: number) => {
              const text = l.split("] ")[1] || l;
              return (
                <div key={i} className="py-0.5">
                  {text.includes("BUY") || text.includes("FIRE") ? <span className="text-cyan-400">{text}</span> :
                   text.includes("WIN") ? <span className="text-green-400">{text}</span> :
                   text.includes("LOSS") ? <span className="text-red-400">{text}</span> :
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
            onClick={force}
            disabled={scanning}
            className="px-20 py-3 text-sm font-black rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:scale-105 transition disabled:opacity-50 border border-purple-800"
          >
            <RefreshCw className={`inline w-5 h-5 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "HUNTING" : "FORCE HUNT"}
          </button>
        </div>

        <div className="text-center py-3 text-cyan-400 text-xs animate-pulse">
          v80000 • PPO • LIVE • LEARNING
        </div>
      </main>
    </div>
  );
}
