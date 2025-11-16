'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [data, setData] = useState({
    equity: 99998.93,
    positions: 0,
    dailyLoss: 0,
    lastScan: 'Never',
    winRate: 0,
    trades: [],
    logs: []
  });
  const [loading, setLoading] = useState(false);

  // === SSE REAL-TIME ===
  useEffect(() => {
    const evtSource = new EventSource('/api/sse');
    
    evtSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        const time = new Date(payload.t).toLocaleTimeString('en-US', { timeZone: 'America/New_York' });

        setData(prev => {
          const newLogs = [`[${time}] [${payload.type}] ${payload.data.msg || JSON.stringify(payload.data)}`, ...prev.logs].slice(0, 50);

          if (payload.type === 'HEARTBEAT') {
            return { ...prev, equity: payload.data.equity || prev.equity, lastScan: time, logs: newLogs };
          }
          if (payload.type === 'TRADE') {
            return { ...prev, positions: prev.positions + 1, logs: newLogs };
          }
          return { ...prev, logs: newLogs };
        });
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    evtSource.onerror = () => evtSource.close();
    return () => evtSource.close();
  }, []);

  // === SCAN NOW ===
  const handleScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const time = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
      setData(prev => ({
        ...prev,
        logs: [`[${time}] ${res.ok ? 'Manual scan triggered' : 'Scan failed'}`, ...prev.logs].slice(0, 50)
      }));
    } catch (err) {
      setData(prev => ({
        ...prev,
        logs: [`[${new Date().toLocaleTimeString()}] Scan error`, ...prev.logs].slice(0, 50)
      }));
    }
    setLoading(false);
  };

  const handleReset = () => {
    setData({
      equity: 99998.93,
      positions: 0,
      dailyLoss: 0,
      lastScan: 'Never',
      winRate: 0,
      trades: [],
      logs: ['Dashboard reset']
    });
  };

  const chartData = data.trades.length > 0
    ? data.trades.slice().reverse().map((t, i) => ({ name: `T${i+1}`, equity: data.equity + (t.pnl || 0) }))
    : [{ name: 'Start', equity: data.equity }];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f0f0f', color: '#e5e7eb', fontFamily: 'monospace' }}>
      {/* SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#1a1a1a', padding: '20px' }}>
        <h3 style={{ color: '#a0a0a0' }}>Settings</h3>
        <input style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: 'none', color: 'white', borderRadius: '4px', marginBottom: '12px' }} defaultValue="Alphastream" />
        <input type="file" accept="image/*" style={{ width: '100%', marginBottom: '12px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ flex: 1, padding: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}>Dark</button>
          <button style={{ flex: 1, padding: '8px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px' }}>Light</button>
        </div>

        <h3 style={{ color: '#10b981', marginTop: '24px' }}>Risk Limits</h3>
        <label style={{ display: 'block', marginBottom: '8px' }}>Daily Loss Cap: <input style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: 'none', color: 'white' }} defaultValue={300} /></label>
        <label style={{ display: 'block', marginBottom: '8px' }}>Max Positions: <input style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: 'none', color: 'white' }} defaultValue={3} /></label>
        <label style={{ display: 'block', marginBottom: '8px' }}>Max Drawdown: <input style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: 'none', color: 'white' }} defaultValue={15} /> %</label>

        <h3 style={{ color: '#a0a0a0', marginTop: '24px' }}>Panels</h3>
        <label><input type="checkbox" defaultChecked /> Equity Curve</label><br/>
        <label><input type="checkbox" defaultChecked /> Live Activity</label><br/>
        <label><input type="checkbox" defaultChecked /> Trade Log</label>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>AlphaStream Dashboard</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleScan} disabled={loading} style={{ padding: '8px 16px', backgroundColor: loading ? '#555' : '#10b981', color: 'white', border: 'none', borderRadius: '6px' }}>
              {loading ? 'Scanning...' : 'Scan Now'}
            </button>
            <button onClick={handleReset} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px' }}>Reset</button>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>KP</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#a0a0a0' }}>Equity</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>${data.equity.toFixed(2)}</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#a0a0a0' }}>Positions</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{data.positions}/3</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#a0a0a0' }}>Daily Loss</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>${data.dailyLoss.toFixed(2)} / $300</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#a0a0a0' }}>Win Rate</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{data.winRate}%</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#a0a0a0' }}>Last Scan</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{data.lastScan}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px', marginBottom: '24px', height: '300px' }}>
          <h3 style={{ color: '#10b981', marginBottom: '16px' }}>Equity Curve</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#a0a0a0" />
              <YAxis stroke="#a0a0a0" />
              <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
              <Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ color: '#10b981', marginBottom: '16px' }}>Live Activity</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '14px' }}>
            {data.logs.length === 0 && <div style={{ color: '#666' }}>Waiting for data...</div>}
            {data.logs.map((log, i) => (
              <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #333' }}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
