// src/app/page.tsx — FINAL DASHBOARD v44.0+ (Real Massive.com + Mobile Optimized)
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Rocket, RefreshCw, X, TrendingUp, AlertTriangle, Zap, Flame } from 'lucide-react';

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
      console.error("Bot offline");
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
    if (!BOT_URL) return;
    setScanning(true);
    try { 
      await axios.post(`${BOT_URL}/manual/scan`); 
      console.log("Manual scan triggered");
    } catch (err) {
      console.error("Scan failed:", err);
    } finally { 
      setScanning(false); 
      fetchData(); 
    }
  };

  // Safe field reading
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
        <div className="text-4xl md:text-5xl font-black text-purple-300 animate-pulse flex items-center gap-4">
          <Flame className="w-12 h-12 animate-pulse" />
          AlphaStream v44.0
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/90 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            AlphaStream v44.0
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-lg md:text-2xl font-bold text-cyan-400 hidden sm:block">
              MASSIVE.COM LIVE
            </span>
            <span className={`px-6 py-2 rounded-full text-lg md:text-xl font-black shadow-2xl ${isLive ? 'bg-green-600 animate-pulse' : 'bg-yellow-600'}`}>
              {isLive ? "LIVE" : "PAPER"}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 pb-20">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Hero */}
          <div className="text-center mt-8">
            <h2 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              TOP MOVERS CRUSHER
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mt-4 font-medium">
              Real 7.5%+ Gainers • 800k+ Volume • Massive.com Powered
            </p>
          </div>

          {/* Pulse */}
          <div className="flex justify-center">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-r from-red-600/30 via-orange-600/30 to-green-600/30 border-8 border-orange-500 shadow-3xl flex items-center justify-center animate-pulse">
              <Flame className="w-24 h-24 md:w-36 md:h-36 text-orange-400" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/10 hover:scale-105 transition">
              <p className="text-gray-400 text-sm">EQUITY</p>
              <p className="text-2xl md:text-4xl font-bold text-cyan-300 mt-2">{equity}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/10 hover:scale-105 transition">
              <p className="text-gray-400 text-sm">DAILY P&L</p>
              <p className={`text-2xl md:text-4xl font-bold mt-2 ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {dailyPnL}
              </p>
            </div>
            <div
              onClick={() => setShowPositions(true)}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/10 cursor-pointer hover:scale-110 transition"
            >
              <p className="text-gray-400 text-sm">POSITIONS</p>
              <p className="text-4xl md:text-6xl font-bold text-purple-400 mt-2">
                {positionsCount}<span className="text-2xl text-gray-400">/{maxPos}</span>
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/10 hover:scale-105 transition">
              <p className="text-gray-400 text-sm">WIN RATE</p>
              <p className="text-4xl md:text-6xl font-bold text-yellow-400 mt-2">{winRate}</p>
            </div>
          </div>

          {/* Win/Loss/Trades */}
          <div className="grid grid-cols-3 gap-5">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/10">
              <TrendingUp className="w-12 h-12 mx-auto text-green-400 mb-2" />
              <p className="text-4xl font-bold text-green-400">{wins}</p>
              <p className="text-sm text-gray-400">WINS</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/10">
              <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-2" />
              <p className="text-4xl font-bold text-red-400">{losses}</p>
              <p className="text-sm text-gray-400">LOSSES</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/10">
              <Activity className="w-12 h-12 mx-auto text-purple-400 mb-2" />
              <p className="text-4xl font-bold text-purple-400">{totalTrades}</p>
              <p className="text-sm text-gray-400">TRADES</p>
            </div>
          </div>

          {/* Live Trade Log */}
          <div>
            <h3 className="text-3xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              LIVE TRADE LOG
            </h3>
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 max-h-96 overflow-y-auto">
              {(!data.tradeLog || data.tradeLog.length === 0) ? (
                <p className="text-center text-gray-500 py-20 text-lg font-medium">
                  Waiting for 7.5%+ Top Movers...
                </p>
              ) : (
                <div className="space-y-4">
                  {data.tradeLog.slice().reverse().slice(0, 15).map((t: any) => (
                    <div key={t.id} className={`p-5 rounded-xl border-2 transition-all ${t.type === "ENTRY" ? "bg-green-900/60 border-green-500 shadow-green-500/20" : "bg-red-900/60 border-red-500 shadow-red-500/20"}`}>
                      <div className="flex justify-between items-center text-sm md:text-base">
                        <div>
                          <span className="text-2xl md:text-3xl font-black text-white">{t.symbol}</span>
                          <span className={`ml-4 font-bold ${t.type === "ENTRY" ? "text-green-300" : "text-red-300"}`}>
                            {t.type === "ENTRY" ? "LONG" : "EXIT"} {t.qty} @ ${t.price}
                          </span>
                        </div>
                        <div className="text-right">
                          {t.pnl !== undefined && (
                            <p className={`text-lg md:text-2xl font-black ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {t.pnl >= 0 ? "+" : ""}${t.pnl} ({t.pnlPct}%)
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
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
          <div className="text-center mt-16">
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="px-20 py-10 md:px-32 md:py-14 text-4xl md:text-6xl font-black rounded-full bg-gradient-to-r from-orange-600 via-pink-600 to-purple-700 hover:from-orange-700 hover:via-pink-700 hover:to-purple-800 shadow-2xl disabled:opacity-60 transition-all transform hover:scale-105"
            >
              {scanning ? (
                <>SCANNING <RefreshCw className="inline ml-8 w-12 h-12 animate-spin" /></>
              ) : (
                <>FORCE SCAN <Rocket className="inline ml-8 w-12 h-12" /></>
              )}
            </button>
          </div>

        </div>
      </main>

      {/* Positions Modal */}
      {showPositions && data.positions && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 border-2 border-purple-500 rounded-2xl p-8 max-w-4xl w-full max-h-screen overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-4xl md:text-6xl font-black text-purple-400">ACTIVE POSITIONS</h3>
              <button onClick={() => setShowPositions(false)}>
                <X className="w-12 h-12 text-gray-400 hover:text-white transition" />
              </button>
            </div>
            {data.positions.length === 0 ? (
              <p className="text-center text-gray-400 py-32 text-2xl">No open positions</p>
            ) : (
              <div className="space-y-6">
                {data.positions.map((p: any) => (
                  <div key={p.symbol} className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm md:text-lg">
                      <div><span className="text-gray-400">Symbol</span><p className="font-bold text-purple-300 text-xl">{p.symbol}</p></div>
                      <div><span className="text-gray-400">Shares</span><p className="font-bold text-xl">{p.qty}</p></div>
                      <div><span className="text-gray-400">Entry</span><p className="text-xl">${p.entry?.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">Now</span><p className={`font-bold text-xl ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>${p.current?.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">P&L</span><p className={`font-bold text-2xl ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
