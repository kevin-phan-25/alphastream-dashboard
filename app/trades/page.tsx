'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Trades() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    axios.get(process.env.GAS_SHEET_URL!).then(res => {
      const parsed = res.data.slice(1).map((row: any[]) => ({
        event: row[1],
        symbol: row[2],
        note: row[3],
        time: row[0]
      })).filter(l => l.event !== 'HEARTBEAT');
      setLogs(parsed);
    });
  }, []);

  return (
    <main className="p-8">
      <h2 className="text-2xl font-bold mb-4">Logs/Events</h2>
      <ul className="space-y-2">
        {logs.map((l, i) => <li key={i} className="p-3 bg-gray-100 rounded">{l.symbol}: {l.note} ({new Date(l.time).toLocaleString()})</li>)}
      </ul>
    </main>
  );
}
