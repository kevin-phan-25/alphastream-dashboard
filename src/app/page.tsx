'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Rocket, RefreshCw, X, TrendingUp, AlertTriangle } from 'lucide-react';

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
      console.error("Bot unreachable:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 8000);
    return () => clearInterval(id);
  }, [BOT_URL]);

  const triggerScan = async () => {
    if (!BOT_URL) return;
    setScanning(true);
    try { await axios.post(`${BOT_URL}/manual/scan`); }
    finally { setScanning(false); fetchData(); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-6xl font-black text-purple-400 animate-pulse">Loading v37.0...</div>
      </div>
    );
  }

  // Safely extract values for v37.0
  const equity = data.equity ? (typeof data.equity === "string" ? data.equity : `$${Number(data.equity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`) : "$0.00";
  const dailyPnL = data.dailyPnL || "+$0.00";
  const positionsCount = data.positions_count ?? data.positions ?? 0;
  const winRate = data.backtest?.winRate || data.win_rate || "0.0%";
  const totalTrades = data.backtest?.totalTrades || data.total_trades || 0;

  const isLive = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AlphaStream v37.0
          </h1>
          <div className="flex items-center gap-6">
            <span className="text-2xl font-bold text-cyan-400">PROP CHALLENGE CRUSHER</span>
            <span className={`px-6 py-3 rounded-full font-bold text-xl ${isLive ? 'bg-green-600' : 'bg-yellow-600'}`}>
              {isLive ? "LIVE" : "PAPER"}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-32 px-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-16">

          {/* Hero */}
          <div className="text-center">
            <h2 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Prop Firm Challenge Crusher
            </h2>
            <p className="text-2xl mt-6 text-gray-300">7.5%+ Gainers • 4 Max Positions • Daily Loss Limit</p>
          </div>

          {/* Status Orb */}
          <div className="flex justify-center">
            <div className="w-72 h-72 rounded-full bg-gradient-to-r from-green-600/40 to-cyan-600/40 border-12 border-green-400 shadow-2xl flex items-center justify-center animate-pulse">
              <Activity className="w-40 h-40 text-green-400" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <p className="text-gray-400 text-sm">EQUITY</p>
              <p className="font-black text-3xl md:text-3xl mt-3 text-cyan-400">{equity}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <p className="text-gray-400 text-sm">DAILY P&L</p>
              <p className={`font-black text-5xl mt-4 ${dailyPnL.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
                {dailyPnL}
              </p>
            </div>

            <div onClick={() => setShowPositions(true)} className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 cursor-pointer hover:scale-105 transition">
              <p className="text-gray-400 text-sm">POSITIONS</p>
              <p className="font-black text-6xl mt-4 text-purple-400">
                {positionsCount}<span className="text-4xl text-gray-400">/4</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <p className="text-gray-400 text-sm">WIN RATE</p>
              <p className="font-black text-6xl mt-4 text-yellow-400">{winRate}</p>
            </div>
          </div>

          {/* Trade Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
              <TrendingUp className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <p className="text-5xl font-black text-green-400">{data.backtest?.wins || 0}</p>
              <p className="text-gray-400">Wins</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
              <p className="text-5xl font-black text-red-400">{data.backtest?.losses || 0}</p>
              <p className="text-gray-400">Losses</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
              <p className="text-5xl font-black text-cyan-400">{totalTrades}</p>
              <p className="text-gray-400">Total Trades</p>
            </div>
          </div>

          {/* Live Trade Log */}
          <div className="mt-20">
            <h3 className="text-5xl font-black mb-8 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Live Trade Log
            </h3>
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-8 max-h-96 overflow-y-auto">
              {(!data.tradeLog || data.tradeLog.length === 0) ? (
                <p className="text-center text-3xl text-gray-400 py-20">Waiting for momentum...</p>
              ) : (
                <div className="space-y-4">
                  {data.tradeLog.slice().reverse().map((t: any) => (
                    <div key={t.id} className={`p-6 rounded-2xl border-2 ${t.type === "ENTRY" ? "bg-green-900/50 border-green-500" : "bg-red-900/50 border-red-500"}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-4xl font-black">{t.symbol}</span>
                          <span className={`ml-6 text-2xl font-bold ${t.type === "ENTRY" ? "text-green-400" : "text-red-400"}`}>
                            {t.type === "ENTRY" ? "BUY" : "SELL"} {t.qty} @ ${t.price}
                          </span>
                        </div>
                        <div className="text-right">
                          {t.pnl && (
                            <p className={`text-3xl font-black ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {t.pnl >= 0 ? "+" : ""}${t.pnl} ({t.pnlPct}%)
                            </p>
                          )}
                          <p className="text-gray-400 text-sm mt-2">
                            {new Date(t.timestamp).toLocaleTimeString()} • {t.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Manual Scan Button */}
          <div className="text-center">
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="px-32 py-16 text-6xl font-black rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl disabled:opacity-60 transition-all"
            >
              {scanning ? (
                <>SCANNING <RefreshCw className="inline ml-8 w-16 h-16 animate-spin" /></>
              ) : (
                <>FORCE SCAN <Rocket className="inline ml-8 w-16 h-16" /></>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Positions Modal */}
      {showPositions && data.positions && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900/95 border border-white/20 rounded-3xl p-10 max-w-5xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-5xl font-black text-purple-400">Active Positions</h3>
              <button onClick={() => setShowPositions(false)}><X className="w-12 h-12" /></button>
            </div>
            {data.positions.length === 0 ? (
              <p className="text-center text-3xl text-gray-400 py-20">No open positions</p>
            ) : (
              <div className="space-y-6">
                {data.positions.map((p: any, i: number) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-8 border border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-xl">
                      <div><span className="text-gray-400">Symbol</span><p className="font-bold text-3xl text-purple-400">{p.symbol}</p></div>
                      <div><span className="text-gray-400">Qty</span><p className="font-bold text-2xl">{p.qty}</p></div>
                      <div><span className="text-gray-400">Entry</span><p>${p.entry?.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">Current</span><p className={p.unrealized_pl >= 0 ? "text-green-400" : "text-red-400"}>${p.current?.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">P&L</span><p className={`font-bold text-2xl ${p.unrealized_pl >= 0 ? "text-green-400" : "text-red-400"}`}>
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
