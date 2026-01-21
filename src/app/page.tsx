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
// Types (unchanged)
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
// Utils (unchanged)
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
// Hooks (unchanged)
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
        console.log('[ML METRICS] Fetched:', res.data);
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
        console.log('[ML HEALTH] Fetched:', res.data);
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
// Memo Components (Header without REFRESH)
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
          {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} {scanning ? 'SCANNING...' : 'SCAN'}
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
          <p className="text-center text-gray-600 py-4">No logs yet — run a scan or wait for activity</p>
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
  const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';

  const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;
  const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'default-admin-key-for-testing'; // ← Add this to .env.local or Vercel

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

  // Direct core request helper (with admin key)
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
        console.log(`[CORE REQUEST] ${method} ${url}`);

        if (method === 'GET') return await axios.get(url, config);
        return await axios.post(url, body || {}, config);
      } catch (e: any) {
        console.error(`[CORE REQUEST FAILED] ${method} ${path}:`, e.response?.data || e.message);
        const msg = e?.response?.data?.error || e?.message || 'core call failed';
        const status = e?.response?.status;
        if (status === 401 || status === 403) throw new Error(`Admin key invalid: ${msg}`);
        throw new Error(`${msg} (code ${status || 'unknown'})`);
      }
    },
    []
  );

  const fetchCoreData = useCallback(
    async (forceSync = false) => {
      try {
        console.log('[DASHBOARD] Fetching core data, forceSync=', forceSync);
        const params = new URLSearchParams();
        if (forceSync) params.append('forceSync', '1');
        params.append('universe', '1');

        const url = `${CORE_BASE}/?${params.toString()}`;

        const res = await axios.get(url, { timeout: 25000 });

        const data = res.data || {};
        console.log('[DASHBOARD] Core data received:', data);

        setCore(data);

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
        console.error('[DASHBOARD] Core fetch error:', e);
        const msg = e?.response?.data?.error || e?.message || 'Cannot reach AlphaStream Core';
        setError(`CORE OFFLINE: ${msg}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const forceScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setMessage('Triggering scan...');
    try {
      const res = await coreRequest('POST', '/admin/scan', {});
      setMessage(res.data.message || 'Scan completed!');
      setTimeout(() => fetchCoreData(true), 3000);
    } catch (err: any) {
      setMessage(`Scan failed: ${err.message}`);
      console.error('[SCAN] Failed:', err);
    } finally {
      setScanning(false);
      setTimeout(() => setMessage(''), 5000);
    }
  }, [scanning, fetchCoreData, coreRequest]);

  const panicCloseAll = useCallback(async () => {
    if (panicClosing) return;

    const ok = window.confirm('⚠️ PANIC CLOSE: Liquidate all and enable HARD FLAT?');
    if (!ok) return;

    setPanicClosing(true);
    setPanicMessage('EXECUTING PANIC CLOSE...');

    try {
      const res = await coreRequest('POST', '/admin/force-close', {});
      setPanicMessage(res?.data?.message || 'EXECUTED');
      setTimeout(() => fetchCoreData(true), 800);
    } catch (err: any) {
      setPanicMessage(`FAILED: ${err.message || 'unknown error'}`);
      console.error('[PANIC] Failed:', err);
    } finally {
      setPanicClosing(false);
      setTimeout(() => setPanicMessage(''), 10000);
    }
  }, [panicClosing, fetchCoreData, coreRequest]);

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
      const res = await coreRequest('POST', '/admin/add-ticker', { symbols: validTickers.join(' ') });
      setAddMessage(`+${validTickers.length} added`);
      setTickerInput('');
      setAddSuggestions([]);
      setShowAddSuggestions(false);
      setTimeout(() => fetchCoreData(true), 600);
    } catch (e: any) {
      setAddMessage(`Failed: ${e.message}`);
      console.error('[ADD TICKERS] Failed:', e);
    } finally {
      setAddingTickers(false);
      setTimeout(() => setAddMessage(''), 3500);
    }
  }, [tickerInput, fetchCoreData, coreRequest]);

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
      const res = await coreRequest('POST', '/admin/remove-ticker', { symbols: validTickers.join(' ') });
      setRemoveMessage(`-${validTickers.length} removed`);
      setRemoveTickerInput('');
      setRemoveSuggestions([]);
      setShowRemoveSuggestions(false);
      setTimeout(() => fetchCoreData(true), 600);
    } catch (e: any) {
      setRemoveMessage(`Failed: ${e.message}`);
      console.error('[REMOVE TICKERS] Failed:', e);
    } finally {
      setRemovingTickers(false);
      setTimeout(() => setRemoveMessage(''), 3500);
    }
  }, [removeTickerInput, fetchCoreData, coreRequest]);

  const handleRemoveSingleTicker = useCallback(
    async (symbol: string) => {
      if (!window.confirm(`Remove ${symbol} from universe?`)) return;
      try {
        await coreRequest('POST', '/admin/remove-ticker', { symbols: symbol });
        setTimeout(() => fetchCoreData(true), 600);
      } catch (e) {
        console.error('[REMOVE SINGLE] Failed:', e);
      }
    },
    [fetchCoreData, coreRequest]
  );

  const exportUniverse = useCallback(() => {
    const symbols = (Array.isArray(core.universeSymbols) ? core.universeSymbols : []).join(' ');
    navigator.clipboard.writeText(symbols);
    setMessage('Universe copied to clipboard');
    setTimeout(() => setMessage(''), 3000);
  }, [core.universeSymbols]);

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

  useEffect(() => {
    console.log('[DASHBOARD] Mounting - initial fetch');
    fetchCoreData(true);
    const interval = setInterval(() => {
      console.log('[DASHBOARD] Interval fetch');
      fetchCoreData();
    }, 8000);
    return () => {
      console.log('[DASHBOARD] Unmounting');
      clearInterval(interval);
    };
  }, [fetchCoreData]);

  // Derived values
  const universeSize = safeNum(core.universeSize, 0);
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
    let raw = [];
    if (Array.isArray(core.tradeLogTail)) raw = core.tradeLogTail;
    else if (Array.isArray(core.eventLogTail)) raw = core.eventLogTail;

    return raw
      .slice(-50)
      .reverse()
      .map((log: any) => {
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
  }, [core.tradeLogTail, core.eventLogTail]);

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

  const rawUniverse: string[] = useMemo(() => {
    if (Array.isArray(core.universeSymbols)) return core.universeSymbols;
    return [];
  }, [core.universeSymbols]);

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
                  setTickerInput(e.target.value);
                  updateAddSuggestions(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTickers()}
                onFocus={() => updateAddSuggestions(tickerInput)}
                onBlur={() => setTimeout(() => setShowAddSuggestions(false), 200)}
                placeholder="Add tickers (paste list ok)"
                className="w-full px-2 py-1 bg-black/70 rounded border border-cyan-700/50 text-xs"
              />
              {showAddSuggestions && addSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-cyan-700/50 rounded shadow-lg z-10 max-h-40 overflow-y-auto">
                  {addSuggestions.map((sym) => (
                    <div
                      key={sym}
                      onMouseDown={() => setTickerInput((prev) => (prev ? `${prev} ${sym}` : sym))}
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
              className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded text-xs flex items-center gap-1"
            >
              {addingTickers ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
            </button>
          </div>
          {addMessage && <p className="text-center text-xs mt-1">{addMessage}</p>}
        </div>
      )}

      {/* Remove Form */}
      {showRemoveForm && (
        <div className="shrink-0 px-3 py-1 bg-black/80 border-b border-red-900/50 relative">
          <div className="flex gap-1">
            <div className="relative flex-1">
              <input
                value={removeTickerInput}
                onChange={(e) => {
                  setRemoveTickerInput(e.target.value);
                  updateRemoveSuggestions(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleRemoveTickers()}
                onFocus={() => updateRemoveSuggestions(removeTickerInput)}
                onBlur={() => setTimeout(() => setShowRemoveSuggestions(false), 200)}
                placeholder="Remove tickers (paste list ok)"
                className="w-full px-2 py-1 bg-black/70 rounded border border-red-700/50 text-xs"
              />
              {showRemoveSuggestions && removeSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-red-700/50 rounded shadow-lg z-10 max-h-40 overflow-y-auto">
                  {removeSuggestions.map((sym) => (
                    <div
                      key={sym}
                      onMouseDown={() => setRemoveTickerInput((prev) => (prev ? `${prev} ${sym}` : sym))}
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
              className="px-3 py-1 bg-red-600 rounded text-xs flex items-center gap-1"
            >
              {removingTickers ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Remove'}
            </button>
          </div>
          {removeMessage && <p className="text-center text-xs mt-1">{removeMessage}</p>}
        </div>
      )}

      {/* Universe Modal - no new window */}
      {showUniverse && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setShowUniverse(false)}>
          <div
            className="bg-gray-900/90 border border-cyan-500/50 rounded-lg p-5 max-w-4xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-cyan-300 text-lg">Universe ({universeSize} tickers)</h3>
              <div className="flex gap-2">
                <button onClick={exportUniverse} className="px-3 py-1.5 bg-cyan-800 rounded text-xs flex items-center gap-1">
                  <Copy className="w-3 h-3" /> Export
                </button>
                <input
                  value={universeSearch}
                  onChange={(e) => setUniverseSearch(e.target.value)}
                  placeholder="Search..."
                  className="px-3 py-1.5 bg-black/70 rounded border border-cyan-700/50 text-sm w-64"
                />
                <button onClick={() => setShowUniverse(false)} className="px-3 py-1.5 bg-gray-800 rounded text-sm">
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-black/50 rounded border border-gray-800 p-3">
              {rawUniverse.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No tickers in universe yet — add some!</p>
              ) : (
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {filteredUniverse.map((sym) => (
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
        {/* Left */}
        <div className="col-span-7 space-y-2 overflow-y-auto pr-2">
          {/* Core Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-cyan-900/40 to-black border border-cyan-500/30 rounded p-3 text-center">
              <Wallet className="w-6 h-6 mx-auto text-cyan-400 mb-1" />
              <p className="text-xl font-bold text-cyan-300">${equity.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Equity</p>
            </div>

            <div className="bg-gradient-to-br from-green-900/40 to-black border border-green-500/30 rounded p-3 text-center">
              <DollarSign className="w-6 h-6 mx-auto text-green-400 mb-1" />
              <p className="text-xl font-bold text-green-300">${buyingPower.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Power</p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-black border rounded p-3 text-center">
              <Target className={`w-6 h-6 mx-auto mb-1 ${realizedDailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              <p className={`text-xl font-bold ${realizedDailyPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {realizedDailyPnL >= 0 ? '+' : ''}${Math.abs(realizedDailyPnL).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Daily PnL</p>
            </div>
          </div>

          {/* Status + Exposure + Last update */}
          <div className="grid grid-cols-5 gap-2">
            <div
              className={`bg-gradient-to-br ${mlConnected ? 'from-green-900/40' : 'from-red-900/40'} to-black border ${
                mlConnected ? 'border-green-500/50' : 'border-red-500/50'
              } rounded p-2 text-center`}
            >
              <Cpu className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-bold">{mlConnected ? 'NEURAL ON' : 'ML OFF'}</p>
            </div>

            <div
              className={`bg-gradient-to-br ${lossLimitHit ? 'from-red-900/40' : 'from-green-900/40'} to-black border ${
                lossLimitHit ? 'border-red-500/50' : 'border-green-500/50'
              } rounded p-2 text-center`}
            >
              <Shield className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-bold">{lossLimitHit ? 'BREACH' : 'SAFE'}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-900/40 to-black border border-yellow-500/30 rounded p-2 text-center">
              <Gauge className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-bold">{exposurePct}%</p>
              <div className="h-10 mt-1">
                <Doughnut data={exposureDoughnut} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              </div>
            </div>

            <div className="col-span-2 bg-gradient-to-br from-cyan-900/40 to-black border border-cyan-500/30 rounded p-2 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-bold">{lastUpdate} ET</p>
              <p className="text-xs text-gray-500">Live Sync</p>
            </div>
          </div>

          {/* Flow Charts */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-cyan-900/40 to-black border border-cyan-500/30 rounded p-2">
              <p className="text-xs font-bold text-cyan-300 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Equity Flow
              </p>
              <div className="h-24">
                <Line
                  data={equityChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    scales: { x: { display: false }, y: { display: false } }
                  }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/30 rounded p-2">
              <p className="text-xs font-bold text-purple-300 mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" /> Realized PnL
              </p>
              <div className="h-24">
                <Line
                  data={realizedPnLChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    scales: { x: { display: false }, y: { display: false } }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Neural Core */}
          <div className="bg-gradient-to-r from-purple-900/50 via-cyan-900/30 to-black border border-purple-500/40 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-5 h-5 text-purple-400" /> <span className="font-bold text-purple-300">NEURAL CORE</span>
            </div>
            <div className="grid grid-cols-5 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-cyan-300">{mlMetrics.activeSymbols || 0}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-300">{mlMetrics.memorySize || 0}</p>
                <p className="text-xs text-gray-500">Memory</p>
              </div>
              <div>
                <p className="text-xl font-bold text-yellow-300">{mlMetrics.learningSteps || 0}</p>
                <p className="text-xs text-gray-500">Steps</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-300">{Number(mlMetrics.eps || 0).toFixed(3)}</p>
                <p className="text-xs text-gray-500">ε</p>
              </div>
              <div>
                <p className="text-xl font-bold text-pink-300">{mlMetrics.qrQuantiles || 200}</p>
                <p className="text-xs text-gray-500">Quantiles</p>
              </div>
            </div>
          </div>

          {/* ML Bar Viz */}
          <MLVisualization mlMetrics={mlMetrics} />

          {/* Positions */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-cyan-500/30 rounded p-2 max-h-40 overflow-y-auto">
            <p className="font-bold text-cyan-300 text-xs mb-1">POSITIONS ({positions.length})</p>
            {positions.length === 0 ? (
              <p className="text-center text-gray-600 text-xs py-6">Flat — awaiting signal</p>
            ) : (
              positions.map((p: any, i: number) => {
                const qty = safeNum(p.qty, 0);
                const entry = safeNum(p.avgEntryPrice ?? p.avg_entry_price, 0);
                return (
                  <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-gray-800/50">
                    <span className="text-cyan-300 font-mono">{p.symbol}</span>
                    <span>
                      {qty} @ ${entry ? entry.toFixed(2) : '0.00'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right */}
        <div className="col-span-5 space-y-2 overflow-y-auto">
          {/* Rockets */}
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
              rockets.map((rocket: RocketT, i: number) => {
                const action = getActionDetails(rocket.mlAction);
                const flashing = flashRockets.has(rocket.symbol);
                const isExpanded = expandedRocket === rocket.symbol;
                const chartData = rocketCharts[rocket.symbol];

                return (
                  <div
                    key={i}
                    className={`p-2 rounded mb-2 ${
                      flashing ? 'bg-yellow-900/30 border border-yellow-400 shadow-lg shadow-yellow-500/20' : 'bg-gray-800/60 border border-gray-700/50'
                    }`}
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
                  </div>
                );
              })
            )}
          </div>

          {/* Logs */}
          <LogsPanel logs={logs} logHeight={logHeight} draggingLogs={draggingLogs} startLogDrag={startLogDrag} />
        </div>
      </div>
    </div>
  );
}
