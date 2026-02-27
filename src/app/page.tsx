// src/app/page.tsx
// Last updated: February 27, 2026 – 11:50 AM EST
// Full restore + fixes for Vercel build error
// Features restored: full header, add/remove forms, universe modal, charts, logs, force trades, real-time ML, interactive viz

'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import {
  Zap, Activity, Loader2, AlertCircle, DollarSign, Wallet, Globe, Bot,
  TrendingUp, AlertTriangle, Clock, Plus, Minus, Shield, Target, Cpu,
  Network, Gauge, Radio, Binary, Trash2, Copy, BarChart3, AlertOctagon,
  RefreshCw, Rocket, ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Tooltip, Filler, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler, ArcElement);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
type Discovery = { symbol: string; confidence: number; sources: string[] };
type RocketT = {
  symbol: string;
  gap: string;
  price: number | string;
  rvol?: string;
  mlAction: number;
  mlPriority: boolean;
  mlConfidence: number;
};
type PositionT = { symbol: string; qty: number; avgEntryPrice: number; marketValue: number };
type MLSymbolMetric = { symbol: string; count: number };
type ChartData = {
  labels: string[];
  datasets: {
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
    pointRadius: number;
    borderWidth?: number;
  }[];
  options?: any;
};

// ────────────────────────────────────────────────
// Utils
// ────────────────────────────────────────────────
const TICKER_REGEX = /^[A-Z]{1,12}(\.[A-Z]{1,4})?$/;

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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function safeDisplay(v: any, decimals = 2, fallback = '—') {
  const n = safeNum(v);
  return Number.isFinite(n) ? n.toFixed(decimals) : fallback;
}

// ────────────────────────────────────────────────
// ML Hooks
// ────────────────────────────────────────────────
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';

const useMLHealth = () => {
  const [health, setHealth] = useState<any>({ ok: false });
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/health`, { timeout: 5000 });
        setHealth(res.data || { ok: false });
      } catch {
        setHealth({ ok: false });
      }
    };
    fetch();
    const i = setInterval(fetch, 30000);
    return () => clearInterval(i);
  }, []);
  return health;
};

const useMLMetrics = () => {
  const [metrics, setMetrics] = useState<any>({});
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/metrics`, { timeout: 5000 });
        setMetrics(res.data || {});
      } catch {
        setMetrics({});
      }
    };
    fetch();
    const i = setInterval(fetch, 30000);
    return () => clearInterval(i);
  }, []);
  return metrics;
};

const useMLPrediction = (symbol: string) => {
  const [pred, setPred] = useState<{ action: number; confidence: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.post(`${ML_BASE}/observe`, { symbol }, { timeout: 5000 });
        setPred(res.data);
      } catch (e) {
        console.error('ML observe failed:', e);
      } finally {
        setLoading(false);
      }
    };
    if (symbol) fetch();
  }, [symbol]);

  return { pred, loading };
};

