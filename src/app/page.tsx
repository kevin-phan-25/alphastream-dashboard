'use client';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Rocket, Shield, RefreshCw, Brain, Play, TrendingUp, Award, Settings, AlertTriangle
} from 'lucide-react';

const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

export default function TradingBotDashboard() {
  const [core, setCore] = useState<any>({});
  const [mlStatus, setMlStatus] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'entry' | 'exit' | 'error'>('all');
  const [logHeight, setLogHeight] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [winRateHistory, setWinRateHistory] = useState<number[]>([]);

  const cleanLog = (line: string) => {
    let cleaned = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (cleaned.includes("ADMIN-AUTH")) return "";
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
        timeout: 10000
      });
      setMlStatus(res.data || {});
    } catch (e) {
      console.warn("ML status failed");
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/admin/logs?limit=500`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      const rawLogs = Array.isArray(res.data) ? res.data : (res.data?.logs || []);
      const cleaned = rawLogs.map(cleanLog).filter(Boolean);
      setLogs(cleaned.slice(-500));
    } catch (e) {
      console.error("Logs fetch failed");
    }
  };

  // Update Win Rate History
  useEffect(() => {
    if (core.recentWinRate !== undefined) {
      setWinRateHistory(prev => {
        const newHistory = [...prev, Number(core.recentWinRate)];
        return newHistory.length > 20 ? newHistory.slice(-20) : newHistory;
      });
    }
  }, [core.recentWinRate]);

  const triggerTraining = async () => {
    if (!confirm("Trigger manual training cycle?")) return;
    setIsTraining(true);
    try {
      await axios.post(`${ML_BASE}/train`, { source: "dashboard", epochs: 4 }, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      alert("✅ Training triggered");
      setTimeout(fetchMLStatus, 4000);
    } catch {
      alert("Training failed");
    } finally {
      setIsTraining(false);
    }
  };

  const addFakeData = async () => {
    if (!confirm("Add 50 fake experiences?")) return;
    try {
      await axios.post(`${ML_BASE}/ingest/fake?count=50`, {}, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      fetchMLStatus();
    } catch {
      alert("Failed to add fake data");
    }
  };

  const triggerScan = async () => {
    try {
      await axios.post(`${CORE_BASE}/admin/scan`, {}, { headers: { 'x-admin-key': ADMIN_KEY } });
      alert("✅ Manual SCAN triggered — check logs for ENTRY ATTEMPT");
    } catch {
      alert("Scan failed");
    }
  };

  const panicFlat = async () => {
    if (!confirm("Close ALL positions?")) return;
    try {
      await axios.post(`${CORE_BASE}/admin/hard-flat`, {}, { headers: { 'x-admin-key': ADMIN_KEY } });
      fetchCore();
    } catch {
      alert("Panic Flat failed");
    }
  };

  const resetDD = async () => {
    try {
      await axios.post(`${CORE_BASE}/admin/reset-drawdown`, {}, { headers: { 'x-admin-key': ADMIN_KEY } });
      fetchCore();
    } catch {
      alert("Reset failed");
    }
  };

  // Polling
  useEffect(() => {
    fetchCore();
    fetchMLStatus();
    fetchActivityLogs();
    const coreInt = setInterval(() => {
      fetchCore();
      fetchMLStatus();
    }, 8000);
    const logsInt = setInterval(fetchActivityLogs, 5500);
    return () => {
      clearInterval(coreInt);
      clearInterval(logsInt);
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
      const newHeight = window.innerHeight - e.clientY - 140;
      if (newHeight > 180 && newHeight < 700) setLogHeight(newHeight);
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
    if (logFilter === 'entry') return log.includes("ENTRY") || log.includes("ATTEMPT") || log.includes("SUCCESS");
    if (logFilter === 'exit') return log.includes("EXIT") || log.includes("PROFIT") || log.includes("STOP") || log.includes("CLEANUP") || log.includes("CLOSE");
    if (logFilter === 'error') return log.includes("ERROR") || log.includes("SKIP") || log.includes("FAIL");
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
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />
          {winRateHistory.map((value, index) => {
            const x = (index / (winRateHistory.length - 1)) * 100;
            const y = 100 - ((value - min) / range) * 100;
            return <circle key={index} cx={x} cy={y} r="1.5" fill="#10b981" />;
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-zinc-500 px-1">
          <div>Oldest</div>
          <div>Now</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Rocket className="text-emerald-500" /> ALPHASTREAM
            </h1>
            <p className="text-zinc-500">MAG7 Trading Bot • Dynamic Sizing v5.6 BEAST</p>
          </div>
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-5 py-2.5 rounded-2xl">
            <RefreshCw size={20} /> Refresh
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={triggerScan} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-2xl font-medium flex items-center gap-2">
            <Rocket /> MANUAL SCAN
          </button>
          <button onClick={panicFlat} className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-2xl font-medium flex items-center gap-2">
            <Shield /> PANIC FLAT
          </button>
          <button onClick={resetDD} className="bg-amber-600 hover:bg-amber-500 px-6 py-3 rounded-2xl font-medium flex items-center gap-2">
            RESET DD
          </button>
          <button onClick={addFakeData} className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-2xl font-medium flex items-center gap-2">
            <Brain /> Add Fake Data
          </button>
          <button onClick={triggerTraining} disabled={isTraining} className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 px-6 py-3 rounded-2xl font-medium flex items-center gap-2">
            <Play /> {isTraining ? "Training..." : "Trigger Training"}
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">EQUITY</div>
            <div className="text-4xl font-mono mt-2">${(core.equity || 0).toLocaleString()}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">DRAWDOWN</div>
            <div className="text-4xl font-mono mt-2 text-emerald-400">{(core.drawdownPct || 0).toFixed(2)}%</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">WIN RATE</div>
            <div className="text-4xl font-mono mt-2">{(core.recentWinRate || 0).toFixed(1)}%</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">OPEN POSITIONS</div>
            <div className="text-4xl font-mono mt-2">{core.positions?.length || 0}/7</div>
          </div>
        </div>

        {/* ML + Risk Parameters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* ML Status */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Brain className="text-purple-400" /> ML MODELS
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-emerald-400">Entry Model</div>
                <div className="text-xs text-zinc-500 mt-1">Buffer: {mlStatus.entryBufferSize || 0}</div>
              </div>
              <div>
                <div className="text-emerald-400">Exit Model</div>
                <div className="text-xs text-zinc-500 mt-1">Buffer: {mlStatus.exitBufferSize || 0}</div>
              </div>
            </div>
          </div>
          {/* Risk & Adaptation Parameters */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="text-amber-400" /> RISK & ADAPTATION
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>Min Confidence: <span className="font-mono text-white">{core.adaptationParams?.minConfidence || 68}</span></div>
              <div>Base Risk $: <span className="font-mono text-white">{core.adaptationParams?.baseRiskDollar || 160}</span></div>
              <div>Max Positions: <span className="font-mono text-white">{core.adaptationParams?.maxPositions || 7}</span></div>
              <div>Win Rate: <span className="font-mono text-white">{(core.recentWinRate || 0).toFixed(1)}%</span></div>
            </div>
          </div>
        </div>

        {/* Win Rate Trend */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="text-emerald-400" /> WIN RATE TREND (Last 20 cycles)
            </h3>
            <div className="text-emerald-400 font-mono text-lg">
              {(core.recentWinRate || 0).toFixed(1)}%
            </div>
          </div>
          {renderWinRateChart()}
        </div>

        {/* Open Positions - Improved */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            OPEN POSITIONS ({core.positions?.length || 0})
            {core.positions?.length === 0 && <AlertTriangle className="text-amber-400" size={18} />}
          </h3>
          {core.positions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {core.positions.map((p: any, i: number) => (
                <div key={i} className="bg-black/40 rounded-2xl p-4 border border-zinc-700">
                  <div className="font-mono text-lg">{p.symbol} {p.side?.toUpperCase()}</div>
                  <div className="text-sm text-zinc-400 mt-1">
                    {Math.abs(p.qty)} @ ${Number(p.entry || 0).toFixed(2)}
                  </div>
                  {p.unrealizedPl !== undefined && (
                    <div className={`text-sm mt-1 ${p.unrealizedPl > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      PnL: ${p.unrealizedPl.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-amber-400 py-12 flex flex-col items-center gap-2">
              <AlertTriangle size={28} />
              No open positions<br/>
              <span className="text-sm text-zinc-500">Click MANUAL SCAN to force entries</span>
            </p>
          )}
        </div>

        {/* Logs */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
          <div className="flex justify-between mb-3">
            <h3 className="font-semibold">ACTIVITY LOGS</h3>
            <select value={logFilter} onChange={(e) => setLogFilter(e.target.value as any)} className="bg-zinc-800 text-xs px-3 py-1 rounded-lg border border-zinc-600">
              <option value="all">All</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="error">Errors</option>
            </select>
          </div>
          <div className="bg-black/60 rounded-2xl p-4 overflow-auto text-xs font-mono" style={{ maxHeight: logHeight }}>
            {filteredLogs.length === 0 ? (
              <p className="text-center text-zinc-500 py-12">Waiting for logs...</p>
            ) : (
              filteredLogs.map((log, i) => <div key={i} className="py-0.5 break-all">{log}</div>)
            )}
          </div>
          <div className="h-1 bg-zinc-700 mt-3 rounded cursor-ns-resize hover:bg-zinc-500" onMouseDown={handleMouseDown} />
        </div>
      </div>
    </div>
  );
}
