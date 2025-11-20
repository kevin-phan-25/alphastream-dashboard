// src/app/page.tsx — MOBILE-OPTIMIZED + CLEAN DASHBOARD (v41.0+)
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Rocket, RefreshCw, X, TrendingUp, AlertTriangle, Zap } from 'lucide-react';

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
    try { await axios.post(`${BOT_URL}/manual/scan`); }
    finally { setScanning(false); fetchData(); }
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
        <div className="text-4xl font-bold text-purple-300 animate-pulse">AlphaStream v41.0</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AlphaStream v41.0
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-lg md:text-2xl font-bold text-cyan-400 hidden sm:block">MASSIVE.COM</span>
            <span className={`px-6 py-2 rounded-full text-lg md:text-xl font-bold ${isLive ? 'bg-green-600' : 'bg-yellow-600'}`}>
              {isLive ? "LIVE" : "PAPER"}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 pb-20">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Title */}
          <div className="text-center mt-8">
            <h2 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">
              PROP CRUSHER
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mt-3">7.5%+ Gainers • 800k+ Vol • Max 4 Positions</p>
          </div>

          {/* Pulse */}
          <div className="flex justify-center">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-r from-green-600/20 to-cyan-600/20 border-8 border-green-500 shadow-2xl flex items-center justify-center animate-pulse">
              <Zap className="w-20 h-20 md:w-32 md:h-32 text-green-400" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/10">
              <p className="text-gray-400 text-sm">EQUITY</p>
              <p className="text-2xl md:text-4xl font-bold text-cyan-300 mt-2">{equity}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/10">
              <p className="text-gray-400 text-sm">DAILY P&L</p>
              <p className={`text-2xl md:text-4xl font-bold mt-2 ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {dailyPnL}
              </p>
            </div>
            <div
              onClick={() => setShowPositions(true)}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/10 cursor-pointer hover:scale-105 transition"
            >
              <p className="text-gray-400 text-sm">POSITIONS</p>
              <p className="text-4xl md:text-6xl font-bold text-purple-400 mt-2">
                {positionsCount}<span className="text-2xl text-gray-400">/{maxPos}</span>
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/10">
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

          {/* Trade Log */}
          <div>
            <h3 className="text-3xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              LIVE TRADES
            </h3>
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 max-h-96 overflow-y-auto">
              {(!data.tradeLog || data.tradeLog.length === 0) ? (
                <p className="text-center text-gray-500 py-20 text-lg">Waiting for momentum...</p>
              ) : (
                <div className="space-y-4">
                  {data.tradeLog.slice().reverse().slice(0, 15).map((t: any) => (
                    <div key={t.id} className={`p-5 rounded-xl border-2 ${t.type === "ENTRY" ? "bg-green-900/50 border-green-500" : "bg-red-900/50 border-red-500"}`}>
                      <div className="flex justify-between items-center text-sm md:text-base">
                        <div>
                          <span className="text-2xl md:text-3xl font-bold">{t.symbol}</span>
                          <span className={`ml-4 font-medium ${t.type === "ENTRY" ? "text-green-300" : "text-red-300"}`}>
                            {t.type === "ENTRY" ? "BUY" : "SELL"} {t.qty} @ ${t.price}
                          </span>
                        </div>
                        <div className="text-right">
                          {t.pnl !== undefined && (
                            <p className={`text-lg md:text-2xl font-bold ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {t.pnl >= 0 ? "+" : ""}${t.pnl} ({t.pnlPct}%)
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
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

          {/* Scan Button */}
          <div className="text-center mt-12">
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="px-16 py-8 md:px-24 md:py-12 text-3xl md:text-5xl font-black rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl disabled:opacity-60 transition-all"
            >
              {scanning ? (
                <>SCANNING <RefreshCw className="inline ml-6 w-10 h-10 animate-spin" /></>
              ) : (
                <>FORCE SCAN <Rocket className="inline ml-6 w-10 h-10" /></>
              )}
            </button>
          </div>

        </div>
      </main>

      {/* Positions Modal */}
      {showPositions && data.positions && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 border border-white/20 rounded-2xl p-8 max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl md:text-5xl font-bold text-purple-400">Active Positions</h3>
              <button onClick={() => setShowPositions(false)}>
                <X className="w-10 h-10 text-gray-400" />
              </button>
            </div>
            {data.positions.length === 0 ? (
              <p className="text-center text-gray-400 py-20 text-xl">No open positions</p>
            ) : (
              <div className="space-y-6">
                {data.positions.map((p: any) => (
                  <div key={p.symbol} className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm md:text-lg">
                      <div><span className="text-gray-400">Symbol</span><p className="font-bold text-purple-300">{p.symbol}</p></div>
                      <div><span className="text-gray-400">Qty</span><p className="font-bold">{p.qty}</p></div>
                      <div><span className="text-gray-400">Entry</span><p>${p.entry?.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">Now</span><p className={p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}>{p.current?.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">P&L</span><p className={`font-bold ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
