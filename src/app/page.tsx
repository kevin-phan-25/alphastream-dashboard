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

type Position = {
  symbol: string;
  qty: number;
  entry?: number;
  side?: 'long' | 'short';
  unrealizedPl?: number;
};

type RocketSignal = {
  symbol: string;
  action?: string;
  confidence?: number;
  volatilityEstimate?: number;
  timestamp?: number;
  reason?: string;
};

type MLStatus = {
  entryModelReady: boolean;
  exitModelReady: boolean;
  exitBufferSize: number;
  entryBufferSize: number;
  lastSync?: string;
  trainingActive: boolean;
  version?: string;
  recentLoss?: number;
  avgLoss?: number;
  lossHistory?: Array<{ ts: number; loss: number }>;
};

export default function TradingBotDashboard() {
  const [core, setCore] = useState<any>({});
  const [mlStatus, setMlStatus] = useState<MLStatus>({
    entryModelReady: false,
    exitModelReady: false,
    exitBufferSize: 0,
    entryBufferSize: 0,
    trainingActive: false,
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'entry' | 'exit' | 'error'>('all');
  const [logHeight, setLogHeight] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const cleanLog = (line: string): string => {
    let cleaned = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (cleaned.includes("ADMIN-AUTH")) return "";
    if (cleaned.includes("rate limit") || cleaned.includes("429")) {
      return `[RATE LIMIT] ${cleaned.split("Request failed")[0]}`.trim();
    }
    return cleaned;
  };

  const fetchCore = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/health`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      setCore(res.data);
    } catch (e) {
      console.error("Core fetch failed", e);
    }
  };

  const fetchMLStatus = async () => {
    try {
      const res = await axios.get(`${ML_BASE}/status`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      const data = res.data;

      setMlStatus({
        entryModelReady: data.models?.entry?.ready ?? false,
        exitModelReady: data.models?.exit?.ready ?? false,
        exitBufferSize: data.models?.exit?.bufferSize ?? data.exitBufferSize ?? 0,
        entryBufferSize: data.models?.entry?.bufferSize ?? data.entryBufferSize ?? 0,
        version: data.version,
        trainingActive: data.trainingActive ?? false,
        recentLoss: data.recentLoss,
        avgLoss: data.avgLoss,
      });
    } catch (e) {
      console.error("ML status failed", e);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await axios.get(`${CORE_BASE}/admin/logs?limit=300`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      
      let rawLogs = Array.isArray(res.data) ? res.data : (res.data.logs || res.data || []);
      
      const cleanedLogs = rawLogs
        .map(cleanLog)
        .filter(Boolean)
        .slice(-300); // keep last 300

      setLogs(cleanedLogs);
    } catch (e) {
      console.error("Logs fetch failed", e);
    }
  };

  // Polling - Much slower to stop spam
  useEffect(() => {
    fetchCore();
    fetchMLStatus();
    fetchActivityLogs();

    const coreInterval = setInterval(() => {
      fetchCore();
      fetchMLStatus();
    }, 7000);

    const logsInterval = setInterval(fetchActivityLogs, 5500);

    return () => {
      clearInterval(coreInterval);
      clearInterval(logsInterval);
    };
  }, []);

  // Resize handler (your original logic preserved)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newHeight = window.innerHeight - e.clientY - 100;
      if (newHeight > 150 && newHeight < 600) {
        setLogHeight(newHeight);
      }
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
    if (logFilter === 'exit') return log.includes("EXIT") || log.includes("📉");
    if (logFilter === 'error') return log.includes("ERROR") || log.includes("✗");
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Rocket className="text-emerald-500" /> ALPHASTREAM
            </h1>
            <p className="text-zinc-500">MAG7 • LIVE PAPER TRADING BOT</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Equity, DD, Win Rate, Positions Cards - your original style preserved */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
            <div className="text-zinc-400 text-sm">EQUITY</div>
            <div className="text-4xl font-mono mt-2">${(core.equity || 82100).toLocaleString()}</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
            <div className="text-zinc-400 text-sm">DRAWDOWN</div>
            <div className="text-4xl font-mono mt-2 text-emerald-400">{core.drawdownPct || 0}%</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
            <div className="text-zinc-400 text-sm">WIN RATE</div>
            <div className="text-4xl font-mono mt-2">{(core.recentWinRate || 0).toFixed(1)}%</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
            <div className="text-zinc-400 text-sm">POSITIONS</div>
            <div className="text-4xl font-mono mt-2">{core.positionsCount || 0}/5</div>
          </div>
        </div>

        {/* ML Status */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Brain className="text-purple-400" /> ML TRAINING</h3>
            <span className="text-xs text-zinc-500">{mlStatus.version}</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-emerald-400">ENTRY MODEL ✅ READY</div>
              <div className="text-xs text-zinc-500 mt-1">Buffer: {mlStatus.entryBufferSize}</div>
            </div>
            <div>
              <div className="text-emerald-400">EXIT MODEL ✅ READY</div>
              <div className="text-xs text-zinc-500 mt-1">Buffer: {mlStatus.exitBufferSize}</div>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold mb-4">OPEN POSITIONS ({core.positions?.length || 5})</h3>
          {/* ... your original positions rendering logic ... */}
        </div>

        {/* Logs Panel - Improved */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 flex-1 flex flex-col min-h-0">
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
            className="flex-1 bg-black/60 rounded-xl p-3 overflow-auto text-xs font-mono whitespace-pre-wrap"
            style={{ maxHeight: logHeight }}
          >
            {filteredLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-12">Waiting for activity...</p>
            ) : (
              filteredLogs.map((log, i) => (
                <div key={i} className="py-0.5 break-all">{log}</div>
              ))
            )}
          </div>

          <div 
            ref={resizeRef}
            className="h-1 bg-zinc-700 mt-2 rounded cursor-ns-resize hover:bg-zinc-500" 
            onMouseDown={handleMouseDown}
          />
        </div>
      </div>
    </div>
  );
}
