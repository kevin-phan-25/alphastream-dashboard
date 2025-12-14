'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Zap, Brain, TrendingUp, AlertCircle, Shield, Activity, Target, Loader2, Sun, Moon } from 'lucide-react';

const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
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

      setCore(cRes.data);
      setML(mRes.data);
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
      <div className="min-h-screen bg-black dark:bg-black text-cyan-400 flex flex-col items-center justify-center gap-6 p-4">
        <Activity className="w-16 h-16 animate-pulse" />
        <div className="text-2xl text-center">Connecting to AlphaStream AI...</div>
      </div>
    );
  }

  if (error || !core) {
    return (
      <div className="min-h-screen bg-black dark:bg-black text-red-400 flex flex-col items-center justify-center gap-8 p-6 text-center">
        <AlertCircle className="w-24 h-24" />
        <div className="text-2xl">{error || "Core service unavailable"}</div>
        <button onClick={fetchData} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-4 px-10 rounded-full text-xl transition">
          Retry Connection
        </button>
      </div>
    );
  }

  const positionsArray = core.positions ? Object.entries(core.positions) : [];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-300' : 'bg-gray-100 text-gray-800'} transition-colors duration-300 pb-24`}>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Header with Dark Mode Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className={`text-3xl sm:text-4xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
            AlphaStream AI Trader
          </h1>
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Last update: {lastUpdate} ET</div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-full bg-gray-800 dark:bg-gray-200 text-yellow-400 dark:text-gray-900 hover:scale-110 transition"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {[
            { label: "Live Equity", value: `$${Number(core.equity || 0).toLocaleString()}`, icon: <Shield className="w-5 h-5" /> },
            { label: "Positions", value: `${positionsArray.length}/5`, icon: null },
            { label: "Rockets Today", value: core.rockets?.length || 0, icon: <Zap className="w-5 h-5" /> },
            { label: "Rainbow DQN", value: ml?.status || "Active", extra: ml?.steps ? `Steps: ${ml.steps.toLocaleString()}` : "", icon: <Brain className="w-5 h-5" /> },
            { label: "Daily Symbols", value: core.dailySymbols?.length || 0, icon: <Activity className="w-5 h-5" /> },
            { label: "Risk Level", value: core.risk ? `${(core.risk * 100).toFixed(2)}%` : "2.00%", icon: <Target className="w-5 h-5" /> }
          ].map((stat, i) => (
            <div key={i} className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} text-center`}>
              <div className={`text-xs flex items-center justify-center gap-1 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {stat.icon && stat.icon}
                {stat.label}
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
              {stat.extra && <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>{stat.extra}</div>}
            </div>
          ))}
        </div>

        {/* Rockets */}
        <div className="mb-10">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            <Zap className="w-7 h-7" /> Today's Rockets ({core.rockets?.length || 0})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {core.rockets?.length > 0 ? core.rockets.map((r: any, i: number) => (
              <div key={i} className={`p-4 rounded-xl border text-center hover:scale-105 transition ${darkMode ? 'bg-gray-900 border-yellow-600' : 'bg-white border-yellow-500'}`}>
                <div className={`font-bold text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{r.symbol}</div>
                <div className={`font-bold text-xl sm:text-2xl mt-1 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>+{r.gap}%</div>
              </div>
            )) : (
              <div className={`col-span-full text-center py-12 text-base sm:text-lg rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
                No gappers ≥20% today — market quiet
              </div>
            )}
          </div>
        </div>

        {/* Live Positions */}
        <div className="mb-10">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            <TrendingUp className="w-7 h-7" /> Live Positions
          </h2>
          {positionsArray.length > 0 ? (
            <div className="space-y-4">
              {positionsArray.map(([symbol, p]: any) => {
                const pnlPct = p.entry && p.current ? ((p.current - p.entry) / p.entry) * 100 : 0;
                return (
                  <div key={symbol} className={`p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${darkMode ? 'bg-gray-900 border-green-700' : 'bg-white border-green-500'}`}>
                    <div>
                      <div className={`font-bold text-xl sm:text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{symbol} ×{p.qty || 0}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Entry: ${Number(p.entry || 0).toFixed(2)} → Current: ${Number(p.current || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className={`text-3xl sm:text-4xl font-bold ${pnlPct >= 0 ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                      {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-12 text-base sm:text-lg rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
              No open positions — Rainbow DQN waiting for high-confidence signals
            </div>
          )}
        </div>

        {/* Recent Logs */}
        <div className="mb-10">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>Recent Logs</h2>
          <div className={`rounded-xl border p-4 max-h-80 overflow-y-auto text-xs sm:text-sm font-mono ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-300 text-gray-800'}`}>
            {core.logs?.length > 0 ? core.logs.map((log: string, i: number) => (
              <div key={i} className="py-1 border-b last:border-0 break-words border-gray-700 dark:border-gray-700">
                {log}
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">No logs yet</div>
            )}
          </div>
        </div>

        {/* Force Scan Button */}
        <button
          onClick={forceScan}
          disabled={scanning}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 w-11/12 max-w-md sm:w-auto py-5 px-10 rounded-full flex items-center justify-center gap-3 shadow-2xl transition transform hover:scale-105 z-50 text-lg font-bold ${
            darkMode 
              ? 'bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-black' 
              : 'bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-400 text-white'
          }`}
        >
          {scanning ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <RefreshCw className="w-8 h-8" />
          )}
          {scanning ? "Scanning..." : "Force Scan Now"}
        </button>

        {/* Scan Message */}
        {scanMessage && (
          <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-sm z-40 ${
            darkMode ? 'bg-green-800 text-white' : 'bg-green-700 text-white'
          }`}>
            {scanMessage}
          </div>
        )}
      </div>
    </div>
  );
}
