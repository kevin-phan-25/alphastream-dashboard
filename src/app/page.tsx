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
  Brain
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
  loading: () => <div className="h-12 flex items-center justify-center text-cyan-500 text-xs animate-pulse">Chart...</div>
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
  transitions: number;
  avgReward: number;
  totalReward: number;
  lastSeen: string;
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

  // =========================
  // NEW: PANIC CLOSE BUTTON
  // =========================
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [panicClosing, setPanicClosing] = useState(false);
  const [panicMessage, setPanicMessage] = useState<string>("");
  const [panicError, setPanicError] = useState<string>("");

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
      setEquityHistory(prev => [...prev, { time, equity: equityValue }].slice(-20));
      setRealizedPnLHistory(prev => [...prev, { time, pnl: realizedPnLValue }].slice(-20));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: '2-digit', minute: '2-digit' }));

      if (Array.isArray(data.rockets) && data.rockets.length > 0) {
        const newSymbols = data.rockets.map((r: Rocket) => r.symbol);
        setFlashRockets(new Set(newSymbols));
        setTimeout(() => setFlashRockets(new Set()), 2500);
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
      // Silent fail — metrics are bonus
      setMlMetrics({});
    }
  };

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage("Scanning...");
    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 30000 });
      setMessage("Scan triggered!");
      setTimeout(() => fetchCoreData(), 1000);
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setMessage("Scan failed");
      setTimeout(() => setMessage(""), 2500);
    } finally {
      setScanning(false);
    }
  };

  const handleAddTickers = async () => {
    if (!tickerInput.trim()) return;
    setAddingTickers(true);
    try {
      const res = await axios.post(`${CORE_URL}/admin/add-ticker`, { symbols: tickerInput.trim().toUpperCase() });
      setAddMessage(`Success: ${res.data.message}`);
      setTickerInput('');
      fetchCoreData();
    } catch (err: any) {
      setAddMessage(`Error: ${err.response?.data?.error || 'Failed'}`);
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
      setRemoveMessage(`Success: ${res.data.message}`);
      setRemoveTickerInput('');
      fetchCoreData();
    } catch (err: any) {
      setRemoveMessage(`Error: ${err.response?.data?.error || 'Failed'}`);
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
            backgroundColor: 'rgba(0, 255, 255, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0
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

  // =========================
  // NEW: PANIC CLOSE LOGIC
  // - tries multiple endpoints so it works with your existing core
  // =========================
  const tryPanicEndpoints = async () => {
    const candidates = [
      `${CORE_URL}/admin/close-all`,
      `${CORE_URL}/close-all`,
      `${CORE_URL}/panic-close`,
      `${CORE_URL}/close`,
      `${CORE_URL}/flatten`,
    ];

    let lastErr: any = null;

    for (const url of candidates) {
      try {
        const res = await axios.post(url, {}, { timeout: 45000 });
        return { ok: true, url, data: res.data };
      } catch (e: any) {
        lastErr = e;
        // continue trying next
      }
    }

    const msg =
      lastErr?.response?.data?.error ||
      lastErr?.response?.data?.message ||
      lastErr?.message ||
      "Unknown error calling panic close endpoint";
    return { ok: false, url: candidates[candidates.length - 1], data: null, error: msg };
  };

  const panicCloseAll = async () => {
    if (panicClosing) return;
    setPanicClosing(true);
    setPanicMessage("");
    setPanicError("");
    setMessage(""); // don't fight existing message bar

    try {
      setPanicMessage("PANIC CLOSE: Sending close-all command...");
      const result = await tryPanicEndpoints();

      if (!result.ok) {
        setPanicError(`PANIC CLOSE FAILED: ${result.error || "Unknown error"}`);
        setPanicMessage("");
        return;
      }

      setPanicMessage(`PANIC CLOSE SENT ✅ (${result.url.replace(CORE_URL, "") || "/"})`);
      // immediately refresh core data a few times to show positions flattening
      setTimeout(() => fetchCoreData(), 750);
      setTimeout(() => fetchCoreData(), 2000);
      setTimeout(() => fetchCoreData(), 5000);

      // auto-hide after a bit
      setTimeout(() => setPanicMessage(""), 6000);
      setTimeout(() => setPanicError(""), 8000);
    } finally {
      setPanicClosing(false);
      setShowPanicConfirm(false);
    }
  };

  useEffect(() => {
    fetchCoreData();
    fetchMLMetrics();
    const interval = setInterval(() => {
      fetchCoreData();
      fetchMLMetrics();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Activity className="w-10 h-10 animate-pulse" />
        <p className="text-xs tracking-wider">INITIALIZING...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black text-red-400 flex items-center justify-center p-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <AlertCircle className="w-12 h-12" />
        <p className="text-xs max-w-xs">{error}</p>
        <button onClick={fetchCoreData} className="px-5 py-2 bg-cyan-600 rounded text-xs font-bold">RECONNECT</button>
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
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog.slice().reverse().slice(0, 12) : [];

  const totalExposure = positions.reduce((sum: number, pos: any) => sum + (pos.qty * pos.avg_entry_price), 0);
  const exposurePct = equity > 0 ? ((totalExposure / equity) * 100).toFixed(1) : "0.0";

  const rawUniverse: string[] = Array.isArray(core.universeSymbols) ? core.universeSymbols : [];
  const filteredUniverse = rawUniverse.filter(sym => sym.toLowerCase().includes(universeSearch.toLowerCase()));

  const equityChartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{ data: equityHistory.map(d => d.equity), borderColor: dailyDrawdown < 0 ? '#ff0080' : '#00ffff', backgroundColor: 'rgba(0,255,255,0.1)', fill: true, tension: 0.4, pointRadius: 0 }]
  };

  const realizedPnLChartData = {
    labels: realizedPnLHistory.map(d => d.time),
    datasets: [{ data: realizedPnLHistory.map(d => d.pnl), borderColor: realizedDailyPnL >= 0 ? '#00ff88' : '#ff3366', backgroundColor: 'rgba(0,255,136,0.1)', fill: true, tension: 0.4, pointRadius: 0 }]
  };

  const getActionDetails = (action: number = 2) => {
    const labels = ["STRONG BUY", "BUY", "HOLD", "NEUTRAL", "SELL"];
    const colors = ["text-green-300 bg-green-900/50", "text-cyan-300 bg-cyan-900/40", "text-yellow-300 bg-yellow-900/30", "text-gray-400 bg-gray-800/40", "text-red-400 bg-red-900/40"];
    return { label: labels[action] || "HOLD", color: colors[action] || colors[2] };
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 overflow-x-hidden">
      <div className="fixed inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#00ffff0a_1px,transparent_1px),linear-gradient(to_bottom,#00ffff0a_1px,transparent_1px)] bg-[size:30px_30px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/90 border-b border-cyan-500/30">
        <div className="px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">AlphaStream</h1>
            <button onClick={() => setShowUniverse(!showUniverse)} className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-900/40 border border-cyan-700/50 text-xs">
              <Globe className="w-3 h-3" /> {universeSize}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddForm(!showAddForm)} className="p-2 rounded bg-purple-900/40 border border-purple-700/50">
              <Plus className="w-4 h-4 text-purple-400" />
            </button>
            <button onClick={() => setShowRemoveForm(!showRemoveForm)} className="p-2 rounded bg-red-900/40 border border-red-700/50">
              <Minus className="w-4 h-4 text-red-400" />
            </button>

            {/* NEW: PANIC CLOSE BUTTON */}
            <button
              onClick={() => setShowPanicConfirm(true)}
              disabled={panicClosing}
              className={`px-3 py-1.5 rounded font-extrabold text-[11px] tracking-wider flex items-center gap-1.5 border
                ${panicClosing
                  ? 'bg-red-900/50 border-red-500/50 text-red-200 opacity-80'
                  : 'bg-gradient-to-r from-red-600 via-pink-600 to-red-700 border-red-400/60 text-white hover:brightness-110 active:scale-[0.99]'
                }`}
              title="Immediately close ALL open positions"
            >
              {panicClosing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              PANIC CLOSE
            </button>

            <button onClick={forceScan} disabled={scanning} className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-purple-600 rounded font-bold text-xs flex items-center gap-1.5">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              SCAN
            </button>
          </div>
        </div>
      </header>

      {/* NEW: PANIC STATUS BAR (separate from existing message bar) */}
      {(panicMessage || panicError) && (
        <div className={`py-2 text-center text-xs font-extrabold tracking-wider
          ${panicError ? 'bg-gradient-to-r from-red-950 via-red-900 to-black text-red-200' : 'bg-gradient-to-r from-red-900/80 via-pink-900/70 to-black text-white'}
        `}>
          {panicError || panicMessage}
        </div>
      )}

      {message && <div className="bg-gradient-to-r from-cyan-900/80 to-purple-900/80 py-2 text-center text-xs font-bold animate-pulse">{message}</div>}

      {/* NEW: PANIC CONFIRM MODAL */}
      {showPanicConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !panicClosing && setShowPanicConfirm(false)} />
          <div className="relative w-full max-w-md bg-gradient-to-b from-gray-950 via-black to-gray-950 border border-red-500/50 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-900/40 border border-red-500/40">
                <AlertTriangle className="w-6 h-6 text-red-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-extrabold text-red-200 tracking-wider">PANIC CLOSE — CONFIRM</h3>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  This will send an immediate <span className="text-red-200 font-bold">CLOSE ALL POSITIONS</span> command to your Core.
                  Use this if you need to flatten risk right now.
                </p>
                <p className="text-[11px] text-gray-400 mt-2">
                  Core: <span className="font-mono text-gray-200">{CORE_URL}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowPanicConfirm(false)}
                disabled={panicClosing}
                className="py-2 rounded-xl border border-gray-700/70 bg-gray-900/40 text-gray-200 font-bold text-xs hover:bg-gray-800/40"
              >
                CANCEL
              </button>
              <button
                onClick={panicCloseAll}
                disabled={panicClosing}
                className={`py-2 rounded-xl font-extrabold text-xs tracking-wider border
                  ${panicClosing
                    ? 'bg-red-900/50 border-red-500/50 text-red-200'
                    : 'bg-gradient-to-r from-red-600 via-pink-600 to-red-700 border-red-400/60 text-white hover:brightness-110'
                  }`}
              >
                {panicClosing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> CLOSING...
                  </span>
                ) : (
                  "YES — CLOSE EVERYTHING"
                )}
              </button>
            </div>

            <div className="mt-3 text-[11px] text-gray-500">
              Tip: If this fails, your Core likely uses a different endpoint name.
              Tell me your actual route (example: <span className="font-mono text-gray-300">/admin/close</span>) and I’ll hardwire it.
            </div>
          </div>
        </div>
      )}

      {/* Forms */}
      {showAddForm && (
        <div className="px-3 py-2">
          <div className="max-w-xs mx-auto bg-gray-900/90 border border-cyan-500/50 rounded p-3 text-xs">
            <h3 className="font-bold text-cyan-400 mb-2">Add Tickers</h3>
            <input value={tickerInput} onChange={e => setTickerInput(e.target.value)} placeholder="GME AMC..." className="w-full px-3 py-1.5 bg-black/70 border border-cyan-700/50 rounded mb-2" />
            <button onClick={handleAddTickers} disabled={addingTickers} className="w-full py-1.5 bg-cyan-600 rounded font-bold flex justify-center">
              {addingTickers ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </button>
            {addMessage && <p className={`text-center mt-1 text-xs ${addMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{addMessage}</p>}
          </div>
        </div>
      )}

      {showRemoveForm && (
        <div className="px-3 py-2">
          <div className="max-w-xs mx-auto bg-gray-900/90 border border-red-500/50 rounded p-3 text-xs">
            <h3 className="font-bold text-red-400 mb-2">Remove Tickers</h3>
            <input value={removeTickerInput} onChange={e => setRemoveTickerInput(e.target.value)} placeholder="CEI..." className="w-full px-3 py-1.5 bg-black/70 border border-red-700/50 rounded mb-2" />
            <button onClick={handleRemoveTickers} disabled={removingTickers} className="w-full py-1.5 bg-red-600 rounded font-bold flex justify-center">
              {removingTickers ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
            </button>
            {removeMessage && <p className={`text-center mt-1 text-xs ${removeMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{removeMessage}</p>}
          </div>
        </div>
      )}

      {showUniverse && (
        <div className="px-3 py-2">
          <div className="max-w-md mx-auto bg-gray-900/90 border border-cyan-500/40 rounded p-3 text-xs">
            <div className="flex justify-between mb-2">
              <h3 className="font-bold text-cyan-400">Universe ({universeSize})</h3>
              <input value={universeSearch} onChange={e => setUniverseSearch(e.target.value)} placeholder="Search..." className="px-2 py-1 bg-black/70 border border-gray-700 rounded text-xs" />
            </div>
            <div className="max-h-40 overflow-y-auto grid grid-cols-5 gap-1 text-xs font-mono">
              {filteredUniverse.length === 0 ? <p className="col-span-5 text-center text-gray-500 py-4">No matches</p> : filteredUniverse.map(sym => (
                <div key={sym} className="bg-gray-800/50 rounded px-2 py-1 border border-gray-700/50 text-center">{sym}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Tiles */}
      <div className="px-3 py-2 grid grid-cols-4 gap-2 text-xs">
        <div className={`p-2 rounded border text-center ${mlConnected ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50 bg-red-900/20'}`}>
          <Zap className={`w-6 h-6 mx-auto mb-1 ${mlConnected ? 'text-green-400' : 'text-red-400'}`} />
          ML {mlConnected ? 'ON' : 'OFF'}
        </div>
        <div className={`p-2 rounded border text-center ${lossLimitHit ? 'border-red-500/50 bg-red-900/20' : 'border-green-500/50 bg-green-900/20'}`}>
          <AlertTriangle className={`w-6 h-6 mx-auto mb-1 ${lossLimitHit ? 'text-red-400' : 'text-green-400'}`} />
          {lossLimitHit ? 'LIMIT HIT' : 'SAFE'}<br />{dailyDrawdownPct}%
        </div>
        <div className="p-2 rounded border border-yellow-500/50 bg-yellow-900/20 text-center">
          <BarChart3 className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
          Exposure<br /><span className="text-lg font-bold">{exposurePct}%</span>
        </div>
        <div className="p-2 rounded border border-cyan-500/50 bg-cyan-900/20 text-center">
          <Clock className="w-6 h-6 mx-auto mb-1 text-cyan-400" />
          {new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: '2-digit', minute: '2-digit' })} ET
        </div>
      </div>

      {/* Equity Bar */}
      <div className="px-3 py-2 border-y border-cyan-900/30 bg-gradient-to-r from-black via-cyan-950/20 to-black text-xs">
        <div className="flex justify-between flex-wrap gap-3">
          <div className="flex gap-4">
            <div><Wallet className="w-5 h-5 inline text-cyan-400" /> <span className="font-bold text-cyan-400">${equity.toFixed(0)}</span></div>
            <div><DollarSign className="w-5 h-5 inline text-green-400" /> <span className="font-bold text-green-400">${buyingPower.toFixed(0)}</span></div>
            <div><Target className={`w-5 h-5 inline ${realizedDailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              <span className={`font-bold ${realizedDailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {realizedDailyPnL >= 0 ? '+' : ''}${Math.abs(realizedDailyPnL).toFixed(0)}
              </span>
            </div>
          </div>
          <div className="opacity-70">{lastUpdate}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="px-3 py-2 grid grid-cols-2 gap-2">
        <div className="bg-gray-900/90 border border-cyan-500/40 rounded p-3">
          <h3 className="text-xs font-bold text-cyan-300 mb-1">Equity Flow</h3>
          <div className="h-24"><Line data={equityChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }} /></div>
        </div>
        <div className="bg-gray-900/90 border border-purple-500/40 rounded p-3">
          <h3 className="text-xs font-bold text-purple-300 mb-1">Realized PnL</h3>
          <div className="h-24"><Line data={realizedPnLChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }} /></div>
        </div>
      </div>

      {/* Risk Panel */}
      <div className="px-3 py-2">
        <div className="bg-gradient-to-r from-red-900/30 to-purple-900/30 border border-red-500/40 rounded p-3 text-xs">
          <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2"><Shield className="w-5 h-5" /> Risk</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div><div className="font-bold text-red-400">${Math.abs(dailyDrawdown).toFixed(0)}</div><div className="opacity-70">Drawdown</div></div>
            <div><div className={`font-bold ${realizedDailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>{realizedDailyPnL >= 0 ? '+' : ''}${Math.abs(realizedDailyPnL).toFixed(0)}</div><div className="opacity-70">PnL</div></div>
            <div><div className="font-bold text-yellow-400">{exposurePct}%</div><div className="opacity-70">Exposure</div></div>
            <div><div className={`font-bold ${lossLimitHit ? 'text-red-400' : 'text-green-400'}`}>${DAILY_LOSS_LIMIT}</div><div className="opacity-70">Limit</div></div>
          </div>
        </div>
      </div>

      {/* NEW: ML Learning Panel — Multi-Symbol Visualization */}
      <div className="px-3 py-2">
        <div className="bg-gradient-to-r from-purple-900/30 via-cyan-900/30 to-black border border-purple-500/40 rounded p-3 text-xs">
          <h3 className="font-bold text-purple-300 mb-2 flex items-center gap-2"><Brain className="w-5 h-5" /> Rainbow DQN Learning</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="font-bold text-cyan-400">{mlMetrics.activeSymbols || 0}</div>
              <div className="opacity-70">Active Symbols</div>
            </div>
            <div>
              <div className="font-bold text-yellow-400">{mlMetrics.memorySize || 0}</div>
              <div className="opacity-70">Total Experience</div>
            </div>
            <div>
              <div className="font-bold text-green-400">{mlMetrics.learningSteps || 0}</div>
              <div className="opacity-70">Training Steps</div>
            </div>
          </div>
          {mlMetrics.topSymbols && mlMetrics.topSymbols.length > 0 && (
            <div className="mt-3">
              <div className="text-xs opacity-80 mb-1">Top Learned Symbols</div>
              <div className="grid grid-cols-5 gap-1 text-xs font-mono">
                {mlMetrics.topSymbols.slice(0, 10).map((s: MLSymbolMetric) => (
                  <div key={s.symbol} className="bg-purple-900/30 rounded px-2 py-1 text-center border border-purple-700/50">
                    {s.symbol} ({s.transitions})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SIDE-BY-SIDE: Positions + Rockets */}
      <div className="px-3 py-2 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Positions */}
        <div className="bg-gray-900/90 border border-cyan-500/40 rounded p-3 text-xs">
          <h3 className="font-bold text-cyan-300 mb-2">Positions ({positions.length})</h3>
          {positions.length === 0 ? <p className="text-center text-gray-500 py-6">None</p> : (
            <div className="space-y-2">
              {positions.map((pos: any, i: number) => (
                <div key={i} className="bg-gray-800/50 rounded p-2 flex justify-between">
                  <span className="font-bold">{pos.symbol}</span>
                  <span>{pos.qty} @ ${Number(pos.avg_entry_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hot Rockets */}
        <div className="bg-gray-900/90 border border-cyan-500/40 rounded p-3 text-xs">
          <h3 className="font-bold text-cyan-300 mb-2 flex items-center justify-between">
            <span>Hot Rockets ({rockets.length})</span>
            {rockets.length > 0 && <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />}
          </h3>
          {rockets.length === 0 ? <p className="text-center text-gray-500 py-6">Scanning...</p> : (
            <div className="space-y-2">
              {rockets.map((rocket: Rocket, i: number) => {
                const action = getActionDetails(rocket.mlAction);
                const flashing = flashRockets.has(rocket.symbol);
                const isExpanded = expandedRocket === rocket.symbol;
                const chartData = rocketCharts[rocket.symbol];
                return (
                  <div key={i} className={`rounded-lg border p-3 transition-all ${flashing ? 'border-yellow-400 bg-yellow-900/30' : 'border-gray-700/50 bg-gray-800/40'}`}>
                    <div onClick={() => toggleRocketChart(rocket.symbol)} className="flex justify-between items-center cursor-pointer">
                      <div>
                        <div className="font-bold text-cyan-400">{rocket.symbol}</div>
                        <div className="text-xs opacity-80">+{rocket.gap}% • Conf: {rocket.mlConfidence}% {rocket.mlPriority && '⚡'}</div>
                      </div>
                      <div className={`px-3 py-1 rounded text-xs font-bold ${action.color}`}>{action.label}</div>
                    </div>
                    {isExpanded && chartData && <div className="h-20 mt-2 border-t border-gray-700"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} /></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-cyan-500/30 p-2 text-xs font-mono max-h-32 overflow-y-auto">
        {logs.map((log: any, i: number) => (
          <div key={i} className="opacity-70"><span className="text-cyan-500">{log.time}</span> {log.message}</div>
        ))}
      </div>
    </div>
  );
}
