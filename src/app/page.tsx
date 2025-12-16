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

const PATTERN_NAMES = [
  "Bull Flag",
  "Bear Flag",
  "Flat Top Breakout",
  "Flat Bottom Breakdown",
  "Inverted Head and Shoulders",
  "Ascending Support",
  "Descending Resistance",
  "Bull Flag Trap"
];

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [equityHistory, setEquityHistory] = useState<{ time: string; equity: number }[]>([]);
  const [mlStepsHistory, setMLStepsHistory] = useState<{ time: string; steps: number }[]>([]);
  const [mlRewardHistory, setMLRewardHistory] = useState<{ time: string; reward: number }[]>([]);
  const [mlWinRateHistory, setMLWinRateHistory] = useState<{ time: string; winRate: number }[]>([]);
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
      const mlSteps = Number(mlRes.data.steps || 0);
      const mlAverageReward = Number(mlRes.data.averageReward || 0);
      const mlWinRate = Number(mlRes.data.winRate || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore(coreRes.data);
      setML(mlRes.data);
      setEquityHistory(prev => [...prev, { time, equity }].slice(-30));
      setMLStepsHistory(prev => [...prev, { time, steps: mlSteps }].slice(-30));
      setMLRewardHistory(prev => [...prev, { time, reward: mlAverageReward }].slice(-30));
      setMLWinRateHistory(prev => [...prev, { time, winRate: mlWinRate }].slice(-30));
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
  const memorySize = ml?.memorySize || 0;
  const averageReward = ml?.averageReward || 0;
  const winRate = ml?.winRate || 0;

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

  const mlStepsChartData = {
    labels: mlStepsHistory.map(d => d.time),
    datasets: [{
      label: 'ML Training Steps',
      data: mlStepsHistory.map(d => d.steps),
      borderColor: '#a855f7',
      backgroundColor: 'rgba(168,85,247,0.15)',
      fill: true,
      tension: 0.4
    }]
  };

  const mlRewardChartData = {
    labels: mlRewardHistory.map(d => d.time),
    datasets: [{
      label: 'Average Reward',
      data: mlRewardHistory.map(d => d.reward),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.15)',
      fill: true,
      tension: 0.4
    }]
  };

  const mlWinRateChartData = {
    labels: mlWinRateHistory.map(d => d.time),
    datasets: [{
      label: 'Win Rate %',
      data: mlWinRateHistory.map(d => d.winRate),
      borderColor: '#eab308',
      backgroundColor: 'rgba(234,179,8,0.15)',
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
