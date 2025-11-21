'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  RefreshCw,
  Rocket,
  DollarSign,
  TrendingUp,
  Activity,
  Flame,
  BarChart3,
} from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [backtesting, setBacktesting] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");
  const [lastBacktest, setLastBacktest] = useState<string>("");

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 12000 });
      setData(res.data || {});
    } catch {
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
    if (scanning) return;
    setScanning(true);
    setLastScan(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }));
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setScanning(false);
    setTimeout(fetchData, 1800);
  };

  const triggerBacktest = async () => {
    if (backtesting) return;
    setBacktesting(true);
    setLastBacktest(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }));
    await axios.post(`${BOT_URL}/backtest`).catch(() => {});
    setBacktesting(false);
    setTimeout(fetchData, 1200);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Activity className="w-20 h-20 text-purple-500 animate-spin" /></div>;
  if (data.status === "OFFLINE") return <div className="min-h-screen bg-red-900 flex items-center justify-center text-white text-5xl font-black">BOT OFFLINE</div>;

  const rawEquity = typeof data.equity === "string" ? parseFloat(data.equity.replace(/[$,]/g, "")) || 100000 : data.equity || 100000;
  const rawUnrealized = typeof data.unrealized === "string" ? parseFloat(data.unrealized.replace(/[$,+]/g, "")) || 0 : data.unrealized || 0;

  const equity = `$${rawEquity.toLocaleString()}`;
  const unrealized = rawUnrealized >= 0 ? `+$${rawUnrealized.toLocaleString()}` : `-$${Math.abs(rawUnrealized).toLocaleString()}`;
  const positionsCount = data.positions || 0;
  const rockets: string[] = data.rockets || [];
  const backtest = data.backtest || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white pb-20">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/95 border-b border-purple-600/60">
        <div className="max-w-6xl mx-auto px-5 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              AlphaStream v97.1
            </h1>
            <p className="text-lg text-orange-300 font-bold">REAL ALPACA • LOW-FLOAT • LIVE</p>
          </div>
          <span className="px-8 py-3 rounded-full text-2xl font-black bg-gradient-to-r from-emerald-500 to-green-600 shadow-xl">
            {data.mode || "LIVE"} MODE
          </span>
        </div>
      </header>

      <main className="pt-32 px-5 max-w-6xl mx-auto space-y-10">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
            LOW-FLOAT ROCKET HUNTER
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border-2 border-cyan-500/60 hover:scale-105 transition">
            <DollarSign className="w-12 h-12 mx-auto text-cyan-400 mb-2" />
            <p className="text-4xl font-black text-cyan-300">{equity}</p>
            <p className="text-sm text-gray-300">Equity</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border-2 ${rawUnrealized >= 0 ? 'border-green-500/60' : 'border-red-500/60'} hover:scale-105 transition">
            <TrendingUp className={`w-12 h-12 mx-auto mb-2 ${rawUnrealized >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <p className={`text-4xl font-black ${rawUnrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>{unrealized}</p>
            <p className="text-sm text-gray-300">Unrealized P&L</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border-2 border-purple-500/60 hover:scale-105 transition">
            <Activity className="w-12 h-12 mx-auto text-purple-400 mb-2" />
            <p className="text-4xl font-black text-purple-300">{positionsCount}</p>
            <p className="text-sm text-gray-300">Active</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border-2 border-orange-500/60 hover:scale-105 transition">
            <Rocket className="w-12 h-12 mx-auto text-orange-400 mb-2 animate-bounce" />
            <p className="text-4xl font-black text-orange-300">{rockets.length}</p>
            <p className="text-sm text-gray-300">Rockets</p>
          </div>
        </div>

        {/* Rockets */}
        {rockets.length > 0 && (
          <div className="bg-black/40 backdrop-blur-2xl rounded-2xl p-8 border-4 border-yellow-500">
            <h3 className="text-4xl font-black text-center text-yellow-400 mb-6 flex items-center justify-center gap-4">
              <Flame className="w-12 h-12 animate-pulse" />
              ROCKETS INCOMING
              <Flame className="w-12 h-12 animate-pulse" />
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-5">
              {rockets.map((r: string, i: number) => {
                const [sym, rest] = r.split('+');
                const [pct] = rest.split(' ');
                const floatPart = r.match(/\((.*?)\)/)?.[1] || '';
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-700 to-pink-800 rounded-xl p-5 text-center hover:scale-110 transition">
                    <p className="text-2xl font-black">{sym}</p>
                    <p className="text-2xl text-green-400">+{pct}</p>
                    {floatPart && <p className="text-xs text-gray-300 mt-1">{floatPart}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="py-12 text-4xl font-black rounded-2xl bg-gradient-to-r from-cyan-600 to-purple-700 hover:from-cyan-500 hover:to-purple-600 disabled:opacity-50 transition-all shadow-2xl border-4 border-cyan-400 flex items-center justify-center gap-6"
          >
            <RefreshCw className={`w-16 h-16 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING..." : "FORCE SCAN"}
          </button>

          <button
            onClick={triggerBacktest}
            disabled={backtesting}
            className="py-12 text-4xl font-black rounded-2xl bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 disabled:opacity-50 transition-all shadow-2xl border-4 border-orange-400 flex items-center justify-center gap-6"
          >
            <BarChart3 className={`w-16 h-16 ${backtesting ? 'animate-spin' : ''}`} />
            {backtesting ? "CRUNCHING..." : "RUN BACKTEST"}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3 pt-8">
          <p className="text-2xl text-cyan-300">
            Last scan: <span className="font-bold text-yellow-400">{lastScan || "—"}</span> ET
          </p>
          <p className="text-2xl text-orange-300">
            Last backtest: <span className="font-bold text-yellow-400">{lastBacktest || "—"}</span> ET
          </p>
        </div>
      </main>
    </div>
  );
}
