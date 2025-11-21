'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Trophy, Skull, Flame, Swords } from 'lucide-react';

export default function Home() {
  const [bot, setBot] = useState<any>({});
  const [trades, setTrades] = useState<any>({ trades: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchAll = async () => {
    try {
      const [botRes, tradesRes] = await Promise.all([
        axios.get(BOT_URL),
        axios.get(`${BOT_URL}/trades`)
      ]);
      setBot(botRes.data);
      setTrades(tradesRes.data);
    } catch { } finally {
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
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-black flex items-center justify-center">
      <Activity className="w-24 h-24 text-cyan-400 animate-spin" />
    </div>
  );

  const stats = trades.stats || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-black text-white">
      {/* OFFICIAL WARRIOR HEADER */}
      <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-blue-900 to-blue-950 border-b-4 border-cyan-400 shadow-2xl">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            {/* Warrior Logo SVG */}
            <svg width="80" height="80" viewBox="0 0 100 100" className="drop-shadow-2xl">
              <path d="M50 10 L10 50 L30 50 L30 90 L70 90 L70 50 L90 50 Z" fill="#0ff" opacity="0.9"/>
              <path d="M50 25 L35 45 L45 45 L45 75 L55 75 L55 45 L65 45 Z" fill="#000"/>
              <circle cx="50" cy="35" r="5" fill="#000"/>
            </svg>
            <div>
              <h1 className="text-5xl font-black tracking-wider text-cyan-400">
                WARRIOR TRADING
              </h1>
              <p className="text-2xl font-bold text-cyan-300">AlphaStream v98 — LIVE</p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-10 py-4 rounded-full text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-600 shadow-xl border-4 border-cyan-300">
              {bot.mode || "LIVE"} MODE
            </span>
          </div>
        </div>
      </header>

      <main className="pt-40 px-8 max-w-7xl mx-auto space-y-12">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-7xl font-black text-cyan-400 tracking-wider">
            CHART PATTERN SNIPER
          </h2>
          <div className="h-1 w-96 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mt-4"></div>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="bg-blue-900/50 backdrop-blur-xl rounded-2xl p-8 text-center border-4 border-cyan-400">
            <p className="text-6xl font-black text-cyan-300">{bot.equity || "$100,000"}</p>
            <p className="text-2xl text-gray-300 mt-2">Account Equity</p>
          </div>
          <div className="bg-green-900/50 backdrop-blur-xl rounded-2xl p-8 text-center border-4 border-green-500">
            <p className={`text-6xl font-black ${bot.unrealized?.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
              {bot.unrealized || "+$0"}
            </p>
            <p className="text-2xl text-gray-300 mt-2">Unrealized P&L</p>
          </div>
          <div className="bg-yellow-900/50 backdrop-blur-xl rounded-2xl p-8 text-center border-4 border-yellow-500">
            <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-4" />
            <p className="text-7xl font-black text-yellow-400">{stats.winRate || "0.0"}%</p>
            <p className="text-2xl text-gray-300 mt-2">Win Rate</p>
          </div>
          <div className="bg-purple-900/50 backdrop-blur-xl rounded-2xl p-8 text-center border-4 border-purple-500">
            <p className="text-7xl font-black text-purple-300">{stats.trades || 0}</p>
            <p className="text-2xl text-gray-300 mt-2">Total Trades</p>
          </div>
        </div>

        {/* Rockets */}
        {bot.rockets?.length > 0 && (
          <div className="bg-blue-900/40 backdrop-blur-2xl rounded-3xl p-10 border-4 border-cyan-400">
            <h3 className="text-5xl font-black text-center text-cyan-400 mb-8 tracking-wider">
              ACTIVE WARRIOR PATTERNS
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8">
              {bot.rockets.map((r: string, i: number) => {
                const symbol = r.split('+')[0].trim();
                const pct = r.split('+')[1]?.split(' ')[0];
                const pattern = r.match(/\[(.*?)\]/)?.[1] || "MOMENTUM";
                return (
                  <div key={i} className="bg-gradient-to-br from-cyan-600 to-blue-800 rounded-2xl p-6 text-center border-2 border-cyan-300">
                    <Flame className="w-12 h-12 mx-auto text-orange-400 mb-3" />
                    <p className="text-4xl font-black">{symbol}</p>
                    <p className="text-3xl text-green-400">+{pct}</p>
                    <p className="text-sm font-bold text-cyan-300 mt-2 uppercase tracking-wider">{pattern}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trade History */}
        {trades.trades.length > 0 && (
          <div className="bg-blue-900/30 backdrop-blur-xl rounded-3xl p-10 border-4 border-cyan-400">
            <h3 className="text-4xl font-black text-center text-cyan-400 mb-8 tracking-wider">
              LIVE TRADE LOG
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {trades.trades.slice().reverse().map((t: any, i: number) => (
                <div key={i} className={`p-5 rounded-xl border-2 ${t.result === 'WIN' ? 'bg-green-900/60 border-green-500' : 'bg-red-900/60 border-red-500'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      {t.result === 'WIN' ? <Trophy className="w-10 h-10 text-yellow-400" /> : <Skull className="w-10 h-10 text-red-400" />}
                      <span className="text-3xl font-bold">{t.symbol}</span>
                      <span className="text-xl opacity-80">{t.pattern.toUpperCase()}</span>
                    </div>
                    <span className={`text-4xl font-black ${t.result === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.pnlPct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Force Scan */}
        <div className="text-center pt-12">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="px-40 py-16 text-6xl font-black tracking-wider rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-700 hover:from-cyan-400 hover:to-blue-600 transition-all shadow-2xl border-8 border-cyan-300 flex items-center justify-center gap-10 mx-auto"
          >
            <RefreshCw className={`w-20 h-20 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-black/80 backdrop-blur-xl border-t-4 border-cyan-400 py-4 text-center">
        <p className="text-cyan-400 font-bold tracking-wider">
          © 2025 AlphaStream • Powered by Warrior Trading Patterns
        </p>
      </footer>
    </div>
  );
}
