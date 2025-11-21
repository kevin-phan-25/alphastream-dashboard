'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Trophy, Skull, Flame, Zap, Target, Crown, Swords, TrendingUp } from 'lucide-react';

export default function Home() {
  const [bot, setBot] = useState<any>({});
  const [trades, setTrades] = useState<any>({ trades: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchAll = async () => {
    try {
      const [botRes, tradesRes] = await Promise.all([
        axios.get(BOT_URL, { timeout: 12000 }),
        axios.get(`${BOT_URL}/trades`, { timeout: 10000 })
      ]);

      // Fix equity & unrealized string parsing
      const equityNum = parseFloat((botRes.data.equity || "$100000").replace(/[$,]/g, "")) || 100000;
      const unrealNum = parseFloat((botRes.data.unrealized || "0").replace(/[$,+]/g, "")) || 0;

      setBot({
        ...botRes.data,
        equity: `$${equityNum.toLocaleString()}`,
        unrealized: unrealNum >= 0 ? `+$${unrealNum.toLocaleString()}` : `–$${Math.abs(unrealNum).toLocaleString()}`
      });
      setTrades(tradesRes.data);
    } catch (e) {
      console.log("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const i = setInterval(fetchAll, 10000);
    return () => clearInterval(i);
  }, []);

  const triggerScan = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setScanning(false);
    setTimeout(fetchAll, 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Activity className="w-32 h-32 text-purple-500 animate-spin" />
    </div>
  );

  const stats = trades.stats || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white pb-foreground pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/95 border-b border-purple-600">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              AlphaStream v98
            </h1>
            <p className="text-xl text-orange-400 font-bold">WARRIOR PATTERN ENGINE • LIVE</p>
          </div>
          <span className="px-10 py-4 rounded-full text-3xl font-black bg-gradient-to-r from-emerald-500 to-green-600 shadow-2xl">
            {bot.mode || "LIVE"} MODE
          </span>
        </div>
      </header>

      <main className="pt-36 px-6 max-w-7xl mx-auto space-y-12">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-7xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
            LOW-FLOAT SNIPER
          </h2>
        </div>

        {/* Core Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-purple-500 hover:scale-105 transition">
            <p className="text-5xl font-black text-purple-300">{bot.equity || "$100,000"}</p>
            <p className="text-xl text-gray-300">Equity</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-green-500 hover:scale-105 transition">
            <TrendingUp className="w-16 h-16 mx-auto text-green-400 mb-3" />
            <p className={`text-5xl font-black ${bot.unrealized?.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
              {bot.unrealized || "+$0"}
            </p>
            <p className="text-xl text-gray-300">Unrealized</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-yellow-500 hover:scale-105 transition">
            <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-4" />
            <p className="text-6xl font-black text-yellow-400">{stats.winRate || "0.0"}%</p>
            <p className="text-xl text-gray-300">Win Rate</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-orange-500 hover:scale-105 transition">
            <Activity className="w-20 h-20 mx-auto text-orange-400 mb-4" />
            <p className="text-6xl font-black text-orange-300">{stats.trades || 0}</p>
            <p className="text-xl text-gray-300">Total Trades</p>
          </div>
        </div>

        {/* Rockets */}
        {bot.rockets?.length > 0 && (
          <div className="bg-black/60 backdrop-blur-2xl rounded-3xl p-10 border-4 border-yellow-500">
            <h3 className="text-5xl font-black text-center text-yellow-400 mb-8">
              <Flame className="inline w-12 h-12 animate-pulse" /> ROCKETS DETECTED <Flame className="inline w-12 h-12 animate-pulse" />
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
              {bot.rockets.map((r: string, i: number) => {
                const symbol = r.split('+')[0].trim();
                const pct = r.split('+')[1]?.split(' ')[0];
                const pattern = r.match(/\[(.*?)\]/)?.[1]?.toUpperCase() || "MOMO";
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-700 to-pink-800 rounded-2xl p-6 text-center hover:scale-110 transition shadow-xl">
                    <p className="text-4xl font-black">{symbol}</p>
                    <p className="text-3xl text-green-400">+{pct}</p>
                    <p className="text-sm font-bold text-cyan-300 mt-1">{pattern}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Trade History */}
        {trades.trades.length > 0 && (
          <div className="bg-black/50 backdrop-blur-xl rounded-3xl p-8 border-4 border-purple-500">
            <h3 className="text-4xl font-black text-center text-purple-400 mb-6">LIVE TRADE LOG</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {trades.trades.slice().reverse().map((t: any, i: number) => (
                <div key={i} className={`p-4 rounded-xl border-2 ${t.result === 'WIN' ? 'bg-green-900/40 border-green-500' : 'bg-red-900/40 border-red-500'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      {t.result === 'WIN' ? <Trophy className="w-10 h-10 text-yellow-400" /> : <Skull className="w-10 h-10 text-red-400" />}
                      <span className="text-2xl font-bold">{t.symbol}</span>
                      <span className="text-lg opacity-70">{t.pattern.toUpperCase()}</span>
                    </div>
                    <span className={`text-3xl font-black ${t.result === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.pnlPct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Force Scan */}
        <div className="text-center pt-10">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="px-32 py-14 text-5xl font-black rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 transition-all shadow-2xl border-8 border-purple-400 flex items-center justify-center gap-10 mx-auto"
          >
            <RefreshCw className={`w-20 h-20 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>
    </div>
  );
}
