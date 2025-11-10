'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState({ open: 0, pnl: '+0', trades: 0, winRate: 0 });
  const [equity, setEquity] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.latestData = { signals: [], stats: stats, equity: [] };
    }

    const es = new EventSource('/api/sse');
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'SCAN') setSignals(data.data.signals || []);
      if (data.type === 'STATS') setStats(data.data);
      if (data.type === 'EQUITY') setEquity(data.data);
    };
  }, []);

  return (
    <div style={{ padding: 20, background: '#0f0f0f', color: '#fff', minHeight: '100vh' }}>
      <h1>AlphaStream Dashboard v3.1 LIVE</h1>
      <h2>Real-time Signals</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ background: '#222' }}>
          <th>Sym</th><th>Pattern</th><th>Score</th><th>Qty</th><th>Stop</th><th>Tgt</th><th>R:R</th>
        </tr></thead>
        <tbody>
          {signals.map((s, i) => (
            <tr key={i} style={{ background: s.score > 0.95 ? '#003300' : '#330000' }}>
              <td>{s.s}</td><td>{s.pattern}</td><td>{s.score}</td><td>{s.qty}</td>
              <td>{s.stop}</td><td>{s.tgt}</td><td>{s.rr}:1</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Stats</h2>
      <div>PnL: {stats.pnl} | Trades: {stats.trades} | Win%: {stats.winRate}</div>

      <h2>Equity Curve</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={equity}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="equity" stroke="#00ff00" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
