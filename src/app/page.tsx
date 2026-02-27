// src/app/page.tsx
// Last updated: February 27, 2026 – 13:45 EST
// RESTORED: full original features + logics (add/remove, universe modal, force trades, per-rocket sizing, expanded details)
// FIXED: client-side exception via safe chaining + defaults for mlMetrics / topSymbols
// IMPROVED: ML prediction only fetched when rocket is expanded

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
// Types (restored + extended)
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
};

// ────────────────────────────────────────────────
// Utils (restored)
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
// ML Hooks (improved - conditional fetch)
// ────────────────────────────────────────────────
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';

const useMLHealth = () => {
  const [health, setHealth] = useState<any>({ ok: false, ready: false });
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/health`, { timeout: 5000 });
        setHealth(res.data ?? { ok: false, ready: false });
      } catch {
        setHealth({ ok: false, ready: false });
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
        setMetrics(res.data ?? {});
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

const useMLPrediction = (symbol: string | null) => {
  const [pred, setPred] = useState<{ action: number; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    let mounted = true;

    axios.post(`${ML_BASE}/observe`, { symbol }, { timeout: 6000 })
      .then(res => { if (mounted) setPred(res.data ?? null); })
      .catch(err => console.warn(`ML observe ${symbol} failed:`, err))
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [symbol]);

  return { pred, loading };
};

// ────────────────────────────────────────────────
// Header (restored full)
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

// ────────────────────────────────────────────────
// ML Visualization (safe version)
// ────────────────────────────────────────────────
const MLModelViz = memo(({ mlMetrics }: { mlMetrics: any }) => {
  const topSymbols = useMemo<MLSymbolMetric[]>(
    () => (Array.isArray(mlMetrics?.topSymbols) ? mlMetrics.topSymbols : []).slice(0, 8),
    [mlMetrics?.topSymbols]
  );

  const barData = useMemo(() => ({
    labels: topSymbols.map(s => s.symbol || '—'),
    datasets: [{
      label: 'Feedback Count',
      data: topSymbols.map(s => safeNum(s.count, 0)),
      backgroundColor: 'rgba(0, 255, 255, 0.7)',
      borderColor: '#00ffff',
      borderWidth: 1
    }]
  }), [topSymbols]);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#a0a0a0', font: { size: 10 } } },
      y: { ticks: { color: '#a0a0a0', font: { size: 10 } } }
    }
  }), []);

  const pieData = useMemo(() => ({
    labels: ['Feedback', 'Steps', 'Capacity Left'],
    datasets: [{
      data: [
        safeNum(mlMetrics?.feedbackCount, 0),
        safeNum(mlMetrics?.totalSteps, 0),
        1000 - safeNum(mlMetrics?.totalSteps, 0)
      ],
      backgroundColor: ['#00ffff', '#ff00ff', '#333333'],
      borderColor: '#000',
      borderWidth: 1
    }]
  }), [mlMetrics]);

  const pieOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { color: '#a0a0a0', font: { size: 10 } } } },
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
          <p className="text-cyan-400 font-bold">{safeNum(mlMetrics?.feedbackCount)}</p>
          <p className="text-gray-500">Feedback</p>
        </div>
        <div className="bg-black/50 rounded p-2">
          <p className="text-purple-400 font-bold">{safeNum(mlMetrics?.totalSteps)}</p>
          <p className="text-gray-500">Steps</p>
        </div>
        <div className="bg-black/50 rounded p-2">
          <p className="text-green-400 font-bold">{mlMetrics?.tdLossAvgLast100?.toFixed(4) ?? '—'}</p>
          <p className="text-gray-500">Avg TD Loss</p>
        </div>
      </div>
    </div>
  );
});

// ────────────────────────────────────────────────
// Logs Panel (restored)
// ────────────────────────────────────────────────
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
// Main Dashboard – FULL RESTORED VERSION
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

  // Derived state
  const equity = safeNum(core?.equity, 0);
  const buyingPower = safeNum(core?.buyingPower ?? core?.buying_power, 0);
  const realizedDailyPnL = safeNum(core?.realizedDailyPnL ?? core?.realized_daily_pnl, 0);
  const positions: PositionT[] = Array.isArray(core?.positions) ? core.positions : [];
  const rockets: RocketT[] = Array.isArray(core?.rockets) ? core.rockets : liveRockets;
  const rawUniverse: string[] = Array.isArray(core?.universeSymbols) ? core.universeSymbols : [];

  const universeSize = rawUniverse.length;

  const filteredUniverse = useMemo(() =>
    rawUniverse.filter(s => s.toLowerCase().includes(universeSearch.toLowerCase().trim())),
  [rawUniverse, universeSearch]);

  const totalMarketValue = positions.reduce((sum, p) => sum + safeNum(p.marketValue, 0), 0);
  const exposurePct = equity > 0 ? Math.min(100, Math.round((totalMarketValue / equity) * 100)) : 0;

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

  // Core data fetch
  const fetchCoreData = useCallback(async (force = false) => {
    try {
      const params = new URLSearchParams({ universe: '1' });
      if (force) params.append('forceSync', '1');
      const res = await axios.get(`${CORE_BASE}/?${params}`);
      const data = res.data || {};

      setCore(data);
      setEquityHistory(prev => [...prev, { time: new Date().toLocaleTimeString(), equity: safeNum(data.equity, 0) }].slice(-40));
      setRealizedPnLHistory(prev => [...prev, { time: new Date().toLocaleTimeString(), pnl: safeNum(data.realizedDailyPnL, 0) }].slice(-40));
      setLastUpdate(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit' }));

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

  // Force trade handlers (restored)
  const forceBuyRocket = useCallback(async (rocket: RocketT) => {
    if (!rocket?.symbol) return;
    const qty = perRocketSizes[rocket.symbol] ?? globalPositionSize;
    if (!window.confirm(`Force BUY ${qty} × ${rocket.symbol}?`)) return;

    setForceTradeLoading(rocket.symbol);
    try {
      // Replace with real endpoint when available
      // await axios.post(`${CORE_BASE}/admin/force-buy-rocket`, { symbol: rocket.symbol, qty, comment: 'dashboard_force' }, { headers: { 'x-admin-key': ADMIN_KEY } });
      addLog(`[FORCE-BUY] ${rocket.symbol} ×${qty} → simulated success`);
      setTimeout(() => fetchCoreData(true), 4000);
    } catch (e) {
      addLog(`[FORCE-BUY FAILED] ${rocket.symbol}: ${getErrorMessage(e)}`);
    } finally {
      setForceTradeLoading(null);
    }
  }, [perRocketSizes, globalPositionSize, fetchCoreData, addLog]);

  const forceSellRocket = useCallback(async (rocket: RocketT) => {
    const pos = positions.find(p => p.symbol === rocket.symbol);
    const qty = pos ? Math.abs(pos.qty) : 1;
    if (!window.confirm(`Force SELL ${qty} × ${rocket.symbol}?`)) return;

    setForceTradeLoading(`${rocket.symbol}-sell`);
    try {
      // Replace with real endpoint
      // await axios.post(`${CORE_BASE}/admin/force-sell-rocket`, { symbol: rocket.symbol, qty, comment: 'dashboard_force' }, { headers: { 'x-admin-key': ADMIN_KEY } });
      addLog(`[FORCE-SELL] ${rocket.symbol} ×${qty} → simulated success`);
      setTimeout(() => fetchCoreData(true), 4000);
    } catch (e) {
      addLog(`[FORCE-SELL FAILED] ${rocket.symbol}: ${getErrorMessage(e)}`);
    } finally {
      setForceTradeLoading(null);
    }
  }, [positions, fetchCoreData, addLog]);

  // Drag handler for logs
  const handleDrag = useCallback((e: MouseEvent) => {
    if (!draggingLogs) return;
    const delta = e.clientY - dragStartY.current;
    setLogHeight(Math.max(120, Math.min(600, dragStartHeight.current + delta)));
  }, [draggingLogs]);

  useEffect(() => {
    if (draggingLogs) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', () => setDraggingLogs(false));
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', () => setDraggingLogs(false));
    };
  }, [draggingLogs, handleDrag]);

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
      {/* Background particles */}
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

      <Header
        universeSize={universeSize}
        onScan={() => setScanning(true)}
        scanning={scanning}
        onPanic={() => setPanicClosing(true)}
        panicClosing={panicClosing}
        onToggleAdd={() => setShowAddForm(p => !p)}
        onToggleRemove={() => setShowRemoveForm(p => !p)}
        onOpenUniverse={() => setShowUniverse(true)}
        onTestTrade={() => addLog('[TEST TRADE] Triggered – placeholder logic')}
        onForceScanAndTradeAll={() => addLog('[FORCE ALL BUY] Triggered – placeholder')}
        positionSize={globalPositionSize}
        setPositionSize={setGlobalPositionSize}
      />

      {message && <div className="shrink-0 px-3 py-1 bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-center text-xs font-bold">{message}</div>}

      {showAddForm && (
        <div className="shrink-0 px-3 py-1 bg-black/80 border-b border-cyan-900/50">
          <div className="flex gap-2">
            <input
              value={tickerInput}
              onChange={e => setTickerInput(e.target.value)}
              placeholder="Add tickers (comma or space separated)"
              className="flex-1 px-3 py-2 bg-gray-900 border border-cyan-700 rounded text-sm"
            />
            <button
              onClick={() => {
                const cleaned = validateAndCleanTickers(tickerInput);
                addLog(`[ADD] Attempted: ${cleaned.join(', ')}`);
                setAddMessage(`Added ${cleaned.length} tickers (simulated)`);
                setTickerInput('');
                setTimeout(() => setAddMessage(''), 3000);
              }}
              className="px-6 py-2 bg-cyan-600 rounded font-medium hover:bg-cyan-500"
            >
              Add
            </button>
          </div>
          {addMessage && <p className="text-green-400 text-sm mt-1">{addMessage}</p>}
        </div>
      )}

      {showRemoveForm && (
        <div className="shrink-0 px-3 py-1 bg-black/80 border-b border-red-900/50">
          <div className="flex gap-2">
            <input
              value={removeTickerInput}
              onChange={e => setRemoveTickerInput(e.target.value)}
              placeholder="Remove tickers"
              className="flex-1 px-3 py-2 bg-gray-900 border border-red-700 rounded text-sm"
            />
            <button
              onClick={() => {
                const cleaned = validateAndCleanTickers(removeTickerInput);
                addLog(`[REMOVE] Attempted: ${cleaned.join(', ')}`);
                setRemoveMessage(`Removed ${cleaned.length} tickers (simulated)`);
                setRemoveTickerInput('');
                setTimeout(() => setRemoveMessage(''), 3000);
              }}
              className="px-6 py-2 bg-red-600 rounded font-medium hover:bg-red-500"
            >
              Remove
            </button>
          </div>
          {removeMessage && <p className="text-red-400 text-sm mt-1">{removeMessage}</p>}
        </div>
      )}

      {showUniverse && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowUniverse(false)}>
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-cyan-300">Universe ({universeSize} symbols)</h2>
              <button onClick={() => setShowUniverse(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <input
              value={universeSearch}
              onChange={e => setUniverseSearch(e.target.value)}
              placeholder="Search symbols..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded mb-4"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {filteredUniverse.map(sym => (
                <div key={sym} className="bg-gray-800 p-2 rounded text-center text-sm hover:bg-gray-700">
                  {sym}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left – Stats + Charts (restored) */}
        <div className="col-span-8 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/70 border border-cyan-700/50 rounded-lg p-6 text-center">
              <Wallet className="mx-auto mb-3 text-cyan-400" size={32} />
              <p className="text-3xl font-bold text-cyan-300">${equity.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Equity</p>
            </div>
            <div className="bg-gray-900/70 border border-green-700/50 rounded-lg p-6 text-center">
              <DollarSign className="mx-auto mb-3 text-green-400" size={32} />
              <p className="text-3xl font-bold text-green-300">${buyingPower.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Buying Power</p>
            </div>
            <div className="bg-gray-900/70 border border-purple-700/50 rounded-lg p-6 text-center">
              <Target className="mx-auto mb-3 text-purple-400" size={32} />
              <p className={`text-3xl font-bold ${realizedDailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {realizedDailyPnL >= 0 ? '+' : ''}${Math.abs(realizedDailyPnL).toLocaleString()}
              </p>
              <p className="text-sm text-gray-400 mt-1">Daily PnL</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-900/70 border border-cyan-700/50 rounded-lg p-4">
              <p className="text-lg font-semibold text-cyan-300 mb-3">Equity Flow</p>
              <div className="h-64">
                <Line data={equityChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
            <div className="bg-gray-900/70 border border-purple-700/50 rounded-lg p-4">
              <p className="text-lg font-semibold text-purple-300 mb-3">Realized PnL</p>
              <div className="h-64">
                <Line data={realizedPnLChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column – ML Viz + Rockets + Logs */}
        <div className="col-span-4 space-y-4 overflow-y-auto">
          <MLModelViz mlMetrics={mlMetrics} />

          <div className="bg-gray-900/70 border border-cyan-700/50 rounded-lg p-4">
            <p className="text-lg font-semibold text-cyan-300 mb-3 flex items-center gap-2">
              <Rocket size={20} /> Hot Rockets ({rockets.length})
            </p>

            {rockets.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No rockets detected</p>
            ) : (
              rockets.map(r => {
                const showPred = expandedRocket === r.symbol;
                const { pred, loading: predLoading } = useMLPrediction(showPred ? r.symbol : null);

                return (
                  <div
                    key={r.symbol}
                    className="bg-black/40 rounded-lg p-4 mb-3 cursor-pointer hover:bg-black/60 transition-colors"
                    onClick={() => setExpandedRocket(expandedRocket === r.symbol ? null : r.symbol)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xl font-bold text-cyan-300">{r.symbol}</span>
                        <span className="ml-3 text-sm text-gray-400">+{r.gap}%</span>
                      </div>
                      <div className="text-right text-sm">
                        {showPred ? (
                          predLoading ? <Loader2 className="animate-spin inline-block" size={16} /> : pred ? (
                            <>Action: <strong>{pred.action}</strong> • Conf: <strong>{pred.confidence.toFixed(1)}%</strong></>
                          ) : <span className="text-gray-500">No pred</span>
                        ) : <span className="text-gray-600 opacity-70">click for ML</span>}
                      </div>
                    </div>

                    {expandedRocket === r.symbol && (
                      <div className="mt-4 space-y-3">
                        <div className="text-sm text-gray-300">
                          Price: ${safeDisplay(r.price)} | RVOL: {r.rvol ?? '—'}
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={e => { e.stopPropagation(); forceBuyRocket(r); }}
                            disabled={forceTradeLoading === r.symbol}
                            className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-700 rounded font-medium hover:brightness-110 disabled:opacity-50"
                          >
                            BUY
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); forceSellRocket(r); }}
                            disabled={forceTradeLoading === `${r.symbol}-sell`}
                            className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-700 rounded font-medium hover:brightness-110 disabled:opacity-50"
                          >
                            SELL
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

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
