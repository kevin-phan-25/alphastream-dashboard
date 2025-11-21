'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, AlertTriangle, Rocket, TrendingUp, DollarSign, Flame, Zap } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL?.trim();

  const fetchData = async () => {
    if (!BOT_URL) return;
    try {
      const res = await axios.get(BOT_URL);
      setData(res.data);
    } catch { setData({ status: "OFFLINE" }); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); const id = setInterval(fetchData, 8000); return () => clearInterval(id); }, []);

  const triggerScan = async () => {
    if (!BOT_URL || scanning) return;
    setScanning(true);
    setLastScan(new Date().toLocaleTimeString());
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setScanning(false);
    setTimeout(fetchData, 3000);
  };

  const bt = data.backtest || {};

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white pb-32">
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/95 border-b border-purple-600/60">
          <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
                AlphaStream v95.0
              </h1>
              <p className="text-2xl text-orange-300 font-bold">LOW-FLOAT ROCKET HUNTER + BACKTESTER</p>
            </div>
            <div className="text-right">
              <span className="px-12 py-6 rounded-full text-4xl font-black bg-gradient-to-r from-green-500 to-emerald-600 shadow-2xl">
                {data.mode || "PAPER"} MODE
              </span>
            </div>
          </div>
        </header>

        <main className="pt-44 px-6">
          <div className="max-w-7xl mx-auto space-y-12">

            {/* Hero */}
            <div className="text-center">
              <h2 className="text-8xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent animate-pulse">
                LOW-FLOAT BEAST MODE
              </h2>
              <p className="text-4xl text-cyan-300 mt-4">Only ≤40M float runners • Real backtesting</p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-cyan-500/60">
                <DollarSign className="w-20 h-20 mx-auto text-cyan-400" />
                <p className="text-5xl font-black text-cyan-300">{data.equity}</p>
                <p className="text-xl">Equity</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-green-500/60">
                <TrendingUp className="w-20 h-20 mx-auto text-green-400" />
                <p className={`text-5xl font-black ${data.unrealized?.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                  {data.unrealized}
                </p>
                <p className="text-xl">Unrealized</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-orange-500/60">
                <Rocket className="w-20 h-20 mx-auto text-orange-400" />
                <p className="text-5xl font-black text-orange-300">{data.positions || 0}</p>
                <p className="text-xl">Active Rockets</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-purple-500/60">
                <Zap className="w-20 h-20 mx-auto text-purple-400 animate-pulse" />
                <p className="text-5xl font-black text-purple-300">{data.rockets?.length || 0}</p>
                <p className="text-xl">Low-Float Detected</p>
              </div>
            </div>

            {/* Backtest Stats */}
            {bt.trades > 0 && (
              <div className="bg-black/60 backdrop-blur-2xl rounded-3xl p-12 border-4 border-green-500/80">
                <h3 className="text-5xl font-black text-center text-green-400 mb-8">BACKTEST RESULTS (2025)</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-6 text-center">
                  <div><p className="text-gray-400">Trades</p><p className="text-4xl font-bold text-white">{bt.trades}</p></div>
                  <div><p className="text-gray-400">Win %</p><p className="text-4xl font-bold text-green-400">{bt.winRate}%</p></div>
                  <div><p className="text-gray-400">P/F</p><p className="text-4xl font-bold text-cyan-400">{bt.profitFactor.toFixed(2)}</p></div>
                  <div><p className="text-gray-400">Total P&L</p><p className={`text-4xl font-bold ${bt.totalPnL > 0 ? 'text-green-400' : 'text-red-400'}`}>${bt.totalPnL > 0 ? '+' : ''}{bt.totalPnL.toFixed(0)}</p></div>
                  <div><p className="text-gray-400">Max DD</p><p className="text-4xl font-bold text-orange-400">{bt.maxDD}%</p></div>
                  <div><p className="text-gray-400">Best</p><p className="text-4xl font-bold text-yellow-400">+${bt.bestTrade.toFixed(0)}</p></div>
                </div>
              </div>
            )}

            {/* Rockets with Float */}
            {data.rockets?.length > 0 && (
              <div className="bg-black/50 backdrop-blur-2xl rounded-3xl p-12 border-4 border-yellow-500">
                <h3 className="text-6xl font-black text-center text-yellow-400 mb-10 flex items-center justify-center gap-8">
                  <Flame className="w-20 h-20 animate-pulse" />
                  LOW-FLOAT ROCKETS
                  <Flame className="w-20 h-20 animate-pulse" />
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                  {data.rockets.map((r: string, i: number) => (
                    <div key={i} className="bg-gradient-to-br from-purple-700 to-pink-800 rounded-2xl p-6 text-center hover:scale-110 transition">
                      <p className="text-4xl font-black">{r.split('+')[0]}</p>
                      <p className="text-3xl text-green-400">+{r.split('+')[1].split(' ')[0]}</p>
                      <p className="text-lg text-gray-300">{r.split('(')[1]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Force Scan */}
            <div className="text-center mt-20">
              <button
                onClick={triggerScan}
                disabled={scanning}
                className="px-72 py-20 text-7xl font-black rounded-3xl bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:via-purple-500 hover:to-pink-500 disabled:opacity-60 transition-all shadow-2xl flex items-center justify-center gap-12 mx-auto border-8 border-yellow-400"
              >
                <RefreshCw className={`w-24 h-24 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? "SCANNING..." : "FORCE SCAN"}
              </button>
              <p className="text-3xl text-cyan-300 mt-8">
                Last scan: <span className="font-bold text-yellow-400">{lastScan || "Never"}</span>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
