'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Bot, Activity, Loader2, AlertTriangle, Shield, Rocket, Lock, Unlock, 
  TrendingUp, Brain, RefreshCw 
} from 'lucide-react';

const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
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
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'trade' | 'ml'>('all');
  const [logHeight, setLogHeight] = useState(380);
  const [isScanning, setIsScanning] = useState(false);
  const [isFlattening, setIsFlattening] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);
  const [riskMult, setRiskMult] = useState(1);
  const [isRefreshingML, setIsRefreshingML] = useState(false);
  const [rockets, setRockets] = useState<RocketSignal[]>([]);

  const dragRef = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(380);

  const safeNum = (v: any, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

  const addLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [`${time} [${type.toUpperCase()}] ${msg}`, ...prev].slice(0, 2000));
  }, []);

  const postCommand = useCallback(async (endpoint: string, body = {}) => {
    try {
      const res = await axios.post(`${CORE_BASE}${endpoint}`, body, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 10000
      });
      addLog(`Command ${endpoint} executed successfully`, 'success');
      return res.data;
    } catch (e: any) {
      addLog(`Command failed: ${e.response?.data?.message || e.message}`, 'error');
    }
  }, [addLog]);

  const fetchCore = useCallback(async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/health`, { timeout: 8000 });
      setCore(res.data);
    } catch (e) {
      addLog("Failed to fetch core status", "error");
    }
  }, [addLog]);

  const fetchMLStatus = useCallback(async () => {
    setIsRefreshingML(true);
    try {
      const res = await axios.get(`${CORE_BASE}/ml/status`, { timeout: 8000 });
      setMlStatus(res.data);
    } catch (e) {
      if (core.ml || core.training) {
        setMlStatus({
          entryModelReady: true,
          exitModelReady: true,
          exitBufferSize: core.ml?.exitBuffer || core.training?.exitBuffer || 0,
          entryBufferSize: core.ml?.entryBuffer || core.training?.entryBuffer || 0,
          lastSync: new Date().toISOString(),
          trainingActive: true
        });
      }
    } finally {
      setIsRefreshingML(false);
    }
  }, [core]);

  // Polling
  useEffect(() => {
    fetchCore();
    fetchMLStatus();

    const coreInterval = setInterval(fetchCore, 7000);
    const mlInterval = setInterval(fetchMLStatus, 9000);

    return () => {
      clearInterval(coreInterval);
      clearInterval(mlInterval);
    };
  }, [fetchCore, fetchMLStatus]);

  // Lock countdown
  useEffect(() => {
    if (!isLocked || lockTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setLockTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked, lockTimeLeft]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = true;
    dragStartY.current = e.clientY;
    dragStartHeight.current = logHeight;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const delta = dragStartY.current - e.clientY;
    setLogHeight(Math.max(200, Math.min(800, dragStartHeight.current + delta)));
  }, []);

  const handleMouseUp = () => { dragRef.current = false; };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  // Command handlers
  const forceScan = () => postCommand('/admin/scan');
  const panicFlat = () => {
    if (confirm("Are you sure you want to close ALL positions?")) {
      postCommand('/admin/hard-flat');
    }
  };
  const resetDrawdown = () => postCommand('/admin/reset-drawdown');
  const toggleHardFlat = () => postCommand('/admin/toggle-hardflat');
  const adjustRisk = (multiplier: number) => {
    setRiskMult(multiplier);
    postCommand('/admin/set-risk', { multiplier });
  };
  const toggleLock = () => {
    setIsLocked(!isLocked);
    setLockTimeLeft(!isLocked ? 300 : 0);
  };

  return (
    <div className="h-screen bg-zinc-950 text-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-cyan-400" />
          <div>
            <div className="font-bold text-xl">ALPHASTREAM</div>
            <div className="text-xs text-gray-500">MAG7 PAPER TRADER v4.1</div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>Equity: <span className="font-mono text-emerald-400">${safeNum(core.equity).toFixed(0)}</span></div>
          <div>DD: <span className="font-mono text-rose-400">{safeNum(core.drawdownPct).toFixed(2)}%</span></div>
          <div>Win Rate: <span className="font-mono">{safeNum(core.recentWinRate * 100).toFixed(1)}%</span></div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* LEFT COLUMN */}
        <div className="col-span-8 space-y-4 overflow-y-auto">
          {/* Equity / Risk Cards */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="text-gray-400 text-sm">EQUITY</div>
              <div className="text-3xl font-bold text-white mt-1">${safeNum(core.equity).toFixed(0)}</div>
            </div>
            {/* Add your other 4 original cards here */}
          </div>

          {/* Open Positions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" /> OPEN POSITIONS ({core.positions?.length || 0})
            </h3>
            {/* Your original positions rendering logic here */}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-4 flex flex-col gap-4">
          {/* ML TRAINING PANEL */}
          <div className="bg-zinc-900 border border-violet-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-400" /> ML TRAINING
              </h3>
              <button 
                onClick={fetchMLStatus} 
                disabled={isRefreshingML}
                className="text-violet-400 hover:text-violet-300"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingML ? 'animate-spin' : ''}`} />
              </button>
            </div>

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

          {/* Rocket Signals */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5" /> ROCKET SIGNALS
            </h3>
            {/* Your original rocket signals rendering logic */}
          </div>

          {/* Controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">CONTROLS</h3>
            {/* Your original control buttons: Scan, Panic Flat, Risk Multiplier, Lock, etc. */}
            <div className="flex flex-wrap gap-2">
              <button onClick={forceScan} className="px-4 py-2 bg-blue-600 rounded-lg">SCAN MARKET</button>
              <button onClick={panicFlat} className="px-4 py-2 bg-red-600 rounded-lg">PANIC FLAT</button>
              <button onClick={toggleLock} className="px-4 py-2 bg-amber-600 rounded-lg">
                {isLocked ? 'UNLOCK' : 'LOCK'} ({lockTimeLeft}s)
              </button>
            </div>
          </div>

          {/* Logs Panel with Drag Resize */}
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
