'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState({ pnl: '+0', trades: 0, winRate: 0, open: 0 });
  const [lastUpdate, setLastUpdate] = useState('Never');

  useEffect(() => {
    const es = new EventSource('/api/sse');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'SCAN') setSignals(data.data.signals || []);
        if (data.type === 'STATS') setStats(data.data);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (err) {}
    };
    return () => es.close();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <motion.div initial={{ y: -50 }} animate={{ y: 0 }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, background: 'linear-gradient(90deg, #00ff88, #00bfff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AlphaStream v4.0
        </h1>
        <p style={{ fontSize: '1.4rem', opacity: 0.8 }}>Live Scanner • @Kevin_Phan25 • Updated: {lastUpdate}</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', margin: '2rem 0' }}>
        {[
          { label: 'PnL', value: stats.pnl || '+0', color: '#00ff88' },
          { label: 'Trades', value: stats.trades || 0, color: '#00bfff' },
          { label: 'Win Rate', value: `${stats.winRate || 0}%`, color: '#ff00ff' },
          { label: 'Open', value: stats.open || 0, color: '#ffaa00' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>{s.label}</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      <h2 style={{ fontSize: '2.2rem', margin: '2rem 0' }}>Live Signals</h2>
      <div style={{ borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(255,255,255,0.1)' }}>
            <tr>
              {['SYM', 'PATTERN', 'SCORE', 'QTY', 'STOP', 'TGT', 'R:R'].map(h => <th key={h} style={{ padding: '1rem', textAlign: 'left' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {signals.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Waiting for signals...</td></tr>
              ) : (
                signals.map((s, i) => (
                  <motion.tr key={s.s + i} initial={{ x: -200 }} animate={{ x: 0 }} exit={{ x: 200 }}
                    style={{ background: s.score > 0.96 ? 'rgba(0,255,136,0.2)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: 800, fontSize: '1.1rem' }}>{s.s}</td>
                    <td><span style={{ background: '#ff00ff', color: '#000', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>{s.pattern}</span></td>
                    <td>{s.score}</td>
                    <td>{s.qty}</td>
                    <td style={{ color: '#ff4444' }}>${s.stop}</td>
                    <td style={{ color: '#00ff88' }}>${s.tgt}</td>
                    <td style={{ color: '#00ffff' }}>{s.rr}:1</td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.7, fontSize: '0.9rem' }}>
        © 2025 @Kevin_Phan25 — Disrupting Warrior Trading • Live on Vercel
      </div>
    </div>
  );
}
