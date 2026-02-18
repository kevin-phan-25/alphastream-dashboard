'use client';

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import {
  Zap, Activity, Loader2, AlertCircle, DollarSign, Wallet, Globe, Bot,
  TrendingUp, AlertTriangle, Clock, Plus, Minus, Shield, Target, Cpu,
  Network, Gauge, Radio, Trash2, Copy, BarChart3, RefreshCw, Rocket,
  ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Filler, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler, ArcElement);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
type RocketT = {
  symbol: string;
  gap: string;
  price: number | string;
  mlAction: number;
  mlConfidence: number;
};

type PositionT = {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
  marketValue: number;
};

// ─────────────────────────────────────────
// Utils
// ─────────────────────────────────────────
const TICKER_REGEX = /^[A-Z]{1,12}(\.[A-Z0-9]{1,4})?$/;

function validateAndCleanTickers(input: string): string[] {
  return input
    .toUpperCase()
    .replace(/[^A-Z.\s,;\n"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(s => TICKER_REGEX.test(s));
}

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ─────────────────────────────────────────
// ML Hooks
// ─────────────────────────────────────────
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';

const useMLHealth = () => {
  const [health, setHealth] = useState<any>({ ok: false });
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/health`, { timeout: 5000 });
        setHealth(res.data || { ok: false });
      } catch {
        setHealth({ ok: false });
      }
    };
    fetchHealth();
    const i = setInterval(fetchHealth, 30000);
    return () => clearInterval(i);
  }, []);
  return health;
};

const useMLMetrics = () => {
  const [metrics, setMetrics] = useState<any>({});
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/metrics`, { timeout: 5000 });
        setMetrics(res.data || {});
      } catch {
        setMetrics({});
      }
    };
    fetchMetrics();
    const i = setInterval(fetchMetrics, 30000);
    return () => clearInterval(i);
  }, []);
  return metrics;
};

