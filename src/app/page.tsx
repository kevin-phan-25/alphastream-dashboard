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
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Minus
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
  loading: () => <div className="h-16 flex items-center justify-center text-cyan-500 text-xs animate-pulse">Loading Chart...</div>
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

  // Add Ticker Form — NO PASSWORD ANYMORE
  const [showAddForm, setShowAddForm] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [addingTickers, setAddingTickers] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  // Remove Ticker Form — NO PASSWORD ANYMORE
  const [showRemoveForm, setShowRemoveForm] = useState(false);
  const [removeTickerInput, setRemoveTickerInput] = useState('');
  const [removingTickers, setRemovingTickers] = useState(false);
  const [removeMessage, setRemoveMessage] = useState('');

  // Universe Controls
  const [showUniverse, setShowUniverse] = useState(false);
  const [universeSearch, setUniverseSearch] = useState('');
  const [universeSort, setUniverseSort] = useState<'az' | 'za'>('az');

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
  const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;

  const fetchData = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 20000 });
      const data = res.data || {};
      const equityValue = Number(data.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore(data);
      setEquityHistory(prev => {
        const updated = [...prev, { time, equity: equityValue }].slice(-30);
        return updated;
      });
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));

      if (Array.isArray(data.rockets) && data.rockets.length > 0) {
        const newSymbols = data.rockets.map((r: Rocket) => r.symbol);
        setFlashRockets(new Set(newSymbols));
        setTimeout(() => setFlashRockets(new Set()), 3000);
        setLiveRockets(data.rockets);
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
      setTimeout(() => fetchData(), 1000);
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Scan failed");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setScanning(false);
    }
  };

  // Updated: No secret required
  const handleAddTickers = async () => {
    if (!tickerInput.trim()) {
      setAddMessage("Please enter tickers");
      return;
    }
    setAddingTickers(true);
    setAddMessage('');
    try {
      const response = await axios.post(
        `${CORE_URL}/admin/add-ticker`,
        { symbols: tickerInput.trim().toUpperCase() },
        { timeout: 10000 }
      );
      setAddMessage(`Success: ${response.data.message || 'Added'}`);
      setTickerInput('');
      fetchData();
    } catch (err: any) {
      setAddMessage(`Error: ${err.response?.data?.error || err.message || 'Failed'}`);
    } finally {
      setAddingTickers(false);
      setTimeout(() => setAddMessage(''), 6000);
    }
  };

  // Updated: No secret required
  const handleRemoveTickers = async () => {
    if (!removeTickerInput.trim()) {
      setRemoveMessage("Please enter tickers");
      return;
    }
    setRemovingTickers(true);
    setRemoveMessage('');
    try {
      const response = await axios.post(
        `${CORE_URL}/admin/remove-ticker`,
        { symbols: removeTickerInput.trim().toUpperCase() },
        { timeout: 10000 }
      );
      setRemoveMessage(`Success: ${response.data.message || 'Removed'}`);
      setRemoveTickerInput('');
      fetchData();
    } catch (err: any) {
      setRemoveMessage(`Error: ${err.response?.data?.error || err.message || 'Failed'}`);
    } finally {
      setRemovingTickers(false);
      setTimeout(() => setRemoveMessage(''), 6000);
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
            borderColor: '#00ffff',
            backgroundColor: 'rgba(0, 255, 255, 0.1)',
            fill: true,
            tension: 0.4,
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

  // Fixed dark/light mode toggle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
      document.body.style.backgroundColor = darkMode ? '#000000' : '#f3f4f6';
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
    <div className="min-h-screen bg-black text-cyan-400 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <Activity className="w-12 h-12 animate-pulse" />
        <div className="absolute inset-0 animate-ping rounded-full border-4 border-cyan-500 opacity-20"></div>
      </div>
      <p className="text-sm font-medium tracking-wider">INITIALIZING ALPHASTREAM CORE...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="relative">
        <AlertCircle className="w-16 h-16" />
        <div className="absolute inset-0 animate-ping rounded-full border-4 border-red-500 opacity-30"></div>
      </div>
      <p className="text-sm max-w-xs font-medium tracking-wide">{error}</p>
      <button onClick={fetchData} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-bold tracking-wider transition">
        RECONNECT
      </button>
    </div>
  );

  const equity = Number(core.equity || 0);
  const buyingPower = Number(core.buyingPower || 0);
  const dailyDrawdown = Number(core.dailyDrawdown || 0);
  const dailyDrawdownPct = dailyDrawdown !== 0
    ? ((Math.abs(dailyDrawdown) / (equity - dailyDrawdown)) * 100).toFixed(1)
    : "0.0";
  const lossLimitHit = Math.abs(dailyDrawdown) >= 1500;
  const mlConnected = core.mlHealthy === true;
  const universeSize = core.universeSize || 0;
  const positions = Array.isArray(core.positions) ? core.positions : [];
  const rockets = liveRockets.length > 0 ? liveRockets : (Array.isArray(core.rockets) ? core.rockets : []);
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog.slice().reverse() : [];

  const rawUniverse: string[] = Array.isArray(core.universeSymbols) ? core.universeSymbols : [];

  const filteredUniverse = rawUniverse.filter(sym => 
    sym.toLowerCase().includes(universeSearch.toLowerCase())
  );

  const sortedUniverse = [...filteredUniverse].sort((a, b) => {
    if (universeSort === 'az') return a.localeCompare(b);
    if (universeSort === 'za') return b.localeCompare(a);
    return 0;
  });

  const equityChartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{
      data: equityHistory.map(d => d.equity),
      borderColor: dailyDrawdown < 0 ? '#ff0080' : '#00ffff',
      backgroundColor: dailyDrawdown < 0 ? 'rgba(255, 0, 128, 0.1)' : 'rgba(0, 255, 255, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2
    }]
  };

  const getActionDetails = (action: number = 2) => {
    const labels = ["STRONG BUY", "BUY", "HOLD", "NEUTRAL", "SELL"];
    const colors = [
      "text-green-300 bg-green-900/60 border border-green-600",
      "text-cyan-300 bg-cyan-900/50 border border-cyan-600",
      "text-yellow-300 bg-yellow-900/40 border border-yellow-600",
      "text-gray-400 bg-gray-800/50 border border-gray-600",
      "text-red-400 bg-red-900/50 border border-red-600"
    ];
    return { label: labels[action] || "HOLD", color: colors[action] || colors[2] };
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-100' : 'bg-gray-100 text-gray-900'} overflow-hidden relative transition-colors duration-500`}>
      {/* ... rest of JSX unchanged ... */}
      {/* Add Ticker Form — REMOVED PASSWORD FIELD */}
      {showAddForm && (
        <div className="px-4 py-4">
          <div className="max-w-md mx-auto bg-gradient-to-br from-gray-900/90 to-black/90 border border-cyan-500/50 rounded-xl p-6 backdrop-blur-xl shadow-2xl shadow-cyan-500/20">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add Tickers to Universe
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                placeholder="GME AMC NVDA..."
                className="w-full px-4 py-3 bg-black/70 border border-cyan-700/50 rounded-lg focus:border-cyan-400 focus:outline-none transition"
              />
              <button
                onClick={handleAddTickers}
                disabled={addingTickers}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-60 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {addingTickers ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Add Tickers
              </button>
              {addMessage && (
                <p className={`text-center font-medium ${addMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {addMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remove Ticker Form — REMOVED PASSWORD FIELD */}
      {showRemoveForm && (
        <div className="px-4 py-4">
          <div className="max-w-md mx-auto bg-gradient-to-br from-gray-900/90 to-black/90 border border-red-500/50 rounded-xl p-6 backdrop-blur-xl shadow-2xl shadow-red-500/20">
            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
              <Minus className="w-5 h-5" /> Remove Tickers from Universe
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={removeTickerInput}
                onChange={(e) => setRemoveTickerInput(e.target.value)}
                placeholder="CEI XELA..."
                className="w-full px-4 py-3 bg-black/70 border border-red-700/50 rounded-lg focus:border-red-400 focus:outline-none transition"
              />
              <button
                onClick={handleRemoveTickers}
                disabled={removingTickers}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-60 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {removingTickers ? <Loader2 className="w-5 h-5 animate-spin" /> : <Minus className="w-5 h-5" />}
                Remove Tickers
              </button>
              {removeMessage && (
                <p className={`text-center font-medium ${removeMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {removeMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ... rest of the JSX remains exactly the same ... */}
    </div>
  );
}
