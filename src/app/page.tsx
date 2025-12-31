'use client';

import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import {
  RefreshCw,
  Zap,
  Activity,
  Loader2,
  AlertCircle,
  DollarSign,
  Wallet,
  Globe,
  Bot,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Minus,
  Shield,
  Target,
  BarChart3,
  Brain,
  CheckCircle2,
  XCircle,
  Sparkles,
  Cpu,
  Network,
  Gauge
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, ArcElement);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), {
  ssr: false,
  loading: () => <div className="h-12 flex items-center justify-center text-cyan-400 text-xs animate-pulse">Chart...</div>
});

const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), {
  ssr: false,
  loading: () => <div className="h-32 flex items-center justify-center text-cyan-400 text-xs animate-pulse">...</div>
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

type MLSymbolMetric = {
  symbol: string;
  count: number;
};

export default function Dashboard() {
  const [core, setCore] = useState<any>({});
  const [mlMetrics, setMlMetrics] = useState<any>({});
  const [equityHistory, setEquityHistory] = useState<{ time: string; equity: number }[]>([]);
  const [realizedPnLHistory, setRealizedPnLHistory] = useState<{ time: string; pnl: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [panicClosing, setPanicClosing] = useState(false);
  const [panicMessage, setPanicMessage] = useState("");
  const [liveRockets, setLiveRockets] = useState<Rocket[]>([]);
  const [flashRockets, setFlashRockets] = useState<Set<string>>(new Set());
  const [expandedRocket, setExpandedRocket] = useState<string | null>(null);
  const [rocketCharts, setRocketCharts] = useState<Record<string, ChartData>>({});

  const [showAddForm, setShowAddForm] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [addingTickers, setAddingTickers] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  const [showRemoveForm, setShowRemoveForm] = useState(false);
  const [removeTickerInput, setRemoveTickerInput] = useState('');
  const [removingTickers, setRemovingTickers] = useState(false);
  const [removeMessage, setRemoveMessage] = useState('');

  const [showUniverse, setShowUniverse] = useState(false);
  const [universeSearch, setUniverseSearch] = useState('');

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
  const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "https://alphastream-ml-1017433009054.us-east1.run.app";
  const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;
  const DAILY_LOSS_LIMIT = 1500;

  const fetchCoreData = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 20000 });
      const data = res.data || {};
      const equityValue = Number(data.equity || 0);
      const realizedPnLValue = Number(data.realizedDailyPnL || 0);
      const time = new Date().toLocaleTimeString([], { minute: '2-digit' });

      setCore(data);
      setEquityHistory(prev => [...prev, { time, equity: equityValue }].slice(-30));
      setRealizedPnLHistory(prev => [...prev, { time, pnl: realizedPnLValue }].slice(-30));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: '2-digit', minute: '2-digit', second: '2-digit' }));

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
      setError("Cannot reach AlphaStream Core — retrying...");
    } finally {
      setLoading(false);
    }
  };

  const fetchMLMetrics = async () => {
    try {
      const res = await axios.get(`${ML_URL}/metrics`, { timeout: 10000 });
      setMlMetrics(res.data);
    } catch (e) {
      setMlMetrics({});
    }
  };

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage("Initiating deep scan...");
    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 30000 });
      setMessage("Scan complete!");
      setTimeout(() => fetchCoreData(), 1000);
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Scan failed");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setScanning(false);
    }
  };

  const panicCloseAll = async () => {
    if (panicClosing) return;
    const ok = window.confirm("⚠️ PANIC CLOSE: This will immediately liquidate ALL positions and enable HARD FLAT. Confirm?");
    if (!ok) return;

    setPanicClosing(true);
    setPanicMessage("EXECUTING PANIC CLOSE...");
    try {
      const res = await axios.post(`${CORE_URL}/admin/force-close`, {}, { timeout: 30000 });
      setPanicMessage(res?.data?.message || "PANIC CLOSE EXECUTED");
      setTimeout(() => fetchCoreData(), 1000);
    } catch (err: any) {
      setPanicMessage(`PANIC FAILED: ${err.response?.data?.error || err.message}`);
    } finally {
      setPanicClosing(false);
      setTimeout(() => setPanicMessage(""), 10000);
    }
  };

  const handleAddTickers = async () => {
    const input = tickerInput.trim();
    if (!input) return;

    setAddingTickers(true);
    setAddMessage('');
    try {
      const res = await axios.post(`${CORE_URL}/admin/add-ticker`, { symbols: input.toUpperCase() }, { timeout: 15000 });
      setAddMessage(`✓ ${res.data.message}`);
      setTickerInput('');
      fetchCoreData();
    } catch (err: any) {
      setAddMessage(`✗ ${err.response?.data?.error || 'Failed'}`);
    } finally {
      setAddingTickers(false);
      setTimeout(() => setAddMessage(''), 5000);
    }
  };

  const handleRemoveTickers = async () => {
    if (!removeTickerInput.trim()) return;
    setRemovingTickers(true);
    try {
      const res = await axios.post(`${CORE_URL}/admin/remove-ticker`, { symbols: removeTickerInput.trim().toUpperCase() });
      setRemoveMessage(`✓ ${res.data.message}`);
      setRemoveTickerInput('');
      fetchCoreData();
    } catch (err: any) {
      setRemoveMessage(`✗ ${err.response?.data?.error || 'Failed'}`);
    } finally {
      setRemovingTickers(false);
      setTimeout(() => setRemoveMessage(''), 5000);
    }
  };

  const fetchRocketChart = async (symbol: string) => {
    if (rocketCharts[symbol] || !FINNHUB_KEY) return;
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - 86400;
      const res = await axios.get(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=1&from=${start}&to=${end}&token=${FINNHUB_KEY}`);
      if (res.data.s === 'ok' && res.data.t?.length > 0) {
        const labels = res.data.t.map((t: number) => new Date(t * 1000).toLocaleTimeString([], { minute: '2-digit' }));
        const prices = res.data.c;
        const chartData: ChartData = {
          labels,
          datasets: [{
            data: prices,
            borderColor: '#00ffff',
            backgroundColor: 'rgba(0, 255, 255, 0.15)',
            fill: true,
            tension: 0.5,
            pointRadius: 0,
            borderWidth: 2
          }]
        };
        setRocketCharts(prev => ({ ...prev, [symbol]: chartData }));
      }
    } catch (e) {}
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
    fetchCoreData();
    fetchMLMetrics();
    const interval = setInterval(() => {
      fetchCoreData();
      fetchMLMetrics();
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-cyan-500/30 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-24 h-24 border-t-4 border-cyan-400 rounded-full animate-spin animation-delay-300"></div>
          <Sparkles className="absolute top-8 left-8 w-8 h-8 text-cyan-400 animate-pulse" />
        </div>
        <p className="mt-8 text-cyan-400 text-xl font-light tracking-widest">ALPHASTREAM</p>
        <p className="text-gray-600 text-sm">Initializing neural core...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button onClick={fetchCoreData} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-full font-bold transition">RECONNECT</button>
      </div>
    </div>
  );

  const equity = Number(core.equity || 0);
  const buyingPower = Number(core.buyingPower || 0);
  const dailyDrawdown = Number(core.dailyDrawdown || 0);
  const realizedDailyPnL = Number(core.realizedDailyPnL || 0);
  const dailyDrawdownPct = dailyDrawdown !== 0 ? ((Math.abs(dailyDrawdown) / (equity - dailyDrawdown)) * 100).toFixed(1) : "0.0";
  const lossLimitHit = Math.abs(dailyDrawdown) >= DAILY_LOSS_LIMIT;
  const mlConnected = core.mlHealthy === true;
  const universeSize = core.universeSize || 0;
  const positions = Array.isArray(core.positions) ? core.positions : [];
  const rockets = liveRockets.length > 0 ? liveRockets : (Array.isArray(core.rockets) ? core.rockets : []);
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog.slice().reverse().slice(0, 25) : [];

  const totalExposure = positions.reduce((sum: number, pos: any) => sum + (pos.marketValue || 0), 0);
  const exposurePct = equity > 0 ? ((totalExposure / equity) * 100).toFixed(1) : "0.0";

  const rawUniverse: string[] = Array.isArray(core.universeSymbols) ? core.universeSymbols : [];
  const filteredUniverse = rawUniverse.filter(sym => sym.toLowerCase().includes(universeSearch.toLowerCase()));

  const equityChartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{
      data: equityHistory.map(d => d.equity),
      borderColor: dailyDrawdown < 0 ? '#ff0080' : '#00ffff',
      backgroundColor: 'rgba(0, 255, 255, 0.1)',
      fill: true,
      tension: 0.5,
      pointRadius: 0,
      borderWidth: 2
    }]
  };

  const realizedPnLChartData = {
    labels: realizedPnLHistory.map(d => d.time),
    datasets: [{
      data: realizedPnLHistory.map(d => d.pnl),
      borderColor: realizedDailyPnL >= 0 ? '#00ff88' : '#ff3366',
      backgroundColor: 'rgba(0, 255, 136, 0.1)',
      fill: true,
      tension: 0.5,
      pointRadius: 0,
      borderWidth: 2
    }]
  };

  const getActionDetails = (action: number = 2) => {
    const labels = ["STRONG BUY", "BUY", "HOLD", "NEUTRAL", "SELL"];
    const colors = [
      "text-green-400 bg-green-900/60 border-green-600",
      "text-cyan-400 bg-cyan-900/60 border-cyan-600",
      "text-yellow-400 bg-yellow-900/40 border-yellow-600",
      "text-gray-400 bg-gray-800/60 border-gray-600",
      "text-red-400 bg-red-900/60 border-red-600"
    ];
    return { label: labels[action] || "HOLD", color: colors[action] || colors[2] };
  };

  const topSymbols = (mlMetrics.topSymbols || []).slice(0, 10);

  const exposureDoughnut = {
    labels: ['Exposure', 'Cash'],
    datasets: [{
      data: [parseFloat(exposurePct), 100 - parseFloat(exposurePct)],
      backgroundColor: ['#00ffff', '#1a1a1a'],
      borderColor: ['#00ffff', '#333'],
      borderWidth: 2,
      cutout: '80%'
    }]
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 overflow-x-hidden relative">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-600/10 to-pink-500/20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff0a_1px,transparent_1px),linear-gradient(to_bottom,#00ffff0a_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${15 + Math.random() * 20}s`
          }} />
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/80 border-b border-cyan-500/20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bot className="w-10 h-10 text-cyan-400" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                ALPHASTREAM
              </h1>
              <p className="text-xs text-gray-500 tracking-widest">NEURAL MOMENTUM ENGINE</p>
            </div>
            <div className="ml-8 flex items-center gap-3 px-4 py-2 bg-cyan-900/30 border border-cyan-700/50 rounded-full">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-cyan-300">{universeSize}</span>
              <span className="text-xs text-gray-400">symbols</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowAddForm(!showAddForm)} className="p-3 rounded-full bg-purple-900/50 border border-purple-600/50 hover:bg-purple-800/50 transition">
              <Plus className="w-5 h-5 text-purple-300" />
            </button>
            <button onClick={() => setShowRemoveForm(!showRemoveForm)} className="p-3 rounded-full bg-red-900/50 border border-red-600/50 hover:bg-red-800/50 transition">
              <Minus className="w-5 h-5 text-red-300" />
            </button>

            <button
              onClick={panicCloseAll}
              disabled={panicClosing}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-700 rounded-full font-black text-sm flex items-center gap-3 border-2 border-red-500/50 shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 transition-all"
            >
              {panicClosing ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
              PANIC CLOSE
            </button>

            <button onClick={forceScan} disabled={scanning} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-black text-sm flex items-center gap-3 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all">
              {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              DEEP SCAN
            </button>
          </div>
        </div>
      </header>

      {message && <div className="bg-gradient-to-r from-cyan-600/80 to-purple-600/80 py-3 text-center font-bold animate-pulse">{message}</div>}
      {panicMessage && <div className="bg-gradient-to-r from-red-600/90 to-pink-700/90 py-3 text-center font-black animate-pulse">{panicMessage}</div>}

      {/* Hero Stats Bar */}
      <div className="px-4 py-4 border-y border-cyan-900/30 bg-gradient-to-r from-black via-cyan-950/30 to-black">
        <div className="flex justify-between items-center flex-wrap gap-6">
          <div className="flex gap-8">
            <div className="text-center">
              <Wallet className="w-8 h-8 text-cyan-400 mx-auto mb-1" />
              <p className="text-3xl font-black text-cyan-300">${equity.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Equity</p>
            </div>
            <div className="text-center">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-1" />
              <p className="text-3xl font-black text-green-300">${buyingPower.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Buying Power</p>
            </div>
            <div className="text-center">
              <Target className={`w-8 h-8 mx-auto mb-1 ${realizedDailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              <p className={`text-3xl font-black ${realizedDailyPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {realizedDailyPnL >= 0 ? '+' : ''}${Math.abs(realizedDailyPnL).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Daily PnL</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">{lastUpdate} ET</p>
            <p className="text-xs text-gray-600">Last sync</p>
          </div>
        </div>
      </div>

      {/* Status Orbs */}
      <div className="px-4 py-4 grid grid-cols-4 gap-4">
        <div className={`relative p-6 rounded-2xl border ${mlConnected ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50 bg-red-900/20'} backdrop-blur-xl`}>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 rounded-2xl" />
          <Cpu className={`w-10 h-10 ${mlConnected ? 'text-green-400' : 'text-red-400'} mb-3`} />
          <p className="text-2xl font-black">{mlConnected ? 'NEURAL ACTIVE' : 'ML OFFLINE'}</p>
          <p className="text-xs text-gray-400 mt-1">Rainbow DQN</p>
        </div>

        <div className={`relative p-6 rounded-2xl border ${lossLimitHit ? 'border-red-500/50 bg-red-900/20' : 'border-green-500/50 bg-green-900/20'} backdrop-blur-xl`}>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 rounded-2xl" />
          <Shield className={`w-10 h-10 ${lossLimitHit ? 'text-red-400' : 'text-green-400'} mb-3`} />
          <p className="text-2xl font-black">{lossLimitHit ? 'RISK BREACH' : 'SAFE'}</p>
          <p className="text-xs text-gray-400 mt-1">{dailyDrawdownPct}% drawdown</p>
        </div>

        <div className="relative p-6 rounded-2xl border border-yellow-500/50 bg-yellow-900/20 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 rounded-2xl" />
          <Gauge className="w-10 h-10 text-yellow-400 mb-3" />
          <p className="text-2xl font-black">{exposurePct}%</p>
          <p className="text-xs text-gray-400 mt-1">Market Exposure</p>
          <div className="mt-3 h-20">
            <Doughnut data={exposureDoughnut} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        <div className="relative p-6 rounded-2xl border border-cyan-500/50 bg-cyan-900/20 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 rounded-2xl" />
          <Clock className="w-10 h-10 text-cyan-400 mb-3" />
          <p className="text-2xl font-black">
            {new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-gray-400 mt-1">NYC Time</p>
        </div>
      </div>

      {/* Flow Charts */}
      <div className="px-4 py-4 grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-cyan-900/30 to-black border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Equity Flow
          </h3>
          <div className="h-32"><Line data={equityChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }} /></div>
        </div>
        <div className="bg-gradient-to-br from-purple-900/30 to-black border border-purple-500/30 rounded-2xl p-5 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" /> Realized PnL
          </h3>
          <div className="h-32"><Line data={realizedPnLChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }} /></div>
        </div>
      </div>

      {/* Neural Learning Core */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-purple-900/40 via-cyan-900/40 to-pink-900/40 border border-purple-500/40 rounded-2xl p-6 backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.1)_0%,transparent_70%)]" />
          
          <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-5 flex items-center gap-3">
            <Network className="w-8 h-8" />
            NEURAL CORE STATUS
          </h3>

          <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-black text-cyan-300">{mlMetrics.activeSymbols || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Active Neurons</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-purple-300">{mlMetrics.memorySize || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Experience Memory</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-300">{mlMetrics.learningSteps || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Training Steps</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-green-300">{(mlMetrics.eps || 0).toFixed(4)}</div>
              <div className="text-xs text-gray-400 mt-1">Exploration Rate</div>
            </div>
          </div>

          {topSymbols.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Most Reinforced Symbols</p>
              <div className="grid grid-cols-10 gap-2">
                {topSymbols.map((s: MLSymbolMetric) => (
                  <div key={s.symbol} className="bg-black/50 border border-purple-700/50 rounded-lg px-3 py-2 text-center">
                    <div className="font-bold text-purple-300">{s.symbol}</div>
                    <div className="text-xs text-green-400">{s.count}×</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Positions + Rockets Grid */}
      <div className="px-4 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Positions */}
        <div className="bg-gradient-to-br from-gray-900/90 to-black border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-black text-cyan-300 mb-5">ACTIVE POSITIONS ({positions.length})</h3>
          {positions.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Wallet className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No active positions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((pos: any, i: number) => (
                <div key={i} className="bg-black/40 border border-gray-700/50 rounded-xl p-4 hover:border-cyan-500/50 transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-black text-cyan-300">{pos.symbol}</div>
                      <div className="text-sm text-gray-500">{pos.qty} shares @ ${Number(pos.avg_entry_price).toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-black ${pos.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.unrealized_pl >= 0 ? '+' : ''}${pos.unrealized_pl?.toFixed(0) || '0'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {pos.unrealized_plpc ? (pos.unrealized_plpc * 100).toFixed(1) : '0.0'}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hot Rockets */}
        <div className="bg-gradient-to-br from-gray-900/90 to-black border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-black text-cyan-300 mb-5 flex items-center justify-between">
            <span>HOT ROCKETS ({rockets.length})</span>
            {rockets.length > 0 && <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />}
          </h3>
          {rockets.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Activity className="w-16 h-16 mx-auto mb-4 opacity-30 animate-pulse" />
              <p>Scanning for momentum...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rockets.map((rocket: Rocket, i: number) => {
                const action = getActionDetails(rocket.mlAction);
                const flashing = flashRockets.has(rocket.symbol);
                const isExpanded = expandedRocket === rocket.symbol;
                const chartData = rocketCharts[rocket.symbol];

                return (
                  <div key={i} className={`rounded-2xl border-2 p-5 transition-all ${flashing ? 'border-yellow-400 bg-yellow-900/30 shadow-2xl shadow-yellow-500/30' : 'border-gray-700/50 bg-black/40'} hover:border-cyan-400/70`}>
                    <div onClick={() => toggleRocketChart(rocket.symbol)} className="cursor-pointer">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-3xl font-black text-cyan-300">{rocket.symbol}</div>
                          <div className="text-sm text-gray-400 mt-1">
                            +{rocket.gap}% gap • RVOL {rocket.rvol} • ${rocket.price}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-block px-4 py-2 rounded-full text-sm font-black border-2 ${action.color}`}>
                            {action.label}
                          </div>
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <Gauge className="w-5 h-5 text-cyan-300" />
                            <span className="text-2xl font-black text-cyan-300">{rocket.mlConfidence}%</span>
                            {rocket.mlPriority && <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && chartData && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="h-32"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} /></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Live Neural Activity Log */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t-2 border-cyan-500/50 backdrop-blur-2xl">
        <div className="px-4 py-3">
          <h3 className="text-sm font-black text-cyan-300 mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5" /> NEURAL ACTIVITY LOG
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Neural core idle...</p>
            ) : (
              logs.map((logLine: string, i: number) => {
                const match = logLine.match(/\[(.*?)\] (.*)/);
                const time = match?.[1] || '';
                const message = match?.[2] || logLine;

                const isEntry = message.includes('ENTERED');
                const isExit = message.includes('EXIT') || message.includes('CLOSED') || message.includes('FORCE');
                const isDense = message.includes('DENSE FEEDBACK');
                const isReject = message.includes('REJECT');

                return (
                  <div
                    key={i}
                    className={`py-2 px-3 rounded-lg ${
                      isEntry ? 'bg-green-900/40 border border-green-600/50' :
                      isExit ? 'bg-red-900/40 border border-red-600/50' :
                      isDense ? 'bg-purple-900/40 border border-purple-600/30' :
                      isReject ? 'bg-gray-800/50' :
                      'bg-gray-900/30'
                    }`}
                  >
                    <span className="text-cyan-400">{time}</span>
                    <span className="ml-3">
                      {isEntry && <CheckCircle2 className="w-4 h-4 inline text-green-400 mr-2" />}
                      {isExit && <XCircle className="w-4 h-4 inline text-red-400 mr-2" />}
                      {isDense && <Brain className="w-4 h-4 inline text-purple-400 mr-2" />}
                      {message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
