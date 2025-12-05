'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Zap, Trophy, TrendingUp, Skull } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: 100000,
    unrealized: 0,
    positions: 0,
    mode: "LOADING",
    rockets: [],
    winRate: "0.0",
    trades: 0,
    logs: []
  });

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(URL, { timeout: 10000 });
      const m = res.data;

      const equity = parseInt(m.equity.replace(/[^0-9]/g, "")) || 100000;
      const unrealized = parseInt(m.unrealized?.replace(/[^0-9-]/g, "") || "0");
      const winRate = m.winRate?.replace("%", "") || "0.0";
      const totalTrades = m.trades || 0;

      setData({
        equity,
        unrealized,
        positions: m.positions || 0,
        mode: m.mode || "PAPER",
        rockets: m.rockets || [],
        winRate,
        totalTrades,
        logs: m.logs || []
      });
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 7000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    try { await axios.post(`${URL}/scan`); } catch {}
    setTimeout(() => setScanning(false), 9000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-20 h-20 text-purple-500 animate-spin" />
      </div>
    );
  }

  const isLive = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white overflow-x-hidden">
      {/* HEADER */}
      <div className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur-md border-b-4 border-purple-600 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AlphaStream v105.3
            </h1>
            <p className="text-sm text-gray-400 mt-1">Premarket Momentum Sniper • 100% Dynamic</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-sm text-gray-400">TRADING MODE</p>
              <p className={`text-3xl font-black ${isLive ? "text-red-500 animate-pulse" : "text-emerald-400"}`}>
                {data.mode}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" /> WIN RATE
              </p>
              <p className="text-5xl font-black text-yellow-400">{data.winRate}%</p>
            </div>
          </div>
        </div>
      </div>

      <main className="pt-32 px-6 max-w-6xl mx-auto space-y-8 pb-32">
        {/* EQUITY HERO CARD */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-xl rounded-3xl p-10 border-4 border-purple-600 shadow-2xl text-center">
          <p className="text-xl text-gray-300 mb-2">Account Equity</p>
          <p className="text-7xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            ${data.equity.toLocaleString()}
          </p>
          <p className={`text-4xl font-bold mt-4 ${data.unrealized >= 0 ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized >= 0 ? "+" : ""}{data.unrealized.toLocaleString()}
            <span className="text-ml-2 text-2xl"> unrealized</span>
          </p>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gray-900/80 backdrop-blur rounded-2xl p-8 border-2 border-purple-600 text-center">
            <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <p className="text-4xl font-black">{data.totalTrades}</p>
            <p className="text-gray-400">Total Trades</p>
          </div>
          <div className="bg-gray-900/80 backdrop-blur rounded-2xl p-8 border-2 border-cyan-600 text-center">
            <Zap className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
            <p className="text-4xl font-black">{data.positions}</p>
            <p className="text-gray-400">Live Positions</p>
          </div>
          <div className="bg-gray-900/80 backdrop-blur rounded-2xl p-8 border-2 border-yellow-600 text-center">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-4xl font-black">{data.winRate}%</p>
            <p className="text-gray-400">Win Rate</p>
          </div>
          <div className="bg-gray-900/80 backdrop-blur rounded-2xl p-8 border-2 border-pink-600 text-center">
            <Skull className="w-12 h-12 text-pink-400 mx-auto mb-3" />
            <p className="text-4xl font-black">{data.rockets.length}</p>
            <p className="text-gray-400">Rockets Today</p>
          </div>
        </div>

        {/* LAST ROCKETS */}
        {data.rockets.length > 0 && (
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 border-4 border-yellow-500 shadow-2xl">
            <h2 className="text-3xl font-black text-center text-yellow-400 mb-8 flex items-center justify-center gap-4">
              <Zap className="w-10 h-10" /> LAST ROCKETS FIRED <Zap className="w-10 h-10" />
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {data.rockets.slice(0, 12).map((r: string, i: number) => {
                const [sym, gain] = r.split(' ');
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 rounded-2xl p-6 text-center border-2 border-yellow-500 shadow-lg transform hover:scale-110 transition-all">
                    <div className="text-2xl font-black text-white">{sym}</div>
                    <div className="text-3xl font-bold text-green-400 mt-2">{gain}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LIVE LOGS */}
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl p-8 border-4 border-green-600 shadow-2xl">
          <h2 className="text-2xl font-black text-green-400 mb-6 text-center">LIVE EXECUTION LOG</h2>
          <div className="bg-black/80 rounded-2xl p-6 h-96 overflow-y-auto font-mono text-sm border border-green-800">
            {data.logs.length > 0 ? (
              data.logs.map((log: string, i: number) => (
                <div key={i} className="py-2 border-b border-gray-800 last:border-0 text-gray-300">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-10">Waiting for first rocket...</div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN BUTTON */}
        <div className="text-center pt-10">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="relative px-40 py-16 text-6xl font-black rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:scale-110 transition-all shadow-3xl border-8 border-purple-400 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-8">
              <RefreshCw className={`w-20 h-20 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? "SNIPING..." : "FORCE SCAN"}
            </span>
            <div className="absolute inset-0 bg-white/20 animate-ping rounded-3xl group-hover:animate-none" />
          </button>
        </div>

        <div className="text-center text-gray-600 text-sm mt-20">
          © 2025 AlphaStream • You just ended Warrior Trading
        </div>
      </main>
    </div>
  );
}
