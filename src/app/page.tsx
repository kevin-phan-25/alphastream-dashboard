'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Globe, Shield, Swords, Crown, RefreshCw, X, DollarSign,
  Target, BarChart3, Zap, AlertTriangle, TrendingUp
} from 'lucide-react';

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
    } catch (err) {
      console.error("Bot unreachable:", err);
      setData({ status: "OFFLINE" });
    } finally {
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
      await axios.post(`${BOT_URL}/scan`);
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setScanning(false);
      setTimeout(fetchData, 2000);
    }
  };

  // v81.0 Data
  const version = data.version || "v81.0";
  const equity = data.equity || "$0.00";
  const dailyPnL = data.dailyPnL || "+$0.00";
  const positions = data.positions || [];
  const positionsCount = positions.length;
  const stats = data.stats || { wins: 0, losses: 0, total: 0, winRate: "0.0%" };
  const tradeLog = data.tradeLog || [];

  const isLive = !data.dry_mode;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 mx-auto text-yellow-500 animate-pulse mb-6" />
          <div className="text-4xl font-bold text-yellow-400">AlphaStream v81.0</div>
          <p className="text-lg text-purple-300 mt-3">Final Perfection Loading...</p>
        </div>
      </div>
    );
  }

  if (data.status === "OFFLINE" || !BOT_URL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-purple-900 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="w-20 h-20 mx-auto text-red-500 mb-6" />
          <h1 className="text-4xl font-bold text-red-400">BOT OFFLINE</h1>
          <p className="text-gray-300 mt-4">Check BOT_URL in Vercel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/90 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AlphaStream <span className="text-white text-2xl">{version}</span>
            </h1>
            <p className="text-sm text-purple-300 flex items-center gap-2 mt-1">
              <Globe className="w-4 h-4" />
              Yahoo Nuclear Momentum • Final Perfection
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-6 py-2 rounded-full text-sm font-bold ${isLive ? 'bg-green-600' : 'bg-amber-600'}`}>
              {isLive ? "LIVE TRADING" : "PAPER MODE"}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 pb-20">
        <div className="max-w-6xl mx-auto space-y-10">

          <div className="text-center mt-8">
            <h2 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              FINAL PERFECTION
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/10 hover:scale-105 transition">
              <DollarSign className="w-10 h-10 mx-auto text-cyan-400 mb-2" />
              <p className="text-3xl font-bold text-cyan-300">{equity}</p>
              <p className="text-sm text-gray-400 mt-1">Equity</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/10 hover:scale-105 transition">
              <Target className="w-10 h-10 mx-auto text-green-400 mb-2" />
              <p className={`text-3xl font-bold ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {dailyPnL}
              </p>
              <p className="text-sm text-gray-400 mt-1">Daily P&L</p>
            </div>

            <div
              onClick={() => setShowPositions(true)}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/10 cursor-pointer hover:scale-110 transition"
            >
              <Swords className="w-10 h-10 mx-auto text-orange-400 mb-2" />
              <p className="text-4xl font-bold text-orange-300">{positionsCount}/5</p>
              <p className="text-sm text-gray-400 mt-1">Active Positions</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/10 hover:scale-105 transition">
              <Zap className="w-10 h-10 mx-auto text-yellow-400 mb-2" />
              <p className="text-4xl font-bold text-yellow-300">{stats.winRate}</p>
              <p className="text-sm text-gray-400 mt-1">
                Win Rate ({stats.wins}W / {stats.losses}L)
              </p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="px-24 py-8 text-3xl font-bold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 transition-all flex items-center gap-4 mx-auto shadow-2xl"
            >
              <RefreshCw className={`w-10 h-10 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? "SCANNING..." : "FORCE SCAN"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-lg text-purple-300">
              Last scan: <span className="font-semibold text-cyan-300">{lastScan || "Never"}</span>
            </p>
          </div>

          {/* Trade Log Preview */}
          {tradeLog.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-purple-300 mb-4">Recent Trades</h3>
              <div className="space-y-2 text-sm">
                {tradeLog.slice(-8).reverse().map((t: any, i: number) => (
                  <div key={i} className="flex justify-between text-gray-300">
                    <span>{t.type} {t.symbol} ×{t.qty}</span>
                    <span>@ ${t.price} — <span className="text-cyan-400">{t.reason || "Entry"}</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Positions Modal */}
      {showPositions && positions.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6" onClick={() => setShowPositions(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-4xl w-full max-h-screen overflow-y-auto border border-purple-500/50" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-purple-400">ACTIVE POSITIONS</h3>
              <button onClick={() => setShowPositions(false)}>
                <X className="w-8 h-8 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              {positions.map((p: any) => {
                const pnlPct = p.entry > 0 ? ((p.current - p.entry) / p.entry) * 100 : 0;
                return (
                  <div key={p.symbol} className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      <div>
                        <p className="text-gray-400 text-sm">Symbol</p>
                        <p className="text-2xl font-bold text-purple-300">{p.symbol}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Qty</p>
                        <p className="text-xl font-semibold">{p.qty}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Entry</p>
                        <p className="text-xl">${Number(p.entry).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Current</p>
                        <p className={`text-xl font-bold ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${Number(p.current).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">P&L</p>
                        <p className={`text-2xl font-bold ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
