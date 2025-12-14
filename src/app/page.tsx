'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  RefreshCw,
  Zap,
  Brain,
  TrendingUp,
  Shield,
  PlusCircle,
  Trash2
} from 'lucide-react';

const CORE_URL =
  process.env.NEXT_PUBLIC_CORE_URL ||
  'https://alphastream-core-1017433009054.us-east1.run.app';

const ML_URL =
  process.env.NEXT_PUBLIC_ML_URL ||
  'https://alphastream-ml-1017433009054.us-east1.run.app';

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [symbolsInput, setSymbolsInput] = useState('');
  const [killSwitch, setKillSwitch] = useState(false);
  const [maxDrawdown, setMaxDrawdown] = useState(8);

  /* ================= FETCH ================= */
  const fetchData = async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        axios.get(CORE_URL),
        axios.get(ML_URL)
      ]);
      setCore(cRes.data);
      setML(mRes.data);
    } catch (e) {
      console.error('Fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  /* ================= ACTIONS ================= */
  const forceScan = () => axios.post(`${CORE_URL}/scan`);

  const addSymbols = async () => {
    const symbols = symbolsInput
      .split(/[\s,]+/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    if (!symbols.length) return;

    await axios.post(`${CORE_URL}/watchlist/add`, { symbols });
    setSymbolsInput('');
    fetchData();
  };

  const clearDaily = async () => {
    await axios.post(`${CORE_URL}/watchlist/clear`);
    fetchData();
  };

  const updateRiskControls = async () => {
    await axios.post(`${CORE_URL}/config/update`, {
      killSwitch,
      maxDrawdown
    });
    fetchData();
  };

  /* ================= UI ================= */
  if (loading || !core)
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center text-2xl">
        Loading AlphaStream…
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-gray-300 p-6">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6">
        AlphaStream Control Center
      </h1>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Stat title="Equity" value={`$${Number(core.equity).toLocaleString()}`} />
        <Stat title="Positions" value={`${core.positions.length}/5`} />
        <Stat title="ML Memory" value={`${ml.trackedSymbols || 0}`} />
        <Stat
          title="Kill Switch"
          value={killSwitch ? 'ARMED' : 'OFF'}
          danger={killSwitch}
        />
      </div>

      {/* ===== MANUAL WATCHLIST ===== */}
      <Section title="Manual Daily Watchlist" icon={<PlusCircle />}>
        <textarea
          value={symbolsInput}
          onChange={e => setSymbolsInput(e.target.value)}
          placeholder="AAPL TSLA NVDA…"
          className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white mb-3"
        />
        <div className="flex gap-3">
          <button onClick={addSymbols} className="btn-green">
            Add Symbols
          </button>
          <button onClick={clearDaily} className="btn-red">
            <Trash2 className="w-4 h-4" /> Clear Daily
          </button>
        </div>
        <div className="text-sm text-gray-400 mt-2">
          Active: {core.dailySymbols?.join(', ') || 'None'}
        </div>
      </Section>

      {/* ===== RISK CONTROLS ===== */}
      <Section title="Risk Controls" icon={<Shield />}>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={killSwitch}
              onChange={e => setKillSwitch(e.target.checked)}
            />
            Kill Switch
          </label>

          <div>
            Max Drawdown %
            <input
              type="number"
              value={maxDrawdown}
              onChange={e => setMaxDrawdown(Number(e.target.value))}
              className="ml-2 w-20 bg-gray-900 border border-gray-700 p-1 rounded"
            />
          </div>

          <button onClick={updateRiskControls} className="btn-yellow">
            Apply
          </button>
        </div>
      </Section>

      {/* ===== ROCKETS ===== */}
      <Section title={`Today's Rockets (${core.rockets.length})`} icon={<Zap />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {core.rockets.map((r: any) => (
            <Card key={r.symbol}>
              <div className="font-bold">{r.symbol}</div>
              <div className="text-yellow-400 text-xl">+{r.gap}%</div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ===== POSITIONS ===== */}
      <Section title="Live Positions" icon={<TrendingUp />}>
        {core.positions.length === 0 ? (
          <Empty text="No open positions" />
        ) : (
          core.positions.map((p: any) => (
            <Card key={p.symbol} row>
              <div>
                <div className="font-bold">{p.symbol} ×{p.qty}</div>
                <div className="text-sm text-gray-400">
                  Entry ${p.entry.toFixed(2)}
                </div>
              </div>
              <div
                className={`text-xl ${
                  p.current > p.entry ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {(((p.current - p.entry) / p.entry) * 100).toFixed(1)}%
              </div>
            </Card>
          ))
        )}
      </Section>

      {/* ===== ML ===== */}
      <Section title="ML Top Symbols" icon={<Brain />}>
        <div className="grid grid-cols-5 gap-3">
          {ml.top?.map((s: any) => (
            <Card key={s[0]}>
              <div className="font-bold">{s[0]}</div>
              <div className="text-purple-400">
                {(s[1].confidence * 100).toFixed(0)}%
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ===== FORCE SCAN ===== */}
      <button
        onClick={forceScan}
        className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-4 px-8 rounded-full flex items-center gap-3 shadow-lg"
      >
        <RefreshCw />
        Force Scan
      </button>
    </div>
  );
}

/* ================= UI HELPERS ================= */
const Stat = ({ title, value, danger = false }: any) => (
  <div className={`bg-gray-900 p-6 rounded border ${danger ? 'border-red-600' : 'border-gray-700'}`}>
    <div className="text-sm text-gray-400">{title}</div>
    <div className={`text-3xl font-bold ${danger ? 'text-red-400' : 'text-white'}`}>
      {value}
    </div>
  </div>
);

const Section = ({ title, icon, children }: any) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
      {icon} {title}
    </h2>
    {children}
  </div>
);

const Card = ({ children, row = false }: any) => (
  <div className={`bg-gray-900 p-4 rounded border border-gray-700 ${row ? 'flex justify-between items-center' : ''}`}>
    {children}
  </div>
);

const Empty = ({ text }: any) => (
  <div className="text-gray-500 text-center py-6">{text}</div>
);
