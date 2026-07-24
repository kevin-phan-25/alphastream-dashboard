'use client';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Rocket, RefreshCw, Target, Activity, AlertTriangle, TrendingUp,
  BarChart3, Zap, CheckCircle, XCircle
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

  // ML Visualizations
  const [rocData, setRocData] = useState<Array<{fpr: number, tpr: number}>>([]);
  const [auc, setAuc] = useState<number>(0);
  const [confusionMatrix, setConfusionMatrix] = useState<number[][]>([[0,0],[0,0]]);
  const [shapValues, setShapValues] = useState<Array<{feature: string, value: number}>>([]);

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
        timeout: 10000
      });
      const data = res.data || {};
      setCore(data);
      setCoreError(null);
      setIsCoreConnected(true);
      
      if (typeof data.winRate === 'number') {
        setWinRateHistory(prev => [...prev, data.winRate].slice(-20));
      }
      if (typeof data.equity === 'number') {
        setEquityHistory(prev => [...prev, data.equity].slice(-60));
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
        timeout: 8000
      });
      const data = res.data || {};
      setMlStatus(data);
      setMlError(null);
      setIsMLConnected(true);

      if (data.rocCurve) setRocData(data.rocCurve);
      if (typeof data.auc === 'number') setAuc(data.auc);
      if (data.confusionMatrix) setConfusionMatrix(data.confusionMatrix);
      if (data.shapValues) setShapValues(data.shapValues);
    } catch (err) {
      setMlError("ML service unreachable");
      setIsMLConnected(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/admin/logs?limit=800`, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 10000
      });
      const raw = Array.isArray(res.data?.logs) ? res.data.logs : [];
      setLogs(raw.map(cleanLog).filter(Boolean).slice(-800));
    } catch (err) {
      console.warn("Logs fetch failed", err);
    }
  };

  const fetchLivePrices = useCallback(async () => {
    if (!core.positions?.length) return;
    const prices: Record<string, number> = {};
    for (const p of core.positions) {
      try {
        const res = await axios.get(`${CORE_BASE}/price/${p.symbol}`, {
          headers: { 'x-admin-key': ADMIN_KEY },
          timeout: 6000
        });
        prices[p.symbol] = res.data.price || 0;
      } catch {}
    }
    setLivePrices(prices);
  }, [core.positions]);

  // ==================== POLLING ====================
  useEffect(() => {
    fetchCore();
    fetchMLStatus();
    fetchActivityLogs();

    const intervals = [
      setInterval(fetchCore, 12000),
      setInterval(fetchMLStatus, 25000),
      setInterval(fetchActivityLogs, 15000),
      setInterval(fetchLivePrices, 30000)
    ];

    return () => intervals.forEach(clearInterval);
  }, [fetchLivePrices]);

  // ==================== ACTIONS ====================
  const triggerAction = async (endpoint: string, msg: string, dangerous = false) => {
    if (dangerous && !confirm(`Confirm ${msg}?`)) return;
    
    setActionLoading(endpoint);
    try {
      await axios.post(`${CORE_BASE}${endpoint}`, {}, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 15000
      });
      showFeedback('success', msg);
      fetchCore();
      fetchActivityLogs();
    } catch (err: any) {
      showFeedback('error', `Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const triggerTraining = async () => {
    setActionLoading('train');
    try {
      await axios.post(`${ML_BASE}/train`, {}, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      showFeedback('success', 'Training started');
      setTimeout(fetchMLStatus, 3000);
    } catch {
      showFeedback('error', 'Training failed');
    } finally {
      setActionLoading(null);
    }
  };

  const isTrainingActive = (mlStatus.entryBufferSize || 0) + (mlStatus.exitBufferSize || 0) > 0;

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    const lower = log.toLowerCase();
    if (logFilter === 'entry') return lower.includes('entry') || lower.includes('buy');
    if (logFilter === 'exit') return lower.includes('exit') || lower.includes('sell');
    if (logFilter === 'error') return lower.includes('error') || lower.includes('fail');
    return true;
  });

  const matrixLabels = ['True Negative', 'False Positive', 'False Negative', 'True Positive'];

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

        {/* Connection Status */}
        <div className="flex gap-4 mb-6">
          <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 ${isCoreConnected ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
            {isCoreConnected ? <CheckCircle size={18} /> : <XCircle size={18} />}
            Core Service
          </div>
          <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 ${isMLConnected ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
            {isMLConnected ? <CheckCircle size={18} /> : <XCircle size={18} />}
            ML Service
          </div>
        </div>

        {/* Core Error */}
        {coreError && (
          <div className="bg-red-900/70 border border-red-500 text-red-200 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3">
            <AlertTriangle />
            <div className="text-sm">{coreError}</div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={() => triggerAction('/admin/scan', 'Manual scan triggered')} disabled={!!actionLoading} className="bg-emerald-600 hover:bg-emerald-700 px-7 py-3.5 rounded-2xl font-medium disabled:opacity-50">
            MANUAL SCAN
          </button>
          <button onClick={() => triggerAction('/admin/hard-flat', 'Panic flat executed', true)} disabled={!!actionLoading} className="bg-red-600 hover:bg-red-700 px-7 py-3.5 rounded-2xl font-medium disabled:opacity-50">
            PANIC FLAT
          </button>
          <button onClick={triggerTraining} disabled={!!actionLoading} className="bg-blue-600 hover:bg-blue-700 px-7 py-3.5 rounded-2xl font-medium disabled:opacity-50">
            Trigger Training
          </button>
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
            <div className="text-4xl font-mono mt-3 text-emerald-400">{(core.winRate || core.recentWinRate || 0).toFixed(1)}%</div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="text-zinc-400">POSITIONS</div>
            <div className="text-4xl font-mono mt-3">{core.positionsCount || 0}/7</div>
          </div>
          <div className="glass border border-amber-500/30 rounded-3xl p-6">
            <div className="text-amber-400">ML EXPERIENCES</div>
            <div className="text-3xl font-mono mt-3">{mlStatus.totalExperiences || 0}</div>
          </div>
        </div>

        {/* Rest of your visualizations (ROC, Confusion Matrix, SHAP, Equity Curve, etc.) remain the same */}
        {/* ... paste the rest of your original UI here if you want ... */}

        {/* Logs Section */}
        <div className="glass rounded-3xl p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Activity /> ACTIVITY LOGS</h3>
            <select value={logFilter} onChange={(e) => setLogFilter(e.target.value as any)} className="bg-zinc-800 px-4 py-2 rounded-xl">
              <option value="all">All</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="error">Errors</option>
            </select>
          </div>
          <div className="bg-black/60 rounded-2xl p-5 overflow-auto text-sm font-mono h-[420px]">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-zinc-500 py-12">Waiting for activity logs...</p>
            ) : (
              filteredLogs.map((l, i) => <div key={i} className="py-1 break-all">{l}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
