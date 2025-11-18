'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [status, setStatus] = useState({ status: 'loading' as const, dry_mode: false, positions: 0, bot: '' });
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BOT_URL}/`);
        setStatus(res.data);
      } catch (e) {
        console.error(e);
        setStatus({ status: 'error' as const, dry_mode: true });
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerScan = async () => {
    setScanning(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BOT_URL}/`, { secret: process.env.NEXT_PUBLIC_FORWARD_SECRET });
      alert('Scan triggered! Check logs.');
    } catch (e) {
      alert('Trigger failed – check env vars.');
    }
    setScanning(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Bot Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><strong>Bot:</strong> {status.bot || 'v24 ELITE'}</p>
          <p><strong>Status:</strong> <span className={status.status === 'LIVE' ? 'text-green-600' : 'text-red-600'}>{status.status}</span></p>
          <p><strong>Positions:</strong> {status.positions || 0}/{status.max_pos || 3}</p>
          {status.dry_mode && <p className="text-yellow-600 font-bold col-span-full">⚠️ DRY MODE – Set env vars for live trades</p>}
        </div>
      </div>
      <button
        onClick={triggerScan}
        disabled={scanning || status.dry_mode}
        className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 shadow-lg"
      >
        {scanning ? 'Scanning...' : '🔥 MANUAL SCAN TRIGGER'}
      </button>
    </div>
  );
}
