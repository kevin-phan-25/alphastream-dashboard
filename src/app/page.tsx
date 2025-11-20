// src/app/page.tsx — FINAL DASHBOARD FOR AlphaStream v40.0+ (2025 seconds deploy)
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
      console.error("Bot connection failed");
      setData({});
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

  // 100% SAFE field reading — works with v34 → v40+
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
        <div className="text-6xl font-black text-purple-400 animate-pulse">AlphaStream v40.0</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AlphaStream v40.0
          </h1>
          <div className="flex items-center gap-8">
            <span className="text-3xl font-bold text-cyan-400">MASSIVE.COM LIVE</span>
            <span className={`px-10 py-5 rounded-full text-3xl font-black shadow-2xl ${isLive ? 'bg-green-600 animate-pulse' : 'bg-yellow-600'}`}>
              {isLive ? "LIVE" : "PAPER"}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-40 px-6 pb-40">
        <div className="max-w-7xl mx-auto space-y-24">

          {/* Hero Title */}
          <div className="text-center">
            <h2 className="text-8xl md:text-9xl font-black bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              ALPHASTREAM - ELITE MODE
            </h2>
          </div>

          {/* Pulse Animation */}
          <div className="flex justify-center -mt-10">
            <div className="w-96 h-96 rounded-full bg-gradient-to-r from-green-600/30 to-cyan-600/30 border-16 border-green-500 shadow-3xl flex items-center justify-center animate-pulse">
              <Zap className="w-56 h-56 text-green-400" />
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 text-center hover:scale-105 transition">
              <p className="text-gray-300 text-xl">EQUITY</p>
              <p className="text-6xl md:text-3xl font-black text-cyan-300 mt-4">{equity}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 text-center hover:scale-105 transition">
              <p className="text-gray-300 text-xl">DAILY P&L</p>
              <p className={`text-6xl md:text-3xl font-black mt-4 ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {dailyPnL}
              </p>
            </div>

            <div
              onClick={() => setShowPositions(true)}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 text-center cursor-pointer hover:scale-110 transition"
            >
              <p className="text-gray-300 text-xl">POSITIONS</p>
              <p className="text-8xl font-black text-purple-400 mt-4">
                {positionsCount}<span className="text-ml-2 text-5xl text-gray-400">/{maxPos}</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 text-center hover:scale-105 transition">
              <p className="text-gray-300 text-xl">WIN RATE</p>
              <p className="text-8xl font-black text-yellow-400 mt-4">{winRate}</p>
            </div>
          </div>

          {/* Win / Loss / Trades */}
          <div className="grid grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 text-center">
              <TrendingUp className="w-28 h-28 mx-auto text-green-400 mb-6" />
              <p className="text-6xl font-black text-green-400">{wins}</p>
              <p className="text-2xl text-gray-400 mt-4">WINS</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 text-center">
              <AlertTriangle className="w-28 h-28 mx-auto text-red-400 mb-6" />
              <p className="text-6xl font-black text-red-400">{losses}</p>
              <p className="text-2xl text-gray-400 mt-4">LOSSES</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 text-center">
              <Activity className="w-28 h-28 mx-auto text-purple-400 mb-6" />
              <p className="text-6xl font-black text-purple-400">{totalTrades}</p>
              <p className="text-2xl text-gray-400 mt-4">TRADES</p>
            </div>
          </div>

          {/* Live Trade Log */}
          <div>
            <h3 className="text-7xl font-black text-center mb-12 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              LIVE TRADE LOG
            </h3>
            <div className="bg-white/8 backdrop-blur-2xl rounded-3xl border border-white/20 p-10 max-h-96 overflow-y-auto shadow-2xl">
              {(!data.tradeLog || data.tradeLog.length === 0) ? (
                <p className="text-center text-5xl text-gray-500 py-40 font-medium">
                  Scanning for 7.5%+ runners...
                </p>
              ) : (
                <div className="space-y-8">
                  {data.tradeLog.slice().reverse().map((t: any) => (
                    <div
                      key={t.id}
                      className={`p-10 rounded-3xl border-4 transition-all transform hover:scale-102 ${
                        t.type === "ENTRY"
                          ? "bg-green-900/70 border-green-400 shadow-green-500/20"
                          : "bg-red-900/70 border-red-400 shadow-red-500/20"
                      } shadow-2xl`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-6xl font-black text-white">{t.symbol}</span>
                          <span className={`ml-10 text-4xl font-bold ${t.type === "ENTRY" ? "text-green-300" : "text-red-300"}`}>
                            {t.type === "ENTRY" ? "LONG" : "EXIT"} {t.qty} @ ${t.price}
                          </span>
                        </div>
                        <div className="text-right">
                          {t.pnl !== undefined && (
                            <p className={`text-5xl font-black ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {t.pnl >= 0 ? "+" : ""}${t.pnl} ({t.pnlPct}%)
                            </p>
                          )}
                          <p className="text-2xl text-gray-400 mt-4">
                            {new Date(t.timestamp).toLocaleString()} • {t.reason || "Signal"}
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
          <div className="text-center mt-32">
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="px-48 py-24 text-8xl font-black rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-3xl disabled:opacity-70 transition-all transform hover:scale-105"
            >
              {scanning ? (
                <>SCANNING <RefreshCw className="inline ml-16 w-24 h-24 animate-spin" /></>
              ) : (
                <>FORCE SCAN <Rocket className="inline ml-16 w-24 h-24" /></>
              )}
            </button>
          </div>

        </div>
      </main>

      {/* POSITIONS MODAL — BULLETPROOF */}
      {showPositions && data.positions && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-8">
          <div className="bg-gray-900/95 border-4 border-purple-500 rounded-3xl p-16 max-w-6xl w-full max-h-screen overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-7xl font-black text-purple-400">ACTIVE POSITIONS</h3>
              <button onClick={() => setShowPositions(false)}>
                <X className="w-16 h-16 text-gray-400 hover:text-white transition" />
              </button>
            </div>

            {data.positions.length === 0 ? (
              <p className="text-center text-5xl text-gray-400 py-40">No open positions</p>
            ) : (
              <div className="space-y-10">
                {data.positions.map((p: any) => (
                  <div key={p.symbol} className="bg-white/5 rounded-3xl p-12 border border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-10 text-3xl">
                      <div><span className="text-gray-400">Symbol</span><p className="text-6xl font-bold text-purple-300">{p.symbol}</p></div>
                      <div><span className="text-gray-400">Shares</span><p className="text-6xl font-bold">{p.qty}</p></div>
                      <div><span className="text-gray-400">Entry</span><p className="text-5xl">${p.entry?.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">Now</span><p className={`text-5xl font-bold ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>${p.current?.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">P&L</span><p className={`text-6xl font-black ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${p.unrealized_pl?.toFixed(2)}</p></div>
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
