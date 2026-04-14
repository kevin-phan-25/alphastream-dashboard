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
  Bot,
  TrendingUp,
  AlertTriangle,
  Clock,
  Shield,
  Target,
  Cpu,
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

// Types
type RocketT = {
  symbol: string;
  price?: number | string;
  mlConfidence?: number;
  gap?: string;
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

const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';

const Dashboard = () => {
  const [core, setCore] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [logHeight, setLogHeight] = useState(280);
  const [draggingLogs, setDraggingLogs] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [panicClosing, setPanicClosing] = useState(false);

  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(280);

  // ML Status
  const [mlHealth, setMlHealth] = useState({ ok: false, ready: false });

  const addLogLine = useCallback((line: string) => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [`[${ts}] ${line}`, ...prev].slice(0, 600));
  }, []);

  const coreRequest = useCallback(async (method: 'GET' | 'POST', path: string, body?: any) => {
    const url = `${CORE_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
    try {
      const res = await axios({
        method,
        url,
        data: body,
        timeout: 45000,
      });
      return res;
    } catch (e: any) {
      addLogLine(`[CORE ERROR] ${method} ${path} → ${e.message}`);
      throw e;
    }
  }, [addLogLine]);

  const fetchCoreData = useCallback(async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/?universe=1`, { timeout: 10000 });
      setCore(res.data || {});
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      addLogLine(`[CORE FETCH FAILED] ${e.message}`);
    }
  }, [addLogLine]);

  const forceTestTrade = useCallback(async () => {
    try {
      addLogLine('[DASHBOARD] Triggering test PAPER trade on NVDA...');
      const res = await coreRequest('POST', '/admin/force-test-trade', {});
      addLogLine(`[TEST-TRADE] ${res.data?.message || 'Success'}`);
      setTimeout(fetchCoreData, 3000);
    } catch (e: any) {
      addLogLine(`[TEST-TRADE FAILED] ${e.message}`);
    }
  }, [coreRequest, fetchCoreData, addLogLine]);

  const panicCloseAll = useCallback(async () => {
    if (!confirm('PANIC CLOSE: Close ALL positions? This cannot be undone.')) return;
    setPanicClosing(true);
    try {
      await coreRequest('POST', '/admin/force-close', {});
      addLogLine('[DASHBOARD] Panic close executed — all positions closed');
      fetchCoreData();
    } catch (e: any) {
      addLogLine(`[PANIC FAILED] ${e.message}`);
    } finally {
      setPanicClosing(false);
    }
  }, [coreRequest, fetchCoreData, addLogLine]);

  const forceScan = useCallback(async () => {
    setScanning(true);
    try {
      await coreRequest('POST', '/admin/scan', {});
      addLogLine('[DASHBOARD] Manual Mag7 scan triggered');
      setTimeout(fetchCoreData, 4000);
    } catch (e: any) {
      addLogLine(`[SCAN FAILED] ${e.message}`);
    } finally {
      setScanning(false);
    }
  }, [coreRequest, fetchCoreData, addLogLine]);

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
      setLogHeight(Math.max(180, Math.min(520, dragStartHeightRef.current + dy)));
    };
    const onUp = () => setDraggingLogs(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingLogs]);

  // Fetch core data
  useEffect(() => {
    fetchCoreData();
    const interval = setInterval(fetchCoreData, 8000);
    return () => clearInterval(interval);
  }, [fetchCoreData]);

  // ML Health
  useEffect(() => {
    const fetchMLHealth = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/health`, { timeout: 5000 });
        setMlHealth(res.data || { ok: false, ready: false });
      } catch {
        setMlHealth({ ok: false, ready: false });
      }
    };
    fetchMLHealth();
    const i = setInterval(fetchMLHealth, 30000);
    return () => clearInterval(i);
  }, []);

  const equity = safeNum(core.equity, 8000);
  const positions: PositionT[] = Array.isArray(core.positions) ? core.positions : [];
  const rockets: RocketT[] = Array.isArray(core.rockets) ? core.rockets : [];

  return (
    <div className="h-screen bg-black text-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-black/95 border-b border-cyan-500/30 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Bot className="w-10 h-10 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-cyan-300">ALPHASTREAM</h1>
            <p className="text-xs text-emerald-400 font-mono">MAG7 PAPER • $8K AGGRESSIVE MODE</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-cyan-300">${equity.toFixed(0)}</div>
            <div className="text-xs text-gray-400">EQUITY</div>
          </div>

          <button
            onClick={forceTestTrade}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-xl text-sm font-bold hover:brightness-110 flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> TEST TRADE (NVDA)
          </button>

          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-sm font-bold hover:brightness-110 flex items-center gap-2 disabled:opacity-60"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            SCAN MAG7
          </button>

          <button
            onClick={panicCloseAll}
            disabled={panicClosing}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 rounded-xl text-sm font-bold hover:brightness-110 flex items-center gap-2 disabled:opacity-60"
          >
            {panicClosing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            PANIC CLOSE ALL
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Column - Stats + Positions */}
        <div className="col-span-7 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-cyan-500/30 rounded-2xl p-6 text-center">
              <Wallet className="w-8 h-8 mx-auto mb-3 text-cyan-400" />
              <div className="text-4xl font-bold text-cyan-300">${equity.toFixed(0)}</div>
              <div className="text-xs text-gray-400 mt-1">EQUITY</div>
            </div>

            <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
              <div className="text-4xl font-bold text-emerald-300">{positions.length}</div>
              <div className="text-xs text-gray-400 mt-1">POSITIONS</div>
            </div>

            <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 text-center">
              <Cpu className="w-8 h-8 mx-auto mb-3 text-purple-400" />
              <div className={`text-xl font-bold ${mlHealth.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {mlHealth.ok ? 'ML ONLINE' : 'ML OFFLINE'}
              </div>
            </div>
          </div>

          {/* Open Positions */}
          <div className="bg-zinc-900 border border-cyan-500/30 rounded-2xl p-6">
            <p className="font-semibold mb-4">Open Positions</p>
            {positions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No open positions</div>
            ) : (
              <div className="space-y-3">
                {positions.map((p: PositionT) => (
                  <div key={p.symbol} className="flex justify-between bg-black/60 px-5 py-4 rounded-xl">
                    <div>
                      <span className="font-mono text-lg text-cyan-300">{p.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div>{safeNum(p.qty)} shares</div>
                      <div className="text-xs text-gray-400">@ ${safeToFixed(p.avgEntryPrice)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Rockets + Logs */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Rockets */}
          <div className="flex-1 bg-zinc-900 border border-cyan-500/30 rounded-2xl p-6 overflow-y-auto">
            <div className="flex justify-between mb-5">
              <p className="font-semibold text-lg flex items-center gap-2">
                <Rocket className="w-5 h-5 text-amber-400" /> Mag7 Rockets
              </p>
              <span className="text-xs px-3 py-1 bg-amber-900/60 rounded-full">{rockets.length}</span>
            </div>

            {rockets.length === 0 ? (
              <div className="text-center py-20 text-gray-500">Waiting for signals...</div>
            ) : (
              <div className="space-y-4">
                {rockets.map((r: RocketT) => (
                  <div key={r.symbol} className="bg-black/60 border border-amber-500/30 rounded-xl p-5">
                    <div className="flex justify-between">
                      <div className="text-2xl font-bold text-amber-300">{r.symbol}</div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-mono">{safeNum(r.mlConfidence)}%</div>
                        <div className="text-xs text-gray-500">CONFIDENCE</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      ${safeNum(r.price).toFixed(2)} • Gap {r.gap || '—'}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="bg-zinc-950 border border-cyan-500/30 rounded-2xl p-5 font-mono text-xs flex flex-col" style={{ height: logHeight }}>
            <div className="flex justify-between mb-3 text-cyan-400">
              <div>LIVE LOGS ({logs.length})</div>
              <div className="text-[10px] text-gray-500">Mag7 Strategy</div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-0.5 pr-2 text-gray-300" style={{ maxHeight: logHeight - 60 }}>
              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-600">Waiting for activity...</div>
              ) : (
                logs.map((line: string, i: number) => <div key={i} className="break-all">{line}</div>)
              )}
            </div>
            <div 
              onMouseDown={(e) => {
                e.preventDefault();
                setDraggingLogs(true);
                dragStartYRef.current = e.clientY;
                dragStartHeightRef.current = logHeight;
              }}
              className="h-5 mt-2 border-t border-cyan-900 flex items-center justify-center cursor-row-resize hover:bg-cyan-950"
            >
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-8 h-0.5 bg-cyan-600/50 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
