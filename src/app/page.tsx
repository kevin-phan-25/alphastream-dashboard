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
  Filler,
  Legend
} from 'chart.js';
import { RefreshCw, Zap, Brain, Activity, Loader2, Sun, Moon, AlertCircle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend);

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [equityHistory, setEquityHistory] = useState<{ time: string; equity: number }[]>([]);
  const [stepsHistory, setStepsHistory] = useState<{ time: string; steps: number }[]>([]);
  const [rewardHistory, setRewardHistory] = useState<{ time: string; reward: number }[]>([]);
  const [winRateHistory, setWinRateHistory] = useState<{ time: string; winRate: number }[]>([]);
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
      const steps = Number(mlRes.data.steps || 0);
      const avgReward = Number(mlRes.data.averageReward || 0);
      const winRate = Number(mlRes.data.winRate || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore(coreRes.data);
      setML(mlRes.data);
      setEquityHistory(prev => [...prev, { time, equity }].slice(-30));
      setStepsHistory(prev => [...prev, { time, steps }].slice(-30));
      setRewardHistory(prev => [...prev, { time, reward: avgReward }].slice(-30));
      setWinRateHistory(prev => [...prev, { time, winRate }].slice(-30));
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
      label: 'Equity',
      data: equityHistory.map(d => d.equity),
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6,182,212,0.15)',
      fill: true,
      tension: 0.4
    }]
  };

  const stepsChartData = {
    labels: stepsHistory.map(d => d.time),
    datasets: [{
      label: 'Training Steps',
      data: stepsHistory.map(d => d.steps),
      borderColor: '#a855f7',
      backgroundColor: 'rgba(168,85,247,0.15)',
      fill: true,
      tension: 0.4
    }]
  };

  const rewardChartData = {
    labels: rewardHistory.map(d => d.time),
    datasets: [{
      label: 'Avg Reward',
      data: rewardHistory.map(d => d.reward),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.15)',
      fill: true,
      tension: 0.4
    }]
  };

  const winRateChartData = {
    labels: winRateHistory.map(d => d.time),
    datasets: [{
      label: 'Win Rate %',
      data: winRateHistory.map(d => d.winRate),
      borderColor: '#eab308',
      backgroundColor: 'rgba(234,179,8,0.15)',
      fill: true,
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: { x: { display: false }, y: { display: true } }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'} transition-colors`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
            AlphaStream AI
          </h1>
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="text-gray-500">Updated: {lastUpdate} ET</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-800 dark:bg-gray-200"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-cyan-900/50 border border-cyan-600 rounded text-center text-cyan-300">
            {message}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 dark:bg-gray-100 p-4 sm:p-6 rounded-lg border border-cyan-700 text-center">
            <div className="text-xs sm:text-sm text-gray-400">Equity</div>
            <div className="text-xl sm:text-3xl font-bold">${Number(core.equity).toLocaleString()}</div>
          </div>
          <div className="bg-gray-900 dark:bg-gray-100 p-4 sm:p-6 rounded-lg border border-purple-700 text-center">
            <div className="text-xs sm:text-sm text-gray-400">Positions</div>
            <div className="text-xl sm:text-3xl font-bold text-purple-400">{positions.length}/5</div>
          </div>
          <div className="bg-gray-900 dark:bg-gray-100 p-4 sm:p-6 rounded-lg border border-green-700 text-center">
            <div className="text-xs sm:text-sm text-gray-400">Rockets</div>
            <div className="text-xl sm:text-3xl font-bold text-green-400">{rockets.length}</div>
          </div>
          <div className="bg-gray-900 dark:bg-gray-100 p-4 sm:p-6 rounded-lg border border-yellow-700 text-center">
            <div className="text-xs sm:text-sm text-gray-400">ML Memory</div>
            <div className="text-xl sm:text-3xl font-bold text-yellow-400">{ml?.trackedSymbols || 0}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 dark:bg-gray-100 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-bold text-cyan-400 mb-2">Equity Curve</h2>
            <div className="h-64">
              <Line data={equityChartData} options={chartOptions} />
            </div>
          </div>
          <div className="bg-gray-900 dark:bg-gray-100 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-bold text-purple-400 mb-2">ML Training Steps</h2>
            <div className="h-64">
              <Line data={stepsChartData} options={chartOptions} />
            </div>
          </div>
          <div className="bg-gray-900 dark:bg-gray-100 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-bold text-green-400 mb-2">Average Reward</h2>
            <div className="h-64">
              <Line data={rewardChartData} options={chartOptions} />
            </div>
          </div>
          <div className="bg-gray-900 dark:bg-gray-100 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-bold text-yellow-400 mb-2">Win Rate %</h2>
            <div className="h-64">
              <Line data={winRateChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Rockets */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6" /> Today's Rockets ({rockets.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {rockets.length > 0 ? rockets.map((r: any, i: number) => (
              <div key={i} className="bg-gray-900 dark:bg-gray-100 p-4 rounded border border-yellow-600 text-center">
                <div className="font-bold text-lg">{r.symbol}</div>
                <div className="text-3xl text-yellow-400">+{r.gap}%</div>
              </div>
            )) : (
              <div className="col-span-full text-gray-500 text-center py-8">No gappers detected</div>
            )}
          </div>
        </div>

        {/* Positions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-green-400 mb-4">Live Positions</h2>
          <div className="space-y-4">
            {positions.length > 0 ? positions.map((p: any, i: number) => (
              <div key={i} className="bg-gray-900 dark:bg-gray-100 p-4 rounded border border-green-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="font-bold text-xl">{p.symbol} ×{p.qty}</div>
                  <div className="text-sm text-gray-400">Entry: ${p.entry?.toFixed(2)}</div>
                </div>
                <div className={`text-3xl font-bold ${p.pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct?.toFixed(1)}%
                </div>
              </div>
            )) : (
              <div className="text-gray-500 text-center py-8">No open positions</div>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="mb-20">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Execution Log</h2>
          <div className="bg-gray-900 dark:bg-gray-100 p-4 rounded-lg text-xs font-mono max-h-96 overflow-y-auto border border-gray-800">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              logs.slice(-20).reverse().map((l: string, i: number) => (
                <div key={i} className="py-2 border-b border-gray-800 last:border-0">
                  {l}
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={forceScan}
          disabled={scanning}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-md py-5 rounded-full font-bold text-xl shadow-2xl flex items-center justify-center gap-3 z-50 transition-all ${
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
