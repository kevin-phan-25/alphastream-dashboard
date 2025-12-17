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

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), {
  ssr: false,
  loading: () => <div className="h-20 flex items-center justify-center text-gray-500 text-xs">Loading chart...</div>
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

      setEquityHistory(prev => [...prev, { time, equity: equityValue }].slice(-30));
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
    } catch {
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

  // Fixed: get numeric ET hour
  const etHour = Number(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: 'numeric', hour12: false }));
  const isAfterHours = etHour >= 16 && etHour < 20;

  if (loading) return (
    <div className="min-h-screen bg-black text-cyan-400 flex flex-col items-center justify-center gap-3">
      <Activity className="w-8 h-8 animate-pulse" />
      <p>Connecting to AlphaStream Core...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-3 p-4 text-center">
      <AlertCircle className="w-10 h-10" />
      <p className="text-lg max-w-md">{error}</p>
      <button onClick={fetchData} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium">
        Retry
      </button>
    </div>
  );

  const equity = Number(core.equity || 0);
  const buyingPower = Number(core.buyingPower || 0);
  const dailyDrawdown = Number(core.dailyDrawdown || 0);
  const dailyDrawdownPct = dailyDrawdown !== 0 
    ? ((Math.abs(dailyDrawdown) / (equity - dailyDrawdown)) * 100).toFixed(1)
    : "0.0";
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
      data: equityHistory.map(d => d.equity),
      borderColor: dailyDrawdown < 0 ? '#ef4444' : '#06b6d4',
      backgroundColor: dailyDrawdown < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(6,182,212,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 2
    }]
  };

  const getActionDetails = (action: number = 2, priority = false, conf = 50) => {
    const labels = ["STRONG BUY", "BUY", "HOLD", "NEUTRAL", "SELL"];
    const colors = [
      "text-green-300 bg-green-900/40",
      "text-green-400 bg-green-900/30",
      "text-yellow-400 bg-yellow-900/20",
      "text-gray-400 bg-gray-800/30",
      "text-red-400 bg-red-900/30"
    ];
    return { label: labels[action], color: colors[action], conf, priority };
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <header className="border-b border-cyan-900/30 bg-black/70 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-7 h-7 text-cyan-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AlphaStream Scalp
            </h1>
            <div className="text-xs opacity-80 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {universeSize}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded hover:bg-gray-800">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={forceScan}
              disabled={scanning}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 rounded font-medium text-sm flex items-center gap-1.5"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {scanning ? "Scanning" : "Scan"}
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="bg-cyan-900/70 py-2 text-center text-cyan-200 font-medium">
          {message}
        </div>
      )}

      {/* Watch Checklist */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-cyan-700 rounded-xl p-4">
          <h2 className="text-lg font-bold mb-3 text-cyan-300 flex items-center gap-2">
            <Activity className="w-5 h-5 animate-pulse" />
            Quick Watch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className={`p-4 rounded border ${mlConnected ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Zap className={`w-5 h-5 ${mlConnected ? 'text-green-400 animate-pulse' : 'text-red-400'}`} />
                <span>ML Brain</span>
              </div>
              <div className={`text-xl font-bold ${mlConnected ? 'text-green-400' : 'text-red-400'}`}>
                {mlConnected ? 'ONLINE' : 'OFFLINE'}
              </div>
            </div>

            <div className={`p-4 rounded border ${lossLimitHit ? 'border-red-600 bg-red-900/20' : 'border-green-600 bg-green-900/20'}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`w-5 h-5 ${lossLimitHit ? 'text-red-400' : 'text-green-400'}`} />
                <span>Daily Safety</span>
              </div>
              <div className={`text-xl font-bold ${lossLimitHit ? 'text-red-400' : 'text-green-400'}`}>
                {lossLimitHit ? 'LIMIT HIT' : 'SAFE'}
              </div>
              <div className="text-xs text-gray-400">DD: {dailyDrawdownPct}%</div>
            </div>

            <div className="p-4 rounded border border-cyan-600 bg-cyan-900/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span>Market Time</span>
              </div>
              <div className="text-xl font-bold text-cyan-300">
                {new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: '2-digit', minute: '2-digit' })} ET
              </div>
              <div className="text-xs text-gray-400">
                {isAfterHours ? 'After-hours (queue)' : etHour >= 9 && etHour < 16 ? 'Regular trading' : 'Premarket'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* After-Hours Queue */}
      {afterHoursQueue.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 my-4">
          <div className="bg-purple-900/30 border border-purple-600 rounded-xl p-4">
            <h2 className="text-lg font-bold mb-3 text-purple-300 flex items-center gap-2">
              <Package className="w-5 h-5" />
              After-Hours Queue ({afterHoursQueue.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {afterHoursQueue.map((r: Rocket, i: number) => (
                <div key={i} className="bg-purple-800/50 rounded p-3 border border-purple-700">
                  <div className="font-bold">{r.symbol}</div>
                  <div>Gap: +{r.gap}% | Conf: {r.mlConfidence}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="border-b border-cyan-900/30 bg-gradient-to-r from-black via-cyan-950/10 to-black py-3">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-400" />
              <span>Equity: <span className="font-bold text-cyan-400">${equity.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span>BP: <span className="font-bold text-green-400">${buyingPower.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
            </div>
            <div className={`flex items-center gap-2 ${lossLimitHit ? 'text-red-400' : ''}`}>
              <AlertTriangle className="w-5 h-5" />
              <span>DD: <span className="font-bold">{dailyDrawdownPct}%</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${mlConnected ? 'text-green-400 animate-pulse' : 'text-gray-600'}`} />
              <span className={`font-bold ${mlConnected ? 'text-green-400' : 'text-red-400'}`}>
                {mlConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="text-gray-500">Update: {lastUpdate} ET</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Equity Chart */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-cyan-900/30 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-cyan-300">
            <TrendingUp className="w-5 h-5" />
            Equity Curve
          </h2>
          <div className="h-64">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-500">Loading...</div>}>
              <Line data={equityChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { grid: { color: '#1f2937' } }, y: { grid: { color: '#1f2937' } } }
              }} />
            </Suspense>
          </div>
        </div>

        {/* Positions */}
        <div className="bg-gray-900/50 border border-cyan-900/30 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3 text-cyan-300">
            Positions ({positions.length}/6)
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto text-sm">
            {positions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No positions</p>
            ) : (
              positions.map((pos: any, i: number) => (
                <div key={i} className="bg-gray-800/50 rounded p-3 border border-gray-700">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-bold">{pos.symbol}</div>
                      <div className="text-xs text-gray-400">{pos.qty} @ ${Number(pos.avg_entry_price).toFixed(2)}</div>
                    </div>
                    <div className="text-green-400 font-bold">
                      ${(pos.qty * pos.avg_entry_price).toFixed(0)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rockets */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-cyan-900/30 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center justify-between text-cyan-300">
            <span>Hot Rockets ({rockets.length})</span>
            {rockets.length > 0 && <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto text-xs">
            {rockets.length === 0 ? (
              <p className="col-span-2 text-gray-500 text-center py-10">Waiting for spike...</p>
            ) : (
              rockets.map((rocket: Rocket, i: number) => {
                const action = getActionDetails(rocket.mlAction, rocket.mlPriority, rocket.mlConfidence);
                const flashing = flashRockets.has(rocket.symbol);
                return (
                  <div
                    key={i}
                    className={`p-4 rounded border transition-all ${flashing ? 'border-yellow-400 bg-yellow-900/30 scale-105' : 'border-gray-700 bg-gray-800/50'}`}
                  >
                    <div className="flex justify-between mb-2">
                      <div className="font-bold text-lg">{rocket.symbol}</div>
                      <div className={`px-3 py-1 rounded font-bold ${action.color}`}>
                        {action.label}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>Price: <span className="font-medium">${Number(rocket.price).toFixed(2)}</span></div>
                      <div>Gap: <span className="font-medium text-green-400">+{rocket.gap}%</span></div>
                      {rocket.rvol && <div>RVOL: <span className="font-medium">{rocket.rvol}x</span></div>}
                      <div>Conf: <span className="font-medium text-yellow-400">{rocket.mlConfidence}%</span></div>
                    </div>
                    {rocket.mlPriority && (
                      <div className="mt-2 text-yellow-400 font-bold text-center">⚡ PRIORITY ⚡</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Trade Log */}
        <div className="bg-gray-900/50 border border-cyan-900/30 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3 text-cyan-300">Trade Log</h2>
          <div className="text-xs space-y-1 max-h-80 overflow-y-auto font-mono bg-black/30 rounded p-3">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No activity</p>
            ) : (
              logs.map((log: any, i: number) => (
                <div key={i} className="py-1 border-b border-gray-800 last:border-0">
                  <span className="text-gray-500">{log.time}</span> <span className="text-gray-300">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
              }
