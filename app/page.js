// app/page.js — Main Dashboard
'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [trades, setTrades] = useState([]);
  const [stats, setStats] = useState({ equity: 25000, positions: 0, dailyLoss: 0 });
  const [status, setStatus] = useState('IDLE');

  useEffect(() => {
    // Poll webhook for updates (or use WebSockets in prod)
    const fetchData = async () => {
      try {
        const res = await fetch('/api/webhook?type=stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          setStatus('LIVE');
        }
      } catch (err) {
        setStatus('OFFLINE');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const winRate = trades.length > 0 ? ((trades.filter(t => t.profit > 0).length / trades.length) * 100).toFixed(1) : 0;

  return (
    <main className="min-h-screen p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-400 mb-2">AlphaStream v18.0</h1>
        <p className="text-slate-300">@Kevin_Phan25 | 75%+ Win Rate | Long-Only Momentum</p>
        <div className="mt-4 text-xl">Status: <span className={status === 'LIVE' ? 'text-green-400' : 'text-red-400'}>{status}</span></div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-slate-400">Equity</h3>
          <p className="text-2xl font-bold">${stats.equity?.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-slate-400">Positions</h3>
          <p className="text-2xl font-bold">{stats.positions}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-slate-400">Daily Loss</h3>
          <p className={`text-2xl font-bold ${stats.dailyLoss > 0 ? 'text-red-400' : 'text-green-400'}`}>${stats.dailyLoss}</p>
        </div>
      </div>

      {/* Win Rate */}
      <div className="bg-slate-800 p-6 rounded-lg mb-8">
        <h3 className="text-xl font-bold mb-2">Win Rate</h3>
        <div className="w-full bg-slate-700 rounded-full h-4">
          <div className="bg-green-500 h-4 rounded-full" style={{ width: `${winRate}%` }}></div>
        </div>
        <p className="text-center mt-2">{winRate}% ({trades.length} trades)</p>
      </div>

      {/* Trades Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <h3 className="p-4 bg-slate-700 font-bold">Recent Trades</h3>
        <table className="trades-table">
          <thead>
            <tr className="bg-slate-700">
              <th className="p-3 text-left">Symbol</th>
              <th className="p-3 text-left">Entry</th>
              <th className="p-3 text-left">Exit</th>
              <th className="p-3 text-left">P&L</th>
              <th className="p-3 text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, i) => (
              <tr key={i} className="trades-row">
                <td className="p-3">{trade.symbol}</td>
                <td className="p-3">${trade.entry}</td>
                <td className="p-3">${trade.exit}</td>
                <td className={`p-3 font-bold ${trade.profit > 0 ? 'win' : 'loss'}`}>${trade.profit.toFixed(2)}</td>
                <td className="p-3">{new Date(trade.time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
