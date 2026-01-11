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
  AlertOctagon
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

// --------------------
// Types
// --------------------
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

// --------------------
// Utils
// --------------------
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

// --------------------
// Hooks (ML via proxy to fix CORS)
// --------------------

const useMLMetrics = () => {
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    let alive = true;

    const fetchOnce = async () => {
      try {
        const res = await axios.get('/api/ml/metrics', { timeout: 10000 });
        if (!alive) return;
        setMetrics(res.data || {});
      } catch (err) {
        console.error('ML metrics fetch failed:', err);
        if (!alive) return;
        setMetrics({});
      }
    };

    fetchOnce();
    const interval = setInterval(fetchOnce, 20000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  return metrics;
};

const useMLHealth = () => {
  const [health, setHealth] = useState<{ ok?: boolean } | null>(null);

  useEffect(() => {
    let alive = true;

    const fetchOnce = async () => {
      try {
        const res = await axios.get('/api/ml/health', { timeout: 8000 });
        if (!alive) return;
        setHealth(res.data || { ok: true });
      } catch (err) {
        console.error('ML health fetch failed:', err);
        if (!alive) return;
        setHealth(null);
      }
    };

    fetchOnce();
    const interval = setInterval(fetchOnce, 15000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  return health;
};

// --------------------
// Memo Components
// --------------------
const Header = memo(
  ({
    universeSize,
    onScan,
    scanning,
    onPanic,
    panicClosing,
    onToggleAdd,
    onToggleRemove,
    onOpenUniverse
  }: any) => (
    <header className="shrink-0 bg-black/90 backdrop-blur border-b border-cyan-500/30 px-3 py-2 flex justify-between items-center">
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
          className="flex items-center gap-1 px-2 py-1 bg-cyan-900/40 border border-cyan-700/50 rounded text-xs cursor-pointer"
          title="Open universe"
        >
          <Globe className="w-3 h-3" /> {universeSize}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onToggleAdd} className="p-2 rounded bg-purple-900/50 border border-purple-600/50" title="Add tickers">
          <Plus className="w-4 h-4 text-purple-300" />
        </button>

        <button onClick={onToggleRemove} className="p-2 rounded bg-red-900/50 border border-red-600/50" title="Remove tickers">
          <Minus className="w-4 h-4 text-red-300" />
        </button>

        <button
          onClick={onPanic}
          disabled={panicClosing}
          className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-pink-700 rounded text-xs font-bold flex items-center gap-1"
          title="Force close everything"
        >
          {panicClosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />} PANIC
        </button>

        <button
          onClick={onScan}
          disabled={scanning}
          className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded text-xs font-bold flex items-center gap-1"
          title="Run scan"
        >
          {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} SCAN
        </button>
      </div>
    </header>
  )
);

const MLVisualization = memo(({ mlMetrics }: { mlMetrics: any }) => {
  const topSymbols = useMemo(() => (mlMetrics?.topSymbols || []).slice(0, 10), [mlMetrics?.topSymbols]);

  const barData = useMemo(
    () => ({
      labels: topSymbols.map((s: MLSymbolMetric) => s.symbol),
      datasets: [
        {
          label: 'Learning Count',
          data: topSymbols.map((s: MLSymbolMetric) => s.count),
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

const LogsPanel = memo(({ logs, logHeight, draggingLogs, startLogDrag }: any) => {
  return (
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
  );
});

// --------------------
// Page
// --------------------
export default function Dashboard() {
  const CORE_URL_PUBLIC = process.env.NEXT_PUBLIC_CORE_URL || 'https://alphastream-core-1017433009054.us-east1.run.app';
  const CORE_BASE = '/api/core'; // Always proxy Core for consistency

  const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

  const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;

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

  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${i * 0.3}s`,
      duration: '3s'
    }));
  }, []);

  const mlMetrics = useMLMetrics();
  const mlHealth = useMLHealth();

  const mlConnected = useMemo(() => {
    if (core?.mlHealthy === true) return true;
    if (mlHealth?.ok === true) return true;
    if (mlMetrics && Object.keys(mlMetrics).length > 0) return true;
    return false;
  }, [core?.mlHealthy, mlHealth?.ok, mlMetrics]);

  const adminHeaders = useMemo(() => {
    const key = ADMIN_KEY;
    if (!key) console.warn('No NEXT_PUBLIC_ADMIN_KEY set - admin features limited');
    return {
      'x-admin-key': key,
      'x-api-key': key,
      authorization: `Bearer ${key}`
    };
  }, [ADMIN_KEY]);

  const adminRequest = useCallback(
    async (method: 'GET' | 'POST', path: string, body?: any) => {
      try {
        const url = `${CORE_BASE}${path}`;
        const config = {
          timeout: 20000,
          headers: adminHeaders
        };
        if (method === 'GET') {
          return await axios.get(url, config);
        }
        return await axios.post(url, body || {}, config);
      } catch (e: any) {
        const status = e?.response?.status;
        const msg = e?.response?.data?.error || e?.message || 'admin call failed';
        if (status === 403 || status === 401) {
          throw new Error(`admin_required: ${msg}`);
        }
        throw new Error(msg);
      }
    },
    [CORE_BASE, adminHeaders]
  );

  const fetchCoreData = useCallback(
    async (forceSync = false) => {
      try {
        const url = `${CORE_BASE}/?universe=1${forceSync ? '&forceSync=1' : ''}`;
        const res = await axios.get(url, { timeout: 20000 });

        const data = res.data || {};

        const equityValue = safeNum(data.equity, 0);
        const realizedPnLValue = safeNum(data.realizedDailyPnL, 0);

        if (data.discoveries && Array.isArray(data.discoveries)) {
          const newSymbols = data.discoveries.map((d: Discovery) => d.symbol);
          if (newSymbols.length > 0) {
            setFlashDiscoveries(new Set(newSymbols));
            setTimeout(() => setFlashDiscoveries(new Set()), 4000);
            setRecentDiscoveries(data.discoveries);
          }
        }

        setCore(data);

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

        if (Array.isArray(data.rockets) && data.rockets.length > 0) {
          const newSymbols = data.rockets.map((r: RocketT) => r.symbol);
          setFlashRockets(new Set(newSymbols));
          setTimeout(() => setFlashRockets(new Set()), 3000);
          setLiveRockets(data.rockets);
        } else {
          setLiveRockets([]);
        }

        setError(null);
      } catch (e: any) {
        const msg = e?.response?.data?.error || e?.message || 'Cannot reach AlphaStream Core';
        setError(`CORE OFFLINE: ${msg}`);
      } finally {
        setLoading(false);
      }
    },
    [CORE_BASE]
  );

  const forceScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setMessage('Triggering scan...');
    try {
      const res = await adminRequest('POST', '/scan', {});
      setMessage(res.data.message || 'Scan triggered!');
      setTimeout(() => fetchCoreData(true), 2000);
    } catch (err: any) {
      setMessage(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
      setTimeout(() => setMessage(''), 5000);
    }
  }, [scanning, adminRequest, fetchCoreData]);

  // ... (rest of your code: panicCloseAll, add/remove handlers, etc. remain unchanged)

  const logs: string[] = useMemo(() => {
    let raw = [];
    if (Array.isArray(core.tradeLog)) raw = core.tradeLog;
    else if (Array.isArray(core.eventLogTail)) raw = core.eventLogTail;

    return raw
      .slice(-50)
      .reverse()
      .map(log => {
        if (typeof log === 'string') return log;
        if (log && typeof log === 'object') {
          const ts = log.ts ? new Date(log.ts).toLocaleString() : '??';
          const sev = log.severity || 'INFO';
          const type = log.type || 'event';
          const phase = log.phase ? ` (${log.phase})` : '';
          const reason = log.reason || JSON.stringify(log);
          return `[${ts}] ${sev} ${type}${phase}: ${reason}`;
        }
        return String(log || '');
      });
  }, [core.tradeLog, core.eventLogTail]);

  // ... (rest of render code remains the same - Header without REFRESH, etc.)

  // Render
  if (loading) {
    return (
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
  }

  if (error) {
    return (
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
  }

  // ... (your full JSX return remains unchanged - just without REFRESH button in Header)
}
