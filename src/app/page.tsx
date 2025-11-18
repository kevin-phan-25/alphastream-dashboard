'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [status, setStatus] = useState<any>({ status: 'loading', dry_mode: true });
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BOT_URL}/`);
        setStatus(res.data);
      } catch (e) {
        setStatus({ status: 'offline', dry_mode: true });
      }
    };
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, []);

  const trigger = async () => {
    setScanning(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BOT_URL}/`, { secret: process.env.NEXT_PUBLIC_FORWARD_SECRET });
      alert('Scan triggered!');
    } catch (e) {
      alert('Failed – check FORWARD_SECRET');
    }
    setScanning(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Bot Status</h2>
        <div className="grid grid-cols-2 gap-4 text-lg">
          <div>Status: <span className={status.status === 'LIVE' ? 'text-green-500' : 'text-red-500'}>{status.status || 'OFFLINE'}</span></div>
          <div>Positions: {status.positions || 0}/{status.max_pos || 3}</div>
          <div>Bot: {status.bot || 'AlphaStream v24'}</div>
          <div>{status.dry_mode && <span className="text-yellow-500 font-bold">DRY MODE</span>}</div>
        </div>
      </div>

      <button
        onClick={trigger}
        disabled={scanning || status.dry_mode}
        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 shadow-lg"
      >
        {scanning ? 'Scanning...' : 'MANUAL SCAN TRIGGER'}
      </button>
    </div>
  );
}
