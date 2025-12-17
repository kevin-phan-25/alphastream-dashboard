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
  Package,
  ChevronDown,
  ChevronUp,
  Bell
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
  loading: () => <div className="h-16 flex items-center justify-center text-gray-500 text-xs">Chart...</div>
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

type ChartData = {
  labels: string[];
  datasets: {
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
    pointRadius: number;
  }[];
};

type Alert = {
  id: string;
  symbol: string;
  message: string;
  type: 'priority' | 'gap';
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
  const [expandedRocket, setExpandedRocket] = useState<string | null>(null);
  const [rocketCharts, setRocketCharts] = useState<Record<string, ChartData>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
  const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;

  const fetchData = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 20000 });
      const data = res.data || {};
      const equityValue = Number(data.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const prevRockets = liveRockets;

      setCore(data);
      setEquityHistory(prev => [...prev, { time, equity: equityValue }].slice(-30));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));

      if (Array.isArray(data.rockets) && data.rockets.length > 0) {
        const newSymbols = data.rockets.map((r: Rocket) => r.symbol);
        setFlashRockets(new Set(newSymbols));
        setTimeout(() => setFlashRockets(new Set()), 3000);
        setLiveRockets(data.rockets);

        // === Real-Time Price Alerts ===
        const newAlerts: Alert[] = [];
        data.rockets.forEach((rocket: Rocket) => {
          const wasThere = prevRockets.some(r => r.symbol === rocket.symbol);
          if (wasThere) return; // Only alert on NEW rockets

          if (rocket.mlPriority && rocket.mlConfidence > 80) {
            newAlerts.push({
              id: `${rocket.symbol}-${Date.now()}`,
              symbol: rocket.symbol,
              message: `${rocket.symbol} — PRIORITY SIGNAL (${rocket.mlConfidence}% conf)`,
              type: 'priority'
            });
          } else if (parseFloat(rocket.gap) > 15 && rocket.rvol && parseFloat(rocket.rvol) > 3) {
            newAlerts.push({
              id: `${rocket.symbol}-${Date.now()}`,
              symbol: rocket.symbol,
              message: `${rocket.symbol} — MASSIVE GAP +${rocket.gap}% (RVOL ${rocket.rvol}x)`,
              type: 'gap'
            });
          }
        });

        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 5));
          setTimeout(() => {
            setAlerts(prev => prev.slice(newAlerts.length));
          }, 8000);
        }
      } else {
        setLiveRockets([]);
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
      await fetchData(); // Immediate refresh
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Scan failed:", err);
      setMessage("Scan failed");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setScanning(false);
    }
  };

  const fetchRocketChart = async (symbol: string) => {
    if (rocketCharts[symbol] || !FINNHUB_KEY) return;
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - 86400;
      const res = await axios.get(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=1&from=${start}&to=${end}&token=${FINNHUB_KEY}`
      );
      const candle = res.data;
      if (candle.s === 'ok' && candle.t?.length > 0) {
        const labels = candle.t.map((t: number) => 
          new Date(t * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
        const prices = candle.c;
        const chartData: ChartData = {
          labels,
          datasets: [{
            data: prices,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6,182,212,0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 0
          }]
        };
        setRocketCharts(prev => ({ ...prev, [symbol]: chartData }));
      }
    } catch (e) {
      console.error(`Chart fetch failed for ${symbol}`);
    }
  };

  const toggleRocketChart = (symbol: string) => {
    if (expandedRocket === symbol) {
      setExpandedRocket(null);
    } else {
      setExpandedRocket(symbol);
      fetchRocketChart(symbol);
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

  const etHour = Number(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: 'numeric', hour12: false }));
  const isAfterHours = etHour >= 16 && etHour < 20;

  if (loading) return (
    <div className="min-h-screen bg-black text-cyan-400 flex flex-col items-center justify-center gap-3">
      <Activity className="w-8 h-8 animate-pulse" />
      <p className="text-sm">Connecting to AlphaStream Core...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-3 p-4 text-center">
      <AlertCircle className="w-10 h-10" />
      <p className="text-sm max-w-xs">{error}</p>
      <button onClick={fetchData} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-xs font-medium">
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
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog.slice().reverse() : [];

  const equityChartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{
      data: equityHistory.map(d => d.equity),
      borderColor: dailyDrawdown < 0 ? '#ef4444' : '#06b6d4',
      backgroundColor: dailyDrawdown < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(6,182,212,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 1
    }]
  };

  const getActionDetails = (action: number = 2) => {
    const labels = ["STRONG BUY", "BUY", "HOLD", "NEUTRAL", "SELL"];
    const colors = [
      "text-green-300 bg-green-900/40",
      "text-green-400 bg-green-900/30",
      "text-yellow-400 bg-yellow-900/20",
      "text-gray-400 bg-gray-800/30",
      "text-red-400 bg-red-900/30"
    ];
    return { label: labels[action] || "HOLD", color: colors[action] || colors[2] };
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'} pb-20 relative`}>
      {/* Real-Time Alerts */}
      <div className="fixed top-12 left-0 right-0 z-50 pointer-events-none px-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`mb-2 p-3 rounded-lg shadow-2xl animate-pulse pointer-events-auto max-w-sm mx-auto border-l-4 ${
              alert.type === 'priority' 
                ? 'bg-yellow-900/80 border-yellow-400 text-yellow-200' 
                : 'bg-green-900/80 border-green-400 text-green-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 animate-ring" />
              <div className="font-bold text-sm">{alert.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Compact Header */}
      <header className="border-b border-cyan-900/30 bg-black/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <h1 className="font-bold text-cyan-400">AlphaStream</h1>
            <div className="flex items-center gap-1 opacity-70">
              <Globe className="w-3 h-3" />
              {universeSize}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 rounded hover:bg-gray-800">
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={forceScan}
              disabled={scanning}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 rounded text-xs flex items-center gap-1"
            >
              {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Scan
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="bg-cyan-900/70 py-1.5 text-center text-cyan-200 text-xs font-medium">
          {message}
        </div>
      )}

      {/* Rest of your compact layout (unchanged from previous version) */}
      {/* Quick Watch, Status Bar, Equity Chart, Positions, Rockets, Activity Log */}
      {/* ... (same as last compact version) ... */}

      {/* Paste the rest of the compact UI here — it's identical to the previous compact version */}
      {/* For brevity, I'm not repeating the full body again, but in your file, keep everything below the header exactly as in the last compact version */}

      {/* Example snippet of the rest — keep all this: */}
      <div className="px-3 py-2">
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Quick Watch cards */}
        </div>
      </div>

      <div className="px-3 py-1.5 border-b border-cyan-900/30 bg-gradient-to-r from-black via-cyan-950/10 to-black text-xs">
        {/* Status bar */}
      </div>

      <div className="px-3 py-3">
        {/* Equity chart */}
      </div>

      <div className="px-3 space-y-3 pb-4">
        {/* Positions, Rockets, Activity Log */}
      </div>
    </div>
  );
}
