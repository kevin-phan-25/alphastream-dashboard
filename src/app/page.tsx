'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Activity, AlertTriangle, Rocket } from 'lucide-react';

export default function Home() {
  const [status, setStatus] = useState<any>({ status: 'loading', dry_mode: true });
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BOT_URL}/`);
        setStatus(res.data);
      } catch {
        setStatus({ status: 'OFFLINE', dry_mode: true });
      }
    };
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, []);

  const trigger = async () => {
    setScanning(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BOT_URL}/`, {
        secret: process.env.NEXT_PUBLIC_FORWARD_SECRET
      });
      alert('SCAN TRIGGERED — FULL SEND');
    } catch {
      alert('Check FORWARD_SECRET');
    }
    setScanning(false);
  };

  return (
    <div className="space-y-10">
      <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/50 rounded-3xl shadow-2xl p-10 text-center">
        <div className="flex justify-center mb-8">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center ${status.status === 'LIVE' ? 'bg-green-500/20' : 'bg-red-500/20'} animate-pulse`}>
            {status.status === 'LIVE' ? <Activity className="w-16 h-16 text-green-500" /> : <AlertTriangle className="w-16 h-16 text-red-500" />}
          </div>
        </div>

        <h2 className="text-5xl font-black mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
          {status.bot || 'AlphaStream v24 ELITE'}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xl font-bold">
          <div>Status: <span className={status.status === 'LIVE' ? 'text-green-500' : 'text-red-500'}>{status.status}</span></div>
          <div>Positions: <span className="text-purple-600">{status.positions || 0}/{status.max_pos || 3}</span></div>
          <div>Mode: <span className={status.dry_mode ? 'text-yellow-500' : 'text-green-500'}>{status.dry_mode ? 'DRY' : 'LIVE'}</span></div>
          <div>Engine: <span className="text-cyan-500">v24</span></div>
        </div>

        {status.dry_mode && (
          <div className="mt-8 p-6 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl text-yellow-600 font-bold text-lg">
            DRY MODE ACTIVE — Switch to LIVE for real trades
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={trigger}
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
