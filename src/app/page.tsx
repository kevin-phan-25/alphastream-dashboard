'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  Cpu,
  Network,
  Gauge,
  Radio,
  Binary,
  Rocket,
  Flame,
  Trash2,
  Copy
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

type RocketT = {
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

// Custom Hooks
const useCoreData = (coreUrl: string) => {
  const [core, setCore] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCore = useCallback(async (forceSync = false) => {
    try {
      const url = `${coreUrl}/?universe=1${forceSync ? '&forceSync=1' : ''}`;
      const res = await axios.get(url, { timeout: 20000 });
      setCore(res.data || {});
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Core unreachable");
    } finally {
      setLoading(false);
    }
  }, [coreUrl]);

  useEffect(() => {
    fetchCore();
    const interval = setInterval(() => fetchCore(), 8000);
    return () => clearInterval(interval);
  }, [fetchCore]);

  return { core, loading, error, fetchCore };
};

const useMLMetrics = (mlUrl: string) => {
  const [mlMetrics, setMlMetrics] = useState<any>({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${mlUrl}/metrics`, { timeout: 10000 });
        setMlMetrics(res.data || {});
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 30000); // less frequent
    return () => clearInterval(interval);
  }, [mlUrl]);

  return mlMetrics;
};

// Sub-components (memoized)
const Header = React.memo(({ universeSize, onRefresh, onPanic, panicClosing, onToggleAdd, onToggleRemove }: any) => (
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
      <button className="flex items-center gap-1 px-2 py-1 bg-cyan-900/40 border border-cyan-700/50 rounded text-xs">
        <Globe className="w-3 h-3" /> {universeSize}
      </button>
    </div>

    <div className="flex items-center gap-2">
      <button onClick={onToggleAdd} className="p-2 rounded bg-purple-900/50 border border-purple-600/50">
        <Plus className="w-4 h-4 text-purple-300" />
      </button>

      <button onClick={onToggleRemove} className="p-2 rounded bg-red-900/50 border border-red-600/50">
        <Minus className="w-4 h-4 text-red-300" />
      </button>

      <button onClick={onPanic} disabled={panicClosing} className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-pink-700 rounded text-xs font-bold flex items-center gap-1">
        {panicClosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />} PANIC
      </button>

      <button onClick={onRefresh} className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded text-xs font-bold flex items-center gap-1">
        <RefreshCw className="w-3 h-3" /> REFRESH
      </button>
    </div>
  </header>
));

const CoreStats = React.memo(({ core }: { core: any }) => {
  const equity = Number(core.equity || 0);
  const buyingPower = Number(core.buyingPower || 0);
  const realizedDailyPnL = Number(core.realizedDailyPnL || 0);
  const dailyDrawdown = Number(core.dailyDrawdown || 0);
  const dailyDrawdownPct = dailyDrawdown !== 0
    ? ((Math.abs(dailyDrawdown) / Math.max(1, equity - dailyDrawdown)) * 100).toFixed(1)
    : "0.0";
  const lossLimitHit = Math.abs(dailyDrawdown) >= 1500;
  const mlConnected = core.mlHealthy === true;

  const positions = Array.isArray(core.positions) ? core.positions : [];
  const totalExposure = positions.reduce((sum: number, p: any) => sum + Number(p.marketValue || 0), 0);
  const exposurePct = equity > 0 ? ((totalExposure / equity) * 100).toFixed(1) : "0.0";

  const exposureDoughnut = useMemo(() => ({
    labels: ['Exposure', 'Cash'],
    datasets: [{
      data: [parseFloat(exposurePct), 100 - parseFloat(exposurePct)],
      backgroundColor: ['#00ffff', '#0a0a0a'],
      borderWidth: 0,
      cutout: '80%'
    }]
  }), [exposurePct]);

  return (
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

      {/* Status row */}
      <div className={`col-span-1 bg-gradient-to-br ${mlConnected ? 'from-green-900/40' : 'from-red-900/40'} to-black border ${mlConnected ? 'border-green-500/50' : 'border-red-500/50'} rounded p-2 text-center`}>
        <Cpu className="w-5 h-5 mx-auto mb-1" />
        <p className="text-xs font-bold">{mlConnected ? 'NEURAL ON' : 'ML OFF'}</p>
      </div>

      <div className={`col-span-1 bg-gradient-to-br ${lossLimitHit ? 'from-red-900/40' : 'from-green-900/40'} to-black border ${lossLimitHit ? 'border-red-500/50' : 'border-green-500/50'} rounded p-2 text-center`}>
        <Shield className="w-5 h-5 mx-auto mb-1" />
        <p className="text-xs font-bold">{lossLimitHit ? 'BREACH' : 'SAFE'}</p>
      </div>

      <div className="col-span-1 bg-gradient-to-br from-yellow-900/40 to-black border border-yellow-500/30 rounded p-2 text-center">
        <Gauge className="w-5 h-5 mx-auto mb-1" />
        <p className="text-xs font-bold">{exposurePct}%</p>
        <div className="h-10 mt-1">
          <Doughnut data={exposureDoughnut} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>
    </div>
  );
});

const RocketsPanel = React.memo(({ rockets }: { rockets: RocketT[] }) => {
  const getActionDetails = useCallback((action: number = 2) => {
    const labels = ["STRONG BUY", "BUY", "HOLD", "NEUTRAL", "SELL"];
    const colors = [
      "text-green-400 bg-green-900/70",
      "text-cyan-400 bg-cyan-900/70",
      "text-yellow-400 bg-yellow-900/50",
      "text-gray-400 bg-gray-800/70",
      "text-red-400 bg-red-900/70"
    ];
    return { label: labels[action] || "HOLD", color: colors[action] || colors[2] };
  }, []);

  return (
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
        rockets.map((rocket, i) => {
          const action = getActionDetails(rocket.mlAction);
          return (
            <div key={i} className="p-2 rounded mb-2 bg-gray-800/60 border border-gray-700/50">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-bold text-cyan-300">{rocket.symbol}</span>
                  <span className="ml-2 text-xs text-gray-400">+{rocket.gap}% • {rocket.mlConfidence}% conf</span>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-bold ${action.color}`}>{action.label}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
});

const LogsPanel = React.memo(({ logs }: { logs: string[] }) => {
  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-black border border-cyan-500/30 rounded p-2 font-mono text-xs h-full overflow-hidden flex flex-col">
      <p className="font-bold text-cyan-300 mb-1 flex items-center gap-1">
        <Activity className="w-4 h-4" /> NEURAL LOG ({logs.length})
      </p>
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-center text-gray-600 py-4">Core idle</p>
        ) : (
          logs.map((line, i) => (
            <div key={i} className="py-0.5 break-all">{line}</div>
          ))
        )}
      </div>
    </div>
  );
});

