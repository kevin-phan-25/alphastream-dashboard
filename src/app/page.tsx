// src/app/page.tsx — AlphaStream Dashboard v60.1 (Matches v60.1 Bot)
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Rocket, RefreshCw, X, TrendingUp, AlertTriangle, Zap, Flame, DollarSign, Target, BarChart3 } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL?.trim();

  const fetchData = async () => {
    if (!BOT_URL) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(BOT_URL, { timeout: 15000 });
      setData(res.data || {});
      setLoading(false);
    } catch (err) {
      console.error("Bot unreachable:", err);
      setData({ status: "OFFLINE" });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [BOT_URL]);

  const triggerScan = async () => {
    if (!BOT_URL || scanning) return;
    setScanning(true);
    setLastScan(new Date().toLocaleTimeString());
    try {
      await axios.post(`${BOT_URL}/manual/scan`);
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setScanning(false);
      setTimeout(fetchData, 2000);
    }
  };

  // Safe data access
  const version = data.version || "v60.1";
  const equity = data.equity || "$100,000.00";
  const dailyPnL = data.dailyPnL || "+$0.00";
  const positionsCount = data.positions_count ?? data.positions?.length ?? 0;
  const maxPos = data.max_pos ?? 5;
  const winRate = data.backtest?.winRate || "0.0%";
  const totalTrades = data.backtest?.totalTrades || 0;
  const wins = data.backtest?.wins || 0;
  const losses = data.backtest?.losses || 0;
  const isLive = data.mode === "LIVE" || !data.dry_mode;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Flame className="w-16 h-16 mx-auto text-orange-500 animate-pulse mb-6" />
          <div className="text-4xl font-black text-purple-300">AlphaStream {version}</div>
          <p className="text-lg text-purple-400 mt-4">Connecting to FMP engine...</p>
        </div>
      </div>
    );
  }

  if (data.status === "OFFLINE" || !BOT_URL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-purple-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-24 h-24 mx-auto text-red-500 mb-6" />
          <h1 className="text-4xl font-black text-red-400 mb-4">BOT OFFLINE</h1>
          <p className="text-gray-300">Check your BOT_URL in Vercel env variables</p>
          <code className="block bg-black/50 p-4 rounded mt-6 text-sm break-all">
            {BOT_URL || "NEXT_PUBLIC_BOT_URL not set"}
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/95 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AlphaStream {version}
            </h1>
            <p className="text-xs text-purple-300 opacity-80">FMP-Powered Momentum Engine</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400">Last Scan</p>
              <p className="text-sm font-medium text-cyan-300">{lastScan || "Never"}</p>
            </div>
            <span className={`px-5 py-2 rounded-full text-sm font-bold ${isLive ? 'bg-green-600 animate-pulse' : 'bg-yellow-600'}`}>
              {isLive ? "LIVE TRADING" : "PAPER MODE"}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 pb-32">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Hero */}
          <div className="text-center">
            <h2 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              FMP TOP MOVERS
            </h2>
            <p className="text-xl md:text-2xl text-purple-300 mt-4 font-medium">Real-Time Gainers • No 403s • Elite Execution</p>
          </div>

          {/* Pulse */}
          <div className="flex justify-center my-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-purple-600/50 blur-3xl animate-ping"></div>
              <div className="relative w-40 h-40 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 border-8 border-purple-400 shadow-2xl flex items-center justify-center">
                <Flame className="w-24 h-24 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/10 hover:scale-105 transition">
              <DollarSign className="w-8 h-8 mx-auto text-cyan-400 mb-2" />
              <p className="text-gray-400 text-xs uppercase tracking-wider">Equity</p>
              <p className="text-2xl md:text-3xl font-black text-cyan-300 mt-2">{equity}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/10 hover:scale-105 transition">
              <Target className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
              <p className="text-gray-400 text-xs uppercase tracking-wider">Daily P&L</p>
              <p className={`text-2xl md:text-3xl font-black mt-2 ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {dailyPnL}
              </p>
            </div>
            <div
              onClick={() => setShowPositions(true)}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/10 cursor-pointer hover:scale-110 transition"
            >
              <BarChart3 className="w-8 h-8 mx-auto text-purple-400 mb-2" />
              <p className="text-gray-400 text-xs uppercase tracking-wider">Positions</p>
              <p className="text-4xl md:text-6xl font-black text-purple-300 mt-2">
                {positionsCount}<span className="text-xl text-gray-400">/{maxPos}</span>
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/10 hover:scale-105 transition">
              <Zap className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
              <p className="text-gray-400 text-xs uppercase tracking-wider">Win Rate</p>
              <p className="text-4xl md:text-6xl font-black text-yellow-300 mt-2">{winRate}</p>
            </div>
          </div>

          {/* Win/Loss Grid */}
          <div className="grid grid-cols-3 gap-5">
            <div className="bg-green-900/30 backdrop-blur-xl rounded-2xl p-6 text-center border border-green-500/50">
              <TrendingUp className="w-10 h-10 mx-auto text-green-400 mb-2" />
              <p className="text-4xl font-black text-green-400">{wins}</p>
              <p className="text-sm text-green-300">WINS</p>
            </div>
            <div className="bg-red-900/30 backdrop-blur-xl rounded-2xl p-6 text-center border border-red-500/50">
              <AlertTriangle className="w-10 h-10 mx-auto text-red-400 mb-2" />
              <p className="text-4xl font-black text-red-400">{losses}</p>
              <p className="text-sm text-red-300">LOSSES</p>
            </div>
            <div className="bg-purple-900/30 backdrop-blur-xl rounded-2xl p-6 text-center border border-purple-500/50">
              <Activity className="w-10 h-10 mx-auto text-purple-400 mb-2" />
              <p className="text-4xl font-black text-purple-400">{totalTrades}</p>
              <p className="text-sm text-purple-300">TOTAL</p>
            </div>
          </div>

          {/* Live Trades */}
          <div>
            <h3 className="text-3xl font-black text-center mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              LIVE EXECUTIONS
            </h3>
            <div className="bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 max-h-96 overflow-y-auto">
              {(!data.tradeLog || data.tradeLog.length === 0) ? (
                <p className="text-center text-gray-500 py-20 text-lg">Waiting for FMP momentum signal...</p>
              ) : (
                <div className="space-y-4">
                  {data.tradeLog.slice().reverse().slice(0, 15).map((t: any) => (
                    <div key={t.id} className={`p-5 rounded-xl border-2 ${t.type === "ENTRY" ? "bg-green-900/60 border-green-500" : "bg-red-900/60 border-red-500"}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-2xl font-black">{t.symbol}</span>
                          <span className="ml-4 text-lg font-medium opacity-90">
                            {t.type === "ENTRY" ? "BUY" : "SELL"} {t.qty} @ ${t.price}
                          </span>
                        </div>
                        <div className="text-right">
                          {t.pnl !== undefined && (
                            <p className={`text-2xl font-black ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {t.pnl >= 0 ? "+" : ""}${t.pnl} ({t.pnlPct}%)
                            </p>
                          )}
                          <p className="text-sm text-gray-400 mt-1">
                            {new Date(t.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FORCE SCAN BUTTON */}
          <div className="text-center mt-12">
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="relative px-16 py-8 md:px-24 md:py-10 text-3xl md:text-5xl font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:scale-105 shadow-2xl disabled:opacity-60 transition-all overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-6">
                {scanning ? (
                  <>SCANNING <RefreshCw className="inline w-12 h-12 animate-spin" /></>
                ) : (
                  <>FORCE SCAN <Rocket className="inline w-12 h-12 group-hover:translate-x-2 transition" /></>
                )}
              </span>
              <div className="absolute inset-0 bg-white/20 blur-xl animate-pulse"></div>
            </button>
          </div>
        </div>
      </main>

      {/* Positions Modal */}
      {showPositions && data.positions && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPositions(false)}>
          <div className="bg-gray-900/98 border border-purple-500/50 rounded-2xl p-8 max-w-4xl w-full max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-4xl font-black text-purple-400">ACTIVE POSITIONS</h3>
              <button onClick={() => setShowPositions(false)} className="p-3 hover:bg-white/10 rounded-full transition">
                <X className="w-8 h-8" />
              </button>
            </div>
            {data.positions.length === 0 ? (
              <p className="text-center text-gray-400 py-32 text-2xl">No open positions</p>
            ) : (
              <div className="space-y-6">
                {data.positions.map((p: any) => (
                  <div key={p.symbol} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center md:text-left">
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Symbol</p>
                        <p className="text-3xl font-black text-purple-300">{p.symbol}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Shares</p>
                        <p className="text-2xl font-bold">{p.qty}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Entry</p>
                        <p className="text-2xl font-bold">${p.entry?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Current</p>
                        <p className={`text-2xl font-bold ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${p.current?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Unrealized</p>
                        <p className={`text-3xl font-black ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${p.unrealized_pl?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
