'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
  Copy,
  BarChart3
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler, ArcElement);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });

// Types
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
  livePrice?: number; // real-time
};

type PositionT = {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
  marketValue: number;
  unrealizedPL: number;
  livePrice?: number; // real-time
};

type MLSymbolMetric = { symbol: string; count: number };

// Custom Hooks
const useCoreData = () => {
  const [core, setCore] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCore = useCallback(async (forceSync = false) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app"}/?universe=1${forceSync ? '&forceSync=1' : ''}`;
      const res = await axios.get(url, { timeout: 20000 });
      setCore(res.data || {});
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Core unreachable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCore();
    const interval = setInterval(() => fetchCore(), 8000);
    return () => clearInterval(interval);
  }, [fetchCore]);

  return { core, loading, error, fetchCore };
};

const useMLMetrics = () => {
  const [mlMetrics, setMlMetrics] = useState<any>({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_ML_URL || "https://alphastream-ml-1017433009054.us-east1.run.app"}/metrics`, { timeout: 10000 });
        setMlMetrics(res.data || {});
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, []);

  return mlMetrics;
};

const useRealTimePrices = (symbols: string[]) => {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (symbols.length === 0) return;

    const fetchPrices = async () => {
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app"}/admin/get-quotes`,
          { symbols: symbols.join(',') },
          { timeout: 10000 }
        );
        if (res.data && typeof res.data === "object") {
          setPrices(res.data);
        }
      } catch {}
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 5000); // every 5s
    return () => clearInterval(interval);
  }, [symbols]);

  return prices;
};

// Sub-components
const Header = ({ universeSize, onRefresh, onPanic, panicClosing }: any) => (
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
      <button onClick={onPanic} disabled={panicClosing} className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-pink-700 rounded text-xs font-bold flex items-center gap-1">
        {panicClosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />} PANIC
      </button>

      <button onClick={onRefresh} className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded text-xs font-bold flex items-center gap-1">
        <RefreshCw className="w-3 h-3" /> REFRESH
      </button>
    </div>
  </header>
);

const CoreStats = ({ core }: { core: any }) => {
  const equity = Number(core.equity || 0);
  const buyingPower = Number(core.buyingPower || 0);
  const realizedDailyPnL = Number(core.realizedDailyPnL || 0);
  const dailyDrawdown = Number(core.dailyDrawdown || 0);
  const dailyDrawdownPct = dailyDrawdown !== 0 ? ((Math.abs(dailyDrawdown) / Math.max(1, equity - dailyDrawdown)) * 100).toFixed(1) : "0.0";
  const lossLimitHit = Math.abs(dailyDrawdown) >= 1500;
  const mlConnected = core.mlHealthy === true;
  const exposurePct = core.exposurePct || "0.0";

  const exposureDoughnut = {
    labels: ['Exposure', 'Cash'],
    datasets: [{
      data: [parseFloat(exposurePct), 100 - parseFloat(exposurePct)],
      backgroundColor: ['#00ffff', '#0a0a0a'],
      borderWidth: 0,
      cutout: '80%'
    }]
  };

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
        <div className="h-10 mt-1">
          <Doughnut data={exposureDoughnut} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>
    </div>
  );
};

