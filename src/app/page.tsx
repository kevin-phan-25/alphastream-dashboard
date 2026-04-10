// src/app/page.tsx
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

// Types
type RocketT = {
  symbol: string;
  gap: string;
  price: number | string;
  mlConfidence: number;
  mlAction?: number;
};

type PositionT = {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
  marketValue?: number;
};

type MLSymbolMetric = { symbol: string; count: number };

// Utils
function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeToFixed(v: any, decimals = 4, fallback = '0.0000') {
  const n = safeNum(v);
  return Number.isFinite(n) ? n.toFixed(decimals) : fallback;
}

function safeDisplay(v: any, decimals = 2, fallback = '—') {
  const n = safeNum(v);
  return Number.isFinite(n) ? n.toFixed(decimals) : fallback;
}

// ML Hooks
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
        const res = await axios.get(`${ML_BASE}/metrics`, { timeout: 8000 });
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

// Memoized Components
const Header = memo(({ 
  universeSize, 
  onScan, 
  scanning, 
  onPanic, 
  panicClosing, 
  onOpenUniverse, 
  onTestTrade, 
  onForceScanAndTradeAll,
  positionSize,
  setPositionSize 
}: any) => (
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
        <p className="text-xs text-gray-500 tracking-widest">MAG7 PAPER MODE</p>
      </div>
      <button
        onClick={onOpenUniverse}
        className="flex items-center gap-1 px-2 py-1 bg-cyan-900/40 border border-cyan-700/50 rounded text-xs cursor-pointer hover:bg-cyan-800/60"
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

      <button onClick={onTestTrade} className="px-4 py-1.5 bg-gradient-to-r from-yellow-600 to-orange-700 rounded text-xs font-bold hover:brightness-110">TEST TRADE</button>
      <button onClick={onPanic} disabled={panicClosing} className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-pink-700 rounded text-xs font-bold hover:brightness-110 disabled:opacity-50">PANIC CLOSE</button>
      <button onClick={onScan} disabled={scanning} className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded text-xs font-bold hover:brightness-110 disabled:opacity-50">{scanning ? 'SCANNING...' : 'SCAN'}</button>
      <button onClick={onForceScanAndTradeAll} disabled={scanning} className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-rose-700 rounded text-xs font-bold hover:brightness-110 disabled:opacity-50">FORCE ALL BUY</button>
    </div>
  </header>
));

