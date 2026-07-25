'use client';

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Rocket, RefreshCw, Target, Activity, AlertTriangle, TrendingUp,
  BarChart3, Zap, CheckCircle, XCircle, Play, ShieldAlert
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
  const [equityHistory, setEquityHistory] = useState<number[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  const [coreError, setCoreError] = useState<string | null>(null);
  const [mlError, setMlError] = useState<string | null>(null);
  const [isCoreConnected, setIsCoreConnected] = useState(false);
  const [isMLConnected, setIsMLConnected] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  // ==================== HELPERS ====================
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const cleanLog = (line: string) => line.replace(/\x1b\[[0-9;]*m/g, '').trim();

  // ==================== FETCH FUNCTIONS ====================
  const fetchCore = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/status`, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 10000,
      });
      const data = res.data || {};
      setCore(data);
      setCoreError(null);
      setIsCoreConnected(true);

      if (typeof data.winRate === 'number') {
        setWinRateHistory((prev) => [...prev, data.winRate].slice(-20));
      }
      if (typeof data.equity === 'number') {
        setEquityHistory((prev) => [...prev, data.equity].slice(-60));
      }
    } catch (err: any) {
      setCoreError(`Core unreachable: ${err.message}`);
      setIsCoreConnected(false);
    }
  };

  const fetchMLStatus = async () => {
    try {
      const res = await axios.get(`${ML_BASE}/ml/status`, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 8000,
      });
      const data = res.data || {};
      setMlStatus(data);
      setMlError(null);
      setIsMLConnected(true);
    } catch (err: any) {
      setMlError(`ML unreachable: ${err.message}`);
      setIsMLConnected(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/admin/logs?limit=800`, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 10000,
      });
      const raw = Array.isArray(res.data?.logs) ? res.data.logs : [];
      setLogs(raw.map(cleanLog).filter(Boolean).slice(-800));
    } catch (err) {
      console.warn('Logs fetch failed', err);
    }
  };

  // ==================== POLLING ====================
  useEffect(() => {
    fetchCore();
    fetchMLStatus();
    fetchActivityLogs();

    const intervals = [
      setInterval(fetchCore, 12000),
      setInterval(fetchMLStatus, 25000),
      setInterval(fetchActivityLogs, 15000),
    ];

    return () => intervals.forEach(clearInterval);
  }, []);

  // ==================== ACTIONS ====================
  const triggerAction = async (endpoint: string, msg: string, dangerous = false) => {
    if (dangerous && !confirm(`Confirm: ${msg}?`)) return;

    setActionLoading(endpoint);
    try {
      await axios.post(
        `${CORE_BASE}${endpoint}`,
        {},
        {
          headers: { 'x-admin-key': ADMIN_KEY },
          timeout: 20000,
        }
      );
      showFeedback('success', msg);
      if (endpoint === '/admin/scan') {
        setLastScanTime(new Date().toLocaleTimeString());
      }
      setTimeout(() => {
        fetchCore();
        fetchActivityLogs();
        fetchMLStatus();
      }, 1500);
    } catch (err: any) {
      showFeedback('error', `Failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const triggerTraining = async () => {
    setActionLoading('train');
    try {
      await axios.post(
        `${ML_BASE}/train`,
        {},
        {
          headers: { 'x-admin-key': ADMIN_KEY },
          timeout: 15000,
        }
      );
      showFeedback('success', 'Training started in background');
      setTimeout(fetchMLStatus, 3000);
    } catch (err: any) {
      showFeedback('error', `Training failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ==================== DERIVED ====================
  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
    const lower = log.toLowerCase();
    if (logFilter === 'entry') return lower.includes('entry') || lower.includes('buy') || lower.includes('rocket');
    if (logFilter === 'exit') return lower.includes('exit') || lower.includes('sell');
    if (logFilter === 'error') return lower.includes('error') || lower.includes('fail') || lower.includes('panic');
    return true;
  });

  const isHardFlat = !!core.hardFlat;
  const isDegraded = !!core.degraded;
  const totalExperiences = (mlStatus.entryBufferSize || 0) + (mlStatus.exitBufferSize || 0);

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold flex items-center gap-3">
              <Rocket className="text-emerald-500" /> ALPHASTREAM
            </h1>
            <p className="text-zinc-400 mt-1">FABLE-5 • MAG7 Autonomous Trading System</p>
          </div>
          <button
            onClick={() => {
              fetchCore();
              fetchMLStatus();
              fetchActivityLogs();
            }}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-2xl transition"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        {/* Feedback Toast */}
        {feedback && (
          <div
            className={`mb-6 px-5 py-3 rounded-2xl flex items-center gap-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-900/60 border border-emerald-500/50 text-emerald-200'
                : 'bg-red-900/60 border border-red-500/50 text-red-200'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {feedback.message}
          </div>
        )}

        {/* Connection Status */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-sm ${
              isCoreConnected ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
            }`}
          >
            {isCoreConnected ? <CheckCircle size={16} /> : <XCircle size={16} />}
            Core Service
          </div>
          <div
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-sm ${
              isMLConnected ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
            }`}
          >
            {isMLConnected ? <CheckCircle size={16} /> : <XCircle size={16} />}
            ML Service
          </div>
          {isHardFlat && (
            <div className="px-4 py-2 rounded-2xl flex items-center gap-2 text-sm bg-red-900/50 text-red-300">
              <ShieldAlert size={16} /> HARD FLAT ACTIVE
            </div>
          )}
          {isDegraded && (
            <div className="px-4 py-2 rounded-2xl flex items-center gap-2 text-sm bg-amber-900/50 text-amber-300">
              <AlertTriangle size={16} /> DEGRADED MODE
            </div>
          )}
        </div>

        {/* Errors */}
        {coreError && (
          <div className="bg-red-900/50 border border-red-500/40 text-red-200 px-5 py-3 rounded-2xl mb-4 text-sm">
            {coreError}
          </div>
        )}
        {mlError && (
          <div className="bg-red-900/50 border border-red-500/40 text-red-200 px-5 py-3 rounded-2xl mb-4 text-sm">
            {mlError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => triggerAction('/admin/scan', 'Manual scan started')}
            disabled={!!actionLoading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-2xl font-medium disabled:opacity-50 transition"
          >
            <Play size={18} />
            {actionLoading === '/admin/scan' ? 'Scanning...' : 'MANUAL SCAN'}
          </button>

          <button
            onClick={() => triggerAction('/admin/hard-flat', 'Panic flat executed', true)}
            disabled={!!actionLoading}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-2xl font-medium disabled:opacity-50 transition"
          >
            <ShieldAlert size={18} />
            PANIC FLAT
          </button>

          <button
            onClick={() => triggerAction('/admin/clear-blacklist', 'Blacklists cleared')}
            disabled={!!actionLoading}
            className="bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-2xl font-medium disabled:opacity-50 transition"
          >
            Clear Blacklist
          </button>

          <button
            onClick={triggerTraining}
            disabled={!!actionLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-medium disabled:opacity-50 transition"
          >
            <Zap size={18} />
            {actionLoading === 'train' ? 'Starting...' : 'Trigger Training'}
          </button>
        </div>

        {lastScanTime && (
          <p className="text-sm text-zinc-500 mb-4">Last manual scan: {lastScanTime}</p>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5">
            <div className="text-zinc-400 text-sm">EQUITY</div>
            <div className="text-3xl font-mono mt-2">
              ${(core.equity || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5">
            <div className="text-zinc-400 text-sm">DRAWDOWN</div>
            <div className={`text-3xl font-mono mt-2 ${(core.drawdownPct || 0) > 5 ? 'text-red-400' : 'text-emerald-400'}`}>
              {(core.drawdownPct || 0).toFixed(2)}%
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5">
            <div className="text-zinc-400 text-sm">WIN RATE</div>
            <div className="text-3xl font-mono mt-2 text-emerald-400">
              {(core.winRate || core.recentWinRate || 0).toFixed(1)}%
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5">
            <div className="text-zinc-400 text-sm">POSITIONS</div>
            <div className="text-3xl font-mono mt-2">
              {core.positionsCount || 0}
              <span className="text-zinc-500 text-lg"> / 7</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-3xl p-5">
            <div className="text-amber-400 text-sm">ML EXPERIENCES</div>
            <div className="text-3xl font-mono mt-2">{totalExperiences}</div>
            <div className="text-xs text-zinc-500 mt-1">
              Entry: {mlStatus.entryBufferSize || 0} • Exit: {mlStatus.exitBufferSize || 0}
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity size={18} /> ACTIVITY LOGS
            </h3>
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-xl text-sm"
            >
              <option value="all">All</option>
              <option value="entry">Entry / Rockets</option>
              <option value="exit">Exits</option>
              <option value="error">Errors</option>
            </select>
          </div>

          <div className="bg-black/50 rounded-2xl p-4 overflow-auto text-sm font-mono h-[420px]">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-zinc-500 py-16">
                No activity logs yet.
                <br />
                <span className="text-xs">Note: Core currently returns static placeholder logs.</span>
              </p>
            ) : (
              filteredLogs.map((l, i) => (
                <div key={i} className="py-1 break-all border-b border-zinc-900/50 last:border-0">
                  {l}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-zinc-600 text-xs mt-8">
          Weekend note: New entries are only scanned during regular market hours (Mon–Fri).
          Use <strong>MANUAL SCAN</strong> to force a test anytime.
        </p>
      </div>
    </div>
  );
}
