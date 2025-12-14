'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  RefreshCw, Brain, Zap, TrendingUp, Shield,
  Terminal, AlertTriangle, Play, Loader2
} from 'lucide-react';

const CORE_URL = "https://alphastream-core-1017433009054.us-east1.run.app";

/* ======================
   HELPER COMPONENTS
====================== */
const Loader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
  </div>
);

const Offline = ({ retry }: { retry: () => void }) => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-400">
    <AlertTriangle className="w-16 h-16 mb-4" />
    <div className="text-xl mb-4">Bot Offline</div>
    <button onClick={retry} className="px-6 py-3 bg-red-600 rounded text-white font-bold">
      Retry Connection
    </button>
  </div>
);

const Stat = ({ icon, value, label }: any) => (
  <div className="bg-gray-900 rounded-lg p-4 text-center border border-gray-800">
    <div className="mx-auto mb-2">{icon}</div>
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="text-xs text-gray-500 mt-1">{label}</div>
  </div>
);

const Panel = ({ title, children, color }: any) => (
  <div className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-800">
    <div className={`text-sm font-bold mb-3 ${color}`}>{title}</div>
    {children}
  </div>
);

/* ======================
   DASHBOARD COMPONENT
====================== */
export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [scan, setScan] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [coreError, setCoreError] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCore = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 12000 });
      setCore(res.data);
      setCoreError(false);
    } catch (err) {
      console.error("Core fetch failed", err);
      setCoreError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await axios.get(`${CORE_URL}/positions`, { timeout: 8000 });
      setPositions(res.data || []);
    } catch {
      console.error("Positions fetch failed");
    }
  };

  const fetchScan = async () => {
    try {
      const res = await axios.get(`${CORE_URL}/scan-progress`, { timeout: 5000 });
      setScan(res.data);
    } catch {
      setScan(null);
    }
  };

  const actionPost = async (endpoint: string, label: string) => {
    setActionLoading(label);
    try {
      await axios.post(`${CORE_URL}${endpoint}`, {}, { timeout: 10000 });
      await fetchCore();
    } catch (err) {
      console.error(`${label} failed`, err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchCore();
    fetchPositions();
    fetchScan();

    const intervals = [
      setInterval(fetchCore, 8000),
      setInterval(fetchPositions, 5000),
      setInterval(fetchScan, 2000),
    ];

    return () => intervals.forEach(clearInterval);
  }, []);

  if (loading) return <Loader />;
  if (coreError) return <Offline retry={fetchCore} />;

  const heal = core.healMode;
  const equity = `$${Number(core.equity?.live || core.equity || 0).toLocaleString()}`;
  const drawdown = core.drawdown || "0%";

  const winRate = core.stats?.totalTrades > 0
    ? ((core.stats.winningTrades / core.stats.totalTrades) * 100).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-black text-gray-300 p-3 text-sm">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-cyan-400">AlphaStream Dashboard</h1>
          <div className="text-xs flex items-center gap-2 mt-1">
            {heal && <Shield className="w-4 h-4 text-orange-400 animate-pulse" />}
            <span className={heal ? "text-orange-400" : "text-green-400 font-bold"}>
              {heal ? "HEAL MODE" : "LIVE"}
            </span>
            <span>• {core.timeET || "--:--"}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => actionPost("/scan", "SCAN")}
            disabled={!!actionLoading}
            className="px-4 py-2 bg-cyan-600 rounded flex items-center gap-2 text-black font-bold text-xs hover:bg-cyan-500 disabled:opacity-50"
          >
            {actionLoading === "SCAN" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            SCAN
          </button>

          <button
            onClick={() => actionPost("/panic", "PANIC")}
            disabled={!!actionLoading}
            className="px-4 py-2 bg-red-600 rounded flex items-center gap-2 text-white font-bold text-xs hover:bg-red-500 disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            PANIC
          </button>

          <button
            onClick={() => actionPost("/resume", "RESUME")}
            disabled={!!actionLoading}
            className="px-4 py-2 bg-green-600 rounded flex items-center gap-2 text-black font-bold text-xs hover:bg-green-500 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            RESUME
          </button>
        </div>
      </div>

      {/* EQUITY */}
      <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-xl p-5 text-center mb-4 border border-purple-700">
        <div className="text-sm text-gray-400">LIVE ALPACA EQUITY</div>
        <div className="text-4xl font-bold text-white mt-2">{equity}</div>
        <div className="text-xs text-gray-400 mt-3">Drawdown: {drawdown}</div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Stat icon={<Zap className="w-6 h-6 text-purple-400" />} value={`${positions.length}/5`} label="POSITIONS" />
        <Stat icon={<TrendingUp className="w-6 h-6 text-cyan-400" />} value={core.rockets?.length || 0} label="ROCKETS" />
        <Stat icon={<Brain className="w-6 h-6 text-purple-400" />} value={`${winRate}%`} label="WIN RATE" />
        <Stat icon={<Terminal className="w-6 h-6 text-yellow-400" />} value={core.stats?.totalTrades || 0} label="TRADES" />
      </div>

      {/* POSITIONS PANEL */}
      <Panel title="LIVE POSITIONS" color="text-green-400">
        {positions.length > 0 ? (
          <div className="space-y-2">
            {positions.map((p: any) => (
              <div key={p.symbol} className="flex justify-between text-xs">
                <span className="font-bold">{p.symbol} ×{p.qty}</span>
                <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">No open positions</div>
        )}
      </Panel>

      {/* LOGS PANEL */}
      <Panel title="LIVE LOGS" color="text-cyan-400">
        <div className="font-mono text-xs max-h-64 overflow-y-auto space-y-1">
          {core.logs?.slice(-20).map((log: string, i: number) => (
            <div key={i} className="text-gray-400">{log}</div>
          )) || <div className="text-gray-600 text-center py-8">Waiting for logs...</div>}
        </div>
      </Panel>
    </div>
  );
}
