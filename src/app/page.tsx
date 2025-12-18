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
  Plus
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

  // Add Ticker Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [addingTickers, setAddingTickers] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
  const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;

  const fetchData = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 20000 });
      const data = res.data || {};
      const equityValue = Number(data.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setCore(data);
      setEquityHistory(prev => [...prev, { time, equity: equityValue }].slice(-30));
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

  // Robust Scan Button (POST first, fallback GET)
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
      try {
        await axios.get(`${CORE_URL}/scan`, { timeout: 30000 });
        setMessage("Scan triggered (fallback)");
        setTimeout(() => fetchData(), 1000);
        setTimeout(() => setMessage(""), 3000);
      } catch {
        setMessage("Scan failed");
        setTimeout(() => setMessage(""), 3000);
      }
    } finally {
      setScanning(false);
    }
  };

  // Manual Add Tickers
  const handleAddTickers = async () => {
    if (!tickerInput.trim() || !secretInput.trim()) {
      setAddMessage("Please fill both fields");
      return;
    }
    setAddingTickers(true);
    setAddMessage('');
    try {
      const response = await axios.post(
        `${CORE_URL}/admin/add-ticker`,
        {
          secret: secretInput.trim(),
          symbols: tickerInput.trim().toUpperCase()
        },
        { timeout: 10000 }
      );
      setAddMessage(`Success: ${response.data.message || 'Tickers added'}`);
      setTickerInput('');
      setSecretInput('');
      fetchData();
    } catch (err: any) {
      setAddMessage(`Error: ${err.response?.data?.error || err.message || 'Failed'}`);
    } finally {
      setAddingTickers(false);
      setTimeout(() => setAddMessage(''), 6000);
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
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'} pb-20`}>
      {/* Compact Header with + Button */}
      <header className="border-b border-cyan-900/30 bg-black/80 backdrop-blur sticky top-0 z-50">
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
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-1.5 rounded hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
            </button>
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

      {/* Manual Add Ticker Form */}
      {showAddForm && (
        <div className="px-3 py-3">
          <div className="bg-gray-900/80 border border-cyan-800 rounded-lg p-4">
            <h3 className="text-sm font-bold text-cyan-400 mb-3">Add Tickers Manually</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                placeholder="GME AMC NVDA..."
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-sm"
              />
              <input
                type="password"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                placeholder="Admin secret"
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-sm"
              />
              <button
                onClick={handleAddTickers}
                disabled={addingTickers}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 rounded flex items-center justify-center gap-2 text-sm"
              >
                {addingTickers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
              {addMessage && (
                <p className={`text-xs text-center ${addMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {addMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact Quick Watch */}
      <div className="px-3 py-2">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className={`p-2 rounded border text-center ${mlConnected ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'}`}>
            <Zap className={`w-4 h-4 mx-auto mb-1 ${mlConnected ? 'text-green-400' : 'text-red-400'}`} />
            <div className="font-bold text-[10px]">{mlConnected ? 'ML ON' : 'ML OFF'}</div>
          </div>
          <div className={`p-2 rounded border text-center ${lossLimitHit ? 'border-red-600 bg-red-900/20' : 'border-green-600 bg-green-900/20'}`}>
            <AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${lossLimitHit ? 'text-red-400' : 'text-green-400'}`} />
            <div className="font-bold text-[10px]">{lossLimitHit ? 'LIMIT' : 'SAFE'}</div>
            <div className="text-[9px] opacity-70">{dailyDrawdownPct}%</div>
          </div>
          <div className="p-2 rounded border border-cyan-600 bg-cyan-900/20 text-center">
            <Clock className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
            <div className="font-bold text-[10px]">
              {new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: '2-digit', minute: '2-digit' })} ET
            </div>
          </div>
        </div>
      </div>

      {/* Compact Status Bar */}
      <div className="px-3 py-1.5 border-b border-cyan-900/30 bg-gradient-to-r from-black via-cyan-950/10 to-black text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">${equity.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="font-bold">${buyingPower.toFixed(0)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] opacity-70">
            <Zap className={`w-3 h-3 ${mlConnected ? 'text-green-400' : 'text-gray-600'}`} />
            {mlConnected ? 'ON' : 'OFF'} • {lastUpdate.split(' ')[0]}
          </div>
        </div>
      </div>

      {/* Compact Equity Chart */}
      <div className="px-3 py-3">
        <div className="bg-gray-900/50 border border-cyan-900/30 rounded-lg p-3">
          <h2 className="text-xs font-semibold text-cyan-300 mb-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> Equity
          </h2>
          <div className="h-32">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-500 text-xs">Loading...</div>}>
              <Line data={equityChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } }
              }} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Main Grid - Mobile Stacked */}
      <div className="px-3 space-y-3 pb-4">
        {/* Positions */}
        <div className="bg-gray-900/50 border border-cyan-900/30 rounded-lg p-3">
          <h2 className="text-xs font-semibold text-cyan-300 mb-2">Positions ({positions.length})</h2>
          <div className="max-h-32 overflow-y-auto text-xs space-y-1.5">
            {positions.length === 0 ? (
              <p className="text-gray-500 text-center text-[10px] py-4">No positions</p>
            ) : (
              positions.map((pos: any, i: number) => (
                <div key={i} className="bg-gray-800/50 rounded p-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="font-bold">{pos.symbol}</span>
                    <span className="text-green-400">{pos.qty} @ ${Number(pos.avg_entry_price).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rockets */}
        <div className="bg-gray-900/50 border border-cyan-900/30 rounded-lg p-3">
          <h2 className="text-xs font-semibold text-cyan-300 mb-2 flex items-center justify-between">
            <span>Hot Rockets ({rockets.length})</span>
            {rockets.length > 0 && <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />}
          </h2>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {rockets.length === 0 ? (
              <p className="text-gray-500 text-center text-[11px] py-6">Waiting for spike...</p>
            ) : (
              rockets.map((rocket: Rocket, i: number) => {
                const action = getActionDetails(rocket.mlAction);
                const flashing = flashRockets.has(rocket.symbol);
                const isExpanded = expandedRocket === rocket.symbol;
                const chartData = rocketCharts[rocket.symbol];

                return (
                  <div
                    key={i}
                    className={`rounded border text-xs p-2 transition-all ${
                      flashing ? 'border-yellow-400 bg-yellow-900/30' : 'border-gray-700 bg-gray-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-start cursor-pointer" onClick={() => toggleRocketChart(rocket.symbol)}>
                      <div>
                        <div className="font-bold text-sm">{rocket.symbol}</div>
                        <div className="text-[10px] opacity-80">
                          ${Number(rocket.price).toFixed(2)} • +{rocket.gap}% • Conf: {rocket.mlConfidence}%
                          {rocket.mlPriority && <span className="text-yellow-400 ml-1">⚡</span>}
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${action.color}`}>
                        {action.label}
                      </div>
                    </div>
                    {isExpanded && chartData && (
                      <div className="mt-2 h-24 border-t border-gray-700 pt-2">
                        <Line data={chartData} options={{
                          responsive: true,
                          plugins: { legend: { display: false }, tooltip: { enabled: false } },
                          scales: { x: { display: false }, y: { display: false } }
                        }} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Trade Log */}
        <div className="bg-gray-900/50 border border-cyan-900/30 rounded-lg p-3">
          <h2 className="text-xs font-semibold text-cyan-300 mb-2">Recent Activity</h2>
          <div className="max-h-32 overflow-y-auto text-[10px] font-mono space-y-1">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No activity</p>
            ) : (
              logs.slice(0, 10).map((log: any, i: number) => (
                <div key={i} className="opacity-80">
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
