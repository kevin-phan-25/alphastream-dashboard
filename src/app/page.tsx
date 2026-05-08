'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Bot, Activity, Loader2, AlertTriangle, Shield, Rocket, Lock, Unlock, TrendingUp
} from 'lucide-react';

const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

type Position = {
  symbol: string;
  qty: number;
  entry?: number;
  side?: 'long' | 'short';
};

type RocketSignal = {
  symbol: string;
  action?: string;
  confidence?: number;
  volatilityEstimate?: number;
  timestamp?: number;
  reason?: string;
};

export default function TradingBotDashboard() {
  const [core, setCore] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'trade' | 'ml'>('all');
  const [logHeight, setLogHeight] = useState(380);
  const [isScanning, setIsScanning] = useState(false);
  const [isFlattening, setIsFlattening] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);
  const [riskMult, setRiskMult] = useState(1);

  const dragRef = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(380);

  const safeNum = (v: any, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

  const addLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const icons: Record<string, string> = { error: '❌', warn: '⚠️', success: '✅', info: 'ℹ️' };
    setLogs(prev => [`[${time}] ${icons[type]} ${msg}`, ...prev].slice(0, 1500));
  }, []);

  const fetchCore = useCallback(async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/health`, { timeout: 8000 });
      setCore(res.data || {});
    } catch (e: any) {
      addLog(`Core unreachable: ${e.message}`, 'error');
    }
  }, [addLog]);

  const postCommand = async (endpoint: string, body = {}, successMsg: string) => {
    if (isLocked) {
      addLog("Command blocked - Account is locked", 'warn');
      return;
    }
    try {
      await axios.post(`${CORE_BASE}${endpoint}`, body, {
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY
        },
        timeout: 10000
      });
      addLog(successMsg, 'success');
      setTimeout(fetchCore, 1200);
    } catch (e: any) {
      console.error(e);
      if (e.response?.status === 403) {
        addLog("403 Forbidden - Check NEXT_PUBLIC_ADMIN_KEY in .env.local", 'error');
      } else {
        addLog(`Command failed: ${e.response?.data?.message || e.message}`, 'error');
      }
    }
  };

  // Commands
  const forceScan = async () => {
    setIsScanning(true);
    await postCommand('/admin/scan', {}, 'Manual market scan triggered');
    setIsScanning(false);
  };

  const panicFlat = async () => {
    if (!confirm('🚨 EMERGENCY: Close ALL positions right now? This cannot be undone.')) return;
    setIsFlattening(true);
    await postCommand('/admin/hard-flat', {}, 'PANIC FLAT EXECUTED — All positions closed');
    setIsFlattening(false);
  };

  const resetDrawdown = async () => {
    await postCommand('/admin/reset-drawdown', {}, '✅ Drawdown Reset Successfully');
  };

  const toggleHardFlat = () => {
    const newState = !core.hardFlat;
    postCommand('/admin/hard-flat', {},
      newState ? 'HARD FLAT ACTIVATED' : 'HARD FLAT DEACTIVATED');
  };

  const adjustRisk = (newMult: number) => {
    setRiskMult(newMult);
    postCommand('/admin/set-risk', { riskMultiplier: newMult },
      `Risk multiplier set to ${newMult}x`);
  };

  const toggleLock = () => {
    if (isLocked) {
      setIsLocked(false);
      setLockTimeLeft(0);
      addLog("Manual unlock performed", 'success');
    } else {
      setIsLocked(true);
      setLockTimeLeft(1800);
      addLog("Account manually locked", 'warn');
    }
  };

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = true;
    dragStartY.current = e.clientY;
    dragStartHeight.current = logHeight;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragRef.current) return;
    const delta = dragStartY.current - e.clientY;
    setLogHeight(Math.max(200, Math.min(650, dragStartHeight.current + delta)));
  };

  const handleMouseUp = () => { dragRef.current = false; };

  // Effects
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    fetchCore();
    const i = setInterval(fetchCore, 7000);
    return () => clearInterval(i);
  }, [fetchCore]);

  useEffect(() => {
    if (lockTimeLeft <= 0) {
      setIsLocked(false);
      return;
    }
    const t = setInterval(() => setLockTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [lockTimeLeft]);

  // Computed Values
  const equity = safeNum(core.equity);
  const peakEquity = safeNum(core.peakEquity);
  const drawdown = peakEquity > 0 ? ((peakEquity - equity) / peakEquity) * 100 : 0;
  const positions: Position[] = Array.isArray(core.positions) ? core.positions : [];
  const rockets: RocketSignal[] = Array.isArray(core.rockets) ? core.rockets : [];
  
  const winRateRaw = safeNum(core.recentWinRate);
  const winRate = (winRateRaw * 100).toFixed(0);
  const closedTradesCount = safeNum(core.closedTradesCount);

  const isInDanger = drawdown > 12;

  return (
    <div className="h-screen bg-zinc-950 text-gray-100 flex flex-col overflow-hidden">
      <header className="border-b border-zinc-800 bg-black px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Bot className="w-11 h-11 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-black tracking-tighter">ALPHASTREAM</h1>
            <p className="text-xs text-emerald-400 font-mono">MAG7 • LIVE PAPER TRADING BOT v4.3</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${isInDanger ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
            <div className={`w-3 h-3 rounded-full animate-pulse ${isInDanger ? 'bg-red-500' : 'bg-emerald-500'}`} />
            {isInDanger ? 'HIGH RISK' : 'SYSTEM HEALTHY'}
          </div>

          <button onClick={forceScan} disabled={isScanning} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 px-6 py-2.5 rounded-2xl font-medium disabled:opacity-60">
            {isScanning ? <Loader2 className="animate-spin" /> : <Activity />} SCAN MARKET
          </button>

          <button onClick={panicFlat} disabled={isFlattening} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-2xl font-medium disabled:opacity-60">
            {isFlattening ? <Loader2 className="animate-spin" /> : <AlertTriangle />} PANIC FLAT
          </button>

          <button onClick={resetDrawdown} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 px-6 py-2.5 rounded-2xl font-medium">
            <Unlock className="w-4 h-4" /> RESET DD
          </button>
        </div>
      </header>

      {isLocked && (
        <div className="bg-red-900/95 border-b border-red-600 px-6 py-3 flex items-center gap-3 text-red-100">
          <Lock className="w-5 h-5" />
          ACCOUNT LOCKED — Cooldown: {Math.floor(lockTimeLeft/60)}m {lockTimeLeft%60}s
          <button onClick={toggleLock} className="ml-auto underline text-sm">Unlock Manually</button>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Column */}
        <div className="col-span-8 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <div className="text-cyan-400 text-sm">EQUITY</div>
              <div className="text-4xl font-bold mt-3">${equity.toFixed(0)}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <div className="text-amber-400 text-sm">DRAWDOWN</div>
              <div className={`text-4xl font-bold mt-3 ${drawdown > 15 ? 'text-red-500' : ''}`}>{drawdown.toFixed(1)}%</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <div className="text-emerald-400 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> WIN RATE
              </div>
              <div className="text-4xl font-bold mt-3">{winRate}%</div>
              {closedTradesCount > 0 && (
                <p className="text-xs text-gray-500 mt-1">Last 20 trades</p>
              )}
            </div>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <div className="text-purple-400 text-sm">POSITIONS</div>
              <div className="text-4xl font-bold mt-3">{positions.length}/5</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <div className="text-sky-400 text-sm">RISK ×</div>
              <div className="text-4xl font-bold mt-3">{riskMult.toFixed(2)}x</div>
            </div>
          </div>

          {/* Open Positions */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" /> OPEN POSITIONS
            </h3>
            {positions.length === 0 ? (
              <p className="text-center py-16 text-gray-500">No open positions</p>
            ) : (
              <div className="space-y-3">
                {positions.map((pos, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/60 px-6 py-5 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-6">
                      <span className="text-2xl font-bold">{pos.symbol}</span>
                      <span className={`px-3 py-1 text-xs rounded-full ${pos.side === 'short' ? 'bg-red-900 text-red-400' : 'bg-emerald-900 text-emerald-400'}`}>
                        {pos.side?.toUpperCase() || 'LONG'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg">{pos.qty} shares</div>
                      {pos.entry && <div className="text-sm text-gray-400">@{pos.entry}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Fully Restored */}
        <div className="col-span-4 flex flex-col gap-4">
          {/* ML Rocket Signals */}
          <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 flex-1 flex flex-col">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-amber-400" /> ML ROCKET SIGNALS
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {rockets.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No strong signals yet...</div>
              ) : (
                rockets.map((r, i) => (
                  <div key={i} className="bg-zinc-950 border border-amber-500/20 p-5 rounded-xl">
                    <div className="flex justify-between">
                      <div>
                        <div className="text-xl font-bold">{r.symbol}</div>
                        <div className="text-xs text-gray-400">{r.reason || r.action}</div>
                      </div>
                      <div className="text-emerald-400 font-mono text-2xl">{r.confidence}%</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Controls */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4">
            <h3 className="font-medium">QUICK CONTROLS</h3>
           
            <div className="grid grid-cols-3 gap-3">
              <button onClick={toggleHardFlat} className="py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-sm font-medium">
                {core.hardFlat ? 'DISABLE HARD FLAT' : 'ENABLE HARD FLAT'}
              </button>
              <button onClick={resetDrawdown} className="py-4 bg-amber-600 hover:bg-amber-500 rounded-2xl text-sm font-medium">
                RESET DD
              </button>
              <button onClick={toggleLock} className="py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-sm font-medium flex items-center justify-center gap-2">
                {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isLocked ? 'UNLOCK' : 'LOCK'}
              </button>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">RISK MULTIPLIER</p>
              <div className="grid grid-cols-5 gap-2">
                {[0.3, 0.6, 1.0, 1.5, 2.0].map(m => (
                  <button
                    key={m}
                    onClick={() => adjustRisk(m)}
                    className={`py-3 rounded-xl text-sm ${riskMult === m ? 'bg-cyan-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                  >
                    {m}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden" style={{ height: logHeight }}>
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between text-sm">
              <span>LIVE LOGS</span>
              <div className="flex gap-1">
                {(['all','error','trade','ml'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    className={`px-3 py-1 text-xs rounded-full ${logFilter === f ? 'bg-cyan-600' : 'bg-zinc-800'}`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto text-xs font-mono text-gray-300 space-y-1">
              {logs.length === 0 ? "Waiting for bot activity..." : logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
            <div 
              onMouseDown={handleMouseDown} 
              className="h-6 border-t border-zinc-800 flex items-center justify-center cursor-row-resize hover:bg-zinc-900"
            >
              <div className="w-20 h-0.5 bg-zinc-600 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
