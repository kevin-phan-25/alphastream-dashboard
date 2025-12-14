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
  Legend,
  Filler
} from 'chart.js';
import { RefreshCw, Zap, Brain, TrendingUp, AlertCircle, Shield, Activity, Target, Loader2, Sun, Moon } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [equityHistory, setEquityHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string>("");
  const [darkMode, setDarkMode] = useState(true);

  const fetchData = async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        axios.get(CORE_URL, { timeout: 15000 }),
        axios.get(ML_URL, { timeout: 10000 }).catch(() => ({ data: null }))
      ]);

      const newEquity = Number(cRes.data.equity || 0);
      const timeLabel = new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });

      setCore(cRes.data);
      setML(mRes.data);

      setEquityHistory(prev => {
        const updated = [...prev, { time: timeLabel, equity: newEquity }].slice(-30);
        return updated;
      });

      setError(null);
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));
    } catch (e: any) {
      console.error("Fetch error:", e);
      setError("Services unreachable — retrying...");
    } finally {
      setLoading(false);
    }
  };

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setScanMessage("Triggering scan...");

    try {
      const response = await axios.post(`${CORE_URL}/scan`, {}, { timeout: 20000 });
      if (response.data.success) {
        setScanMessage("Scan triggered successfully!");
      } else {
        setScanMessage("Scan completed (no response)");
      }
      setTimeout(() => setScanMessage(""), 4000);
      await fetchData(); // Force refresh
    } catch (err: any) {
      console.error("Scan error:", err);
      setScanMessage("Scan failed — check core service");
      setTimeout(() => setScanMessage(""), 6000);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black dark:bg-black text-cyan-400 flex flex-col items-center justify-center gap-4 p-4">
        <Activity className="w-12 h-12 animate-pulse" />
        <div className="text-xl text-center">Connecting to AlphaStream AI...</div>
      </div>
    );
  }

  if (error || !core) {
    return (
      <div className="min-h-screen bg-black dark:bg-black text-red-400 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <AlertCircle className="w-16 h-16" />
        <div className="text-lg">{error || "Core service unavailable"}</div>
        <button onClick={fetchData} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 px-8 rounded-full transition">
          Retry
        </button>
      </div>
    );
  }

  const positionsArray = core.positions ? Object.entries(core.positions) : [];

  const chartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [
      {
        label: 'Equity',
        data: equityHistory.map(d => d.equity),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: darkMode ? '#374151' : '#e5e7eb' } }
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-300' : 'bg-gray-100 text-gray-800'} transition-colors duration-300 pb-20`}>
      <div className="max-w-6xl mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
            AlphaStream AI Trader
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">Last: {lastUpdate} ET</div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-800 dark:bg-gray-200 text-yellow-400 dark:text-gray-900 hover:scale-110 transition"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Real-Time Chart */}
        <div className="mb-8">
          <h2 className={`text-lg font-bold mb-3 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Live Equity Performance</h2>
          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} h-64`}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Equity", value: `$${Number(core.equity || 0).toLocaleString()}`, icon: <Shield className="w-4 h-4" /> },
            { label: "Positions", value: `${positionsArray.length}/5` },
            { label: "Rockets", value: core.rockets?.length || 0, icon: <Zap className="w-4 h-4" /> },
            { label: "Rainbow DQN", value: ml?.status || "Active", extra: ml?.steps ? `Steps: ${ml.steps.toLocaleString()}` : "", icon: <Brain className="w-4 h-4" /> },
            { label: "Symbols", value: core.dailySymbols?.length || 0, icon: <Activity className="w-4 h-4" /> },
            { label: "Risk", value: core.risk ? `${(core.risk * 100).toFixed(1)}%` : "2.0%", icon: <Target className="w-4 h-4" /> }
          ].map((stat, i) => (
            <div key={i} className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} text-center`}>
              <div className={`text-xs flex items-center justify-center gap-1 mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {stat.icon}
                {stat.label}
              </div>
              <div className={`text-base sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
              {stat.extra && <div className="text-xs text-gray-500 mt-1">{stat.extra}</div>}
            </div>
          ))}
        </div>

        {/* Rockets, Positions, Logs — keep your existing compact sections */}

        {/* Force Scan Button — FIXED */}
        <button
          onClick={forceScan}
          disabled={scanning}
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 w-11/12 max-w-xs py-4 px-8 rounded-full flex items-center justify-center gap-2 shadow-xl transition z-50 text-base font-bold ${
            darkMode ? 'bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-black' : 'bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-400 text-white'
          }`}
        >
          {scanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
          {scanning ? "Scanning..." : "Force Scan Now"}
        </button>

        {/* Scan Message */}
        {scanMessage && (
          <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full shadow-lg text-sm z-40 ${
            darkMode ? 'bg-green-800 text-white' : 'bg-green-700 text-white'
          }`}>
            {scanMessage}
          </div>
        )}
      </div>
    </div>
  );
}
