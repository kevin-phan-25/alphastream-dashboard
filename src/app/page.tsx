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
  Shield,
  Target,
  Cpu,
  Network,
  Gauge,
  Radio,
  Binary,
  Rocket,
  ArrowUpFromLine,
  ArrowDownToLine
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

// Types (simplified for Mag7 + current services)
type RocketT = {
  symbol: string;
  gap?: string;
  price?: number | string;
  mlConfidence?: number;
};

type PositionT = {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
};

// Utils
function safeNum(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeToFixed(v: any, decimals = 2, fallback = '0.00'): string {
  const n = safeNum(v);
  return Number.isFinite(n) ? n.toFixed(decimals) : fallback;
}

// ML Hooks (matches your current simplified ML service)
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';

const useMLHealth = () => {
  const [health, setHealth] = useState<any>({ ok: false, ready: false });
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/health`, { timeout: 5000 });
        setHealth(res.data || { ok: false, ready: false });
      } catch {
        setHealth({ ok: false, ready: false });
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
        const res = await axios.get(`${ML_BASE}/metrics`, { timeout: 8000 });
        setMetrics(res.data || {});
      } catch {
        setMetrics({});
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 45000);
    return () => clearInterval(interval);
  }, []);
  return metrics;
};

// Header
const Header = memo(({
  universeSize,
  onScan,
  scanning,
  onPanic,
  panicClosing,
  onTestTrade,
  onForceScanAndTradeAll,
  positionSize,
  setPositionSize
}: any) => (
  <header className="shrink-0 bg-black/95 backdrop-blur border-b border-cyan-500/30 px-4 py-3 flex justify-between items-center flex-wrap gap-3">
    <div className="flex items-center gap-4">
      <div className="relative">
        <Bot className="w-9 h-9 text-cyan-400" />
        <Radio className="absolute -top-1 -right-1 w-4 h-4 text-emerald-400 animate-pulse" />
      </div>
      <div>
        <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          ALPHASTREAM
        </h1>
        <p className="text-xs text-emerald-400 tracking-[3px] font-mono">MAG7 PAPER TRADING • SAFE COMPOUNDING</p>
      </div>
    </div>

    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 bg-zinc-900 border border-cyan-700/50 rounded px-3 py-1">
        <span className="text-xs text-cyan-300">Size</span>
        <select
          value={positionSize}
          onChange={(e) => setPositionSize(Number(e.target.value))}
          className="bg-black text-white border border-cyan-600 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
        >
          {[1, 5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <button
        onClick={onTestTrade}
        className="px-5 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-xs font-bold rounded hover:brightness-110 transition-all flex items-center gap-2"
      >
        <Zap className="w-4 h-4" /> TEST TRADE
      </button>

      <button
        onClick={onPanic}
        disabled={panicClosing}
        className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-700 text-xs font-bold rounded hover:brightness-110 transition-all disabled:opacity-60 flex items-center gap-2"
      >
        {panicClosing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
        PANIC CLOSE
      </button>

      <button
        onClick={onScan}
        disabled={scanning}
        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-bold rounded hover:brightness-110 transition-all disabled:opacity-60 flex items-center gap-2"
      >
        {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
        {scanning ? 'SCANNING' : 'SCAN MAG7'}
      </button>

      <button
        onClick={onForceScanAndTradeAll}
        disabled={scanning}
        className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-xs font-bold rounded hover:brightness-110 transition-all disabled:opacity-60 flex items-center gap-2"
      >
        <Rocket className="w-4 h-4" /> FORCE ALL
      </button>
    </div>
  </header>
));

const LogsPanel = memo(({ logs, logHeight, draggingLogs, startLogDrag }: any) => (
  <div
    className={`bg-zinc-950 border border-cyan-500/30 rounded-lg p-4 font-mono text-xs overflow-hidden flex flex-col ${draggingLogs ? 'select-none' : ''}`}
    style={{ height: logHeight }}
  >
    <div className="flex items-center justify-between mb-3 text-cyan-400">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4" />
        LIVE LOGS ({logs.length})
      </div>
      <div className="text-[10px] text-gray-500">Mag7 Strategy</div>
    </div>

    <div className="flex-1 overflow-y-auto space-y-0.5 pr-2 text-gray-300" style={{ maxHeight: logHeight - 60 }}>
      {logs.length === 0 ? (
        <div className="text-center py-12 text-gray-600">Waiting for core activity...</div>
      ) : (
        logs.map((line: string, i: number) => (
          <div key={i} className="break-all leading-relaxed">{line}</div>
        ))
      )}
    </div>

    <div
      onMouseDown={startLogDrag}
      className="h-5 mt-2 border-t border-cyan-900 flex items-center justify-center cursor-row-resize hover:bg-cyan-950"
    >
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-8 h-0.5 bg-cyan-600/50 rounded" />
        ))}
      </div>
    </div>
  </div>
));

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
  const [logHeight, setLogHeight] = useState(280);
  const [draggingLogs, setDraggingLogs] = useState(false);
  const [globalPositionSize, setGlobalPositionSize] = useState(5);

  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(280);

  const mlHealth = useMLHealth();
  const mlMetrics = useMLMetrics();

  const addLogLine = useCallback((line: string) => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, `[${ts}] ${line}`].slice(-600));
  }, []);

  const coreRequest = useCallback(async (method: 'GET' | 'POST', path: string, body?: any) => {
    const url = `${CORE_BASE}${path.startsWith('/') ? path : '/' + path}`;
    return axios({
      method,
      url,
      data: body,
      headers: { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      timeout: method === 'POST' ? 60000 : 15000
    });
  }, [ADMIN_KEY]);

  const fetchCoreData = useCallback(async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/?universe=1`);
      const data = res.data || {};
      setCore(data);

      // Add core logs
      const rawLogs = Array.isArray(data.tradeLogTail) || Array.isArray(data.eventLogTail) 
        ? (data.tradeLogTail || data.eventLogTail) 
        : [];
      rawLogs.forEach((item: any) => {
        const line = typeof item === 'string' ? item : JSON.stringify(item);
        addLogLine(`[CORE] ${line}`);
      });

      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(`Core offline: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [addLogLine]);

  const forceScan = useCallback(async () => {
    setScanning(true);
    setMessage('Scanning Mag7 universe...');
    try {
      await coreRequest('POST', '/admin/scan', {});
      setTimeout(fetchCoreData, 3500);
      addLogLine('[DASHBOARD] Manual Mag7 scan triggered');
    } catch (e: any) {
      setMessage(`Scan failed: ${e.message}`);
    } finally {
      setScanning(false);
    }
  }, [coreRequest, fetchCoreData, addLogLine]);

  const panicCloseAll = useCallback(async () => {
    if (!window.confirm('⚠️ PANIC CLOSE: Close all positions and enable hard flat?')) return;
    setPanicClosing(true);
    try {
      await coreRequest('POST', '/admin/force-close', {});
      setMessage('All positions closed — HARD FLAT active');
      addLogLine('[DASHBOARD] Panic close executed');
      fetchCoreData();
    } catch (e: any) {
      setMessage(`Panic failed: ${e.message}`);
    } finally {
      setPanicClosing(false);
    }
  }, [coreRequest, fetchCoreData, addLogLine]);

  const forceScanAndTradeAll = useCallback(async () => {
    setMessage('Force scan + buy not yet wired — use individual rockets when available');
    addLogLine('[DASHBOARD] Force all buy requested (placeholder)');
  }, [addLogLine]);

  const forceTestTrade = useCallback(async () => {
    setMessage('Test PAPER trade triggered');
    addLogLine('[DASHBOARD] Test trade initiated');
    // You can expand this when you add the endpoint in core
  }, [addLogLine]);

  // Log drag
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
      setLogHeight(Math.max(160, Math.min(520, dragStartHeightRef.current + dy)));
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
    const interval = setInterval(fetchCoreData, 9000);
    return () => clearInterval(interval);
  }, [fetchCoreData]);

  const equity = safeNum(core.equity, 8000);
  const positions: PositionT[] = Array.isArray(core.positions) ? core.positions : [];
  const rockets: RocketT[] = Array.isArray(core.rockets) ? core.rockets : [];

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Binary className="w-12 h-12 mx-auto mb-4 text-cyan-400 animate-pulse" />
          <p className="text-cyan-400">Connecting to AlphaStream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-gray-100 overflow-hidden flex flex-col">
      <Header
        universeSize={safeNum(core.universeSize || core.KNOWN_UNIVERSE?.size, 7)}
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

      {message && (
        <div className="px-6 py-2.5 bg-gradient-to-r from-cyan-900 to-purple-900 text-sm border-b border-cyan-500/30">
          {message}
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left - Stats & Positions */}
        <div className="col-span-7 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-cyan-500/30 rounded-xl p-5 text-center">
              <Wallet className="w-8 h-8 mx-auto mb-3 text-cyan-400" />
              <div className="text-3xl font-bold text-cyan-300">${equity.toFixed(0)}</div>
              <div className="text-xs text-gray-400 mt-1">EQUITY</div>
            </div>

            <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-5 text-center">
              <Target className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
              <div className="text-3xl font-bold text-emerald-300">{positions.length}</div>
              <div className="text-xs text-gray-400 mt-1">POSITIONS</div>
            </div>

            <div className="bg-zinc-900 border border-purple-500/30 rounded-xl p-5 text-center col-span-2">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Cpu className="w-6 h-6 text-purple-400" />
                <span className="font-mono text-sm">ML STATUS</span>
              </div>
              <div className={`text-lg font-bold ${mlHealth.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {mlHealth.ok ? 'NEURAL ONLINE' : 'ML OFFLINE'}
              </div>
            </div>
          </div>

          {/* Positions */}
          <div className="bg-zinc-900 border border-cyan-500/30 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="font-semibold text-lg">Open Positions</p>
              <span className="text-xs text-gray-500">{positions.length} active</span>
            </div>
            {positions.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No open positions — Mag7 signals pending</div>
            ) : (
              <div className="space-y-3">
                {positions.map((p: PositionT) => (
                  <div key={p.symbol} className="flex justify-between items-center bg-black/40 px-5 py-3 rounded-xl">
                    <div>
                      <span className="font-mono text-cyan-300 text-lg">{p.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{safeNum(p.qty)} shares</div>
                      <div className="text-xs text-gray-400">@ ${safeToFixed(p.avgEntryPrice)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right - Rockets & Logs */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Rockets */}
          <div className="flex-1 bg-zinc-900 border border-cyan-500/30 rounded-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <p className="font-semibold text-lg flex items-center gap-2">
                <Rocket className="w-5 h-5 text-amber-400" /> Mag7 Rockets
              </p>
              <span className="text-xs bg-amber-900/60 px-3 py-1 rounded-full">{rockets.length}</span>
            </div>

            {rockets.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                No strong Mag7 signals right now<br />
                <span className="text-xs">Bot is waiting for high-confidence setups</span>
              </div>
            ) : (
              <div className="space-y-4">
                {rockets.map((r: RocketT) => (
                  <div key={r.symbol} className="bg-black/60 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-2xl font-bold text-amber-300">{r.symbol}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          ${safeNum(r.price).toFixed(2)} • Gap {r.gap || '—'}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-mono text-lg">
                          {safeNum(r.mlConfidence)}%
                        </div>
                        <div className="text-[10px] text-gray-500">CONFIDENCE</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logs */}
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
