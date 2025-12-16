'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';
import { RefreshCw, Zap, Brain, Activity, Loader2, Sun, Moon, AlertCircle, FileText, Cpu } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [equityHistory, setEquityHistory] = useState<{ time: string; equity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
  const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "https://alphastream-ml-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const [coreRes, mlRes] = await Promise.all([
        axios.get(CORE_URL, { timeout: 12000 }),
        axios.get(ML_URL, { timeout: 8000 }).catch(() => ({ data: null }))
      ]);

      const equity = Number(coreRes.data.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore(coreRes.data);
      setML(mlRes.data);
      setEquityHistory(prev => [...prev, { time, equity }].slice(-30));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));
      setError(null);
    } catch (e) {
      setError("Connection issue — retrying");
    } finally {
      setLoading(false);
    }
  };

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage("Scanning market...");
    try {
      await axios.post(`${CORE_URL}/scan`, {});
      setMessage("Scan triggered successfully!");
      setTimeout(() => setMessage(""), 3000);
      fetchData();
    } catch {
      setMessage("Scan failed");
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (loading) return (
    <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center gap-4">
      <Activity className="w-12 h-12 animate-pulse" />
      <p className="text-xl">Connecting to AlphaStream AI...</p>
    </div>
  );

  if (error || !core) return (
    <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <AlertCircle className="w-16 h-16" />
      <p className="text-lg">{error || "Services offline"}</p>
      <button onClick={fetchData} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 px-8 rounded-full">
        Retry Connection
      </button>
    </div>
  );

  const positions = core.positions || [];
  const rockets = core.rockets || [];
  const logs = core.tradeLog || [];
  const watchlist = core.watchlist || [];
  const mlSteps = ml?.steps || 0;
  const modelReady = ml?.modelReady || false;

  const chartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{
      data: equityHistory.map(d => d.equity),
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6,182,212,0.15)',
      fill: true,
      tension: 0.4
    }]
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'} transition-colors`}>
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
            AlphaStream AI
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">Updated: {lastUpdate} ET</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-800 dark:bg-gray-200 transition"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Equity Chart */}
        <div className="mb-6 p-4 rounded-xl bg-gray-900/50 border border-gray-700 h-64">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { x: { display: false }, y: { display: false } }
            }}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
          {[
            { icon: Cpu, label: "Equity", value: `$${Number(core.equity).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
            { icon: Activity, label: "Positions", value: positions.length },
            { icon: Zap, label: "Rockets", value: rockets.length },
            { icon: Brain, label: "Watchlist", value: watchlist.length },
            { icon: Activity, label: "Buying Power", value: `$${Number(core.buyingPower).toLocaleString()}` },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-lg bg-gray-900/50 text-center border border-gray-800">
              <s.icon className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
              <div className="text-xs text-gray-400">{s.label}</div>
              <div className="font-bold text-lg">{s.value}</div>
            </div>
          ))}
        </div>

        {/* DQN Learning Status */}
        <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-700">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-7 h-7 text-purple-400 animate-pulse" />
            <h2 className="text-xl font-bold text-purple-300">Rainbow DQN Agent</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${modelReady ? 'bg-green-600/30 text-green-300' : 'bg-yellow-600/30 text-yellow-300'}`}>
              {modelReady ? "Model Ready" : "Training"}
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            The AI agent is continuously learning from market patterns and trade outcomes via deep reinforcement learning.
          </p>
          <div className="text-2xl font-bold text-cyan-300">
            {mlSteps.toLocaleString()} Training Steps
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {mlSteps > 0 ? "Agent actively learning and improving decision policy" : "Initializing neural network..."}
          </div>
        </div>

        {/* Live Positions */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-cyan-400 flex items-center gap-2">
            <Activity className="w-5 h-5" /> Live Positions ({positions.length})
          </h2>
          {positions.length === 0 ? (
            <div className="p-10 text-center text-gray-500 bg-gray-900/50 rounded-xl border border-gray-800">
              No open positions — waiting for high-conviction signals
            </div>
          ) : (
            <div className="grid gap-3">
              {positions.map((p: any, i: number) => (
                <div key={i} className="p-5 rounded-xl bg-gray-900/50 border border-gray-700 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-2xl">{p.symbol}</div>
                    <div className="text-sm text-gray-400">Qty: {p.qty} @ ${p.entry}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-2xl">${p.current}</div>
                    <div className={`text-lg font-bold ${parseFloat(p.unrealized_plpc) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {parseFloat(p.unrealized_plpc) >= 0 ? '+' : ''}{p.unrealized_plpc}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Watchlist */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 text-cyan-400">AI Watchlist ({watchlist.length})</h2>
          <div className="p-4 bg-gray-900/50 rounded-xl text-sm overflow-x-auto border border-gray-800">
            <div className="flex flex-wrap gap-2">
              {watchlist.map((t: string) => (
                <span
                  key={t}
                  className="px-4 py-2 bg-gray-800 rounded-full hover:bg-cyan-600 transition cursor-default font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Log */}
        <div className="mb-20">
          <h2 className="text-lg font-bold mb-3 text-cyan-400 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Execution Log
          </h2>
          <div className="p-4 bg-gray-900/50 rounded-xl text-sm font-mono max-h-96 overflow-y-auto border border-gray-800">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              logs.slice().reverse().map((l: any, i: number) => (
                <div key={i} className="py-2 border-b border-gray-800 last:border-0 flex">
                  <span className="text-gray-500 w-24">{l.time}</span>
                  <span className="text-gray-300">{l.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Force Scan Button */}
        <button
          onClick={forceScan}
          disabled={scanning}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-sm py-5 rounded-full font-bold text-xl shadow-2xl flex items-center justify-center gap-3 z-50 transition-all ${
            scanning 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'bg-cyan-500 hover:bg-cyan-400 text-black'
          }`}
        >
          {scanning ? <Loader2 className="w-7 h-7 animate-spin" /> : <RefreshCw className="w-7 h-7" />}
          {scanning ? "Scanning Market..." : "Force Market Scan"}
        </button>

        {/* Toast Message */}
        {message && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-8 py-4 rounded-full bg-green-600 text-white shadow-2xl text-lg font-medium z-40 animate-pulse">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}