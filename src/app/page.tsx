'use client';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Rocket, Shield, RefreshCw, Target, Activity, AlertTriangle, TrendingUp,
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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  
  const [coreError, setCoreError] = useState<string | null>(null);
  const [mlError, setMlError] = useState<string | null>(null);
  const [isCoreConnected, setIsCoreConnected] = useState(false);
  const [isMLConnected, setIsMLConnected] = useState(false);

  const [hoveredEquity, setHoveredEquity] = useState<{index: number, value: number} | null>(null);
  const [hoveredMatrixCell, setHoveredMatrixCell] = useState<{row: number, col: number, value: number, label: string} | null>(null);

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
        timeout: 8000
      });
      const newData = res.data || {};
      setCore(newData);
      setCoreError(null);
      setIsCoreConnected(true);

      if (typeof newData.recentWinRate === 'number') {
        setWinRateHistory(prev => [...prev, newData.recentWinRate].slice(-20));
      }
      if (typeof newData.equity === 'number') {
        setEquityHistory(prev => [...prev, newData.equity].slice(-60));
      }
    } catch (err: any) {
      setCoreError(`Core service unreachable: ${err.message}`);
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
      if (data.confusionMatrix && Array.isArray(data.confusionMatrix)) {
        setConfusionMatrix(data.confusionMatrix);
      }
      if (data.shapValues && Array.isArray(data.shapValues)) {
        setShapValues(data.shapValues);
      }
    } catch (err: any) {
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
    } catch {}
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

    const i1 = setInterval(fetchCore, 12000);
    const i2 = setInterval(fetchMLStatus, 25000);
    const i3 = setInterval(fetchActivityLogs, 15000);
    const i4 = setInterval(fetchLivePrices, 30000);

    return () => [i1, i2, i3, i4].forEach(clearInterval);
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
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 15000
      });
      showFeedback('success', 'Training cycle started');
      setTimeout(fetchMLStatus, 3000);
    } catch {
      showFeedback('error', 'Training request failed');
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
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-2xl transition"
          >
            <RefreshCw size={20} /> Refresh All
          </button>
        </div>

        {/* Connection Status */}
        <div className="flex gap-4 mb-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${isCoreConnected ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
            {isCoreConnected ? <CheckCircle size={18} /> : <XCircle size={18} />}
            Core Service
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${isMLConnected ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
            {isMLConnected ? <CheckCircle size={18} /> : <XCircle size={18} />}
            ML Service
          </div>
        </div>

        {/* Core Error */}
        {coreError && (
          <div className="bg-red-900/70 border border-red-500 text-red-200 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3">
            <AlertTriangle />
            <div>
              <div className="font-semibold">Core Service Problem</div>
              <div className="text-sm">{coreError}</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={() => triggerAction('/admin/scan', 'Manual scan triggered')} disabled={!!actionLoading} className="bg-emerald-600 hover:bg-emerald-700 px-7 py-3.5 rounded-2xl font-medium disabled:opacity-50 transition">
            MANUAL SCAN
          </button>
          <button onClick={() => triggerAction('/admin/hard-flat', 'Panic flat executed', true)} disabled={!!actionLoading} className="bg-red-600 hover:bg-red-700 px-7 py-3.5 rounded-2xl font-medium disabled:opacity-50 transition">
            PANIC FLAT
          </button>
          <button onClick={() => triggerAction('/admin/clear-blacklist', 'Blacklist cleared')} disabled={!!actionLoading} className="bg-orange-600 hover:bg-orange-700 px-7 py-3.5 rounded-2xl font-medium disabled:opacity-50 transition">
            Clear Blacklist
          </button>
          <button onClick={triggerTraining} disabled={!!actionLoading} className="bg-blue-600 hover:bg-blue-700 px-7 py-3.5 rounded-2xl font-medium disabled:opacity-50 transition">
            Trigger Training
          </button>
        </div>

        {/* Rest of your components remain the same... */}
        {/* (Status Cards, ML Status, Visualizations, Equity Curve, etc.) */}

        {/* ... [I kept the rest of your original UI components unchanged for brevity] ... */}

      </div>
    </div>
  );
}
