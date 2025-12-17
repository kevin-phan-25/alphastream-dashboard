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
  price: string | number;
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

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";

  // Fetch core data — updated to match new backend response format
  const fetchData = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 15000 });
      const data = res.data || {};

      const equity = Number(data.equity || 20000);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore({
        equity: equity,
        buyingPower: Number(data.buyingPower || data.buying_power || 20000),
        dailyDrawdownPct: data.dailyDrawdownPct || data.daily_drawdown_pct || "0.00",
        lossLimitHit: data.lossLimitHit || false,
        mlConnected: data.mlConnected ?? data.mlHealthy ?? false,
        universeSize: data.universeSize || 0,
        rockets: Array.isArray(data.rockets) ? data.rockets : [],
        positions: Array.isArray(data.positions) ? data.positions : [],
        tradeLog: Array.isArray(data.tradeLog) ? data.tradeLog.slice(-20) : []
      });

      setEquityHistory(prev => [...prev, { time, equity }].slice(-30));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));

      if (Array.isArray(data.rockets)) {
        setLiveRockets(data.rockets);
      }

      setError(null);
    } catch (e: any) {
      console.error("Fetch error:", e);
      setError(e.response?.data?.message || "Cannot reach AlphaStream Core");
    } finally {
      setLoading(false);
    }
  };

  // Force scan
  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage("Triggering scan...");
    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 20000 });
      setMessage("Scan triggered!");

      // Flash new rockets
      setTimeout(() => {
        fetchData(); // refresh full data
        setMessage("");
      }, 1500);

      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage("Scan failed");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setScanning(false);
    }
  };

  // Dark mode toggle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  }, [darkMode]);

  // Auto-refresh
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 15000);
    return () => clearInterval(intervalId);
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

  const { equity = 20000, buyingPower = 20000, dailyDrawdownPct = "0.00", lossLimitHit = false, mlConnected = false, universeSize = 0 } = core;
  const positions = Array.isArray(core.positions) ? core.positions : [];
  const rockets = liveRockets.length > 0 ? liveRockets : (Array.isArray(core.rockets) ? core.rockets : []);
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog : [];

  const equityChartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{
      label: 'Equity',
      data: equityHistory.map(d => d.equity),
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 2
    }]
  };

  const getActionDetails = (action: number = 2, priority: boolean = false, confidence: number = 50) => {
    const labels = ["STRONG BUY", "BUY", "HOLD", "NEUTRAL", "SELL"];
    const colors = ["text-green-300 bg-green-900/30", "text-green-400 bg-green-900/20", "text-yellow-400 bg-yellow-900/20", "text-gray-400 bg-gray-800/30", "text-red-400 bg-red-900/30"];
    return { label: labels[action] || "HOLD", color: colors[action] || "text-gray-400 bg-gray-800/30", confidence, isPriority: priority };
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <header className="border-b border-cyan-900/30 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Bot className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AlphaStream Scalp Core
            </h1>
            <div className="flex items-center gap-2 text-xs">
              <Globe className="w-4 h-4" />
              <span>{universeSize} symbols</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-800 transition"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={forceScan}
              disabled={scanning}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-lg font-medium flex items-center gap-2 transition"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {scanning ? "Scanning..." : "Force Scan"}
            </button>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className="border-b border-cyan-900/30 bg-gradient-to-r from-black via-cyan-900/10 to-black py-3">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-400" />
              <span>Equity: <span className="font-bold text-cyan-400">${Number(equity).toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span>BP: <span className="font-bold text-green-400">${Number(buyingPower).toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
            </div>
            <div className={`flex items-center gap-2 ${lossLimitHit ? 'text-red-400' : 'text-yellow-400'}`}>
              <AlertTriangle className="w-5 h-5" />
              <span>Daily DD: <span className={`font-bold ${lossLimitHit ? 'text-red-400' : ''}`}>{dailyDrawdownPct}%</span></span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${mlConnected ? 'text-green-400 animate-pulse' : 'text-gray-600'}`} />
              <span>ML: <span className={`font-bold ${mlConnected ? 'text-green-400' : 'text-red-400'}`}>{mlConnected ? 'ONLINE' : 'OFFLINE'}</span></span>
            </div>
            <div className="text-xs text-gray-500">
              Last update: {lastUpdate} ET
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="bg-cyan-900/50 border-y border-cyan-700 py-2 text-center text-cyan-300 font-medium">
          {message}
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Chart */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-cyan-900/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Equity Curve
          </h2>
          <div className="h-64">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-500">Loading chart...</div>}>
              <Line data={equityChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { color: '#1f2937' } },
                  y: { grid: { color: '#1f2937' } }
                }
              }} />
            </Suspense>
          </div>
        </div>

        {/* Positions */}
        <div className="bg-gray-900/50 border border-cyan-900/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Positions ({positions.length}/6)</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {positions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No open positions</p>
            ) : (
              positions.map((pos: any, i: number) => (
                <div key={i} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg">{pos.symbol}</div>
                      <div className="text-sm text-gray-400">{pos.qty} shares @ ${Number(pos.avg_entry_price || pos.price).toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-medium">
                        ${(pos.qty * (pos.current_price || pos.avg_entry_price)).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rockets */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-cyan-900/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
            <span>Hot Rockets ({rockets.length})</span>
            {rockets.length > 0 && <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {rockets.length === 0 ? (
              <p className="col-span-2 text-gray-500 text-center py-12">No rockets detected</p>
            ) : (
              rockets.map((rocket: Rocket, i: number) => {
                const action = getActionDetails(rocket.mlAction, rocket.mlPriority, rocket.mlConfidence);
                const isFlashing = flashRockets.has(rocket.symbol);
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border transition-all ${isFlashing ? 'border-yellow-400 bg-yellow-900/20 scale-105' : 'border-gray-700'} bg-gray-800/50`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-xl">{rocket.symbol}</div>
                      <div className={`px-3 py-1 rounded text-xs font-bold ${action.color}`}>
                        {action.label}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Price: <span className="font-medium">${Number(rocket.price).toFixed(2)}</span></div>
                      <div>Gap: <span className="font-medium text-green-400">+{rocket.gap}%</span></div>
                      {rocket.rvol && <div>RVOL: <span className="font-medium">{rocket.rvol}</span></div>}
                      <div>ML Conf: <span className="font-medium">{rocket.mlConfidence}%</span></div>
                    </div>
                    {rocket.mlPriority && <div className="mt-2 text-yellow-400 text-xs font-bold">⚡ PRIORITY SPIKE</div>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Trade Log */}
        <div className="bg-gray-900/50 border border-cyan-900/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Trade Log</h2>
          <div className="space-y-2 text-xs max-h-96 overflow-y-auto font-mono">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No activity yet</p>
            ) : (
              logs.map((log: any, i: number) => (
                <div key={i} className="py-1 border-b border-gray-800">
                  <span className="text-gray-500">{log.time}</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
