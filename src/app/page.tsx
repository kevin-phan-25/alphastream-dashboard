'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, X, Zap, Flame, DollarSign, TrendingUp, Swords, Activity, AlertTriangle } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");

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
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const triggerScan = async () => {
    if (!BOT_URL || scanning) return;
    setScanning(true);
    setLastScan(new Date().toLocaleTimeString());
    try {
      await axios.post(`${BOT_URL}/scan`);
    } catch {}
    setScanning(false);
    setTimeout(fetchData, 3000);
  };

  const equity = data.equity || "$0.00";
  const dailyPnL = data.dailyPnL || "+$0.00";
  const positions = data.positions || [];
  const tradeLog = data.tradeLog || [];
  const lastGainers = data.lastGainers || [];
  const winRate = data.winRate || "0.0%";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <Activity className="w-20 h-20 text-purple-400 animate-pulse" />
      </div>
    );
  }

  if (!BOT_URL || data.status === "OFFLINE") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-black flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="w-32 h-32 mx-auto text-red-500 mb-8" />
          <h1 className="text-6xl font-black text-red-400">BOT OFFLINE</h1>
          <p className="text-2xl text-gray-400 mt-6">Set NEXT_PUBLIC_BOT_URL in Vercel</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white pb-32">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/80 border-b border-purple-600/40">
          <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AlphaStream v83.5
              </h1>
            </div>
            <div className="text-right">
              <span className={`px-6 py-3 rounded-full text-xl font-bold ${data.mode === "LIVE" ? "bg-green-600" : "bg-amber-600"}`}>
                {data.mode || "PAPER"} MODE
              </span>
            </div>
          </div>
        </header>

        <main className="pt-36 px-6">
          <div className="max-w-7xl mx-auto space-y-12">

            {/* Title */}
            <div className="text-center">
              <h2 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                AlphaStream - ELITE MODE
              </h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-purple-500/30 hover:scale-105 transition">
                <DollarSign className="w-14 h-14 mx-auto text-cyan-400 mb-4" />
                <p className="text-3xl font-black text-cyan-300">{equity}</p>
                <p className="text-gray-400 text-lg">Equity</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-purple-500/30 hover:scale-105 transition">
                <TrendingUp className="w-14 h-14 mx-auto text-green-400 mb-4" />
                <p className={`text-3xl font-black ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                  {dailyPnL}
                </p>
                <p className="text-gray-400 text-lg">Daily P&L</p>
              </div>

              <div
                onClick={() => setShowPositions(true)}
                className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-purple-500/30 cursor-pointer hover:scale-110 transition"
              >
                <Swords className="w-14 h-14 mx-auto text-orange-400 mb-4" />
                <p className="text-3xl font-black text-orange-300">{positions.length}/5</p>
                <p className="text-gray-400 text-lg">Positions</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-purple-500/30 hover:scale-105 transition">
                <Zap className="w-14 h-14 mx-auto text-yellow-400 mb-4" />
                <p className="text-3xl font-black text-yellow-300">{winRate}</p>
                <p className="text-gray-400 text-lg">Win Rate</p>
              </div>
            </div>

            {/* Last Gainers */}
            {lastGainers.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-yellow-500/50">
                <h3 className="text-3xl font-black text-yellow-400 mb-6 text-center flex items-center justify-center gap-4">
                  <Flame className="w-10 h-10" /> LAST SCANNED ROCKETS <Flame className="w-10 h-10" />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {lastGainers.map((g: any) => (
                    <div key={g.symbol} className="bg-black/50 rounded-2xl p-6 text-center border border-orange-500/50">
                      <p className="text-3xl font-black text-orange-400">{g.symbol}</p>
                      <p className="text-xl text-gray-300">${g.price.toFixed(2)}</p>
                      <p className="text-2xl font-bold text-green-400">+{g.change.toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Force Scan */}
            <div className="text-center">
              <button
                onClick={triggerScan}
                disabled={scanning}
                className="px-40 py-12 text-5xl font-black rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-500 hover:via-pink-500 hover:to-orange-500 disabled:opacity-60 transition-all shadow-2xl flex items-center gap-8 mx-auto"
              >
                <RefreshCw className={`w-16 h-16 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? "SCANNING..." : "FORCE PENNY SCAN"}
              </button>
              <p className="text-2xl text-purple-300 mt-6">
                Last scan: <span className="font-bold text-cyan-300">{lastScan || "Never"}</span>
              </p>
            </div>

            {/* Trade Log */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30">
              <h3 className="text-3xl font-black text-purple-300 mb-6 text-center">LIVE TRADE LOG</h3>
              <div className="space-y-4 text-xl font-mono max-h-96 overflow-y-auto">
                {tradeLog.length === 0 ? (
                  <p className="text-center text-gray-500 py-12 text-2xl">Waiting for the first rocket...</p>
                ) : (
                  tradeLog.slice(-15).reverse().map((t: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className={t.type === "ENTRY" ? "text-green-400" : "text-red-400"}>
                        {t.type} {t.symbol} ×{t.qty}
                      </span>
                      <span className="text-gray-300">
                        @ ${t.price} <span className="text-cyan-400 ml-3">{t.reason}</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Positions Modal */}
        {showPositions && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6" onClick={() => setShowPositions(false)}>
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl p-12 max-w-6xl w-full max-h-[90vh] overflow-y-auto border-4 border-purple-600" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-5xl font-black text-purple-400">ACTIVE POSITIONS</h3>
                <button onClick={() => setShowPositions(false)}>
                  <X className="w-12 h-12 text-gray-400 hover:text-white" />
                </button>
              </div>
              {positions.length === 0 ? (
                <p className="text-center text-4xl text-gray-500 py-24">No active positions — hunting rockets...</p>
              ) : (
                <div className="space-y-8">
                  {positions.map((p: any) => {
                    const pnlPct = p.entry > 0 ? ((p.current - p.entry) / p.entry) * 100 : 0;
                    return (
                      <div key={p.symbol} className="bg-black/60 rounded-3xl p-8 border-2 border-purple-500/70">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
                          <div><p className="text-gray-400 text-lg">Symbol</p><p className="text-4xl font-black text-purple-300">{p.symbol}</p></div>
                          <div><p className="text-gray-400 text-lg">Qty</p><p className="text-3xl">{p.qty}</p></div>
                          <div><p className="text-gray-400 text-lg">Entry</p><p className="text-2xl">${Number(p.entry).toFixed(2)}</p></div>
                          <div><p className="text-gray-400 text-lg">Current</p><p className={`text-2xl font-bold ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>${Number(p.current).toFixed(2)}</p></div>
                          <div><p className="text-gray-400 text-lg">P&L</p><p className={`text-4xl font-black ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%</p></div>
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
    </>
  );
}
