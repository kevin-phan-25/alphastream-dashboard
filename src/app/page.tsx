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
    } catch (e) {
      console.log("Connecting...");
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

  const scan = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setTimeout(() => setScanning(false), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-16 h-16 text-purple-500 animate-spin" />
      </div>
    );
  }

  const isLive = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono text-sm">
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur border-b border-purple-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v509
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <span className={`px-6 py-2 rounded-full text-lg font-black ${isLive ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
              {isLive ? "LIVE" : "PAPER"}
            </span>
            <span className="text-cyan-400 font-bold text-lg">{data.activeAccount || "Unknown"}</span>
          </div>
        </div>
      </header>

      <main className="pt-20 px-6 max-w-4xl mx-auto space-y-6 pb-32">
        {/* EQUITY */}
        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-3xl p-10 text-center border-2 border-purple-600 shadow-2xl">
          <div className="text-7xl font-black tracking-tighter">{data.equity || "$0"}</div>
          <div className={`text-4xl font-bold mt-4 ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-gray-900/90 rounded-2xl p-6 border border-purple-700 text-center">
            <TrendingUp className="w-10 h-10 mx-auto text-purple-400 mb-2" />
            <div className="text-3xl font-black text-purple-400">{data.positions || 0}/3</div>
            <div className="text-gray-500 text-xs">Positions</div>
          </div>
          <div className="bg-gray-900/90 rounded-2xl p-6 border border-cyan-700 text-center">
            <DollarSign className="w-10 h-10 mx-auto text-cyan-400 mb-2" />
            <div className="text-3xl font-black text-cyan-400">{data.rockets?.length || 0}</div>
            <div className="text-gray-500 text-xs">Rockets Today</div>
          </div>
          <div className="bg-gray-900/90 rounded-2xl p-6 border border-green-700 text-center">
            <div className="text-3xl font-black text-green-400">{data.winRate || "0.0"}%</div>
            <div className="text-gray-500 text-xs">Win Rate</div>
          </div>
          <div className="bg-gray-900/90 rounded-2xl p-6 border border-yellow-700 text-center">
            <History className="w-10 h-10 mx-auto text-yellow-400 mb-2" />
            <div className="text-3xl font-black text-yellow-400">{data.totalTrades || 0}</div>
            <div className="text-gray-500 text-xs">Total Trades</div>
          </div>
        </div>

        {/* TRADE HISTORY */}
        {data.tradeHistory?.length > 0 && (
          <div className="bg-gray-900/90 rounded-3xl p-8 border-2 border-yellow-700">
            <h2 className="text-2xl font-black text-yellow-400 mb-6 text-center">TRADE HISTORY</h2>
            <div className="space-y-3">
              {data.tradeHistory.slice(0, 10).map((t: any, i: number) => (
                <div key={i} className={`p-4 rounded-xl ${t.result === "WIN" ? "bg-green-900/50 border border-green-600" : "bg-red-900/50 border border-red-600"}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-black text-xl">{t.symbol}</span>
                      <span className="ml-4 text-gray-400">{new Date(t.time).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-black ${t.result === "WIN" ? "text-green-400" : "text-red-400"}`}>
                        {t.result} {t.pnl > 0 ? "+" : ""}{t.pnl.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGS */}
        <div className="bg-black/90 rounded-3xl p-8 border-2 border-green-700">
          <h2 className="text-2xl font-black text-green-400 mb-6">LIVE LOGS</h2>
          <div className="bg-black/70 rounded-2xl p-6 h-96 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs?.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-center text-gray-600 py-20">Waiting for first rocket...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN */}
        <div className="text-center pt-8">
          <button onClick={scan} disabled={scanning}
            className="px-32 py-10 text-4xl font-black rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:scale-110 transition-all shadow-2xl border-4 border-purple-900 disabled:opacity-60">
            <RefreshCw className={`inline w-12 h-12 mr-6 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>

        <div className="text-center py-20">
          <p className="text-6xl font-black text-cyan-400 animate-pulse">
            ELITE PRINTING ACTIVE
          </p>
        </div>
      </main>
    </div>
  );
}
