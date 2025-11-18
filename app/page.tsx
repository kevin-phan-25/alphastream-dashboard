'use client';  // Client-side for hooks

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [botStatus, setBotStatus] = useState({ status: 'loading', dry_mode: false, positions: 0, bot: '' });
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BOT_URL}/`);
        setBotStatus(res.data);
      } catch (err) {
        setBotStatus({ status: 'error' });
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerScan = async () => {
    setScanning(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BOT_URL}/`, { secret: process.env.FORWARD_SECRET });
      alert('Scan triggered!');
    } catch (err) {
      alert('Trigger failed');
    }
    setScanning(false);
  };

  return (
    <main className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">{botStatus.bot || 'AlphaStream Dashboard'}</h1>
      <div className="bg-blue-600 text-white p-4 rounded mb-4">
        Status: <span className={botStatus.status === 'LIVE' ? 'text-green-300' : 'text-red-300'}>{botStatus.status}</span>
        | Positions: {botStatus.positions}/{botStatus.max_pos || 3}
        {botStatus.dry_mode && <span className="ml-2 bg-yellow-200 text-yellow-800 px-2 py-1 rounded">DRY MODE</span>}
      </div>
      <button
        onClick={triggerScan}
        disabled={scanning || botStatus.dry_mode}
        className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {scanning ? 'Scanning...' : 'Manual Scan'}
      </button>
      {botStatus.dry_mode && <p className="mt-2 text-yellow-600">Dry Mode: Set env vars for live trading.</p>}
    </main>
  );
}
