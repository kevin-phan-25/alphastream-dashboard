// src/app/page.tsx — FINAL 2025 DASHBOARD (WORKS 100%)
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, Rocket, RefreshCw, Zap } from 'lucide-react';

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
    } catch (err) {
      console.log("Bot offline or unreachable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 8000);
    return () => clearInterval(id);
  }, [BOT_URL]);

  const triggerScan = async () => {
    if (!BOT_URL) return;
    setScanning(true);
    try { await axios.post(`${BOT_URL}/manual/scan`); }
    finally { setScanning(false); setTimeout(fetchData, 1000); }
  };

  const isLive = data.status === "ONLINE" && !data.dry_mode;

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-5xl text-purple-500">Loading...</div>;

  if (!BOT_URL || !data.status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 to-black flex items-center justify-center text-white text-center p-10">
        <div>
          <AlertTriangle className="w-32 h-32 mx-auto mb-8 text-red-500" />
          <h1 className="text-8xl font-black mb-6">BOT OFFLINE</h1>
          <code className="bg-white/10 px-8 py-4 rounded-xl text-xl">
            {BOT_URL || "Set NEXT_PUBLIC_BOT_URL in Vercel"}
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      
      <div className="relative z-10 container mx-auto px-6 py-32 text-center">
        <h1 className="text-9xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
          {data.bot || "AlphaStream v29.0"}
        </h1>

        <div className="flex justify-center mb-20">
          <div className={`w-96 h-96 rounded-full flex items-center justify-center border-12 ${isLive ? 'bg-green-500/20 border-green-400' : 'bg-yellow-500/20 border-yellow-400'} animate-pulse shadow-2xl`}>
            {isLive ? <Activity className="w-64 h-64 text-green-400" /> : <Zap className="w-64 h-64 text-yellow-400" />}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 max-w-5xl mx-auto mb-20">
          {[
            { label: "STATUS", value: isLive ? "LIVE" : "DRY MODE", color: isLive ? "text-green-400" : "text-yellow-400" },
            { label: "POSITIONS", value: `${data.positions || 0}/3`, color: "text-purple-400" },
            { label: "EQUITY", value: data.equity || "$0.00", color: "text-cyan-400 text-6xl font-black" },
            { label: "P&L TODAY", value: data.dailyPnL || "0.00%", color: data.dailyPnL?.includes('-') ? "text-red-400" : "text-green-400" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10">
              <p className="text-gray-400 text-xl">{s.label}</p>
              <p className={`text-6xl font-black mt-4 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {data.dry_mode && (
          <div className="max-w-2xl mx-auto bg-yellow-500/20 border-4 border-yellow-500 rounded-3xl p-10">
            <p className="text-4xl font-black text-yellow-400">DRY MODE ACTIVE</p>
            <p className="text-2xl mt-4">Set DRY_MODE=false in Cloud Run to go LIVE</p>
          </div>
        )}

        <button
          onClick={triggerScan}
          disabled={scanning}
          className="mt-20 px-40 py-20 text-8xl font-black rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-2xl disabled:opacity-50"
        >
          {scanning ? <>SCANNING <RefreshCw className="inline ml-10 w-24 h-24 animate-spin" /></> : <>MANUAL SCAN <Rocket className="inline ml-10 w-24 h-24" /></>}
        </button>
      </div>
    </div>
  );
}
