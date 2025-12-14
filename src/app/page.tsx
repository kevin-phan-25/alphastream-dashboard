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

        {/* Top Stats — Compact Grid */}
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

        {/* Rockets */}
        <div className="mb-8">
          <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            <Zap className="w-5 h-5" /> Rockets ({core.rockets?.length || 0})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {core.rockets?.length > 0 ? core.rockets.map((r: any, i: number) => (
              <div key={i} className={`p-3 rounded-lg border text-center ${darkMode ? 'bg-gray-900 border-yellow-600' : 'bg-white border-yellow-500'}`}>
                <div className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{r.symbol}</div>
                <div className={`font-bold text-lg ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>+{r.gap}%</div>
              </div>
            )) : (
              <div className={`col-span-full text-center py-8 text-sm rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
                No gappers today
              </div>
            )}
          </div>
        </div>

        {/* Live Positions */}
        <div className="mb-8">
          <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            <TrendingUp className="w-5 h-5" /> Positions
          </h2>
          {positionsArray.length > 0 ? (
            <div className="space-y-3">
              {positionsArray.map(([symbol, p]: any) => {
                const pnlPct = p.entry && p.current ? ((p.current - p.entry) / p.entry) * 100 : 0;
                return (
                  <div key={symbol} className={`p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${darkMode ? 'bg-gray-900 border-green-700' : 'bg-white border-green-500'}`}>
                    <div>
                      <div className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{symbol} ×{p.qty || 0}</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        ${Number(p.entry || 0).toFixed(2)} → ${Number(p.current || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${pnlPct >= 0 ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                      {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-8 text-sm rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
              No open positions
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="mb-8">
          <h2 className={`text-lg font-bold mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>Recent Logs</h2>
          <div className={`rounded-lg border p-3 max-h-60 overflow-y-auto text-xs font-mono ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-300 text-gray-800'}`}>
            {core.logs?.length > 0 ? core.logs.map((log: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-700 dark:border-gray-700 last:border-0 break-words">
                {log}
              </div>
            )) : (
              <div className="text-center py-6 text-gray-500">No logs yet</div>
            )}
          </div>
        </div>

        {/* Force Scan */}
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
