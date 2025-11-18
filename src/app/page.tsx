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
      } catch (e) {
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
      alert('SCAN TRIGGERED — LETS GOOO');
    } catch (e) {
      alert('Failed — check FORWARD_SECRET');
    }
    setScanning(false);
  };

  return (
    <div className="space-y-8">
      {/* Hero Status Card */}
      <div className="glass card-glow p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${status.status === 'LIVE' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {status.status === 'LIVE' ? (
              <Activity className="w-12 h-12 text-green-500 pulse-glow" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-red-500" />
            )}
          </div>
        </div>

        <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {status.bot || 'AlphaStream v24'}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-lg font-bold">
          <div>Status: <span className={status.status === 'LIVE' ? 'text-green-500' : 'text-red-500'}>{status.status}</span></div>
          <div>Positions: <span className="text-purple-600">{status.positions || 0}/{status.max_pos || 3}</span></div>
          <div>Mode: <span className={status.dry_mode ? 'text-yellow-500' : 'text-green-500'}>{status.dry_mode ? 'DRY' : 'LIVE'}</span></div>
          <div>Uptime: <span className="text-cyan-500">99.9%</span></div>
        </div>

        {status.dry_mode && (
          <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl">
            <strong>DRY MODE ACTIVE</strong> — Set live keys to go full send
          </div>
        )}
      </div>

      {/* Trigger Button */}
      <div className="flex justify-center">
        <button
          onClick={trigger}
          disabled={scanning || status.dry_mode}
          className="group relative px-12 py-8 text-2xl font-black text-white rounded-3xl overflow-hidden transition-all duration-500 disabled:opacity-50"
          style={{
            background: scanning ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #8b5cf6, #ec4899)',
          }}
        >
          <span className="relative z-10 flex items-center gap-4">
            {scanning ? 'SCANNING...' : 'MANUAL SCAN'}
            <Rocket className="w-8 h-8 group-hover:translate-x-2 transition" />
          </span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        </button>
      </div>
    </div>
  );
}
