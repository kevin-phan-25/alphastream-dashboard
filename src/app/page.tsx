// src/app/page.tsx — FIXED: Responsive sizes + clean design
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, Rocket, RefreshCw } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL?.trim();

  const fetchData = async () => {
    if (!BOT_URL) {
      setError(true);
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      setData(res.data);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, [BOT_URL]);

  const triggerScan = async () => {
    if (!BOT_URL) return;
    setScanning(true);
    try {
      await axios.post(`${BOT_URL}/manual/scan`);
      setTimeout(fetchData, 1000);
    } catch {
      console.error("Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const isLive = data.status === "ONLINE" && !data.dry_mode;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-3xl font-bold animate-pulse">Loading AlphaStream v29.0...</div>
      </div>
    );
  }

  if (error || !BOT_URL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 to-black flex items-center justify-center text-white text-center p-8">
        <div>
          <AlertTriangle className="w-24 h-24 mx-auto mb-6 text-red-500" />
          <h1 className="text-4xl font-bold mb-6">BOT OFFLINE</h1>
          <code className="bg-white/10 px-6 py-3 rounded-xl text-lg break-all">
            {BOT_URL || "NEXT_PUBLIC_BOT_URL missing"}
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center space-y-12">

        {/* Title */}
        <div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-4">
            {data.bot || "AlphaStream v29.0"}
          </h1>
          <p className="text-xl text-gray-400">{data.version || "v29.0"}</p>
        </div>

        {/* Status Circle */}
        <div className="flex justify-center">
          <div className={`relative w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center border-8 shadow-2xl animate-pulse
            ${isLive ? 'bg-green-500/30 border-green-400' : data.dry_mode ? 'bg-yellow-500/30 border-yellow-400' : 'bg-red-500/30 border-red-400'}
          `}>
            {isLive ? <Activity className="w-20 h-20 sm:w-24 sm:h-24 text-green-400" /> : <AlertTriangle className="w-20 h-20 sm:w-24 sm:h-24 text-yellow-400" />}
            <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
          {[
            { label: "STATUS", value: isLive ? "LIVE" : data.dry_mode ? "DRY" : "OFFLINE", color: isLive ? "text-green-400" : "text-yellow-400" },
            { label: "POSITIONS", value: `${data.positions || 0}/${data.max_pos || 3}`, color: "text-purple-400" },
            { label: "EQUITY", value: data.equity || "$0.00", color: "text-cyan-400" },
            { label: "DAILY P&L", value: data.dailyPnL || "0.00%", color: data.dailyPnL?.includes('-') ? "text-red-400" : "text-green-400" },
          ].map((stat) => (
            <div key={stat.label} className="p-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:border-white/30 transition-all">
              <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
              <p className={`text-3xl sm:text-4xl font-black mt-2 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* DRY Warning */}
        {data.dry_mode && (
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500 rounded-2xl p-8 text-center backdrop-blur-xl">
            <strong className="text-3xl sm:text-4xl font-black text-yellow-400 mb-4 block">DRY MODE ACTIVE</strong>
            <p className="text-xl sm:text-2xl">Set <code className="bg-black/50 px-4 py-2 rounded">DRY_MODE=false</code> in Cloud Run → Go LIVE</p>
          </div>
        )}

        {/* Manual Scan Button */}
        <div className="text-center">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="relative px-20 py-12 text-4xl sm:text-5xl font-black rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 disabled:opacity-50 group"
            style={{
              background: scanning
                ? 'linear-gradient(90deg, #f97316, #ef4444)'
                : 'linear-gradient(90deg, #a855f7, #ec4899, #f43f5e)'
            }}
          >
            <span className="relative z-10 flex items-center gap-6 justify-center">
              {scanning ? (
                <>SCANNING <RefreshCw className="w-12 h-12 sm:w-16 sm:h-16 animate-spin" /></>
              ) : (
                <>MANUAL SCAN <Rocket className="w-12 h-12 sm:w-16 sm:h-16 group-hover:rotate-45 transition" /></>
              )}
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-lg">
          Last update: {lastUpdate} | Bot: {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : "—" }
        </div>
      </div>
    </div>
  );
}
