'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Brain, Zap, TrendingUp, DollarSign } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetch = async () => {
    try { setData((await axios.get(BOT_URL)).data); } 
    catch {}
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
        <Activity className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  const isLive = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b border-purple-800">
        <div className="max-w-4xl mx-auto px-3 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-sm font-black text-purple-400">AlphaStream v900</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded text-xs font-bold ${isLive ? "bg-red-600" : "bg-emerald-600"}`}>
              {isLive ? "LIVE" : "PAPER"}
            </span>
            <span className="text-cyan-400 text-xs">{data.activeAccount || "?"}</span>
          </div>
        </div>
      </header>

      <main className="pt-10 px-3 max-w-4xl mx-auto space-y-2.5 pb-20">

        {/* EQUITY */}
        <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-lg p-4 text-center border border-purple-700">
          <div className="text-3xl font-black">{data.equity || "$0"}</div>
          <div className={`text-lg font-bold ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-5 gap-1.5 text-center">
          <div className="bg-gray-900/80 rounded p-2 border border-purple-700">
            <TrendingUp className="w-4 h-4 mx-auto text-purple-400 mb-0.5" />
            <div className="text-sm font-bold text-purple-400">{data.positions || 0}/3</div>
            <div className="text-gray-500 text-xs">Pos</div>
          </div>
          <div className="bg-gray-900/80 rounded p-2 border border-pink-700">
            <Zap className="w-4 h-4 mx-auto text-pink-400 mb-0.5" />
            <div className="text-sm font-bold text-pink-400">{data.rockets?.length || 0}</div>
            <div className="text-gray-500 text-xs">Rockets</div>
          </div>
          <div className="bg-gray-900/80 rounded p-2 border border-green-700">
            <div className="text-sm font-bold text-green-400">{data.winRate || "0.0"}%</div>
            <div className="text-gray-500 text-xs">Win</div>
          </div>
          <div className="bg-gray-900/80 rounded p-2 border border-yellow-700">
            <div className="text-sm font-bold text-yellow-400">{data.totalTrades || 0}</div>
            <div className="text-gray-500 text-xs">Trades</div>
          </div>
          <div className="bg-gray-900/80 rounded p-2 border border-cyan-700">
            <Brain className="w-4 h-4 mx-auto text-cyan-400 mb-0.5" />
            <div className="text-sm font-bold text-cyan-400">AI</div>
            <div className="text-gray-500 text-xs">ON</div>
          </div>
        </div>

        {/* POSITIONS */}
        {data.positionsData?.length > 0 && (
          <div className="bg-gray-900/90 rounded-lg p-2.5 border border-cyan-600">
            <h3 className="text-xs font-bold text-cyan-400 mb-1.5">POSITIONS</h3>
            {data.positionsData.map((p: any, i: number) => {
              const pnl = ((p.current - p.entry) / p.entry) * 100;
              return (
                <div key={i} className={`p-1.5 rounded text-xs mb-1.5 ${pnl >= 0 ? "bg-green-900/30" : "bg-red-900/30"}`}>
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

        {/* LOGS */}
        <div className="bg-black/90 rounded-lg p-2.5 border border-green-700">
          <h3 className="text-xs font-bold text-green-400 mb-1.5">LOGS</h3>
          <div className="bg-black/70 rounded p-2 h-52 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs?.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-gray-600">AI warming up...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN */}
        <div className="text-center pt-2">
          <button onClick={scan} disabled={scanning}
            className="px-14 py-3 text-sm font-bold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition disabled:opacity-50">
            <RefreshCw className={`inline w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING" : "FORCE SCAN"}
          </button>
        </div>

        <div className="text-center py-6 text-cyan-400 text-xs font-bold">
          ULTIMATE NEURODYNAMIC PRINTING ACTIVE
        </div>
      </main>
    </div>
  );
}
