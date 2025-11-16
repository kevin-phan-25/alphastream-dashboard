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
  const [loading, setLoading] = useState(false);

  // Poll public/data.json every 10 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/data.json?t=' + Date.now());
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Manual Scan → POST to /api/scan (optional endpoint)
  const handleScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const time = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
      if (res.ok) {
        setData(prev => ({
          ...prev,
          logs: [`[${time}] Manual scan triggered`, ...prev.logs].slice(0, 50)
        }));
      } else {
        setData(prev => ({
          ...prev,
          logs: [`[${time}] Scan failed: ${res.status}`, ...prev.logs].slice(0, 50)
        }));
      }
    } catch (err) {
      const time = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
      setData(prev => ({
        ...prev,
        logs: [`[${time}] Scan error: ${err.message}`, ...prev.logs].slice(0, 50)
      }));
    }
    setLoading(false);
  };

  // Reset dashboard state
  const handleReset = () => {
    setData({
      equity: 99998.93,
      positions: 0,
      dailyLoss: 0,
      lastScan: 'Reset',
      winRate: 0,
      trades: [],
      logs: ['Dashboard reset']
    });
  };

  // Equity curve data for Recharts
  const chartData = data.trades
    .slice()
    .reverse()
    .reduce((acc, trade, i) => {
      const prevEquity = acc.length ? acc[acc.length - 1].equity : data.equity;
      acc.push({
        name: `T${i + 1}`,
        equity: prevEquity + (trade.pnl || 0)
      });
      return acc;
    }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f0f0f', color: '#e5e7eb', fontFamily: 'monospace' }}>
      {/* ────── SIDEBAR ────── */}
      <div style={{ width: '260px', backgroundColor: '#1a1a1a', padding: '20px', height: '100vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a0a0a0', marginBottom: '12px' }}>Settings</h3>
          <input
            style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: 'none', color: 'white', borderRadius: '4px', marginBottom: '12px' }}
            defaultValue="Alphastream"
            placeholder="Bot Name"
          />
          <input type="file" accept="image/*" style={{ width: '100%' }} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button style={{ flex: 1, padding: '8px', backgroundColor: '#333', border: 'none', color: 'white', borderRadius: '4px' }}>Dark</button>
            <button style={{ flex: 1, padding: '8px', backgroundColor: '#333', border: 'none', color: 'white', borderRadius: '4px' }}>Light</button>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#10b981', marginBottom: '12px' }}>Risk Limits</h3>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Daily Loss Cap: <input style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: 'none', color: 'white' }} defaultValue={300} />
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Max Positions: <input style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: 'none', color: 'white' }} defaultValue={3} />
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Max Drawdown: <input style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: 'none', color: 'white' }} defaultValue={15} /> %
          </label>
        </div>

        <div>
          <h3 style={{ color: '#a0a0a0', marginBottom: '12px' }}>Panels</h3>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input type="checkbox" defaultChecked /> Equity Curve
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input type="checkbox" defaultChecked /> Live Activity
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input type="checkbox" defaultChecked /> Trade Log
          </label>
        </div>
      </div>

      {/* ────── MAIN CONTENT ────── */}
      <div style={{ flex: 1, padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>AlphaStream Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleScan}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: loading ? '#555' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Scanning...' : 'Scan Now'}
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              KP
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#a0a0a0', fontSize: '14px' }}>Equity</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>${data.equity.toFixed(2)}</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#a0a0a0', fontSize: '14px' }}>Positions</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{data.positions}/3</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#a0a0a0', fontSize: '14px' }}>Daily Loss</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: data.dailyLoss > 250 ? '#ef4444' : 'inherit' }}>
              ${data.dailyLoss.toFixed(2)} / $300
            </div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#a0a0a0', fontSize: '14px' }}>Win Rate</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{data.winRate}%</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#a0a0a0', fontSize: '14px' }}>Last Scan</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{data.lastScan}</div>
          </div>
        </div>

        {/* Equity Curve */}
        <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px', marginBottom: '24px', height: '300px' }}>
          <h3 style={{ marginBottom: '16px', color: '#10b981' }}>Equity Curve</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.length ? chartData : [{ name: 'Start', equity: data.equity }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#a0a0a0" />
              <YAxis stroke="#a0a0a0" />
              <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
              <Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Live Activity */}
        <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '16px', color: '#10b981' }}>Live Activity</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '14px' }}>
            {data.logs.map((log, i) => (
              <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #333' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
