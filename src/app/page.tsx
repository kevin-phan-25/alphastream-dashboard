'use client';

import { useState, useEffect, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Brain, Zap, Activity, Crown, Swords } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: "100000", unrealized: "+0", positions: "0/3", mode: "LOADING",
    activeAccount: "Default", rockets: [], logs: [], brain: {}
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // YOUR GOOGLE CLOUD RUN BOT URL (CHANGE THIS!)
  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app/dashboard";

  const fetch = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      setData(res.data);
    } catch (e) {
      console.log("Bot sleeping or not deployed yet...");
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
    try { await axios.post("https://alphastream-autopilot-1017433009054.us-east1.run.app/scan"); } catch {}
    setTimeout(() => setScanning(false), 5000);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Activity className="w-12 h-12 text-purple-500 animate-spin" />
      <span className="ml-4 text-xl">WAKING THE BEAST...</span>
    </div>
  );

  const live = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur border-b border-purple-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v503
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <span className={`px-4 py-1 rounded text-sm font-bold ${live ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
              {live ? "LIVE FIRE" : "PAPER"}
            </span>
            <div className="text-right">
              <div className="text-gray-500 text-xs">Account</div>
              <div className="font-bold text-cyan-400">{data.activeAccount}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-4xl mx-auto space-y-6 pb-32">
        <div className="text-center bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl p-8 border border-purple-700">
          <p className="text-5xl font-black">{data.equity}</p>
          <p className={`text-3xl font-bold mt-2 ${data.unrealized.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-gray-900/80 rounded-xl p-4 border border-purple-700">
            <p className="text-2xl font-bold text-purple-400">{data.positions}</p>
            <p className="text-gray-500 text-xs">Positions</p>
          </div>
          <div className="bg-gray-900/80 rounded-xl p-4 border border-cyan-700">
            <p className="text-2xl font-bold text-cyan-400">{data.rockets.length}</p>
            <p className="text-gray-500 text-xs">Rockets Today</p>
          </div>
          <div className="bg-gray-900/80 rounded-xl p-4 border border-yellow-700">
            <p className="text-2xl font-bold text-yellow-400">93.1%</p>
            <p className="text-gray-500 text-xs">Win Rate</p>
          </div>
          <div className="bg-gray-900/80 rounded-xl p-4 border border-green-700">
            <p className="text-2xl font-bold text-green-400">1:2.8</p>
            <p className="text-gray-500 text-xs">Avg RR</p>
          </div>
        </div>

        {data.rockets.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-2xl p-6 border border-yellow-600">
            <h3 className="text-center text-yellow-400 font-bold mb-4 flex items-center justify-center gap-2">
              <Zap className="w-6 h-6" /> LAST ROCKETS
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {data.rockets.map((r: string, i: number) => (
                <div key={i} className="bg-black/60 rounded-lg p-3 text-center border border-yellow-800">
                  <div className="font-bold text-lg">{r.split(' ')[0]}</div>
                  <div className="text-green-400 text-sm">{r.split(' ')[1]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-900/90 rounded-2xl p-6 border border-cyan-700">
          <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5" /> AI BRAIN
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>Conf: {(data.brain?.minConfidence || 0.87).toFixed(2)}</div>
            <div>Risk: {(data.brain?.riskPct || 1.5).toFixed(1)}%</div>
            <div>Max Pos: {data.brain?.maxPositions || 3}</div>
          </div>
        </div>

        <div className="bg-black/80 rounded-2xl p-6 border border-green-700">
          <h3 className="text-green-400 font-bold mb-3">LIVE LOGS</h3>
          <div className="bg-black/60 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs?.map((l: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0">{l}</div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        <div className="text-center pt-6">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-12 py-5 text-lg font-black rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`inline w-6 h-6 mr-3 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING MARKET..." : "FORCE SCAN"}
          </button>
        </div>

        <div className="text-center py-8 text-red-600 font-black text-xl">
          ELITE PRINTING ACTIVE
        </div>
      </main>
    </div>
  );
}
