'use client';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Rocket, Shield, RefreshCw, Brain, Play, TrendingUp, Award,
  AlertTriangle, Target, Activity, CheckCircle, XCircle, Zap, DollarSign
} from 'lucide-react';

const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

export default function TradingBotDashboard() {
  const [core, setCore] = useState<any>({});
  const [mlStatus, setMlStatus] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'entry' | 'exit' | 'error'>('all');
  const [winRateHistory, setWinRateHistory] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4200);
  };

  const cleanLog = (line: string) => line.replace(/\x1b\[[0-9;]*m/g, '').trim();

  const fetchCore = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/status`, { headers: { 'x-admin-key': ADMIN_KEY } });
      const data = res.data || {};
      setCore(data);

      // Auto-update win rate history
      if (typeof data.recentWinRate === 'number') {
        setWinRateHistory(prev => {
          const next = [...prev, data.recentWinRate];
          return next.length > 20 ? next.slice(-20) : next;
        });
      }
    } catch {}
  };

  const fetchMLStatus = async () => {
    try {
      const res = await axios.get(`${ML_BASE}/ml/status`, { headers: { 'x-admin-key': ADMIN_KEY } });
      setMlStatus(res.data || {});
    } catch {}
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/admin/logs?limit=700`, { headers: { 'x-admin-key': ADMIN_KEY } });
      const raw = Array.isArray(res.data?.logs) ? res.data.logs : [];
      setLogs(raw.map(cleanLog).filter(Boolean).slice(-700));
    } catch {}
  };

  const fetchLivePrices = useCallback(async () => {
    if (!core.positions?.length) return;
    try {
      const prices: Record<string, number> = {};
      for (const p of core.positions) {
        try {
          const res = await axios.get(`${CORE_BASE}/price/${p.symbol}`, { headers: { 'x-admin-key': ADMIN_KEY } });
          prices[p.symbol] = res.data.price || 0;
        } catch {}
      }
      setLivePrices(prices);
    } catch {}
  }, [core.positions]);

  // Polling
  useEffect(() => {
    fetchCore();
    fetchMLStatus();
    fetchActivityLogs();

    const i1 = setInterval(fetchCore, 7000);
    const i2 = setInterval(fetchMLStatus, 8000);
    const i3 = setInterval(fetchActivityLogs, 5000);
    const i4 = setInterval(fetchLivePrices, 10000);

    return () => [i1, i2, i3, i4].forEach(clearInterval);
  }, [fetchLivePrices]);

  const triggerAction = async (endpoint: string, msg: string, dangerous = false) => {
    if (dangerous && !confirm(`Confirm ${msg}?`)) return;
    setActionLoading(endpoint);
    try {
      await axios.post(`${CORE_BASE}${endpoint}`, {}, { headers: { 'x-admin-key': ADMIN_KEY } });
      showFeedback('success', msg);
      fetchCore();
    } catch {
      showFeedback('error', 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const triggerTraining = async () => {
    setActionLoading('train');
    try {
      await axios.post(`${ML_BASE}/train`, {}, { headers: { 'x-admin-key': ADMIN_KEY } });
      showFeedback('success', 'Training triggered');
      setTimeout(fetchMLStatus, 3000);
    } catch {
      showFeedback('error', 'Training failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Dynamic training status
  const isTrainingActive = (mlStatus.entryBufferSize || 0) + (mlStatus.exitBufferSize || 0) > 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold flex items-center gap-4">
              <Rocket className="text-emerald-500" /> ALPHASTREAM
            </h1>
            <p className="text-zinc-400">FABLE-5 • MAG7 Autonomous Trading System</p>
          </div>
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-2xl">
            <RefreshCw size={20} /> Refresh All
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={() => triggerAction('/admin/scan', 'Manual scan triggered')} className="bg-emerald-600 px-7 py-3.5 rounded-2xl font-medium">MANUAL SCAN</button>
          <button onClick={() => triggerAction('/admin/hard-flat', 'Panic flat executed', true)} className="bg-red-600 px-7 py-3.5 rounded-2xl font-medium">PANIC FLAT</button>
          <button onClick={() => triggerAction('/admin/clear-blacklist', 'Blacklist cleared')} className="bg-orange-600 px-7 py-3.5 rounded-2xl font-medium">Clear Blacklist</button>
          <button onClick={triggerTraining} className="bg-blue-600 px-7 py-3.5 rounded-2xl font-medium">Trigger Training</button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="glass rounded-3xl p-6">
            <div className="text-zinc-400">EQUITY</div>
            <div className="text-4xl font-mono mt-3">${(core.equity || 0).toLocaleString()}</div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="text-zinc-400">DRAWDOWN</div>
            <div className="text-4xl font-mono mt-3 text-emerald-400">{(core.drawdownPct || 0).toFixed(2)}%</div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="text-zinc-400">WIN RATE</div>
            <div className="text-4xl font-mono mt-3 text-emerald-400">{(core.recentWinRate || 0).toFixed(1)}%</div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="text-zinc-400">POSITIONS</div>
            <div className="text-4xl font-mono mt-3">{core.positionsCount || 0}/7</div>
          </div>
          <div className="glass border border-amber-500/30 rounded-3xl p-6">
            <div className="text-amber-400">ML EXPERIENCES</div>
            <div className="text-3xl font-mono mt-3">{mlStatus.totalExperiences || 0}</div>
            <div className="text-xs text-zinc-500">Trained {mlStatus.totalTrainingRuns || 0}x</div>
          </div>
        </div>

        {/* FABLE-5 ML Status */}
        <div className="glass rounded-3xl p-6 mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-amber-400"><Target /> FABLE-5 + ML STATUS</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-sm">
            <div>
              <div className="text-zinc-400">Far-Slope</div>
              <div className="text-xl font-mono text-emerald-400">✓ ACTIVE</div>
            </div>
            <div>
              <div className="text-zinc-400">Training</div>
              <div className={`text-xl font-mono ${isTrainingActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {isTrainingActive ? 'RUNNING' : 'IDLE'}
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
              <div className="text-sm font-mono">E: {mlStatus.sumTreeEntry || 0} / X: {mlStatus.sumTreeExit || 0}</div>
            </div>
            <div>
              <div className="text-zinc-400">Last Trained</div>
              <div className="text-sm font-mono text-zinc-400">
                {mlStatus.lastTrainedAt ? new Date(mlStatus.lastTrainedAt).toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>
        </div>

        {/* Win Rate Trend */}
        <div className="glass rounded-3xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="text-emerald-400" /> WIN RATE TREND (Last 20)</h3>
            <div className="text-emerald-400 font-mono text-lg">{(core.recentWinRate || 0).toFixed(1)}%</div>
          </div>

          {winRateHistory.length < 2 ? (
            <div className="text-zinc-500 py-8 text-center">Collecting win rate data...</div>
          ) : (
            <div className="relative h-48 w-full">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {[0, 25, 50, 75, 100].map((y, i) => (
                  <line key={i} x1="0" y1={y} x2="100" y2={y} stroke="#27272a" strokeWidth="0.5" />
                ))}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={winRateHistory.map((v, i) => {
                    const x = (i / (winRateHistory.length - 1)) * 100;
                    const y = 100 - ((v - Math.min(...winRateHistory)) / (Math.max(...winRateHistory) - Math.min(...winRateHistory) || 1)) * 100;
                    return `${x},${y}`;
                  }).join(" ")}
                />
              </svg>
            </div>
          )}
        </div>

        {/* Open Positions */}
        <div className="glass rounded-3xl p-6 mb-8">
          <h3 className="font-semibold mb-4">OPEN POSITIONS ({core.positionsCount || 0})</h3>
          {core.positions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {core.positions.map((p: any, i: number) => (
                <div key={i} className="glass rounded-2xl p-5">
                  <div className="font-mono text-xl">{p.symbol} <span className="text-emerald-400">{p.side?.toUpperCase()}</span></div>
                  <div className="text-sm text-zinc-400">{Math.abs(p.qty)} @ ${Number(p.entry).toFixed(2)}</div>
                  {livePrices[p.symbol] && <div className="text-sm mt-2">Live: ${livePrices[p.symbol].toFixed(2)}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-amber-400 py-12">No open positions</p>
          )}
        </div>

        {/* Logs */}
        <div className="glass rounded-3xl p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Activity /> ACTIVITY LOGS</h3>
            <select value={logFilter} onChange={(e) => setLogFilter(e.target.value)} className="bg-zinc-800 px-4 py-2 rounded-xl">
              <option value="all">All</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="error">Errors</option>
            </select>
          </div>
          <div className="bg-black/60 rounded-2xl p-5 overflow-auto text-sm font-mono h-[420px]">
            {logs.length === 0 ? (
              <p className="text-center text-zinc-500 py-12">Waiting for activity logs...</p>
            ) : (
              logs.map((l, i) => <div key={i} className="py-1 break-all">{l}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
