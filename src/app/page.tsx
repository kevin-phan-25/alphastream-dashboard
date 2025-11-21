'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, X, Zap, Flame, DollarSign, TrendingUp, Swords, Activity, AlertTriangle, BarChart3 } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [backtesting, setBacktesting] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");
  const [lastBacktest, setLastBacktest] = useState<string>("");

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL?.trim();

  const fetchData = async () => {
    if (!BOT_URL) return setLoading(false);
    try {
      const res = await axios.get(BOT_URL, { timeout: 15000 });
      setData(res.data);
    } catch (err) {
      setData({ status: "OFFLINE" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [BOT_URL]);

  const triggerScan = async () => {
    if (!BOT_URL || scanning) return;
    setScanning(true);
    setLastScan(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }));
    try {
      await axios.post(`${BOT_URL}/scan`);
    } catch {}
    setScanning(false);
    setTimeout(fetchData, 2000);
  };

  const triggerBacktest = async () => {
    if (!BOT_URL || backtesting) return;
    setBacktesting(true);
    setLastBacktest(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }));
    try {
      await axios.post(`${BOT_URL}/backtest`);
    } catch {}
    setBacktesting(false);
    setTimeout(fetchData, 1500);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Activity className="w-32 h-32 text-purple-500 animate-spin" /></div>;
  if (!BOT_URL || data.status === "OFFLINE") return <div className="min-h-screen bg-red-900 flex items-center justify-center text-white text-6xl font-black">BOT OFFLINE</div>;

  // FIXED FORMATTERS — NO MORE ERRORS
  const equity = data.equity ? `$${Number(data.equity).toLocaleString()}` : "$0";
  const unrealized = data.unrealized ? `$${Number(data.unrealized).toLocaleString()}` : "$0";
  const dailyPnL = data.dailyPnL ? `$${Number(data.dailyPnL).toLocaleString()}` : "$0";
  const positionsCount = data.positions || 0;
  const rockets = data.rockets || [];
  const backtest = data.backtest || {};
  const btTrades = backtest.trades || 0;
  const btWinRate = backtest.winRate || 0;
  const btProfitFactor = backtest.profitFactor || 0;
  const btTotalPnL = backtest.totalPnL || 0;
  const btMaxDD = backtest.maxDD || 0;
  const btBestTrade = backtest.bestTrade || 0;
  const btWorstTrade = backtest.worstTrade || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white pb-32">
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/95 border-b border-purple-600/60">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              AlphaStream v97.1
            </h1>
            <p className="text-2xl text-orange-300 font-bold">REAL ALPACA • LOW-FLOAT • FIXED UI</p>
          </div>
          <span className="px-12 py-6 rounded-full text-4xl font-black bg-gradient-to-r from-emerald-500 to-green-600 shadow-2xl">
            {data.mode || "LOADING"} MODE
          </span>
        </div>
      </header>
      <main className="pt-40 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center">
          <h2 className="text-8xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent animate-pulse">
            LOW-FLOAT ROCKET HUNTER
          </h2>
          <p className="text-3xl text-cyan-300 mt-4">Real equity from Alpaca • Live backtesting</p>
        </div>
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-cyan-500/60 hover:scale-105 transition">
            <DollarSign className="w-20 h-20 mx-auto text-cyan-400 mb-4" />
            <p className="text-5xl font-black text-cyan-300">{equity}</p>
            <p className="text-xl text-gray-300">Equity</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-green-500/60 hover:scale-105 transition">
            <TrendingUp className="w-20 h-20 mx-auto text-green-400 mb-4" />
            <p className={`text-5xl font-black ${unrealized.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
              {unrealized}
            </p>
            <p className="text-xl text-gray-300">Unrealized P&L</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-purple-500/60 hover:scale-105 transition">
            <Activity className="w-20 h-20 mx-auto text-purple-400 mb-4" />
            <p className={`text-5xl font-black ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
              {dailyPnL}
            </p>
            <p className="text-xl text-gray-300">Daily P&L</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-orange-500/60 hover:scale-105 transition">
            <Rocket className="w-20 h-20 mx-auto text-orange-400 mb-4 animate-bounce" />
            <p className="text-5xl font-black text-orange-300">{positionsCount}</p>
            <p className="text-xl text-gray-300">Active Positions</p>
          </div>
        </div>
        {/* Backtest Results */}
        {btTrades > 0 && (
          <div className="bg-black/70 backdrop-blur-2xl rounded-3xl p-12 border-4 border-cyan-500 shadow-2xl">
            <h3 className="text-5xl font-black text-center text-cyan-400 mb-10 flex items-center justify-center gap-6">
              <BarChart3 className="w-16 h-16" />
              BACKTEST RESULTS
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8 text-center">
              <div><p className="text-gray-400 text-lg">Trades</p><p className="text-5xl font-bold text-white">{btTrades}</p></div>
              <div><p className="text-gray-400 text-lg">Win Rate</p><p className="text-5xl font-bold text-green-400">{btWinRate}%</p></div>
              <div><p className="text-gray-400 text-lg">Profit Factor</p><p className="text-5xl font-bold text-cyan-400">{btProfitFactor}</p></div>
              <div><p className="text-gray-400 text-lg">Net P&L</p><p className={`text-5xl font-bold ${btTotalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>${btTotalPnL >= 0 ? '+' : ''}${Math.abs(btTotalPnL).toLocaleString()}</p></div>
              <div><p className="text-gray-400 text-lg">Max DD</p><p className="text-5xl font-bold text-orange-400">{btMaxDD}%</p></div>
              <div><p className="text-gray-400 text-lg">Best Trade</p><p className="text-5xl font-bold text-yellow-400">+${btBestTrade.toLocaleString()}</p></div>
            </div>
          </div>
        )}
        {/* Rockets */}
        {data.rockets?.length > 0 && (
          <div className="bg-black/50 backdrop-blur-2xl rounded-3xl p-12 border-4 border-yellow-500 shadow-2xl">
            <h3 className="text-6xl font-black text-center text-yellow-400 mb-10 flex items-center justify-center gap-8">
              <Flame className="w-20 h-20 animate-pulse" />
              LOW-FLOAT ROCKETS INCOMING
              <Flame className="w-20 h-20 animate-pulse" />
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {data.rockets.map((r: string, i: number) => {
                const [sym, rest] = r.split('+');
                const [pct] = rest.split(' ');
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-700 to-pink-800 rounded-2xl p-6 text-center hover:scale-110 transition text-center">
                    <p className="text-4xl font-black">{sym}</p>
                    <p className="text-3xl text-green-400">+{pct}</p>
                    <p className="text-lg text-gray-300 mt-2">{r.split('(')[1]?.replace(')', '')}</p>
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
        <p className="text-center text-3xl text-cyan-300">
          Last scan: <span className="font-bold text-yellow-400">{lastScan || "—"}</span> ET
        </p>
        <p className="text-center text-3xl text-orange-300">
          Last backtest: <span className="font-bold text-yellow-400">{lastBacktest || "—"}</span> ET
        </p>
      </main>
    </div>
  );
}
