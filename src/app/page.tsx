'use client';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Rocket, Shield, RefreshCw, Brain, Play, TrendingUp,
  AlertTriangle, Target, Activity, CheckCircle, XCircle
} from 'lucide-react';

const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

export default function TradingBotDashboard() {
  const [core, setCore] = useState<any>({});
  const [mlStatus, setMlStatus] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'entry' | 'exit' | 'error'>('all');
  const [logHeight, setLogHeight] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const [winRateHistory, setWinRateHistory] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4200);
  };

  const cleanLog = (line: string) => {
    let cleaned = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (cleaned.includes("ADMIN-AUTH") || cleaned.includes("x-admin-key")) return "";
    if (cleaned.includes("429")) return `[RATE LIMIT] ${cleaned}`;
    return cleaned;
  };

  const fetchCore = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/status`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      setCore(res.data || {});
    } catch {}
  };

  const fetchMLStatus = async () => {
    try {
      const res = await axios.get(`${ML_BASE}/ml/status`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      setMlStatus(res.data || {});
    } catch {}
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/admin/logs?limit=700`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      const rawLogs = Array.isArray(res.data) ? res.data : [];
      const cleaned = rawLogs.map(cleanLog).filter(Boolean);
      setLogs(cleaned.slice(-700));
    } catch {}
  };

  // ✅ FIXED: Live prices now update correctly
  const fetchLivePrices = useCallback(async () => {
    if (!core.positions?.length) return;
    try {
      const symbols = core.positions.map((p: any) => p.symbol);
      const prices: Record<string, number> = {};
      for (const sym of symbols) {
        try {
          const res = await axios.get(`${CORE_BASE}/price/${sym}`, {
            headers: { 'x-admin-key': ADMIN_KEY }
          });
          prices[sym] = res.data.price || 0;
        } catch {}
      }
      setLivePrices(prices);
    } catch {}
  }, [core.positions]);

  // Win Rate History
  useEffect(() => {
    if (core.recentWinRate !== undefined) {
      setWinRateHistory(prev => {
        const newHistory = [...prev, Number(core.recentWinRate)];
        return newHistory.length > 20 ? newHistory.slice(-20) : newHistory;
      });
    }
  }, [core.recentWinRate]);

  const triggerAction = async (endpoint: string, successMsg: string, dangerous = false) => {
    if (dangerous && !confirm(`Are you sure you want to ${successMsg.toLowerCase()}?`)) return;

    setActionLoading(endpoint);
    try {
      await axios.post(`${CORE_BASE}${endpoint}`, {}, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      showFeedback('success', successMsg);
      fetchCore();
      fetchMLStatus();
    } catch {
      showFeedback('error', `${successMsg.split(' ')[0]} failed`);
    } finally {
      setActionLoading(null);
    }
  };

  const triggerScan = () => triggerAction('/admin/scan', 'Manual scan triggered');
  const panicFlat = () => triggerAction('/admin/hard-flat', 'Panic flat executed', true);
  const resetDD = () => triggerAction('/admin/reset-drawdown', 'Drawdown reset');
  const clearBlacklist = () => triggerAction('/admin/clear-blacklist', 'Blacklist cleared');

  const addFakeData = async () => {
    if (!confirm('Add 100 fake experiences to the production ML buffer?')) return;

    setActionLoading('fake');
    try {
      await axios.post(`${ML_BASE}/ingest/fake?count=100`, {}, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      showFeedback('success', '100 fake experiences added');
      fetchMLStatus();
    } catch {
      showFeedback('error', 'Failed to add fake data');
    } finally {
      setActionLoading(null);
    }
  };

  const triggerTraining = async () => {
    setActionLoading('train');
    try {
      await axios.post(`${ML_BASE}/train`, { source: "dashboard" }, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      showFeedback('success', 'Training triggered');
      setTimeout(fetchMLStatus, 4000);
    } catch {
      showFeedback('error', 'Training failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Polling
  useEffect(() => {
    fetchCore();
    fetchMLStatus();
    fetchActivityLogs();

    const intervals = [
      setInterval(fetchCore, 7000),
      setInterval(fetchMLStatus, 8000),
      setInterval(fetchActivityLogs, 5000),
    ];
    return () => intervals.forEach(clearInterval);
  }, []);

  // ✅ FIXED: Live prices now depend on positions
  useEffect(() => {
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 12000);
    return () => clearInterval(interval);
  }, [fetchLivePrices]);

  // Resize handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newHeight = window.innerHeight - e.clientY - 160;
      if (newHeight > 200 && newHeight < 720) setLogHeight(newHeight);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    if (logFilter === 'entry') return log.includes("ENTRY") || log.includes("ATTEMPT") || log.includes("SCAN");
    if (logFilter === 'exit') return log.includes("EXIT") || log.includes("CLOSE");
    if (logFilter === 'error') return log.includes("ERROR") || log.includes("FAIL") || log.includes("WARN");
    return true;
  });

  const renderWinRateChart = () => {
    if (winRateHistory.length < 2) {
      return <div className="text-zinc-500 text-sm py-8 text-center">Collecting win rate data...</div>;
    }
    const max = Math.max(...winRateHistory, 100);
    const min = Math.min(...winRateHistory, 0);
    const range = max - min || 1;
    const points = winRateHistory.map((value, index) => {
      const x = (index / (winRateHistory.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(" ");

    return (
      <div className="relative h-48 w-full">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {[0, 25, 50, 75, 100].map((y, i) => (
            <line key={i} x1="0" y1={y} x2="100" y2={y} stroke="#27272a" strokeWidth="0.5" />
          ))}
          <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={points} />
          {winRateHistory.map((value, index) => {
            const x = (index / (winRateHistory.length - 1)) * 100;
            const y = 100 - ((value - min) / range) * 100;
            return <circle key={index} cx={x} cy={y} r="1.8" fill="#10b981" />;
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 bg-grid-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold flex items-center gap-4">
              <Rocket className="text-emerald-500" /> ALPHASTREAM
            </h1>
            <p className="text-zinc-400">FABLE-5 • MAG7 Autonomous Trading System</p>
          </div>
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-2xl transition">
            <RefreshCw size={20} /> Refresh All
          </button>
        </div>

        {/* Feedback Toast */}
        {feedback && (
          <div className={`fixed top-8 right-8 px-6 py-4 rounded-2xl flex items-center gap-3 z-50 shadow-2xl
            ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {feedback.type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={triggerScan} disabled={actionLoading === '/admin/scan'} className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 px-7 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition">
            <Rocket /> MANUAL SCAN
          </button>
          <button onClick={panicFlat} disabled={actionLoading === '/admin/hard-flat'} className="bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 px-7 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition">
            <Shield /> PANIC FLAT
          </button>
          <button onClick={resetDD} disabled={actionLoading === '/admin/reset-drawdown'} className="bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 px-7 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition">
            RESET DD
          </button>
          <button onClick={clearBlacklist} disabled={actionLoading === '/admin/clear-blacklist'} className="bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-700 px-7 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition">
            Clear Blacklist
          </button>
          <button onClick={addFakeData} disabled={actionLoading === 'fake'} className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 px-7 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition">
            <Brain /> Add Fake Data (100)
          </button>
          <button onClick={triggerTraining} disabled={actionLoading === 'train'} className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 px-7 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition">
            <Play /> Trigger Training
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="glass rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">EQUITY</div>
            <div className="text-4xl font-mono mt-3">${(core.equity || 0).toLocaleString()}</div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">DRAWDOWN</div>
            <div className="text-4xl font-mono mt-3 text-emerald-400">{(core.drawdownPct || 0).toFixed(2)}%</div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">WIN RATE</div>
            <div className="text-4xl font-mono mt-3 text-emerald-400">{(core.recentWinRate || 0).toFixed(1)}%</div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">POSITIONS</div>
            <div className="text-4xl font-mono mt-3">{core.positions?.length || 0}/7</div>
          </div>
          <div className="glass border border-amber-500/30 rounded-3xl p-6">
            <div className="text-amber-400 text-sm">ML EXPERIENCES</div>
            <div className="text-3xl font-mono mt-3">{mlStatus.totalExperiences || 0}</div>
            <div className="text-xs text-zinc-500">Trained {mlStatus.totalTrainingRuns || 0}x</div>
          </div>
        </div>

        {/* Fable-5 + ML Status */}
        <div className="glass rounded-3xl p-6 mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-amber-400">
            <Target /> FABLE-5 + ML STATUS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-sm">
            <div>
              <div className="text-zinc-400">Far-Slope</div>
              <div className="text-xl font-mono text-emerald-400">✓ ACTIVE</div>
            </div>
            <div>
              <div className="text-zinc-400">Training</div>
              <div className={`text-xl font-mono ${mlStatus.trainingActive ? 'text-amber-400' : 'text-emerald-400'}`}>
                {mlStatus.trainingActive ? 'RUNNING' : 'IDLE'}
              </div>
            </div>
            <div>
              <div className="text-zinc-400">Last Trained</div>
              <div className="text-lg font-mono">
                {mlStatus.lastTrainedAt ? new Date(mlStatus.lastTrainedAt).toLocaleTimeString() : 'Never'}
              </div>
            </div>
            <div>
              <div className="text-zinc-400">Entry Buffer</div>
              <div className="text-2xl font-mono">{mlStatus.entryBufferSize || 0}</div>
            </div>
            <div>
              <div className="text-zinc-400">Exit Buffer</div>
              <div className="text-2xl font-mono">{mlStatus.exitBufferSize || 0}</div>
            </div>
            <div>
              <div className="text-zinc-400">SumTree</div>
              <div className="text-sm font-mono">
                E: {mlStatus.sumTreeSizes?.entry || 0} / X: {mlStatus.sumTreeSizes?.exit || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Win Rate Trend */}
        <div className="glass rounded-3xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="text-emerald-400" /> WIN RATE TREND (Last 20)
            </h3>
            <div className="text-emerald-400 font-mono text-lg">
              {(core.recentWinRate || 0).toFixed(1)}%
            </div>
          </div>
          {renderWinRateChart()}
        </div>

        {/* Open Positions */}
        <div className="glass rounded-3xl p-6 mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            OPEN POSITIONS ({core.positions?.length || 0})
          </h3>
          {core.positions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {core.positions.map((p: any, i: number) => {
                const livePrice = livePrices[p.symbol] || p.entry;
                const unrealized = livePrice ? (livePrice - p.entry) * p.qty * (p.side === 'short' ? -1 : 1) : 0;
                return (
                  <div key={i} className="glass rounded-2xl p-5 border border-zinc-700">
                    <div className="font-mono text-xl flex justify-between">
                      {p.symbol} <span className={p.side === 'short' ? 'text-red-400' : 'text-emerald-400'}>{p.side?.toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-zinc-400 mt-1">
                      {Math.abs(p.qty)} @ ${Number(p.entry).toFixed(2)}
                    </div>
                    {livePrice && (
                      <div className={`text-sm mt-2 ${unrealized > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        Live: ${livePrice.toFixed(2)} • PnL: ${unrealized.toFixed(2)}
                      </div>
                    )}
                    {p.farSlope !== undefined && (
                      <div className="text-xs text-amber-400 mt-1">FarSlope: {Number(p.farSlope).toFixed(2)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-amber-400 py-12 flex flex-col items-center gap-2">
              <AlertTriangle size={28} />
              No open positions<br/>
              <span className="text-sm text-zinc-500">Click MANUAL SCAN or Clear Blacklist</span>
            </p>
          )}
        </div>

        {/* Logs */}
        <div className="glass rounded-3xl p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity /> ACTIVITY LOGS
            </h3>
            <select value={logFilter} onChange={(e) => setLogFilter(e.target.value as any)} className="bg-zinc-800 text-sm px-4 py-2 rounded-xl border border-zinc-700">
              <option value="all">All</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="error">Errors</option>
            </select>
          </div>
          <div className="bg-black/60 rounded-2xl p-5 overflow-auto text-sm font-mono h-[420px]" style={{ maxHeight: logHeight }}>
            {filteredLogs.length === 0 ? (
              <p className="text-center text-zinc-500 py-12">Waiting for activity logs...</p>
            ) : (
              filteredLogs.map((log, i) => <div key={i} className="py-1 break-all">{log}</div>)
            )}
          </div>
          <div className="h-1 bg-zinc-700 mt-4 rounded cursor-ns-resize hover:bg-zinc-500" onMouseDown={handleMouseDown} />
        </div>
      </div>
    </div>
  );
}
