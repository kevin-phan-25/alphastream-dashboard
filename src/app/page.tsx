'use client';
import { RefreshCw, Brain, Zap, TrendingUp, Activity } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [data, setData] = useState<any>({});
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  // Fetch bot data
  const fetchData = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      setData(res.data);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  // Force scan
  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setTimeout(() => setScanning(false), 2000);
  };

  const isCloseWindow = data.marketStatus?.includes("CLOSE");
  const winRate = data.stats?.totalTrades
    ? ((data.stats.winningTrades || 0) / data.stats.totalTrades * 100).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 bg-black/95 border-b border-purple-800 px-3 py-2 z-50">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-xs font-bold text-purple-400">AlphaStream v200000</h1>
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-2xs font-black ${isCloseWindow ? 'bg-red-600' : 'bg-green-600'}`}>
              {data.marketStatus || "LOADING"}
            </span>
            <span className="text-cyan-400 text-2xs">{data.lastUpdate?.slice(11, 19) || "--:--"}</span>
          </div>
        </div>
      </header>

      <main className="pt-12 px-3 max-w-3xl mx-auto space-y-3 pb-12">
        {/* EQUITY + UNREALIZED */}
        <div className="bg-purple-900/30 rounded-xl p-3 text-center border border-purple-700">
          <div className="text-2xl font-bold">{data.equity || "$100,000"}</div>
          <div className={data.unrealized?.includes('+') ? "text-green-400" : "text-red-400 text-lg"}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* CORE STATS */}
        <div className="grid grid-cols-5 gap-2 text-center">
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
            <div className="text-lg font-bold text-green-400">{winRate}%</div>
            <div className="text-2xs text-gray-500">WIN</div>
          </div>
          <div className="bg-gray-900/90 rounded-lg p-2 border border-orange-600">
            <div className="text-lg font-bold">{data.stats?.totalTrades || 0}</div>
            <div className="text-2xs text-gray-500">TRADES</div>
          </div>
          <div className="bg-gray-900/90 rounded-lg p-2 border border-yellow-600">
            <div className="text-lg font-bold">{data.stats?.openPositions || 0}</div>
            <div className="text-2xs text-gray-500">OPEN</div>
          </div>
        </div>

        {/* ROCKETS / GAPS */}
        {data.rockets?.length > 0 && (
          <div className="bg-gray-900/95 rounded-xl p-2 border border-cyan-600">
            <div className="text-cyan-400 font-bold text-center text-2xs mb-1">TOP ROCKETS</div>
            {data.rockets.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex justify-between text-2xs py-1 border-b border-gray-800 last:border-0">
                <span className="font-bold">{r.symbol || r.split(" ")[0]}</span>
                <span className="text-green-400">{r.pnl?.includes("+") ? r.pnl.split("|")[0].trim() : r.pnl}</span>
              </div>
            ))}
          </div>
        )}

        {/* LIVE POSITIONS */}
        {data.positionsList?.length > 0 && (
          <div className="bg-gray-900/95 rounded-xl p-2 border border-green-600">
            <div className="text-green-400 font-bold text-center text-2xs mb-1">LIVE POSITIONS</div>
            {data.positionsList.slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="flex justify-between text-2xs py-1 border-b border-gray-800 last:border-0">
                <span className="font-bold">{p.symbol} ×{p.qty}</span>
                <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* NEURO LOGS */}
        <div className="bg-black/95 rounded-xl p-2 border border-green-700">
          <div className="text-green-400 font-bold text-center text-2xs mb-1">NEURO LOGS</div>
          <div className="bg-black/80 rounded p-1 h-40 overflow-y-auto font-mono text-2xs">
            {data.logs?.slice(-20).map((log: string, i: number) => {
              const text = log.split("] ")[1] || log;
              let colorClass = "text-gray-500";

              if (text.includes("ENTRY")) colorClass = "text-cyan-400 font-bold";
              else if (text.includes("FORCED") || text.includes("CLOSE")) colorClass = "text-orange-400 font-bold animate-pulse";
              else if (text.includes("ML:")) colorClass = "text-yellow-400";
              else if (text.includes("WIN") || text.includes("PARTIAL")) colorClass = "text-green-400";
              else if (text.includes("STOP")) colorClass = "text-red-400";

              return <div key={i} className={`py-0.5 ${colorClass}`}>{text}</div>;
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN */}
        <div className="text-center pt-2">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-16 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:scale-105 transition-all disabled:opacity-50 border-2 border-purple-800 shadow-lg"
          >
            <RefreshCw className={`inline w-5 h-5 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING..." : "FORCE SCAN"}
          </button>
        </div>

        <div className="text-center py-2 text-cyan-400 text-2xs font-bold animate-pulse">
          v200000 • FULL ML BRAIN • ROCKETS • POSITIONS • LOGS • FIRESTORE
        </div>
      </main>
    </div>
  );
}
