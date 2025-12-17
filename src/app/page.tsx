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
  AlertTriangle,
  Clock,
  Package
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
  const dailyDrawdownPct = dailyDrawdown !== 0 
    ? ((Math.abs(dailyDrawdown) / (equity - dailyDrawdown)) * 100).toFixed(2)
    : "0.00";
  const lossLimitHit = Math.abs(dailyDrawdown) >= 2000;
  const mlConnected = core.mlHealthy === true;
  const universeSize = core.universeSize || 0;
  const afterHoursQueue = Array.isArray(core.afterHoursQueue) ? core.afterHoursQueue : [];

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
      {/* Header */}
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

      {/* Message Banner */}
      {message && (
        <div className="bg-cyan-900/70 border-y border-cyan-600 py-3 text-center text-cyan-200 font-semibold text-lg">
          {message}
        </div>
      )}

      {/* Quick Watch Checklist */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-gradient-to-r from-cyan-900/40 to-purple-900/40 border border-cyan-700 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-5 text-cyan-300 flex items-center gap-3">
            <Activity className="w-6 h-6 animate-pulse" />
            Dashboard Watch Checklist — Glance Every 2–3 Minutes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-5 rounded-xl border-2 ${mlConnected ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'}`}>
              <div className="flex items-center gap-3 mb-2">
                <Zap className={`w-6 h-6 ${mlConnected ? 'text-green-400 animate-pulse' : 'text-red-400'}`} />
                <span className="font-bold text-lg">ML Brain</span>
              </div>
              <div className={`text-2xl font-bold ${mlConnected ? 'text-green-400' : 'text-red-400'}`}>
                {mlConnected ? 'ONLINE' : 'OFFLINE'}
              </div>
              <p className="text-sm text-gray-400 mt-2">Must be ONLINE for smart entries</p>
            </div>

            <div className={`p-5 rounded-xl border-2 ${lossLimitHit ? 'border-red-600 bg-red-900/20' : 'border-green-600 bg-green-900/20'}`}>
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className={`w-6 h-6 ${lossLimitHit ? 'text-red-400' : 'text-green-400'}`} />
                <span className="font-bold text-lg">Daily Safety</span>
              </div>
              <div className={`text-2xl font-bold ${lossLimitHit ? 'text-red-400' : 'text-green-400'}`}>
                {lossLimitHit ? 'LIMIT HIT' : 'SAFE'}
              </div>
              <p className="text-sm text-gray-400 mt-2">Drawdown: {dailyDrawdownPct}% (${Math.abs(dailyDrawdown).toLocaleString()})</p>
            </div>

            <div className="p-5 rounded-xl border-2 border-cyan-600 bg-cyan-900/20">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-cyan-400" />
                <span className="font-bold text-lg">Market Time</span>
              </div>
              <div className="text-2xl font-bold text-cyan-300">
                {new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: '2-digit', minute: '2-digit' })} ET
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {isAfterHoursET() ? 'After-hours: Queue active' : 
                 new Date().getHours() >= 9 && new Date().getHours() < 16 ? 'Regular hours: Full trading' :
                 'Premarket: Scanning only'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* After-Hours Queue Section */}
      {afterHoursQueue.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 my-6">
          <div className="bg-purple-900/40 border border-purple-600 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-purple-300">
              <Package className="w-6 h-6" />
              After-Hours Queue ({afterHoursQueue.length}) — Ready for Tomorrow's Open
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {afterHoursQueue.map((rocket: Rocket, i: number) => {
                const action = getActionDetails(rocket.mlAction, rocket.mlPriority, rocket.mlConfidence);
                return (
                  <div key={i} className="bg-purple-800/50 rounded-lg p-4 border border-purple-700">
                    <div className="font-bold text-lg text-white">{rocket.symbol}</div>
                    <div className="text-sm text-purple-300 mt-1">
                      Gap: +{rocket.gap}% | RVOL: {rocket.rvol}x | Conf: {rocket.mlConfidence}%
                    </div>
                    <div className={`mt-2 px-3 py-1 rounded text-xs font-bold inline-block ${action.color}`}>
                      {action.label} (Queued)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="border-b border-cyan-900/30 bg-gradient-to-r from-black via-cyan-950/20 to-black py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-6 text-sm">
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-cyan-400" />
              <div>
                <div className="text-gray-400">Equity</div>
                <div className="font-bold text-xl text-cyan-400">
                  ${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-400" />
              <div>
                <div className="text-gray-400">Buying Power</div>
                <div className="font-bold text-xl text-green-400">
                  ${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-3 ${lossLimitHit ? 'text-red-400' : 'text-orange-400'}`}>
              <AlertTriangle className="w-6 h-6" />
              <div>
                <div className="text-gray-400">Daily Drawdown</div>
                <div className={`font-bold text-xl ${lossLimitHit ? 'text-red-400' : 'text-orange-400'}`}>
                  {dailyDrawdownPct}%
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Zap className={`w-6 h-6 ${mlConnected ? 'text-green-400 animate-pulse' : 'text-gray-600'}`} />
              <div>
                <div className="text-gray-400">ML Brain</div>
                <div className={`font-bold text-lg ${mlConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {mlConnected ? 'ONLINE' : 'OFFLINE'}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last update: {lastUpdate} ET
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Chart */}
        <div className="lg:col-span-2 bg-gray-900/60 border border-cyan-900/40 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-cyan-300">
            <TrendingUp className="w-6 h-6" />
            Equity Curve
          </h2>
          <div className="h-80">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-500">Loading chart...</div>}>
              <Line data={equityChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
                scales: {
                  x: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af' } },
                  y: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af' } }
                }
              }} />
            </Suspense>
          </div>
        </div>

        {/* Positions */}
        <div className="bg-gray-900/60 border border-cyan-900/40 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-4 text-cyan-300">
            Positions ({positions.length}/6)
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {positions.length === 0 ? (
              <p className="text-gray-500 text-center py-12 text-lg">No open positions</p>
            ) : (
              positions.map((pos: any, i: number) => (
                <div key={i} className="bg-gray-800/70 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-2xl text-white">{pos.symbol}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {pos.qty} shares @ ${Number(pos.avg_entry_price).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-xl">
                        ${(pos.qty * pos.avg_entry_price).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rockets */}
        <div className="lg:col-span-2 bg-gray-900/60 border border-cyan-900/40 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-4 flex items-center justify-between text-cyan-300">
            <span>Hot Rockets ({rockets.length})</span>
            {rockets.length > 0 && <Zap className="w-7 h-7 text-yellow-400 animate-pulse" />}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {rockets.length === 0 ? (
              <p className="col-span-2 text-gray-500 text-center py-16 text-lg">No rockets detected — waiting for spike</p>
            ) : (
              rockets.map((rocket: Rocket, i: number) => {
                const action = getActionDetails(rocket.mlAction, rocket.mlPriority, rocket.mlConfidence);
                const isFlashing = flashRockets.has(rocket.symbol);
                return (
                  <div
                    key={i}
                    className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                      isFlashing 
                        ? 'border-yellow-400 bg-yellow-900/30 scale-105 shadow-2xl shadow-yellow-500/50' 
                        : 'border-cyan-800/50 bg-gray-800/70'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-bold text-2xl text-white">{rocket.symbol}</div>
                      <div className={`px-4 py-2 rounded-lg text-sm font-bold border ${action.color}`}>
                        {action.label}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Price:</span>
                        <span className="font-bold text-white ml-2">${Number(rocket.price).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Gap:</span>
                        <span className="font-bold text-green-400 ml-2">+{rocket.gap}%</span>
                      </div>
                      {rocket.rvol && (
                        <div>
                          <span className="text-gray-400">RVOL:</span>
                          <span className="font-bold text-cyan-300 ml-2">{rocket.rvol}x</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">ML Conf:</span>
                        <span className="font-bold text-yellow-400 ml-2">{rocket.mlConfidence}%</span>
                      </div>
                    </div>
                    {rocket.mlPriority && (
                      <div className="mt-4 text-yellow-400 text-center font-bold text-lg animate-pulse">
                        ⚡ ULTRA PRIORITY SPIKE ⚡
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Trade Log */}
        <div className="bg-gray-900/60 border border-cyan-900/40 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-4 text-cyan-300">Trade Log</h2>
          <div className="space-y-2 text-sm max-h-96 overflow-y-auto font-mono bg-black/40 rounded-lg p-4">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No activity yet</p>
            ) : (
              logs.map((log: any, i: number) => (
                <div key={i} className="py-2 border-b border-gray-800 last:border-0">
                  <span className="text-gray-500 text-xs">{log.time}</span>
                  <span className="ml-3 text-gray-300">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
