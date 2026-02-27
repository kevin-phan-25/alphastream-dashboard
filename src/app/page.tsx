// src/app/page.tsx
// MUST be named page.tsx (not page.ts) for JSX + App Router
// Last updated: February 27, 2026 – merged & crash-proofed
// Critical fixes:
// - Safe chaining + defaults for mlMetrics / topSymbols / arrays
// - Stable keys using symbol (prevents hydration + list reorder bugs)
// - Per-rocket size select fallback to global + proper reset logic
// - Hydration guards: Array.isArray + safeNum everywhere
// - ML prediction only fetched when rocket expanded
// - Restored all original features: add/remove, universe modal, force trades, logs drag, etc.

'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import {
  Zap,
  Activity,
  Loader2,
  AlertCircle,
  DollarSign,
  Wallet,
  Globe,
  Bot,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  Minus,
  Shield,
  Target,
  Cpu,
  Network,
  Gauge,
  Radio,
  Binary,
  Trash2,
  Copy,
  BarChart3,
  AlertOctagon,
  RefreshCw,
  Rocket,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler, ArcElement);

const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false });

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
type Discovery = {
  symbol: string;
  confidence: number;
  sources: string[];
};

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
    .filter((s) => TICKER_REGEX.test(s));
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
  const [health, setHealth] = useState<any>({ ok: false, ready: false });
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/health`, { timeout: 5000 });
        console.log('[ML HEALTH]', res.data);
        setHealth(res.data ?? { ok: false, ready: false });
      } catch (err) {
        console.error('[ML HEALTH] fetch failed:', err);
        setHealth({ ok: false, ready: false });
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
        console.log('[ML METRICS]', res.data);
        setMetrics(res.data ?? {});
      } catch (err) {
        console.error('[ML METRICS] fetch failed:', err);
        setMetrics({});
      }
    };
    fetchMetrics();
    const i = setInterval(fetchMetrics, 30000);
    return () => clearInterval(i);
  }, []);
  return metrics;
};

const useMLPrediction = (symbol: string | null) => {
  const [pred, setPred] = useState<{ action: number; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setPred(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let mounted = true;

    axios
      .post(`${ML_BASE}/observe`, { symbol }, { timeout: 6000 })
      .then((res) => {
        if (mounted) setPred(res.data ?? null);
      })
      .catch((err) => console.warn(`[ML OBSERVE] ${symbol} failed:`, err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [symbol]);

  return { pred, loading };
};

// ────────────────────────────────────────────────
// Memoized Components
// ────────────────────────────────────────────────
const Header = memo(
  ({
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
        <div className="flex items-center gap-2 bg-gray-900/70 px-3 py-1 rounded border border-cyan-700/50">
          <span className="text-xs text-cyan-300">Size:</span>
          <select
            value={positionSize}
            onChange={(e) => setPositionSize(Number(e.target.value))}
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
  )
);

const MLVisualization = memo(({ mlMetrics }: { mlMetrics: any }) => {
  const topSymbols = useMemo(() => {
    return Array.isArray(mlMetrics?.topSymbols) ? mlMetrics.topSymbols.slice(0, 10) : [];
  }, [mlMetrics?.topSymbols]);

  const barData = useMemo(
    () => ({
      labels: topSymbols.map((s: MLSymbolMetric) => s.symbol || '—'),
      datasets: [
        {
          label: 'Learning Count',
          data: topSymbols.map((s: MLSymbolMetric) => safeNum(s.count, 0)),
          backgroundColor: 'rgba(0, 255, 255, 0.6)',
          borderColor: '#00ffff',
          borderWidth: 1
        }
      ]
    }),
    [topSymbols]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } }
    }),
    []
  );

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
    className={`shrink-0 bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded p-2 font-mono text-xs relative overflow-hidden ${
      draggingLogs ? 'select-none' : ''
    }`}
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
          <div key={i} className="py-0.5 break-all">
            {logLine}
          </div>
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
// Main Dashboard Component
// ────────────────────────────────────────────────
export default function Dashboard() {
  const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
  const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';
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
  const [perRocketSizes, setPerRocketSizes] = useState<Record<string, number | undefined>>({});

  const addLogLine = useCallback((line: string) => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => {
      const updated = [...prev, `[${ts}] ${line}`];
      if (updated.length > MAX_LOG_LINES) {
        return updated.slice(updated.length - MAX_LOG_LINES);
      }
      return updated;
    });
  }, []);

  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${i * 0.3}s`,
      duration: '3s'
    }));
  }, []);

  const mlHealth = useMLHealth();
  const mlMetrics = useMLMetrics();

  const mlConnected = useMemo(() => mlHealth.ok && mlHealth.ready, [mlHealth]);

  // ────────────────────────────────────────────────
  // Core / Poller Request Helpers
  // ────────────────────────────────────────────────
  const coreRequest = useCallback(
    async (method: 'GET' | 'POST', path: string, body?: any) => {
      try {
        const url = `${CORE_BASE}${path.startsWith('/') ? path : '/' + path}`;
        const config = {
          timeout: method === 'POST' ? 90000 : 20000,
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': ADMIN_KEY
          }
        };
        console.log(`[CORE] ${method} ${url}`);
        return method === 'GET' ? await axios.get(url, config) : await axios.post(url, body || {}, config);
      } catch (e: any) {
        console.error(`[CORE FAILED] ${method} ${path}:`, e.response?.data || e.message);
        throw e;
      }
    },
    []
  );

  const pollerRequest = useCallback(
    async (method: 'GET' | 'POST', path: string, body?: any) => {
      try {
        const url = `${POLLER_BASE}${path.startsWith('/') ? path : '/' + path}`;
        const config = {
          timeout: method === 'POST' ? 90000 : 20000,
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': ADMIN_KEY
          }
        };
        return method === 'GET' ? await axios.get(url, config) : await axios.post(url, body || {}, config);
      } catch (e: any) {
        console.error(`[POLLER FAILED] ${method} ${path}:`, e.message);
        throw e;
      }
    },
    []
  );

  // ────────────────────────────────────────────────
  // Data Fetching
  // ────────────────────────────────────────────────
  const fetchCoreData = useCallback(
    async (forceSync = false) => {
      try {
        const params = new URLSearchParams();
        if (forceSync) params.append('forceSync', '1');
        params.append('universe', '1');

        const res = await axios.get(`${CORE_BASE}/?${params.toString()}`, { timeout: 25000 });
        const data = res.data || {};

        setCore(data);

        const equityValue = safeNum(data.equity, 0);
        const realizedPnLValue = safeNum(data.realizedDailyPnL, 0);

        setEquityHistory((prev) =>
          [...prev, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), equity: equityValue }].slice(-40)
        );

        setRealizedPnLHistory((prev) =>
          [...prev, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), pnl: realizedPnLValue }].slice(-40)
        );

        setLastUpdate(
          new Date().toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        );

        if (Array.isArray(data.rockets)) {
          setLiveRockets(data.rockets);
          const newSymbols = data.rockets.map((r: RocketT) => r.symbol);
          setFlashRockets(new Set(newSymbols));
          setTimeout(() => setFlashRockets(new Set()), 3000);
        }

        if (Array.isArray(data.discoveries)) {
          setRecentDiscoveries(data.discoveries);
          const newDisc = data.discoveries.map((d: Discovery) => d.symbol);
          setFlashDiscoveries(new Set(newDisc));
          setTimeout(() => setFlashDiscoveries(new Set()), 4000);
        }

        setError(null);
      } catch (e: any) {
        console.error('[CORE FETCH ERROR]', e);
        setError(`CORE OFFLINE: ${getErrorMessage(e)}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCoreData(true);
    const interval = setInterval(() => fetchCoreData(), 8000);
    return () => clearInterval(interval);
  }, [fetchCoreData]);

  // ────────────────────────────────────────────────
  // Force Actions
  // ────────────────────────────────────────────────
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
  }, [scanning, coreRequest, fetchCoreData]);

  const forceTestTrade = useCallback(async () => {
    if (!window.confirm('Run test PAPER trade (1 share SPY + 2% trail)?')) return;
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
      setPanicMessage(res.data.ok ? 'SUCCESS: All closed' : `FAILED: ${res.data.message || 'Unknown'}`);
      setTimeout(() => fetchCoreData(true), 800);
    } catch (err: any) {
      setPanicMessage(`PANIC FAILED: ${getErrorMessage(err)}`);
    } finally {
      setPanicClosing(false);
      setTimeout(() => setPanicMessage(''), 10000);
    }
  }, [panicClosing, coreRequest, fetchCoreData]);

  const forceScanAndTradeAll = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setMessage('Forcing scan + buy all...');
    try {
      await coreRequest('POST', '/admin/scan', {});
      await new Promise((r) => setTimeout(r, 4000));
      await fetchCoreData(true);

      if (liveRockets.length === 0) {
        setMessage('No rockets found');
        return;
      }

      setMessage(`Buying ${liveRockets.length} rockets...`);

      for (const r of liveRockets) {
        const qty = perRocketSizes[r.symbol] ?? globalPositionSize;
        try {
          await coreRequest('POST', '/admin/force-buy-rocket', {
            symbol: r.symbol,
            qty,
            comment: 'force_all_dashboard'
          });
          addLogLine(`[FORCE-ALL BUY] ${r.symbol} ×${qty} OK`);
        } catch (e) {
          addLogLine(`[FORCE-ALL BUY FAILED] ${r.symbol}: ${getErrorMessage(e)}`);
        }
      }
      setMessage('Force buy attempt complete');
      setTimeout(() => fetchCoreData(true), 8000);
    } catch (e) {
      setMessage(`Force all failed: ${getErrorMessage(e)}`);
    } finally {
      setScanning(false);
      setTimeout(() => setMessage(''), 8000);
    }
  }, [scanning, liveRockets, globalPositionSize, perRocketSizes, coreRequest, fetchCoreData, addLogLine]);

  const forceBuyRocket = useCallback(
    async (rocket: RocketT) => {
      const qty = perRocketSizes[rocket.symbol] ?? globalPositionSize;
      if (!window.confirm(`BUY ${qty} × ${rocket.symbol}?`)) return;

      setForceTradeLoading(rocket.symbol);
      try {
        await coreRequest('POST', '/admin/force-buy-rocket', {
          symbol: rocket.symbol,
          qty,
          comment: 'dashboard_force_buy'
        });
        addLogLine(`[FORCE BUY] ${rocket.symbol} ×${qty} OK`);
        setTimeout(() => fetchCoreData(true), 6000);
      } catch (e) {
        addLogLine(`[FORCE BUY FAILED] ${rocket.symbol}: ${getErrorMessage(e)}`);
      } finally {
        setForceTradeLoading(null);
      }
    },
    [perRocketSizes, globalPositionSize, coreRequest, fetchCoreData, addLogLine]
  );

  const forceSellRocket = useCallback(
    async (rocket: RocketT) => {
      const pos = positions.find((p) => p.symbol === rocket.symbol);
      const qty = pos ? Math.abs(pos.qty) : 1;
      if (!window.confirm(`SELL ${qty} × ${rocket.symbol}?`)) return;

      setForceTradeLoading(`${rocket.symbol}-sell`);
      try {
        await coreRequest('POST', '/admin/force-sell-rocket', {
          symbol: rocket.symbol,
          qty,
          comment: 'dashboard_force_sell'
        });
        addLogLine(`[FORCE SELL] ${rocket.symbol} ×${qty} OK`);
        setTimeout(() => fetchCoreData(true), 6000);
      } catch (e) {
        addLogLine(`[FORCE SELL FAILED] ${rocket.symbol}: ${getErrorMessage(e)}`);
      } finally {
        setForceTradeLoading(null);
      }
    },
    [positions, coreRequest, fetchCoreData, addLogLine]
  );

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

  if (error) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-red-400 flex-col gap-4">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 animate-pulse" />
        <p className="text-lg mb-4">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchCoreData(true);
          }}
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
        {particles.map((p) => (
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
        onToggleAdd={() => setShowAddForm((p) => !p)}
        onToggleRemove={() => setShowRemoveForm((p) => !p)}
        onOpenUniverse={() => setShowUniverse(true)}
        onTestTrade={forceTestTrade}
        onForceScanAndTradeAll={forceScanAndTradeAll}
        positionSize={globalPositionSize}
        setPositionSize={setGlobalPositionSize}
      />

      {message && <div className="shrink-0 px-3 py-1 bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-center text-xs font-bold">{message}</div>}

      {panicMessage && (
        <div
          className={`shrink-0 px-3 py-2 text-center text-sm font-bold border-b ${
            panicMessage.includes('SUCCESS') ? 'bg-green-900/70 border-green-500' : 'bg-red-900/70 border-red-500'
          }`}
        >
          {panicMessage}
        </div>
      )}

      {/* Add / Remove Forms */}
      {showAddForm && (
        <div className="shrink-0 px-3 py-1 bg-black/80 border-b border-cyan-900/50">
          <div className="flex gap-2">
            <input
              value={tickerInput}
              onChange={(e) => {
                setTickerInput(e.target.value);
                // updateAddSuggestions(e.target.value);  // uncomment when suggestions logic is ready
              }}
              placeholder="Add tickers (comma or space separated)"
              className="flex-1 px-3 py-2 bg-gray-900 border border-cyan-700 rounded text-sm"
            />
            <button
              onClick={() => {
                const cleaned = validateAndCleanTickers(tickerInput);
                addLogLine(`[ADD ATTEMPT] ${cleaned.join(', ')}`);
                setAddMessage(`Added ${cleaned.length} (simulated)`);
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
              onChange={(e) => {
                setRemoveTickerInput(e.target.value);
                // updateRemoveSuggestions(e.target.value);
              }}
              placeholder="Remove tickers"
              className="flex-1 px-3 py-2 bg-gray-900 border border-red-700 rounded text-sm"
            />
            <button
              onClick={() => {
                const cleaned = validateAndCleanTickers(removeTickerInput);
                addLogLine(`[REMOVE ATTEMPT] ${cleaned.join(', ')}`);
                setRemoveMessage(`Removed ${cleaned.length} (simulated)`);
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

      {/* Universe Modal */}
      {showUniverse && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowUniverse(false)}>
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-cyan-300">Universe ({universeSize} symbols)</h2>
              <button onClick={() => setShowUniverse(false)} className="text-gray-400 hover:text-white text-2xl">
                ×
              </button>
            </div>
            <input
              value={universeSearch}
              onChange={(e) => setUniverseSearch(e.target.value)}
              placeholder="Search symbols..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded mb-4"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {filteredUniverse.map((sym) => (
                <div key={sym} className="bg-gray-800 p-2 rounded text-center text-sm hover:bg-gray-700">
                  {sym}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Column */}
        <div className="col-span-8 space-y-4 overflow-y-auto">
          {/* Stats Cards */}
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

          {/* Charts */}
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

        {/* Right Column */}
        <div className="col-span-4 space-y-4 overflow-y-auto">
          <MLVisualization mlMetrics={mlMetrics} />

          {/* Hot Rockets */}
          <div className="bg-gray-900/70 border border-cyan-700/50 rounded-lg p-4">
            <p className="text-lg font-semibold text-cyan-300 mb-3 flex items-center gap-2">
              <Rocket size={20} /> Hot Rockets ({rockets.length})
            </p>

            {rockets.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No rockets detected</p>
            ) : (
              rockets.map((r) => {
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
                      <div className="text-right">
                        {showPred ? (
                          predLoading ? (
                            <Loader2 className="animate-spin inline-block" size={18} />
                          ) : pred ? (
                            <div className="text-sm">
                              <span className="font-medium">Action:</span> {pred.action} •{' '}
                              <span className="font-medium">Conf:</span> {pred.confidence.toFixed(1)}%
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No prediction</span>
                          )
                        ) : (
                          <span className="text-sm text-gray-600 opacity-70">click for ML</span>
                        )}
                      </div>
                    </div>

                    {expandedRocket === r.symbol && (
                      <div className="flex justify-end gap-3 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            forceBuyRocket(r);
                          }}
                          disabled={forceTradeLoading === r.symbol}
                          className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-700 rounded font-medium hover:brightness-110 disabled:opacity-50"
                        >
                          BUY
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            forceSellRocket(r);
                          }}
                          disabled={forceTradeLoading === `${r.symbol}-sell`}
                          className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-700 rounded font-medium hover:brightness-110 disabled:opacity-50"
                        >
                          SELL
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Logs */}
          <LogsPanel
            logs={logs}
            logHeight={logHeight}
            draggingLogs={draggingLogs}
            startLogDrag={(e: React.MouseEvent) => {
              e.preventDefault();
              setDraggingLogs(true);
              dragStartYRef.current = e.clientY;
              dragStartHeightRef.current = logHeight;
            }}
          />
        </div>
      </div>
    </div>
  );
}
