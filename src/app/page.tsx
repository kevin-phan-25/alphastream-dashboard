'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Crown, TrendingUp, DollarSign, History } from 'lucide-react';

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
        <Activity className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  const isLive = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b border-purple-800">
        <div className="max-w-4xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <h1 className="text-base font-bold text-purple-400">AlphaStream v702</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded text-xs font-bold ${isLive ? "bg-red-600" : "bg-emerald-600"}`}>
              {isLive ? "LIVE" : "PAPER"}
            </span>
            <span className="text-cyan-400 text-xs">{data.activeAccount || "Unknown"}</span>
          </div>
        </div>
      </header>

      <main className="pt-12 px-4 max-w-4xl mx-auto space-y-3 pb-20">

        {/* EQUITY */}
        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-4 text-center border border-purple-700">
          <div className="text-3xl font-black">{data.equity || "$0"}</div>
          <div className={`text-lg font-bold ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="bg-gray-900/80 rounded-lg p-2.5 border border-purple-700">
            <TrendingUp className="w-5 h-5 mx-auto text-purple-400 mb-1" />
            <div className="text-base font-bold text-purple-400">{data.positions || 0}/3</div>
            <div className="text-gray-500 text-xs">Pos</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-2.5 border border-cyan-700">
            <DollarSign className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
            <div className="text-base font-bold text-cyan-400">{data.rockets?.length || 0}</div>
            <div className="text-gray-500 text-xs">Rockets</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-2.5 border border-green-700">
            <div className="text-base font-bold text-green-400">{data.winRate || "0.0"}%</div>
            <div className="text-gray-500 text-xs">Win</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-2.5 border border-yellow-700">
            <History className="w-5 h-5 mx-auto text-yellow-400 mb-1" />
            <div className="text-base font-bold text-yellow-400">{data.totalTrades || 0}</div>
            <div className="text-gray-500 text-xs">Trades</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-2.5 border border-pink-700">
            <div className="text-base font-bold text-pink-400">1:2.8</div>
            <div className="text-gray-500 text-xs">RR</div>
          </div>
        </div>

        {/* POSITIONS */}
        {data.positionsData?.length > 0 && (
          <div className="bg-gray-900/90 rounded-xl p-3 border border-cyan-600">
            <h3 className="text-xs font-bold text-cyan-400 mb-2">POSITIONS</h3>
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
        {data.tradeHistory?.length > 0 && (
          <div className="bg-gray-900/90 rounded-xl p-3 border border-yellow-700">
            <h3 className="text-xs font-bold text-yellow-400 mb-2">HISTORY</h3>
            <div className="space-y-1 text-xs">
              {data.tradeHistory.slice(0, 6).map((t: any, i: number) => (
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
        <div className="bg-black/90 rounded-xl p-3 border border-green-700">
          <h3 className="text-xs font-bold text-green-400 mb-2">LOGS</h3>
          <div className="bg-black/70 rounded p-3 h-56 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs?.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-gray-600">Waiting...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN */}
        <div className="text-center pt-3">
          <button onClick={scan} disabled={scanning}
            className="px-14 py-3 text-sm font-bold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition disabled:opacity-50">
            <RefreshCw className={`inline w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING" : "FORCE SCAN"}
          </button>
        </div>

        <div className="text-center py-6 text-cyan-400 text-xs font-bold">
          ELITE PRINTING ACTIVE
        </div>
      </main>
    </div>
  );
}
