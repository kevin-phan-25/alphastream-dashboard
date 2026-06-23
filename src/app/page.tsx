'use client';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Rocket, Shield, RefreshCw, Brain, Play, TrendingUp, Award, 
  AlertTriangle, Target, Activity, CheckCircle, XCircle, Zap
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
      const res = await axios.get(`${CORE_BASE}/health`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      setCore(res.data || {});
    } catch (e) {
      console.error("Core fetch failed");
    }
  };

  const fetchMLStatus = async () => {
    try {
      const res = await axios.get(`${ML_BASE}/ml/status`, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 8000
      });
      setMlStatus(res.data || {});
    } catch (e) {
      console.warn("ML status fetch failed");
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/admin/logs?limit=600`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      const rawLogs = Array.isArray(res.data) ? res.data : [];
      const cleaned = rawLogs.map(cleanLog).filter(Boolean);
      setLogs(cleaned.slice(-600));
    } catch (e) {
      console.error("Logs fetch failed");
    }
  };

  // Win Rate History
  useEffect(() => {
    if (core.recentWinRate !== undefined) {
      setWinRateHistory(prev => {
        const newHistory = [...prev, Number(core.recentWinRate)];
        return newHistory.length > 20 ? newHistory.slice(-20) : newHistory;
      });
    }
  }, [core.recentWinRate]);

  // Silent Action Handlers
  const triggerAction = async (endpoint: string, successMsg: string) => {
    setActionLoading(endpoint);
    try {
      await axios.post(`${CORE_BASE}${endpoint}`, {}, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      showFeedback('success', successMsg);
      fetchCore();
    } catch (e) {
      showFeedback('error', `${successMsg.split(' ')[0]} failed`);
    } finally {
      setActionLoading(null);
    }
  };

  const triggerScan = () => triggerAction('/admin/scan', 'Manual scan triggered');
  const panicFlat = () => triggerAction('/admin/hard-flat', 'Panic flat executed — all positions closed');
  const resetDD = () => triggerAction('/admin/reset-drawdown', 'Drawdown reset successfully');

  const addFakeData = async () => {
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
      showFeedback('success', 'Training cycle started');
      setTimeout(fetchMLStatus, 2500);
    } catch {
      showFeedback('error', 'Training request failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Auto-refresh
  useEffect(() => {
    fetchCore();
    fetchMLStatus();
    fetchActivityLogs();

    const interval = setInterval(() => {
      fetchCore();
      fetchMLStatus();
    }, 7000);

    const logInterval = setInterval(fetchActivityLogs, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(logInterval);
    };
  }, []);

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
    if (logFilter === 'entry') return log.includes("ENTRY") || log.includes("ATTEMPT");
    if (logFilter === 'exit') return log.includes("EXIT") || log.includes("CLOSE") || log.includes("PROFIT") || log.includes("STOP");
    if (logFilter === 'error') return log.includes("ERROR") || log.includes("FAIL") || log.includes("WARN");
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 bg-grid-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold flex items-center gap-4">
              <Rocket className="text-emerald-500" /> ALPHASTREAM
            </h1>
            <p className="text-zinc-400 mt-1">FABLE-5 • MAG7 Autonomous Trader</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-2xl transition"
          >
            <RefreshCw size={20} /> Refresh All
          </button>
        </div>

        {/* Feedback Toast */}
        {feedback && (
          <div className={`fixed top-8 right-8 px-6 py-4 rounded-2xl flex items-center gap-3 z-50 shadow-2xl feedback-toast
            ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {feedback.type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={triggerScan} disabled={actionLoading === '/admin/scan'} 
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 px-7 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition hover-scale">
            <Rocket /> MANUAL SCAN
          </button>
          <button onClick={panicFlat} disabled={actionLoading === '/admin/hard-flat'}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-70 px-7 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition hover-scale">
            <Shield /> PANIC FLAT
          </button>
          <button onClick={resetDD} disabled={actionLoading === '/admin/reset-drawdown'}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-70 px-7 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition hover-scale">
            RESET DD
          </button>
          <button onClick={addFakeData} disabled={actionLoading === 'fake'}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-70 px-7 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition hover-scale">
            <Brain /> Fake Data (100)
          </button>
          <button onClick={triggerTraining} disabled={actionLoading === 'train'}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-70 px-7 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition hover-scale">
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
            <div className="text-4xl font-mono mt-3">{(core.recentWinRate || 0).toFixed(1)}%</div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">POSITIONS</div>
            <div className="text-4xl font-mono mt-3">{core.positions?.length || 0}/7</div>
          </div>
          <div className="glass border border-amber-500/30 rounded-3xl p-6">
            <div className="text-amber-400 text-sm">ML BUFFER</div>
            <div className="text-3xl font-mono mt-3">{mlStatus.globalBufferSize || 0}</div>
            <div className="text-xs text-zinc-500 mt-1">Trained {mlStatus.totalTrainingRuns || 0}x</div>
          </div>
        </div>

        {/* Fable-5 Status */}
        <div className="glass rounded-3xl p-6 mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-amber-400">
            <Target size={22} /> FABLE-5 + ML STATUS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <div className="text-zinc-400 text-sm">Far-Slope</div>
              <div className="text-xl font-mono text-emerald-400">✓ {mlStatus.fable5?.farSlopeEnabled ? 'ACTIVE' : 'OFF'}</div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm">Training</div>
              <div className={`text-xl font-mono ${mlStatus.trainingActive ? 'text-amber-400' : 'text-emerald-400'}`}>
                {mlStatus.trainingActive ? 'RUNNING' : 'IDLE'}
              </div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm">Last Trained</div>
              <div className="text-lg font-mono">{mlStatus.lastTrainedAt ? new Date(mlStatus.lastTrainedAt).toLocaleTimeString() : 'Never'}</div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm">Exit Buffer</div>
              <div className="text-2xl font-mono">{mlStatus.exitBufferSize || 0}</div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm">Total Experiences</div>
              <div className="text-2xl font-mono text-purple-400">{mlStatus.totalExperiences || 0}</div>
            </div>
          </div>
        </div>

        {/* Win Rate Trend + Positions + Logs sections remain the same as my previous version (with toast feedback already integrated) */}

        {/* ... (Win Rate Chart, Open Positions, Logs sections from previous response) ... */}

      </div>
    </div>
  );
}
