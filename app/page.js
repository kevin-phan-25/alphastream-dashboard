'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState({ open: 0, pnl: '+0', trades: 0, winRate: 0 });
  const [equity, setEquity] = useState([]);
  const [lastUpdate, setLastUpdate] = useState('Never');

  useEffect(() => {
    const es = new EventSource('/api/sse');
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'SCAN') setSignals(data.data.signals || []);
      if (data.type === 'STATS') setStats(data.data);
      if (data.type === 'EQUITY') setEquity(data.data);
      setLastUpdate(new Date().toLocaleTimeString());
    };
    es.onerror = () => es.close();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: '#fff' }}>
      {/* Header */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, background: 'linear-gradient(90deg, #00ff88, #00bfff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AlphaStream v4.0
        </h1>
        <p style={{ fontSize: '1.3rem', opacity: 0.8 }}>Real-time Scanner • @Kevin_Phan25 • {lastUpdate}</p>
      </motion.div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', margin: '2rem 0' }}>
        {[
          { label: 'PnL Today', value: stats.pnl || '+0', color: '#00ff88' },
          { label: 'Trades', value: stats.trades || 0, color: '#00bfff' },
          { label: 'Win Rate', value: `${stats.winRate || 0}%`, color: '#ff00ff' },
          { label: 'Open', value: stats.open || 0, color: '#ffaa00' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>{stat.label}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Signals Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <h2 style={{ fontSize: '2rem', margin: '2rem 0 1rem' }}>Live Signals</h2>
        <div style={{ overflowX: 'auto', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                {['SYM', 'PATTERN', 'SCORE', 'QTY', 'STOP', 'TARGET', 'R:R'].map(h => (
                  <th key={h} style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {signals.map((s, i) => (
                  <motion.tr
                    key={s.s + i}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      background: s.score > 0.96 ? 'rgba(0,255,136,0.15)' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <td style={{ padding: '1rem', fontWeight: 800, fontSize: '1.2rem' }}>{s.s}</td>
                    <td><span style={{ background: '#ff00ff', color: '#000', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem' }}>{s.pattern}</span></td>
                    <td>{s.score}</td>
                    <td>{s.qty}</td>
                    <td style={{ color: '#ff4444' }}>${s.stop}</td>
                    <td style={{ color: '#00ff88' }}>${s.tgt}</td>
                    <td style={{ color: '#00ffff' }}>{s.rr}:1</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {signals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
              Waiting for live signals...
            </div>
          )}
        </div>
      </motion.div>

      {/* Equity Curve */}
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
        <h2 style={{ fontSize: '2rem', margin: '3rem 0 1rem' }}>Equity Curve</h2>
        <div style={{ height: '400px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equity.length > 0 ? equity : [{ date: 'Now', equity: 10000 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #00ff88' }} />
              <Line type="monotone" dataKey="equity" stroke="#00ff88" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div style={{ textAlign: 'center', marginTop: '3rem', opacity: 0.6, fontSize: '0.9rem' }}>
        © 2025 @Kevin_Phan25 — Disrupting Warrior Trading • Live on Vercel
      </div>
    </div>
  );
}
