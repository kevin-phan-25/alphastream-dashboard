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
  ChevronRight
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

  // Add Ticker Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [addingTickers, setAddingTickers] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  // Universe Controls
  const [showUniverse, setShowUniverse] = useState(false);
  const [universeSearch, setUniverseSearch] = useState('');
  const [universeSort, setUniverseSort] = useState<'az' | 'za' | 'newest'>('az');

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
      setAddMessage(`Success: ${response.data.message || 'Added'}`);
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
  const afterHoursQueue = Array.isArray(core.afterHoursQueue) ? core.afterHoursQueue : [];
  const positions = Array.isArray(core.positions) ? core.positions : [];
  const rockets = liveRockets.length > 0 ? liveRockets : (Array.isArray(core.rockets) ? core.rockets : []);
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog.slice().reverse() : [];

  const rawUniverse: string[] = Array.isArray(core.universeSymbols) 
    ? core.universeSymbols 
    : universeSize > 0 
      ? ['Universe loading...'] 
      : [];

  const filteredUniverse = rawUniverse.filter((sym: string) => 
    sym.toLowerCase().includes(universeSearch.toLowerCase())
  );

  const sortedUniverse = [...filteredUniverse].sort((a: string, b: string) => {
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
    <div className="min-h-screen bg-black text-gray-100 overflow-hidden relative">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-purple-900/10 to-black"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff0a_1px,transparent_1px),linear-gradient(to_bottom,#00ffff0a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-cyan-400 animate-pulse" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                AlphaStream
              </h1>
            </div>
            <button
              onClick={() => setShowUniverse(!showUniverse)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-900/40 border border-cyan-700/50 hover:bg-cyan-800/50 transition"
            >
              <Globe className="w-4 h-4" />
              <span className="font-mono text-sm">{universeSize}</span>
              {showUniverse ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-3 rounded-lg bg-purple-900/40 border border-purple-700/50 hover:bg-purple-800/50 transition"
            >
              <Plus className="w-5 h-5 text-purple-400" />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 transition">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-400" />}
            </button>
            <button
              onClick={forceScan}
              disabled={scanning}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
            >
              {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              SCAN
            </button>
          </div>
        </div>
      </header>

      {/* Message Bar */}
      {message && (
        <div className="bg-gradient-to-r from-cyan-900/80 to-purple-900/80 py-3 text-center font-bold tracking-wider animate-pulse">
          {message}
        </div>
      )}

      {/* Add Ticker Form */}
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
              <input
                type="password"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                placeholder="Admin secret"
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

      {/* Collapsible Universe */}
      {showUniverse && (
        <div className="px-4 py-4">
          <div className="max-w-2xl mx-auto bg-gray-900/90 border border-cyan-500/40 rounded-xl p-5 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-400">Universe ({universeSize})</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    value={universeSearch}
                    onChange={(e) => setUniverseSearch(e.target.value)}
                    placeholder="Search symbols..."
                    className="pl-10 pr-4 py-2 bg-black/70 border border-gray-700 rounded-lg text-sm focus:border-cyan-400 focus:outline-none transition"
                  />
                </div>
                <button
                  onClick={() => setUniverseSort(universeSort === 'az' ? 'za' : 'az')}
                  className="p-2 rounded-lg bg-gray-800/70 hover:bg-gray-700 transition"
                >
                  {universeSort === 'az' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto font-mono text-xs grid grid-cols-4 gap-2">
              {sortedUniverse.length === 0 ? (
                <p className="col-span-4 text-center text-gray-500 py-8">No symbols match</p>
              ) : (
                sortedUniverse.map((sym, i) => (
                  <div key={i} className="bg-gray-800/50 rounded px-3 py-2 border border-gray-700/50">
                    {sym}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Status */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border ${mlConnected ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50 bg-red-900/20'} backdrop-blur-sm`}>
            <Zap className={`w-8 h-8 mx-auto mb-2 ${mlConnected ? 'text-green-400' : 'text-red-400'}`} />
            <div className="text-center font-bold text-sm">ML {mlConnected ? 'ONLINE' : 'OFFLINE'}</div>
          </div>
          <div className={`p-4 rounded-xl border ${lossLimitHit ? 'border-red-500/50 bg-red-900/20' : 'border-green-500/50 bg-green-900/20'} backdrop-blur-sm`}>
            <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${lossLimitHit ? 'text-red-400' : 'text-green-400'}`} />
            <div className="text-center font-bold text-sm">{lossLimitHit ? 'LIMIT HIT' : 'SAFE'}</div>
            <div className="text-center text-xs opacity-70">{dailyDrawdownPct}%</div>
          </div>
          <div className="p-4 rounded-xl border border-cyan-500/50 bg-cyan-900/20 backdrop-blur-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
            <div className="text-center font-bold text-sm">
              {new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: '2-digit', minute: '2-digit' })} ET
            </div>
          </div>
        </div>
      </div>

      {/* Equity & Buying Power Bar */}
      <div className="px-4 py-3 border-y border-cyan-900/30 bg-gradient-to-r from-black via-cyan-950/20 to-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-cyan-400" />
              <div>
                <div className="text-xs opacity-70">Equity</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  ${equity.toFixed(0)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-400" />
              <div>
                <div className="text-xs opacity-70">Buying Power</div>
                <div className="text-2xl font-bold text-green-400">
                  ${buyingPower.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs opacity-70 flex items-center gap-2">
            <Zap className={`w-4 h-4 ${mlConnected ? 'text-green-400' : 'text-gray-600'}`} />
            {mlConnected ? 'CONNECTED' : 'DISCONNECTED'} • {lastUpdate.split(' ')[0]}
          </div>
        </div>
      </div>

      {/* Equity Chart */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-cyan-500/40 rounded-xl p-5 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
          <h2 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" /> Equity Flow
          </h2>
          <div className="h-40">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-cyan-500">Loading...</div>}>
              <Line data={equityChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } },
                elements: { point: { radius: 0 } }
              }} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-4 space-y-4 pb-24">

        {/* Positions */}
        <div className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-cyan-500/40 rounded-xl p-5 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
          <h2 className="text-lg font-bold text-cyan-300 mb-4">Active Positions ({positions.length})</h2>
          <div className="space-y-3">
            {positions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No active positions</p>
            ) : (
              positions.map((pos: any, i: number) => (
                <div key={i} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-lg">{pos.symbol}</div>
                    <div className="text-right">
                      <div className="text-sm opacity-70">{pos.qty} shares</div>
                      <div className="text-green-400 font-mono">@ ${Number(pos.avg_entry_price).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rockets */}
        <div className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-cyan-500/40 rounded-xl p-5 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400 animate-pulse" /> Hot Rockets ({rockets.length})
            </h2>
            {rockets.length > 0 && <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />}
          </div>
          <div className="space-y-3">
            {rockets.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 mx-auto mb-4 opacity-30 text-yellow-400" />
                <p className="text-gray-400">Scanning for momentum...</p>
              </div>
            ) : (
              rockets.map((rocket: Rocket, i: number) => {
                const action = getActionDetails(rocket.mlAction);
                const flashing = flashRockets.has(rocket.symbol);
                const isExpanded = expandedRocket === rocket.symbol;
                const chartData = rocketCharts[rocket.symbol];

                return (
                  <div
                    key={i}
                    className={`rounded-xl border transition-all duration-300 ${
                      flashing 
                        ? 'border-yellow-400 bg-yellow-900/30 shadow-2xl shadow-yellow-500/30' 
                        : 'border-cyan-700/50 bg-gray-800/40'
                    } backdrop-blur-sm overflow-hidden`}
                  >
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-800/60 transition"
                      onClick={() => toggleRocketChart(rocket.symbol)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-2xl font-bold text-cyan-400">{rocket.symbol}</div>
                          <div className="text-sm opacity-80 mt-1">
                            ${Number(rocket.price).toFixed(2)} • +{rocket.gap}% • Conf: {rocket.mlConfidence}%
                            {rocket.mlPriority && <span className="ml-2 text-yellow-400 font-bold">⚡ PRIORITY</span>}
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-bold text-xs ${action.color}`}>
                          {action.label}
                        </div>
                      </div>
                    </div>
                    {isExpanded && chartData && (
                      <div className="h-32 border-t border-cyan-700/50 bg-black/50">
                        <Line data={chartData} options={{
                          responsive: true,
                          maintainAspectRatio: false,
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

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-cyan-500/40 rounded-xl p-5 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
          <h2 className="text-lg font-bold text-cyan-300 mb-4">Recent Activity</h2>
          <div className="font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No recent activity</p>
            ) : (
              logs.slice(0, 15).map((log: any, i: number) => (
                <div key={i} className="opacity-80 hover:opacity-100 transition">
                  <span className="text-cyan-500">{log.time}</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
