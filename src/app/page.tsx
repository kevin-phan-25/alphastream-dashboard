'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import {
  RefreshCw,
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
    .replace(/[^A-Z.\s,;\n"]/g, '') // allow quotes so pasted JSON-ish lists still work
    .replace(/"/g, '')
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => TICKER_REGEX.test(s))
    .filter(Boolean);
}

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// --------------------
// Hooks
// --------------------

// ML metrics poll
const useMLMetrics = (mlBase: string) => {
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    let alive = true;

    const fetchOnce = async () => {
      try {
        const res = await axios.get(`${mlBase}/metrics`, { timeout: 10000 });
        if (!alive) return;
        setMetrics(res.data || {});
      } catch {
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
  }, [mlBase]);

  return metrics;
};

// ML health ping (so UI reflects reachability)
const useMLHealth = (mlBase: string) => {
  const [health, setHealth] = useState<{ ok?: boolean } | null>(null);

  useEffect(() => {
    let alive = true;

    const fetchOnce = async () => {
      try {
        const res = await axios.get(`${mlBase}/health`, { timeout: 8000 });
        if (!alive) return;
        setHealth(res.data || { ok: true });
      } catch {
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
  }, [mlBase]);

  return health;
};

// --------------------
// Memo Components
// --------------------
const Header = memo(
  ({
    universeSize,
    onRefresh,
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

        <button
          onClick={onRefresh}
          className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded text-xs font-bold flex items-center gap-1"
          title="Refresh snapshot"
        >
          <RefreshCw className="w-3 h-3" /> REFRESH
        </button>
      </div>
    </header>
  )
);

const MLVisualization = memo(({ mlMetrics }: { mlMetrics: any }) => {
  const topSymbols = useMemo(() => (mlMetrics.topSymbols || []).slice(0, 10), [mlMetrics.topSymbols]);

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
      className={`bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded p-2 font-mono text-xs relative overflow-hidden ${
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
  /**
   * Proxy mode (recommended):
   * - NEXT_PUBLIC_USE_API_PROXY="true"
   * - Dashboard hits /api/core/* and /api/ml/*
   * - Secrets stay server-side (CORE_ADMIN_KEY)
   */
  const USE_PROXY = String(process.env.NEXT_PUBLIC_USE_API_PROXY || 'false') === 'true';

  // Public bases (browser)
  const CORE_URL_PUBLIC = process.env.NEXT_PUBLIC_CORE_URL || 'https://alphastream-core-1017433009054.us-east1.run.app';
  const ML_URL_PUBLIC = process.env.NEXT_PUBLIC_ML_URL || 'https://alphastream-ml-1017433009054.us-east1.run.app';

  const CORE_BASE = USE_PROXY ? '/api/core' : CORE_URL_PUBLIC;
  const ML_BASE = USE_PROXY ? '/api/ml' : ML_URL_PUBLIC;

  // QUICK FIX (NOT SECURE): browser-visible admin key
  const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

  const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;

  // core snapshot + ui state
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

  // rockets + flash + expand chart
  const [liveRockets, setLiveRockets] = useState<RocketT[]>([]);
  const [flashRockets, setFlashRockets] = useState<Set<string>>(new Set());
  const [expandedRocket, setExpandedRocket] = useState<string | null>(null);
  const [rocketCharts, setRocketCharts] = useState<Record<string, ChartData>>({});

  // discoveries flash (kept)
  const [recentDiscoveries, setRecentDiscoveries] = useState<Discovery[]>([]);
  const [flashDiscoveries, setFlashDiscoveries] = useState<Set<string>>(new Set());

  // add/remove + suggestions + modals
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

  // log drag-resize
  const [logHeight, setLogHeight] = useState<number>(256);
  const [draggingLogs, setDraggingLogs] = useState(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(256);
  const logMinHeight = 140;
  const logMaxHeight = 560;

  // background particles (stable)
  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${i * 0.3}s`,
      duration: '3s'
    }));
  }, []);

  // ML signals
  const mlMetrics = useMLMetrics(ML_BASE);
  const mlHealth = useMLHealth(ML_BASE);

  const mlConnected = useMemo(() => {
    if (core?.mlHealthy === true) return true;
    if (mlHealth?.ok === true) return true;
    if (mlMetrics && Object.keys(mlMetrics).length > 0) return true;
    return false;
  }, [core?.mlHealthy, mlHealth?.ok, mlMetrics]);

  // --------------------
  // Admin headers helper
  // --------------------
  const adminHeaders = useMemo(() => {
    if (USE_PROXY) return {}; // server will attach secret
    if (!ADMIN_KEY) return {};
    return {
      'x-api-key': ADMIN_KEY,
      'x-admin-key': ADMIN_KEY,
      authorization: `Bearer ${ADMIN_KEY}`
    };
  }, [ADMIN_KEY, USE_PROXY]);

  const adminRequest = useCallback(
    async (method: 'GET' | 'POST', path: string, body?: any) => {
      try {
        const url = `${CORE_BASE}${path}`;
        if (method === 'GET') {
          return await axios.get(url, { timeout: 20000, headers: adminHeaders });
        }
        return await axios.post(url, body || {}, { timeout: 20000, headers: adminHeaders });
      } catch (e: any) {
        const status = e?.response?.status;
        const msg = e?.response?.data?.error || e?.message || 'admin call failed';
        if (status === 403 || status === 401) {
          throw new Error(
            `admin_required: ${msg}. Your Core is rejecting /admin calls. Use proxy mode or set NEXT_PUBLIC_ADMIN_KEY (quick + insecure).`
          );
        }
        throw new Error(msg);
      }
    },
    [CORE_BASE, adminHeaders]
  );

  // --------------------
  // Core fetch (PUBLIC endpoint)
  // --------------------
  const fetchCoreData = useCallback(
    async (forceSync = false) => {
      try {
        // IMPORTANT: do NOT call /admin/status here (it 403s unless authorized)
        const url = `${CORE_BASE}/?universe=1${forceSync ? '&forceSync=1' : ''}`;
        const res = await axios.get(url, { timeout: 20000 });

        const data = res.data || {};

        const equityValue = safeNum(data.equity, 0);
        const realizedPnLValue = safeNum(data.realizedDailyPnL, 0);

        // keep discoveries flashes if core returns them
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

        // rockets flash
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

  // --------------------
  // Scan / Panic
  // --------------------
  const forceScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setMessage('Initiating deep scan...');
    try {
      await axios.post(`${CORE_BASE}/scan`, {}, { timeout: 90000 });
      setMessage('Scan complete!');
      setTimeout(() => fetchCoreData(true), 800);
      setTimeout(() => setMessage(''), 5000);
    } catch {
      setMessage('Scan failed');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setScanning(false);
    }
  }, [CORE_BASE, fetchCoreData, scanning]);

  const panicCloseAll = useCallback(async () => {
    if (panicClosing) return;

    const ok = window.confirm('⚠️ PANIC CLOSE: Liquidate all and enable HARD FLAT?');
    if (!ok) return;

    setPanicClosing(true);
    setPanicMessage('EXECUTING PANIC CLOSE...');

    try {
      const res = await adminRequest('POST', `/admin/force-close`, {});
      setPanicMessage(res?.data?.message || 'EXECUTED');
      setTimeout(() => fetchCoreData(true), 800);
    } catch (err: any) {
      setPanicMessage(`FAILED: ${err.message || 'unknown error'}`);
    } finally {
      setPanicClosing(false);
      setTimeout(() => setPanicMessage(''), 10000);
    }
  }, [adminRequest, fetchCoreData, panicClosing]);

  // --------------------
  // Add/remove tickers (admin)
  // --------------------
  const updateAddSuggestions = useCallback(
    (input: string) => {
      const list: string[] = Array.isArray(core.universeSymbols) ? core.universeSymbols : [];
      if (!input.trim()) {
        setAddSuggestions([]);
        setShowAddSuggestions(false);
        return;
      }
      const query = input.toUpperCase().trim().replace(/[^A-Z.]/g, '');
      const matches = list.filter((sym: string) => sym.startsWith(query)).slice(0, 8);
      setAddSuggestions(matches);
      setShowAddSuggestions(matches.length > 0);
    },
    [core.universeSymbols]
  );

  const updateRemoveSuggestions = useCallback(
    (input: string) => {
      const list: string[] = Array.isArray(core.universeSymbols) ? core.universeSymbols : [];
      if (!input.trim()) {
        setRemoveSuggestions([]);
        setShowRemoveSuggestions(false);
        return;
      }
      const query = input.toUpperCase().trim().replace(/[^A-Z.]/g, '');
      const matches = list.filter((sym: string) => sym.startsWith(query)).slice(0, 8);
      setRemoveSuggestions(matches);
      setShowRemoveSuggestions(matches.length > 0);
    },
    [core.universeSymbols]
  );

  const handleAddTickers = useCallback(async () => {
    const validTickers = validateAndCleanTickers(tickerInput);
    if (validTickers.length === 0) {
      setAddMessage('Invalid tickers');
      setTimeout(() => setAddMessage(''), 3000);
      return;
    }

    setAddingTickers(true);
    setAddMessage('');

    try {
      await adminRequest('POST', `/admin/add-ticker`, { symbols: validTickers.join(' ') });
      setAddMessage(`+${validTickers.length}`);
      setTickerInput('');
      setAddSuggestions([]);
      setShowAddSuggestions(false);
      setTimeout(() => fetchCoreData(true), 600);
    } catch (e: any) {
      setAddMessage(e?.message?.includes('admin_required') ? 'ADMIN KEY REQUIRED' : 'Failed');
    } finally {
      setAddingTickers(false);
      setTimeout(() => setAddMessage(''), 3500);
    }
  }, [adminRequest, fetchCoreData, tickerInput]);

  const handleRemoveTickers = useCallback(async () => {
    const validTickers = validateAndCleanTickers(removeTickerInput);
    if (validTickers.length === 0) {
      setRemoveMessage('Invalid tickers');
      setTimeout(() => setRemoveMessage(''), 3000);
      return;
    }

    setRemovingTickers(true);
    setRemoveMessage('');

    try {
      await adminRequest('POST', `/admin/remove-ticker`, { symbols: validTickers.join(' ') });
      setRemoveMessage(`-${validTickers.length}`);
      setRemoveTickerInput('');
      setRemoveSuggestions([]);
      setShowRemoveSuggestions(false);
      setTimeout(() => fetchCoreData(true), 600);
    } catch (e: any) {
      setRemoveMessage(e?.message?.includes('admin_required') ? 'ADMIN KEY REQUIRED' : 'Failed');
    } finally {
      setRemovingTickers(false);
      setTimeout(() => setRemoveMessage(''), 3500);
    }
  }, [adminRequest, fetchCoreData, removeTickerInput]);

  const handleRemoveSingleTicker = useCallback(
    async (symbol: string) => {
      if (!window.confirm(`Remove ${symbol} from universe?`)) return;
      try {
        await adminRequest('POST', `/admin/remove-ticker`, { symbols: symbol });
        setTimeout(() => fetchCoreData(true), 600);
      } catch {
        // silent
      }
    },
    [adminRequest, fetchCoreData]
  );

  const exportUniverse = useCallback(() => {
    const symbols = (Array.isArray(core.universeSymbols) ? core.universeSymbols : []).join(' ');
    navigator.clipboard.writeText(symbols);
    setMessage('Universe copied to clipboard');
    setTimeout(() => setMessage(''), 3000);
  }, [core.universeSymbols]);

  // --------------------
  // Finnhub mini chart for rockets
  // -------------------- 
  const fetchRocketChart = useCallback(
    async (symbol: string) => {
      if (rocketCharts[symbol] || !FINNHUB_KEY) return;
      try {
        const end = Math.floor(Date.now() / 1000);
        const start = end - 86400;
        const res = await axios.get(
          `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=1&from=${start}&to=${end}&token=${FINNHUB_KEY}`,
          { timeout: 12000 }
        );

        if (res.data?.s === 'ok' && Array.isArray(res.data?.t) && res.data.t.length > 0) {
          const labels = res.data.t.map(() => '');
          const prices = res.data.c || [];
          const chartData: ChartData = {
            labels,
            datasets: [
              {
                data: prices,
                borderColor: '#00ffff',
                backgroundColor: 'rgba(0, 255, 255, 0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2
              }
            ],
            options: {
              elements: { line: { borderWidth: 2 } },
              plugins: { legend: { display: false }, tooltip: { enabled: false } },
              scales: { x: { display: false }, y: { display: false } }
            }
          };
          setRocketCharts((prev) => ({ ...prev, [symbol]: chartData }));
        }
      } catch {
        // silent
      }
    },
    [FINNHUB_KEY, rocketCharts]
  );

  const toggleRocketChart = useCallback(
    (symbol: string) => {
      if (expandedRocket === symbol) {
        setExpandedRocket(null);
      } else {
        setExpandedRocket(symbol);
        fetchRocketChart(symbol);
      }
    },
    [expandedRocket, fetchRocketChart]
  );

  // --------------------
  // Drag resize logs
  // --------------------
  const startLogDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingLogs(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = logHeight;
  }, [logHeight]);

  useEffect(() => {
    if (!draggingLogs) return;

    const onMove = (e: MouseEvent) => {
      const dy = e.clientY - dragStartYRef.current;
      const next = Math.max(logMinHeight, Math.min(logMaxHeight, dragStartHeightRef.current + dy));
      setLogHeight(next);
    };

    const onUp = () => setDraggingLogs(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingLogs]);

  // --------------------
  // Poll core
  // --------------------
  useEffect(() => {
    fetchCoreData();
    const interval = setInterval(() => fetchCoreData(), 8000);
    return () => clearInterval(interval);
  }, [fetchCoreData]);

  // --------------------
  // Derived UI data
  // --------------------
  const equity = safeNum(core.equity, 0);
  const buyingPower = safeNum(core.buyingPower, 0);
  const dailyDrawdown = safeNum(core.dailyDrawdown, 0);
  const realizedDailyPnL = safeNum(core.realizedDailyPnL, 0);

  const DAILY_LOSS_LIMIT = 1500;
  const lossLimitHit = Math.abs(dailyDrawdown) >= DAILY_LOSS_LIMIT;

  const positions: PositionT[] = useMemo(() => (Array.isArray(core.positions) ? core.positions : []), [core.positions]);
  const rockets: RocketT[] = useMemo(
    () => (liveRockets.length > 0 ? liveRockets : Array.isArray(core.rockets) ? core.rockets : []),
    [core.rockets, liveRockets]
  );

  const logs: string[] = useMemo(() => {
    if (Array.isArray(core.tradeLog)) return core.tradeLog.slice().reverse().slice(0, 50);
    // some versions send eventLogTail
    if (Array.isArray(core.eventLogTail)) return core.eventLogTail.slice().reverse().slice(0, 50);
    return [];
  }, [core.tradeLog, core.eventLogTail]);

  const universeSize = safeNum(core.universeSize, 0);

  const totalExposure = useMemo(() => positions.reduce((sum, pos: any) => sum + safeNum(pos.marketValue, 0), 0), [positions]);
  const exposurePct = useMemo(() => (equity > 0 ? ((totalExposure / equity) * 100).toFixed(1) : '0.0'), [equity, totalExposure]);

  const exposureDoughnut = useMemo(
    () => ({
      labels: ['Exposure', 'Cash'],
      datasets: [
        {
          data: [parseFloat(exposurePct), 100 - parseFloat(exposurePct)],
          backgroundColor: ['#00ffff', '#0a0a0a'],
          borderWidth: 0,
          cutout: '80%'
        }
      ]
    }),
    [exposurePct]
  );

  const equityChartData = useMemo(
    () => ({
      labels: equityHistory.map((d) => d.time),
      datasets: [
        {
          data: equityHistory.map((d) => d.equity),
          borderColor: '#00ffff',
          backgroundColor: 'rgba(0,255,255,0.1)',
          fill: true,
          tension: 0.5,
          pointRadius: 0
        }
      ]
    }),
    [equityHistory]
  );

  const realizedPnLChartData = useMemo(
    () => ({
      labels: realizedPnLHistory.map((d) => d.time),
      datasets: [
        {
          data: realizedPnLHistory.map((d) => d.pnl),
          borderColor: realizedDailyPnL >= 0 ? '#00ff88' : '#ff3366',
          backgroundColor: 'rgba(0,255,136,0.08)',
          fill: true,
          tension: 0.5,
          pointRadius: 0
        }
      ]
    }),
    [realizedPnLHistory, realizedDailyPnL]
  );

  const rawUniverse: string[] = useMemo(() => (Array.isArray(core.universeSymbols) ? core.universeSymbols : []), [core.universeSymbols]);

  const filteredUniverse = useMemo(() => {
    const q = universeSearch.toLowerCase().trim();
    return rawUniverse
      .filter((sym) => sym.toLowerCase().includes(q))
      .sort();
  }, [rawUniverse, universeSearch]);

  const getActionDetails = useCallback((action: number = 2) => {
    const labels = ['STRONG BUY', 'BUY', 'HOLD', 'NEUTRAL', 'SELL'];
    const colors = [
      'text-green-400 bg-green-900/70',
      'text-cyan-400 bg-cyan-900/70',
      'text-yellow-400 bg-yellow-900/50',
      'text-gray-400 bg-gray-800/70',
      'text-red-400 bg-red-900/70'
    ];
    return { label: labels[action] || 'HOLD', color: colors[action] || colors[2] };
  }, []);

  // --------------------
  // Render
  // --------------------
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
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration
            }}
          />
        ))}
      </div>

      <Header
        universeSize={universeSize}
        onRefresh={() => fetchCoreData(true)}
        onScan={forceScan}
        scanning={scanning}
        onPanic={panicCloseAll}
        panicClosing={panicClosing}
        onToggleAdd={() => setShowAddForm((p) => !p)}
        onToggleRemove={() => setShowRemoveForm((p) => !p)}
        onOpenUniverse={() => setShowUniverse(true)}
      />

      {message && <div className="shrink-0 bg-gradient-to-r from-cyan-600/80 to-purple-600/80 py-1 text-center text-xs font-bold">{message}</div>}
      {panicMessage && <div className="shrink-0 bg-gradient-to-r from-red-600/90 to-pink-700/90 py-1 text-center text-xs font-bold">{panicMessage}</div>}

      {/* Add Form */}
      {showAddForm && (
        <div className="shrink-0 px-3 py-1 bg-black/80 border-b border-cyan-900/50 relative">
          <div className="flex gap-1">
            <div className="relative flex-1">
              <input
                value={tickerInput}
                onChange={(e) => {
                  setTicker
