'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, X, DollarSign, Target, Swords, Zap, AlertTriangle, Activity } from 'lucide-react';

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
    const interval = setInterval(fetchData, 7000);
    return () => clearInterval(interval);
  }, []);

  const triggerScan = async () => {
    if (!BOT_URL || scanning || data.dailyMaxLossHit) return;
    setScanning(true);
    setLastScan(new Date().toLocaleTimeString());
    axios.post(`${BOT_URL}/scan`).finally(() => {
      setScanning(false);
      setTimeout(fetchData, 2000);
    });
  };

  const equity = data.equity || "$0.00";
  const dailyPnL = data.dailyPnL || "+$0.00";
  const positions = data.positions || [];
  const tradeLog = data.tradeLog || [];
  const dailyMaxLossHit = data.dailyMaxLossHit || false;

  const exits = tradeLog.filter((t: any) => t.type === "EXIT");
  const wins = exits.filter((t: any) => parseFloat(t.pnl || "0") > 0).length;
  const winRate = exits.length > 0 
    ? ((wins / exits.length) * 100).toFixed(1) + "%" 
    : "0.0%";

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <Activity className="w-16 h-16 text-purple-400 animate-pulse" />
    </div>
  );

  if (data.status === "OFFLINE" || !BOT_URL) return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-black flex items-center justify-center p-8">
      <div className="text-center">
        <AlertTriangle className="w-24 h-24 mx-auto text-red-500 mb-6" />
        <h1 className="text-5xl font-black text-red-400">BOT OFFLINE</h1>
        <p className="text-xl text-gray-400 mt-4">Check BOT_URL in Vercel</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white pb-20">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/80 border-b border-purple-600/30">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              AlphaStream v82.1
            </h1>
            <p className="text-sm text-purple-300 mt-1">Yahoo Nuclear Momentum • Prop-Firm Ready</p>
          </div>
          <span className={`px-6 py-3 rounded-full font-bold ${data.mode === 'PAPER' ? 'bg-amber-600' : 'bg-green-600 animate-pulse'}`}>
            {data.mode === 'PAPER' ? "PAPER MODE" : "LIVE TRADING"}
          </span>
        </div>
      </header>

      <main className="pt-32 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              NUCLEAR MOMENTUM
            </h2>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {/* Equity */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10 hover:scale-105 transition">
              <DollarSign className="w-12 h-12 mx-auto text-cyan-400 mb-3" />
              <p className="text-2xl font-bold text-cyan-300">{equity}</p>
              <p className="text-gray-400">Equity</p>
            </div>

            {/* Daily PnL */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10 hover:scale-105 transition">
              <Target className="w-12 h-12 mx-auto text-green-400 mb-3" />
              <p className={`text-4xl font-bold ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {dailyPnL}
              </p>
              <p className="text-gray-400">Daily P&L</p>
            </div>

            {/* Win Rate */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10 hover:scale-105 transition">
              <Zap className="w-12 h-12 mx-auto text-yellow-400 mb-3" />
              <p className="text-5xl font-black text-yellow-300">{winRate}</p>
              <p className="text-gray-400">Win Rate</p>
            </div>

            {/* Positions */}
            <div
              onClick={() => setShowPositions(true)}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10 cursor-pointer hover:scale-110 transition"
            >
              <Swords className="w-12 h-12 mx-auto text-orange-400 mb-3" />
              <p className="text-5xl font-black text-orange-300">{positions.length}/5</p>
              <p className="text-gray-400">Positions</p>
            </div>

            {/* Daily Limit */}
            <div className={`bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10 ${dailyMaxLossHit ? 'bg-red-800/40 animate-pulse' : ''}`}>
              <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-3" />
              <p className="text-3xl font-black">{dailyMaxLossHit ? "MAX LOSS HIT" : "OK"}</p>
              <p className="text-gray-400">Daily Limit</p>
            </div>
          </div>

          {/* Force Scan */}
          <div className="text-center">
            <button
              onClick={triggerScan}
              disabled={scanning || dailyMaxLossHit}
              className="px-32 py-10 text-4xl font-black rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 transition-all shadow-2xl flex items-center gap-6 mx-auto"
            >
              <RefreshCw className={`w-12 h-12 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? "SCANNING..." : dailyMaxLossHit ? "TRADING HALTED" : "FORCE NUCLEAR SCAN"}
            </button>
          </div>

          <div className="text-center text-xl text-purple-300">
            Last scan: <span className="font-bold text-cyan-300">{lastScan || "Never"}</span>
          </div>

          {/* Live Trade Log */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-purple-300 mb-6 text-center">LIVE TRADE LOG</h3>
            <div className="space-y-3 text-lg font-mono max-h-96 overflow-y-auto">
              {tradeLog.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Waiting for nuclear momentum...</p>
              ) : (
                tradeLog.slice(-12).reverse().map((t: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className={t.type === "ENTRY" ? "text-green-400" : "text-red-400"}>
                      {t.type} {t.symbol} ×{t.qty}
                    </span>
                    <span className="text-gray-300">
                      @ ${t.price} <span className="text-cyan-400 ml-2">{t.reason || ""}</span>
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
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl p-10 max-w-5xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-500" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-4xl font-black text-purple-400">ACTIVE POSITIONS</h3>
              <button onClick={() => setShowPositions(false)}>
                <X className="w-10 h-10 text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="space-y-6">
              {positions.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-xl">No active positions currently.</p>
              ) : positions.map((p: any) => {
                const pnlPct = p.entry > 0 ? ((p.current - p.entry) / p.entry) * 100 : 0;
                const pnlDollar = p.qty * (p.current - p.entry);
                return (
                  <div key={p.symbol} className="bg-black/40 rounded-2xl p-6 border border-purple-500/50">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-center md:text-left">
                      <div><p className="text-gray-400">Symbol</p><p className="text-3xl font-bold text-purple-300">{p.symbol}</p></div>
                      <div><p className="text-gray-400">Qty</p><p className="text-2xl">{p.qty}</p></div>
                      <div><p className="text-gray-400">Entry</p><p className="text-xl">${p.entry.toFixed(2)}</p></div>
                      <div><p className="text-gray-400">Current</p><p className={`text-xl font-bold ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>${p.current.toFixed(2)}</p></div>
                      <div><p className="text-gray-400">P&L $</p><p className={`text-xl font-black ${pnlDollar >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pnlDollar >= 0 ? '+' : ''}${pnlDollar.toFixed(2)}</p></div>
                      <div><p className="text-gray-400">P&L %</p><p className={`text-2xl font-black ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%</p></div>
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
