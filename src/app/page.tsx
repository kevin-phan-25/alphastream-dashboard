'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Bot, Activity, Loader2, AlertTriangle, Shield, Rocket, Lock, Unlock, TrendingUp,
  Brain, RefreshCw, ArrowUp, ArrowDown 
} from 'lucide-react';

const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

type Position = {
  symbol: string;
  qty: number;
  entry?: number;
  side?: 'long' | 'short';
  unrealizedPl?: number;
};

type RocketSignal = {
  symbol: string;
  action?: string;
  confidence?: number;
  volatilityEstimate?: number;
  timestamp?: number;
  reason?: string;
};

type MLStatus = {
  entryModelReady: boolean;
  exitModelReady: boolean;
  exitBufferSize: number;
  entryBufferSize: number;
  lastSync?: string;
  trainingActive: boolean;
  version?: string;
};

export default function TradingBotDashboard() {
  const [core, setCore] = useState<any>({});
  const [mlStatus, setMlStatus] = useState<MLStatus>({
    entryModelReady: false,
    exitModelReady: false,
    exitBufferSize: 0,
    entryBufferSize: 0,
    trainingActive: false,
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'trade' | 'ml' | 'entry' | 'exit'>('all');
  const [logHeight, setLogHeight] = useState(380);
  const [isScanning, setIsScanning] = useState(false);
  const [isFlattening, setIsFlattening] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);
  const [riskMult, setRiskMult] = useState(1);
  const [isRefreshingML, setIsRefreshingML] = useState(false);
  const [mlError, setMlError] = useState<string>('');

  const dragRef = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(380);
  const [lastSeenTradeTs, setLastSeenTradeTs] = useState(0);   // ← New for polling

  const safeNum = (v: any, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

  const addLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const icons: Record<string, string> = { error: '❌', warn: '⚠️', success: '✅', info: 'ℹ️' };
    
    const upperMsg = msg.toUpperCase();
    let prefix = '';
    if (upperMsg.includes('ENTRY') || upperMsg.includes('LONG') || upperMsg.includes('BUY')) prefix = '📈 ENTRY ';
    if (upperMsg.includes('EXIT') || upperMsg.includes('SELL') || upperMsg.includes('CLOSE') || upperMsg.includes('STOP')) prefix = '📉 EXIT ';

    const logEntry = `[${time}] ${icons[type]} ${prefix}${msg}`;
    console.log(logEntry); // Debug in browser console
    setLogs(prev => [logEntry, ...prev].slice(0, 2000));
  }, []);

  const fetchCore = useCallback(async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/health`, { timeout: 10000 });
      setCore(res.data || {});
    } catch (e: any) {
      addLog(`Core unreachable: ${e.message}`, 'error');
    }
  }, [addLog]);

  const fetchMLStatus = useCallback(async () => {
    setIsRefreshingML(true);
    setMlError('');
    try {
      const res = await axios.get(`${ML_BASE}/ml/status`, { timeout: 15000 });
      
      if (res.data) {
        setMlStatus({
          entryModelReady: true,
          exitModelReady: true,
          exitBufferSize: safeNum(res.data.replayBuffers?.exit),
          entryBufferSize: safeNum(res.data.replayBuffers?.entry),
          lastSync: res.data.timestamp,
          trainingActive: !!res.data.trainingActive,
          version: res.data.version
        });
      }
    } catch (e: any) {
      const errorMsg = e.response?.status ? `HTTP ${e.response.status}` : e.message;
      setMlError(errorMsg);
      addLog(`ML Status failed: ${errorMsg}`, 'error');
    } finally {
      setIsRefreshingML(false);
    }
  }, [addLog]);

  // ====================== NEW: POLL RECENT TRADES ======================
  const fetchRecentTrades = useCallback(async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/admin/trades`, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 8000
      });

      const trades: any[] = Array.isArray(res.data?.trades) ? res.data.trades : 
                           Array.isArray(res.data) ? res.data : [];

      trades
        .filter(t => (t.ts || t.timestamp || 0) > lastSeenTradeTs)
        .forEach(t => {
          const ts = t.ts || t.timestamp || Date.now();
          const symbol = t.symbol || t.ticker || '?';
          const action = (t.action || t.side || t.type || '').toUpperCase();
          const pnl = t.pnl != null ? ` | PnL: $${Number(t.pnl).toFixed(2)}` : '';
          const reason = t.reason ? ` (${t.reason})` : '';

          addLog(`${symbol} ${action}${pnl}${reason}`, 
                 action.includes('BUY') || action.includes('ENTRY') || action.includes('LONG') ? 'success' : 'info');

          setLastSeenTradeTs(prev => Math.max(prev, ts));
        });
    } catch (e) {
      // Silent fail - endpoint may not exist yet
    }
  }, [addLog, lastSeenTradeTs]);
  // ===================================================================

  const postCommand = async (endpoint: string, body = {}, successMsg: string) => {
    if (isLocked) {
      addLog("Command blocked - Account is locked", 'warn');
      return;
    }
    try {
      await axios.post(`${CORE_BASE}${endpoint}`, body, {
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        timeout: 15000
      });
      addLog(successMsg, 'success');
      setTimeout(fetchCore, 1000);
      setTimeout(fetchMLStatus, 1500);
    } catch (e: any) {
      addLog(`Command failed: ${e.response?.data?.message || e.message}`, 'error');
    }
  };

  const forceScan = async () => {
    setIsScanning(true);
    await postCommand('/admin/scan', {}, 'Manual market scan triggered');
    setIsScanning(false);
  };

  const panicFlat = async () => {
    if (!confirm('🚨 EMERGENCY: Close ALL positions right now?')) return;
    setIsFlattening(true);
    await postCommand('/admin/hard-flat', {}, 'PANIC FLAT EXECUTED — All positions closed');
    setIsFlattening(false);
  };

  const resetDrawdown = async () => {
    await postCommand('/admin/reset-drawdown', {}, '✅ Drawdown Reset Successfully');
  };

  const toggleHardFlat = () => {
    const newState = !core.hardFlat;
    postCommand('/admin/hard-flat', {}, newState ? 'HARD FLAT ACTIVATED' : 'HARD FLAT DEACTIVATED');
  };

  const adjustRisk = (newMult: number) => {
    setRiskMult(newMult);
    postCommand('/admin/set-risk', { riskMultiplier: newMult }, `Risk multiplier set to ${newMult}x`);
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

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = true;
    dragStartY.current = e.clientY;
    dragStartHeight.current = logHeight;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragRef.current) return;
    const delta = dragStartY.current - e.clientY;
    setLogHeight(Math.max(200, Math.min(700, dragStartHeight.current + delta)));
  };

  const handleMouseUp = () => { dragRef.current = false; };

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
    fetchMLStatus();
    fetchRecentTrades();                    // ← Added

    const coreInterval = setInterval(fetchCore, 7000);
    const mlInterval = setInterval(fetchMLStatus, 9000);
    const tradesInterval = setInterval(fetchRecentTrades, 4000);   // ← Added

    return () => {
      clearInterval(coreInterval);
      clearInterval(mlInterval);
      clearInterval(tradesInterval);
    };
  }, [fetchCore, fetchMLStatus, fetchRecentTrades]);

  useEffect(() => {
    if (lockTimeLeft <= 0) {
      setIsLocked(false);
      return;
    }
    const t = setInterval(() => setLockTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [lockTimeLeft]);

  const equity = safeNum(core.equity);
  const peakEquity = safeNum(core.peakEquity);
  const drawdown = peakEquity > 0 ? ((peakEquity - equity) / peakEquity) * 100 : 0;
  const positions: Position[] = Array.isArray(core.positions) ? core.positions : [];
  const rockets: RocketSignal[] = Array.isArray(core.rockets) ? core.rockets : [];
  const winRate = (safeNum(core.recentWinRate) * 100).toFixed(1);
  const isInDanger = drawdown > 12;

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    if (logFilter === 'entry') return log.includes('ENTRY');
    if (logFilter === 'exit') return log.includes('EXIT');
    if (logFilter === 'error') return log.includes('❌');
    return log.toLowerCase().includes(logFilter);
  });

  return (
    <div className="h-screen bg-zinc-950 text-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Bot className="w-11 h-11 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-black tracking-tighter">ALPHASTREAM</h1>
            <p className="text-xs text-emerald-400 font-mono">MAG7 • LIVE PAPER TRADING BOT v4.7</p>
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
        {/* LEFT COLUMN */}
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

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" /> OPEN POSITIONS ({positions.length})
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

        {/* RIGHT COLUMN */}
        <div className="col-span-4 flex flex-col gap-4 overflow-hidden">

          {/* ML TRAINING STATUS */}
          <div className="bg-zinc-900 border border-violet-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-400" /> 
                ML TRAINING {mlStatus.version && <span className="text-xs text-violet-500">({mlStatus.version})</span>}
              </h3>
              <button onClick={fetchMLStatus} disabled={isRefreshingML} className="text-violet-400 hover:text-violet-300">
                <RefreshCw className={`w-4 h-4 ${isRefreshingML ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {mlError && <div className="text-red-400 text-sm mb-3">⚠️ {mlError}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/60 p-4 rounded-xl">
                <div className="text-emerald-400 text-sm">ENTRY MODEL</div>
                <div className="text-2xl font-bold mt-1">
                  {mlStatus.entryModelReady ? '✅ READY' : '⏳ Loading'}
                </div>
              </div>
              <div className="bg-black/60 p-4 rounded-xl">
                <div className="text-violet-400 text-sm">EXIT MODEL</div>
                <div className="text-2xl font-bold mt-1">
                  {mlStatus.exitModelReady ? '✅ READY' : '⏳ Loading'}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Exit Buffer</span>
                <span className="font-mono font-medium">{mlStatus.exitBufferSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Entry Buffer</span>
                <span className="font-mono font-medium">{mlStatus.entryBufferSize}</span>
              </div>
              {mlStatus.lastSync && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Sync</span>
                  <span className="font-mono text-emerald-400">
                    {new Date(mlStatus.lastSync).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ENTRY LOGS */}
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 flex-1 flex flex-col min-h-0">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-400">
              <ArrowUp className="w-5 h-5" /> ENTRY SIGNALS
            </h3>
            <div className="flex-1 bg-black/60 rounded-xl p-3 overflow-auto text-sm font-mono">
              {filteredLogs.filter(l => l.includes('ENTRY')).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No entry signals logged yet<br/>
                  <span className="text-xs">(Entry Buffer: {mlStatus.entryBufferSize})</span>
                </p>
              ) : (
                filteredLogs.filter(l => l.includes('ENTRY')).map((log, i) => (
                  <div key={i} className="py-1 text-emerald-300">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* EXIT LOGS */}
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 flex-1 flex flex-col min-h-0">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-400">
              <ArrowDown className="w-5 h-5" /> EXIT SIGNALS
            </h3>
            <div className="flex-1 bg-black/60 rounded-xl p-3 overflow-auto text-sm font-mono">
              {filteredLogs.filter(l => l.includes('EXIT')).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No exit signals logged yet<br/>
                  <span className="text-xs">(Exit Buffer: {mlStatus.exitBufferSize})</span>
                </p>
              ) : (
                filteredLogs.filter(l => l.includes('EXIT')).map((log, i) => (
                  <div key={i} className="py-1 text-red-300">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* General Logs */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold">ALL ACTIVITY LOGS</h3>
              <select 
                value={logFilter} 
                onChange={(e) => setLogFilter(e.target.value as any)}
                className="bg-zinc-800 text-xs px-3 py-1 rounded-lg border border-zinc-600"
              >
                <option value="all">All</option>
                <option value="entry">Entry Only</option>
                <option value="exit">Exit Only</option>
                <option value="error">Errors Only</option>
              </select>
            </div>
            <div className="flex-1 bg-black/60 rounded-xl p-3 overflow-auto text-xs font-mono" style={{ maxHeight: logHeight }}>
              {filteredLogs.map((log, i) => (
                <div key={i} className="py-0.5">{log}</div>
              ))}
            </div>
            <div 
              className="h-1 bg-zinc-700 mt-2 rounded cursor-ns-resize" 
              onMouseDown={handleMouseDown}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
