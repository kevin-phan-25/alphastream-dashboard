'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Rocket, RefreshCw, X } from 'lucide-react';

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
      setData(res.data);
      setLoading(false);
    } catch {
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

  const isLive = data.status === "ONLINE" && !data.dry_mode;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black flex items-center justify-center text-5xl font-black text-purple-400">
        Loading Elite Mode...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white">

      {/* Fixed Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AlphaStream v30.0
          </h1>
          <span className="text-2xl font-bold text-cyan-400">ELITE AUTONOMOUS</span>
        </div>
      </header>

      <main className="pt-32 px-6 pb-20">
        <div className="max-w-5xl mx-auto text-center space-y-16">

          <h2 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            AlphaStream — Elite Mode
          </h2>

          {/* Status Circle */}
          <div className="flex justify-center">
            <div className="w-64 h-64 rounded-full bg-gradient-to-r from-green-600/40 to-cyan-600/40 border-8 border-green-400 shadow-2xl flex items-center justify-center animate-pulse">
              <Activity className="w-32 h-32 text-green-400" />
            </div>
          </div>

          {/* Stats Grid — Equity 100% Safe */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <p className="text-gray-400 text-sm">STATUS</p>
              <p className={`font-black text-4xl mt-3 ${isLive ? 'text-green-400' : 'text-yellow-400'}`}>
                {isLive ? "LIVE" : "DRY"}
              </p>
            </div>

            <div 
              onClick={() => setShowPositions(true)}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 cursor-pointer hover:scale-105 transition"
            >
              <p className="text-gray-400 text-sm">POSITIONS</p>
              <p className="font-black text-4xl mt-3 text-purple-400">
                {data.positions_count || 0}/5
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <p className="text-gray-400 text-sm">EQUITY</p>
              <p className="font-black text-3xl md:text-4xl lg:text-5xl mt-3 text-cyan-400 break-all leading-tight">
                {data.equity || "$0.00"}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <p className="text-gray-400 text-sm">DAILY P&L</p>
              <p className={`font-black text-4xl mt-3 ${data.dailyPnL?.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
                {data.dailyPnL || "0.00%"}
              </p>
            </div>
          </div>

          {/* Manual Scan */}
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="px-32 py-16 text-6xl font-black rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl disabled:opacity-60"
          >
            {scanning ? (
              <>SCANNING <RefreshCw className="inline ml-8 w-16 h-16 animate-spin" /></>
            ) : (
              <>MANUAL SCAN <Rocket className="inline ml-8 w-16 h-16" /></>
            )}
          </button>

        </div>
      </main>

      {/* POSITIONS MODAL */}
      {showPositions && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900/95 border border-white/20 rounded-3xl p-10 max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-5xl font-black text-purple-400">Active Positions</h3>
              <button onClick={() => setShowPositions(false)}>
                <X className="w-10 h-10 text-gray-400 hover:text-white" />
              </button>
            </div>

            {(!data.positions || data.positions.length === 0) ? (
              <p className="text-center text-2xl text-gray-400 py-20">No open positions</p>
            ) : (
              <div className="space-y-6">
                {data.positions.map((p: any, i: number) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div><span className="text-gray-400">Symbol</span><p className="text-3xl font-bold text-purple-400">{p.symbol}</p></div>
                      <div><span className="text-gray-400">Qty</span><p className="text-3xl font-bold">{p.qty}</p></div>
                      <div><span className="text-gray-400">Entry</span><p className="text-2xl">${p.entry.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">Current</span><p className={`text-2xl font-bold ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>${p.current.toFixed(2)}</p></div>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <div><span className="text-gray-400">P&L</span><p className={`text-2xl font-bold ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${p.unrealized_pl.toFixed(2)} ({p.unrealized_plpc.toFixed(2)}%)
                      </p></div>
                      <div><span className="text-gray-400">Value</span><p className="text-2xl font-bold text-cyan-400">${p.market_value.toFixed(2)}</p></div>
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
