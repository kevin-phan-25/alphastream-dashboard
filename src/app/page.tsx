'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Rocket, RefreshCw, X, TrendingUp, AlertTriangle, Zap, Flame, DollarSign, Target, BarChart3 } from 'lucide-react';

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

  const version = data.version || "v71.0";
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
        <div className="text-center">
          <Flame className="w-20 h-20 mx-auto text-orange-500 animate-pulse mb-6" />
          <div className="text-5xl font-black text-purple-300">AlphaStream {version}</div>
          <p className="text-xl text-purple-400 mt-4">Connecting to FMP...</p>
        </div>
      </div>
    );
  }

  if (data.status === "OFFLINE" || !BOT_URL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-purple-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-24 h-24 mx-auto text-red-500 mb-6" />
          <h1 className="text-5xl font-black text-red-400 mb-4">BOT OFFLINE</h1>
          <p className="text-xl text-gray-300">Check BOT_URL in Vercel env</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white">
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/95 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AlphaStream {version}
            </h1>
            <p className="text-sm text-purple-300">FMP-Powered Momentum Engine</p>
          </div>
          <div className="flex items-center gap-6">
            <span className={`px-6 py-3 rounded-full text-lg font-bold ${isLive ? 'bg-green-600 animate-pulse' : 'bg-yellow-600'}`}>
              {isLive ? "LIVE TRADING" : "PAPER MODE"}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-32 px-6 pb-20">
        <div className="max-w-6xl mx-auto space-y-12">

          <div className="text-center">
            <h2 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              FMP TOP GAINERS
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10 hover:scale-105 transition">
              <DollarSign className="w-12 h-12 mx-auto text-cyan-400 mb-3" />
              <p className="text-4xl font-black text-cyan-300">{equity}</p>
              <p className="text-gray-400 mt-2">Equity</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10 hover:scale-105 transition">
              <Target className="w-12 h-12 mx-auto text-yellow-400 mb-3" />
              <p className={`text-4xl font-black ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {dailyPnL}
              </p>
              <p className="text-gray-400 mt-2">Daily P&L</p>
            </div>
            <div 
              onClick={() => setShowPositions(true)}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10 cursor-pointer hover:scale-110 transition"
            >
              <BarChart3 className="w-12 h-12 mx-auto text-purple-400 mb-3" />
              <p className="text-6xl font-black text-purple-300">{positionsCount}/5</p>
              <p className="text-gray-400 mt-2">Positions</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10 hover:scale-105 transition">
              <Zap className="w-12 h-12 mx-auto text-yellow-400 mb-3" />
              <p className="text-6xl font-black text-yellow-300">{winRate}</p>
              <p className="text-gray-400 mt-2">Win Rate</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="px-32 py-12 text-5xl font-black rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 shadow-2xl disabled:opacity-60 transition-all"
            >
              {scanning ? "SCANNING..." : "FORCE SCAN"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xl text-purple-300">
              Last scan: <span className="font-bold">{lastScan || "Never"}</span>
            </p>
          </div>

        </div>
      </main>

      {showPositions && data.positions && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8" onClick={() => setShowPositions(false)}>
          <div className="bg-gray-900 rounded-3xl p-10 max-w-5xl w-full max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-5xl font-black text-purple-400">ACTIVE POSITIONS</h3>
              <button onClick={() => setShowPositions(false)}>
                <X className="w-12 h-12 text-gray-400" />
              </button>
            </div>
            {data.positions.length === 0 ? (
              <p className="text-center text-gray-400 py-32 text-3xl">No open positions</p>
            ) : (
              <div className="space-y-6">
                {data.positions.map((p: any) => (
                  <div key={p.symbol} className="bg-white/10 rounded-2xl p-8 border border-white/20">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      <div><span className="text-gray-400">Symbol</span><p className="text-4xl font-black text-purple-300">{p.symbol}</p></div>
                      <div><span className="text-gray-400">Qty</span><p className="text-3xl font-bold">{p.qty}</p></div>
                      <div><span className="text-gray-400">Entry</span><p className="text-2xl">${p.entry?.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">Current</span><p className={`text-2xl font-bold ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>${p.current?.toFixed(2)}</p></div>
                      <div><span className="text-gray-400">Unrealized</span><p className={`text-3xl font-black ${p.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
