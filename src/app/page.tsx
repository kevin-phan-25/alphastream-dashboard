// app/page.tsx — AlphaStream v9000 META DASHBOARD — FINAL 2025 EDITION
'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Brain, Zap, TrendingUp, DollarSign, Cpu, AlertCircle, Trophy, Flame } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetch = async () => {
    try {
      const [mainRes, statsRes] = await Promise.all([
        axios.get(BOT_URL),
        axios.get(`${BOT_URL}/stats`).catch(() => ({ data: {} }))
      ]);
      setData(mainRes.data);
      setStats(statsRes.data);
      setError(null);
    } catch (err: any) {
      setError("Bot offline — check Cloud Run");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const i = setInterval(fetch, 8000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    setError(null);
    try {
      await axios.post(`${BOT_URL}/scan`);
      setError("Scan triggered — hunting");
    } catch {
      setError("Scan failed");
    } finally {
      setTimeout(() => setScanning(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  const ml = data.ml || { tradesLearned: 0 };
  const isLive = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b-4 border-purple-600 px-4 py-3">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v9000
            </h1>
            <span className="text-xs text-cyan-400 font-bold">2025 META</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-5 py-2 rounded-full font-black text-sm ${isLive ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
              {data.mode || "PAPER"}
            </span>
            <span className="text-yellow-400 font-bold">{data.activeAccount || "Paper"}</span>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-5xl mx-auto space-y-6 pb-32">

        {/* EQUITY */}
        <div className="bg-gradient-to-r from-purple-900/60 via-pink-900/60 to-cyan-900/60 rounded-2xl p-8 text-center border-4 border-purple-600 shadow-2xl">
          <div className="text-6xl font-black tracking-tighter">{data.equity || "$100,000"}</div>
          <div className={`text-4xl font-bold mt-4 ${data.unrealized?.[0] === '+' ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* ELITE STATS GRID */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
          <div className="bg-gray-900/90 rounded-xl p-5 border-2 border-purple-700">
            <TrendingUp className="w-10 h-10 mx-auto text-purple-400 mb-2" />
            <div className="text-3xl font-black">{data.positions || 0}/4</div>
            <div className="text-gray-500 text-xs">POSITIONS</div>
          </div>
          <div className="bg-gray-900/90 rounded-xl p-5 border-2 border-pink-700">
            <Zap className="w-10 h-10 mx-auto text-pink-400 mb-2" />
            <div className="text-3xl font-black">{data.rockets?.length || 0}</div>
            <div className="text-gray-500 text-xs">ROCKETS</div>
          </div>
          <div className="bg-gray-900/90 rounded-xl p-5 border-2 border-green-700">
            <Trophy className="w-10 h-10 mx-auto text-green-400 mb-2" />
            <div className="text-3xl font-black text-green-400">{stats.winRate || data.winRate || "0"}%</div>
            <div className="text-gray-500 text-xs">WIN RATE</div>
          </div>
          <div className="bg-gray-900/90 rounded-xl p-5 border-2 border-yellow-700">
            <Flame className="w-10 h-10 mx-auto text-yellow-400 mb-2" />
            <div className="text-3xl font-black text-yellow-400">{stats.profitFactor || "∞"}</div>
            <div className="text-gray-500 text-xs">PROFIT FACTOR</div>
          </div>
          <div className="bg-gray-900/90 rounded-xl p-5 border-2 border-cyan-700">
            <Cpu className="w-10 h-10 mx-auto text-cyan-400 mb-2 animate-pulse" />
            <div className="text-3xl font-black text-cyan-400">{ml.tradesLearned || 0}</div>
            <div className="text-gray-500 text-xs">LEARNED</div>
          </div>
          <div className="bg-gray-900/90 rounded-xl p-5 border-2 border-orange-700">
            <Brain className="w-10 h-10 mx-auto text-orange-400 mb-2" />
            <div className="text-3xl font-black text-orange-400">AI</div>
            <div className="text-gray-500 text-xs">ELITE</div>
          </div>
        </div>

        {/* POSITIONS */}
        {data.positionsData?.length > 0 && (
          <div className="bg-gray-900/95 rounded-2xl p-6 border-4 border-cyan-600">
            <h3 className="text-xl font-bold text-cyan-400 mb-4 text-center">LIVE POSITIONS</h3>
            {data.positionsData.map((p: any, i: number) => {
              const pnl = ((p.current - p.entry) / p.entry) * 100;
              return (
                <div key={i} className={`p-5 rounded-xl mb-4 border-4 ${pnl >= 0 ? "bg-green-900/60 border-green-500" : "bg-red-900/60 border-red-500"}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-4xl font-black">{p.symbol}</span>
                      <span className="ml-4 text-xl text-gray-400">×{p.qty}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-black ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}%
                      </div>
                      <div className="text-2xl text-gray-300">${p.current?.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LOGS */}
        <div className="bg-black/95 rounded-2xl p-6 border-4 border-green-700">
          <h3 className="text-xl font-bold text-green-400 mb-4 text-center">NEURO LOGS</h3>
          <div className="bg-black/80 rounded-xl p-4 h-96 overflow-y-auto font-mono text-sm text-gray-200">
            {data.logs?.slice(-40).map((l: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0">
                {l.includes("ENTRY") ? (
                  <span className="text-cyan-400 font-bold">{l.split("] ")[1]}</span>
                ) : l.includes("WIN") ? (
                  <span className="text-green-400 font-bold">{l.split("] ")[1]}</span>
                ) : l.includes("LOSS") ? (
                  <span className="text-red-400 font-bold">{l.split("] ")[1]}</span>
                ) : l.includes("LEARNED") ? (
                  <span className="text-yellow-400 font-bold">{l.split("] ")[1]}</span>
                ) : (
                  <span className="text-gray-500">{l.split("] ")[1]}</span>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-900/90 rounded-2xl p-6 border-4 border-red-700 text-center">
            <AlertCircle className="w-10 h-10 inline text-red-400 mr-3" />
            <span className="text-2xl text-red-300">{error}</span>
          </div>
        )}

        {/* FORCE SCAN */}
        <div className="text-center pt-8">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-32 py-8 text-4xl font-black rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:scale-105 transition-all shadow-2xl border-8 border-purple-900 disabled:opacity-60"
          >
            <RefreshCw className={`inline w-16 h-16 mr-6 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "HUNTING..." : "FORCE HUNT"}
          </button>
        </div>

        {/* FINAL MESSAGE */}
        <div className="text-center py-16">
          <p className="text-6xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            v9000 — THE AI IS UNSTOPPABLE
          </p>
          <p className="text-2xl text-gray-400 mt-6">
            {ml.tradesLearned} TRADES LEARNED • PROFIT FACTOR {stats.profitFactor || "∞"} • ELITE
          </p>
        </div>
      </main>
    </div>
  );
}
