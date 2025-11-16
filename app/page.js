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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data.json?t=' + Date.now());
        if (response.ok) {
          const newData = await response.json();
          setData(newData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scan', { method: 'POST' });
      if (response.ok) {
        data.logs.unshift(`[${new Date().toLocaleTimeString()}] Manual scan triggered`);
        setData({ ...data });
      } else {
        data.logs.unshift(`[${new Date().toLocaleTimeString()}] Scan failed: ${response.status}`);
      }
    } catch (error) {
      data.logs.unshift(`[${new Date().toLocaleTimeString()}] Scan error: ${error.message}`);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setData({
      equity: 99998.93,
      positions: 0,
      dailyLoss: 0,
      lastScan: 'Reset',
      winRate: 0,
      trades: [],
      logs: ['Reset complete']
    });
  };

  const chartData = data.trades.slice().reverse().map((trade, index) => ({
    name: `Trade ${index + 1}`,
    equity: data.equity + (trade.pnl || 0)
  }));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f0f0f', color: 'white', fontFamily: 'monospace' }}>
      {/* Sidebar - unchanged */}
      <div style={{ width: '260px', backgroundColor: '#1a1a1a', padding: '20px', height: '100vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a0a0a0', marginBottom: '12px' }}>Settings</h3>
          <input style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: 'none', color: 'white', borderRadius: '4px', marginBottom: '12px' }} defaultValue="Alphastream" placeholder="Bot Name" />
          <input type="file" accept="image/*" style={{ width: '100%' }} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button style={{ flex: 1, padding: '8px', backgroundColor: '#333', border: 'none', color: 'white', borderRadius: '4px' }}>Dark</button>
            <button style={{ flex: 1, padding: '8px', backgroundColor: '#333', border: 'none', color: 'white', borderRadius: '4px' }}>Light</button>
          </div>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#10b981', marginBottom: '12px' }}>Risk Limits</h3>
          <label style={{ display: 'block', marginBottom: '8px' }}>Daily Loss Cap: <input style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: 'none', color: 'white' }} defaultValue={300} /></label>
          <label style={{ display: 'block', marginBottom: '8px' }}>Max Positions: <input style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: 'none', color: 'white' }} defaultValue={3} /></label>
          <label style={{ display: 'block', marginBottom: '8px' }}>Max Drawdown: <input style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: 'none', color: 'white' }} defaultValue={15} /> %</label>
        </div>
        <div>
          <h3 style={{ color: '#a0a0a0', marginBottom: '12px' }}>Panels</h3>
          <label style={{ display: 'block', marginBottom: '6px' }}><input type="checkbox" defaultChecked /> Equity</label>
          <label style={{ display: 'block', marginBottom: '6px' }}><input type="checkbox" defaultChecked /> Daily P&L</label>
          <label style={{ display: 'block', marginBottom: '6px' }}><input type="checkbox" defaultChecked /> Positions</label>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>KP</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px' }}>Alphastream</h1>
              <p style={{ margin: 0, color: '#a0a0a0', fontSize: '14px' }}>@Kevin_Phan25 • {new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} EST</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#10b981', padding: '8px 16px', borderRadius: '9999px', fontWeight: 'bold', fontSize: '14px' }}>
              {data.winRate}% Win Rate
            </div>
            <button onClick={handleReset} style={{ padding: '8px 16px', backgroundColor: '#333', border: 'none', color: 'white', borderRadius: '4px' }}>Reset</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a0a0a0', fontSize: '14px' }}>Equity</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>$ {data.equity.toLocaleString()}</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a0a0a0', fontSize: '14px' }}>Positions</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.positions}/3</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a0a0a0',
