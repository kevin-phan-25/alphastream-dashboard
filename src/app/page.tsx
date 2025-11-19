// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, Rocket, RefreshCw } from 'lucide-react';

interface BotData {
  status?: string;
  mode?: string;
  dry_mode?: boolean;
  positions?: number;
  max_pos?: number;
  equity?: string;
  dailyPnL?: string;
  bot?: string;
  version?: string;
  timestamp?: string;
}

export default function Home() {
  const [data, setData] = useState<BotData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
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
      setLastUpdate(new Date().toLocaleTimeString());
      setError(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error("Bot fetch failed:", msg);
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
      setTimeout(fetchData, 800);
    } catch {
      console.error("Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const isOnline = data.status === "ONLINE";
  const isLive = isOnline && !data.dry_mode;

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center text-white text-4xl font-bold animate-pulse">Connecting...</div>;

  if (error || !BOT_URL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-black flex items-center justify-center text-white text-center p-8">
        <div>
          <AlertTriangle className="w-24 h-24 mx-auto mb-6 text-red-400" />
          <h1 className="text-6xl font-black mb-6">BOT OFFLINE</h1>
          <code className="bg-black/50 px-6 py-3 rounded text-lg break-all">
            {BOT_URL || "NEXT_PUBLIC_BOT_URL missing"}
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 text-white py-20 px-6">
      <div className="max-w-5xl mx-auto text-center">

        {/* Status Circle */}
        <div className="flex justify-center mb-12">
          <div className={`w-48 h-48 rounded-full flex items-center justify-center shadow-2xl border-8 animate-pulse
            ${isLive ? 'bg-green-500/30 border-green-400' : data.dry_mode ? 'bg-yellow-500/30 border-yellow-400' : 'bg-red-500/30 border-red-400'}
          `}>
            {isLive ? <Activity className="w-32 h-32 text-green-400" /> : <AlertTriangle className="w-32 h-32 text-yellow-400" />}
          </div>
        </div>

        <h1 className="text-7xl font-black mb-12 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          {data.bot || "AlphaStream v29.0"}
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {[
            { label: "Status", value: isLive ? "LIVE" : data.dry_mode ? "DRY" : "OFFLINE", color: isLive ? "text-green-400" : "text-yellow-400" },
            { label: "Positions", value: `${data.positions ?? 0}/${data.max_pos ?? 3}`, color: "text-purple-400" },
            { label: "Mode", value: data.mode || (data.dry_mode ? "DRY" : "LIVE"), color: isLive ? "text-green-400" : "text-yellow-400" },
            { label: "Engine", value: data.version || "v29.0", color: "text-cyan-400" },
          ].map((item) => (
            <div key={item.label} className="p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
              <p className="text-gray-400 text-sm">{item.label}</p>
              <p className={`text-4xl font-bold mt-2 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Equity + PnL */}
        <div className="text-7xl font-black mb-4">{data.equity || "$0.00"}</div>
        <div className="text-3xl mb-12">
          Daily P&L:{' '}
          <span className={data.dailyPnL?.startsWith('-') ? 'text-red-400' : 'text-green-400'}>
            {data.dailyPnL || "0.00%"}
          </span>
        </div>

        {/* DRY Warning */}
        {data.dry_mode && (
          <div className="p-8 bg-yellow-500/20 border-2 border-yellow-500 rounded-3xl max-w-3xl mx-auto mb-12">
            <strong className="text-4xl block mb-4">DRY MODE ACTIVE</strong>
            <p className="text-xl">Set <code className="bg-black/50 px-4 py-2 rounded">DRY_MODE=false</code> in Cloud Run → Go LIVE</p>
          </div>
        )}

        {/* Manual Scan Button */}
        <button
          onClick={triggerScan}
          disabled={scanning}
          className="relative px-24 py-12 text-6xl font-black rounded-3xl overflow-hidden shadow-2xl transition-all group disabled:opacity-60"
          style={{ background: scanning ? 'linear-gradient(90deg,#f97316,#ef4444)' : 'linear-gradient(90deg,#a855f7,#ec4899,#f43f5e)' }}
        >
          <span className="relative z-10 flex items-center gap-8 justify-center">
            {scanning ? (
              <>SCANNING... <RefreshCw className="w-16 h-16 animate-spin" /></>
            ) : (
              <>MANUAL SCAN <Rocket className="w-16 h-16 group-hover:rotate-45 transition" /></>
            )}
          </span>
        </button>

        <div className="mt-16 text-gray-400 text-lg">
          Last update: {lastUpdate}
        </div>
      </div>
    </div>
  );
}
