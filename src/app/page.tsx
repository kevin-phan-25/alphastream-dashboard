'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, X, Zap, Flame, DollarSign, TrendingUp, Swords, Activity, AlertTriangle, Rocket } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
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
  }, [BOT_URL]);

  const triggerScan = async () => {
    if (!BOT_URL || scanning) return;
    setScanning(true);
    setLastScan(new Date().toLocaleTimeString());
    try {
      await axios.post(`${BOT_URL}/scan`);
    } catch {}
    setScanning(false);
    setTimeout(fetchData, 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <Activity className="w-24 h-24 text-purple-400 animate-pulse" />
      </div>
    );
  }

  if (!BOT_URL || data.status === "OFFLINE") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-black flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="w-32 h-32 mx-auto text-red-500 mb-8" />
          <h1 className="text-7xl font-black text-red-400">BOT OFFLINE</h1>
          <p className="text-2xl text-gray-400 mt-6">Set NEXT_PUBLIC_BOT_URL in Vercel</p>
        </div>
      </div>
    );
  }

  const equity = data.equity || "$100,000";
  const unrealized = data.unrealized || "+$0";
  const positions = data.positions || 0;
  const rockets: string[] = data.rockets || [];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white pb-32">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/95 border-b border-purple-600/60">
          <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                AlphaStream v90.0
              </h1>
              <p className="text-xl text-cyan-300 mt-2 font-bold">ROCKET HUNTER • NO LIMITS • PAPER TRADING</p>
            </div>
            <div className="text-right">
              <span className="px-10 py-5 rounded-full text-3xl font-black bg-gradient-to-r from-amber-500 to-orange-600 shadow-2xl shadow-orange-500/50">
                {data.mode || "PAPER"} MODE
              </span>
            </div>
          </div>
        </header>

        <main className="pt-40 px-6">
          <div className="max-w-7xl mx-auto space-y-12">

            {/* Big Title */}
            <div className="text-center">
              <h2 className="text-7xl md:text-9xl font-black bg-gradient-to-r from-red-500 via-yellow-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                EXPLOSIVE MODE ACTIVE
              </h2>
              <p className="text-3xl text-pink-300 mt-4">Hunting 100–500% runners</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-cyan-500/60 hover:scale-105 transition">
                <DollarSign className="w-20 h-20 mx-auto text-cyan-400 mb-4" />
                <p className="text-5xl font-black text-cyan-300">{equity}</p>
                <p className="text-gray-300 text-xl">Equity</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-green-500/60 hover:scale-105 transition">
                <TrendingUp className="w-20 h-20 mx-auto text-green-400 mb-4" />
                <p className={`text-5xl font-black ${unrealized.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                  {unrealized}
                </p>
                <p className="text-gray-300 text-xl">Unrealized P&L</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-orange-500/60 hover:scale-110 transition cursor-pointer"
                   onClick={() => alert("Live positions coming soon — stay tuned!")}>
                <Swords className="w-20 h-20 mx-auto text-orange-400 mb-4" />
                <p className="text-5xl font-black text-orange-300">{positions}</p>
                <p className="text-gray-300 text-xl">Active Rockets</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border-2 border-purple-500/60 hover:scale-105 transition">
                <Rocket className="w-20 h-20 mx-auto text-purple-400 mb-4 animate-bounce" />
                <p className="text-5xl font-black text-purple-300">{rockets.length}</p>
                <p className="text-gray-300 text-xl">Rockets Detected</p>
              </div>
            </div>

            {/* ROCKETS DETECTED */}
            {rockets.length > 0 && (
              <div className="bg-black/40 backdrop-blur-2xl rounded-3xl p-12 border-4 border-yellow-500/80 shadow-2xl shadow-yellow-600/40">
                <h3 className="text-6xl font-black text-yellow-400 mb-10 text-center flex items-center justify-center gap-8">
                  <Flame className="w-20 h-20 animate-pulse" />
                  ROCKETS INCOMING
                  <Flame className="w-20 h-20 animate-pulse" />
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                  {rockets.map((r: string, i: number) => {
                    const [sym, pct] = r.split('+');
                    const change = parseFloat(pct);
                    return (
                      <div key={i} className={`rounded-3xl p-8 text-center transform hover:scale-110 transition-all
                        ${change >= 100 ? 'bg-gradient-to-br from-red-600 to-orange-600' : 'bg-black/70 border-2 border-orange-600'}`}>
                        <p className="text-5xl font-black text-white drop-shadow-lg">{sym}</p>
                        <p className={`text-4xl font-bold mt-3 ${change >= 100 ? 'text-yellow-300' : 'text-green-400'}`}>
                          +{pct}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FORCE SCAN BUTTON */}
            <div className="text-center">
              <button
                onClick={triggerScan}
                disabled={scanning}
                className="px-64 py-20 text-7xl font-black rounded-3xl bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 hover:from-red-500 hover:via-orange-500 hover:to-yellow-500 disabled:opacity-60 transition-all shadow-2xl flex items-center gap-12 mx-auto border-8 border-yellow-400"
              >
                <RefreshCw className={`w-24 h-24 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? "HUNTING..." : "FORCE ROCKET SCAN"}
              </button>
              <p className="text-3xl text-cyan-300 mt-10">
                Last scan: <span className="font-bold text-yellow-400">{lastScan || "Never"}</span>
              </p>
            </div>

            {/* Footer */}
            <div className="text-center py-12">
              <p className="text-2xl text-pink-300">No rules. No limits. Just 300%+ runners.</p>
              <p className="text-5xl mt-6 animate-pulse">ROCKETSFUEL</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
