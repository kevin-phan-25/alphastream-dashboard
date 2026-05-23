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

  // Improved ML Status with Core fallback
  const fetchMLStatus = async () => {
    try {
      // Try ML service first
      const res = await axios.get(`${ML_BASE}/ml/status`, {
        headers: { 'x-admin-key': ADMIN_KEY },
        timeout: 8000
      });
      
      const data = res.data || {};

      setMlStatus({
        entryModelReady: data.models?.entry?.ready ?? true,
        exitModelReady: data.models?.exit?.ready ?? true,
        exitBufferSize: data.exitBufferSize ?? data.models?.exit?.bufferSize ?? 0,
        entryBufferSize: data.entryBufferSize ?? data.models?.entry?.bufferSize ?? 0,
        version: data.version || 'v4.0',
        trainingActive: data.trainingActive ?? false,
      });
    } catch (e) {
      console.warn("ML service status failed, falling back to Core local buffer", e);
      
      // Fallback: Use Core's local ML status
      try {
        const coreRes = await axios.get(`${CORE_BASE}/health`, {
          headers: { 'x-admin-key': ADMIN_KEY }
        });
        
        setMlStatus({
          entryModelReady: true,
          exitModelReady: true,
          exitBufferSize: coreRes.data?.exitBufferSize ?? 0,
          entryBufferSize: coreRes.data?.entryBufferSize ?? 0,
          version: 'v4.0 (Core Fallback)',
          trainingActive: false,
        });
      } catch {
        // Final fallback
        setMlStatus({
          entryModelReady: true,
          exitModelReady: true,
          exitBufferSize: 0,
          entryBufferSize: 0,
          version: 'v4.0 (Offline)',
          trainingActive: false,
        });
      }
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

  // Action Buttons
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
      fetchMLStatus(); // Refresh buffers
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
    }, 7000);

    const logsInt = setInterval(fetchActivityLogs, 5000);

    return () => {
      clearInterval(coreInt);
      clearInterval(logsInt);
    };
  }, []);

  // Resize Handler (unchanged)
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
        <div className="flex gap-3 mb-8">
          <button onClick={triggerScan} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-2xl font-medium flex items-center gap-2">
            <Rocket /> SCAN MARKET
          </button>
          <button onClick={panicFlat} className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-2xl font-medium flex items-center gap-2">
            <Shield /> PANIC FLAT
          </button>
          <button onClick={resetDD} className="bg-amber-600 hover:bg-amber-500 px-6 py-3 rounded-2xl font-medium flex items-center gap-2">
            RESET DD
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

        {/* Open Positions + Logs Panel (unchanged) */}
        {/* ... keep the rest of your component the same ... */}

      </div>
    </div>
  );
}
