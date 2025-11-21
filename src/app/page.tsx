'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Rocket, TrendingUp, DollarSign, Flame, Zap, Activity, AlertTriangle, BarChart3 } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [backtesting, setBacktesting] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL?.trim();

  const fetch = async () => {
    if (!BOT_URL) return;
    try {
      const res = await axios.get(BOT_URL);
      setData(res.data);
    } catch {
      setData({ status: "OFFLINE" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); const i = setInterval(fetch, 10000); return () => clearInterval(i); }, []);

  const triggerScan = async () => {
    if (!BOT_URL || scanning) return;
    setScanning(true);
    setLastScan(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }));
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setScanning(false);
    setTimeout(fetch, 2000);
  };

  const triggerBacktest = async () => {
    if (!BOT_URL || backtesting) return;
    setBacktesting(true);
    await axios.post(`${BOT_URL}/backtest`).catch(() => {});
    setBacktesting(false);
    setTimeout(fetch, 1500);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Activity className="w-32 h-32 text-purple-500 animate-spin" /></div>;
  if (!BOT_URL || data.status === "OFFLINE") return <div className="min-h-screen bg-red-900 flex items-center justify-center text-white"><AlertTriangle className="w-32 h-32" /><h1 className="text-6xl">BOT OFFLINE</h1></div>;

  const bt = data.backtest || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/95 border-b border-purple-600/60">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              AlphaStream v97.0
            </h1>
            <p className="text-2xl text-orange-300 font-bold">REAL ALPACA EQUITY • LOW-FLOAT • BACKTEST BUTTON</p>
          </div>
          <span className="px-12 py-6 rounded-full text-4xl font-black bg-gradient-to-r from-emerald-500 to-green-600">
            {data.mode} MODE
          </span>
        </div>
      </header>

      <main className="pt-40 px-6 max-w-7xl mx-auto space-y-12">

        {/* Hero */}
        <div className="text-center">
          <h2 className="text-8xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent animate-pulse">
            LOW-FLOAT ROCKET HUNTER
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* same as before */}
          {/* ... equity, unrealized, positions, rockets ... */}
        </div>

        {/* Backtest Card */}
        {bt.trades > 0 && (
          <div className="bg-black/70 backdrop-blur-2xl rounded-3xl p-12 border-4 border-cyan-500">
            <h3 className="text-5xl font-black text-center text-cyan-400 mb-8 flex items-center justify-center gap-6">
              <BarChart3 className="w-16 h-16" />
              BACKTEST RESULTS
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8 text-center">
              <div><p className="text-gray-400">Trades</p><p className="text-5xl font-bold text-white">{bt.trades}</p></div>
              <div><p className="text-gray-400">Win Rate</p><p className="text-5xl font-bold text-green-400">{bt.winRate}%</p></div>
              <div><p className="text-gray-400">P/F</p><p className="text-5xl font-bold text-cyan-400">{bt.profitFactor}</p></div>
              <div><p className="text-gray-400">Net P&L</p><p className={`text-5xl font-bold ${bt.totalPnL>0?'text-green-400':'text-red-400'}`}>${bt.totalPnL>0?'+':''}{bt.totalPnL.toLocaleString()}</p></div>
              <div><p className="text-gray-400">Max DD</p><p className="text-5xl font-bold text-orange-400">{bt.maxDD}%</p></div>
              <div><p className="text-gray-400">Best</p><p className="text-5xl font-bold text-yellow-400">+${bt.bestTrade.toLocaleString()}</p></div>
            </div>
          </div>
        )}

        {/* Rockets Grid */}
        {data.rockets?.length > 0 && (
          <div className="bg-black/50 backdrop-blur-2xl rounded-3xl p-12 border-4 border-yellow-500">
            {/* same rocket grid as before */}
          </div>
        )}

        {/* Buttons */}
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Force Scan */}
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="py-20 text-6xl font-black rounded-3xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-60 transition-all shadow-2xl border-8 border-cyan-400 flex items-center justify-center gap-10"
          >
            <RefreshCw className={`w-24 h-24 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING" : "FORCE SCAN"}
          </button>

          {/* Backtest Button */}
          <button
            onClick={triggerBacktest}
            disabled={backtesting}
            className="py-20 text-6xl font-black rounded-3xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-60 transition-all shadow-2xl border-8 border-orange-400 flex items-center justify-center gap-10"
          >
            <BarChart3 className={`w-24 h-24 ${backtesting ? 'animate-spin' : ''}`} />
            {backtesting ? "CRUNCHING..." : "RUN BACKTEST"}
          </button>
        </div>

        <p className="text-center text-3xl text-cyan-300">
          Last scan: <span className="font-bold text-yellow-400">{lastScan || "—"}</span> ET
        </p>
      </main>
    </div>
  );
}
