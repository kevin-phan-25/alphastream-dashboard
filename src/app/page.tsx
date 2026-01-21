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
// Hooks (ML via proxy — unchanged)
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
// Memo Components (unchanged)
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
          {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} {scanning ? 'SCANNING...' : 'SCAN'}
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
  const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
  const ADMIN_API_BASE = '/api/admin'; // Proxy for admin actions (add/remove/scan)

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

  const adminRequest = useCallback(
    async (method: 'GET' | 'POST', path: string, body?: any) => {
      try {
        const url = `${ADMIN_API_BASE}${path.startsWith('/') ? path : '/' + path}`;
        const config = {
          timeout: method === 'POST' ? 90000 : 20000,
          headers: { 'Content-Type': 'application/json' }
        };
        console.log(`[ADMIN REQUEST] ${method} ${url}`);

        if (method === 'GET') return await axios.get(url, config);
        return await axios.post(url, body || {}, config);
      } catch (e: any) {
        console.error(`[ADMIN REQUEST FAILED] ${method} ${path}:`, e.response?.data || e.message);
        const msg = e?.response?.data?.error || e?.message || 'admin call failed';
        if (e?.response?.status === 401 || e?.response?.status === 403) {
          throw new Error(`Admin key required: ${msg}`);
        }
        throw new Error(msg);
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
      const res = await adminRequest('POST', '/scan', {});
      setMessage(res.data.message || 'Scan triggered!');
      setTimeout(() => fetchCoreData(true), 2000);
    } catch (err: any) {
      setMessage(`Scan failed: ${err.message}`);
      console.error('[SCAN] Failed:', err);
    } finally {
      setScanning(false);
      setTimeout(() => setMessage(''), 5000);
    }
  }, [scanning, adminRequest, fetchCoreData]);

  // ... (panicCloseAll, updateAddSuggestions, handleAddTickers, handleRemoveTickers, handleRemoveSingleTicker, exportUniverse, fetchRocketChart, toggleRocketChart, startLogDrag unchanged)

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

  // ... (rest of calculations: equity, buyingPower, dailyDrawdown, realizedDailyPnL, lossLimitHit, positions, rockets, logs, universeSize, totalExposure, exposurePct, exposureDoughnut, equityChartData, realizedPnLChartData, rawUniverse, filteredUniverse, getActionDetails unchanged)

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
      {/* Background (unchanged) */}
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

      {/* Add Form (unchanged) */}
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

      {/* Remove Form (unchanged) */}
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

      {/* Universe Modal — now shows actual size from core */}
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

      {/* Main Grid (unchanged except logs now pull from core) */}
      <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden">
        {/* Left (unchanged) */}
        <div className="col-span-7 space-y-2 overflow-y-auto pr-2">
          {/* Core Stats, Status, Flow Charts, Neural Core, ML Viz, Positions — all unchanged */}
          {/* ... paste your original left column content here ... */}
        </div>

        {/* Right */}
        <div className="col-span-5 space-y-2 overflow-y-auto">
          {/* Rockets (unchanged) */}
          {/* ... paste your original rockets panel here ... */}

          {/* Logs — now using core.tradeLogTail / eventLogTail */}
          <LogsPanel logs={logs} logHeight={logHeight} draggingLogs={draggingLogs} startLogDrag={startLogDrag} />
        </div>
      </div>
    </div>
  );
}
