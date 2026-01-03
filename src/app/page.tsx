'use client';
import { useEffect, useState, useRef } from 'react';
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
  Binary,
  Rocket,
  Flame,
  Trash2,
  Copy,
  Search
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

type Discovery = {
  symbol: string;
  confidence: number;
  sources: string[];
};
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
  const [recentDiscoveries, setRecentDiscoveries] = useState<Discovery[]>([]);
  const [flashDiscoveries, setFlashDiscoveries] = useState<Set<string>>(new Set());
  const [addSuggestions, setAddSuggestions] = useState<string[]>([]);
  const [removeSuggestions, setRemoveSuggestions] = useState<string[]>([]);
  const [showAddSuggestions, setShowAddSuggestions] = useState(false);
  const [showRemoveSuggestions, setShowRemoveSuggestions] = useState(false);

  // Drag-resize log box
  const [logHeight, setLogHeight] = useState<number>(256);
  const [draggingLogs, setDraggingLogs] = useState(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(256);
  const logMinHeight = 140;
  const logMaxHeight = 560;

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

      if (data.discoveries && Array.isArray(data.discoveries)) {
        const newSymbols = data.discoveries.map((d: Discovery) => d.symbol);
        if (newSymbols.length > 0) {
          setFlashDiscoveries(new Set(newSymbols));
          setTimeout(() => setFlashDiscoveries(new Set()), 4000);
          setRecentDiscoveries(data.discoveries);
        }
      }

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

  const TICKER_REGEX = /^[A-Z]{1,12}(\.[A-Z]{1,4})?$/;
  const validateAndCleanTickers = (input: string): string[] => {
    return input
      .toUpperCase()
      .replace(/[^A-Z.\s]/g, '')
      .split(/[\s,;\n]+/)
      .map(s => s.trim())
      .filter(s => TICKER_REGEX.test(s))
      .filter(Boolean);
  };

  const updateAddSuggestions = (input: string) => {
    if (!input.trim()) {
      setAddSuggestions([]);
      setShowAddSuggestions(false);
      return;
    }
    const query = input.toUpperCase().trim();
    const matches = (core.universeSymbols || [])
      .filter((sym: string) => sym.includes(query))
      .slice(0, 8);
    setAddSuggestions(matches);
    setShowAddSuggestions(matches.length > 0);
  };

  const updateRemoveSuggestions = (input: string) => {
    if (!input.trim()) {
      setRemoveSuggestions([]);
      setShowRemoveSuggestions(false);
      return;
    }
    const query = input.toUpperCase().trim();
    const matches = (core.universeSymbols || [])
      .filter((sym: string) => sym.includes(query))
      .slice(0, 8);
    setRemoveSuggestions(matches);
    setShowRemoveSuggestions(matches.length > 0);
  };

  const handleAddTickers = async () => {
    const validTickers = validateAndCleanTickers(tickerInput);
    if (validTickers.length === 0) {
      setAddMessage('Invalid tickers');
      setTimeout(() => setAddMessage(''), 3000);
      return;
    }
    setAddingTickers(true);
    setAddMessage('');
    try {
      await axios.post(`${CORE_URL}/admin/add-ticker`, { symbols: validTickers.join(' ') }, { timeout: 15000 });
      setAddMessage(`+${validTickers.length}`);
      setTickerInput('');
      setAddSuggestions([]);
      fetchCoreData();
    } catch (err: any) {
      setAddMessage('Failed');
    } finally {
      setAddingTickers(false);
      setTimeout(() => setAddMessage(''), 3000);
    }
  };

  const handleRemoveTickers = async () => {
    const validTickers = validateAndCleanTickers(removeTickerInput);
    if (validTickers.length === 0) {
      setRemoveMessage('Invalid tickers');
      setTimeout(() => setRemoveMessage(''), 3000);
      return;
    }
    setRemovingTickers(true);
    try {
      await axios.post(`${CORE_URL}/admin/remove-ticker`, { symbols: validTickers.join(' ') });
      setRemoveMessage(`-${validTickers.length}`);
      setRemoveTickerInput('');
      setRemoveSuggestions([]);
      fetchCoreData();
    } catch (err: any) {
      setRemoveMessage('Failed');
    } finally {
      setRemovingTickers(false);
      setTimeout(() => setRemoveMessage(''), 3000);
    }
  };

  const handleRemoveSingleTicker = async (symbol: string) => {
    if (!window.confirm(`Remove ${symbol} from universe?`)) return;
    try {
      await axios.post(`${CORE_URL}/admin/remove-ticker`, { symbols: symbol });
      fetchCoreData();
    } catch (err) {
      console.error("Failed to remove ticker:", err);
    }
  };

  const exportUniverse = () => {
    const symbols = (core.universeSymbols || []).join(' ');
    navigator.clipboard.writeText(symbols);
    setMessage('Universe copied to clipboard');
    setTimeout(() => setMessage(''), 3000);
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

  const startLogDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingLogs(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = logHeight;
  };

  useEffect(() => {
    if (!draggingLogs) return;
    const onMove = (e: MouseEvent) => {
      const dy = e.clientY - dragStartYRef.current;
      const next = Math.max(logMinHeight, Math.min(logMaxHeight, dragStartHeightRef.current + dy));
      setLogHeight(next);
    };
    const onUp = () => {
      setDraggingLogs(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingLogs]);

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
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog.slice().reverse().slice(0, 50) : [];
  const totalExposure = positions.reduce((sum: number, pos: any) => sum + (pos.marketValue || 0), 0);
  const exposurePct = equity > 0 ? ((totalExposure / equity) * 100).toFixed(1) : "0.0";
  const rawUniverse: string[] = Array.isArray(core.universeSymbols) ? core.universeSymbols : [];
  const filteredUniverse = rawUniverse
    .filter(sym => sym.toLowerCase().includes(universeSearch.toLowerCase()))
    .sort();

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
      {/* Background effects unchanged */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-purple-600/10 to-pink-600/20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff08_1px,transparent_1px),linear-gradient(to_bottom,#00ffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
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
            <h1 className="text-xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">ALPHASTREAM</h1>
            <p className="text-xs text-gray-500 tracking-widest">QR-DQN MOMENTUM ENGINE v4</p>
          </div>
          <button onClick={() => setShowUniverse(true)} className="flex items-center gap-1 px-2 py-1 bg-cyan-900/40 border border-cyan-700/50 rounded text-xs cursor-pointer">
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

      {/* Add/Remove forms unchanged */}
      {showAddForm && (/* ... same as before ... */)}
      {showRemoveForm && (/* ... same as before ... */)}

      {/* Universe Modal unchanged */}
      {showUniverse && (/* ... same as before ... */)}

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden">
        <div className="col-span-7 space-y-2 overflow-y-auto pr-2">
          {/* All left-side panels unchanged */}
          {/* ... */}
        </div>

        <div className="col-span-5 space-y-2 overflow-y-auto">
          {/* Rockets unchanged */}
          {/* ... */}

          {/* === UPDATED NEURAL LOG SECTION === */}
          <div
            className={`bg-gradient-to-br from-gray-900/90 to-black border border-cyan-500/30 rounded p-2 font-mono text-xs relative overflow-hidden ${draggingLogs ? 'select-none' : ''}`}
            style={{ height: `${logHeight}px` }}
          >
            <p className="font-bold text-cyan-300 mb-1 flex items-center gap-1">
              <Activity className="w-4 h-4" /> NEURAL LOG (50)
              <span className="ml-auto text-[10px] text-gray-500 flex items-center gap-1">
                <span className="opacity-70">drag handle ↓</span>
              </span>
            </p>
            <div className="overflow-y-auto pr-1" style={{ height: `${logHeight - 34}px` }}>
              {logs.length === 0 ? (
                <p className="text-center text-gray-600 py-4">Core idle — awaiting market stimulus</p>
              ) : (
                logs.map((logLine: string, i: number) => {
                  const match = logLine.match(/\[(.*?)\] (.*)/);
                  let timeDisplay = '';
                  let message = logLine;

                  if (match) {
                    const rawTimestamp = match[1].trim(); // e.g. "2026-01-03T14:30:45Z"
                    message = match[2];

                    try {
                      // Ensure it ends with Z for UTC parsing
                      const utcString = rawTimestamp.endsWith('Z') ? rawTimestamp : rawTimestamp + 'Z';
                      const utcDate = new Date(utcString);

                      // Convert to Eastern Time (handles DST automatically)
                      timeDisplay = utcDate.toLocaleTimeString('en-US', {
                        timeZone: 'America/New_York',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                      });
                    } catch (e) {
                      timeDisplay = rawTimestamp; // fallback
                    }
                  }

                  const isEntry = message.includes('ENTERED');
                  const isExit = message.includes('EXIT') || message.includes('CLOSED') || message.includes('FORCE');
                  const isDense = message.includes('DENSE FEEDBACK');
                  const isReject = message.includes('REJECT');
                  const isDiscovery = message.includes('DISCOVERY ADD');

                  return (
                    <div
                      key={i}
                      className={`py-0.5 ${isEntry ? 'text-green-400' : isExit ? 'text-red-400' : isDense ? 'text-purple-400' : isReject ? 'text-gray-500' : isDiscovery ? 'text-orange-400' : ''}`}
                    >
                      {timeDisplay && <span className="text-cyan-500">[{timeDisplay}]</span>} {message}
                    </div>
                  );
                })
              )}
            </div>

            {/* Drag handle */}
            <div
              onMouseDown={startLogDrag}
              className="absolute left-2 right-2 bottom-2 h-4 rounded bg-black/50 border border-cyan-700/40 flex items-center justify-center cursor-row-resize"
              title="Drag to resize log box"
            >
              <div className="flex gap-1 opacity-80">
                <div className="w-10 h-0.5 bg-cyan-500/60 rounded" />
                <div className="w-10 h-0.5 bg-cyan-500/30 rounded" />
                <div className="w-10 h-0.5 bg-cyan-500/60 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
