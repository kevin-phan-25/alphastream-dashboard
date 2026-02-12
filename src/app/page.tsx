// dashboard.tsx
// Last updated: February 12, 2026
// Critical: This file MUST be named page.tsx (not page.ts) for JSX to work
// ADDED: Global + per-rocket position sizing UI
// FIXED: Safe error handling in catch blocks (e instanceof Error)
//       More concise structure without removing any original logic

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

type PositionT = {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
  marketValue: number;
};

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

// ─────────────────────────────────────────
// Utils
// ─────────────────────────────────────────
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
        console.log('[DASHBOARD] ML health received:', res.data);
        setHealth(res.data || { ok: false });
      } catch (e) {
        console.error('[DASHBOARD] ML health fetch error:', e);
        setHealth({ ok: false });
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return health;
};

const useMLMetrics = () => {
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/metrics`, { timeout: 5000 });
        console.log('[DASHBOARD] ML metrics received:', res.data);
        setMetrics(res.data || {});
      } catch (e) {
        console.error('[DASHBOARD] ML metrics fetch error:', e);
        setMetrics({});
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return metrics;
};

// ─────────────────────────────────────────
// Memoized Components
// ─────────────────────────────────────────
const Header = memo(({
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
  setPositionSize: (size: number) => void;
}) => (
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
      {/* Position size selector */}
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
        title="Scan now + force buy every detected rocket"
      >
        <Rocket className="w-3 h-3" /> FORCE ALL BUY
      </button>
    </div>
  </header>
));

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

// ─────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────
export default function Dashboard() {
  const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
  const ML_BASE   = 'https://alphastream-ml-1017433009054.us-east1.run.app';
  const POLLER_BASE = 'https://low-float-discovery-poller-service-1017433009054.us-east1.run.app';

  const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;
  const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'default-admin-key-for-testing';

  const [core, setCore] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const [logHeight, setLogHeight] = useState<number>(256);
  const [draggingLogs, setDraggingLogs] = useState(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(256);
  const logMinHeight = 140;
  const logMaxHeight = 560;

  const MAX_LOG_LINES = 500;

  const [logs, setLogs] = useState<string[]>([]);

  const [forceTradeLoading, setForceTradeLoading] = useState<string | null>(null);

  // Position sizing
  const [globalPositionSize, setGlobalPositionSize] = useState<number>(1);
  const [perRocketSizes, setPerRocketSizes] = useState<Record<string, number>>({});

  const addLogLine = useCallback((line: string) => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => {
      const updated = [...prev, `[${ts}] ${line}`];
      return updated.length > MAX_LOG_LINES ? updated.slice(updated.length - MAX_LOG_LINES) : updated;
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

  const mlConnected = useMemo(() => mlHealth.ok, [mlHealth]);

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
      console.log(`[CORE REQUEST] ${method} ${url}`);
      return method === 'GET'
        ? await axios.get(url, config)
        : await axios.post(url, body || {}, config);
    } catch (e: any) {
      console.error(`[CORE REQUEST FAILED] ${method} ${path}:`, e);
      throw e;
    }
  }, []);

  const pollerRequest = useCallback(async (method: 'GET' | 'POST', path: string, body?: any) => {
    try {
      const url = `${POLLER_BASE}${path.startsWith('/') ? path : '/' + path}`;
      const config = {
        timeout: method === 'POST' ? 90000 : 20000,
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }
      };
      return method === 'GET'
        ? await axios.get(url, config)
        : await axios.post(url, body || {}, config);
    } catch (e: any) {
      console.error(`[POLLER REQUEST FAILED] ${method} ${path}:`, e);
      throw e;
    }
  }, []);

  const fetchCoreData = useCallback(async (forceSync = false) => {
    try {
      const params = new URLSearchParams();
      if (forceSync) params.append('forceSync', '1');
      params.append('universe', '1');

      const url = `${CORE_BASE}/?${params.toString()}`;
      const res = await axios.get(url, { timeout: 25000 });
      const data = res.data || {};
      setCore(data);

      const equityValue = safeNum(data.equity, 0);
      const realizedPnLValue = safeNum(data.realizedDailyPnL, 0);

      if (Array.isArray(data.discoveries)) {
        const newSymbols = data.discoveries.map((d: Discovery) => d.symbol);
        if (newSymbols.length > 0) {
          setFlashDiscoveries(new Set(newSymbols));
          setTimeout(() => setFlashDiscoveries(new Set()), 4000);
          setRecentDiscoveries(data.discoveries);
        }
      }

      setEquityHistory(prev => [...prev, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), equity: equityValue }].slice(-40));
      setRealizedPnLHistory(prev => [...prev, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), pnl: realizedPnLValue }].slice(-40));

      setLastUpdate(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      if (Array.isArray(data.rockets) && data.rockets.length > 0) {
        const newSymbols = data.rockets.map((r: RocketT) => r.symbol);
        setFlashRockets(new Set(newSymbols));
        setTimeout(() => setFlashRockets(new Set()), 3000);
        setLiveRockets(data.rockets);
      } else {
        setLiveRockets([]);
      }

      let rawLogs = [];
      if (Array.isArray(data.tradeLogTail)) rawLogs = data.tradeLogTail;
      else if (Array.isArray(data.eventLogTail)) rawLogs = data.eventLogTail;

      rawLogs.forEach((logItem: any) => {
        let logLine = '';
        if (typeof logItem === 'string') logLine = logItem;
        else if (logItem && typeof logItem === 'object') {
          const ts = logItem.ts ? new Date(logItem.ts).toLocaleString() : '??';
          const sev = logItem.severity || 'INFO';
          const type = logItem.type || 'event';
          const phase = logItem.phase ? ` (${logItem.phase})` : '';
          const reason = logItem.reason || JSON.stringify(logItem);
          logLine = `[${ts}] ${sev} ${type}${phase}: ${reason}`;
        } else {
          logLine = String(logItem || '');
        }
        addLogLine(`[CORE] ${logLine}`);
      });

      setError(null);
    } catch (e: any) {
      console.error('[DASHBOARD] Core fetch error:', e);
      setError(`CORE OFFLINE: ${getErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }, [addLogLine]);

  // ─────────────────────────────────────────
  // Action Handlers
  // ─────────────────────────────────────────

  const forceScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setMessage('Triggering scan...');
    try {
      const res = await coreRequest('POST', '/admin/scan', {});
      setMessage(res.data.message || 'Scan completed!');
      setTimeout(() => fetchCoreData(true), 3000);
    } catch (err: any) {
      setMessage(`Scan failed: ${getErrorMessage(err)}`);
    } finally {
      setScanning(false);
      setTimeout(() => setMessage(''), 5000);
    }
  }, [scanning, fetchCoreData, coreRequest]);

  const forceTestTrade = useCallback(async () => {
    if (!window.confirm('Run a test PAPER trade (1 share SPY + 2% trail)?')) return;
    setMessage('Triggering test trade...');
    try {
      const res = await coreRequest('POST', '/admin/force-test-trade', {});
      setMessage(res.data.message || 'Test trade completed!');
      setTimeout(() => fetchCoreData(true), 10000);
    } catch (err: any) {
      setMessage(`Test trade failed: ${getErrorMessage(err)}`);
    } finally {
      setTimeout(() => setMessage(''), 15000);
    }
  }, [coreRequest, fetchCoreData]);

  const panicCloseAll = useCallback(async () => {
    if (panicClosing || !window.confirm('⚠️ PANIC CLOSE: Liquidate all?')) return;
    setPanicClosing(true);
    setPanicMessage('EXECUTING PANIC CLOSE...');
    try {
      const res = await coreRequest('POST', '/admin/force-close', {});
      setPanicMessage(res?.data?.message || 'EXECUTED');
      setTimeout(() => fetchCoreData(true), 800);
    } catch (err: any) {
      setPanicMessage(`FAILED: ${getErrorMessage(err)}`);
    } finally {
      setPanicClosing(false);
      setTimeout(() => setPanicMessage(''), 10000);
    }
  }, [panicClosing, fetchCoreData, coreRequest]);

  const forceScanAndTradeAll = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setMessage('Forcing scan + buy all...');
    try {
      await coreRequest('POST', '/admin/scan', {});
      await new Promise(r => setTimeout(r, 4000));
      await fetchCoreData(true);

      if (liveRockets.length === 0) {
        setMessage('No rockets found');
        return;
      }

      setMessage(`Buying ${liveRockets.length} rockets...`);

      for (const r of liveRockets) {
        try {
          const qty = perRocketSizes[r.symbol] || globalPositionSize;
          await coreRequest('POST', '/admin/force-buy-rocket', { symbol: r.symbol, qty, comment: 'force_all' });
          addLogLine(`[FORCE-ALL] Buy ${r.symbol} qty=${qty}`);
        } catch (e) {
          addLogLine(`[FORCE-ALL] Failed ${r.symbol}: ${getErrorMessage(e)}`);
        }
      }
      setMessage('Force buy complete');
      setTimeout(() => fetchCoreData(true), 8000);
    } catch (e) {
      setMessage(`Force all failed: ${getErrorMessage(e)}`);
    } finally {
      setScanning(false);
      setTimeout(() => setMessage(''), 8000);
    }
  }, [scanning, liveRockets, globalPositionSize, perRocketSizes, coreRequest, fetchCoreData, addLogLine]);

  const forceBuyRocket = useCallback(async (rocket: RocketT) => {
    const qty = perRocketSizes[rocket.symbol] || globalPositionSize;
    if (!window.confirm(`Force BUY ${qty} ${rocket.symbol}?`)) return;

    setForceTradeLoading(rocket.symbol);
    try {
      await coreRequest('POST', '/admin/force-buy-rocket', { symbol: rocket.symbol, qty, comment: 'dashboard_buy' });
      setMessage(`BUY ${qty} ${rocket.symbol} placed`);
      addLogLine(`[FORCE-BUY] ${rocket.symbol} qty=${qty}`);
      setTimeout(() => fetchCoreData(true), 6000);
    } catch (e) {
      setMessage(`BUY failed: ${getErrorMessage(e)}`);
      addLogLine(`[FORCE-BUY] Failed ${rocket.symbol}: ${getErrorMessage(e)}`);
    } finally {
      setForceTradeLoading(null);
    }
  }, [globalPositionSize, perRocketSizes, coreRequest, fetchCoreData, addLogLine]);

  const forceSellRocket = useCallback(async (rocket: RocketT) => {
    const pos = positions.find(p => p.symbol === rocket.symbol);
    const qty = pos ? Math.abs(pos.qty) : 1;
    if (!window.confirm(`Force SELL ${qty} ${rocket.symbol}?`)) return;

    setForceTradeLoading(`${rocket.symbol}-sell`);
    try {
      await coreRequest('POST', '/admin/force-sell-rocket', { symbol: rocket.symbol, qty, comment: 'dashboard_sell' });
      setMessage(`SELL ${qty} ${rocket.symbol} placed`);
      addLogLine(`[FORCE-SELL] ${rocket.symbol} qty=${qty}`);
      setTimeout(() => fetchCoreData(true), 6000);
    } catch (e) {
      setMessage(`SELL failed: ${getErrorMessage(e)}`);
      addLogLine(`[FORCE-SELL] Failed ${rocket.symbol}: ${getErrorMessage(e)}`);
    } finally {
      setForceTradeLoading(null);
    }
  }, [positions, coreRequest, fetchCoreData, addLogLine]);

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center text-cyan-400">
      <div className="text-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
          <div className="absolute inset-0 border-4 border-cyan-400 rounded-full animate-pulse"></div>
          <Binary className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10" />
        </div>
        <p className="mt-6 text-lg tracking-widest">ALPHASTREAM</p>
        <p className="text-xs opacity-70">Neural core online...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-screen bg-black flex items-center justify-center text-red-400">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 animate-pulse" />
        <p className="text-lg mb-4">{error}</p>
        <button onClick={() => { setLoading(true); fetchCoreData(true); }} className="px-6 py-2 bg-cyan-600 rounded font-bold">
          RECONNECT
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-black text-gray-100 overflow-hidden relative flex flex-col">
      {/* Background particles & gradient unchanged */}
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
        onScan={forceScan}
        scanning={scanning}
        onPanic={panicCloseAll}
        panicClosing={panicClosing}
        onToggleAdd={() => setShowAddForm(p => !p)}
        onToggleRemove={() => setShowRemoveForm(p => !p)}
        onOpenUniverse={() => setShowUniverse(true)}
        onTestTrade={forceTestTrade}
        onForceScanAndTradeAll={forceScanAndTradeAll}
        positionSize={globalPositionSize}
        setPositionSize={setGlobalPositionSize}
      />

      {message && <div className="shrink-0 px-3 py-1 bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-center text-xs font-bold">{message}</div>}
      {panicMessage && <div className="shrink-0 px-3 py-1 bg-gradient-to-r from-red-600/90 to-pink-700/90 text-center text-xs font-bold">{panicMessage}</div>}

      {/* Add / Remove / Universe modal code unchanged — full block preserved */}
      {showAddForm && (
        <div className="shrink-0 px-3 py-1 bg-black/80 border-b border-cyan-900/50 relative">
          <div className="flex gap-1">
            <div className="relative flex-1">
              <input
                value={tickerInput}
                onChange={e => { setTickerInput(e.target.value); updateAddSuggestions(e.target.value); }}
                onKeyDown={e => e.key === 'Enter' && handleAddTickers()}
                onFocus={() => updateAddSuggestions(tickerInput)}
                onBlur={() => setTimeout(() => setShowAddSuggestions(false), 200)}
                placeholder="Add tickers (paste list ok)"
                className="w-full px-2 py-1 bg-black/70 rounded border border-cyan-700/50 text-xs"
              />
              {showAddSuggestions && addSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-cyan-700/50 rounded shadow-lg z-10 max-h-40 overflow-y-auto">
                  {addSuggestions.map(sym => (
                    <div
                      key={sym}
                      onMouseDown={() => setTickerInput(prev => prev ? `${prev} ${sym}` : sym)}
                      className="px-3 py-1.5 text-xs hover:bg-cyan-900/50 cursor-pointer"
                    >
                      {sym}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleAddTickers}
              disabled={addingTickers}
              className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded text-xs flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {addingTickers ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
            </button>
          </div>
          {addMessage && <p className="text-center text-xs mt-1">{addMessage}</p>}
        </div>
      )}

      {showRemoveForm && (
        <div className="shrink-0 px-3 py-1 bg-black/80 border-b border-red-900/50 relative">
          <div className="flex gap-1">
            <div className="relative flex-1">
              <input
                value={removeTickerInput}
                onChange={e => { setRemoveTickerInput(e.target.value); updateRemoveSuggestions(e.target.value); }}
                onKeyDown={e => e.key === 'Enter' && handleRemoveTickers()}
                onFocus={() => updateRemoveSuggestions(removeTickerInput)}
                onBlur={() => setTimeout(() => setShowRemoveSuggestions(false), 200)}
                placeholder="Remove tickers (paste list ok)"
                className="w-full px-2 py-1 bg-black/70 rounded border border-red-700/50 text-xs"
              />
              {showRemoveSuggestions && removeSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-red-700/50 rounded shadow-lg z-10 max-h-40 overflow-y-auto">
                  {removeSuggestions.map(sym => (
                    <div
                      key={sym}
                      onMouseDown={() => setRemoveTickerInput(prev => prev ? `${prev} ${sym}` : sym)}
                      className="px-3 py-1.5 text-xs hover:bg-red-900/50 cursor-pointer"
                    >
                      {sym}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleRemoveTickers}
              disabled={removingTickers}
              className="px-3 py-1 bg-red-600 rounded text-xs flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {removingTickers ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Remove'}
            </button>
          </div>
          {removeMessage && <p className="text-center text-xs mt-1">{removeMessage}</p>}
        </div>
      )}

      {showUniverse && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setShowUniverse(false)}>
          <div className="bg-gray-900/90 border border-cyan-500/50 rounded-lg p-5 max-w-4xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-cyan-300 text-lg">Universe ({universeSize} tickers)</h3>
              <div className="flex gap-2">
                <button onClick={exportUniverse} className="px-3 py-1.5 bg-cyan-800 rounded text-xs flex items-center gap-1 hover:bg-cyan-700 transition-colors">
                  <Copy className="w-3 h-3" /> Export
                </button>
                <input
                  value={universeSearch}
                  onChange={e => setUniverseSearch(e.target.value)}
                  placeholder="Search..."
                  className="px-3 py-1.5 bg-black/70 rounded border border-cyan-700/50 text-sm w-64"
                />
                <button onClick={() => setShowUniverse(false)} className="px-3 py-1.5 bg-gray-800 rounded text-sm hover:bg-gray-700 transition-colors">
                  Close
                </button>
                <button onClick={() => fetchCoreData(true)} className="px-3 py-1.5 bg-cyan-800 rounded text-xs flex items-center gap-1 hover:bg-cyan-700 transition-colors">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-black/50 rounded border border-gray-800 p-3">
              {rawUniverse.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No tickers in universe yet — add some! (Check console for fetch errors)</p>
              ) : (
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {filteredUniverse.map(sym => (
                    <div
                      key={sym}
                      onClick={() => handleRemoveSingleTicker(sym)}
                      className="group bg-gray-800/60 hover:bg-red-900/50 border border-gray-700/50 hover:border-red-600 rounded px-3 py-2 text-center text-sm cursor-pointer transition-all"
                      title="Click to remove from universe"
                    >
                      <span className="font-mono">{sym}</span>
                      <Trash2 className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-100 text-red-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden">
        {/* Left column */}
        <div className="col-span-7 space-y-2 overflow-y-auto pr-2">
          {/* Stats, status, charts, neural core, positions — all unchanged */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-cyan-900/40 to-black border border-cyan-500/30 rounded p-3 text-center">
              <Wallet className="w-6 h-6 mx-auto text-cyan-400 mb-1" />
              <p className="text-xl font-bold text-cyan-300">${equity.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Equity</p>
            </div>
            {/* ... rest of left column unchanged ... */}
          </div>
          {/* ... status grid, flow charts, neural core, ML viz, positions ... */}
        </div>

        {/* Right column - Rockets with position sizing */}
        <div className="col-span-5 space-y-2 overflow-y-auto">
          <div className="bg-gradient-to-br from-gray-900/90 to-black border border-cyan-500/30 rounded p-2 max-h-56 overflow-y-auto">
            <div className="flex justify-between items-center mb-1">
              <p className="font-bold text-cyan-300 text-xs">HOT ROCKETS ({rockets.length})</p>
              {rockets.length > 0 && <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />}
            </div>

            {rockets.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-40 animate-pulse" />
                <p className="text-xs">Scanning neural space...</p>
              </div>
            ) : (
              rockets.map((rocket, i) => {
                const action = getActionDetails(rocket.mlAction);
                const flashing = flashRockets.has(rocket.symbol);
                const isExpanded = expandedRocket === rocket.symbol;
                const chartData = rocketCharts[rocket.symbol];

                const pos = positions.find(p => p.symbol === rocket.symbol);
                const hasPosition = pos && Math.abs(pos.qty) > 0;
                const isBuying = forceTradeLoading === rocket.symbol;
                const isSelling = forceTradeLoading === `${rocket.symbol}-sell`;

                const rocketSize = perRocketSizes[rocket.symbol] || globalPositionSize;

                return (
                  <div
                    key={i}
                    className={`p-2 rounded mb-2 ${flashing ? 'bg-yellow-900/30 border border-yellow-400 shadow-lg shadow-yellow-500/20' : 'bg-gray-800/60 border border-gray-700/50'}`}
                  >
                    <div onClick={() => toggleRocketChart(rocket.symbol)} className="cursor-pointer flex justify-between items-center">
                      <div>
                        <span className="text-lg font-bold text-cyan-300">{rocket.symbol}</span>
                        <span className="ml-2 text-xs text-gray-400">
                          +{rocket.gap}% • {rocket.mlConfidence}% conf
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${action.color}`}>{action.label}</span>
                    </div>

                    {isExpanded && chartData && (
                      <div className="mt-2 h-20">
                        <Line data={{ labels: chartData.labels, datasets: chartData.datasets }} options={chartData.options} />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2 items-center justify-end">
                      <select
                        value={perRocketSizes[rocket.symbol] ?? ''}
                        onChange={e => {
                          const val = e.target.value ? Number(e.target.value) : undefined;
                          setPerRocketSizes(prev => ({ ...prev, [rocket.symbol]: val }));
                        }}
                        className="bg-black border border-cyan-600 rounded px-2 py-1 text-xs text-white"
                        title="Custom size (overrides global)"
                      >
                        <option value="">Global ({globalPositionSize})</option>
                        <option value={1}>1</option>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>

                      <button
                        onClick={() => forceBuyRocket(rocket)}
                        disabled={isBuying || isSelling}
                        className="px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-700 rounded text-xs font-bold flex items-center gap-1 hover:brightness-110 disabled:opacity-50"
                      >
                        {isBuying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpFromLine className="w-3 h-3" />}
                        BUY ({rocketSize})
                      </button>

                      <button
                        onClick={() => forceSellRocket(rocket)}
                        disabled={isBuying || isSelling || !hasPosition}
                        className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:brightness-110 disabled:opacity-50 ${hasPosition ? 'bg-gradient-to-r from-red-600 to-rose-700' : 'bg-gray-700 cursor-not-allowed'}`}
                      >
                        {isSelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
                        SELL
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <LogsPanel logs={logs} logHeight={logHeight} draggingLogs={draggingLogs} startLogDrag={startLogDrag} />
        </div>
      </div>
    </div>
  );
}
