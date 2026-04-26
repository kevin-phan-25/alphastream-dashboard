'use client';

/**
 * FILE: src/app/page.tsx (Dashboard)
 * DATE UPDATED: 2026-04-26
 * PURPOSE: Main control dashboard for MAG7 PAPER TRADER — fully synced with adaptive system
 */

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
  TrendingDown
} from 'lucide-react';

const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';

type RocketT = { 
  symbol: string; 
  price?: number | string; 
  mlConfidence?: number; 
  gap?: string; 
  volatility?: number;
};

type PositionT = { 
  symbol: string; 
  qty: number; 
  avgEntryPrice: number; 
  side?: string;
  entry?: number;
};

function safeNum(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeToFixed(v: any, decimals = 2, fallback = '0.00'): string {
  const n = safeNum(v);
  return Number.isFinite(n) ? n.toFixed(decimals) : fallback;
}

export default function Dashboard() {
  const [core, setCore] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [logHeight, setLogHeight] = useState(280);
  const [draggingLogs, setDraggingLogs] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [panicClosing, setPanicClosing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(280);

  const [mlHealth, setMlHealth] = useState({ ok: false, ready: false });

  const addLogLine = useCallback((line: string) => {
    const ts = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    setLogs(prev => [`[${ts}] ${line}`, ...prev].slice(0, 800));
  }, []);

  const coreRequest = useCallback(async (method: 'GET' | 'POST', path: string, body?: any) => {
    if (isLocked) {
      addLogLine(`[BLOCKED] Action skipped — account is locked (403)`);
      return null;
    }

    const url = `${CORE_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

    try {
      const res = await axios({ 
        method, 
        url, 
        data: body, 
        timeout: 45000 
      });
      return res;
    } catch (e: any) {
      const msg = e.response?.data?.error || e.message || 'Unknown error';
      addLogLine(`[CORE ERROR] ${method} ${path} → ${msg}`);
      
      if (e.response?.status === 403 || msg.includes("403") || msg.includes("locked")) {
        setIsLocked(true);
        setLockCountdown(3600); // 60 minutes
      }
      throw e;
    }
  }, [addLogLine, isLocked]);

  const fetchCoreData = useCallback(async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/?universe=1`, { timeout: 10000 });
      setCore(res.data || {});
    } catch (e: any) {
      addLogLine(`[CORE FETCH FAILED] ${e.message}`);
    }
  }, [addLogLine]);

  const forceTestTrade = useCallback(async () => {
    if (isLocked) return;
    try {
      addLogLine('[DASHBOARD] Triggering test PAPER trade on NVDA...');
      const res = await coreRequest('POST', '/admin/force-test-trade', {});
      
      if (res && res.data) {
        addLogLine(`[TEST-TRADE] ${res.data.message || 'Success'}`);
      } else {
        addLogLine(`[TEST-TRADE] Request sent`);
      }
      
      setTimeout(fetchCoreData, 3000);
    } catch (e: any) {
      addLogLine(`[TEST-TRADE FAILED] ${e.message}`);
    }
  }, [coreRequest, fetchCoreData, addLogLine, isLocked]);

  const panicCloseAll = useCallback(async () => {
    if (isLocked || !confirm('PANIC CLOSE: Close ALL positions? This cannot be undone.')) return;
    setPanicClosing(true);
    try {
      await coreRequest('POST', '/admin/force-close', {});
      addLogLine('[DASHBOARD] Panic close executed');
      fetchCoreData();
    } catch (e: any) {
      addLogLine(`[PANIC FAILED] ${e.message}`);
    } finally {
      setPanicClosing(false);
    }
  }, [coreRequest, fetchCoreData, addLogLine, isLocked]);

  const forceScan = useCallback(async () => {
    if (isLocked) return;
    setScanning(true);
    try {
      await coreRequest('POST', '/scan', {});
      addLogLine('[DASHBOARD] Manual Mag7 scan triggered');
      setTimeout(fetchCoreData, 4000);
    } catch (e: any) {
      addLogLine(`[SCAN FAILED] ${e.message}`);
    } finally {
      setScanning(false);
    }
  }, [coreRequest, fetchCoreData, addLogLine, isLocked]);

  // Auto-detect lock from logs
  useEffect(() => {
    const has403 = logs.slice(0, 15).some(line => 
      line.includes("403") || line.includes("locked") || line.includes("forbidden")
    );
    if (has403 && !isLocked) {
      setIsLocked(true);
      setLockCountdown(3600);
    }
  }, [logs, isLocked]);

  // Lock countdown timer
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

  // Fetch core data periodically
  useEffect(() => {
    fetchCoreData();
    const interval = setInterval(fetchCoreData, 7000);
    return () => clearInterval(interval);
  }, [fetchCoreData]);

  // ML Health
  useEffect(() => {
    const fetchMLHealth = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/health`, { timeout: 6000 });
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

  const riskMultiplier = safeNum(core.riskMultiplier, 1.0);
  const recentWinRate = safeNum(core.recentWinRate, 0);

  const minutesLeft = Math.floor(lockCountdown / 60);
  const secondsLeft = lockCountdown % 60;

  return (
    <div className="h-screen bg-black text-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-black/95 border-b border-cyan-500/30 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Bot className="w-10 h-10 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-cyan-300">ALPHASTREAM</h1>
            <p className="text-xs text-emerald-400 font-mono">MAG7 PAPER TRADER • ADAPTIVE ML + BRACKET (2026-04-26)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-cyan-300">${equity.toFixed(0)}</div>
            <div className="text-xs text-gray-400">EQUITY</div>
          </div>

          <button
            onClick={forceTestTrade}
            disabled={isLocked}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-xl text-sm font-bold hover:brightness-110 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" /> TEST TRADE (NVDA)
          </button>

          <button
            onClick={forceScan}
            disabled={scanning || isLocked}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-sm font-bold hover:brightness-110 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            FORCE SCAN
          </button>

          <button
            onClick={panicCloseAll}
            disabled={panicClosing || isLocked}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 rounded-xl text-sm font-bold hover:brightness-110 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {panicClosing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            PANIC CLOSE ALL
          </button>
        </div>
      </header>

      {/* Lock Banner */}
      {isLocked && (
        <div className="mx-4 mt-3 bg-red-900/90 border border-red-500 text-red-100 px-6 py-4 rounded-2xl flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-lg">Alpaca Paper Account is Temporarily Locked (403)</div>
            <div className="text-sm mt-1">
              Wait <span className="font-mono font-bold">
                {minutesLeft}:{secondsLeft < 10 ? '0' : ''}{secondsLeft}
              </span> minutes before trying any actions.
            </div>
            <div className="text-xs mt-2 opacity-75">The bot is in safe cooldown mode.</div>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Column */}
        <div className="col-span-7 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-4 gap-4">
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
              <div className="text-xs text-gray-400 mt-1">ML ENGINE</div>
            </div>

            <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-3 text-amber-400" />
              <div className="text-2xl font-bold text-amber-300">{riskMultiplier.toFixed(2)}x</div>
              <div className="text-xs text-gray-400 mt-1">RISK MULTIPLIER</div>
            </div>
          </div>

          {/* Open Positions */}
          <div className="bg-zinc-900 border border-cyan-500/30 rounded-2xl p-6">
            <p className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> Open Positions
            </p>
            {positions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No open positions • Scanner is ready</div>
            ) : (
              <div className="space-y-3">
                {positions.map((p: PositionT, index: number) => (
                  <div key={index} className="flex justify-between bg-black/60 px-5 py-4 rounded-xl border border-cyan-900/50">
                    <div>
                      <span className="font-mono text-lg text-cyan-300">{p.symbol}</span>
                      <span className="ml-3 text-xs uppercase tracking-widest text-gray-500">
                        {p.side || 'LONG'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{safeNum(p.qty)} shares</div>
                      <div className="text-xs text-gray-400">
                        @ ${safeToFixed(p.avgEntryPrice || p.entry)}
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
          {/* Rockets */}
          <div className="flex-1 bg-zinc-900 border border-cyan-500/30 rounded-2xl p-6 overflow-y-auto">
            <div className="flex justify-between mb-5">
              <p className="font-semibold text-lg flex items-center gap-2">
                <Rocket className="w-5 h-5 text-amber-400" /> Mag7 Rockets Detected
              </p>
              <span className="text-xs px-3 py-1 bg-amber-900/60 rounded-full">{rockets.length}</span>
            </div>
            {rockets.length === 0 ? (
              <div className="text-center py-20 text-gray-500">Waiting for strong ML signals...</div>
            ) : (
              <div className="space-y-4">
                {rockets.map((r: RocketT, index: number) => (
                  <div key={index} className="bg-black/60 border border-amber-500/30 rounded-xl p-5">
                    <div className="flex justify-between items-start">
                      <div className="text-2xl font-bold text-amber-300">{r.symbol}</div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-mono text-lg">{safeNum(r.mlConfidence)}%</div>
                        <div className="text-xs text-gray-500">CONFIDENCE</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      ${safeNum(r.price).toFixed(2)} • Gap {r.gap || '—'}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Logs */}
          <div className="bg-zinc-950 border border-cyan-500/30 rounded-2xl p-5 font-mono text-xs flex flex-col" style={{ height: logHeight }}>
            <div className="flex justify-between mb-3 text-cyan-400">
              <div>LIVE LOGS ({logs.length})</div>
              <div className="text-[10px] text-gray-500">Adaptive ML Strategy</div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-0.5 pr-2 text-gray-300" style={{ maxHeight: logHeight - 60 }}>
              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-600">Bot is running • Waiting for activity...</div>
              ) : (
                logs.map((line: string, i: number) => (
                  <div key={i} className="break-all leading-relaxed">{line}</div>
                ))
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
}
