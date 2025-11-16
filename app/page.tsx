'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [logs, setLogs] = useState<any[]>([]);
  const [equity, setEquity] = useState(25000);
  const [positions, setPositions] = useState(0);
  const [lastScan, setLastScan] = useState('Never');
  const [isConnected, setIsConnected] = useState(false);
  const [pnlData, setPnlData] = useState<{time: string; equity: number}[]>([]);

  useEffect(() => {
    const evtSource = new EventSource('/api/sse');
    evtSource.onopen = () => setIsConnected(true);
    evtSource.onmessage = (e) => {
      const log = JSON.parse(e.data);
      setLogs(prev => [log, ...prev].slice(0, 100));

      if (log.type === 'HEARTBEAT') {
        setEquity(log.data.equity || equity);
        setPnlData(prev => [...prev, { time: new Date(log.t).toLocaleTimeString(), equity: log.data.equity }].slice(-50));
      }
      if (log.type === 'SCANNER') setLastScan(new Date(log.t).toLocaleTimeString());
      if (log.type === 'TRADE') setPositions(prev => prev + 1);
    };
    evtSource.onerror = () => { setIsConnected(false); evtSource.close(); };

    return () => evtSource.close();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-mono">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-green-400">AlphaStream v22.0</h1>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded text-sm ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
            <span className="text-gray-400">Last Scan: {lastScan}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400">Equity</div>
            <div className="text-2xl font-bold">${equity.toLocaleString()}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400">Positions</div>
            <div className="text-2xl font-bold">{positions}/2</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400">Win Rate</div>
            <div className="text-2xl font-bold">—</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400">Daily P&L</div>
            <div className="text-2xl font-bold">$0.00</div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-bold mb-3 text-green-400">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={pnlData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
              <Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-bold mb-3 text-green-400">Live Activity</h3>
          <div className="max-h-80 overflow-y-auto font-mono text-sm">
            {logs.length === 0 && <div className="text-gray-500">Waiting for data...</div>}
            {logs.map((log, i) => (
              <div key={i} className="py-1 border-b border-gray-700 flex gap-3">
                <span className="text-gray-500">{new Date(log.t).toLocaleTimeString()}</span>
                <span className="text-yellow-400">[{log.type}]</span>
                <span>{log.data.msg || JSON.stringify(log.data).slice(0, 80)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
