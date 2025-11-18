'use client';
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title);

export default function Trades() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await axios.get(`${process.env.GAS_SHEET_URL}`);
        const data = res.data.slice(1);
        const parsed = data
          .filter((row: any) => row[1].startsWith('ENTRY') || row[1].startsWith('EXIT'))
          .map((row: any) => ({
            symbol: row[2],
            event: row[1],
            note: row[3],
            time: new Date(row[0]).toLocaleDateString(),
          }));
        setTrades(parsed);
      } catch (e) {
        console.error('GAS fetch failed', e);
      }
    };
    fetchTrades();
  }, []);

  const chartData = {
    labels: trades.map((t) => t.time),
    datasets: [
      {
        label: 'Trade Events',
        data: trades.map(() => Math.random() * 10),  // Placeholder – parse PNL from note
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Trade History</h2>
      <div className="h-64">
        <Line data={chartData} options={{ responsive: true }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trades.slice(-6).map((t, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="font-bold">{t.symbol}</h3>
            <p className="text-sm">{t.event}: {t.note}</p>
            <p className="text-xs text-gray-500">{t.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
