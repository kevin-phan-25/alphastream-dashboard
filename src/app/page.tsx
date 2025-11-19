// src/app/page.tsx — 2025 MODERN DASHBOARD (works with your index.js)
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, Rocket, RefreshCw, Zap } from 'lucide-react';

interface BotData {
  bot?: string;
  version?: string;
  status?: string;
  mode?: string;
  dry_mode?: boolean;
  positions?: number;
  max_pos?: number;
  equity?: string;
  dailyPnL?: string;
  timestamp?: string;
  api?: string;
  key_type?: string;
}

export default function Home() {
  const [data, setData] = useState<BotData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scanning, setScanning] =-useState(false);

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL?.trim();

  const fetchData = async () => {
    if (!BOT_URL) return setError(true);
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      setData(res.data);
      setError(false);
    } catch {
      setError(true);
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
    if (!BOT_URL) return;
    setScanning(true);
    try {
      await axios.post(`${BOT_URL}/manual/scan`);
      setTimeout(fetchData, 1000);
    } catch {}
    setScanning(false);
  };

  const isLive = data.status === "ONLINE" && !data.dry_mode;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-4xl font-bold text-purple-400 animate-pulse">Loading AlphaStream v29.0...</div>
      </div>
    );
  }

  if (error || !BOT_URL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 to-black flex items-center justify-center text-white p-8">
        <div className="text-center">
          <AlertTriangle className="w-32 h-32 mx-auto mb-8 text-red-500" />
          <h1 className="text-7xl font-black mb-6">BOT OFFLINE</h1>
          <code className="bg-white/10 px-6 py-4 rounded-xl text-xl break-all">
            {BOT_URL || "NEXT_PUBLIC_BOT_URL missing in Vercel"}
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      <div className="absolute inset-0 bg-grid-white/5" />

      <div className="relative z-10 container mx-auto px-6 py-24">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
            {data.bot || "AlphaStream v29.0"}
          </h1>
          <p className="text-3xl mt-4 text-gray-400">{data.version || "v29.0"}</p>
        </div>

        {/* Main Status Circle */}
        <div className="flex justify-center mb-20">
          <div className={`relative w-80 h-80 rounded-full flex items-center justify-center
            ${isLive ? 'bg-green-500/20 border-8 border-green-500 shadow-2xl shadow-green-500/50' : 'bg-yellow-500/20 border-8 border-yellow-500 shadow-2xl shadow-yellow-500/50'}
            animate-pulse`}>
            {isLive ? (
              <Activity className="w-48 h-48 text-green-400" />
            ) : (
              <Zap className="w-48 h-48 text-yellow-400" />
            )}
            <div className="absolute inset-0 rounded-full border-4 border-white/10 animate-ping" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-20">
          {[
            { label: "STATUS", value: isLive ? "LIVE" : "DRY MODE", color: isLive ? "text-green-400" : "text-yellow-400" },
            { label: "POSITIONS", value: `${data.positions || 0}/${data.max_pos || 3}`, color: "text-purple-400" },
            { label: "EQUITY", value: data.equity || "$0.00", color: "text-cyan-400 text-4xl font-black" },
            { label: "DAILY P&L", value: data.dailyPnL || "0.00%", color: data.dailyPnL?.includes('-') ? "text-red-400" : "text-green-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/30 transition-all hover:scale-105">
              <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
              <p className={`text-5xl font-black mt-4 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* DRY Mode Banner */}
        {data.dry_mode && (
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500 rounded-3xl p-10 text-center backdrop-blur-xl">
            <h2 className="text-5xl font-black text-yellow-400 mb-4">DRY MODE ACTIVE</h2>
            <p className="text-2xl">Bot is running on <strong>Paper Trading</strong> — Set <code className="bg-black/50 px-4 py-2 rounded">DRY_MODE=false</code> in Cloud Run to go LIVE</p>
          </div>
        )}

        {/* Manual Scan Button */}
        <div className="text-center mt-20">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="group relative px-32 py-16 text-7xl font-black rounded-full overflow-hidden shadow-2xl transition-all duration-500 disabled:opacity-70"
            style={{
              background: scanning
                ? 'linear-gradient(90deg, #f97316, #ef4444)'
                : 'linear-gradient(90deg, #a855f7, #ec4899, #f43f5e)'
            }}
          >
            <span className="relative z-10 flex items-center gap-10 justify-center">
              {scanning ? (
                <>SCANNING <RefreshCw className="w-20 h-20 animate-spin" /></>
              ) : (
                <>MANUAL SCAN <Rocket className="w-20 h-20 group-hover:rotate-45 transition duration-300" /></>
              )}
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-20 text-gray-500 text-lg">
          Last update: {new Date().toLocaleTimeString()} | Bot: {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : "—"}
        </div>
      </div>
    </div>
  );
}
