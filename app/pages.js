'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [data, setData] = useState({
    equity: 99998.93,
    positions: 0,
    dailyLoss: 0,
    lastScan: '11:52:29 AM',
    winRate: 0,
    trades: [],
    logs: ['Waiting for data...']
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/data.json?t=' + Date.now());
        const json = await res.json();
        setData(prev => ({
          ...prev,
          ...json.data,
          lastScan: new Date(json.t || Date.now()).toLocaleTimeString(),
          logs: json.type === 'HEARTBEAT' 
            ? [`[${new Date().toLocaleTimeString()}] BOT LIVE`, ...prev.logs.slice(0, 49)]
            : json.type === 'TRADE'
            ? [`BUY ${json.data.symbol} @ $${json.data.entry} ×${json.data.qty}`, ...prev.logs.slice(0, 49)]
            : prev.logs
        }));
      } catch (e) {}
    };
    fetchData();
    const i = setInterval(fetchData, 10000);
    return () => clearInterval(i);
  }, []);

  const chartData = data.trades.map((t, i) => ({
    name: `T${i + 1}`,
    equity: data.equity
  })).reverse();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-mono">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-2xl font-bold">KP</div>
          <div>
            <h1 className="text-2xl font-bold">AlphaStream</h1>
            <p className="text-sm text-gray-400">@Kevin_Phan25 • {new Date().toLocaleTimeString()} EST</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-bold">
            {data.winRate}% Win Rate
          </div>
          <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">Reset</button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Equity</div>
          <div className="text-2xl font-bold">$ {data.equity.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Positions</div>
          <div className="text-2xl font-bold">{data.positions}/3</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Daily Loss</div>
          <div className="text-2xl font-bold">$ {data.dailyLoss}/300</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Last Scan</div>
          <div className="text-2xl font-bold">{data.lastScan}</div>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-green-400">↗</span> Equity Curve
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip contentStyle={{ background: '#1a1a1a', border: 'none' }} />
            <Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Live Activity */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-green-400">↗</span> Live Activity
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.logs.map((log, i) => (
            <div key={i} className="text-sm text-gray-300">{log}</div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 p-6 space-y-6 overflow-y-auto">
        <div>
          <h3 className="text-sm font-bold text-gray-400 mb-2">Settings</h3>
          <input className="w-full bg-gray-700 rounded px-3 py-2 text-sm" defaultValue="AlphaStream" />
          <div className="mt-2 bg-gray-600 h-20 rounded flex items-center justify-center text-gray-400">Avatar</div>
          <div className="flex gap-2 mt-2">
            <button className="flex-1 bg-gray-700 py-2 rounded">Dark</button>
            <button className="flex-1 bg-gray-700 py-2 rounded">Light</button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-teal-400 mb-2">Risk Limits</h3>
          <label className="block text-sm mb-1">Daily Loss Cap <input className="w-full bg-gray-700 rounded px-2 py-1 text-sm" defaultValue={300} /></label>
          <label className="block text-sm mb-1">Max Positions <input className="w-full bg-gray-700 rounded px-2 py-1 text-sm" defaultValue={3} /></label>
          <label className="block text-sm mb-1">Max Drawdown <input className="w-full bg-gray-700 rounded px-2 py-1 text-sm" defaultValue={15} /> %</label>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-400 mb-2">Show Panels</h3>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Equity</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Positions</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Daily Loss</label>
        </div>
      </div>
    </div>
  );
}
