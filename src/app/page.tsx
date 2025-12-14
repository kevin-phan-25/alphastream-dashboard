'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  RefreshCw, Brain, Zap, TrendingUp, Shield,
  Terminal, AlertTriangle, Play, X, Loader2
} from 'lucide-react';

const CORE_URL = "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [scan, setScan] = useState<any>(null);
  const [ml, setML] = useState<any>(null);

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
    } catch (err) {
      console.error("Positions fetch failed");
    }
  };

  const fetchScan = async () => {
    try {
      const res = await axios.get(`${CORE_URL}/scan-progress`, { timeout: 5000 });
      setScan(res.data);
    } catch (err) {
      setScan(null);
    }
  };

  const fetchML = async () => {
    try {
      const res = await axios.get(`${ML_URL}/insights`, { timeout: 10000 });
      setML(res.data);
    } catch (err) {
      console.error("ML fetch failed");
      setML(null);
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
    fetchML();

    const intervals = [
      setInterval(fetchCore, 8000),
      setInterval(fetchPositions, 5000),
      setInterval(fetchScan, 2000),
      setInterval(fetchML, 20000),
    ];

    return () => intervals.forEach(clearInterval);
  }, []);

  if (loading) return <Loader />;
  if (coreError) return <Offline retry={fetchCore} />;

  const heal = core.healMode || ml?.healMode;
  const equity = `$${Number(core.equity?.live || core.equity || 0).toLocaleString()}`;
  const drawdown = core.drawdown || "0%";

  const winRate = core.stats?.totalTrades > 0
    ? ((core.stats.winningTrades / core.stats.totalTrades) * 100).toFixed(1)
    : "—";

  // Enhanced ML Confidence (0-100%)
  const mlConfidence = ml
    ? Math.min(
        100,
        Math.floor(
          ((ml.step || 0) / 500) * 40 +               // Training progress
          ((ml.bufferSize || 0) / 8000) * 30 +        // Experience collected
          (ml.epsilon < 0.3 ? 20 : 10) +               // Low exploration = high confidence
          10                                          // Base
        )
      )
    : 0;

  const mlStatusText = mlConfidence < 40 ? "LEARNING" :
                       mlConfidence < 70 ? "CAUTIOUS" :
                       "CONFIDENT";

  const mlStatusColor = mlConfidence < 40 ? "text-red-400" :
                        mlConfidence < 70 ? "text-yellow-400" :
                        "text-green-400";

  return (
    <div className="min-h-screen bg-black text-gray-300 p-3 text-sm">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-sm font-bold text-purple-400">AlphaStream v300000</h1>
          <div className="text-2xs flex items-center gap-2 mt-1">
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
            className="px-12 py-3 text-sm font-bold rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:scale-105 transition-all disabled:opacity-60"
          >
            {actionLoading === "SCAN" ? <Loader2 className="inline w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="inline w-5 h-5 mr-2" />}
            {actionLoading === "SCAN" ? "SCANNING..." : "FORCE SCAN"}
          </button>
        </div>
      </div>

      {/* EQUITY */}
      <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-xl p-4 text-center mb-4 border border-purple-700">
        <div className="text-xs text-gray-400">LIVE ALPACA EQUITY</div>
        <div className="text-3xl font-bold">{equity}</div>
        <div className="text-xs text-gray-400 mt-2">Drawdown: {drawdown}</div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Stat icon={<Zap className="w-5 h-5 mx-auto text-purple-400 mb-1" />} value={`${positions.length}/5`} label="POS" />
        <Stat icon={<TrendingUp className="w-5 h-5 mx-auto text-cyan-400 mb-1" />} value={core.rockets?.length || 0} label="ROCKETS" />
        <Stat icon={<Brain className="w-5 h-5 mx-auto text-purple-400 mb-1" />} value={`${winRate}%`} label="WIN" />
        <Stat icon={<Terminal className="w-5 h-5 mx-auto text-yellow-400 mb-1" />} value={core.stats?.totalTrades || 0} label="TRADES" />
      </div>

      {/* ENHANCED ML CONFIDENCE GAUGE */}
      <div className="bg-gray-900/90 rounded-xl p-5 mb-4 border border-purple-600">
        <div className="text-purple-400 font-bold text-center mb-4">RAINBOW DQN CONFIDENCE</div>
        
        {/* Circular Gauge */}
        <div className="relative w-48 h-48 mx-auto">
          <svg viewBox="0 0 36 36" className="transform -rotate-90 w-full h-full">
            {/* Background */}
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
            
            {/* Gradient Progress */}
            <defs>
              <linearGradient id="gradient">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              strokeDasharray={`${mlConfidence} 100`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-bold ${mlStatusColor}`}>
              {mlConfidence}%
            </div>
            <div className={`text-sm font-bold mt-1 ${mlStatusColor}`}>
              {mlStatusText}
            </div>
          </div>
        </div>

        {/* ML Details */}
        <div className="grid grid-cols-2 gap-4 mt-6 text-xs">
          <div>
            <div className="text-gray-500">Epsilon</div>
            <div className="font-bold text-cyan-400">{ml?.epsilon ? parseFloat(ml.epsilon).toFixed(3) : "—"}</div>
          </div>
          <div>
            <div className="text-gray-500">Training Step</div>
            <div className="font-bold text-yellow-400">{ml?.step || 0}</div>
          </div>
          <div>
            <div className="text-gray-500">Buffer Size</div>
            <div className="font-bold text-green-400">{ml?.bufferSize || 0}</div>
          </div>
          <div>
            <div className="text-gray-500">Last Trained</div>
            <div className="font-bold text-purple-400">{ml?.lastTrained ? new Date(ml.lastTrained).toLocaleTimeString() : "—"}</div>
          </div>
        </div>
      </div>

      {/* POSITIONS */}
      <Panel title="LIVE POSITIONS" color="text-green-400">
        {positions.length > 0 ? (
          <div className="space-y-2">
            {positions.map((p: any) => (
              <div key={p.symbol} className="flex justify-between text-xs py-1 border-b border-gray-800">
                <span className="font-bold">{p.symbol} ×{p.qty}</span>
                <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">No open positions</div>
        )}
      </Panel>

      {/* LOGS */}
      <Panel title="LIVE LOGS" color="text-cyan-400">
        <div className="font-mono text-2xs max-h-64 overflow-y-auto space-y-1 bg-black/50 p-3 rounded">
          {core.logs?.slice(-25).map((log: string, i: number) => (
            <div key={i} className="text-gray-400">{log}</div>
          )) || <div className="text-gray-600 text-center py-12">Waiting for activity...</div>}
        </div>
      </Panel>

      <div className="text-center py-4 text-purple-400 text-xs font-bold animate-pulse">
        v300000 • RAINBOW DQN • LIVE TRADING • SELF-LEARNING
      </div>
    </div>
  );
}

/* COMPONENTS */
const Loader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
  </div>
);

const Offline = ({ retry }: { retry: () => void }) => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-400">
    <AlertTriangle className="w-20 h-20 mb-6" />
    <div className="text-2xl mb-6">Bot Offline</div>
    <button onClick={retry} className="px-8 py-4 bg-red-600 rounded text-white font-bold text-lg hover:bg-red-500">
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
  <div className="bg-gray-900 rounded-xl p-5 mb-5 border border-gray-800">
    <div className={`text-lg font-bold mb-4 ${color}`}>{title}</div>
    {children}
  </div>
);
