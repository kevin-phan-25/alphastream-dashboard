'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Zap,
  Activity,
  Loader2,
  AlertTriangle,
  Wallet,
  Bot,
  Target,
  Cpu,
  Rocket,
  Shield,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';

const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';

type PositionT = {
  symbol: string;
  qty: number;
  entry?: number;
  avgEntryPrice?: number;
  side?: string;
  bestProfitPct?: number;
};

type RocketT = {
  symbol: string;
  confidence?: number;
  volatilityEstimate?: number;
  timestamp?: number;
};

function safeNum(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeToFixed(v: any, decimals = 2): string {
  const n = safeNum(v);
  return Number.isFinite(n) ? n.toFixed(decimals) : '0.00';
}

export default function Dashboard() {
  const [core, setCore] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [logHeight, setLogHeight] = useState(320);
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [panicClosing, setPanicClosing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  const dragStartY = useRef(0);
  const dragStartHeight = useRef(320);

  const [mlHealth, setMlHealth] = useState({ ok: false, ready: false });

  const addLog = useCallback((message: string, type: 'info' | 'warn' | 'error' = 'info') => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✓';
    setLogs(prev => [`[${ts}] ${prefix} ${message}`, ...prev].slice(0, 1000));
  }, []);

  const coreRequest = useCallback(async (method: 'GET' | 'POST', path: string, body?: any) => {
    if (isLocked) {
      addLog("Action blocked — Account is in cooldown (403)", 'warn');
      return null;
    }

    try {
      const res = await axios({
        method,
        url: `${CORE_BASE}${path.startsWith('/') ? '' : '/'}${path}`,
        data: body,
        timeout: 45000,
      });
      return res;
    } catch (e: any) {
      const msg = e.response?.data?.error || e.message || 'Request failed';
      addLog(`${method} ${path} → ${msg}`, 'error');

      if (e.response?.status === 403 || msg.toLowerCase().includes('403') || msg.toLowerCase().includes('locked')) {
        setIsLocked(true);
        setLockCountdown(3600); // 60 minutes
      }
      throw e;
    }
  }, [addLog, isLocked]);

  const fetchCoreData = useCallback(async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/health`, { timeout: 10000 });
      setCore(res.data || {});
    } catch (e) {
      addLog(`Failed to fetch core status: ${e.message}`, 'error');
    }
  }, [addLog]);

  // Force Flat (Panic Close)
  const panicCloseAll = useCallback(async () => {
    if (isLocked || !confirm('PANIC CLOSE: Close ALL positions immediately?')) return;

    setPanicClosing(true);
    try {
      await coreRequest('POST', '/force-flat', {});
      addLog('Emergency flat executed — All positions closed', 'error');
      fetchCoreData();
    } catch (e: any) {
      addLog(`Panic close failed: ${e.message}`, 'error');
    } finally {
      setPanicClosing(false);
    }
  }, [coreRequest, fetchCoreData, addLog, isLocked]);

  // Manual Scan
  const forceScan = useCallback(async () => {
    if (isLocked) return;
    setScanning(true);
    try {
      await coreRequest('POST', '/scan', {});
      addLog('Manual scan triggered');
      setTimeout(fetchCoreData, 3000);
    } catch (e: any) {
      addLog(`Scan failed: ${e.message}`, 'error');
    } finally {
      setScanning(false);
    }
  }, [coreRequest, fetchCoreData, addLog, isLocked]);

  // Test Trade (for debugging)
  const forceTestTrade = useCallback(async () => {
    if (isLocked) return;
    try {
      addLog('Triggering test PAPER trade on NVDA...');
      // Note: You may need to add this endpoint in admin.js if not present
      await coreRequest('POST', '/admin/force-test-trade', { symbol: 'NVDA', qty: 5 });
      fetchCoreData();
    } catch (e) {
      addLog('Test trade request sent (check logs)', 'warn');
    }
  }, [coreRequest, fetchCoreData, addLog, isLocked]);

  // Auto-refresh
  useEffect(() => {
    fetchCoreData();
    const interval = setInterval(fetchCoreData, 8000);
    return () => clearInterval(interval);
  }, [fetchCoreData]);

  // ML Health
  useEffect(() => {
    const checkML = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/health`, { timeout: 8000 });
        setMlHealth(res.data || { ok: false });
      } catch {
        setMlHealth({ ok: false, ready: false });
      }
    };
    checkML();
    const i = setInterval(checkML, 30000);
    return () => clearInterval(i);
  }, []);

  // Lock countdown
  useEffect(() => {
    if (!isLocked || lockCountdown <= 0) return;
    const timer = setInterval(() => {
      setLockCountdown(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked, lockCountdown]);

  // Auto-detect lock from logs
  useEffect(() => {
    const hasLockSignal = logs.slice(0, 10).some(l => 
      l.includes('403') || l.includes('locked') || l.includes('forbidden')
    );
    if (hasLockSignal && !isLocked) {
      setIsLocked(true);
      setLockCountdown(3600);
    }
  }, [logs, isLocked]);

  const equity = safeNum(core.equity);
  const peakEquity = safeNum(core.peakEquity);
  const drawdown = peakEquity > 0 ? ((peakEquity - equity) / peakEquity) * 100 : 0;
  const positions: PositionT[] = Array.isArray(core.positions) ? core.positions : [];
  const rockets: RocketT[] = Array.isArray(core.rockets) ? core.rockets : [];

  const isHealthy = core.status === 'ready' || core.ok === true;

  return (
    <div className="h-screen bg-black text-gray-100 flex flex-col overflow-hidden font-mono">
      {/* Header */}
      <header className="shrink-0 bg-zinc-950 border-b border-cyan-500/30 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Bot className="w-9 h-9 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-cyan-300">ALPHASTREAM</h1>
            <p className="text-xs text-emerald-400">MAG7 PAPER TRADER • v4.0 PROFIT-FIRST</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-3xl font-bold text-cyan-300">${equity.toFixed(0)}</div>
            <div className="text-xs text-gray-500">EQUITY</div>
          </div>

          <button
            onClick={forceTestTrade}
            disabled={isLocked}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> TEST TRADE
          </button>

          <button
            onClick={forceScan}
            disabled={scanning || isLocked}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
          >
            {scanning ? <Loader2 className="animate-spin w-4 h-4" /> : <Activity className="w-4 h-4" />}
            FORCE SCAN
          </button>

          <button
            onClick={panicCloseAll}
            disabled={panicClosing || isLocked}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
          >
            {panicClosing ? <Loader2 className="animate-spin w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            PANIC FLAT
          </button>
        </div>
      </header>

      {/* Lock Banner */}
      {isLocked && (
        <div className="mx-4 mt-4 bg-red-950 border border-red-600 text-red-100 p-4 rounded-2xl flex items-center gap-4">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <div className="font-bold">Account temporarily locked (403)</div>
            <div className="text-sm mt-1">
              Cooldown remaining: <span className="font-mono font-bold">
                {Math.floor(lockCountdown / 60)}:{(lockCountdown % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Column - Main Info */}
        <div className="col-span-7 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-cyan-500/30 rounded-2xl p-6">
              <Wallet className="w-8 h-8 text-cyan-400 mb-3" />
              <div className="text-4xl font-bold text-cyan-300">${equity.toFixed(0)}</div>
              <div className="text-sm text-gray-400 mt-1">CURRENT EQUITY</div>
            </div>

            <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6">
              <Target className="w-8 h-8 text-emerald-400 mb-3" />
              <div className="text-4xl font-bold text-emerald-300">{positions.length}/3</div>
              <div className="text-sm text-gray-400 mt-1">POSITIONS</div>
            </div>

            <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-6">
              <Cpu className="w-8 h-8 text-purple-400 mb-3" />
              <div className={`text-2xl font-bold ${mlHealth.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {mlHealth.ok ? '● ONLINE' : '○ OFFLINE'}
              </div>
              <div className="text-sm text-gray-400 mt-1">ML ENGINE</div>
            </div>

            <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-6">
              <TrendingUp className="w-8 h-8 text-amber-400 mb-3" />
              <div className="text-3xl font-bold text-amber-300">{safeToFixed(core.riskMultiplier || 0.45)}</div>
              <div className="text-sm text-gray-400 mt-1">RISK MULTIPLIER</div>
            </div>
          </div>

          {/* Drawdown Indicator */}
          <div className={`p-6 rounded-2xl border ${drawdown > 12 ? 'border-red-500 bg-red-950/50' : 'border-amber-500/30 bg-zinc-900'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {drawdown > 12 ? <TrendingDown className="w-6 h-6 text-red-400" /> : <TrendingUp className="w-6 h-6 text-amber-400" />}
                <span className="font-semibold">Drawdown</span>
              </div>
              <span className={`text-3xl font-bold ${drawdown > 15 ? 'text-red-400' : 'text-amber-400'}`}>
                {drawdown.toFixed(2)}%
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">Peak: ${peakEquity.toFixed(0)}</div>
          </div>

          {/* Open Positions */}
          <div className="bg-zinc-900 border border-cyan-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" /> Open Positions
              </p>
              <span className="text-xs bg-zinc-800 px-3 py-1 rounded-full">{positions.length} / 3</span>
            </div>

            {positions.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No open positions • Scanner active</div>
            ) : (
              <div className="space-y-3">
                {positions.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/70 px-6 py-4 rounded-xl border border-zinc-700">
                    <div>
                      <span className="text-xl font-bold text-cyan-300">{p.symbol}</span>
                      <span className="ml-4 text-xs uppercase tracking-widest text-gray-500">
                        {p.side || 'LONG'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div>{safeNum(p.qty)} shares</div>
                      <div className="text-xs text-gray-400">
                        @ ${safeToFixed(p.entry || p.avgEntryPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Rockets / Signals */}
          <div className="flex-1 bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 overflow-y-auto">
            <div className="flex justify-between mb-4">
              <p className="font-semibold flex items-center gap-2">
                <Rocket className="w-5 h-5 text-amber-400" /> ML Rockets
              </p>
              <span className="text-xs px-3 py-1 bg-amber-900/50 rounded-full">{rockets.length}</span>
            </div>

            {rockets.length === 0 ? (
              <div className="text-center py-20 text-gray-500">Waiting for high-confidence signals...</div>
            ) : (
              <div className="space-y-4">
                {rockets.map((r, i) => (
                  <div key={i} className="bg-zinc-950 border border-amber-500/20 rounded-xl p-5">
                    <div className="flex justify-between">
                      <div className="text-2xl font-bold text-amber-300">{r.symbol}</div>
                      <div className="text-emerald-400 font-mono">
                        {safeNum(r.confidence)}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Vol: {(safeNum(r.volatilityEstimate) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Logs */}
          <div 
            className="bg-zinc-950 border border-cyan-500/30 rounded-2xl flex flex-col overflow-hidden"
            style={{ height: logHeight }}
          >
            <div className="p-4 border-b border-cyan-900 flex justify-between text-cyan-400 text-sm">
              <div>LIVE SYSTEM LOGS</div>
              <div className="text-xs text-gray-500">Real-time • v4.0</div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto text-xs text-gray-300 space-y-1 font-light">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-600">Bot running • Logs will appear here...</div>
              ) : (
                logs.map((line, i) => <div key={i} className="break-all">{line}</div>)
              )}
            </div>

            {/* Resize Handle */}
            <div
              onMouseDown={(e) => {
                setDragging(true);
                dragStartY.current = e.clientY;
                dragStartHeight.current = logHeight;
              }}
              className="h-6 border-t border-cyan-900 flex items-center justify-center cursor-row-resize hover:bg-cyan-950/50"
            >
              <div className="w-12 h-0.5 bg-cyan-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
