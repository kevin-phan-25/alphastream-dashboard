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
  Title,
  Tooltip,
  Filler
} from 'chart.js';
import { RefreshCw, Zap, Brain, Shield, Activity, Loader2, Sun, Moon, AlertCircle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "https://alphastream-ml-1017433009054.us-east1.run.app";

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

  const fetchData = async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        axios.get(CORE_URL, { timeout: 12000 }),
        axios.get(ML_URL, { timeout: 8000 }).catch(() => ({ data: null }))
      ]);

      const equity = Number(cRes.data.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore(cRes.data);
      setML(mRes.data);
      setEquityHistory(prev => [...prev, { time, equity }].slice(-30));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));
      setError(null);
    } catch (e) {
      setError("Services offline — retrying...");
    } finally {
      setLoading(false);
    }
  };

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage("Triggering scan...");

    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 15000 });
      setMessage("Scan triggered!");
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

  const chartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{
      data: equityHistory.map(d => d.equity),
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.15)',
      fill: true,
      tension: 0.4,
      pointRadius: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: darkMode ? '#374151' : '#e5e7eb' } } }
  };

  if (loading) return (
    <div className="min-h-screen bg-black text-cyan-400 flex flex-col items-center justify-center gap-4">
      <Activity className="w-12 h-12 animate-pulse" />
      <p className="text-xl">Connecting to AlphaStream AI...</p>
    </div>
  );

  if (error || !core) return (
    <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <AlertCircle className="w-16 h-16" />
      <p className="text-lg">{error || "Core offline"}</p>
      <button onClick={fetchData} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 px-8 rounded-full">
        Retry
      </button>
    </div>
  );

  const positions = core.positions ? Object.keys(core.positions).length : 0;
  const rockets = core.rockets?.length || 0;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'} transition-colors`}>
      <div className="max-w-5xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
            AlphaStream AI
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">{lastUpdate} ET</span>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-800 dark:bg-gray-200">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Equity Chart */}
        <div className="mb-6 p-4 rounded-xl border bg-gray-900/50 dark:border-gray-700 h-64">
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {[
            { icon: Shield, label: "Equity", value: `$${Number(core.equity).toLocaleString()}` },
            { icon: Activity, label: "Positions", value: `${positions}/5` },
            { icon: Zap, label: "Rockets", value: rockets },
            { icon: Brain, label: "DQN Steps", value: ml?.steps ? (ml.steps / 1000).toFixed(1) + "k" : "—" },
            { icon: Activity, label: "Watchlist", value: Object.keys(core.learnedSymbols || {}).length },
          ].map((stat, i) => (
            <div key={i} className="p-3 rounded-lg bg-gray-900/50 dark:border-gray-700 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
              <div className="text-xs text-gray-400">{stat.label}</div>
              <div className="font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Force Scan Button */}
        <button
          onClick={forceScan}
          disabled={scanning}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-sm py-4 rounded-full font-bold text-lg shadow-2xl flex items-center justify-center gap-3 transition z-50 ${
            darkMode 
              ? 'bg-cyan-500 hover:bg-cyan-400 text-black disabled:bg-gray-700' 
              : 'bg-cyan-600 hover:bg-cyan-500 text-white disabled:bg-gray-500'
          }`}
        >
          {scanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
          {scanning ? "Scanning..." : "Force Scan"}
        </button>

        {/* Message Toast */}
        {message && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-green-600 text-white shadow-lg text-sm z-40 animate-pulse">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}