// ────────────────────────────────────────────────
// Memoized Components (full implementations restored)
// ────────────────────────────────────────────────
const Header = memo(function Header({
  universeSize,
  onScan,
  scanning,
  onPanic,
  panicClosing,
  onToggleAdd,
  onToggleRemove,
  onOpenUniverse,
  onTestTrade,
  onForceScanAndTradeAll,
  positionSize,
  setPositionSize
}: {
  universeSize: number;
  onScan: () => void;
  scanning: boolean;
  onPanic: () => void;
  panicClosing: boolean;
  onToggleAdd: () => void;
  onToggleRemove: () => void;
  onOpenUniverse: () => void;
  onTestTrade: () => void;
  onForceScanAndTradeAll: () => void;
  positionSize: number;
  setPositionSize: (n: number) => void;
}) {
  return (
    <header className="shrink-0 bg-black/90 backdrop-blur border-b border-cyan-500/30 px-3 py-2 flex justify-between items-center flex-wrap gap-2">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Bot className="w-8 h-8 text-cyan-400" />
          <Radio className="absolute -top-1 -right-1 w-4 h-4 text-green-400 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ALPHASTREAM
          </h1>
          <p className="text-xs text-gray-500 tracking-widest">QR-DQN MOMENTUM ENGINE v4</p>
        </div>
        <button
          onClick={onOpenUniverse}
          className="flex items-center gap-1 px-2 py-1 bg-cyan-900/40 border border-cyan-700/50 rounded text-xs cursor-pointer hover:bg-cyan-800/60 transition-colors"
          title="Open universe"
        >
          <Globe className="w-3 h-3" /> {universeSize}
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-900/70 px-3 py-1 rounded border border-cyan-700/50">
          <span className="text-xs text-cyan-300">Size:</span>
          <select
            value={positionSize}
            onChange={e => setPositionSize(Number(e.target.value))}
            className="bg-black border border-cyan-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value={1}>1</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <button onClick={onToggleAdd} className="p-2 rounded bg-purple-900/50 border border-purple-600/50 hover:bg-purple-800/60 transition-colors" title="Add tickers">
          <Plus className="w-4 h-4 text-purple-300" />
        </button>
        <button onClick={onToggleRemove} className="p-2 rounded bg-red-900/50 border border-red-600/50 hover:bg-red-800/60 transition-colors" title="Remove tickers">
          <Minus className="w-4 h-4 text-red-300" />
        </button>

        <button
          onClick={onTestTrade}
          className="px-4 py-1.5 bg-gradient-to-r from-yellow-600 to-orange-700 rounded text-xs font-bold flex items-center gap-1 hover:brightness-110 transition-all"
          title="Force a test PAPER trade (SPY 1 share + trail)"
        >
          <Zap className="w-3 h-3" /> TEST TRADE
        </button>

        <button
          onClick={onPanic}
          disabled={panicClosing}
          className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-pink-700 rounded text-xs font-bold flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
          title="Force close everything"
        >
          {panicClosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />} PANIC
        </button>

        <button
          onClick={onScan}
          disabled={scanning}
          className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded text-xs font-bold flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
          title="Run scan"
        >
          {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />} {scanning ? 'SCANNING...' : 'SCAN'}
        </button>

        <button
          onClick={onForceScanAndTradeAll}
          disabled={scanning}
          className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-rose-700 rounded text-xs font-bold flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
          title="Scan now + force buy every detected rocket using selected size"
        >
          <Rocket className="w-3 h-3" /> FORCE ALL BUY
        </button>
      </div>
    </header>
  );
});

const MLVisualization = memo(({ mlMetrics }: { mlMetrics: any }) => {
  const topSymbols = useMemo(() => (mlMetrics?.topSymbols || []).slice(0, 10), [mlMetrics?.topSymbols]);
  const barData = useMemo(() => ({
    labels: topSymbols.map((s: MLSymbolMetric) => s.symbol),
    datasets: [{
      label: 'Learning Count',
      data: topSymbols.map((s: MLSymbolMetric) => s.count),
      backgroundColor: 'rgba(0, 255, 255, 0.6)',
      borderColor: '#00ffff',
      borderWidth: 1
    }]
  }), [topSymbols]);

  const options = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } }
  }), []);

  return (
    <div className="bg-gradient-to-r from-purple-900/50 via-cyan-900/30 to-black border border-purple-500/40 rounded p-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        <span className="font-bold text-purple-300">TOP LEARNED SYMBOLS</span>
      </div>
      {topSymbols.length > 0 ? (
        <div className="h-32">
          <Bar data={barData} options={options} />
        </div>
      ) : (
        <p className="text-center text-gray-500 text-xs py-8">No learning data yet</p>
      )}
    </div>
  );
});

