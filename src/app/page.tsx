// src/app/page.tsx — v81.2 (Deploy This — Positions Modal FIXED)
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, X, DollarSign, Target, Swords, Zap, AlertTriangle } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({ positions: [] });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [lastScan, setLastScan] = useState("");

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL?.trim();

  useEffect(() => {
    if (!BOT_URL) return;
    const fetch = async () => {
      try {
        const res = await axios.get(BOT_URL);
        setData(res.data);
      } catch { setData({ positions: [] }); }
      setLoading(false);
    };
    fetch();
    const i = setInterval(fetch, 8000);
    return () => clearInterval(i);
  }, [BOT_URL]);

  const triggerScan = () => {
    if (scanning || !BOT_URL) return;
    setScanning(true);
    setLastScan(new Date().toLocaleTimeString());
    axios.post(`${BOT_URL}/scan`).finally(() => {
      setScanning(false);
      setTimeout(() => fetch(), 3000);
    });
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"><div className="text-4xl text-purple-400">Loading...</div></div>;
  if (!BOT_URL) return <div className="min-h-screen bg-red-900 flex items-center justify-center text-4xl text-white">BOT_URL NOT SET</div>;

  const positions = data.positions || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header & Stats */}
      <header className="fixed top-0 w-full bg-black/80 backdrop-blur-xl border-b border-purple-600/30 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AlphaStream v81.2</h1>
          <span className={`px-6 py-3 rounded-full font-bold ${data.dry_mode ? 'bg-amber-600' : 'bg-green-600'}`}>
            {data.dry_mode ? "PAPER" : "LIVE"}
          </span>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-6xl mx-auto space-y-12">
        <h2 className="text-8xl font-black text-center bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">NUCLEAR</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur rounded-3xl p-8 text-center border border-white/20">
            <DollarSign className="w-12 h-12 mx-auto text-cyan-400" />
            <p className="text-4xl font-bold">{data.equity || "$0"}</p>
            <p className="text-gray-400">Equity</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-3xl p-8 text-center border border-white/20">
            <Target className="w-12 h-12 mx-auto text-green-400" />
            <p className="text-4xl font-bold text-green-400">{data.dailyPnL || "+$0"}</p>
            <p className="text-gray-400">P&L</p>
          </div>
          <div onClick={() => setShowPositions(true)} className="bg-white/10 backdrop-blur rounded-3xl p-8 text-center border border-white/20 cursor-pointer hover:scale-110 transition">
            <Swords className="w-12 h-12 mx-auto text-orange-400" />
            <p className="text-5xl font-black">{positions.length}/5</p>
            <p className="text-gray-400">Positions</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-3xl p-8 text-center border border-white/20">
            <Zap className="w-12 h-12 mx-auto text-yellow-400" />
            <p className="text-5xl font-black text-yellow-400">LIVE</p>
            <p className="text-gray-400">Status</p>
          </div>
        </div>

        <div className="text-center">
          <button onClick={triggerScan} disabled={scanning} className="px-32 py-10 text-4xl font-black rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 shadow-2xl flex items-center gap-6 mx-auto">
            <RefreshCw className={`w-12 h-12 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING..." : "FORCE SCAN"}
          </button>
          <p className="mt-4 text-xl text-purple-300">Last scan: {lastScan || "Never"}</p>
        </div>
      </main>

      {/* FIXED POSITIONS MODAL — NOW WORKS 100% */}
      {showPositions && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6" onClick={() => setShowPositions(false)}>
          <div className="bg-gray-900 rounded-3xl p-10 max-w-4xl w-full max-h-screen overflow-y-auto border-4 border-purple-600" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-4xl font-black text-purple-400">ACTIVE POSITIONS</h3>
              <button onClick={() => setShowPositions(false)}><X className="w-10 h-10" /></button>
            </div>
            {positions.length === 0 ? (
              <p className="text-center text-3xl text-gray-500 py-20">No active positions</p>
            ) : (
              <div className="space-y-6">
                {positions.map((p: any) => {
                  const pnl = ((p.current - p.entry) / p.entry) * 100;
                  return (
                    <div key={p.symbol} className="bg-black/50 rounded-2xl p-6 border border-purple-500">
                      <div className="grid grid-cols-5 gap-4 text-center">
                        <div><p className="text-gray-400">Symbol</p><p className="text-2xl font-bold text-purple-300">{p.symbol}</p></div>
                        <div><p className="text-gray-400">Qty</p><p>{p.qty}</p></div>
                        <div><p className="text-gray-400">Entry</p><p>${Number(p.entry).toFixed(2)}</p></div>
                        <div><p className="text-gray-400">Current</p><p className={pnl >= 0 ? "text-green-400" : "text-red-400"}>${Number(p.current).toFixed(2)}</p></div>
                        <div><p className="text-gray-400">P&L</p><p className={`text-3xl font-black ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}%</p></div>
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
