// app/page.tsx — AlphaStream v200000 Dashboard (2025 Final)
// Fully synced with ML + Sentiment + Alpaca API
'use client';
import { RefreshCw, Brain, Zap, TrendingUp, Activity } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // UPDATE THIS TO YOUR CLOUD RUN URL
  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app"; 

  const fetch = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      setData(res.data);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 6500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setTimeout(() => setScanning(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Brain className="w-12 h-12 text-purple-500 animate-pulse" />
      </div>
    );
  }

  const isCloseWindow = data.marketStatus?.includes("CLOSE");

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 bg-black/95 border-b border-purple-800 px-3 py-2 z-50">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-xs font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v200000
            </h1>
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-2xs font-black ${isCloseWindow ? 'bg-red-600' : 'bg-green-600'}`}>
              {data.marketStatus || "LOADING"}
            </span>
            <span className="text-cyan-400 text-2xs">
              {data.lastUpdate?.slice(11, 19) || "--:--"}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-12 px-3 max-w-3xl mx-auto space-y-3 pb-20">
        {/* EQUITY */}
        <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-xl p-4 text-center border-2 border-purple-700">
          <div className="text-3xl font-black">{data.equity || "$100,000"}</div>
          <div className={`text-2xl font-bold ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* ML BRAIN STATS */}
        {data.brain && (
          <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-xl p-3 border border-pink-700">
            <div className="text-pink-400 font-bold text-center text-2xs mb-2">TD(λ) BRAIN</div>
            <div className="grid grid-cols-4 gap-2 text-center text-2xs">
              <div>
                <div className="font-bold text-white">{data.brain.lessons || 0}</div>
                <div className="text-gray-500">Lessons</div>
              </div>
              <div>
                <div className="font-bold text-cyan-400">{data.brain.exploration || "30.0%"}</div>
                <div className="text-gray-500">Explore</div>
              </div>
              <div>
                <div className="font-bold text-yellow-400">{data.brain.gap}</div>
                <div className="text-gray-500">Gap</div>
              </div>
              <div>
                <div className="font-bold text-orange-400">{data.brain.risk}</div>
                <div className="text-gray-500">Risk</div>
              </div>
            </div>
          </div>
        )}

        {/* CORE STATS */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-900/90 rounded-lg p-2 border border-purple-600">
            <TrendingUp className="w-5 h-5 mx-auto text-purple-400 mb-1" />
            <div className="text-lg font-bold">{data.positions || 0}</div>
            <div className="text-2xs text-gray-500">POS</div>
          </div>
          <div className="bg-gray-900/90 rounded-lg p-2 border border-cyan-600">
            <Zap className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
            <div className="text-lg font-bold">{data.rockets?.length || 0}</div>
            <div className="text-2xs text-gray-500">GAPS</div>
          </div>
          <div className="bg-gray-900/90 rounded-lg p-2 border border-green-600">
            <div className="text-lg font-bold text-green-400">{data.stats?.winRate || "—"}%</div>
            <div className="text-2xs text-gray-500">WIN</div>
          </div>
          <div className="bg-gray-900/90 rounded-lg p-2 border border-orange-600">
            <div className="text-lg font-bold">{data.stats?.totalTrades || 0}</div>
            <div className="text-2xs text-gray-500">TRADES</div>
          </div>
        </div>

        {/* POSITIONS */}
        {data.positionsList?.length > 0 && (
          <div className="bg-gray-900/95 rounded-xl p-3 border border-cyan-600">
            <div className="text-cyan-400 font-bold text-center text-2xs mb-2">LIVE POSITIONS</div>
            {data.positionsList.map((p: any, i: number) => (
              <div key={i} className="flex justify-between py-1.5 text-2xs border-b border-gray-800 last:border-0">
                <span className="font-bold">{p.symbol} ×{p.qty}</span>
                <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* LOGS */}
        <div className="bg-black/95 rounded-xl p-3 border-2 border-green-700">
          <div className="text-green-400 font-bold text-center text-2xs mb-2">NEURO LOGS</div>
          <div className="bg-black/80 rounded p-2 h-56 overflow-y-auto font-mono text-2xs leading-tight">
            {data.logs?.slice(-25).map((log: string, i: number) => {
              const text = log.split("] ")[1] || log;
              return (
                <div key={i} className="py-0.5">
                  {text.includes("ENTRY") ? <span className="text-cyan-400 font-bold">{text}</span> :
                   text.includes("FORCED") || text.includes("CLOSE") ? <span className="text-orange-400 font-bold animate-pulse">{text}</span> :
                   text.includes("ML:") ? <span className="text-yellow-400">{text}</span> :
                   text.includes("WIN") || text.includes("PARTIAL") ? <span className="text-green-400">{text}</span> :
                   text.includes("STOP") ? <span className="text-red-400">{text}</span> :
                   <span className="text-gray-500">{text}</span>}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN */}
        <div className="text-center pt-4">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-24 py-4 text-base font-black rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:scale-105 transition-all disabled:opacity-50 border-2 border-purple-800 shadow-lg"
          >
            <RefreshCw className={`inline w-6 h-6 mr-3 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING..." : "FORCE SCAN"}
          </button>
        </div>

        <div className="text-center py-4 text-cyan-400 text-2xs font-bold animate-pulse">
          v200000 • ML BRAIN • SENTIMENT • FIRESTORE • 3:45–3:59 CLOSE • $0 FOREVER
        </div>
      </main>
    </div>
  );
}