const MLVisualization = memo(({ mlMetrics }: { mlMetrics: any }) => {
  const topSymbols = useMemo(() => (mlMetrics?.topSymbols || []).slice(0, 10), [mlMetrics]);
  return (
    <div className="bg-gradient-to-r from-purple-900/50 via-cyan-900/30 to-black border border-purple-500/40 rounded p-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        <span className="font-bold text-purple-300">TOP LEARNED SYMBOLS</span>
      </div>
      {topSymbols.length > 0 ? (
        <p className="text-sm text-gray-400">Learning signals active on Mag7 stocks</p>
      ) : (
        <p className="text-center text-gray-500 text-xs py-8">Waiting for first feedback...</p>
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
    >
      <div className="flex gap-1 opacity-80">
        <div className="w-10 h-0.5 bg-cyan-500/60 rounded" />
        <div className="w-10 h-0.5 bg-cyan-500/30 rounded" />
        <div className="w-10 h-0.5 bg-cyan-500/60 rounded" />
      </div>
    </div>
  </div>
));

// Main Dashboard
export default function Dashboard() {
  const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
  const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'default-admin-key-for-testing';

  const [core, setCore] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [panicClosing, setPanicClosing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [logHeight, setLogHeight] = useState(256);
  const [draggingLogs, setDraggingLogs] = useState(false);
  const [globalPositionSize, setGlobalPositionSize] = useState(1);
  const [perRocketSizes, setPerRocketSizes] = useState<Record<string, number>>({});

  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(256);

  const mlHealth = useMLHealth();
  const mlMetrics = useMLMetrics();

  const addLogLine = useCallback((line: string) => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => {
      const updated = [...prev, `[${ts}] ${line}`];
      return updated.slice(-500);
    });
  }, []);

  const coreRequest = useCallback(async (method: 'GET' | 'POST', path: string, body?: any) => {
    const url = `${CORE_BASE}${path.startsWith('/') ? path : '/' + path}`;
    const res = await axios({
      method,
      url,
      data: body,
      headers: { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      timeout: method === 'POST' ? 90000 : 20000
    });
    return res;
  }, []);

  const fetchCoreData = useCallback(async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/?universe=1`);
      const data = res.data || {};
      setCore(data);

      if (Array.isArray(data.rockets)) {
        // rockets handled in liveRockets if needed
      }

      const rawLogs = Array.isArray(data.tradeLogTail) ? data.tradeLogTail : [];
      rawLogs.forEach((logItem: any) => {
        let line = typeof logItem === 'string' ? logItem : JSON.stringify(logItem);
        addLogLine(`[CORE] ${line}`);
      });

      setError(null);
    } catch (e: any) {
      setError(`CORE OFFLINE: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [addLogLine]);

  // Force scan
  const forceScan = useCallback(async () => {
    setScanning(true);
    setMessage('Triggering scan...');
    try {
      await coreRequest('POST', '/admin/scan', {});
      setTimeout(() => fetchCoreData(), 4000);
    } catch (e) {
      setMessage(`Scan failed: ${e}`);
    } finally {
      setScanning(false);
    }
  }, [coreRequest, fetchCoreData]);

  const panicCloseAll = useCallback(async () => {
    if (!window.confirm('PANIC CLOSE all positions?')) return;
    setPanicClosing(true);
    try {
      await coreRequest('POST', '/admin/force-close', {});
      setMessage('All positions closed');
      fetchCoreData();
    } catch (e) {
      setMessage(`Panic failed: ${e}`);
    } finally {
      setPanicClosing(false);
    }
  }, [coreRequest, fetchCoreData]);

  const forceScanAndTradeAll = useCallback(async () => {
    // Placeholder - implement if you have the endpoint
    setMessage('Force all buy coming soon...');
  }, []);

  const forceTestTrade = useCallback(async () => {
    setMessage('Test trade triggered (paper)');
    // Add your test trade logic here if available
  }, []);

  // Log drag handler
  const startLogDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingLogs(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = logHeight;
  }, [logHeight]);

  useEffect(() => {
    if (!draggingLogs) return;
    const onMove = (e: MouseEvent) => {
      const dy = e.clientY - dragStartYRef.current;
      const next = Math.max(140, Math.min(560, dragStartHeightRef.current + dy));
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
    fetchCoreData();
    const i = setInterval(fetchCoreData, 8000);
    return () => clearInterval(i);
  }, [fetchCoreData]);

  const equity = safeNum(core.equity, 0);
  const positions = Array.isArray(core.positions) ? core.positions : [];
  const rockets = Array.isArray(core.rockets) ? core.rockets : [];

  if (loading) {
    return <div className="h-screen bg-black flex items-center justify-center text-cyan-400">Loading AlphaStream Dashboard...</div>;
  }

  return (
    <div className="h-screen bg-black text-gray-100 overflow-hidden flex flex-col">
      <Header
        universeSize={safeNum(core.universeSize, 0)}
        onScan={forceScan}
        scanning={scanning}
        onPanic={panicCloseAll}
        panicClosing={panicClosing}
        onOpenUniverse={() => {}}
        onTestTrade={forceTestTrade}
        onForceScanAndTradeAll={forceScanAndTradeAll}
        positionSize={globalPositionSize}
        setPositionSize={setGlobalPositionSize}
      />

      {message && <div className="px-4 py-2 bg-cyan-900/70 text-center text-sm">{message}</div>}

      <div className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Column */}
        <div className="col-span-7 space-y-3 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-cyan-900/40 to-black border border-cyan-500/30 rounded p-4 text-center">
              <Wallet className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
              <div className="text-3xl font-bold text-cyan-300">${equity.toFixed(0)}</div>
              <div className="text-xs text-gray-400">Equity</div>
            </div>
            {/* Add more stat cards as needed */}
          </div>

          <div className="bg-gray-900/80 border border-cyan-500/30 rounded p-4">
            <p className="text-cyan-300 font-bold mb-2">POSITIONS ({positions.length})</p>
            {positions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No open positions</p>
            ) : (
              positions.map((p: any) => (
                <div key={p.symbol} className="flex justify-between py-1 border-b border-gray-800 text-sm">
                  <span>{p.symbol}</span>
                  <span>{safeNum(p.qty)} @ ${safeDisplay(p.avgEntryPrice)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Rockets & Logs */}
        <div className="col-span-5 space-y-3">
          <div className="bg-gray-900/80 border border-cyan-500/30 rounded p-4 max-h-80 overflow-y-auto">
            <p className="font-bold text-cyan-300 mb-3">HOT ROCKETS ({rockets.length})</p>
            {rockets.length === 0 ? (
              <p className="text-gray-500 text-center py-12">Waiting for Mag7 signals...</p>
            ) : (
              rockets.map((r: RocketT) => (
                <div key={r.symbol} className="bg-black/60 border border-cyan-700/50 rounded p-3 mb-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-cyan-300">{r.symbol}</span>
                    <span className="text-green-400">{r.mlConfidence}%</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Gap: {r.gap}% • Price: ${safeNum(r.price).toFixed(2)}</div>
                </div>
              ))
            )}
          </div>

          <LogsPanel 
            logs={logs} 
            logHeight={logHeight} 
            draggingLogs={draggingLogs} 
            startLogDrag={startLogDrag} 
          />
        </div>
      </div>
    </div>
  );
}
