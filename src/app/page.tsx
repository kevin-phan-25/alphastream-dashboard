// app/page.tsx — AlphaStream v7000 Dashboard (REAL ML EDITION)
'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Brain, Zap, TrendingUp, DollarSign, Crown, Cpu } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetch = async () => {
    try {
      const res = await axios.get(BOT_URL);
      setData(res.data);
    } catch (e) {
      console.log("Connecting to AlphaStream v7000 AI...");
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

  const isLive = data.mode === "LIVE";
  const mlHealth = data.ml || { tradesLearned: 0, features: 0 };

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b border-purple-800 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
            <h1 className="text-xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v7000
            </h1>
            <span className="text-cyan-400 text-xs font-bold">REAL AI</span>
          </div>
          <div className="flex items-center gap-5">
            <span className={`px-5 py-2 rounded-full text-sm font-black ${isLive ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
              {data.mode || "PAPER"}
            </span>
            <span className="text-yellow-400 font-bold">{data.activeAccount || "Paper"}</span>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-5xl mx-auto space-y-4 pb-24">

        {/* EQUITY + UNREAL */}
        <div className="bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-cyan-900/50 rounded-2xl p-8 text-center border-4 border-purple-600 shadow-2xl">
          <div className="text-5xl font-black tracking-tight">{data.equity || "$100,000"}</div>
          <div className={`text-3xl font-bold mt-3 ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
          <div className="bg-gray-900/90 rounded-xl p-4 border border-purple-700">
            <TrendingUp className="w-8 h-8 mx-auto text-purple-400 mb-2" />
            <div className="text-2xl font-black text-purple-400">{data.positions || 0}/3</div>
            <div className="text-gray-500">POSITIONS</div>
          </div>
          <div className="bg-gray-900/90 rounded-xl p-4 border border-pink-700">
            <Zap className="w-8 h-8 mx-auto text-pink-400 mb-2" />
            <div className="text-2xl font-black text-pink-400">{data.rockets?.length || 0}</div>
            <div className="text-gray-500">ROCKETS</div>
          </div>
          <div className="bg-gray-900/90 rounded-xl p-4 border border-green-700">
            <DollarSign className="w-8 h-8 mx-auto text-green-400 mb-2" />
            <div className="text-2xl font-black text-green-400">{data.winRate || "0.0"}%</div>
            <div className="text-gray-500">WIN RATE</div>
          </div>
          <div className="bg-gray-900/90 rounded-xl p-4 border border-yellow-700">
            <Crown className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
            <div className="text-2xl font-black text-yellow-400">{data.totalTrades || 0}</div>
            <div className="text-gray-500">TRADES</div>
          </div>
          <div className="bg-gray-900/90 rounded-xl p-4 border border-cyan-700">
            <Cpu className="w-8 h-8 mx-auto text-cyan-400 mb-2 animate-pulse" />
            <div className="text-2xl font-black text-cyan-400">{mlHealth.tradesLearned || 0}</div>
            <div className="text-gray-500">LEARNED</div>
          </div>
          <div className="bg-gray-900/90 rounded-xl p-4 border border-orange-700">
            <Brain className="w-8 h-8 mx-auto text-orange-400 mb-2" />
            <div className="text-2xl font-black text-orange-400">{mlHealth.features || 0}</div>
            <div className="text-gray-500">FEATURES</div>
          </div>
        </div>

        {/* LIVE POSITIONS */}
        {data.positionsData?.length > 0 && (
          <div className="bg-gray-900/95 rounded-2xl p-6 border-4 border-cyan-600">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 text-center">LIVE AI POSITIONS</h3>
            {data.positionsData.map((p: any, i: number) => {
              const pnl = ((p.current - p.entry) / p.entry) * 100;
              return (
                <div key={i} className={`p-4 rounded-xl mb-4 border-2 ${pnl >= 0 ? "bg-green-900/50 border-green-500" : "bg-red-900/50 border-red-500"}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-3xl font-black">{p.symbol}</span>
                      <span className="ml-4 text-gray-400">×{p.qty}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-black ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%
                      </div>
                      <div className="text-xl text-gray-300">${p.current?.toFixed(2) || "—"}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* NEURO LOGS */}
        <div className="bg-black/95 rounded-rounded-2xl p-6 border-4 border-green-700">
          <h3 className="text-lg font-bold text-green-400 mb-4 text-center">NEURO LOGS (REAL-TIME)</h3>
          <div className="bg-black/80 rounded-xl p-4 h-96 overflow-y-auto font-mono text-sm text-gray-200">
            {data.logs?.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-1.5 border-b border-gray-800 last:border-0 whitespace-pre-wrap">
                {l.includes("ML BRAIN LEARNED") ? (
                  <span className="text-yellow-400 font-bold">{l}</span>
                ) : l.includes("ML-APPROVED") ? (
                  <span className="text-cyan-400 font-bold">{l}</span>
                ) : (
                  l
                )}
              </div>
            )) : (
              <div className="text-center text-gray-600 py-32">AI warming up...</div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN BUTTON */}
        <div className="text-center pt-8">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-32 py-8 text-4xl font-black rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:scale-105 transition-all shadow-2xl border-8 border-purple-900 disabled:opacity-60"
          >
            <RefreshCw className={`inline w-14 h-14 mr-6 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "NEUROSCANNING..." : "FORCE NEUROSCAN"}
          </button>
        </div>

        {/* FINAL MESSAGE */}
        <div className="text-center py-16">
          <p className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            v7000 — THE AI IS ALIVE
          </p>
          <p className="text-xl text-gray-400 mt-4">
            {mlHealth.tradesLearned > 0 ? `${mlHealth.tradesLearned} trades learned • Self-evolving` : "Learning from first trade..."}
          </p>
        </div>
      </main>
    </div>
  );
}
