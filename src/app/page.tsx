'use client';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Rocket, Shield, RefreshCw, Target, Activity, AlertTriangle } from 'lucide-react';

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
  const [coreError, setCoreError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4200);
  };

  const cleanLog = (line: string) => line.replace(/\x1b\[[0-9;]*m/g, '').trim();

  // ==================== FETCH FUNCTIONS ====================
  const fetchCore = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/status`, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 10000,
      });
      const newData = res.data || {};
      setCore(newData);
      setCoreError(null);

      if (typeof newData.recentWinRate === 'number') {
        setWinRateHistory(prev => {
          const next = [...prev, newData.recentWinRate];
          return next.length > 20 ? next.slice(-20) : next;
        });
      }
    } catch (err: any) {
      console.error("Core fetch error:", err);
      setCoreError(err.response?.data?.error || err.message || 'Failed to connect to Core');
    }
  };

  const fetchMLStatus = async () => {
    try {
      const res = await axios.get(`${ML_BASE}/ml/status`, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 8000,
      });
      setMlStatus(res.data || {});
    } catch (err) {
      console.warn("ML status fetch failed (non-critical)");
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/admin/logs?limit=800`, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 10000,
      });
      const rawLogs = Array.isArray(res.data?.logs) ? res.data.logs : [];
      const cleaned = rawLogs.map(cleanLog).filter(Boolean);
      setLogs(cleaned.slice(-800));
    } catch (err: any) {
      console.error("Logs fetch error:", err);
    }
  };

  const fetchLivePrices = useCallback(async () => {
    if (!core.positions?.length) return;
    const prices: Record<string, number> = {};
    for (const p of core.positions) {
      try {
        const res = await axios.get(`${CORE_BASE}/price/${p.symbol}`, {
          headers: { 'x-admin-key': ADMIN_KEY },
          timeout: 6000,
        });
        prices[p.symbol] = res.data.price || 0;
      } catch {}
    }
    setLivePrices(prices);
  }, [core.positions]);

  // ==================== INITIAL LOAD + POLLING ====================
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchCore(), fetchMLStatus(), fetchActivityLogs()]);
      setIsLoading(false);
    };

    loadAll();

    const i1 = setInterval(fetchCore, 12000);
    const i2 = setInterval(fetchMLStatus, 25000);
    const i3 = setInterval(fetchActivityLogs, 10000);
    const i4 = setInterval(fetchLivePrices, 25000);

    return () => {
      [i1, i2, i3, i4].forEach(clearInterval);
    };
  }, [fetchLivePrices]);

  // ==================== ACTIONS ====================
  const triggerAction = async (endpoint: string, msg: string, dangerous = false) => {
    if (dangerous && !confirm(`⚠️ Confirm ${msg}?`)) return;

    setActionLoading(endpoint);
    try {
      await axios.post(`${CORE_BASE}${endpoint}`, {}, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 15000,
      });
      showFeedback('success', msg);
      await Promise.all([fetchCore(), fetchActivityLogs()]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Action failed';
      showFeedback('error', `Failed: ${errorMsg}`);
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const triggerTraining = async () => {
    setActionLoading('train');
    try {
      await axios.post(`${ML_BASE}/train`, {}, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 15000,
      });
      showFeedback('success', 'Training started');
      setTimeout(fetchMLStatus, 4000);
    } catch (err: any) {
      showFeedback('error', 'Training request failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    const lower = log.toLowerCase();
    if (logFilter === 'entry') return lower.includes('entry') || lower.includes('buy');
    if (logFilter === 'exit') return lower.includes('exit') || lower.includes('sell');
    if (logFilter === 'error') return lower.includes('error') || lower.includes('fail');
    return true;
  });

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
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-2xl transition"
          >
            <RefreshCw size={20} /> Refresh All
          </button>
        </div>

        {/* Error Banner */}
        {coreError && (
          <div className="bg-red-900/80 border border-red-500 text-red-200 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3">
            <AlertTriangle className="text-red-400" />
            <div>
              <div className="font-semibold">Core Service Unreachable</div>
              <div className="text-sm">{coreError}</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => triggerAction('/admin/scan', 'Manual scan triggered')}
            disabled={!!actionLoading}
            className="bg-emerald-600 hover:bg-emerald-700 px-7 py-3.5 rounded-2xl font-medium disabled:opacity-50 transition flex items-center gap-2"
          >
            MANUAL SCAN
          </button>
          <button 
            onClick={() => triggerAction('/admin/hard-flat', 'Panic flat executed', true)} 
            disabled={!!actionLoading}
            className="bg-red-600 hover:bg-red-700 px-7 py-3.5 rounded-2xl font-medium disabled:opacity-50 transition"
          >
            PANIC FLAT
          </button>
          <button 
            onClick={() => triggerAction('/admin/clear-blacklist', 'Blacklist cleared')} 
            disabled={!!actionLoading}
            className="bg-orange-600 hover:bg-orange-700 px-7 py-3.5 rounded-2xl font-medium disabled:opacity-50 transition"
          >
            Clear Blacklist
          </button>
          <button 
            onClick={triggerTraining} 
            disabled={!!actionLoading}
            className="bg-blue-600 hover:bg-blue-700 px-7 py-3.5 rounded-2xl font-medium disabled:opacity-50 transition"
          >
            Trigger Training
          </button>
        </div>

        {/* Rest of your dashboard remains the same... */}
        {/* (Status Cards, ML Status, Win Rate, Positions, Logs) */}
        {/* ... copy the rest from your original code ... */}

        {/* Logs Section - Improved */}
        <div className="glass rounded-3xl p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Activity /> ACTIVITY LOGS</h3>
            <select 
              value={logFilter} 
              onChange={(e) => setLogFilter(e.target.value as any)} 
              className="bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-700"
            >
              <option value="all">All</option>
              <option value="entry">Entries</option>
              <option value="exit">Exits</option>
              <option value="error">Errors</option>
            </select>
          </div>
          <div className="bg-black/80 rounded-2xl p-5 overflow-auto text-sm font-mono h-[460px] border border-zinc-800">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-zinc-500 py-20">No logs yet. Check if backend is running.</p>
            ) : (
              filteredLogs.map((l, i) => (
                <div key={i} className="py-1 break-all hover:bg-zinc-900 px-2 rounded">
                  {l}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
