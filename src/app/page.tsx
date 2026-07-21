'use client';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Rocket, Shield, RefreshCw, Target, Activity, AlertTriangle, TrendingUp,
  BarChart3, Zap, Loader
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
  const [hoveredEquity, setHoveredEquity] = useState<{index: number, value: number} | null>(null);
  const [hoveredMatrixCell, setHoveredMatrixCell] = useState<{row: number, col: number, value: number, label: string} | null>(null);
  const [rocData, setRocData] = useState<Array<{fpr: number, tpr: number}>>([]);
  const [auc, setAuc] = useState<number>(0);
  const [confusionMatrix, setConfusionMatrix] = useState<number[][]>([[0,0],[0,0]]);
  const [shapValues, setShapValues] = useState<Array<{feature: string, value: number}>>([]);
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
        timeout: 10000
      });
      const newData = res.data || {};
      setCore(newData);
      setCoreError(null);
      if (typeof newData.recentWinRate === 'number') {
        setWinRateHistory(prev => [...prev, newData.recentWinRate].slice(-20));
      }
      if (typeof newData.equity === 'number') {
        setEquityHistory(prev => [...prev, newData.equity].slice(-60));
      }
    } catch (err: any) {
      setCoreError(`Core service error: ${err.message}`);
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
      if (data.rocCurve) setRocData(data.rocCurve);
      if (typeof data.auc === 'number') setAuc(data.auc);
      if (data.confusionMatrix && Array.isArray(data.confusionMatrix)) setConfusionMatrix(data.confusionMatrix);
      if (data.shapValues && Array.isArray(data.shapValues)) setShapValues(data.shapValues);
    } catch {}
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
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchCore(), fetchMLStatus(), fetchActivityLogs()]);
      setIsLoading(false);
    };
    load();

    const i1 = setInterval(fetchCore, 15000);
    const i2 = setInterval(fetchMLStatus, 20000);
    const i3 = setInterval(fetchActivityLogs, 12000);
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
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      showFeedback('error', `Action failed: ${errorMsg}`);
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
      showFeedback('success', 'Training triggered');
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

        {/* Loading / Error */}
        {isLoading && <div className="text-center py-8"><Loader className="animate-spin mx-auto" /></div>}
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
            <div><div className="text-zinc-400">Far-Slope</div><div className="text-xl font-mono text-emerald-400">✓ ACTIVE</div></div>
            <div>
              <div className="text-zinc-400">Training</div>
              <div className={`text-xl font-mono ${isTrainingActive ? 'text-emerald-400' : 'text-zinc-500'}`}>{isTrainingActive ? 'RUNNING' : 'IDLE'}</div>
            </div>
            <div><div className="text-zinc-400">Entry Buffer</div><div className="text-2xl font-mono">{mlStatus.entryBufferSize || 0}</div></div>
            <div><div className="text-zinc-400">Exit Buffer</div><div className="text-2xl font-mono">{mlStatus.exitBufferSize || 0}</div></div>
            <div><div className="text-zinc-400">SumTree</div><div className="text-sm font-mono">E: {mlStatus.sumTreeEntry || 0} / X: {mlStatus.sumTreeExit || 0}</div></div>
            <div>
              <div className="text-zinc-400">Last Trained</div>
              <div className="text-sm font-mono text-zinc-400">{mlStatus.lastTrainedAt ? new Date(mlStatus.lastTrainedAt).toLocaleTimeString() : 'Never'}</div>
            </div>
          </div>
        </div>

        {/* ROC AUC Visualization */}
        <div className="glass rounded-3xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="text-violet-400" /> ROC AUC CURVE</h3>
            <div className="text-violet-400 font-mono text-xl">AUC: {auc.toFixed(3)}</div>
          </div>
          <div className="relative h-64 w-full bg-black/40 rounded-2xl p-4">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[0, 25, 50, 75, 100].map((y, i) => <line key={i} x1="0" y1={y} x2="100" y2={y} stroke="#27272a" strokeWidth="0.5" />)}
              {[0, 25, 50, 75, 100].map((x, i) => <line key={i} x1={x} y1="0" x2={x} y2="100" stroke="#27272a" strokeWidth="0.5" />)}
              <line x1="0" y1="100" x2="100" y2="0" stroke="#3f3f46" strokeWidth="1.5" strokeDasharray="2,2" />
              {rocData.length > 1 && (
                <polyline fill="none" stroke="#a855f7" strokeWidth="3" strokeLinejoin="round" points={rocData.map((point) => {
                  const x = point.fpr * 100;
                  const y = (1 - point.tpr) * 100;
                  return `${x},${y}`;
                }).join(" ")} />
              )}
              {rocData.map((point, i) => {
                const x = point.fpr * 100;
                const y = (1 - point.tpr) * 100;
                return <circle key={i} cx={x} cy={y} r="1.2" fill="#c084fc" />;
              })}
            </svg>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="glass rounded-3xl p-6 mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="text-rose-400" /> CONFUSION MATRIX</h3>
          <div className="flex justify-center">
            <div className="relative inline-block">
              <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-2xl">
                {confusionMatrix.flat().map((value, idx) => {
                  const row = Math.floor(idx / 2);
                  const col = idx % 2;
                  const isPositive = (row === 1 && col === 1) || (row === 0 && col === 0);
                  return (
                    <div
                      key={idx}
                      className={`w-32 h-32 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all hover:scale-105 border-2 ${isPositive ? 'border-emerald-500/30' : 'border-rose-500/30'}`}
                      onMouseEnter={() => setHoveredMatrixCell({ row, col, value, label: matrixLabels[idx] })}
                      onMouseLeave={() => setHoveredMatrixCell(null)}
                    >
                      <div className="text-4xl font-mono font-bold text-white">{value}</div>
                      <div className="text-xs text-zinc-400 mt-1">
                        {row === 0 ? 'Predicted Neg' : 'Predicted Pos'}<br />
                        {col === 0 ? 'Actual Neg' : 'Actual Pos'}
                      </div>
                    </div>
                  );
                })}
              </div>
              {hoveredMatrixCell && (
                <div className="absolute bg-zinc-900 border border-violet-500 px-5 py-3 rounded-2xl text-sm pointer-events-none shadow-2xl z-10 -top-20 left-1/2 -translate-x-1/2">
                  <div className="font-semibold text-violet-300">{hoveredMatrixCell.label}</div>
                  <div className="font-mono text-xl mt-1">{hoveredMatrixCell.value}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SHAP Feature Importance */}
        <div className="glass rounded-3xl p-6 mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap className="text-amber-400" /> SHAP FEATURE IMPORTANCE</h3>
          <div className="h-80 relative">
            {shapValues.length > 0 ? (
              <div className="space-y-4 pt-4">
                {shapValues
                  .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
                  .slice(0, 8)
                  .map((item, i) => {
                    const absVal = Math.abs(item.value);
                    const maxAbs = Math.max(...shapValues.map(v => Math.abs(v.value)), 1);
                    const widthPercent = (absVal / maxAbs) * 100;
                    const isPositive = item.value > 0;
                    return (
                      <div key={i} className="flex items-center gap-4 group">
                        <div className="w-40 font-mono text-sm text-right text-zinc-400 truncate">{item.feature}</div>
                        <div className="flex-1 h-8 bg-zinc-900 rounded-full overflow-hidden relative">
                          <div className={`h-full transition-all duration-300 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${widthPercent}%`, marginLeft: isPositive ? '0' : `${100 - widthPercent}%` }} />
                        </div>
                        <div className={`font-mono text-sm w-20 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.value.toFixed(3)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-zinc-500 flex items-center justify-center h-full">
                SHAP values will appear after training
              </div>
            )}
          </div>
        </div>

        {/* Interactive Equity Curve */}
        <div className="glass rounded-3xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2"><TrendingUp /> INTERACTIVE EQUITY CURVE</h3>
            <div className="text-emerald-400 font-mono text-xl">${(core.equity || 0).toLocaleString()}</div>
          </div>
          {equityHistory.length < 3 ? (
            <div className="text-zinc-500 py-16 text-center">Building equity curve from live data...</div>
          ) : (
            <div className="relative h-64 w-full">
              <svg viewBox="0 0 100 100" className="w-full h-full" onMouseLeave={() => setHoveredEquity(null)}>
                {[0, 25, 50, 75, 100].map((y, i) => <line key={i} x1="0" y1={y} x2="100" y2={y} stroke="#27272a" strokeWidth="0.5" />)}
                <polyline fill="none" stroke="#10b981" strokeWidth="3" strokeLinejoin="round"
                  points={equityHistory.map((v, i) => {
                    const x = (i / (equityHistory.length - 1)) * 100;
                    const minV = Math.min(...equityHistory);
                    const maxV = Math.max(...equityHistory);
                    const y = 100 - ((v - minV) / (maxV - minV || 1)) * 100;
                    return `${x},${y}`;
                  }).join(" ")} />
                {equityHistory.map((v, i) => {
                  const x = (i / (equityHistory.length - 1)) * 100;
                  const minV = Math.min(...equityHistory);
                  const maxV = Math.max(...equityHistory);
                  const y = 100 - ((v - minV) / (maxV - minV || 1)) * 100;
                  return (
                    <circle key={i} cx={x} cy={y} r="1.5" fill="#10b981" className="cursor-pointer hover:r-2.5 transition-all"
                      onMouseEnter={() => setHoveredEquity({ index: i, value: v })} />
                  );
                })}
              </svg>
              {hoveredEquity && (
                <div className="absolute bg-zinc-900 border border-emerald-500 px-4 py-2 rounded-xl text-sm pointer-events-none shadow-xl"
                  style={{ left: `${(hoveredEquity.index / (equityHistory.length - 1)) * 100}%`, top: '15%' }}>
                  Equity: ${hoveredEquity.value.toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Win Rate Trend */}
        <div className="glass rounded-3xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Target /> WIN RATE TREND (Last 20)</h3>
            <div className="text-emerald-400 font-mono text-lg">{(core.recentWinRate || 0).toFixed(1)}%</div>
          </div>
          {winRateHistory.length < 2 ? (
            <div className="text-zinc-500 py-8 text-center">Collecting win rate data...</div>
          ) : (
            <div className="relative h-48 w-full">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {[0, 25, 50, 75, 100].map((y, i) => <line key={i} x1="0" y1={y} x2="100" y2={y} stroke="#27272a" strokeWidth="0.5" />)}
                <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={winRateHistory.map((v, i) => {
                  const x = (i / (winRateHistory.length - 1)) * 100;
                  const y = 100 - ((v - Math.min(...winRateHistory)) / (Math.max(...winRateHistory) - Math.min(...winRateHistory) || 1)) * 100;
                  return `${x},${y}`;
                }).join(" ")} />
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
                  <div className="text-sm text-zinc-400">{Math.abs(p.qty)} @ ${Number(p.entry || 0).toFixed(2)}</div>
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