// ─────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────
export default function Dashboard() {
  const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';

  const [core, setCore] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState('');
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [panicClosing, setPanicClosing] = useState(false);
  const [panicMessage, setPanicMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [globalPositionSize, setGlobalPositionSize] = useState<number>(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [tickerInput, setTickerInput] = useState('');

  const mlHealth = useMLHealth();
  const mlMetrics = useMLMetrics();

  const addLog = useCallback((line: string) => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => {
      const updated = [`[${ts}] ${line}`, ...prev];
      return updated.slice(0, 500);
    });
  }, []);

  const fetchCore = useCallback(async (force = false) => {
    try {
      const params = new URLSearchParams();
      if (force) params.append('forceSync', '1');
      const res = await axios.get(`${CORE_BASE}/?${params}`);
      setCore(res.data || {});
      setLastUpdate(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' }));
      setError(null);

      if (Array.isArray(res.data?.rockets)) {
        addLog(`[ROCKETS] ${res.data.rockets.length} detected`);
      }
    } catch (e: any) {
      setError(`Core offline: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  useEffect(() => {
    fetchCore(true);
    const i = setInterval(() => fetchCore(), 8000);
    return () => clearInterval(i);
  }, [fetchCore]);

  const panicCloseAll = useCallback(async () => {
    if (panicClosing) return;
    if (!confirm('⚠️ PANIC: Liquidate ALL positions NOW?')) return;

    setPanicClosing(true);
    setPanicMessage('EXECUTING PANIC CLOSE...');

    try {
      const res = await axios.post(`${CORE_BASE}/admin/force-close`, {
        all: true,
        forceMarket: true  // ← forces pure MARKET orders
      }, {
        headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || 'default' }
      });

      setPanicMessage(res.data.ok ? 'SUCCESS: All closed' : `FAILED: ${res.data.error || 'Unknown'}`);
      fetchCore(true);
    } catch (e: any) {
      setPanicMessage(`PANIC FAILED: ${e.response?.data?.error || e.message}`);
    } finally {
      setPanicClosing(false);
      setTimeout(() => setPanicMessage(''), 8000);
    }
  }, [panicClosing, fetchCore]);

  const forceTestTrade = useCallback(async () => {
    if (!confirm('Run test PAPER trade (1 SPY + trail)?')) return;
    try {
      const res = await axios.post(`${CORE_BASE}/admin/force-test-trade`, {}, {
        headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || 'default' }
      });
      setMessage(res.data.message || 'Test trade sent');
      fetchCore(true);
    } catch (e: any) {
      setMessage(`Test failed: ${e.response?.data?.error || e.message}`);
    }
  }, [fetchCore]);

  const addTickers = useCallback(async () => {
    const valid = validateAndCleanTickers(tickerInput);
    if (!valid.length) return setMessage('No valid tickers');

    try {
      await axios.post(`${CORE_BASE}/admin/add-ticker`, { symbols: valid.join(' ') }, {
        headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || 'default' }
      });
      setMessage(`+${valid.length} added`);
      setTickerInput('');
      fetchCore(true);
    } catch (e: any) {
      setMessage(`Add failed: ${e.response?.data?.error || e.message}`);
    }
  }, [tickerInput, fetchCore]);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400">Loading AlphaStream...</div>;
  if (error) return <div className="h-screen bg-black flex items-center justify-center text-red-400">{error}</div>;

  const { equity = 0, buyingPower = 0, positions = [], rockets = [] } = core;

  return (
    <div className="h-screen bg-black text-gray-100 flex flex-col overflow-hidden relative">
      {/* Header */}
      <header className="bg-black/90 border-b border-cyan-500/30 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Bot className="w-7 h-7 text-cyan-400" />
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            ALPHASTREAM
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-cyan-300">${equity.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Equity</p>
          </div>

          <button
            onClick={panicCloseAll}
            disabled={panicClosing}
            className={`px-5 py-2 rounded font-bold flex items-center gap-2 transition-all ${
              panicClosing ? 'bg-gray-700' : 'bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110'
            }`}
          >
            {panicClosing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            PANIC
          </button>

          <button
            onClick={() => fetchCore(true)}
            className="px-4 py-2 bg-cyan-700 rounded hover:bg-cyan-600 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left - Stats & Charts */}
        <div className="col-span-7 space-y-3 overflow-y-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-900/70 border border-cyan-700/50 rounded p-3 text-center">
              <Wallet className="w-6 h-6 mx-auto text-cyan-400 mb-1" />
              <p className="text-xl font-bold">${equity.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Equity</p>
            </div>
            <div className="bg-gray-900/70 border border-green-700/50 rounded p-3 text-center">
              <DollarSign className="w-6 h-6 mx-auto text-green-400 mb-1" />
              <p className="text-xl font-bold">${buyingPower.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Power</p>
            </div>
            <div className="bg-gray-900/70 border border-purple-700/50 rounded p-3 text-center">
              <Target className="w-6 h-6 mx-auto text-purple-400 mb-1" />
              <p className="text-xl font-bold">{positions.length}</p>
              <p className="text-xs text-gray-500">Positions</p>
            </div>
            <div className="bg-gray-900/70 border border-yellow-700/50 rounded p-3 text-center">
              <Rocket className="w-6 h-6 mx-auto text-yellow-400 mb-1" />
              <p className="text-xl font-bold">{rockets.length}</p>
              <p className="text-xs text-gray-500">Rockets</p>
            </div>
          </div>

          {/* ML Health */}
          <div className={`p-3 rounded border ${mlHealth.ok ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5" />
              <span className="font-bold">{mlHealth.ok ? 'NEURAL CORE ONLINE' : 'ML OFFLINE'}</span>
            </div>
          </div>

          {/* Positions List */}
          <div className="bg-gray-900/70 border border-cyan-700/50 rounded p-3">
            <p className="font-bold mb-2">POSITIONS ({positions.length})</p>
            {positions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No open positions</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {positions.map((p: PositionT) => (
                  <div key={p.symbol} className="flex justify-between text-sm">
                    <span className="font-mono">{p.symbol}</span>
                    <span>{p.qty} @ ${safeNum(p.avgEntryPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="bg-black/80 border border-gray-800 rounded p-3 font-mono text-xs max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-600 text-center py-6">Awaiting signals...</p>
            ) : (
              logs.map((line, i) => <div key={i} className="py-0.5">{line}</div>)
            )}
          </div>
        </div>

        {/* Right - Rockets & Actions */}
        <div className="col-span-5 space-y-3 overflow-y-auto">
          <div className="bg-gray-900/70 border border-cyan-700/50 rounded p-3">
            <p className="font-bold mb-2 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-yellow-400" /> HOT ROCKETS ({rockets.length})
            </p>

            {rockets.length === 0 ? (
              <p className="text-gray-500 text-center py-6">Scanning...</p>
            ) : (
              <div className="space-y-2">
                {rockets.map(r => (
                  <div key={r.symbol} className="flex justify-between items-center bg-gray-800/50 p-2 rounded">
                    <div>
                      <span className="font-bold text-cyan-300">{r.symbol}</span>
                      <span className="ml-2 text-xs text-gray-400">
                        {r.mlConfidence}% conf
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {/* force buy single */}}
                        className="px-3 py-1 bg-green-700 rounded text-xs hover:bg-green-600"
                      >
                        BUY
                      </button>
                      <button
                        onClick={() => {/* force sell single */}}
                        className="px-3 py-1 bg-red-700 rounded text-xs hover:bg-red-600"
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddForm(p => !p)}
              className="flex-1 px-4 py-2 bg-purple-700 rounded hover:bg-purple-600 transition-colors"
            >
              <Plus className="inline w-4 h-4 mr-1" /> Add Tickers
            </button>

            <button
              onClick={forceTestTrade}
              className="flex-1 px-4 py-2 bg-yellow-700 rounded hover:bg-yellow-600 transition-colors"
            >
              <Zap className="inline w-4 h-4 mr-1" /> Test Trade
            </button>

            <button
              onClick={panicCloseAll}
              disabled={panicClosing}
              className={`flex-1 px-4 py-2 rounded font-bold transition-all ${
                panicClosing ? 'bg-gray-700' : 'bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110'
              }`}
            >
              {panicClosing ? <Loader2 className="inline w-4 h-4 mr-1 animate-spin" /> : <AlertTriangle className="inline w-4 h-4 mr-1" />}
              PANIC CLOSE
            </button>
          </div>
        </div>
      </div>

      {/* Add Tickers Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-cyan-500/50 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Tickers</h3>
            <textarea
              value={tickerInput}
              onChange={e => setTickerInput(e.target.value)}
              placeholder="Paste tickers (SPY,AAPL,TSLA...)"
              className="w-full h-32 p-3 bg-black border border-cyan-700 rounded text-sm font-mono"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={addTickers}
                className="flex-1 py-2 bg-cyan-600 rounded hover:bg-cyan-500"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
