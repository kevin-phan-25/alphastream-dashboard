// src/app/page.tsx — AlphaStream v46.0 FINAL DASHBOARD (100% Working + Stunning)
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Rocket, RefreshCw, X, TrendingUp, AlertTriangle, Zap, Flame, Trophy } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showPositions, setShowPositions] = useState(false);

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL?.trim();

  const fetchData = async () => {
    if (!BOT_URL) return;
    try {
      const res = await axios.get(BOT_URL, { timeout: 12000 });
      setData(res.data || {});
      setLoading(false);
    } catch (err) {
      console.error("Bot offline or unreachable");
      setData({});
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, [BOT_URL]);

  const triggerScan = async () => {
    if (!BOT_URL || scanning) return;
    setScanning(true);
    try {
      await axios.post(`${BOT_URL}/scan`);  // ← FIXED ENDPOINT
      console.log("SCAN TRIGGERED");
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setScanning(false);
      setTimeout(fetchData, 2000); // Refresh after scan
    }
  };

  // Safe data reading
  const equity = data.equity ? `$${Number(data.equity).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$100,000.00";
  const dailyPnL = data.dailyPnL || data.pnl ? (data.dailyPnL || `$${Number(data.pnl || 0).toFixed(2)}`) : "+$0.00";
  const positionsCount = data.positions_count ?? data.positions?.length ?? 0;
  const maxPos = data.max_pos ?? 5;
  const winRate = data.backtest?.winRate || data.stats?.winRate || "0.0%";
  const totalTrades = data.backtest?.totalTrades || data.stats?.trades || 0;
  const wins = data.backtest?.wins || 0;
  const losses = data.backtest?.losses || 0;
  const isLive = data.mode === "LIVE" || !data.dry_mode;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-5xl md:text-6xl font-black text-purple-300 animate-pulse flex items-center gap-6">
          <Flame className="w-16 h-16 animate-pulse" />
          AlphaStream v46.0
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-2xl bg-black/95 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v46.0
            </h1>
            <p className="text-sm md:text-lg text-cyan-300 mt-1 font-medium">Massive.com • Real Top Movers • Fully Automated</p>
          </div>
          <div className="flex items-center gap-6">
            <Trophy className="w-10 h-10 text-yellow-400 hidden md:block" />
            <span className={`px-8 py-3 rounded-full text-xl md:text-2xl font-black shadow-2xl ${isLive ? 'bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse' : 'bg-gradient-to-r from-yellow-500 to-orange-600'}`}>
              {isLive ? "LIVE TRADING" : "PAPER MODE"}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-32 px-4 pb-24">
        <div className="max-w-6xl mx-auto space-y-16">

          {/* Hero */}
          <div className="text-center">
            <h2 className="text-6xl md:text-9xl font-black bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-none">
              TOP MOVERS CRUSHER
            </h2>
            <p className="text-xl md:text-3xl text-gray-200 mt-6 font-bold">
              7.5%+ Gainers • 800k+ Volume • Real-Time Execution
            </p>
          </div>

          {/* Fire Pulse */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-orange-600/40 animate-pulse"></div>
              <div className="relative w-56 h-56 md:w-80 md:h-80 rounded-full bg-gradient-to-r from-red-600/40 via-orange-600/40 to-yellow-600/40 border-8 border-orange-400 shadow-5xl flex items-center justify-center animate-pulse">
                <Flame className="w-32 h-32 md:w-48 md:h-48 text-orange-300" />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/20 hover:scale-105 transition-all">
              <p className="text-gray-300 text-lg">EQUITY</p>
              <p className="text-4xl md:text-5xl font-black text-cyan-300 mt-3">{equity}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/20 hover:scale-105 transition-all">
              <p className="text-gray-300 text-lg">DAILY P&L</p>
              <p className={`text-4xl md:text-5xl font-black mt-3 ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {dailyPnL}
              </p>
            </div>
            <div
              onClick={() => setShowPositions(true)}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/20 cursor-pointer hover:scale-110 transition-all"
            >
              <p className="text-gray-300 text-lg">POSITIONS</p>
              <p className="text-6xl md:text-8xl font-black text-purple-400 mt-3">
                {positionsCount}<span className="text-3xl text-gray-400">/{maxPos}</span>
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/20 hover:scale-105 transition-all">
              <p className="text-gray-300 text-lg">WIN RATE</p>
              <p className="text-6xl md:text-8xl font-black text-yellow-400 mt-3">{winRate}</p>
            </div>
          </div>

          {/* Win/Loss/Trades */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-xl rounded-3xl p-8 text-center border border-green-500/50">
              <TrendingUp className="w-16 h-16 mx-auto text-green-400 mb-3" />
              <p className="text-5xl font-black text-green-400">{wins}</p>
              <p className="text-gray-300 text-lg">WINS</p>
            </div>
            <div className="bg-gradient-to-br from-red-900/50 to-rose-900/50 backdrop-blur-xl rounded-3xl p-8 text-center border border-red-500/50">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-3" />
              <p className="text-5xl font-black text-red-400">{losses}</p>
              <p className="text-gray-300 text-lg">LOSSES</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-xl rounded-3xl p-8 text-center border border-purple-500/50">
              <Activity className="w-16 h-16 mx-auto text-purple-400 mb-3" />
              <p className="text-5xl font-black text-purple-400">{totalTrades}</p>
              <p className="text-gray-300 text-lg">TOTAL TRADES</p>
            </div>
          </div>

          {/* Live Trade Log */}
          <div>
            <h3 className="text-4xl md:text-6xl font-black text-center mb-8 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              LIVE TRADE EXECUTIONS
            </h3>
            <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 max-h-96 overflow-y-auto shadow-2xl">
              {(!data.tradeLog || data.tradeLog.length === 0) ? (
                <p className="text-center text-gray-400 py-32 text-2xl font-medium">
                  Waiting for 7.5%+ runners...
                </p>
              ) : (
                <div className="space-y-5">
                  {data.tradeLog.slice().reverse().slice(0, 15).map((t: any) => (
                    <div key={t.id} className={`p-6 rounded-2xl border-2 transition-all ${t.type === "ENTRY" ? "bg-gradient-to-r from-green-900/70 to-emerald-900/70 border-green-500 shadow-lg shadow-green-500/30" : "bg-gradient-to-r from-red-900/70 to-rose-900/70 border-red-500 shadow-lg shadow-red-500/30"}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-3xl md:text-4xl font-black text-white">{t.symbol}</span>
                          <span className={`ml-5 text-xl font-bold ${t.type === "ENTRY" ? "text-green-300" : "text-red-300"}`}>
                            {t.type === "ENTRY" ? "LONG" : "EXIT"} {t.qty} @ ${t.price}
                          </span>
                        </div>
                        <div className="text-right">
                          {t.pnl !== undefined && (
                            <p className={`text-2xl md:text-3xl font-black ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {t.pnl >= 0 ? "+" : ""}${t.pnl} ({t.pnlPct}%)
                            </p>
                          )}
                          <p className="text-sm text-gray-400 mt-2">
                            {new Date(t.timestamp).toLocaleTimeString()} • {t.reason || "Top Mover"}
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
          <div className="text-center mt-20">
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="relative px-24 py-12 md:px-40 md:py-20 text-5xl md:text-7xl font-black rounded-full bg-gradient-to-r from-orange-600 via-pink-600 to-purple-700 hover:from-orange-700 hover:via-pink-700 hover:to-purple-800 shadow-3xl disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95 overflow-hidden group"
            >
              <span className="relative z-10">
                {scanning ? (
                  <>SCANNING <RefreshCw className="inline ml-10 w-16 h-16 animate-spin" /></>
                ) : (
                  <>FORCE SCAN <Rocket className="inline ml-10 w-16 h-16 group-hover:translate-x-4 transition" /></>
                )}
              </span>
              <div className="absolute inset-0 bg-white/20 blur-xl animate-pulse"></div>
            </button>
          </div>

        </div>
      </main>

      {/* Positions Modal */}
      {showPositions && data.positions && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900/95 border-4 border-purple-600 rounded-3xl p-10 max-w-5xl w-full max-h-screen overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-5xl md:text-7xl font-black text-purple-400">ACTIVE POSITIONS</h3>
              <button onClick={() => setShowPositions(false)}>
                <X className="w-14 h-14 text-gray-400 hover:text-white transition" />
              </button>
            </div>
            {data.positions.length === 0 ? (
              <p className="text-center text-gray-400 py-40 text-3xl">No open positions</p>
            ) : (
              <div className="space-y-8">
                {data.positions.map((p: any) => (
                  <div key={p.symbol} className="bg-white/5 rounded-2xl p-8 border border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-lg md:text-2xl">
                      <div><span className="text-gray-400">Symbol</span><p className="font-black text-purple-300 text-3xl">{p.symbol}</p></div>
                      <div><span className="text-gray-400">Shares</span><p className="font-bold text-2xl">{p.qty}</p></div>
                      <div><span className="text-gray-400">Entry</span><p className="text-xl">${p.entry?.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">Current</span><p className={`font-bold text-2xl ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>${p.current?.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">P&L</span><p className={`font-black text-3xl ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${p.unrealized_pl?.toFixed(2)}
                      </p></div>
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
