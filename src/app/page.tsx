'use client';

import { useEffect, useState } from 'react';
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
  Minus,
  Shield,
  Target,
  Brain,
  CheckCircle2,
  XCircle,
  Sparkles,
  Cpu,
  Network,
  Gauge,
  Radio,
  Binary
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

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });

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
  datasets: { data: number[]; borderColor: string; backgroundColor: string; fill: boolean; tension: number; pointRadius: number }[];
  options?: any;
};

type MLSymbolMetric = { symbol: string; count: number };

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
      const res = await axios.get(`${CORE_URL}?universe=1`, { timeout: 20000 });
      const data = res.data || {};
      const equityValue = Number(data.equity || 0);
      const realizedPnLValue = Number(data.realizedDailyPnL || 0);

      setCore(data);
      setEquityHistory(prev => [...prev, { time: new Date().toLocaleTimeString([], { second: '2-digit' }), equity: equityValue }].slice(-40));
      setRealizedPnLHistory(prev => [...prev, { time: new Date().toLocaleTimeString([], { second: '2-digit' }), pnl: realizedPnLValue }].slice(-40));
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
        const labels = res.data.t.map((t: number) => '');
        const prices = res.data.c;
        const chartData: ChartData = {
          labels,
          datasets: [{
            data: prices,
            borderColor: '#00ffff',
            backgroundColor: 'rgba(0, 255, 255, 0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 0
          }],
          options: {
            elements: { line: { borderWidth: 2 } },
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { display: false } }
          }
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
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center text-cyan-400">
      <div className="text-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
          <div className="absolute inset-0 border-4 border-cyan-400 rounded-full animate-pulse"></div>
          <Binary className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10" />
        </div>
        <p className="mt-6 text-lg tracking-widest">ALPHASTREAM</p>
        <p className="text-xs opacity-70">Neural core online...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-screen bg-black flex items-center justify-center text-red-400">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 animate-pulse" />
        <p className="text-lg mb-4">{error}</p>
        <button onClick={fetchCoreData} className="px-6 py-2 bg-cyan-600 rounded font-bold">RECONNECT</button>
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
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog.slice().reverse().slice(0, 20) : [];

  const totalExposure = positions.reduce((sum: number, pos: any) => sum + (pos.marketValue || 0), 0);
  const exposurePct = equity > 0 ? ((totalExposure / equity) * 100).toFixed(1) : "0.0";

  const rawUniverse: string[] = Array.isArray(core.universeSymbols) ? core.universeSymbols : [];
  const filteredUniverse = rawUniverse.filter(sym => sym.toLowerCase().includes(universeSearch.toLowerCase()));

  const equityChartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{ data: equityHistory.map(d => d.equity), borderColor: '#00ffff', backgroundColor: 'rgba(0,255,255,0.1)', fill: true, tension: 0.5, pointRadius: 0 }]
  };

  const realizedPnLChartData = {
    labels: realizedPnLHistory.map(d => d.time),
    datasets: [{ data: realizedPnLHistory.map(d => d.pnl), borderColor: realizedDailyPnL >= 0 ? '#00ff88' : '#ff3366', backgroundColor: 'rgba(0,255,136,0.08)', fill: true, tension: 0.5, pointRadius: 0 }]
  };

  const getActionDetails = (action: number = 2) => {
    const labels = ["STRONG BUY", "BUY", "HOLD", "NEUTRAL", "SELL"];
    const colors = ["text-green-400 bg-green-900/70", "text-cyan-400 bg-cyan-900/70", "text-yellow-400 bg-yellow-900/50", "text-gray-400 bg-gray-800/70", "text-red-400 bg-red-900/70"];
    return { label: labels[action] || "HOLD", color: colors[action] || colors[2] };
  };

  const topSymbols = (mlMetrics.topSymbols || []).slice(0, 10);

  const exposureDoughnut = {
    labels: ['Exposure', 'Cash'],
    datasets: [{ data: [parseFloat(exposurePct), 100 - parseFloat(exposurePct)], backgroundColor: ['#00ffff', '#0a0a0a'], borderWidth: 0, cutout: '80%' }]
  };

  return (
    <div className="h-screen bg-black text-gray-100 overflow-hidden relative flex flex-col">
      {/* Neural Grid Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-purple-600/10 to-pink-600/20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff08_1px,transparent_1px),linear-gradient(to_bottom,#00ffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Floating Neural Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-0.5 h-0.5 bg-cyan-400 rounded-full animate-pulse" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: '3s'
          }} />
        ))}
      </div>

      {/* Header */}
      <header className="shrink-0 bg-black/90 backdrop-blur border-b border-cyan-500/30 px-3 py-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="w-8 h-8 text-cyan-400" />
            <Radio className="absolute -top-1 -right-1 w-4 h-4 text-green-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">ALPHASTREAM</h1>
            <p className="text-xs text-gray-500 tracking-widest">NEURAL MOMENTUM ENGINE v3</p>
          </div>
          <button onClick={() => setShowUniverse(true)} className="flex items-center gap-1 px-2 py-1 bg-cyan-900/40 border border-cyan-700/50 rounded text-xs">
            <Globe className="w-3 h-3" /> {universeSize}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddForm(!showAddForm)} className="p-2 rounded bg-purple-900/50 border border-purple-600/50"><Plus className="w-4 h-4 text-purple-300" /></button>
          <button onClick={() => setShowRemoveForm(!showRemoveForm)} className="p-2 rounded bg-red-900/50 border border-red-600/50"><Minus className="w-4 h-4 text-red-300" /></button>
          <button onClick={panicCloseAll} disabled={panicClosing} className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-pink-700 rounded text-xs font-bold flex items-center gap-1">
            {panicClosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />} PANIC
          </button>
          <button onClick={forceScan} disabled={scanning} className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded text-xs font-bold flex items-center gap-1">
            {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} SCAN
          </button>
        </div>
      </header>

      {message && <div className="shrink-0 bg-gradient-to-r from-cyan-600/80 to-purple-600/80 py-1 text-center text-xs font-bold">{message}</div>}
      {panicMessage && <div className="shrink-0 bg-gradient-to-r from-red-600/90 to-pink-700/90 py-1 text-center text-xs font-bold">{panicMessage}</div>}

      {/* Add/Remove Forms */}
      {showAddForm && (
        <div className="shrink-0 px-3 py-1 bg-black/80 border-b border-cyan-900/50">
          <div className="flex gap-1">
            <input value={tickerInput} onChange={e => setTickerInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTickers()} placeholder="Add tickers..." className="flex-1 px-2 py-1 bg-black/70 rounded border border-cyan-700/50 text-xs" />
            <button onClick={handleAddTickers} disabled={addingTickers} className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded text-xs">{addingTickers ? '...' : 'Add'}</button>
          </div>
          {addMessage && <p className="text-center text-xs mt-1">{addMessage}</p>}
        </div>
      )}
      {showRemoveForm && (
        <div className="shrink-0 px-3 py-1 bg-black/80 border-b border-red-900/50">
          <div className="flex gap-1">
            <input value={removeTickerInput} onChange={e => setRemoveTickerInput(e.target.value)} placeholder="Remove ticker..." className="flex-1 px-2 py-1 bg-black/70 rounded border border-red-700/50 text-xs" />
            <button onClick={handleRemoveTickers} disabled={removingTickers} className="px-3 py-1 bg-red-600 rounded text-xs">{removingTickers ? '...' : 'Remove'}</button>
          </div>
          {removeMessage && <p className="text-center text-xs mt-1">{removeMessage}</p>}
        </div>
      )}

      {/* Universe Modal */}
      {showUniverse && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setShowUniverse(false)}>
          <div className="bg-gray-900/90 border border-cyan-500/50 rounded p-4 max-w-2xl w-full max-h-96" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-3">
              <h3 className="font-bold text-cyan-300">Universe ({universeSize})</h3>
              <input value={universeSearch} onChange={e => setUniverseSearch(e.target.value)} placeholder="Search..." className="px-3 py-1 bg-black/70 rounded border border-cyan-700/50 text-xs" />
            </div>
            <div className="grid grid-cols-8 gap-1 text-xs overflow-y-auto max-h-72">
              {filteredUniverse.map(sym => <div key={sym} className="bg-gray-800/60 rounded px-2 py-1 text-center border border-gray-700/50">{sym}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden">
        {/* Left: 7 columns */}
        <div className="col-span-7 space-y-2 overflow-y-auto pr-2">
          {/* Core Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-cyan-900/40 to-black border border-cyan-500/30 rounded p-3 text-center">
              <Wallet className="w-6 h-6 mx-auto text-cyan-400 mb-1" />
              <p className="text-xl font-bold text-cyan-300">${equity.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Equity</p>
            </div>
            <div className="bg-gradient-to-br from-green-900/40 to-black border border-green-500/30 rounded p-3 text-center">
              <DollarSign className="w-6 h-6 mx-auto text-green-400 mb-1" />
              <p className="text-xl font-bold text-green-300">${buyingPower.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Power</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/40 to-black border rounded p-3 text-center">
              <Target className={`w-6 h-6 mx-auto mb-1 ${realizedDailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              <p className={`text-xl font-bold ${realizedDailyPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {realizedDailyPnL >= 0 ? '+' : ''}${Math.abs(realizedDailyPnL).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Daily PnL</p>
            </div>
          </div>

          {/* Status + Exposure */}
          <div className="grid grid-cols-5 gap-2">
            <div className={`bg-gradient-to-br ${mlConnected ? 'from-green-900/40' : 'from-red-900/40'} to-black border ${mlConnected ? 'border-green-500/50' : 'border-red-500/50'} rounded p-2 text-center`}>
              <Cpu className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-bold">{mlConnected ? 'NEURAL ON' : 'ML OFF'}</p>
            </div>
            <div className={`bg-gradient-to-br ${lossLimitHit ? 'from-red-900/40' : 'from-green-900/40'} to-black border ${lossLimitHit ? 'border-red-500/50' : 'border-green-500/50'} rounded p-2 text-center`}>
              <Shield className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-bold">{lossLimitHit ? 'BREACH' : 'SAFE'}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/40 to-black border border-yellow-500/30 rounded p-2 text-center">
              <Gauge className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-bold">{exposurePct}%</p>
              <div className="h-10 mt-1"><Doughnut data={exposureDoughnut} options={{ responsive: true, plugins: { legend: { display: false } } }} /></div>
            </div>
            <div className="col-span-2 bg-gradient-to-br from-cyan-900/40 to-black border border-cyan-500/30 rounded p-2 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-bold">{lastUpdate} ET</p>
              <p className="text-xs text-gray-500">Live Sync</p>
            </div>
          </div>

          {/* Flow Charts */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-cyan-900/40 to-black border border-cyan-500/30 rounded p-2">
              <p className="text-xs font-bold text-cyan-300 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Equity Flow</p>
              <div className="h-24"><Line data={equityChartData} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }} /></div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/30 rounded p-2">
              <p className="text-xs font-bold text-purple-300 mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Realized PnL</p>
              <div className="h-24"><Line data={realizedPnLChartData} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }} /></div>
            </div>
          </div>

          {/* Neural Core */}
          <div className="bg-gradient-to-r from-purple-900/50 via-cyan-900/30 to-black border border-purple-500/40 rounded p-3">
            <div className="flex items-center gap-2 mb-2"><Network className="w-5 h-5 text-purple-400" /> <span className="font-bold text-purple-300">NEURAL CORE</span></div>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div><p className="text-xl font-bold text-cyan-300">{mlMetrics.activeSymbols || 0}</p><p className="text-xs text-gray-500">Active</p></div>
              <div><p className="text-xl font-bold text-purple-300">{mlMetrics.memorySize || 0}</p><p className="text-xs text-gray-500">Memory</p></div>
              <div><p className="text-xl font-bold text-yellow-300">{mlMetrics.learningSteps || 0}</p><p className="text-xs text-gray-500">Steps</p></div>
              <div><p className="text-xl font-bold text-green-300">{(mlMetrics.eps || 0).toFixed(3)}</p><p className="text-xs text-gray-500">ε</p></div>
            </div>
            {topSymbols.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1">Top Learned</p>
                <div className="grid grid-cols-5 gap-1">
                  {topSymbols.map((s: MLSymbolMetric) => (
                    <div key={s.symbol} className="bg-black/60 border border-purple-700/50 rounded px-2 py-1 text-center text-xs">
                      <span className="text-purple-300">{s.symbol}</span> <span className="text-green-400">{s.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Positions */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-cyan-500/30 rounded p-2 max-h-40 overflow-y-auto">
            <p className="font-bold text-cyan-300 text-xs mb-1">POSITIONS ({positions.length})</p>
            {positions.length === 0 ? <p className="text-center text-gray-600 text-xs py-6">Flat — awaiting signal</p> : (
              positions.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-gray-800/50">
                  <span className="text-cyan-300 font-mono">{p.symbol}</span>
                  <span>{p.qty} @ ${Number(p.avg_entry_price).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: 5 columns */}
        <div className="col-span-5 space-y-2 overflow-y-auto">
          {/* Rockets */}
          <div className="bg-gradient-to-br from-gray-900/90 to-black border border-cyan-500/30 rounded p-2 max-h-56 overflow-y-auto">
            <div className="flex justify-between items-center mb-1">
              <p className="font-bold text-cyan-300 text-xs">HOT ROCKETS ({rockets.length})</p>
              {rockets.length > 0 && <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />}
            </div>
            {rockets.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-40 animate-pulse" />
                <p className="text-xs">Scanning neural space...</p>
              </div>
            ) : (
              rockets.map((rocket: Rocket, i: number) => {
                const action = getActionDetails(rocket.mlAction);
                const flashing = flashRockets.has(rocket.symbol);
                const isExpanded = expandedRocket === rocket.symbol;
                const chartData = rocketCharts[rocket.symbol];
                return (
                  <div key={i} className={`p-2 rounded mb-2 ${flashing ? 'bg-yellow-900/30 border border-yellow-400 shadow-lg shadow-yellow-500/20' : 'bg-gray-800/60 border border-gray-700/50'}`}>
                    <div onClick={() => toggleRocketChart(rocket.symbol)} className="cursor-pointer flex justify-between items-center">
                      <div>
                        <span className="text-lg font-bold text-cyan-300">{rocket.symbol}</span>
                        <span className="ml-2 text-xs text-gray-400">+{rocket.gap}% • {rocket.mlConfidence}% conf</span>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${action.color}`}>{action.label}</span>
                    </div>
                    {isExpanded && chartData && (
                      <div className="mt-2 h-20">
                        <Line data={{ labels: chartData.labels, datasets: chartData.datasets }} options={chartData.options} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Neural Log */}
          <div className="bg-gradient-to-br from-gray-900/90 to-black border border-cyan-500/30 rounded p-2 max-h-40 overflow-y-auto font-mono text-xs">
            <p className="font-bold text-cyan-300 mb-1 flex items-center gap-1"><Activity className="w-4 h-4" /> NEURAL LOG</p>
            {logs.length === 0 ? <p className="text-center text-gray-600 py-4">Core idle — awaiting market stimulus</p> : (
              logs.map((logLine: string, i: number) => {
                const match = logLine.match(/\[(.*?)\] (.*)/);
                const time = match?.[1] || '';
                const message = match?.[2] || logLine;
                const isEntry = message.includes('ENTERED');
                const isExit = message.includes('EXIT') || message.includes('CLOSED') || message.includes('FORCE');
                const isDense = message.includes('DENSE FEEDBACK');
                const isReject = message.includes('REJECT');
                return (
                  <div key={i} className={`py-0.5 ${isEntry ? 'text-green-400' : isExit ? 'text-red-400' : isDense ? 'text-purple-400' : isReject ? 'text-gray-500' : ''}`}>
                    <span className="text-cyan-500">{time}</span> {message}
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
