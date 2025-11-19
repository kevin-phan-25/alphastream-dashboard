// src/app/page.tsx — FINAL 2025 FUNDING-READY DASHBOARD
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Rocket, RefreshCw } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL?.trim();

  const fetchData = async () => {
    if (!BOT_URL) return setLoading(false);
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      setData(res.data);
    } catch {
      console.log("Bot not reachable yet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, [BOT_URL]);

  const triggerScan = async () => {
    if (!BOT_URL) return;
    setScanning(true);
    try { await axios.post(`${BOT_URL}/manual/scan`); }
    finally { setScanning(false); setTimeout(fetchData, 800); }
  };

  const isLive = data.status === "ONLINE" && !data.dry_mode;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-5xl font-black text-purple-400 animate-pulse">AlphaStream v30.0</div>
      </div>
    );
  }

  if (!data.status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 to-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-6">BOT OFFLINE</div>
          <code className="bg-white/10 px-6 py-3 rounded-xl text-lg">{BOT_URL || "Set NEXT_PUBLIC_BOT_URL"}</code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg animate-pulse" />
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AlphaStream v30.0
            </h1>
          </div>
          <div className="text-2xl font-bold text-cyan-400 tracking-wider">ELITE AUTONOMOUS</div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-16">

          {/* Title */}
          <h2 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            AlphaStream v30.0 — Elite Mode
          </h2>

          {/* Status Circle */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64 rounded-full bg-gradient-to-r from-green-500/30 to-cyan-500/30 border-8 border-green-400 shadow-2xl shadow-green-500/50 flex items-center justify-center animate-pulse">
              <Activity className="w-32 h-32 text-green-400" />
              <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />
            </div>
          </div>

          {/* Stats Grid — EQUITY NOW PERFECTLY FITS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "STATUS", value: isLive ? "LIVE" : "DRY", color: isLive ? "text-green-400" : "text-yellow-400" },
              { label: "POSITIONS", value: `${data.positions || 0}/${data.max_pos || 5}`, color: "text-purple-400" },
              { label: "EQUITY", value: data.equity || "$0.00", color: "text-cyan-400", big: true },
              { label: "DAILY P&L", value: data.dailyPnL || "0.00%", color: data.dailyPnL?.includes('-') ? "text-red-400" : "text-green-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:border-white/40 transition-all"
              >
                <p className="text-gray-400 text-sm font-medium tracking-wider">{s.label}</p>
                <p className={`font-black mt-3 ${s.big ? 'text-3xl md:text-4xl break-all' : 'text-3xl md:text-4xl' } ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Manual Scan */}
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="group relative px-32 py-16 text-5xl md:text-6xl font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:to-red-700 transition-all shadow-2xl disabled:opacity-60"
          >
            <span className="relative z-10 flex items-center gap-8 justify-center">
              {scanning ? (
                <>SCANNING <RefreshCw className="w-16 h-16 animate-spin" /></>
              ) : (
                <>MANUAL SCAN <Rocket className="w-16 h-16 group-hover:rotate-45 transition duration-300" /></>
              )}
            </span>
          </button>

          <div className="text-gray-400 text-lg">
            Last update: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </main>
    </div>
  );
}
