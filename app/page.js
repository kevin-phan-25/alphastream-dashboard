// app/page.js
'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [state, setState] = useState({
    equity: 99998.93,
    positions: 0,
    dailyLoss: 0,
    lastScan: 'Never',
    winRate: 0,
    trades: [],
    logs: ['Waiting for data...']
  });
  const [loading, setLoading] = useState(false);

  // === SSE REAL-TIME ===
  useEffect(() => {
    const evtSource = new EventSource('/api/sse');
    evtSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        const time = new Date(payload.t).toLocaleTimeString('en-US', { timeZone: 'America/New_York' });

        setState(prev => {
          const logEntry = `[${time}] [${payload.type}] ${payload.data.msg || JSON.stringify(payload.data)}`;
          const newLogs = [logEntry, ...prev.logs].slice(0, 50);

          if (payload.type === 'HEARTBEAT') {
            return { ...prev, equity: payload.data.equity || prev.equity, lastScan: time, logs: newLogs };
          }
          if (payload.type === 'TRADE') {
            const newTrades = [...prev.trades, payload.data];
            const wins = newTrades.filter(t => t.pnl > 0).length;
            const winRate = newTrades.length ? ((wins / newTrades.length) * 100).toFixed(1) : 0;
            return { ...prev, positions: prev.positions + 1, trades: newTrades, winRate, logs: newLogs };
          }
          if (['PING', 'SCANNER', 'INIT'].includes(payload.type)) {
            return { ...prev, logs: newLogs };
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
      setState(prev => ({
        ...prev,
        logs: [`[${time}] ${res.ok ? 'Manual scan triggered' : 'Scan failed'}`, ...prev.logs].slice(0, 50)
      }));
    } catch {
      setState(prev => ({
        ...prev,
        logs: [`[${new Date().toLocaleTimeString()}] Scan error`, ...prev.logs].slice(0, 50)
      }));
    }
    setLoading(false);
  };

  const handleReset = () => {
    setState({
      equity: 99998.93,
      positions: 0,
      dailyLoss: 0,
      lastScan: 'Never',
      winRate: 0,
      trades: [],
      logs: ['Dashboard reset']
    });
  };

  const chartData = state.trades.length > 0
    ? state.trades.slice().reverse().map((t, i) => ({ name: `T${i + 1}`, equity: state.equity + (t.pnl || 0) }))
    : [{ name: 'Start', equity: state.equity }];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f0f0f', color: 'white', fontFamily: 'monospace' }}>
      {/* SIDEBAR */}
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
          <label style={{ display: 'block', marginBottom: '6px' }}><input type="checkbox" defaultChecked /> Equity Curve</label>
          <label style={{ display: 'block', marginBottom: '6px' }}><input type="checkbox" defaultChecked /> Live Activity</label>
          <label style={{ display: 'block', marginBottom: '6px' }}><input type="checkbox" defaultChecked /> Trade Log</label>
        </div>
      </div>

      {/* MAIN CONTENT */}
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
              {state.winRate}% Win Rate
            </div>
            <button onClick={handleScan} disabled={loading} style={{ padding: '8px 16px', backgroundColor: loading ? '#555' : '#10b981', color: 'white', border: 'none', borderRadius: '6px' }}>
              {loading ? 'Scanning...' : 'Scan Now'}
            </button>
            <button onClick={handleReset} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px' }}>Reset</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a0a0a0', fontSize: '14px' }}>Equity</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${state.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a0a0a0', fontSize: '14px' }}>Positions</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{state.positions}/3</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a0a0a0', fontSize: '14px' }}>Daily Loss</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${state.dailyLoss.toFixed(2)} / $300</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a0a0a0', fontSize: '14px' }}>Last Scan</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{state.lastScan}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px', marginBottom: '20px', height: '300px' }}>
          <h3 style={{ color: '#10b981', marginBottom: '16px' }}>Equity Curve</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#a0a0a0" />
              <YAxis stroke="#a0a0a0" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
              <Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ color: '#10b981', marginBottom: '16px' }}>Live Activity</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '14px' }}>
            {state.logs.map((log, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #333', color: log.includes('failed') ? '#ef4444' : '#e5e7eb' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
