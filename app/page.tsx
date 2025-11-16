// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Log {
  type: string;
  data: any;
  t: string;
}

interface Trade {
  symbol: string;
  entry: number;
  qty: number;
  pnl?: number;
}

export default function Home() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [equity, setEquity] = useState(99998.93);
  const [positions, setPositions] = useState(0);
  const [lastScan, setLastScan] = useState('Never');
  const [isConnected, setIsConnected] = useState(false);
  const [pnlData, setPnlData] = useState<{ time: string; equity: number }[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  // === SSE REAL-TIME ===
  useEffect(() => {
    const evtSource = new EventSource('/api/sse');

    evtSource.onopen = () => setIsConnected(true);
    evtSource.onmessage = (e) => {
      try {
        const payload: Log = JSON.parse(e.data);
        const time = new Date(payload.t).toLocaleTimeString('en-US', { timeZone: 'America/New_York' });

        setLogs(prev => [{ ...payload, t: time }, ...prev].slice(0, 100));

        if (payload.type === 'HEARTBEAT') {
          setEquity(payload.data.equity || equity);
          setLastScan(time);
          setPnlData(prev => [...prev, { time, equity: payload.data.equity }].slice(-50));
        }
        if (payload.type === 'SCANNER') {
          setLastScan(time);
        }
        if (payload.type === 'TRADE') {
          setPositions(prev => Math.min(prev + 1, 3));
          setTrades(prev => [{
            symbol: payload.data.symbol,
            entry: payload.data.entry,
            qty: payload.data.qty
          }, ...prev]);
        }
        if (payload.type === 'EXIT') {
          setPositions(prev => Math.max(0, prev - 1));
          setTrades(prev => prev.map(t =>
            t.symbol === payload.data.symbol ? { ...t, pnl: payload.data.pnl } : t
          ));
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    evtSource.onerror = () => {
      setIsConnected(false);
      evtSource.close();
    };

    return () => evtSource.close();
  }, []);

  // === MANUAL SCAN ===
  const handleScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const time = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
      setLogs(prev => [{
        type: 'SCAN',
        data: { msg: res.ok ? 'Manual scan triggered' : 'Scan failed' },
        t: time
      }, ...prev]);
    } catch {
      setLogs(prev => [{ type: 'ERROR', data: { msg: 'Scan error' }, t: new Date().toLocaleTimeString() }, ...prev]);
    }
    setLoading(false);
  };

  const winRate = trades.length > 0
    ? ((trades.filter(t => t.pnl && t.pnl > 0).length / trades.filter(t => t.pnl !== undefined).length) * 100).toFixed(1)
    : 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f0f0f', color: '#e5e7eb', fontFamily: 'monospace' }}>
      {/* SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#1a1a1a', padding: '20px', height: '100vh', overflowY: 'auto' }}>
        <h3 style={{ color: '#a0a0a0', marginBottom: '12px' }}>Settings</h3>
        <input style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: 'none', color: 'white', borderRadius: '4px', marginBottom: '12px' }} defaultValue="Alphastream" />
        <input type="file" accept="image/*" style={{ width: '100%', marginBottom: '12px' }} />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button style={{ flex: 1, padding: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}>Dark</button>
          <button style={{ flex: 1, padding: '8px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px' }}>Light</button>
        </div>

        <h3 style={{ color: '#10b981', marginBottom: '12px' }}>Risk Limits</h3>
        <label style={{ display: 'block', marginBottom: '8px' }}>Daily Loss Cap: <input style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: 'none', color: 'white' }} defaultValue={300} /></label>
        <label style={{ display: 'block', marginBottom: '8px' }}>Max Positions: <input style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: 'none', color: 'white' }} defaultValue={3} /></label>
        <label style={{ display: 'block', marginBottom: '8px' }}>Max Drawdown: <input style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: 'none', color: 'white' }} defaultValue={15} /> %</label>

        <h3 style={{ color: '#a0a0a0', marginTop: '24px', marginBottom: '12px' }}>Panels</h3>
        <label style={{ display: 'block', marginBottom: '6px' }}><input type="checkbox" defaultChecked /> Equity Curve</label>
        <label style={{ display: 'block', marginBottom: '6px' }}><input type="checkbox" defaultChecked /> Live Activity</label>
        <label style={{ display: 'block', marginBottom: '6px' }}><input type="checkbox" defaultChecked /> Trade Log</label>
      </div>

      {/* MAIN */}
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
              {winRate}% Win Rate
            </div>
            <button onClick={handleScan} disabled={loading} style={{ padding: '8px 16px', backgroundColor: loading ? '#666' : '#10b981', color: 'white', border: 'none', borderRadius: '6px' }}>
              {loading ? 'Scanning...' : 'Scan Now'}
            </button>
            <button style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px' }}>Reset</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a0a0a0' }}>Equity</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a0a0a0' }}>Positions</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{positions}/3</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a0a0a0' }}>Daily Loss</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>$0.00 / $300</div>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a0a0a0' }}>Last Scan</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{lastScan}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px', marginBottom: '24px', height: '300px' }}>
          <h3 style={{ color: '#10b981', marginBottom: '16px' }}>Equity Curve</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pnlData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#a0a0a0" />
              <YAxis stroke="#a0a0a0" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
              <Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#10b981', marginBottom: '16px' }}>Live Activity</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '14px' }}>
              {logs.length === 0 && <div style={{ color: '#666' }}>Waiting for data...</div>}
              {logs.map((log, i) => (
                <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #333', display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#666', minWidth: '100px' }}>{log.t}</span>
                  <span style={{ color: '#fbbf24' }}>[{log.type}]</span>
                  <span>{log.data.msg || JSON.stringify(log.data).slice(0, 100)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#10b981', marginBottom: '16px' }}>Trade Log</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#333' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Symbol</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Entry</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#666' }}>No trades yet</td></tr>
                  )}
                  {trades.map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #444' }}>
                      <td style={{ padding: '8px' }}>{t.symbol}</td>
                      <td style={{ padding: '8px' }}>${t.entry.toFixed(2)}</td>
                      <td style={{ padding: '8px' }}>{t.qty}</td>
                      <td style={{ padding: '8px', color: t.pnl ? (t.pnl > 0 ? '#10b981' : '#ef4444') : '#666' }}>
                        {t.pnl !== undefined ? `$${t.pnl.toFixed(2)}` : 'Open'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
