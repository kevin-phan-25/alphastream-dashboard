'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  RefreshCw, Brain, Zap, TrendingUp, Shield,
  Terminal, AlertTriangle, Play, X, Loader2, BarChart3
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
  const [selectedPos, setSelectedPos] = useState<any>(null);

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
      await axios.post(`${CORE_URL}${endpoint}`, {}, { timeout: 15000 });
      await fetchCore();
      await fetchPositions();
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

  const heal = core.healMode;
  const equity = `$${Number(core.equity?.live || core.equity || 0).toLocaleString()}`;
  const drawdown = core.drawdown || "0%";

  const mlOnline = !!ml;
  const mlConfidence = ml
    ? Math.min(100, Math.floor(
        (ml.step || 0) / 300 * 50 +
        (ml.bufferSize || 0) / 5000 * 30 +
        (ml.epsilon < 0.3 ? 20 : 0)
      ))
    : 0;

  const topRocket = core.rockets?.[0]?.split(" ")[0] || "—";
  const mlThinksGood = mlOnline && mlConfidence > 70;

  return (
    <div className="min-h-screen bg-black text-gray-300 p-4 text-sm">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400">AlphaStream v300000</h1>
          <div className="text-sm flex items-center gap-3 mt-2">
            {heal && <Shield className="w-5 h-5 text-orange-400 animate-pulse" />}
            <span className={heal ? "text-orange-400 font-bold" : "text-green-400 font-bold"}>
              {heal ? "HEAL MODE" : "LIVE"}
            </span>
            <span>• {core.timeET || "--:--"}</span>
            {mlOnline ? (
              <span className="text-green-400 flex items-center gap-1">
                <Brain className="w-4 h-4" /> ML Online
              </span>
            ) : (
              <span className="text-red-400">ML Offline</span>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => actionPost("/scan", "SCAN")}
            disabled={!!actionLoading}
            className="px-6 py-3 bg-cyan-600 rounded-lg flex items-center gap-3 text-black font-bold hover:bg-cyan-500 disabled:opacity-50 transition"
          >
            {actionLoading === "SCAN" ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            FORCE SCAN
          </button>

          <button
            onClick={() => actionPost("/panic", "PANIC")}
            disabled={!!actionLoading}
            className="px-6 py-3 bg-red-600 rounded-lg flex items-center gap-3 text-white font-bold hover:bg-red-500 disabled:opacity-50 transition"
          >
            <AlertTriangle className="w-5 h-5" />
            PANIC STOP
          </button>

          <button
            onClick={() => actionPost("/resume", "RESUME")}
            disabled={!!actionLoading}
            className="px-6 py-3 bg-green-600 rounded-lg flex items-center gap-3 text-black font-bold hover:bg-green-500 disabled:opacity-50 transition"
          >
            <Play className="w-5 h-5" />
            RESUME
          </button>
        </div>
      </div>

      {/* EQUITY */}
      <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-2xl p-8 text-center mb-6 border border-purple-700">
        <div className="text-lg text-gray-400">LIVE ALPACA EQUITY</div>
        <div className="text-6xl font-bold text-white mt-4">{equity}</div>
        <div className="text-lg text-gray-400 mt-6">Drawdown: {drawdown}</div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        <Stat icon={<Zap className="w-8 h-8 text-purple-400" />} value={`${positions.length}/5`} label="POSITIONS" />
        <Stat icon={<TrendingUp className="w-8 h-8 text-cyan-400" />} value={core.rockets?.length || 0} label="ROCKETS" />
        <Stat icon={<Brain className="w-8 h-8 text-purple-400" />} value={`${mlConfidence}%`} label="ML CONFIDENCE" />
        <Stat icon={<BarChart3 className="w-8 h-8 text-green-400" />} value={topRocket} label="TOP TICKER" />
      </div>

      {/* ML THINKS */}
      <Panel title="RAINBOW DQN THINKS" color="text-purple-400">
        <div className="text-center py-6">
          <div className="text-2xl font-bold mb-4">
            {mlOnline ? (
              mlThinksGood ? (
                <span className="text-green-400">YES — STRONG BUY SIGNAL</span>
              ) : (
                <span className="text-yellow-400">CAUTIOUS — WAIT</span>
              )
            ) : (
              <span className="text-red-400">ML OFFLINE</span>
            )}
          </div>
          <div className="text-lg mb-2">Top Rocket: <span className="font-bold text-cyan-400">{topRocket}</span></div>
          <div className="text-sm text-gray-500">
            Confidence: {mlConfidence}% • Epsilon: {ml?.epsilon ? parseFloat(ml.epsilon).toFixed(3) : "—"} • Step: {ml?.step || 0}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm text-gray-500 mb-2">ML Learning Progress</div>
          <div className="w-full bg-gray-800 h-4 rounded-full overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-1000 ${
                mlConfidence < 40 ? "bg-red-500" :
                mlConfidence < 70 ? "bg-yellow-400" :
                "bg-green-500"
              }`}
              style={{ width: `${mlConfidence}%` }}
            />
          </div>
        </div>
      </Panel>

      {/* POSITIONS WITH CHARTS */}
      <Panel title="LIVE POSITIONS" color="text-green-400">
        {positions.length > 0 ? (
          <div className="space-y-4">
            {positions.map((p: any) => (
              <div
                key={p.symbol}
                onClick={() => setSelectedPos(p)}
                className="bg-gray-800/50 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold">{p.symbol} ×{p.qty}</span>
                  <span className={p.pnlPct >= 0 ? "text-green-400 text-xl font-bold" : "text-red-400 text-xl font-bold"}>
                    {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct?.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Entry: ${p.entry?.toFixed(2)} • Current: ${p.current?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-12 text-lg">No open positions</div>
        )}
      </Panel>

      {/* LOGS */}
      <Panel title="LIVE LOGS" color="text-cyan-400">
        <div className="font-mono text-xs max-h-80 overflow-y-auto space-y-1 bg-black/50 p-4 rounded-lg">
          {core.logs?.slice(-25).map((log: string, i: number) => (
            <div key={i} className="text-gray-400">{log}</div>
          )) || <div className="text-gray-600 text-center py-16">Waiting for activity...</div>}
        </div>
      </Panel>

      <div className="text-center py-6 text-purple-400 text-sm font-bold animate-pulse">
        v300000 • RAINBOW DQN • LIVE TRADING • SELF-LEARNING • REAL-TIME CHARTS
      </div>

      {/* CHART MODAL */}
      {selectedPos && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">{selectedPos.symbol}</h2>
              <X className="w-6 h-6 cursor-pointer text-gray-400 hover:text-white" onClick={() => setSelectedPos(null)} />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-4" 
                className={selectedPos.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                {selectedPos.pnlPct >= 0 ? "+" : ""}{selectedPos.pnlPct?.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mb-2">
                Qty: {selectedPos.qty} • Entry: ${selectedPos.entry?.toFixed(2)}
              </div>
            </div>
            {/* Placeholder for real chart — you can integrate lightweight chart lib later */}
            <div className="bg-gray-800 rounded-lg h-48 flex items-center justify-center mt-6">
              <BarChart3 className="w-16 h-16 text-gray-600" />
              <span className="ml-4 text-gray-600">Real-time Chart (Coming Soon)</span>
            </div>
          </div>
        </div>
      )}
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
  <div className="bg-gray-900 rounded-xl p-6 text-center border border-gray-800">
    <div className="mx-auto mb-4">{icon}</div>
    <div className="text-3xl font-bold text-white">{value}</div>
    <div className="text-sm text-gray-500 mt-2">{label}</div>
  </div>
);

const Panel = ({ title, children, color }: any) => (
  <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
    <div className={`text-xl font-bold mb-5 ${color}`}>{title}</div>
    {children}
  </div>
);
