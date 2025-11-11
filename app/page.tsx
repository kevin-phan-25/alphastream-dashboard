'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, Zap, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

interface Log {
  type: string;
  data: any;
  t: string;
}

export default function Home() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [equity, setEquity] = useState(25000);
  const [positions, setPositions] = useState(0);
  const [dailyLoss, setDailyLoss] = useState(0);
  const [lastScan, setLastScan] = useState('Never');
  const [pnlData, setPnlData] = useState<{time: string; equity: number}[]>([]);

  useEffect(() => {
    const evtSource = new EventSource('/api/sse');

    evtSource.onmessage = (event) => {
      const log: Log = JSON.parse(event.data);
      setLogs(prev => [log, ...prev].slice(0, 50));

      if (log.type === 'STATS') {
        setEquity(log.data.equity);
        setPositions(log.data.positions);
        setDailyLoss(log.data.dailyLoss);
        setPnlData(prev => [...prev, { time: new Date(log.t).toLocaleTimeString(), equity: log.data.equity }].slice(-30));
      }
      if (log.type === 'SCAN') setLastScan(new Date(log.t).toLocaleTimeString());
      if (log.type === 'TRADE') setPositions(prev => prev + 1);
      if (log.type === 'CLOSED') setPositions(prev => prev - 1);
    };

    evtSource.onerror = () => {
      evtSource.close();
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    return () => evtSource.close();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            AlphaStream v17.0
          </h1>
          <p className="text-xl text-gray-400">@Kevin_Phan25 — LIVE</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Equity</p>
                <p className="text-3xl font-bold">${Number(equity).toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Positions</p>
                <p className="text-3xl font-bold">{positions}/3</p>
              </div>
              <Zap className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Daily Loss</p>
                <p className={`text-3xl font-bold ${dailyLoss > 200 ? 'text-red-500' : 'text-gray-300'}`}>
                  ${dailyLoss.toFixed(0)}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Last Scan</p>
                <p className="text-2xl font-bold">{lastScan}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Equity Chart */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            Equity Curve (Last 30 mins)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pnlData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none' }} />
                <Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Log */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-500" />
            Live Activity Feed
          </h2>
          <div className="font-mono text-sm space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 && (
              <p className="text-gray-500 text-center py-8">Waiting for bot heartbeat...</p>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`p-3 rounded-lg ${
                log.type === 'TRADE' ? 'bg-green-900/30 border border-green-500' :
                log.type === 'CLOSED' ? 'bg-blue-900/30 border border-blue-500' :
                log.type === 'SHUTOFF' ? 'bg-red-900/50 border border-red-500' :
                'bg-gray-700/50'
              }`}>
                <span className="text-gray-400">[{new Date(log.t).toLocaleTimeString()}]</span>{' '}
                <span className="font-bold text-yellow-400">{log.type}</span>{' '}
                {log.data.symbol && <span className="text-green-400">{log.data.symbol}</span>}
                {log.data.msg && <span className="text-gray-300">→ {log.data.msg}</span>}
                {log.data.profit && <span className="text-green-400"> P&L: ${log.data.profit}</span>}
              </div>
            ))}
          </div>
        </div>

        <footer className="text-center mt-10 text-gray-500">
          AlphaStream v17.0 • Running since Nov 11 2025 • Built by @Kevin_Phan25
        </footer>
      </div>
    </div>
  );
}
