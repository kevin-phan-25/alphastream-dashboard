'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, X, Zap, Flame, DollarSign, TrendingUp, Swords, Activity, AlertTriangle, AlertCircle } from 'lucide-react';

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
  }, [BOT_URL]);

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

  const equity = data.equity || "$0";
  const unrealized = data.unrealized || "$0";
  const dailyPnL = data.dailyPnL || "$0";
  const positions = data.positions || 0;
  const rockets = data.rockets || [];
  const maxLoss = data.maxLoss || "$500";
  const status = data.status || "RUNNING";

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white pb-32">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/90 border-b border-purple-600/50">
          <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AlphaStream v87.5
              </h1>
              <p className="text-lg text-purple-300 mt-1">PROP-FIRM READY • ZERO LEAKS</p>
            </div>
            <div className="text-right">
              <span className={`px-8 py-4 rounded-full text-2xl font-black ${data.mode === "LIVE" ? "bg-green-600 shadow-green-500/50" : "bg-amber-600 shadow-amber-500/50"} shadow-2xl`}>
                {data.mode || "PAPER"} MODE
              </span>
            </div>
          </div>
        </header>

        <main className="pt-36 px-6">
          <div className="max-w-7xl mx-auto space-y-12">

            {/* Title */}
            <div className="text-center">
              <h2 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                ELITE SCANNER ACTIVE
              </h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-cyan-500/40 hover:scale-105 transition">
                <DollarSign className="w-16 h-16 mx-auto text-cyan-400 mb-4" />
                <p className="text-4xl font-black text-cyan-300">{equity}</p>
                <p className="text-gray-300 text-lg">Equity</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-green-500/40 hover:scale-105 transition">
                <TrendingUp className="w-16 h-16 mx-auto text-green-400 mb-4" />
                <p className={`text-4xl font-black ${unrealized.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                  {unrealized}
                </p>
                <p className="text-gray-300 text-lg">Unrealized</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-purple-500/40 hover:scale-105 transition">
                <Activity className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                <p className={`text-4xl font-black ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                  {dailyPnL}
                </p>
                <p className="text-gray-300 text-lg">Daily P&L</p>
              </div>

              <div
                onClick={() => setShowPositions(true)}
                className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-orange-500/40 cursor-pointer hover:scale-110 transition"
              >
                <Swords className="w-16 h-16 mx-auto text-orange-400 mb-4" />
                <p className="text-4xl font-black text-orange-300">{positions}/5</p>
                <p className="text-gray-300 text-lg">Positions</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-red-500/40 hover:scale-105 transition">
                <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
                <p className="text-4xl font-black text-red-300">-{maxLoss}</p>
                <p className="text-gray-300 text-lg">Max Loss</p>
              </div>
            </div>

            {/* Status Banner */}
            {status.includes("HALTED") && (
              <div className="bg-red-900/80 backdrop-blur-xl rounded-3xl p-8 text-center border-4 border-red-600 animate-pulse">
                <h3 className="text-5xl font-black text-red-400">TRADING HALTED — DAILY LOSS LIMIT HIT</h3>
              </div>
            )}

            {/* Rockets */}
            {rockets.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border-2 border-yellow-500/60 shadow-2xl shadow-yellow-500/20">
                <h3 className="text-4xl font-black text-yellow-400 mb-8 text-center flex items-center justify-center gap-6">
                  <Flame className="w-14 h-14 animate-pulse" /> 
                  LATEST ROCKETS DETECTED 
                  <Flame className="w-14 h-14 animate-pulse" />
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {rockets.map((r: string, i: number) => (
                    <div key={i} className="bg-black/70 rounded-2xl p-8 text-center border-2 border-orange-600/80 hover:border-orange-400 transition">
                      <p className="text-5xl font-black text-orange-400">{r.split('+')[0]}</p>
                      <p className="text-3xl font-bold text-green-400 mt-2">+{r.split('+')[1]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Force Scan */}
            <div className="text-center">
              <button
                onClick={triggerScan}
                disabled={scanning || status.includes("HALTED")}
                className="px-48 py-16 text-6xl font-black rounded-3xl bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl flex items-center gap-10 mx-auto"
              >
                <RefreshCw className={`w-20 h-20 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? "SCANNING..." : "FORCE ROCKET SCAN"}
              </button>
              <p className="text-2xl text-purple-300 mt-8">
                Last manual scan: <span className="font-bold text-cyan-300">{lastScan || "Never"}</span>
              </p>
              <p className="text-xl text-gray-400 mt-2">
                Scanner: <span className="font-bold text-yellow-300">{data.scanner || "WAITING"}</span> • Auto-scan every 3 min
              </p>
            </div>

            {/* Rules */}
            <div className="bg-black/50 backdrop-blur-xl rounded-3xl p-10 border border-purple-600/50 text-center">
              <h3 className="text-3xl font-black text-purple-400 mb-6">PROFIT RULES</h3>
              <p className="text-5xl font-black text-cyan-300">{data.rules || "25→50% | 50→75% | 100→ALL | Trail -15%"}</p>
            </div>
          </div>
        </main>

        {/* Positions Modal */}
        {showPositions && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6" onClick={() => setShowPositions(false)}>
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl p-12 max-w-6xl w-full max-h-[90vh] overflow-y-auto border-4 border-purple-600" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-6xl font-black text-purple-400">ACTIVE POSITIONS</h3>
                <button onClick={() => setShowPositions(false)}>
                  <X className="w-14 h-14 text-gray-400 hover:text-white" />
                </button>
              </div>
              <p className="text-center text-4xl text-gray-500 py-20">Detailed positions coming in next update</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
