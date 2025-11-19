'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Activity, AlertTriangle, Rocket, RefreshCw } from 'lucide-react';

export default function Home() {
  const [status, setStatus] = useState<any>({
    status: 'OFFLINE',
    mode: 'DRY',
    dry_mode: true,
    positions: 0,
    max_pos: 3,
    bot: 'AlphaStream',
    version: 'v29.0',
    equity: '$25,000.00',
    dailyPnL: '0.00%',
    timestamp: null
  });
  const [scanning, setScanning] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>('Never');

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL;

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${BOT_URL}/`, { timeout: 10000 });
      const data = res.data;

      setStatus({
        status: data.status || 'OFFLINE',
        mode: data.mode || (data.dry_mode ? 'DRY' : 'LIVE'),
        dry_mode: !!data.dry_mode,
        positions: data.positions || 0,
        max_pos: data.max_pos || 3,
        bot: data.bot || 'AlphaStream',
        version: data.version || 'v29.0',
        equity: data.equity || '$0.00',
        dailyPnL: data.dailyPnL || '0.00%',
        timestamp: data.timestamp || null
      });
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e) {
      console.log("Bot unreachable → OFFLINE", e);
      setStatus(prev => ({ ...prev, status: 'OFFLINE' }));
    }
  };

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 8000);
    return () => clearInterval(id);
  }, [BOT_URL]);

  const triggerScan = async () => {
    setScanning(true);
    try {
      await axios.post(`${BOT_URL}/manual/scan`);
      alert('SCAN TRIGGERED — FULL SEND');
      await fetchStatus();
    } catch (e) {
      alert('Bot not responding — check Cloud Run URL');
    }
    setScanning(false);
  };

  const isLive = status.status === "ONLINE" && !status.dry_mode;

  return (
    <div className="space-y-12">
      {/* Status Card */}
      <div className="glass card-glow p-12 rounded-3xl text-center border border-white/20">
        <div className="flex justify-center mb-10">
          <div className={`w-40 h-40 rounded-full flex items-center justify-center shadow-2xl
            ${isLive ? 'bg-green-500/20 border-4 border-green-500/50' : 'bg-red-500/20 border-4 border-red-500/50'}`}>
            {isLive ? (
              <Activity className="w-24 h-24 text-green-500 animate-pulse" />
            ) : (
              <AlertTriangle className="w-24 h-24 text-red-500" />
            )}
          </div>
        </div>

        <h2 className="text-7xl font-black mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
          {status.bot}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-2xl font-bold mb-10">
          <div>Status: <span className={isLive ? 'text-green-500' : 'text-red-500'}>{status.status}</span></div>
          <div>Positions: <span className="text-purple-600">{status.positions}/{status.max_pos}</span></div>
          <div>Mode: <span className={isLive ? 'text-green-500' : 'text-yellow-500'}>{status.mode}</span></div>
          <div>Engine: <span className="text-cyan-400">{status.version}</span></div>
        </div>

        <div className="text-5xl font-black mb-6">
          <span className="text-green-400">{status.equity}</span>
          <span className="text-3xl text-gray-500 ml-6">
            | Daily P&L: <span className={status.dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}>{status.dailyPnL}</span>
          </span>
        </div>

        {status.dry_mode && (
          <div className="mt-10 p-8 bg-yellow-500/20 border-2 border-yellow-500/60 rounded-3xl inline-block text-2xl font-bold">
            DRY MODE ACTIVE — Set <code className="bg-yellow-600/40 px-4 py-2 rounded">DRY_MODE=false</code> in Cloud Run
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          Last update: {lastRefresh} {status.timestamp && `• Bot: ${new Date(status.timestamp).toLocaleTimeString()}`}
        </div>
      </div>

      {/* Manual Scan Button */}
      <div className="flex justify-center">
        <button
          onClick={triggerScan}
          disabled={scanning}
          className="group relative px-20 py-12 text-5xl font-black text-white rounded-3xl overflow-hidden shadow-3xl transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
              <>MANUAL SCAN <Rocket className="w-16 h-16 group-hover:rotate-12 transition" /></>
            )}
          </span>
          <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
        </button>
      </div>
    </div>
  );
}
