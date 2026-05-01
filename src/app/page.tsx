'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Zap, Activity, Loader2, AlertTriangle, Wallet, Bot, Target, Cpu, 
  Rocket, Shield, TrendingUp, TrendingDown, Play, Pause, Settings 
} from 'lucide-react';

const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';

type Position = {
  symbol: string;
  qty: number;
  entry?: number;
  side?: 'long' | 'short';
  bestProfitPct?: number;
};

type RocketSignal = {
  symbol: string;
  action?: string;
  confidence?: number;
  volatilityEstimate?: number;
  timestamp?: number;
};

export default function TradingBotDashboard() {
  const [core, setCore] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'trade'>('all');
  const [logHeight, setLogHeight] = useState(340);
  const [isScanning, setIsScanning] = useState(false);
  const [isFlattening, setIsFlattening] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);

  const dragRef = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(340);

  const [mlHealth, setMlHealth] = useState({ ok: false });

  // Safe number helpers
  const safeNum = (v: any, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const safeFixed = (v: any, dec = 2) => safeNum(v).toFixed(dec);

  const addLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const icon = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✓';
    setLogs(prev => [`[${time}] ${icon} ${msg}`, ...prev].slice(0, 1200));
  }, []);

  const fetchCore = useCallback(async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/health`);
      setCore(res.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      addLog(`Failed to fetch dashboard data: ${msg}`, 'error');
    }
  }, [addLog]);

  const postCommand = async (endpoint: string, body = {}, successMsg: string) => {
    if (isLocked) {
      addLog("Command blocked - Account is locked", 'warn');
      return;
    }
    try {
      await axios.post(`${CORE_BASE}${endpoint}`, body);
      addLog(successMsg);
      setTimeout(fetchCore, 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      addLog(`Command failed: ${msg}`, 'error');
    }
  };

  // Commands
  const forceScan = () => {
    setIsScanning(true);
    postCommand('/scan', {}, 'Manual scan triggered').finally(() => setIsScanning(false));
  };

  const panicFlat = async () => {
    if (!confirm('EMERGENCY: Close ALL positions right now?')) return;
    setIsFlattening(true);
    await postCommand('/force-flat', {}, 'PANIC FLAT EXECUTED - All positions closed');
    setIsFlattening(false);
  };

  const toggleHardFlat = () => {
    const newState = !core.hardFlat;
    postCommand('/admin/flat', {}, newState ? 'Hard Flat ACTIVATED' : 'Hard Flat DEACTIVATED');
  };

  const adjustRisk = async (newMult: number) => {
    // You may need to add this endpoint in admin.js
    await postCommand('/admin/set-risk', { riskMultiplier: newMult }, `Risk multiplier set to ${newMult}`);
  };

  // ML Health
  useEffect(() => {
    const checkML = async () => {
      try {
        const res = await axios.get(`${ML_BASE}/health`);
        setMlHealth(res.data);
      } catch {
        setMlHealth({ ok: false });
      }
    };
    checkML();
    const int = setInterval(checkML, 25000);
    return () => clearInterval(int);
  }, []);

  // Core data polling
  useEffect(() => {
    fetchCore();
    const interval = setInterval(fetchCore, 7000);
    return () => clearInterval(interval);
  }, [fetchCore]);

  // Lock timer
  useEffect(() => {
    if (lockTimeLeft <= 0) {
      setIsLocked(false);
      return;
    }
    const t = setInterval(() => setLockTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [lockTimeLeft]);

  // Auto detect lock
  useEffect(() => {
    if (logs.slice(0, 8).some(l => l.includes('403') || l.includes('locked'))) {
      setIsLocked(true);
      setLockTimeLeft(3600);
    }
  }, [logs]);

  const equity = safeNum(core.equity);
  const peakEquity = safeNum(core.peakEquity);
  const drawdown = peakEquity > 0 ? ((peakEquity - equity) / peakEquity) * 100 : 0;
  const positions: Position[] = Array.isArray(core.positions) ? core.positions : [];
  const rockets: RocketSignal[] = Array.isArray(core.rockets) ? core.rockets : [];

  const winRate = safeNum(core.recentWinRate) * 100;
  const isInDanger = drawdown > 12;

  return (
    <div className="h-screen bg-zinc-950 text-gray-100 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="border-b border-zinc-800 bg-black px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Bot className="w-10 h-10 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">ALPHASTREAM</h1>
            <p className="text-xs text-emerald-400 font-mono">MAG7 • LIVE PAPER TRADING BOT v4.1</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className={`flex items-center gap-2 ${isInDanger ? 'text-red-400' : 'text-emerald-400'}`}>
            <div className={`w-3 h-3 rounded-full ${isInDanger ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            {isInDanger ? 'HIGH RISK' : 'SYSTEM HEALTHY'}
          </div>
          <button onClick={forceScan} disabled={isScanning} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 px-5 py-2 rounded-xl font-medium disabled:opacity-50">
            {isScanning ? <Loader2 className="animate-spin" /> : <Activity />} SCAN
          </button>
          <button onClick={panicFlat} disabled={isFlattening} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl font-medium disabled:opacity-50">
            {isFlattening ? <Loader2 className="animate-spin" /> : <AlertTriangle />} PANIC FLAT
          </button>
        </div>
      </header>

      {/* Lock Banner */}
      {isLocked && (
        <div className="bg-red-900/90 border-b border-red-600 px-6 py-3 text-red-100 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>Account is temporarily locked due to 403 error. Cooldown: {Math.floor(lockTimeLeft/60)}m {lockTimeLeft%60}s</span>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* LEFT COLUMN - METRICS & POSITIONS */}
        <div className="col-span-8 space-y-4 overflow-y-auto">
          {/* Key Metrics */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
              <div className="text-cyan-400 text-sm">EQUITY</div>
              <div className="text-4xl font-bold mt-2">${equity.toFixed(0)}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
              <div className="text-amber-400 text-sm">DRAWDOWN</div>
              <div className={`text-4xl font-bold mt-2 ${drawdown > 15 ? 'text-red-500' : 'text-amber-400'}`}>
                {drawdown.toFixed(1)}%
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
              <div className="text-emerald-400 text-sm">WIN RATE</div>
              <div className="text-4xl font-bold mt-2">{winRate.toFixed(0)}%</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
              <div className="text-purple-400 text-sm">POSITIONS</div>
              <div className="text-4xl font-bold mt-2">{positions.length}/3</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
              <div className="text-sky-400 text-sm">RISK MULT</div>
              <div className="text-4xl font-bold mt-2">{safeFixed(core.riskMultiplier, 2)}x</div>
            </div>
          </div>

          {/* Open Positions */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" /> OPEN POSITIONS
            </h3>
            {positions.length === 0 ? (
              <p className="text-center py-12 text-gray-500">No open positions</p>
            ) : (
              <div className="space-y-3">
                {positions.map((pos, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/50 px-6 py-4 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-6">
                      <span className="text-2xl font-bold text-white">{pos.symbol}</span>
                      <span className={`px-3 py-1 text-xs rounded-full ${pos.side === 'short' ? 'bg-red-900 text-red-400' : 'bg-emerald-900 text-emerald-400'}`}>
                        {pos.side?.toUpperCase() || 'LONG'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">{pos.qty} shares</div>
                      <div className="text-xs text-gray-400">@ ${safeFixed(pos.entry)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - SIGNALS + CONTROLS + LOGS */}
        <div className="col-span-4 flex flex-col gap-4">
          {/* ML Signals */}
          <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 flex-1 overflow-hidden flex flex-col">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-amber-400" /> ML SIGNALS
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {rockets.length === 0 ? (
                <div className="text-center py-16 text-gray-500">No strong signals yet...</div>
              ) : (
                rockets.map((r, i) => (
                  <div key={i} className="bg-zinc-950 border border-amber-500/20 p-4 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-xl font-bold">{r.symbol}</span>
                      <span className="text-emerald-400 font-mono">{r.confidence}%</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Vol: {(safeNum(r.volatilityEstimate)*100).toFixed(1)}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Controls */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
            <h3 className="font-medium mb-3">QUICK CONTROLS</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={toggleHardFlat} className="bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl text-sm font-medium">
                {core.hardFlat ? 'RELEASE HARD FLAT' : 'ACTIVATE HARD FLAT'}
              </button>
              <button onClick={() => adjustRisk(0.3)} className="bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl text-sm font-medium">
                LOW RISK
              </button>
            </div>
          </div>

          {/* Live Logs */}
          <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden" style={{ height: logHeight }}>
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between text-sm">
              <span>LIVE LOGS</span>
              <div className="flex gap-2">
                {(['all', 'error', 'trade'] as const).map(f => (
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

            <div className="flex-1 p-4 overflow-y-auto text-xs text-gray-300 space-y-1">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-600">Waiting for bot activity...</div>
              ) : (
                logs.map((line, i) => (
                  <div key={i} className="break-all leading-relaxed">{line}</div>
                ))
              )}
            </div>

            {/* Drag Handle */}
            <div
              onMouseDown={(e) => {
                dragRef.current = true;
                dragStartY.current = e.clientY;
                dragStartHeight.current = logHeight;
              }}
              className="h-6 border-t border-zinc-800 flex items-center justify-center cursor-row-resize hover:bg-zinc-900"
            >
              <div className="w-16 h-0.5 bg-zinc-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