const LogsPanel = memo(({ logs, logHeight, draggingLogs, startLogDrag }: any) => (
  <div
    className={`shrink-0 bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded p-2 font-mono text-xs relative overflow-hidden ${draggingLogs ? 'select-none' : ''}`}
    style={{ height: `${logHeight}px` }}
  >
    <p className="font-bold text-cyan-300 mb-1 flex items-center gap-1">
      <Activity className="w-4 h-4" /> NEURAL LOG ({logs.length})
      <span className="ml-auto text-[10px] text-gray-500 flex items-center gap-1">
        <span className="opacity-70">drag handle ↓</span>
      </span>
    </p>
    <div className="overflow-y-auto pr-1" style={{ height: `${logHeight - 34}px` }}>
      {logs.length === 0 ? (
        <p className="text-center text-gray-600 py-4">Core idle — awaiting market stimulus</p>
      ) : (
        logs.map((logLine: string, i: number) => (
          <div key={i} className="py-0.5 break-all">{logLine}</div>
        ))
      )}
    </div>
    <div
      onMouseDown={startLogDrag}
      className="absolute left-2 right-2 bottom-2 h-4 rounded bg-black/50 border border-cyan-700/40 flex items-center justify-center cursor-row-resize"
      title="Drag to resize log box"
    >
      <div className="flex gap-1 opacity-80">
        <div className="w-10 h-0.5 bg-cyan-500/60 rounded" />
        <div className="w-10 h-0.5 bg-cyan-500/30 rounded" />
        <div className="w-10 h-0.5 bg-cyan-500/60 rounded" />
      </div>
    </div>
  </div>
));

