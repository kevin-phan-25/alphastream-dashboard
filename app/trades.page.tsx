'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

export default function Trades() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    axios.get(process.env.GAS_SHEET_URL!).then(res => {
      const parsed = res.data.slice(1).map(row => ({
        symbol: row[2],
        event: row[1],  // e.g., HEARTBEAT
        note: row[3],
        time: row[0]
      })).filter(t => t.event !== 'HEARTBEAT');  // Filter v24 logs
      setTrades(parsed);
    });
  }, []);

  const chartData = {
    labels: trades.map(t => new Date(t.time).toLocaleDateString()),
    datasets: [{ label: 'Events', data: trades.map(() => 1), borderColor: 'blue' }]  // Placeholder; adapt for PNL
  };

  return (
    <main className="p-8">
      <h2 className="text-2xl font-bold mb-4">Trades & Logs</h2>
      <Line data={chartData} />
      <ul className="space-y-2 mt-4">
        {trades.map((t, i) => <li key={i} className="p-2 bg-gray-100 rounded">{t.symbol}: {t.note}</li>)}
      </ul>
    </main>
  );
}
