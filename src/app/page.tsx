'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  RefreshCw,
  Rocket,          // ← THIS WAS MISSING
  DollarSign,
  TrendingUp,
  Activity,
  Flame,
  BarChart3,
} from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [backtesting, setBacktesting] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");
  const [lastBacktest, setLastBacktest] = useState<string>("");
  const [error, setError] = useState<string>("");

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 12000 });
      const parsed = {
        ...res.data,
        equity: typeof res.data.equity === "string" ? parseFloat(res.data.equity.replace(/[$,]/g, "")) || 100000 : res.data.equity || 100000,
        unrealized: typeof res.data.unrealized === "string" ? parseFloat(res.data.unrealized.replace(/[$,+]/g, "")) || 0 : res.data.unrealized || 0,
        positions: res.data.positions || 0,
        rockets: res.data.rockets || [],
        backtest: res.data.backtest || { trades: 0, winRate: 0, profitFactor: 0, totalPnL: 0, maxDD: 0, bestTrade: 0 }
      };
      setData(parsed);
      setError("");
    } catch (err: any) {
      console.error("Bot unreachable:", err.message);
      setError("Bot unreachable — check Cloud Run logs");
      setData({ status: "OFFLINE" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const triggerScan = async () => {
    if (scanning) return;
    setScanning(true);
    setLastScan(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }));
    try {
      await axios.post(`${BOT_URL}/scan`, {}, { timeout: 10000 });
    } catch {}
    setScanning(false);
    setTimeout(fetchData, 2000);
  };

  const triggerBacktest = async () => {
    if (backtesting) return;
    setBacktesting(true);
    setLastBacktest(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }));
    try {
      await axios.post(`${BOT_URL}/backtest`, {}, { timeout: 10000 });
    } catch {}
    setBacktesting(false);
    setTimeout(fetchData, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
        <Activity className="w-32 h-32 text-purple-500 animate-spin" />
        <p className="text-4xl text-purple-400 font-bold">Connecting to v97.1...</p>
      </div>
    );
  }

  if (data.status === "OFFLINE" || error) {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center text-center px-8">
        <div>
          <h1 className="text-6xl font-black text-white mb-4">BOT OFFLINE</h1>
          {error && <p className="text-xl text-orange-300 mb-4">{error}</p>}
          <p className="text-xl text-gray-300">Check Cloud Run logs</p>
        </div>
      </div>
    );
  }

  const equity = `$${Number(data.equity).toLocaleString()}`;
  const unrealized = data.unrealized >= 0
    ? `+$${Number(data.unrealized).toLocaleString()}`
    : `-$${Math.abs(Number(data.unrealized)).toLocaleString()}`;
  const positionsCount = data.positions;
  const rockets: string[] = data.rockets;
  const backtest = data.backtest;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/95 border-b border-purple-600/60">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              AlphaStream v97.1
            </h1>
            <p className="text-2xl text-orange-300 font-bold">REAL ALPACA • LOW-FLOAT • LIVE</p>
          </div>
          <span className="px-12 py-6 rounded-full text-4xl font-black bg-gradient-to-r from-emerald-500 to-green-600 shadow-2xl">
            {data.mode || "LIVE"} MODE
          </span>
        </div>
      </header>

      <main className="pt-40 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center">
          <h2 className="text-8xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent animate-pulse">
            LOW-FLOAT ROCKET HUNTER
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-cyan-500/60 hover:scale-105 transition">
            <DollarSign className="w-20 h-20 mx-auto text-cyan-400 mb-4" />
            <p className="text-5xl font-black text-cyan-300">{equity}</p>
            <p className="text-xl text-gray-300">Equity</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-green-500/60 hover:scale-105 transition">
            <TrendingUp className="w-20 h-20 mx-auto text-green-400 mb-4" />
            <p className={`text-5xl font-black ${data.unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {unrealized}
            </p>
            <p className="text-xl text-gray-300">Unrealized P&L</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-purple-500/60 hover:scale-105 transition">
            <Activity className="w-20 h-20 mx-auto text-purple-400 mb-4" />
            <p className="text-5xl font-black text-purple-300">{positionsCount}</p>
            <p className="text-xl text-gray-300">Active Rockets</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-orange-500/60 hover:scale-105 transition">
            <Rocket className="w-20 h-20 mx-auto text-orange-400 mb-4 animate-bounce" />
            <p className="text-5xl font-black text-orange-300">{rockets.length}</p>
            <p className="text-xl text-gray-300">Rockets Detected</p>
          </div>
        </div>

        {/* Rockets Grid */}
        {rockets.length > 0 && (
          <div className="bg-black/50 backdrop-blur-2xl rounded-3xl p-12 border-4 border-yellow-500 shadow-2xl">
            <h3 className="text-6xl font-black text-center text-yellow-400 mb-10 flex items-center justify-center gap-8">
              <Flame className="w-20 h-20 animate-pulse" />
              ROCKETS INCOMING
              <Flame className="w-20 h-20 animate-pulse" />
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {rockets.map((r: string, i: number) => {
                const [sym, rest] = r.split('+');
                const [pct] = rest.split(' ');
                const floatPart = r.includes('(') ? r.split('(')[1].replace(')', '') : '';
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-700 to-pink-800 rounded-2xl p-6 text-center hover:scale-110 transition shadow-xl">
                    <p className="text-4xl font-black">{sym}</p>
                    <p className="text-3xl text-green-400">+{pct}</p>
                    {floatPart && <p className="text-lg text-gray-300 mt-1">{floatPart}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto pt-8">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="py-20 text-6xl font-black rounded-3xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-60 transition-all shadow-2xl border-8 border-cyan-400 flex items-center justify-center gap-10"
          >
            <RefreshCw className={`w-24 h-24 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING..." : "FORCE SCAN"}
          </button>

          <button
            onClick={triggerBacktest}
            disabled={backtesting}
            className="py-20 text-6xl font-black rounded-3xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-60 transition-all shadow-2xl border-8 border-orange-400 flex items-center justify-center gap-10"
          >
            <BarChart3 className={`w-24 h-24 ${backtesting ? 'animate-spin' : ''}`} />
            {backtesting ? "CRUNCHING..." : "RUN BACKTEST"}
          </button>
        </div>

        <div className="text-center space-y-4 pt-8">
          <p className="text-3xl text-cyan-300">
            Last scan: <span className="font-bold text-yellow-400">{lastScan || "—"}</span> ET
          </p>
          <p className="text-3xl text-orange-300">
            Last backtest: <span className="font-bold text-yellow-400">{lastBacktest || "—"}</span> ET
          </p>
        </div>
      </main>
    </div>
  );
}
