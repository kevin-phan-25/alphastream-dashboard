'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import { RefreshCw, Zap, Brain, TrendingUp, AlertCircle, Shield, Activity, Target, Loader2, Sun, Moon } from 'lucide-react';

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
        axios.get(CORE_URL, { timeout: 12000 }),
        axios.get(ML_URL, { timeout: 10000 }).catch(() => ({ data: null }))
      ]);

      const newEquity = Number(cRes.data.equity || 0);
      const prevEquity = equityHistory.length > 0 ? equityHistory[equityHistory.length - 1].equity : newEquity;

      const newEntry = {
        time: new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
        equity: newEquity,
        change: newEquity - prevEquity
      };

      setCore(cRes.data);
      setML(mRes.data);

      setEquityHistory(prev => {
        const updated = [...prev, newEntry].slice(-50); // Keep last 50 points for better interaction
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
    setScanning(true);
    setScanMessage("Triggering scan...");
    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 10000 });
      setScanMessage("Scan triggered!");
      setTimeout(() => setScanMessage(""), 3000);
      await fetchData();
    } catch (err) {
      setScanMessage("Scan failed");
      setTimeout(() => setScanMessage(""), 5000);
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

        {/* Interactive Equity Chart */}
        <div className="mb-8">
          <h2 className={`text-lg font-bold mb-3 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Live Equity Performance</h2>
          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={equityHistory} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                <XAxis 
                  dataKey="time" 
                  stroke={darkMode ? "#9ca3af" : "#4b5563"}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke={darkMode ? "#9ca3af" : "#4b5563"}
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 500', 'dataMax + 500']}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#f3f4f6', 
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px'
                  }}
                  labelStyle={{ color: darkMode ? '#e5e7eb' : '#111827', fontWeight: 'bold' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#06b6d4" 
                  strokeWidth={3} 
                  dot={false}
                  animationDuration={500}
                />
                {/* Highlight big changes */}
                {equityHistory.map((entry, i) => 
                  i > 0 && Math.abs(entry.change) > 500 ? (
                    <ReferenceDot
                      key={i}
                      x={entry.time}
                      y={entry.equity}
                      r={6}
                      fill={entry.change > 0 ? "#10b981" : "#ef4444"}
                      stroke="none"
                    />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
            <div className="text-center text-xs text-gray-500 mt-2">
              Drag to zoom • Double-click to reset
            </div>
          </div>
        </div>

        {/* Rest of your dashboard (stats, rockets, positions, logs, scan button) */}
        {/* ... keep your previous compact sections here ... */}

        {/* Force Scan Button */}
        <button
          onClick={forceScan}
          disabled={scanning}
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 w-11/12 max-w-xs py-4 px-8 rounded-full flex items-center justify-center gap-2 shadow-xl transition z-50 text-base font-bold ${
            darkMode ? 'bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-black' : 'bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-400 text-white'
          }`}
        >
          {scanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
          {scanning ? "Scanning..." : "Force Scan"}
        </button>

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