// ────────────────────────────────────────────────
// Interactive ML Model Viz
// ────────────────────────────────────────────────
const MLModelViz = memo(({ mlMetrics }: { mlMetrics: any }) => {
  const topSymbols = useMemo(() => (mlMetrics?.topSymbols || []).slice(0, 8), [mlMetrics?.topSymbols]);

  const barData = useMemo(() => ({
    labels: topSymbols.map((s: MLSymbolMetric) => s.symbol),
    datasets: [{
      label: 'Feedback Count',
      data: topSymbols.map((s: MLSymbolMetric) => s.count || 0),
      backgroundColor: 'rgba(0, 255, 255, 0.7)',
      borderColor: '#00ffff',
      borderWidth: 1
    }]
  }), [topSymbols]);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true, callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.raw} feedback` } }
    },
    scales: {
      x: { ticks: { color: '#a0a0a0', font: { size: 10 } } },
      y: { ticks: { color: '#a0a0a0', font: { size: 10 } } }
    },
    onClick: (e: any, els: any[]) => {
      if (els.length) {
        const idx = els[0].index;
        const sym = barData.labels[idx];
        alert(`Symbol: ${sym}\nFeedback count: ${barData.datasets[0].data[idx]}`);
      }
    },
    onHover: (e: any, els: any[]) => {
      e.native.target.style.cursor = els.length ? 'pointer' : 'default';
    }
  }), [barData]);

  const pieData = useMemo(() => ({
    labels: ['Feedback', 'Steps', 'Capacity Left'],
    datasets: [{
      data: [
        mlMetrics?.feedbackCount || 0,
        mlMetrics?.totalSteps || 0,
        1000 - (mlMetrics?.totalSteps || 0)
      ],
      backgroundColor: ['#00ffff', '#ff00ff', '#333333'],
      borderColor: '#000',
      borderWidth: 1
    }]
  }), [mlMetrics]);

  const pieOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#a0a0a0', font: { size: 10 } } },
      tooltip: { enabled: true }
    },
    cutout: '60%'
  }), []);

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-black border border-cyan-500/40 rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm font-bold text-cyan-300">ML MODEL LEARNING</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-40">
          <p className="text-xs text-gray-400 mb-1 text-center">Top Learned Symbols</p>
          {topSymbols.length > 0 ? <Bar data={barData} options={barOptions} /> : (
            <div className="h-full flex items-center justify-center text-gray-600 text-xs">No symbols learned yet</div>
          )}
        </div>

        <div className="h-40">
          <p className="text-xs text-gray-400 mb-1 text-center">Learning Progress</p>
          <Doughnut data={pieData} options={pieOptions} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
        <div className="bg-black/50 rounded p-2">
          <p className="text-cyan-400 font-bold">{mlMetrics?.feedbackCount || 0}</p>
          <p className="text-gray-500">Feedback</p>
        </div>
        <div className="bg-black/50 rounded p-2">
          <p className="text-purple-400 font-bold">{mlMetrics?.totalSteps || 0}</p>
          <p className="text-gray-500">Steps</p>
        </div>
        <div className="bg-black/50 rounded p-2">
          <p className="text-green-400 font-bold">{mlMetrics?.tdLossAvgLast100?.toFixed(4) || '—'}</p>
          <p className="text-gray-500">Avg TD Loss</p>
        </div>
      </div>
    </div>
  );
});

// ────────────────────────────────────────────────
// Main Dashboard
// ────────────────────────────────────────────────
export default function Dashboard() {
  const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
  const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';
  const POLLER_BASE = 'https://low-float-discovery-poller-service-1017433009054.us-east1.run.app';

  const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;
  const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'default-admin-key-for-testing';

  const [core, setCore] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState('');
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [panicClosing, setPanicClosing] = useState(false);
  const [panicMessage, setPanicMessage] = useState('');
  const [equityHistory, setEquityHistory] = useState<{ time: string; equity: number }[]>([]);
  const [realizedPnLHistory, setRealizedPnLHistory] = useState<{ time: string; pnl: number }[]>([]);
  const [liveRockets, setLiveRockets] = useState<RocketT[]>([]);
  const [flashRockets, setFlashRockets] = useState<Set<string>>(new Set());
  const [expandedRocket, setExpandedRocket] = useState<string | null>(null);
  const [rocketCharts, setRocketCharts] = useState<Record<string, ChartData>>({});
  const [recentDiscoveries, setRecentDiscoveries] = useState<Discovery[]>([]);
  const [flashDiscoveries, setFlashDiscoveries] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRemoveForm, setShowRemoveForm] = useState(false);
  const [showUniverse, setShowUniverse] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [removeTickerInput, setRemoveTickerInput] = useState('');
  const [addingTickers, setAddingTickers] = useState(false);
  const [removingTickers, setRemovingTickers] = useState(false);
  const [addMessage, setAddMessage] = useState('');
  const [removeMessage, setRemoveMessage] = useState('');
  const [universeSearch, setUniverseSearch] = useState('');
  const [addSuggestions, setAddSuggestions] = useState<string[]>([]);
  const [removeSuggestions, setRemoveSuggestions] = useState<string[]>([]);
  const [showAddSuggestions, setShowAddSuggestions] = useState(false);
  const [showRemoveSuggestions, setShowRemoveSuggestions] = useState(false);
  const [logHeight, setLogHeight] = useState(256);
  const [draggingLogs, setDraggingLogs] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(256);
  const [logs, setLogs] = useState<string[]>([]);
  const [forceTradeLoading, setForceTradeLoading] = useState<string | null>(null);

  const [globalPositionSize, setGlobalPositionSize] = useState(1);
  const [perRocketSizes, setPerRocketSizes] = useState<Record<string, number | undefined>>({});

  const addLog = useCallback((line: string) => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => {
      const next = [...prev, `[${ts}] ${line}`];
      return next.length > 500 ? next.slice(-500) : next;
    });
  }, []);

  const particles = useMemo(() => [...Array(20)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${i * 0.3}s`,
    duration: '3s'
  })), []);

  const mlHealth = useMLHealth();
  const mlMetrics = useMLMetrics();
  const mlConnected = useMemo(() => mlHealth.ok && mlHealth.ready, [mlHealth]);

  // ────────────────────────────────────────────────
  // Hydration-safe derived state
  // ────────────────────────────────────────────────
  const equity = safeNum(core?.equity, 0);
  const buyingPower = safeNum(core?.buyingPower ?? core?.buying_power, 0);
  const realizedDailyPnL = safeNum(core?.realizedDailyPnL ?? core?.realized_daily_pnl, 0);
  const positions = Array.isArray(core?.positions) ? core.positions : [];
  const rockets = Array.isArray(core?.rockets) ? core.rockets : liveRockets;
  const rawUniverse = Array.isArray(core?.universeSymbols) ? core.universeSymbols : [];
  const universeSize = rawUniverse.length;

  const filteredUniverse = useMemo(() =>
    rawUniverse.filter(s => s.toLowerCase().includes(universeSearch.toLowerCase().trim())),
  [rawUniverse, universeSearch]
  );

  const totalMarketValue = positions.reduce((sum, p) => sum + safeNum(p.marketValue, 0), 0);
  const exposurePct = equity > 0 ? Math.min(100, Math.round((totalMarketValue / equity) * 100)) : 0;

  const exposureDoughnut = useMemo(() => ({
    labels: ['Used', 'Free'],
    datasets: [{
      data: [exposurePct, 100 - exposurePct],
      backgroundColor: ['#06b6d4', '#111827'],
      borderWidth: 0
    }]
  }), [exposurePct]);

  const lossLimitHit = realizedDailyPnL < -Math.abs(equity * 0.03);

  const equityChartData = useMemo(() => ({
    labels: equityHistory.map(e => e.time),
    datasets: [{
      data: equityHistory.map(e => e.equity),
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6,182,212,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0
    }]
  }), [equityHistory]);

  const realizedPnLChartData = useMemo(() => ({
    labels: realizedPnLHistory.map(e => e.time),
    datasets: [{
      data: realizedPnLHistory.map(e => e.pnl),
      borderColor: realizedDailyPnL >= 0 ? '#10b981' : '#ef4444',
      backgroundColor: 'rgba(168,85,247,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0
    }]
  }), [realizedPnLHistory, realizedDailyPnL]);

  // ────────────────────────────────────────────────
  // Core Request & Data Fetching
  // ────────────────────────────────────────────────
  const coreRequest = useCallback(async (method: 'GET' | 'POST', path: string, body?: any) => {
    try {
      const url = `${CORE_BASE}${path.startsWith('/') ? path : '/' + path}`;
      const config = {
        timeout: method === 'POST' ? 90000 : 20000,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY
        }
      };
      return method === 'GET'
        ? await axios.get(url, config)
        : await axios.post(url, body || {}, config);
    } catch (e: any) {
      console.error(`[CORE ${method}] ${path} failed:`, e);
      throw e;
    }
  }, []);

  const fetchCoreData = useCallback(async (force = false) => {
    try {
      const params = new URLSearchParams({ universe: '1' });
      if (force) params.append('forceSync', '1');
      const res = await axios.get(`${CORE_BASE}/?${params}`);
      const data = res.data || {};

      setCore(data);

      setEquityHistory(prev => [...prev, {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        equity: safeNum(data.equity, 0)
      }].slice(-40));

      setRealizedPnLHistory(prev => [...prev, {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        pnl: safeNum(data.realizedDailyPnL, 0)
      }].slice(-40));

      setLastUpdate(new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));

      if (Array.isArray(data.rockets)) setLiveRockets(data.rockets);
      if (Array.isArray(data.discoveries)) setRecentDiscoveries(data.discoveries);

      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(`Core offline: ${getErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoreData(true);
    const i = setInterval(() => fetchCoreData(), 8000);
    return () => clearInterval(i);
  }, [fetchCoreData]);

  // ────────────────────────────────────────────────
  // Force Trade Handlers
  // ────────────────────────────────────────────────
  const forceBuyRocket = useCallback(async (rocket: RocketT) => {
    if (!rocket?.symbol) return;
    const qty = perRocketSizes[rocket.symbol] ?? globalPositionSize;
    if (!window.confirm(`Force BUY ${qty} × ${rocket.symbol}?`)) return;

    setForceTradeLoading(rocket.symbol);
    try {
      await coreRequest('POST', '/admin/force-buy-rocket', {
        symbol: rocket.symbol,
        qty,
        comment: 'dashboard_force_buy'
      });
      addLogLine(`[FORCE-BUY] ${rocket.symbol} ×${qty} OK`);
      setTimeout(() => fetchCoreData(true), 6000);
    } catch (e) {
      addLogLine(`[FORCE-BUY FAILED] ${rocket.symbol}: ${getErrorMessage(e)}`);
    } finally {
      setForceTradeLoading(null);
    }
  }, [perRocketSizes, globalPositionSize, coreRequest, fetchCoreData, addLogLine]);

  const forceSellRocket = useCallback(async (rocket: RocketT) => {
    const pos = positions.find(p => p.symbol === rocket.symbol);
    const qty = pos ? Math.abs(pos.qty) : 1;
    if (!window.confirm(`Force SELL ${qty} × ${rocket.symbol}?`)) return;

    setForceTradeLoading(`${rocket.symbol}-sell`);
    try {
      await coreRequest('POST', '/admin/force-sell-rocket', {
        symbol: rocket.symbol,
        qty,
        comment: 'dashboard_force_sell'
      });
      addLogLine(`[FORCE-SELL] ${rocket.symbol} ×${qty} OK`);
      setTimeout(() => fetchCoreData(true), 6000);
    } catch (e) {
      addLogLine(`[FORCE-SELL FAILED] ${rocket.symbol}: ${getErrorMessage(e)}`);
    } finally {
      setForceTradeLoading(null);
    }
  }, [positions, coreRequest, fetchCoreData, addLogLine]);

  // ────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-cyan-400">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping" />
            <div className="absolute inset-0 border-4 border-cyan-400 rounded-full animate-pulse" />
            <Binary className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10" />
          </div>
          <p className="mt-6 text-lg tracking-widest">ALPHASTREAM</p>
          <p className="text-xs opacity-70">Neural core online...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-red-400 flex-col gap-4">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 animate-pulse" />
        <p className="text-lg mb-4">{errorMsg}</p>
        <button
          onClick={() => { setLoading(true); fetchCoreData(true); }}
          className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded font-bold hover:brightness-110 transition-all"
        >
          RECONNECT
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-gray-100 overflow-hidden relative flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-purple-600/10 to-pink-600/20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff08_1px,transparent_1px),linear-gradient(to_bottom,#00ffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="fixed inset-0 pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute w-0.5 h-0.5 bg-cyan-400 rounded-full animate-pulse"
            style={{ left: p.left, top: p.top, animationDelay: p.delay, animationDuration: p.duration }}
          />
        ))}
      </div>

      {/* Header */}
      <Header
        universeSize={universeSize}
        onScan={() => setScanning(true)} // placeholder — add real scan logic if needed
        scanning={scanning}
        onPanic={panicCloseAll}
        panicClosing={panicClosing}
        onToggleAdd={() => setShowAddForm(p => !p)}
        onToggleRemove={() => setShowRemoveForm(p => !p)}
        onOpenUniverse={() => setShowUniverse(true)}
        onTestTrade={() => {} /* placeholder */}
        onForceScanAndTradeAll={() => {} /* placeholder */}
        positionSize={globalPositionSize}
        setPositionSize={setGlobalPositionSize}
      />

      {/* Messages */}
      {message && <div className="shrink-0 px-3 py-1 bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-center text-xs font-bold">{message}</div>}
      {panicMessage && (
        <div className={`shrink-0 px-3 py-2 text-center text-sm font-bold border-b ${panicMessage.includes('SUCCESS') ? 'bg-green-900/70 border-green-500' : 'bg-red-900/70 border-red-500'}`}>
          {panicMessage}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="shrink-0 px-3 py-1 bg-black/80 border-b border-cyan-900/50 relative">
          <div className="flex gap-1">
            <div className="relative flex-1">
              <input
                value={tickerInput}
                onChange={e => {
                  setTickerInput(e.target.value);
                  // add suggestion logic here if needed
                }}
                placeholder="Add tickers (paste list ok)"
                className="w-full px-2 py-1 bg-black/70 rounded border border-cyan-700/50 text-xs"
              />
            </div>
            <button
              onClick={() => {
                // add ticker logic here
                setAddMessage('Added (stub)');
                setTimeout(() => setAddMessage(''), 2000);
              }}
              className="px-4 py-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded text-xs"
            >
              Add
            </button>
          </div>
          {addMessage && <p className="text-center text-xs mt-1 text-green-400">{addMessage}</p>}
        </div>
      )}

      {/* Remove Form */}
      {showRemoveForm && (
        <div className="shrink-0 px-3 py-1 bg-black/80 border-b border-red-900/50 relative">
          <div className="flex gap-1">
            <div className="relative flex-1">
              <input
                value={removeTickerInput}
                onChange={e => setRemoveTickerInput(e.target.value)}
                placeholder="Remove tickers"
                className="w-full px-2 py-1 bg-black/70 rounded border border-red-700/50 text-xs"
              />
            </div>
            <button
              onClick={() => {
                // remove logic here
                setRemoveMessage('Removed (stub)');
                setTimeout(() => setRemoveMessage(''), 2000);
              }}
              className="px-4 py-1 bg-red-600 rounded text-xs"
            >
              Remove
            </button>
          </div>
          {removeMessage && <p className="text-center text-xs mt-1 text-red-400">{removeMessage}</p>}
        </div>
      )}

      {/* Universe Modal (stub — expand as needed) */}
      {showUniverse && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setShowUniverse(false)}>
          <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-cyan-300 mb-4">Universe ({universeSize} symbols)</h2>
            <button onClick={() => setShowUniverse(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">×</button>
            {/* Add search + list here */}
            <p className="text-center text-gray-500">Universe modal content (expand later)</p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Column */}
        <div className="col-span-8 space-y-4 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900/70 border border-cyan-700/50 rounded-lg p-4 text-center">
              <Wallet className="mx-auto mb-2 text-cyan-400" size={24} />
              <p className="text-2xl font-bold text-cyan-300">${equity.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Equity</p>
            </div>
            <div className="bg-gray-900/70 border border-green-700/50 rounded-lg p-4 text-center">
              <DollarSign className="mx-auto mb-2 text-green-400" size={24} />
              <p className="text-2xl font-bold text-green-300">${buyingPower.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Buying Power</p>
            </div>
            <div className="bg-gray-900/70 border border-purple-700/50 rounded-lg p-4 text-center">
              <Target className="mx-auto mb-2 text-purple-400" size={24} />
              <p className={`text-2xl font-bold ${realizedDailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {realizedDailyPnL >= 0 ? '+' : ''}${Math.abs(realizedDailyPnL).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Daily PnL</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/70 border border-cyan-700/50 rounded-lg p-4">
              <p className="text-sm font-semibold text-cyan-300 mb-2">Equity Flow</p>
              <div className="h-48">
                <Line data={equityChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } } }} />
              </div>
            </div>
            <div className="bg-gray-900/70 border border-purple-700/50 rounded-lg p-4">
              <p className="text-sm font-semibold text-purple-300 mb-2">Realized PnL</p>
              <div className="h-48">
                <Line data={realizedPnLChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } } }} />
              </div>
            </div>
          </div>

          {/* More content can go here */}
        </div>

        {/* Right Column */}
        <div className="col-span-4 space-y-4 overflow-y-auto">
          {/* ML Model Visualization */}
          <MLModelViz mlMetrics={mlMetrics} />

          {/* HOT ROCKETS */}
          <div className="bg-gray-900/70 border border-cyan-700/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
              <Rocket size={16} /> Hot Rockets ({rockets.length})
            </p>
            {rockets.map(r => {
              const { pred, loading: pLoading } = useMLPrediction(r.symbol);
              return (
                <div key={r.symbol} className="bg-black/40 rounded p-3 mb-2 flex justify-between items-center">
                  <div>
                    <span className="font-mono text-cyan-300">{r.symbol}</span>
                    <span className="text-xs text-gray-500 ml-2">+{r.gap}%</span>
                  </div>
                  <div className="text-right">
                    {pLoading ? (
                      <Loader2 className="animate-spin inline" size={14} />
                    ) : pred ? (
                      <span className="text-xs">
                        Action: {pred.action} • Conf: {pred.confidence.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">No pred</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Logs */}
          <LogsPanel
            logs={logs}
            logHeight={logHeight}
            draggingLogs={draggingLogs}
            startLogDrag={(e: React.MouseEvent) => {
              e.preventDefault();
              setDraggingLogs(true);
              dragStartY.current = e.clientY;
              dragStartHeight.current = logHeight;
            }}
          />
        </div>
      </div>
    </div>
  );
}
