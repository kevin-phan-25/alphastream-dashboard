'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [status, setStatus] = useState({ status: 'loading', dry_mode: false });
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BOT_URL}/`);
      setStatus(res.data);
    };
    fetch();
    const int = setInterval(fetch, 30000);
    return () => clearInterval(int);
  }, []);

  const trigger = async () => {
    setScanning(true);
    await axios.post(`${process.env.NEXT_PUBLIC_BOT_URL}/`, { secret: process.env.FORWARD_SECRET });
    setScanning(false);
    alert('Triggered!');
  };

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">{status.bot || 'AlphaStream v24'}</h1>
      <div className="bg-blue-600 p-4 text-white rounded mb-4">
        Status: <span className={status.status === 'LIVE' ? 'text-green-300' : 'text-red-300'}>{status.status}</span>
        | Pos: {status.positions}/{status.max_pos}
        {status.dry_mode && <span className="ml-2 bg-yellow-200 text-yellow-800 px-2 py-1 rounded">DRY MODE</span>}
      </div>
      <button onClick={trigger} disabled={scanning || status.dry_mode} className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:bg-gray-400">
        {scanning ? 'Scanning...' : 'Manual Scan'}
      </button>
    </main>
  );
}
