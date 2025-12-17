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
  Bot,
  TrendingUp,
  AlertTriangle
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
  loading: () => <div className="h-24 flex items-center justify-center text-gray-500 text-xs">Loading chart...</div>
});

type Rocket = {
  symbol: string;
  gap: string;
  price: number | string;
  rvol?: string;
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
  const [afterHoursQueue, setAfterHoursQueue] = useState<Rocket[]>([]);

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 20000 });
      const data = res.data || {};

      const equityValue = Number(data.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore(data);

      setEquityHistory(prev => {
        const updated = [...prev, { time, equity: equityValue }];
        return updated.slice(-30);
      });

      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));

      if (Array.isArray(data.rockets)) {
        const newSymbols = data.rockets.map((r: Rocket) => r.symbol);
        if (newSymbols.length > 0) {
          setFlashRockets(new Set(newSymbols));
          setTimeout(() => setFlashRockets(new Set()), 3000);
        }
        setLiveRockets(data.rockets);
      }

      if (Array.isArray(data.afterHoursQueue)) {
        setAfterHoursQueue(data.afterHoursQueue);
      }

      setError(null);
    } catch (e: any) {
      console.error("Dashboard fetch error:", e);
      setError("Cannot reach AlphaStream Core — retrying...");
    } finally {
      setLoading(false);
    }
  };

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage("Forcing scan...");
    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 30000 });
      setMessage("Scan triggered!");
      setTimeout(() => fetchData(), 1000);
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage("Scan failed");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  }, [darkMode]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black text-cyan-400 flex flex-col items-center justify-center gap-4">
      <Activity className="w-10 h-10 animate-pulse" />
      <p className="text-lg">Connecting to AlphaStream Core...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertCircle className="w-12 h-12" />
      <p className="text-lg max-w-md">{error}</p>
      <button onClick={fetchData} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium transition">
        Retry Connection
      </button>
    </div>
  );

  const equity = Number(core.equity || 0);
  const buyingPower = Number(core.buyingPower || 0);
  const dailyDrawdown = Number(core.dailyDrawdown || 0);
  const dailyDrawdownPct = ((dailyDrawdown / (equity + dailyDrawdown)) * 100).toFixed(2);
  const lossLimitHit = Math.abs(dailyDrawdown) >= 2000;
  const mlConnected = core.mlHealthy === true;
  const universeSize = core.universeSize || 0;

  const positions = Array.isArray(core.positions) ? core.positions : [];
  const rockets = liveRockets.length > 0 ? liveRockets : (Array.isArray(core.rockets) ? core.rockets : []);
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog : [];

  const equityChartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{
      label: 'Equity',
      data: equityHistory.map(d => d.equity),
      borderColor: dailyDrawdown < 0 ? '#ef4444' : '#06b6d4',
      backgroundColor: dailyDrawdown < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(6, 182, 212, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3
    }]
  };

  const getActionDetails = (action: number = 2, priority: boolean = false, confidence: number = 50) => {
    const labels = ["STRONG BUY", "BUY", "HOLD", "NEUTRAL", "SELL"];
    const colors = [
      "text-green-300 bg-green-900/40 border-green-600",
      "text-green-400 bg-green-900/30 border-green-500",
      "text-yellow-400 bg-yellow-900/20 border-yellow-600",
      "text-gray-400 bg-gray-800/30 border-gray-600",
      "text-red-400 bg-red-900/30 border-red-600"
    ];
    return { label: labels[action] || "HOLD", color: colors[action] || "text-gray-400 bg-gray-800/30", confidence, isPriority: priority };
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      <header className="border-b border-cyan-900/30 bg-black/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Bot className="w-9 h-9 text-cyan-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AlphaStream Scalp Core
            </h1>
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Globe className="w-4 h-4" />
              <span>{universeSize} symbols in universe</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-lg hover:bg-gray-800 transition"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={forceScan}
              disabled={scanning}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 rounded-lg font-medium flex items-center gap-2 transition shadow-lg"
            >
              {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              {scanning ? "Scanning..." : "Force Scan"}
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="bg-cyan-900/70 border-y border-cyan-600 py-3 text-center text-cyan-200 font-semibold text-lg">
          {message}
        </div>
      )}

      {/* Equity, Positions, Rockets, Trade Log sections remain unchanged from your original code */}

      {/* AFTER HOURS QUEUE */}
      {afterHoursQueue.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-6 bg-gray-800/60 border border-yellow-600 rounded-2xl shadow-lg mb-6">
          <h2 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
            <Zap className="w-6 h-6" />
            After-Hours Queue ({afterHoursQueue.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {afterHoursQueue.map((rocket: Rocket, i: number) => {
              const action = getActionDetails(rocket.mlAction, rocket.mlPriority, rocket.mlConfidence);
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-yellow-500 bg-yellow-900/30"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-xl text-white">{rocket.symbol}</div>
                    <div className={`px-2 py-1 rounded text-sm font-bold border ${action.color}`}>
                      {action.label}
                    </div>
                  </div>
                  <div className="text-sm text-gray-200">
                    Price: ${Number(rocket.price).toFixed(2)} | Gap: +{rocket.gap}% | ML Conf: {rocket.mlConfidence}%
                  </div>
                  {rocket.mlPriority && (
                    <div className="mt-2 text-yellow-300 font-bold animate-pulse text-center">⚡ PRIORITY ⚡</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
