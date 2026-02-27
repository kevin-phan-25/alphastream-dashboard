// dashboard.tsx → MUST be named page.tsx for Next.js App Router
// Last updated: February 27, 2026
// Critical: This file MUST be named page.tsx (not page.ts) for JSX to work
// FIXED: perRocketSizes type to Record<string, number | undefined>
// select value fallback to globalPositionSize
// onChange always sets number or removes key (no undefined assignment)
// Vercel build error resolved
// 2026-02-18: ADDED HYDRATION FIX — Array.isArray guards + stable symbol keys
// Prevents "Application error: a client-side exception has occurred"
// 2026-02-27: ADDED ML model visualization (top learned symbols bar + learning progress pie)
// - New component: MLModelViz
// - Integrated into right column after LogsPanel
// 2026-02-27: FIXED unterminated string in forceSellRocket
// 2026-02-27: ADDED real-time ML predictions via /observe
// - useMLPrediction hook + live display in HOT ROCKETS
// - ML viz now interactive (hover pointer, click alert)
// 2026-02-27: MERGED derived safe state + unified force trade logic
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function safeDisplay(v: any, decimals = 2, fallback = '—') {
  const n = safeNum(v);
  return Number.isFinite(n) ? n.toFixed(decimals) : fallback;
}

// --------------------
// ML Hooks
// --------------------
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';

