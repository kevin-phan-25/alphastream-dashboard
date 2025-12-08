'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Crown, Brain, Zap, TrendingUp, DollarSign, History, Sparkles } from 'lucide-react';

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
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    const i = setInterval(fetch, 7000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const scan = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setTimeout(() => setScanning(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  const isLive = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b border-purple-800 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
            <h1 className="text-base font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v800 — NEURODYNAMIC
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black ${isLive ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
              {isLive ? "LIVE" : "PAPER"}
            </span>
            <span className="text-cyan-400 text-xs font-bold">{data.activeAccount || "Unknown"}</span>
          </div>
        </div>
      </header>

      <main className="pt-12 px-4 max-w-4xl mx-auto space-y-3 pb-20">

        {/* EQUITY */}
        <div className="bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-cyan-900/40 rounded-xl p-5 text-center border-2 border-purple-600 shadow-2xl">
          <div className="text-4xl font-black">{data.equity || "$0"}</div>
          <div className={`text-xl font-bold mt-2 ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
          {data.dailyPnL && (
            <div className="text-sm mt-1 text-gray-400">Daily: {data.dailyPnL}</div>
          )}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="bg-gray-900/80 rounded-lg p-2.5 border border-purple-700">
            <TrendingUp className="w-5 h-5 mx-auto text-purple-400 mb-1" />
            <div className="text-base font-bold text-purple-400">{data.positions || 0}/3</div>
            <div className="text-gray-500 text-xs">Pos</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-2.5 border border-pink-700">
            <Sparkles className="w-5 h-5 mx-auto text-pink-400 mb-1" />
            <div className="text-base font-bold text-pink-400">{data.rockets?.length || 0}</div>
            <div className="text-gray-500 text-xs">Rockets</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-2.5 border border-green-700">
            <div className="text-base font-bold text-green-400">{data.winRate || "0.0"}%</div>
            <div className="text-gray-500 text-xs">Win Rate</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-2.5 border border-yellow-700">
            <History className="w-5 h-5 mx-auto text-yellow-400 mb-1" />
            <div className="text-base font-bold text-yellow-400">{data.totalTrades || 0}</div>
            <div className="text-gray-500 text-xs">Trades</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-2.5 border border-cyan-700">
            <Zap className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
            <div className="text-base font-bold text-cyan-400">AI</div>
            <div className="text-gray-500 text-xs">Active</div>
          </div>
        </div>

        {/* POSITIONS */}
        {data.positionsData?.length > 0 && (
          <div className="bg-gray-900/90 rounded-xl p-3 border-2 border-cyan-600">
            <h3 className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" /> NEURO POSITIONS
            </h3>
            {data.positionsData.map((p: any, i: number) => {
              const pnl = ((p.current - p.entry) / p.entry) * 100;
              return (
                <div key={i} className={`p-2 rounded text-xs mb-2 ${pnl >= 0 ? "bg-green-900/30" : "bg-red-900/30"}`}>
                  <div className="flex justify-between">
                    <span className="font-bold">{p.symbol} ×{p.qty}</span>
                    <span className={pnl >= 0 ? "text-green-400" : "text-red-400"}>
                      {pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    ${p.entry.toFixed(2)} → ${p.current.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TRADE HISTORY */}
        {data.history?.length > 0 && (
          <div className="bg-gray-900/90 rounded-xl p-3 border border-yellow-700">
            <h3 className="text-xs font-bold text-yellow-400 mb-2">NEURO HISTORY</h3>
            <div className="space-y-1 text-xs">
              {data.history.slice(0, 6).map((t: any, i: number) => (
                <div key={i} className={`p-1.5 rounded flex justify-between ${t.result === "WIN" ? "bg-green-900/20" : "bg-red-900/20"}`}>
                  <span>{t.symbol}</span>
                  <span className={t.result === "WIN" ? "text-green-400" : "text-red-400"}>
                    {t.result} {t.pnl > 0 ? "+" : ""}{t.pnl.toFixed(1)}%
                  </span>
                  <span className="text-gray-500">{new Date(t.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGS */}
        <div className="bg-black/90 rounded-xl p-3 border-2 border-green-700">
          <h3 className="text-xs font-bold text-green-400 mb-2">NEURO LOGS</h3>
          <div className="bg-black/70 rounded p-3 h-56 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs?.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-gray-600">AI warming up...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN */}
        <div className="text-center pt-3">
          <button onClick={scan} disabled={scanning}
            className="px-16 py-4 text-sm font-black rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:scale-110 transition-all shadow-2xl border-4 border-purple-900 disabled:opacity-60">
            <RefreshCw className={`inline w-5 h-5 mr-3 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "NEUROSCANNING..." : "FORCE NEUROSCAN"}
          </button>
        </div>

        <div className="text-center py-8">
          <p className="text-lg font-black text-cyan-400 animate-pulse">
            ELITE NEURODYNAMIC PRINTING ACTIVE
          </p>
        </div>
      </main>
    </div>
  );
}
