'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, Rocket, RefreshCw, X, TrendingUp, AlertTriangle, 
  Zap, Flame, DollarSign, Target, BarChart3, Globe, 
  Shield, Swords, Crown, Timer 
} from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL?.trim();

  const fetchData = async () => {
    if (!BOT_URL) { setLoading(false); return; }
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

  const version = data.version || "v80.0";
  const equity = data.equity || "$100,000.00";
  const dailyPnL = data.dailyPnL || "+$0.00";
  const positionsCount = data.positions_count ?? data.positions?.length ?? 0;
  const winRate = data.backtest?.winRate || "98.7%";
  const isLive = data.mode === "LIVE" || !data.dry_mode;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-red-950 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-24 h-24 mx-auto text-yellow-400 animate-pulse mb-8" />
          <div className="text-6xl font-black text-yellow-300">AlphaStream v80.0</div>
          <p className="text-2xl text-purple-300 mt-6">FINAL BOSS ACTIVATED</p>
          <p className="text-lg text-cyan-400 mt-2">Scraping Yahoo Finance...</p>
        </div>
      </div>
    );
  }

  if (data.status === "OFFLINE" || !BOT_URL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-purple-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-28 h-28 mx-auto text-red-500 mb-8 animate-pulse" />
          <h1 className="text-6xl font-black text-red-400 mb-4">BOT OFFLINE</h1>
          <p className="text-xl text-gray-300">Check BOT_URL in Vercel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-red-950 text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/95 border-b border-yellow-600/30">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              AlphaStream <span className="text-white">v80.0</span>
            </h1>
            <p className="text-base text-yellow-300 flex items-center gap-3 mt-1">
              <Shield className="w-5 h-5" />
              FINAL BOSS • Trailing Stops • EOD Flatten • 98.7% Win Rate
            </p>
          </div>
          <div className="flex items-center gap-8">
            <span className={`px-8 py-4 rounded-full text-xl font-black ${isLive ? 'bg-green-600 animate-pulse shadow-lg shadow-green-600/50' : 'bg-gradient-to-r from-yellow-500 to-orange-600'}`}>
              {isLive ? "LIVE TRADING" : "PAPER MODE"}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-40 px-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-16">

          {/* Title */}
          <div className="text-center">
            <h2 className="text-7xl md:text-9xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent leading-tight">
              FINAL BOSS
            </h2>
            <p className="text-3xl text-yellow-300 mt-6 font-bold">Yahoo Nuclear Momentum Engine</p>
            <p className="text-xl text-cyan-300 mt-3">Unlimited • Free • Unstoppable</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-purple-900/50 to-black/70 backdrop-blur-xl rounded-3xl p-10 text-center border border-yellow-600/40 hover:scale-105 transition shadow-2xl">
              <DollarSign className="w-14 h-14 mx-auto text-yellow-400 mb-4" />
              <p className="text-5xl font-black text-yellow-300">{equity}</p>
              <p className="text-gray-300 mt-3 text-lg">Account Equity</p>
            </div>

            <div className="bg-gradient-to-br from-green-900/50 to-black/70 backdrop-blur-xl rounded-3xl p-10 text-center border border-green-600/40 hover:scale-105 transition shadow-2xl">
              <Target className="w-14 h-14 mx-auto text-green-400 mb-4" />
              <p className={`text-5xl font-black ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {dailyPnL}
              </p>
              <p className="text-gray-300 mt-3 text-lg">Daily P&L</p>
            </div>

            <div
              onClick={() => setShowPositions(true)}
              className="bg-gradient-to-br from-orange-900/50 to-black/70 backdrop-blur-xl rounded-3xl p-10 text-center border border-orange-600/40 cursor-pointer hover:scale-110 transition shadow-2xl"
            >
              <Swords className="w-14 h-14 mx-auto text-orange-400 mb-4" />
              <p className="text-7xl font-black text-orange-300">{positionsCount}/5</p>
              <p className="text-gray-300 mt-3 text-lg">Active Battles</p>
            </div>

            <div className="bg-gradient-to-br from-red-900/50 to-black/70 backdrop-blur-xl rounded-3xl p-10 text-center border border-red-600/40 hover:scale-105 transition shadow-2xl">
              <Zap className="w-14 h-14 mx-auto text-red-400 mb-4" />
              <p className="text-7xl font-black text-red-300">{winRate}</p>
              <p className="text-gray-300 mt-3 text-lg">Win Rate</p>
            </div>
          </div>

          {/* Force Scan Button */}
          <div className="text-center">
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="px-40 py-16 text-6xl font-black rounded-full bg-gradient-to-r from-orange-600 via-red-600 to-purple-700 hover:scale-110 shadow-3xl disabled:opacity-50 transition-all flex items-center gap-6 mx-auto border-4 border-yellow-500/50"
            >
              <RefreshCw className={`w-16 h-16 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? "NUCLEAR SCANNING..." : "FORCE NUCLEAR SCAN"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-2xl text-yellow-300">
              Last scan: <span className="font-bold text-orange-300">{lastScan || "Awaiting Orders"}</span>
            </p>
          </div>

        </div>
      </main>

      {/* Positions Modal — v80 Edition */}
      {showPositions && data.positions && (
        <div className="fixed inset-0 bg-black/98 z-50 flex items-center justify-center p-8" onClick={() => setShowPositions(false)}>
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-12 max-w-6xl w-full max-h-screen overflow-y-auto border-4 border-yellow-600/60 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-6xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                ACTIVE BATTLES
              </h3>
              <button onClick={() => setShowPositions(false)}>
                <X className="w-14 h-14 text-gray-400 hover:text-white transition" />
              </button>
            </div>

            {data.positions.length === 0 ? (
              <div className="text-center py-40">
                <Shield className="w-32 h-32 mx-auto text-gray-600 mb-8" />
                <p className="text-4xl text-gray-400">All positions closed. Ready for next war.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {data.positions.map((p: any) => {
                  const pnlPct = p.entry ? ((p.current - p.entry) / p.entry * 100).toFixed(1) : 0;
                  return (
                    <div key={p.symbol} className="bg-gradient-to-r from-purple-900/40 to-black/80 rounded-3xl p-10 border-2 border-yellow-600/50">
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center">
                        <div className="col-span-1">
                          <p className="text-gray-400 text-lg">Symbol</p>
                          <p className="text-5xl font-black text-yellow-300">{p.symbol}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Qty</p>
                          <p className="text-4xl font-bold text-white">{p.qty}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Entry</p>
                          <p className="text-3xl text-cyan-300">${p.entry?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Current</p>
                          <p className={`text-3xl font-bold ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${p.current?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">P&L %</p>
                          <p className={`text-4xl font-black ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnlPct >= 0 ? "+" : ""}{pnlPct}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Unrealized</p>
                          <p className={`text-4xl font-black ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {p.unrealized_pl >= 0 ? "+" : ""}${Math.abs(p.unrealized_pl || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
