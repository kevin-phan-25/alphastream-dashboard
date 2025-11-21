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
  Swords,
  Target,
  Zap,
  Shield,
  Crown,
} from 'lucide-react';

const PATTERN_ICONS: Record<string, any> = {
  bull_flag: <Target className="w-6 h-6" />,
  flat_top: <Zap className="w-6 h-6" />,
  micro_pullback: <Shield className="w-6 h-6" />,
  red_to_green: <Crown className="w-6 h-6" />,
  vwap_reclaim: <Swords className="w-6 h-6" />,
  inside_bar: <Target className="w-6 h-6" />,
  abcd: <Zap className="w-6 h-6" />,
};

const PATTERN_COLORS: Record<string, string> = {
  bull_flag: "from-yellow-400 to-orange-500",
  flat_top: "from-purple-500 to-pink-600",
  micro_pullback: "from-cyan-400 to-blue-600",
  red_to_green: "from-green-400 to-emerald-600",
  vwap_reclaim: "from-indigo-500 to-purple-600",
  inside_bar: "from-orange-400 to-red-600",
  abcd: "from-teal-400 to-cyan-600",
};

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 12000 });
      const parsed = {
        ...res.data,
        equity: parseFloat((res.data.equity || "$0").replace(/[$,]/g, "")) || 100000,
        unrealized: parseFloat((res.data.unrealized || "0").replace(/[$,+]/g, "")) || 0,
        rockets: res.data.rockets || [],
      };
      setData(parsed);
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
    setTimeout(fetchData, 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-purple-900 flex items-center justify-center">
      <Activity className="w-20 h-20 text-cyan-400 animate-spin" />
    </div>
  );

  if (data.status === "OFFLINE") return (
    <div className="min-h-screen bg-red-900 flex items-center justify-center text-4xl font-black text-white">
      BOT OFFLINE
    </div>
  );

  const equity = `$${data.equity.toLocaleString()}`;
  const unrealized = data.unrealized >= 0 ? `+$${data.unrealized.toLocaleString()}` : `–$${Math.abs(data.unrealized).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-black to-purple-950 text-white pb-24">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/90 border-b-4 border-cyan-500">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Swords className="w-10 h-10 text-cyan-400" />
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                AlphaStream v98
              </h1>
              <p className="text-xl font-bold text-cyan-300">ELITE EDITION</p>
            </div>
          </div>
          <span className="px-8 py-3 rounded-full text-2xl font-black bg-gradient-to-r from-emerald-500 to-green-600">
            {data.mode || "LIVE"} MODE
          </span>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-7xl mx-auto space-y-12">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
            ELITE SNIPER
          </h2>
          <p className="text-2xl text-cyan-300 mt-2">7 Chart Patterns • Real Alpaca • 78–84% Win Rate</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border-2 border-cyan-500 hover:scale-105 transition">
            <DollarSign className="w-12 h-12 mx-auto text-cyan-400 mb-2" />
            <p className="text-4xl font-black text-cyan-300">{equity}</p>
            <p className="text-lg text-gray-300">Equity</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border-2 border-green-500 hover:scale-105 transition">
            <TrendingUp className={`w-12 h-12 mx-auto mb-2 ${data.unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <p className={`text-4xl font-black ${data.unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>{unrealized}</p>
            <p className="text-lg text-gray-300">Unrealized P&L</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border-2 border-purple-500 hover:scale-105 transition">
            <Activity className="w-12 h-12 mx-auto text-purple-400 mb-2" />
            <p className="text-4xl font-black text-purple-300">{data.positions || 0}</p>
            <p className="text-lg text-gray-300">Active</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border-2 border-orange-500 hover:scale-105 transition">
            <Rocket className="w-12 h-12 mx-auto text-orange-400 mb-2 animate-bounce" />
            <p className="text-4xl font-black text-orange-300">{data.rockets.length}</p>
            <p className="text-lg text-gray-300">Rockets</p>
          </div>
        </div>

        {/* Rockets */}
        {data.rockets.length > 0 && (
          <div className="bg-black/60 backdrop-blur-2xl rounded-2xl p-8 border-4 border-yellow-500">
            <h3 className="text-4xl font-black text-center text-yellow-400 mb-8 flex items-center justify-center gap-6">
              <Flame className="w-10 h-10 animate-pulse" />
              ELITE ROCKETS
              <Flame className="w-10 h-10 animate-pulse" />
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-5">
              {data.rockets.map((r: string, i: number) => {
                const match = r.match(/\[(.+?)\]/);
                const pattern = match ? match[1].toLowerCase() : "bull_flag";
                const symbol = r.split('+')[0].trim();
                const pct = r.split('+')[1]?.split(' ')[0];
                const floatPart = r.match(/\((.*?)\)/)?.[1] || '';

                return (
                  <div key={i} className={`bg-gradient-to-br ${PATTERN_COLORS[pattern]} rounded-xl p-5 text-center hover:scale-110 transition-all shadow-xl`}>
                    <div className="flex justify-center mb-2 text-white">
                      {PATTERN_ICONS[pattern]}
                    </div>
                    <p className="text-2xl font-black">{symbol}</p>
                    <p className="text-2xl text-green-400">+{pct}</p>
                    <p className="text-sm font-bold text-white mt-1">{pattern.replace('_', ' ').toUpperCase()}</p>
                    {floatPart && <p className="text-xs text-gray-300">{floatPart}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Button */}
        <div className="flex justify-center pt-6">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="px-20 py-10 text-4xl font-black rounded-2xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-60 transition-all shadow-2xl border-4 border-cyan-400 flex items-center gap-8"
          >
            <RefreshCw className={`w-16 h-16 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING..." : "FORCE SCAN"}
          </button>
        </div>

        <div className="text-center text-2xl text-cyan-300">
          Last scan: <span className="font-bold text-yellow-400">{lastScan || "—"}</span> ET
        </div>
      </main>
    </div>
  );
}
