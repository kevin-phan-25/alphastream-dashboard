'use client';
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Trade {
  symbol: string;
  event: string;
  note: string;
  time: string;
  pnl?: number;
}

export default function Trades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [totalPnl, setTotalPnl] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${process.env.GAS_SHEET_URL}`);
        const rows = res.data.slice(1);
        const parsed = rows
          .filter((row: any[]) => row[1]?.includes('EXIT') || row[1]?.includes('ENTRY'))
          .map((row: any[]) => ({
            symbol: row[2] || '',
            event: row[1] || '',
            note: row[3] || '',
            time: new Date(row[0]).toLocaleString(),
            pnl: row[3]?.includes('+') ? parseFloat(row[3].match(/[\d.]+/)?.[0] || '0') :
                 row[3]?.includes('-') ? -parseFloat(row[3].match(/[\d.]+/)?.[0] || '0') : 0,
          }))
          .reverse();

        setTrades(parsed);
        const pnl = parsed.reduce((sum: number, t: Trade) => sum + (t.pnl || 0), 0);
        setTotalPnl(pnl);
      } catch (e) {
        console.error('GAS fetch failed');
      }
    };
    fetch();
    const id = setInterval(fetch, 15000);
    return () => clearInterval(id);
  }, []);

  const chartData = {
    labels: trades.map(t => t.time.split(',')[1]?.trim() || ''),
    datasets: [
      {
        label: 'PNL ($)',
        data: trades.map((_, i) => trades.slice(0, i + 1).reduce((s, t) => s + (t.pnl || 0), 0)),
        borderColor: totalPnl >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        backgroundColor: totalPnl >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="space-y-8">
      <div className="glass p-8 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-4xl font-black bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
            Trade History & PNL
          </h2>
          <div className={`text-4xl font-black flex items-center gap-3 ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalPnl >= 0 ? <TrendingUp /> : <TrendingDown />}
            ${Math.abs(totalPnl).toFixed(2)}
          </div>
        </div>

        <div className="h-80">
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trades.slice(-9).reverse().map((t, i) => (
          <div key={i} className="glass p-6 rounded-2xl hover:scale-105 transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">{t.symbol}</h3>
                <p className="text-sm opacity-70">{t.event}</p>
              </div>
              {t.pnl !== undefined && (
                <span className={`text-2xl font-black ${t.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-xs opacity-60 mt-2">{t.time}</p>
            <p className="text-sm mt-2 opacity-80">{t.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