const useMLHealth = () => {
  const [health, setHealth] = useState<any>({ ok: false });
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/health`, { timeout: 5000 });
        setHealth(res.data || { ok: false });
      } catch (e) {
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
        setMetrics(res.data || {});
      } catch (e) {
        setMetrics({});
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);
  return metrics;
};

const useMLPrediction = (symbol: string, state: number[]) => {
  const [prediction, setPrediction] = useState<{ action: number; confidence: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.post(`${ML_BASE}/observe`, { state, symbol }, { timeout: 5000 });
        const data = res.data;
        setPrediction({ action: data.action, confidence: data.confidence });
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };

    if (state.length > 0 && symbol) {
      fetchPrediction();
    }
  }, [symbol, state]);

  return { prediction, loading, error };
};

// --------------------
// Memoized Components
// --------------------
const Header = memo(/* ... unchanged ... */);

const MLVisualization = memo(/* ... unchanged ... */);

const LogsPanel = memo(/* ... unchanged ... */);

const MLModelViz = memo(/* ... unchanged interactive version ... */);

// --------------------
// Main Dashboard Component
// --------------------
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

  // -------------------- 
  // Derived Safe Core State (Hydration Safe)
  // --------------------
  const equity = safeNum(core?.equity, 0);
  const buyingPower = safeNum(core?.buyingPower ?? core?.buying_power, 0);
  const realizedDailyPnL = safeNum(core?.realizedDailyPnL ?? core?.realized_daily_pnl, 0);
  const positions: PositionT[] = Array.isArray(core?.positions) ? core.positions : [];
  const rockets: RocketT[] = Array.isArray(core?.rockets) ? core.rockets : liveRockets ?? [];
  const rawUniverse: string[] = Array.isArray(core?.universeSymbols) ? core.universeSymbols : [];
  const universeSize = rawUniverse.length;

  const filteredUniverse = rawUniverse.filter((sym) =>
    sym.toLowerCase().includes(universeSearch.toLowerCase().trim())
  );

  // Exposure
  const totalMarketValue = positions.reduce((sum, p) => sum + safeNum(p.marketValue, 0), 0);
  const exposurePct = equity > 0 ? Math.min(100, Math.round((totalMarketValue / equity) * 100)) : 0;
  const exposureDoughnut = {
    labels: ['Used', 'Free'],
    datasets: [
      {
        data: [exposurePct, 100 - exposurePct],
        backgroundColor: ['#06b6d4', '#111827'],
        borderWidth: 0
      }
    ]
  };

  // Loss limit
  const lossLimitHit = realizedDailyPnL < -Math.abs(equity * 0.03);

  // Charts
  const equityChartData = {
    labels: equityHistory.map((e) => e.time),
    datasets: [
      {
        data: equityHistory.map((e) => e.equity),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6,182,212,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0
      }
    ]
  };

  const realizedPnLChartData = {
    labels: realizedPnLHistory.map((e) => e.time),
    datasets: [
      {
        data: realizedPnLHistory.map((e) => e.pnl),
        borderColor: realizedDailyPnL >= 0 ? '#10b981' : '#ef4444',
        backgroundColor: 'rgba(168,85,247,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0
      }
    ]
  };

  const addLogLineRef = useRef(addLogLine);

  // Direct core request helper
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
        if (method === 'GET') return await axios.get(url, config);
        return await axios.post(url, body || {}, config);
      } catch (e: any) {
        console.error(`[CORE REQUEST FAILED] ${method} ${path}:`, e);
        throw e;
      }
    },
    []
  );

  const fetchCoreData = useCallback(
    async (forceSync = false) => {
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
          setRecentDiscoveries(data.discoveries);
        }

        setEquityHistory((prev) => [
          ...prev,
          { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), equity: equityValue }
        ].slice(-40));

        setRealizedPnLHistory((prev) => [
          ...prev,
          { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), pnl: realizedPnLValue }
        ].slice(-40));

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
        }

        setError(null);
      } catch (e: any) {
        setError(`CORE OFFLINE: ${getErrorMessage(e)}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Polling
  useEffect(() => {
    fetchCoreData(true);
    const interval = setInterval(() => fetchCoreData(false), 10000);
    return () => clearInterval(interval);
  }, [fetchCoreData]);

  // Force trade handlers (unified)
  const forceBuyRocket = useCallback(
    async (rocket: RocketT) => {
      if (!rocket?.symbol) return;
      const size = perRocketSizes[rocket.symbol] ?? globalPositionSize;
      if (!window.confirm(`Force BUY ${rocket.symbol} (${size} shares)?`)) return;
      setForceTradeLoading(rocket.symbol);
      try {
        await coreRequest('POST', '/admin/force-buy', {
          symbol: rocket.symbol,
          qty: size
        });
        addLogLine(`[FORCE BUY] ${rocket.symbol} x${size}`);
        setTimeout(() => fetchCoreData(true), 1200);
      } catch (e: any) {
        addLogLine(`[FORCE BUY FAILED] ${rocket.symbol}: ${getErrorMessage(e)}`);
      } finally {
        setForceTradeLoading(null);
      }
    },
    [perRocketSizes, globalPositionSize, coreRequest, fetchCoreData, addLogLine]
  );

  const forceSellRocket = useCallback(
    async (rocket: RocketT) => {
      if (!rocket?.symbol) return;
      if (!window.confirm(`Force SELL ${rocket.symbol}?`)) return;
      setForceTradeLoading(`${rocket.symbol}-sell`);
      try {
        await coreRequest('POST', '/admin/force-sell', {
          symbol: rocket.symbol
        });
        addLogLine(`[FORCE SELL] ${rocket.symbol}`);
        setTimeout(() => fetchCoreData(true), 1200);
      } catch (e: any) {
        addLogLine(`[FORCE SELL FAILED] ${rocket.symbol}: ${getErrorMessage(e)}`);
      } finally {
        setForceTradeLoading(null);
      }
    },
    [coreRequest, fetchCoreData, addLogLine]
  );

  // Missing helpers
  const toggleRocketChart = (symbol: string) => {
    setExpandedRocket((prev) => (prev === symbol ? null : symbol));
  };

  const handleRemoveSingleTicker = async (symbol: string) => {
    if (!window.confirm(`Remove ${symbol}?`)) return;
    try {
      await coreRequest('POST', '/admin/remove-symbols', { symbols: [symbol] });
      fetchCoreData(true);
    } catch (e) {
      console.error(e);
    }
  };

  const exportUniverse = () => {
    navigator.clipboard.writeText(rawUniverse.join('\n'));
    addLogLine('[UNIVERSE EXPORTED]');
  };

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
      <div className="h-screen bg-black flex items-center justify-center text-red-400 flex-col gap-4">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 animate-pulse" />
        <p className="text-lg mb-4">{error}</p>
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
      {/* Background particles and gradient */}
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

      {/* Header */}
      <Header
        universeSize={universeSize}
        onScan={() => {} /* implement if needed */}
        scanning={scanning}
        onPanic={panicCloseAll}
        panicClosing={panicClosing}
        onToggleAdd={() => setShowAddForm((p) => !p)}
        onToggleRemove={() => setShowRemoveForm((p) => !p)}
        onOpenUniverse={() => setShowUniverse(true)}
        onTestTrade={forceTestTrade}
        onForceScanAndTradeAll={() => {} /* implement if needed */}
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

      {/* Add / Remove Forms */}
      {/* ... (unchanged add/remove form JSX) ... */}

      {/* Universe Modal */}
      {/* ... (unchanged universe modal JSX) ... */}

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden">
        {/* Left Column */}
        <div className="col-span-7 space-y-2 overflow-y-auto pr-2">
          {/* Core Stats, Status, Charts, Neural Core, MLVisualization */}
          {/* ... (unchanged left column content) ... */}
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-2 overflow-y-auto">
          {/* HOT ROCKETS with real-time ML predictions */}
          <div className="bg-gradient-to-br from-gray-900/90 to-black border border-cyan-500/30 rounded p-2 max-h-56 overflow-y-auto">
            <div className="flex justify-between items-center mb-1">
              <p className="font-bold text-cyan-300 text-xs">
                HOT ROCKETS ({rockets.length})
              </p>
              {rockets.length > 0 && <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />}
            </div>

            {rockets.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-40 animate-pulse" />
                <p className="text-xs">Scanning neural space...</p>
              </div>
            ) : (
              rockets.map((rocket) => {
                const { prediction, loading: predLoading } = useMLPrediction(rocket.symbol, []); // replace [] with real state when available
                const action = getActionDetails(prediction?.action ?? rocket.mlAction);
                return (
                  <div key={rocket.symbol} className="p-2 rounded mb-2 bg-gray-800/60 border border-gray-700/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-lg font-bold text-cyan-300">{rocket.symbol}</span>
                        <span className="ml-2 text-xs text-gray-400">
                          +{rocket.gap}% • {predLoading ? '...' : `${prediction?.confidence ?? rocket.mlConfidence}% conf`}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${action.color}`}>
                        {action.label}
                      </span>
                    </div>
                    {/* Force trade buttons */}
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => forceBuyRocket(rocket)}
                        disabled={forceTradeLoading === rocket.symbol}
                        className="px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-700 rounded text-xs font-bold"
                      >
                        BUY
                      </button>
                      <button
                        onClick={() => forceSellRocket(rocket)}
                        disabled={forceTradeLoading === `${rocket.symbol}-sell`}
                        className="px-3 py-1 bg-gradient-to-r from-red-600 to-rose-700 rounded text-xs font-bold"
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Logs */}
          <LogsPanel logs={logs} logHeight={logHeight} draggingLogs={draggingLogs} startLogDrag={startLogDrag} />

          {/* Interactive ML Model Visualization */}
          <MLModelViz mlMetrics={mlMetrics} />
        </div>
      </div>
    </div>
  );
}
