'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Activity, AlertTriangle, Rocket } from 'lucide-react';

export default function Home() {
  const [status, setStatus] = useState<any>({
    status: 'loading',
    mode: 'DRY',
    dry_mode: true,
    positions: 0,
    max_pos: 3,
    bot: 'AlphaStream',
    version: 'v29.0',
    equity: '$25,000.00',
    dailyPnL: '0.00%'
  });
  const [scanning, setScanning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL;

  const fetchStatus = async () => {
    if (!BOT_URL) {
      setStatus({ ...status, status: 'ERROR', mode: 'CONFIG' });
      return;
    }

    try {
      const res = await axios.get(`${BOT_URL}/`, { timeout: 10000 });
      const data = res.data;

      // FIXED: Always set status from data, fallback if missing
      const newStatus = {
        status: data.status || 'OFFLINE',
        mode: data.mode || (data.dry_mode ? 'DRY' : 'LIVE'),
        dry_mode: data.dry_mode !== false, // ← FIXED: Default to true if missing
        positions: data.positions || 0,
        max_pos: data.max_pos || 3,
        bot: data.bot || 'AlphaStream',
        version: data.version || 'v29.0',
        equity: data.equity || '$25,000.00',
        dailyPnL: data.dailyPnL || '0.00%'
      };

      setStatus(newStatus);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e) {
      console.log("Fetch error:", e.message);
      setStatus({ ...status, status: 'OFFLINE' });
    }
  };

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 15000);
    return () => clearInterval(id);
  }, [BOT_URL]);

  const triggerScan = async () => {
    setScanning(true);
    try {
      await axios.post(`${BOT_URL}/manual/scan`);
      fetchStatus(); // Refresh immediately
    } catch (e) {
      alert('Scan failed — check console');
    }
    setScanning(false);
  };

  const isLive = status.status === "ONLINE" && !status.dry_mode;

  return (
    <div className="space-y-10">
      <div className="glass card-glow p-10 text-center">
        <div className="flex justify-center mb-8">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center ${isLive ? 'bg-green-500/20' : status.dry_mode ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
            {isLive ? (
              <Activity className="w-16 h-16 text-green-500 pulse-glow" />
            ) : status.dry_mode ? (
              <Zap className="w-16 h-16 text-yellow-500" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-red-500" />
            )}
          </div>
        </div>

        <h2 className="text-5xl font-black mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
          {status.bot}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xl font-bold">
          <div>Status: <span className={isLive ? 'text-green-500' : status.dry_mode ? 'text-yellow-500' : 'text-red-500'}>{status.status}</span></div>
          <div>Positions: <span className="text-purple-600">{status.positions}/{status.max_pos}</span></div>
          <div>Mode: <span className={isLive ? 'text-green-500' : status.dry_mode ? 'text-yellow-500' : 'text-red-500'}>{status.mode}</span></div>
          <div>Engine: <span className="text-cyan-500">{status.version}</span></div>
        </div>

        <div className="mt-6 text-2xl font-bold">
          Equity: <span className="text-green-400">{status.equity}</span> | 
          Daily P&L: <span className={status.dailyPnL?.includes('-') ? 'text-red-400' : 'text-green-400'}>{status.dailyPnL}</span>
        </div>

        {status.dry_mode && (
          <div className="mt-8 p-6 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl">
            <strong>DRY MODE ACTIVE</strong> — Set DRY_MODE=false in Cloud Run to go LIVE
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={triggerScan}
          disabled={scanning || status.dry_mode}
          className="group relative px-16 py-10 text-3xl font-black text-white rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 disabled:opacity-50"
          style={{ background: scanning ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'linear-gradient(90deg, #a855f7, #ec4899)' }}
        >
          <span className="relative z-10 flex items-center gap-6">
            {scanning ? 'SCANNING...' : 'MANUAL SCAN'}
            <Rocket className="w-12 h-12 group-hover:rotate-12 transition" />
          </span>
          <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
        </button>
      </div>
    </div>
  );
}
