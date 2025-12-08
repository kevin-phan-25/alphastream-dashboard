// page.tsx — AlphaStream v2000 Dashboard
'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Brain, Zap, TrendingUp, DollarSign, Crown } from 'lucide-react';

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
      console.log("AlphaStream v2000 connecting...");
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
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b border-purple-800">
        <div className="max-w-4xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
            <h1 className="text-base font-black text-purple-400">AlphaStream v2000</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black ${isLive ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
              {data.mode || "PAPER"}
            </span>
            <span className="text-cyan-400 text-xs font-bold">{data.activeAccount || "Paper"}</span>
          </div>
        </div>
      </header>

      <main className="pt-12 px-4 max-w-4xl mx-auto space-y-3 pb-20">
        <div className="bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-cyan-900/40 rounded-xl p-5 text-center border-2 border-purple-600 shadow-2xl">
          <div className="text-4xl font-black tracking-tighter">{data.equity || "$100,000"}</div>
          <div className={`text-2xl font-bold mt-2 ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 text-center">
          <div className="bg-gray-900/80 rounded-lg p-3 border border-purple-700">
            <TrendingUp className="w-6 h-6 mx-auto text-purple-400 mb-1" />
            <div className="text-xl font-black text-purple-400">{data.positions || 0}/3</div>
            <div className="text-gray-500 text-xs">POSITIONS</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-pink-700">
            <Zap className="w-6 h-6 mx-auto text-pink-400 mb-1" />
            <div className="text-xl font-black text-pink-400">{data.rockets?.length || 0}</div>
            <div className="text-gray-500 text-xs">ROCKETS</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-green-700">
            <div className="text-xl font-black text-green-400">{data.winRate || "0.0"}%</div>
            <div className="text-gray-500 text-xs">WIN RATE</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-yellow-700">
            <Crown className="w-6 h-6 mx-auto text-yellow-400 mb-1" />
            <div className="text-xl font-black text-yellow-400">{data.totalTrades || 0}</div>
            <div className="text-gray-500 text-xs">TRADES</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-cyan-700">
            <Brain className="w-6 h-6 mx-auto text-cyan-400 mb-1" />
            <div className="text-xl font-black text-cyan-400">AI</div>
            <div className="text-gray-500 text-xs">ACTIVE</div>
          </div>
        </div>

        <div className="bg-black/90 rounded-xl p-4 border-2 border-green-700">
          <h3 className="text-sm font-bold text-green-400 mb-3">NEURO LOGS (ET)</h3>
          <div className="bg-black/70 rounded-lg p-3 h-80 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs?.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-center text-gray-600 py-20">AI warming up...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        <div className="text-center pt-6">
          <button onClick={forceScan} disabled={scanning}
            className="px-24 py-6 text-2xl font-black rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:scale-110 transition-all shadow-2xl border-4 border-purple-900 disabled:opacity-60">
            <RefreshCw className={`inline w-10 h-10 mr-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "NEUROSCANNING..." : "FORCE NEUROSCAN"}
          </button>
        </div>

        <div className="text-center py-12">
          <p className="text-3xl font-black text-cyan-400 animate-pulse">
            ALPHASTREAM v2000 — FINAL — PRINTING
          </p>
        </div>
      </main>
    </div>
  );
}