export default function Dashboard() {
  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
  const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "https://alphastream-ml-1017433009054.us-east1.run.app";

  const { core, loading, error, fetchCore } = useCoreData(CORE_URL);
  const mlMetrics = useMLMetrics(ML_URL);

  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [panicClosing, setPanicClosing] = useState(false);
  const [panicMessage, setPanicMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRemoveForm, setShowRemoveForm] = useState(false);
  const [showUniverse, setShowUniverse] = useState(false);

  // Derived data (memoized)
  const equity = useMemo(() => Number(core.equity || 0), [core.equity]);
  const universeSize = useMemo(() => core.universeSize || 0, [core.universeSize]);
  const rockets = useMemo(() => core.rockets || [], [core.rockets]);
  const logs = useMemo(() => (core.tradeLog || []).slice().reverse().slice(0, 50), [core.tradeLog]);

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage("Initiating deep scan...");
    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 90000 });
      setMessage("Scan complete!");
      fetchCore(true);
      setTimeout(() => setMessage(""), 5000);
    } catch {
      setMessage("Scan failed");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setScanning(false);
    }
  };

  const panicCloseAll = async () => {
    if (panicClosing) return;
    if (!window.confirm("⚠️ PANIC CLOSE: Liquidate all and enable HARD FLAT?")) return;

    setPanicClosing(true);
    setPanicMessage("EXECUTING PANIC CLOSE...");

    try {
      const res = await axios.post(`${CORE_URL}/admin/force-close`, {}, { timeout: 30000 });
      setPanicMessage(res?.data?.message || "EXECUTED");
      fetchCore(true);
    } catch (err: any) {
      setPanicMessage(`FAILED: ${err.response?.data?.error || err.message}`);
    } finally {
      setPanicClosing(false);
      setTimeout(() => setPanicMessage(""), 10000);
    }
  };

  if (loading) {
    return (
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
  }

  if (error) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-red-400">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-lg mb-4">{error}</p>
          <button onClick={() => fetchCore(true)} className="px-6 py-2 bg-cyan-600 rounded font-bold">RECONNECT</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-gray-100 overflow-hidden relative flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-purple-600/10 to-pink-600/20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff08_1px,transparent_1px),linear-gradient(to_bottom,#00ffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: '3s'
            }}
          />
        ))}
      </div>

      <Header
        universeSize={universeSize}
        onRefresh={() => fetchCore(true)}
        onPanic={panicCloseAll}
        panicClosing={panicClosing}
        onToggleAdd={() => setShowAddForm(prev => !prev)}
        onToggleRemove={() => setShowRemoveForm(prev => !prev)}
      />

      {message && <div className="shrink-0 bg-gradient-to-r from-cyan-600/80 to-purple-600/80 py-1 text-center text-xs font-bold">{message}</div>}
      {panicMessage && <div className="shrink-0 bg-gradient-to-r from-red-600/90 to-pink-700/90 py-1 text-center text-xs font-bold">{panicMessage}</div>}

      <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden">
        {/* Left */}
        <div className="col-span-7 space-y-2 overflow-y-auto pr-2">
          <CoreStats core={core} />

          {/* Charts & ML Viz placeholder (implement as needed) */}

          {/* Positions placeholder */}

        </div>

        {/* Right */}
        <div className="col-span-5 space-y-2 overflow-y-auto">
          <RocketsPanel rockets={rockets} />
          <LogsPanel logs={logs} />
        </div>
      </div>
    </div>
  );
}
