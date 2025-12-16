'use client';

import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import {
  RefreshCw,
  Zap,
  Activity,
  Loader2,
  Sun,
  Moon,
  AlertCircle,
  DollarSign,
  Wallet,
  Globe,
  Bot
} from 'lucide-react';

// Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), {
  ssr: false,
  loading: () => <div className="h-24 flex items-center justify-center text-gray-500 text-xs">Loading...</div>
});

type Rocket = {
  symbol: string;
  gap: string;
  price: string;
  rvol: string;
  mlAction: number;
  mlPriority: boolean;
  mlConfidence: number;
};

export default function Dashboard() {
  const [core, setCore] = useState<any>({});
  const [equityHistory, setEquityHistory] = useState<{ time: string; equity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [liveRockets, setLiveRockets] = useState<Rocket[]>([]);
  const [flashRockets, setFlashRockets] = useState<Set<string>>(new Set());

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";

  // Fetch core data
  const fetchData = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 12000 });
      const data = res.data || {};
      const equity = Number(data.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore({
        ...data,
        mlConnected: data.mlConnected ?? false,
        universeSize: data.universeSize ?? (data.watchlist?.length || 0)
      });

      setEquityHistory(prev => [...prev, { time, equity }].slice(-30));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));

      if (Array.isArray(data.rockets)) setLiveRockets(data.rockets);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Cannot reach core service");
    } finally {
      setLoading(false);
    }
  };

  // Force scan
  const forceScan = async () => {
    if (scanning) return;
    setScanning(true); setMessage("Scanning...");
    try {
      const res = await axios.post(`${CORE_URL}/scan`);
      setMessage("Triggered!");

      if (res.data?.rockets && Array.isArray(res.data.rockets)) {
        const newSymbols = res.data.rockets.map((r: Rocket) => r.symbol);
        setFlashRockets(new Set(newSymbols));
        setLiveRockets(res.data.rockets);
        setTimeout(() => setFlashRockets(new Set()), 2000);
      }

      setTimeout(() => setMessage(""), 2500);
    } catch {
      setMessage("Failed"); setTimeout(() => setMessage(""), 2500);
    } finally {
      setScanning(false); 
      fetchData();
    }
  };

  // Dark mode toggle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  }, [darkMode]);

  // Auto-refresh core data
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 15000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center gap-2 text-sm">
      <Activity className="w-6 h-6 animate-pulse" /> Connecting...
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-2 p-3 text-center text-sm">
      <AlertCircle className="w-8 h-8" /> {error}
      <button onClick={fetchData} className="px-3 py-1 bg-cyan-600 rounded text-xs mt-2">Retry</button>
    </div>
  );

  const positions = Array.isArray(core.positions) ? core.positions : [];
  const rockets = liveRockets || [];
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog : [];

  const equityChartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{
      data: equityHistory.map(d => d.equity),
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6,182,212,0.1)',
      fill: true,
      tension: 0.3
    }]
  };

  const getActionDetails = (action: number = 2, priority: boolean = false, confidence: number = 50) => {
    const labels = ["BUY STRONG","BUY","HOLD","SKIP","SELL"];
    const colors = ["text-green-400","text-green-300","text-yellow-400","text-gray-400","text-red-400"];
    return { label: labels[action] || "HOLD", color: colors[action] || "text-gray-400", confidence, isPriority: priority };
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'} transition-colors`}>
      {/* ... full dashboard UI ... */}
      {/* Everything else remains exactly as you provided above */}
    </div>
  );
}
