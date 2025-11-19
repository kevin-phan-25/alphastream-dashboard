// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, Rocket, RefreshCw, Zap } from 'lucide-react';

interface BotData {
  status: string;
  mode: string;
  dry_mode: boolean;
  positions: number;
  max_pos: number;
  equity: string;
  dailyPnL: string;
  timestamp: string;
  bot: string;
  version: string;
}

export default function Home() {
  const [data, setData] = useState<BotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [scanning, setScanning] = useState(false);

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL;

  const fetchData = async () => {
    if (!BOT_URL) {
      setError(true);
      setLoading(false);
      return;
    }

    axios.get(BOT_URL, { timeout: 10000 })
      .then(res => {
        setData(res.data);
        setLastUpdate(new Date().toLocaleTimeString());
        setError(false);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [BOT_URL]);

  const triggerScan = async () => {
    setScanning(true);
    try {
      await axios.post(`${BOT_URL}/manual/scan`);
      fetchData();
    } catch {}
    setScanning(false);
  };

  const isLive = data?.status === "ONLINE" && !data?.dry_mode;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-3xl font-bold animate-pulse">Connecting to AlphaStream v29.0...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-black flex items-center justify-center text-white text-center p-8">
        <div>
          <AlertTriangle className="w-24 h-24 mx-auto mb-6 text-red-400" />
          <h1 className="text-5xl font-black mb-4">BOT OFFLINE</h1>
          <p className="text-xl">Check Cloud Run URL:</p>
          <code className="bg-black/50 px-4 py-2 rounded mt-2 text-lg">{BOT_URL || "NEXT_PUBLIC_BOT_URL not set"}</code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-6 py-20 max-w-5xl">

        {/* Status Circle */}
        <div className="flex justify-center mb-12">
          <div className={`w-48 h-48 rounded-full flex items-center justify-center shadow-2xl border-8 ${isLive ? 'bg-green-500/30 border-green-400' : 'bg-yellow-500/30 border-yellow-400'} animate-pulse`}>
            {isLive ? (
              <Activity className="w-32 h-32 text-green-500" />
            ) : (
              <AlertTriangle className="w-32 h-32 text-yellow-400" />
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center text-7xl font-black mb-12 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
          {data.bot || "AlphaStream"}
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-12">
          <div className="p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
            <p className="text-gray-400 text-sm">Status</p>
            <p className={`text-4xl font-bold mt-2 ${isLive ? 'text-green-400' : 'text-yellow-400'}`}>
              {isLive ? "ONLINE" : "DRY MODE"}
            </p>
          </div>
          <div className="p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
            <p className="text-gray-400 text-sm">Positions</p>
            <p className="text-4xl font-bold mt-2 text-purple-400">
              {data.positions}/{data.max_pos || 3}
            </p>
          </div>
          <div className="p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
            <p className="text-gray-400 text-sm">Mode</p>
            <p className={`text-4xl font-bold mt-2 ${isLive ? 'text-green-400' : 'text-yellow-400'}`}>
              {data.mode || (data.dry_mode ? "DRY" : "LIVE")}
            </p>
          </div>
          <div className="p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
            <p className="text-gray-400 text-sm">Engine</p>
            <p className="text-4xl font-bold mt-2 text-cyan-400">
              {data.version || "v29.0"}
            </p>
          </div>
        </div>

        {/* Equity + PnL */}
        <div className="text-center mb-12">
          <div className="text-6xl font-black mb-4">
            {data.equity || "$0.00"}
          </div>
          <div className="text-3xl">
            Daily P&L:{' '}
            <span className={data.dailyPnL?.startsWith('-') ? 'text-red-400' : 'text-green-400'}>
              {data.dailyPnL || "0.00%"}
            </span>
          </div>
        </div>

        {/* DRY Warning */}
        {data.dry_mode && (
          <div className="text-center p-6 bg-yellow-500/20 border-2 border-yellow-500 rounded-3xl max-w-2xl mx-auto mb-12">
            <strong className="text-3xl">DRY MODE ACTIVE</strong>
            <p className="mt-3 text-xl">Set <code className="bg-black/50 px-3 py-1 rounded">DRY_MODE=false</code> in Cloud Run to go LIVE</p>
          </div>
        )}

        {/* Manual Scan Button */}
        <div className="text-center">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="group relative px-20 py-10 text-5xl font-black text-white rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 disabled:opacity-70"
            style={{
              background: scanning
                ? 'linear-gradient(90deg, #f97316, #ef4444)'
                : 'linear-gradient(90deg, #a855f7, #ec4899, #f43f5e)'
            }}
          >
            <span className="relative z-10 flex items-center gap-8">
              {scanning ? (
                <>SCANNING <RefreshCw className="w-16 h-16 animate-spin" /></>
              ) : (
                <>MANUAL SCAN <Rocket className="w-16 h-16 group-hover:rotate-45 transition" /></>
              )}
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-400">
          Last update: {lastUpdate} | Bot time: {new Date(data.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
