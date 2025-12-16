'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });

type Rocket = { symbol: string; gap: string; price: string; rvol: string; volume: string; mlPriority: boolean; mlAction: number; };
type Position = { symbol: string; qty: string; avg_entry_price: string; current: string; unrealized_plpc: string; };

export default function Home() {
  const [rockets, setRockets] = useState<Rocket[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [equity, setEquity] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/dashboard');
      setEquity(data.equity);
      setRockets(data.rockets);
      setPositions(data.positions);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 15000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">AlphaStream Dashboard</h1>
      <p>Equity: ${equity.toFixed(2)}</p>
      {loading && <Loader2 className="animate-spin" />}

      <h2 className="text-xl mt-4 font-semibold">Positions</h2>
      <table className="table-auto border-collapse border border-gray-400 w-full">
        <thead>
          <tr>
            <th className="border px-2 py-1">Symbol</th>
            <th className="border px-2 py-1">Qty</th>
            <th className="border px-2 py-1">Entry</th>
            <th className="border px-2 py-1">Current</th>
            <th className="border px-2 py-1">Unrealized %</th>
          </tr>
        </thead>
        <tbody>
          {positions.map(pos => (
            <tr key={pos.symbol}>
              <td className="border px-2 py-1">{pos.symbol}</td>
              <td className="border px-2 py-1">{pos.qty}</td>
              <td className="border px-2 py-1">{pos.avg_entry_price}</td>
              <td className="border px-2 py-1">{pos.current}</td>
              <td className={`border px-2 py-1 ${parseFloat(pos.unrealized_plpc) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pos.unrealized_plpc}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl mt-4 font-semibold">Rockets</h2>
      <table className="table-auto border-collapse border border-gray-400 w-full">
        <thead>
          <tr>
            <th className="border px-2 py-1">Symbol</th>
            <th className="border px-2 py-1">Gap %</th>
            <th className="border px-2 py-1">Price</th>
            <th className="border px-2 py-1">RVOL</th>
            <th className="border px-2 py-1">Volume</th>
            <th className="border px-2 py-1">AI Priority</th>
            <th className="border px-2 py-1">AI Action</th>
          </tr>
        </thead>
        <tbody>
          {rockets.map(r => (
            <tr key={r.symbol}>
              <td className="border px-2 py-1">{r.symbol}</td>
              <td className="border px-2 py-1">{r.gap}</td>
              <td className="border px-2 py-1">{r.price}</td>
              <td className="border px-2 py-1">{r.rvol}</td>
              <td className="border px-2 py-1">{r.volume}</td>
              <td className={`border px-2 py-1 ${r.mlPriority ? 'text-green-500' : 'text-gray-500'}`}>{r.mlPriority ? 'YES' : 'NO'}</td>
              <td className="border px-2 py-1">{r.mlAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
