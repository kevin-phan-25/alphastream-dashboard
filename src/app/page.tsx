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
  tradeHistoryLast5?: any[];
  lastEquityFetch?: string;
  lastScanTime?: string;
  timestamp?: string;
}

export default function Home() {
  const [data, setData] = useState<BotData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scanning, setScanning] = useState(false);

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
      setError(false);
    } catch (err) {
      console.error("Failed to fetch bot data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const triggerScan = async () => {
    if (!BOT_URL) return;
    setScanning(true);
    try {
      await axios.post(`${BOT_URL}/manual/scan`);
      setTimeout(fetchData, 1000); // fetch after scan
    } catch (err) {
      console.error("Manual scan failed:", err);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // refresh every 8s
    return () => clearInterval(interval);
  }, [BOT_URL]);

  const isLive = data.status === "ONLINE" && !data.dry_mode;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-5xl font-black text-purple-400 animate-pulse">
          AlphaStream v30.0
        </div>
      </div>
    );
  }

  // Error / offline state
  if (error || !BOT_URL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 to-black flex items-center justify-center text-white p-8 text-center">
        <div>
          <AlertTriangle className="w-32 h-32 mx-auto mb-8 text-red-500 animate-pulse" />
          <h1 className="text-7xl font-black mb-6">BOT OFFLINE</h1>
          <code className="bg-white/10 px-8 py-4 rounded-xl text-xl break-all font-mono">
            {BOT_URL || "NEXT_PUBLIC_BOT_URL not set"}
          </code>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-pink-900/30" />
      <div className="absolute inset-0 bg-grid-white/5" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <div className="relative z-10 container mx-auto px-6 py-24">
        {/* Title */}
        <div className="text-center mb-16">
          <h1 className="text-9xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
            {data.bot || "AlphaStream v30.0"}
          </h1>
          <p className="text-4xl mt-4 text-gray-400 font-light">{data.version || "v30.0"}</p>
        </div>

        {/* Status Circle */}
        <div className="flex justify-center mb-20">
          <div className={`relative w-96 h-96 rounded-full flex items-center justify-center
            ${isLive ? 'bg-green-500/20 border-12 border-green-400 shadow-2xl shadow-green-500/60' 
                      : 'bg-yellow-500/20 border-12 border-yellow-400 shadow-2xl shadow-yellow-500/60'}
            animate-pulse`}>
            {isLive ? (
              <Activity className="w-64 h-64 text-green-400" />
            ) : (
              <Zap className="w-64 h-64 text-yellow-400" />
            )}
            <div className="absolute inset-0 rounded-full border-8 border-white/20 animate-ping" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 max-w-6xl mx-auto mb-20">
          {[
            { label: "STATUS", value: isLive ? "LIVE" : "DRY MODE", color: isLive ? "text-green-400" : "text-yellow-400" },
            { label: "POSITIONS", value: `${data.positions || 0}/${data.max_pos || 5}`, color: "text-purple-400" },
            { label: "EQUITY", value: data.equity || "$0.00", color: "text-cyan-400 text-5xl font-black" },
            { label: "DAILY P&L", value: data.dailyPnL || "0.00%", color: data.dailyPnL?.includes('-') ? "text-red-400" : "text-green-400" },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 backdrop-blur-2xl rounded-3xl p-10 border border-white/10 hover:border-white/30 transition-all hover:scale-105">
              <p className="text-gray-400 text-lg font-medium">{stat.label}</p>
              <p className={`text-6xl font-black mt-4 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* DRY Mode Warning */}
        {data.dry_mode && (
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border-4 border-yellow-500 rounded-3xl p-12 text-center backdrop-blur-xl">
            <h2 className="text-6xl font-black text-yellow-400 mb-6">DRY MODE ACTIVE</h2>
            <p className="text-3xl">Set <code className="bg-black/60 px-6 py-3 rounded-xl">DRY_MODE=false</code> to go LIVE</p>
          </div>
        )}

        {/* Manual Scan */}
        <div className="text-center mt-24">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="group relative px-40 py-20 text-8xl font-black rounded-full overflow-hidden shadow-3xl transition-all duration-500 disabled:opacity-60"
            style={{
              background: scanning
                ? 'linear-gradient(90deg, #f97316, #ef4444)'
                : 'linear-gradient(90deg, #a855f7, #ec4899, #f43f5e)'
            }}
          >
            <span className="relative z-10 flex items-center gap-12 justify-center">
              {scanning ? (
                <>SCANNING <RefreshCw className="w-24 h-24 animate-spin" /></>
              ) : (
                <>MANUAL SCAN <Rocket className="w-24 h-24 group-hover:rotate-45 transition duration-300" /></>
              )}
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
          </button>
        </div>

        <div className="text-center mt-24 text-gray-500 text-2xl">
          Last equity fetch: {data.lastEquityFetch || "N/A"} | Last scan: {data.lastScanTime || "N/A"}
        </div>

        {/* Last 5 trades */}
        {data.tradeHistoryLast5?.length > 0 && (
          <div className="max-w-4xl mx-auto mt-12 text-gray-300 text-xl">
            <h3 className="text-4xl font-black mb-4">Recent Trade History</h3>
            <ul className="list-disc list-inside">
              {data.tradeHistoryLast5.map((t, idx) => (
                <li key={idx}>
                  {t.timestamp}: {t.action} — {t.positions?.map((p:any) => `${p.symbol}:${p.qty}@${p.entry}`).join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