const RocketsPanel = ({ rockets, livePrices, onToggleChart }: any) => {
  const getActionDetails = (action: number = 2) => {
    const labels = ["STRONG BUY", "BUY", "HOLD", "NEUTRAL", "SELL"];
    const colors = [
      "text-green-400 bg-green-900/70",
      "text-cyan-400 bg-cyan-900/70",
      "text-yellow-400 bg-yellow-900/50",
      "text-gray-400 bg-gray-800/70",
      "text-red-400 bg-red-900/70"
    ];
    return { label: labels[action] || "HOLD", color: colors[action] || colors[2] };
  };

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
        rockets.map((rocket: RocketT) => {
          const action = getActionDetails(rocket.mlAction);
          const currentPrice = livePrices[rocket.symbol] || rocket.price;

          return (
            <div key={rocket.symbol} className="p-2 rounded mb-2 bg-gray-800/60 border border-gray-700/50">
              <div onClick={() => onToggleChart(rocket.symbol)} className="cursor-pointer flex justify-between items-center">
                <div>
                  <span className="text-lg font-bold text-cyan-300">{rocket.symbol}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    ${Number(currentPrice).toFixed(2)} • +{rocket.gap}% • {rocket.mlConfidence}% conf
                  </span>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-bold ${action.color}`}>{action.label}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

const MLVisualization = ({ mlMetrics }: { mlMetrics: any }) => {
  const topSymbols = (mlMetrics.topSymbols || []).slice(0, 10);

  const barData = {
    labels: topSymbols.map((s: MLSymbolMetric) => s.symbol),
    datasets: [{
      label: 'Learning Count',
      data: topSymbols.map((s: MLSymbolMetric) => s.count),
      backgroundColor: 'rgba(0, 255, 255, 0.6)',
      borderColor: '#00ffff',
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/50 via-cyan-900/30 to-black border border-purple-500/40 rounded p-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        <span className="font-bold text-purple-300">TOP LEARNED SYMBOLS</span>
      </div>
      {topSymbols.length > 0 ? (
        <div className="h-32">
          <Bar data={barData} options={options} />
        </div>
      ) : (
        <p className="text-center text-gray-500 text-xs">No learning data yet</p>
      )}
    </div>
  );
};

export default function Dashboard() {
  const { core, loading, error, fetchCore } = useCoreData();
  const mlMetrics = useMLMetrics();

  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [panicClosing, setPanicClosing] = useState(false);
  const [panicMessage, setPanicMessage] = useState("");

  // Real-time prices for rockets + positions
  const watchSymbols = [
    ...(core.rockets || []).map((r: RocketT) => r.symbol),
    ...(core.positions || []).map((p: PositionT) => p.symbol)
  ];
  const livePrices = useRealTimePrices(watchSymbols);

  // Update rockets/positions with live prices
  const rocketsWithLive = (core.rockets || []).map((r: RocketT) => ({
    ...r,
    livePrice: livePrices[r.symbol]
  }));

  const positionsWithLive = (core.positions || []).map((p: PositionT) => ({
    ...p,
    livePrice: livePrices[p.symbol]
  }));

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage("Initiating deep scan...");
    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 30000 });
      setMessage("Scan complete!");
      fetchCore(true);
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
    const ok = window.confirm("⚠️ PANIC CLOSE: Liquidate all positions and enable HARD FLAT?");
    if (!ok) return;

    setPanicClosing(true);
    setPanicMessage("EXECUTING PANIC CLOSE...");

    try {
      const res = await axios.post(`${CORE_URL}/admin/force-close`, {}, { timeout: 30000 });
      setPanicMessage(res?.data?.message || "PANIC EXECUTED");
      fetchCore(true);
    } catch (err: any) {
      setPanicMessage(`FAILED: ${err.response?.data?.error || err.message}`);
    } finally {
      setPanicClosing(false);
      setTimeout(() => setPanicMessage(""), 10000);
    }
  };

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
        <button onClick={() => fetchCore(true)} className="px-6 py-2 bg-cyan-600 rounded font-bold">RECONNECT</button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-black text-gray-100 overflow-hidden relative flex flex-col">
      {/* Background effects */}
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
        universeSize={core.universeSize || 0}
        onRefresh={() => fetchCore(true)}
        onPanic={panicCloseAll}
        panicClosing={panicClosing}
      />

      {message && <div className="shrink-0 bg-gradient-to-r from-cyan-600/80 to-purple-600/80 py-1 text-center text-xs font-bold">{message}</div>}
      {panicMessage && <div className="shrink-0 bg-gradient-to-r from-red-600/90 to-pink-700/90 py-1 text-center text-xs font-bold">{panicMessage}</div>}

      <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden">
        {/* Left Column */}
        <div className="col-span-7 space-y-2 overflow-y-auto pr-2">
          <CoreStats core={core} />

          {/* Equity & PnL Charts */}
          <div className="grid grid-cols-2 gap-2">
            {/* Equity Flow */}
            <div className="bg-gradient-to-br from-cyan-900/40 to-black border border-cyan-500/30 rounded p-2">
              <p className="text-xs font-bold text-cyan-300 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Equity Flow
              </p>
              <div className="h-24">
                <Line data={/* your equityChartData */} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }} />
              </div>
            </div>

            {/* Realized PnL */}
            <div className="bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/30 rounded p-2">
              <p className="text-xs font-bold text-purple-300 mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" /> Realized PnL
              </p>
              <div className="h-24">
                <Line data={/* your realizedPnLChartData */} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }} />
              </div>
            </div>
          </div>

          {/* ML Visualization */}
          <MLVisualization mlMetrics={mlMetrics} />

          {/* Positions */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-cyan-500/30 rounded p-2 max-h-40 overflow-y-auto">
            <p className="font-bold text-cyan-300 text-xs mb-1">POSITIONS ({positionsWithLive.length})</p>
            {positionsWithLive.length === 0 ? (
              <p className="text-center text-gray-600 text-xs py-6">Flat — awaiting signal</p>
            ) : (
              positionsWithLive.map((p: PositionT) => (
                <div key={p.symbol} className="flex justify-between items-center text-xs py-1 border-b border-gray-800/50">
                  <span className="text-cyan-300 font-mono">{p.symbol}</span>
                  <span>{p.qty} @ ${p.livePrice?.toFixed(2) || p.avgEntryPrice.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-2 overflow-y-auto">
          <RocketsPanel 
            rockets={rocketsWithLive} 
            livePrices={livePrices}
            onToggleChart={() => {}} // implement chart toggle if needed
          />

          {/* Logs */}
          <div className="bg-gradient-to-br from-gray-900/90 to-black border border-cyan-500/30 rounded p-2 font-mono text-xs">
            <p className="font-bold text-cyan-300 mb-1 flex items-center gap-1">
              <Activity className="w-4 h-4" /> NEURAL LOG (50)
            </p>
            <div className="overflow-y-auto h-64">
              {(core.tradeLog || []).slice(-50).reverse().map((logLine: string, i: number) => (
                <div key={i} className="py-0.5">{logLine}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
