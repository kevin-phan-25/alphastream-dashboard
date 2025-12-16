'use client';

import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { RefreshCw, Zap, Brain, Activity, Loader2, Sun, Moon, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';

// Safe dynamic import for chart
const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center text-gray-500">Loading chart...</div>
});

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

      const equity = Number(coreRes.data?.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore(coreRes.data || {});
      setML(mlRes.data || {});
      setEquityHistory(prev => [...prev, { time, equity }].slice(-50));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));
      setError(null);
    } catch (e) {
      console.error("Fetch error:", e);
      setError("Failed to connect — retrying...");
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
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center gap-4">
        <Activity className="w-12 h-12 animate-pulse" />
        <p className="text-xl">Connecting to AlphaStream AI...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-6 p-8 text-center">
        <AlertCircle className="w-16 h-16" />
        <p className="text-lg">{error}</p>
        <button onClick={fetchData} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 px-8 rounded-full">
          Retry Connection
        </button>
      </div>
    );
  }

  // Safe defaults
  const positions = core?.positions || [];
  const rockets = core?.rockets || [];
  const logs = core?.logs || [];

  const equityChartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{
      label: 'Equity',
      data: equityHistory.map(d => d.equity),
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6,182,212,0.15)',
      fill: true,
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'} transition-colors`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className={`text-3xl sm:text-4xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
            AlphaStream AI Trader
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Last update: {lastUpdate} ET</span>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-800 dark:bg-gray-200">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-cyan-900/50 border border-cyan-600 rounded-lg text-center text-cyan-300">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-cyan-700 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
            <div className="text-sm text-gray-400">Equity</div>
            <div className="text-3xl font-bold">${Number(core?.equity || 0).toLocaleString()}</div>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-purple-700 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-sm text-gray-400">Positions</div>
            <div className="text-3xl font-bold text-purple-400">{positions.length}/5</div>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-green-700 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-sm text-gray-400">Rockets</div>
            <div className="text-3xl font-bold text-green-400">{rockets.length}</div>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-yellow-700 text-center">
            <Brain className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-sm text-gray-400">ML Memory</div>
            <div className="text-3xl font-bold text-yellow-400">{ml?.trackedSymbols || 0}</div>
          </div>
        </div>

        <div className="mb-8 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Equity Performance</h2>
          <div className="h-64">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-500">Loading chart...</div>}>
              <Line data={equityChartData} options={chartOptions} />
            </Suspense>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6" /> Today's Rockets ({rockets.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {rockets.length > 0 ? rockets.map((r: any, i: number) => (
              <div key={i} className="bg-gray-900/50 p-6 rounded-lg border border-yellow-600 text-center">
                <div className="font-bold text-xl">{r.symbol}</div>
                <div className="text-4xl text-yellow-400">+{r.gap}%</div>
              </div>
            )) : (
              <div className="col-span-full text-gray-500 text-center py-12">No gappers detected</div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-green-400 mb-4">Live Positions</h2>
          <div className="space-y-4">
            {positions.length > 0 ? positions.map((p: any, i: number) => (
              <div key={i} className="bg-gray-900/50 p-4 rounded border border-green-700 flex justify-between items-center">
                <div>
                  <div className="font-bold text-xl">{p.symbol} ×{p.qty}</div>
                  <div className="text-sm text-gray-400">Entry: ${p.entry?.toFixed(2) || 'N/A'}</div>
                </div>
                <div className={`text-3xl font-bold ${p.pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct?.toFixed(1) || '0.0'}%
                </div>
              </div>
            )) : (
              <div className="text-gray-500 text-center py-12">No open positions</div>
            )}
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Execution Log</h2>
          <div className="bg-gray-900/50 p-4 rounded-lg text-xs font-mono max-h-96 overflow-y-auto border border-gray-800">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              logs.slice(-20).reverse().map((l: string, i: number) => (
                <div key={i} className="py-2 border-b border-gray-800 last:border-0">{l}</div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={forceScan}
          disabled={scanning}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-md py-5 rounded-full font-bold text-xl flex items-center justify-center gap-3 shadow-2xl z-50 transition-all ${
            scanning ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-black'
          }`}
        >
          {scanning ? <Loader2 className="w-8 h-8 animate-spin" /> : <RefreshCw className="w-8 h-8" />}
          {scanning ? "SCANNING..." : "FORCE SCAN"}
        </button>
      </div>
    </div>
  );
}
