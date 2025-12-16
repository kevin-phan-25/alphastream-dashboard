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
import { RefreshCw, Zap, Brain, Activity, Loader2, Sun, Moon, AlertCircle } from 'lucide-react';

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
  const logs = core.logs || [];

  const equityChartData = {
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
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Last update: {lastUpdate} ET</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-800 dark:bg-gray-200"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-cyan-900/50 border border-cyan-600 rounded text-center text-cyan-300">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 dark:bg-gray-100 p-6 rounded-lg border border-cyan-700">
            <div className="text-sm text-gray-400">Live Equity</div>
            <div className="text-4xl font-bold text-white dark:text-gray-900">
              ${Number(core.equity).toLocaleString()}
            </div>
          </div>

          <div className="bg-gray-900 dark:bg-gray-100 p-6 rounded-lg border border-purple-700">
            <div className="text-sm text-gray-400">Open Positions</div>
            <div className="text-4xl font-bold text-purple-400">{positions.length}/5</div>
          </div>

          <div className="bg-gray-900 dark:bg-gray-100 p-6 rounded-lg border border-green-700">
            <div className="text-sm text-gray-400">Rockets Today</div>
            <div className="text-4xl font-bold text-green-400">{rockets.length}</div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Equity Curve</h2>
          <div className="bg-gray-900 dark:bg-gray-100 p-4 rounded-lg h-64">
            <Line
              data={equityChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6" /> Today's Rockets
            </h2>
            <div className="space-y-3">
              {rockets.length > 0 ? rockets.map((r: any, i: number) => (
                <div key={i} className="bg-gray-900 dark:bg-gray-100 p-4 rounded border border-yellow-600 flex justify-between">
                  <span className="font-bold">{r.symbol}</span>
                  <span className="text-2xl text-yellow-400">+{r.gap}%</span>
                </div>
              )) : (
                <div className="text-gray-500 text-center py-8">No gappers detected yet</div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-green-400 mb-4">Live Positions</h2>
            <div className="space-y-3">
              {positions.length > 0 ? positions.map((p: any, i: number) => (
                <div key={i} className="bg-gray-900 dark:bg-gray-100 p-4 rounded border border-green-700 flex justify-between items-center">
                  <div>
                    <div className="font-bold">{p.symbol} ×{p.qty}</div>
                    <div className="text-sm text-gray-400">Entry: ${p.entry?.toFixed(2)}</div>
                  </div>
                  <div className={`text-2xl font-bold ${p.pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct?.toFixed(1)}%
                  </div>
                </div>
              )) : (
                <div className="text-gray-500 text-center py-8">No open positions</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6" /> ML Memory Status
          </h2>
          <div className="bg-gray-900 dark:bg-gray-100 p-6 rounded-lg border border-purple-700 text-center">
            <div className="text-3xl font-bold">{ml?.trackedSymbols || 0}</div>
            <div className="text-sm text-gray-400">Symbols Tracked</div>
          </div>
        </div>

        <button
          onClick={forceScan}
          disabled={scanning}
          className={`fixed bottom-8 right-8 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-bold py-4 px-8 rounded-full flex items-center gap-3 shadow-2xl text-lg`}
        >
          {scanning ? <Loader2 className="w-8 h-8 animate-spin" /> : <RefreshCw className="w-8 h-8" />}
          {scanning ? "SCANNING..." : "FORCE SCAN"}
        </button>
      </div>
    </div>
  );
}
