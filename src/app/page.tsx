'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Bot, Activity, Loader2, AlertTriangle, Shield, Rocket, Lock, Unlock, TrendingUp,
  Brain, RefreshCw, ArrowUp, ArrowDown, TrendingDown, Award
} from 'lucide-react';

const CORE_BASE = 'https://alphastream-core-1017433009054.us-east1.run.app';
const ML_BASE = 'https://alphastream-ml-1017433009054.us-east1.run.app';
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

export default function TradingBotDashboard() {
  const [core, setCore] = useState<any>({});
  const [mlStatus, setMlStatus] = useState({
    entryModelReady: false,
    exitModelReady: false,
    exitBufferSize: 0,
    entryBufferSize: 0,
    version: 'unknown',
    trainingActive: false,
    recentLoss: null as number | null,
    avgLoss: null as number | null,
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'entry' | 'exit' | 'error'>('all');
  const [logHeight, setLogHeight] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  const cleanLog = (line: string): string => {
    let cleaned = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (cleaned.includes("ADMIN-AUTH")) return "";
    if (cleaned.includes("429") || cleaned.includes("rate limit")) {
      return `[RATE LIMIT] ${cleaned.split("Request failed")[0] || cleaned}`;
    }
    return cleaned;
  };

  const fetchCore = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/health`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      setCore(res.data || {});
    } catch (e) {
      console.error("Core fetch failed", e);
    }
  };

  const fetchMLStatus = async () => {
    try {
      const res = await axios.get(`${ML_BASE}/ml/status`, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 10000
      });
      
      const data = res.data || {};

      setMlStatus({
        entryModelReady: data.models?.entry?.ready ?? data.entryModelReady ?? true,
        exitModelReady: data.models?.exit?.ready ?? data.exitModelReady ?? true,
        exitBufferSize: data.models?.exit?.bufferSize ?? data.exitBufferSize ?? 0,
        entryBufferSize: data.models?.entry?.bufferSize ?? data.entryBufferSize ?? 0,
        version: data.version || 'v4.1',
        trainingActive: data.trainingActive ?? false,
        recentLoss: data.recentLoss ?? null,
        avgLoss: data.avgLoss ?? null,
      });
    } catch (e) {
      console.warn("ML status failed, using fallback", e);
      setMlStatus({
        entryModelReady: true,
        exitModelReady: true,
        exitBufferSize: 0,
        entryBufferSize: 0,
        version: 'v4.1 (fallback)',
        trainingActive: false,
        recentLoss: null,
        avgLoss: null,
      });
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/admin/logs?limit=300`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      let rawLogs = Array.isArray(res.data) ? res.data : (res.data?.logs || res.data || []);
      const cleaned = rawLogs.map(cleanLog).filter(Boolean);
      setLogs(cleaned.slice(-300));
    } catch (e) {
      console.error("Logs fetch failed", e);
    }
  };

  // === NEW: Add Fake Data Button ===
  const addFakeData = async () => {
    if (!confirm("Add 50 fake experiences to ML buffer for testing?")) return;
    try {
      const res = await axios.post(`${ML_BASE}/ingest/fake?count=50`, {}, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      alert(`✅ ${res.data.added} fake experiences added!`);
      fetchMLStatus();
    } catch (e) {
      alert("Fake data failed");
      console.error(e);
    }
  };

  const triggerScan = async () => {
    try {
      await axios.post(`${CORE_BASE}/admin/scan`, {}, { headers: { 'x-admin-key': ADMIN_KEY } });
      alert("✅ Manual scan triggered");
    } catch (e) { alert("Scan failed"); }
  };

  const panicFlat = async () => {
    if (!confirm("Close ALL positions right now?")) return;
    try {
      await axios.post(`${CORE_BASE}/admin/hard-flat`, {}, { headers: { 'x-admin-key': ADMIN_KEY } });
      alert("🚨 Panic Flat executed");
      fetchCore();
      fetchMLStatus();
    } catch (e) { alert("Panic Flat failed"); }
  };

  const resetDD = async () => {
    try {
      await axios.post(`${CORE_BASE}/admin/reset-drawdown`, {}, { headers: { 'x-admin-key': ADMIN_KEY } });
      alert("✅ Drawdown Reset");
      fetchCore();
    } catch (e) { alert("Reset failed"); }
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

  // Resize Handler
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
    if (logFilter === 'entry') return log.includes("ENTRY") || log.includes("📈");
    if (logFilter === 'exit') return log.includes("EXIT") || log.includes("📉") || log.includes("PROFIT") || log.includes("STOP");
    if (logFilter === 'error') return log.includes("ERROR") || log.includes("✗");
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Rocket className="text-emerald-500" /> ALPHASTREAM
            </h1>
            <p className="text-zinc-500">MAG7 • LIVE PAPER TRADING BOT v4.7</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-5 py-2.5 rounded-2xl"
          >
            <RefreshCw size={20} /> Refresh
          </button>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={triggerScan} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-2xl font-medium flex items-center gap-2">
            <Rocket /> SCAN MARKET
          </button>
          <button onClick={panicFlat} className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-2xl font-medium flex items-center gap-2">
            <Shield /> PANIC FLAT
          </button>
          <button onClick={resetDD} className="bg-amber-600 hover:bg-amber-500 px-6 py-3 rounded-2xl font-medium flex items-center gap-2">
            RESET DD
          </button>
          <button 
            onClick={addFakeData}
            className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-2xl font-medium flex items-center gap-2"
          >
            <Brain /> Add Fake Data (Test)
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">EQUITY</div>
            <div className="text-4xl font-mono mt-2">${(core.equity || 82282).toLocaleString()}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">DRAWDOWN</div>
            <div className="text-4xl font-mono mt-2 text-emerald-400">{core.drawdownPct || 0}%</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">WIN RATE</div>
            <div className="text-4xl font-mono mt-2">{(core.recentWinRate || 0).toFixed(1)}%</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <div className="text-zinc-400 text-sm">POSITIONS</div>
            <div className="text-4xl font-mono mt-2">
              {core.positionsCount || core.positions?.length || 0}/7
            </div>
          </div>
        </div>

        {/* ML Status */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Brain className="text-purple-400" /> ML TRAINING ({mlStatus.version})
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-emerald-400 text-xl">
                ENTRY MODEL {mlStatus.entryModelReady ? "✅ READY" : "⏳ LOADING"}
              </div>
              <div className="text-sm text-zinc-400 mt-1">
                Entry Buffer: <span className="font-mono text-white">{mlStatus.entryBufferSize}</span>
              </div>
            </div>
            <div>
              <div className="text-emerald-400 text-xl">
                EXIT MODEL {mlStatus.exitModelReady ? "✅ READY" : "⏳ LOADING"}
              </div>
              <div className="text-sm text-zinc-400 mt-1">
                Exit Buffer: <span className="font-mono text-white">{mlStatus.exitBufferSize}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 mb-8">
          <h3 className="font-semibold mb-4">OPEN POSITIONS ({core.positions?.length || 0})</h3>
          {core.positions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {core.positions.map((p: any, i: number) => (
                <div key={i} className="bg-black/40 rounded-2xl p-4 border border-zinc-700">
                  <div className="font-mono text-lg">{p.symbol} {p.side?.toUpperCase()}</div>
                  <div className="text-sm text-zinc-400 mt-1">
                    {Math.abs(p.qty)} shares @ {Number(p.entry || p.avgEntryPrice || 0).toFixed(2)}
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
            <p className="text-center text-zinc-500 py-12">No open positions</p>
          )}
        </div>

        {/* Logs Panel */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 flex-1 flex flex-col min-h-0">
          <div className="flex justify-between mb-3">
            <h3 className="font-semibold">ALL ACTIVITY LOGS</h3>
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value as any)}
              className="bg-zinc-800 text-xs px-3 py-1 rounded-lg border border-zinc-600"
            >
              <option value="all">All</option>
              <option value="entry">Entry Only</option>
              <option value="exit">Exit Only</option>
              <option value="error">Errors Only</option>
            </select>
          </div>

          <div
            className="flex-1 bg-black/60 rounded-2xl p-4 overflow-auto text-xs font-mono"
            style={{ maxHeight: logHeight }}
          >
            {filteredLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-16">Waiting for activity from core service...</p>
            ) : (
              filteredLogs.map((log, i) => (
                <div key={i} className="py-0.5 break-all">{log}</div>
              ))
            )}
          </div>

          <div
            className="h-1 bg-zinc-700 mt-3 rounded cursor-ns-resize hover:bg-zinc-500"
            onMouseDown={handleMouseDown}
          />
        </div>
      </div>
    </div>
  );
}
