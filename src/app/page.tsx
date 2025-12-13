'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Brain,
  Zap,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || 'http://localhost:8080';
const ML_URL = process.env.NEXT_PUBLIC_ML_URL;

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchCore = async () => {
    const res = await axios.get(CORE_URL);
    setData(res.data);
  };

  const fetchML = async () => {
    if (!ML_URL) return;
    try {
      const res = await axios.get(`${ML_URL}/insights`);
      setML(res.data);
    } catch {}
  };

  const forceScan = async () => {
    setLoading(true);
    await axios.post(`${CORE_URL}/scan`);
    setTimeout(() => {
      fetchCore();
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    fetchCore();
    fetchML();
    const i1 = setInterval(fetchCore, 5000);
    const i2 = setInterval(fetchML, 15000);
    return () => {
      clearInterval(i1);
      clearInterval(i2);
    };
  }, []);

  if (!data) return <div className="p-6 text-gray-400">Loading…</div>;

  return (
    <main className="p-4 text-xs bg-black text-gray-200 min-h-screen space-y-3">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-sm font-bold text-cyan-400">AlphaStream</h1>
          <div className="text-gray-500">{data.status}</div>
        </div>

        <button
          onClick={forceScan}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-black"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Force Scan
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Equity" value={`$${data.equity}`} />
        <Stat label="Peak" value={`$${data.peakEquity}`} />
        <Stat label="Drawdown" value={data.drawdown} />
        <Stat label="Positions" value={`${data.positionsOpen}/${data.maxPositions}`} />
      </div>

      {/* CHART + ML */}
      <div className="grid grid-cols-2 gap-2">

        {/* MINI CHART */}
        <Panel title="Equity Trend" icon={<TrendingUp className="w-3 h-3" />}>
          <MiniChart points={data.equityHistory || []} />
        </Panel>

        {/* ML INSIGHTS */}
        <Panel title="Live ML Brain" icon={<Brain className="w-3 h-3" />}>
          {ml ? (
            <div className="grid grid-cols-2 gap-1">
              <Item label="Gap %" value={`${ml.gapThreshold}`} />
              <Item label="Risk %" value={`${(ml.riskMultiplier * 100).toFixed(2)}`} />
              <Item label="Trail %" value={`${(ml.trailPct * 100).toFixed(1)}`} />
              <Item label="Heal" value={ml.healMode ? 'ON' : 'OFF'} />
              <div className="col-span-2 text-gray-500">
                Step {ml.trainingStep?.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Waiting for ML…</div>
          )}
        </Panel>
      </div>

      {/* ROCKETS */}
      <Panel title="Rockets" icon={<Zap className="w-3 h-3" />}>
        <div className="flex flex-wrap gap-1">
          {data.rockets.map((r: string) => (
            <span
              key={r}
              className="px-2 py-0.5 bg-gray-800 rounded"
            >
              {r}
            </span>
          ))}
        </div>
      </Panel>

      {/* LOGS */}
      <Panel title="Logs">
        <div className="font-mono space-y-0.5 max-h-48 overflow-y-auto">
          {data.logs.map((l: string, i: number) => (
            <div key={i} className="text-gray-500">{l}</div>
          ))}
        </div>
      </Panel>

    </main>
  );
}

/* ---------- UI HELPERS ---------- */

function Stat({ label, value }: any) {
  return (
    <div className="bg-gray-900 rounded p-2 text-center">
      <div className="text-gray-500">{label}</div>
      <div className="font-bold text-cyan-400">{value}</div>
    </div>
  );
}

function Panel({ title, icon, children }: any) {
  return (
    <div className="bg-gray-900 rounded p-2 border border-gray-800">
      <div className="flex items-center gap-1 mb-1 text-cyan-400 font-bold">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function Item({ label, value }: any) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{' '}
      <span className="text-cyan-400">{value}</span>
    </div>
  );
}

function MiniChart({ points }: { points: number[] }) {
  if (!points || points.length < 2) {
    return <div className="text-gray-600">No data</div>;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 100;
    const y = 100 - ((p - min) / range) * 100;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-full h-16">
      <path
        d={path}
        fill="none"
        stroke="cyan"
        strokeWidth="2"
      />
    </svg>
  );
}
