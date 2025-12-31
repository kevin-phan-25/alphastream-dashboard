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
      setEquityHistory(prev => [...prev, { time: new Date().toLocaleTimeString([], { minute: '2-digit' }), equity: equityValue }].slice(-20));
      setRealizedPnLHistory(prev => [...prev, { time: new Date().toLocaleTimeString([], { minute: '2-digit' }), pnl: realizedPnLValue }].slice(-20));
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
      setError("Cannot reach Core — retrying...");
    } finally {
      setLoading(false);
    }
  };

  const fetchMLMetrics = async () => {
    try {
      const res = await axios.get(`${ML_URL}/metrics`, { timeout: 8000 });
      setMlMetrics(res.data);
    } catch { setMlMetrics({}); }
  };

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage("Scanning...");
    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 30000 });
      setMessage("Scan done");
      setTimeout(() => fetchCoreData(), 1000);
      setTimeout(() => setMessage(""), 2000);
    } catch { setMessage("Failed"); setTimeout(() => setMessage(""), 2000); }
    finally { setScanning(false); }
  };

  const panicCloseAll = async () => {
    if (panicClosing || !window.confirm("PANIC CLOSE all positions?")) return;
    setPanicClosing(true);
    setPanicMessage("Executing...");
    try {
      const res = await axios.post(`${CORE_URL}/admin/force-close`, {}, { timeout: 30000 });
      setPanicMessage(res?.data?.message || "Done");
      setTimeout(() => fetchCoreData(), 1000);
    } catch (err: any) { setPanicMessage(`Failed: ${err.response?.data?.error || err.message}`); }
    finally { setPanicClosing(false); setTimeout(() => setPanicMessage(""), 8000); }
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
    } catch (err: any) { setAddMessage(`✗ ${err.response?.data?.error || 'Failed'}`); }
    finally { setAddingTickers(false); setTimeout(() => setAddMessage(''), 4000); }
  };

  const handleRemoveTickers = async () => {
    if (!removeTickerInput.trim()) return;
    setRemovingTickers(true);
    try {
      const res = await axios.post(`${CORE_URL}/admin/remove-ticker`, { symbols: removeTickerInput.trim().toUpperCase() });
      setRemoveMessage(`✓ ${res.data.message}`);
      setRemoveTickerInput('');
      fetchCoreData();
    } catch (err: any) { setRemoveMessage(`✗ ${err.response?.data?.error || 'Failed'}`); }
    finally { setRemovingTickers(false); setTimeout(() => setRemoveMessage(''), 4000); }
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
          }],
          options: {
            elements: { line: { borderWidth: 2 } },
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
          }
        };
        setRocketCharts(prev => ({ ...prev, [symbol]: chartData }));
      }
    } catch {}
  };

  const toggleRocketChart = (symbol: string) => {
    if (expandedRocket === symbol) setExpandedRocket(null);
    else { setExpandedRocket(symbol); fetchRocketChart(symbol); }
  };

  useEffect(() => {
    fetchCoreData();
    fetchMLMetrics();
    const interval = setInterval(() => { fetchCoreData(); fetchMLMetrics(); }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center text-cyan-400">
      <div className="text-center">
        <Activity className="w-12 h-12 animate-pulse mx-auto mb-4" />
        <p className="text-sm">Loading AlphaStream...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-screen bg-black flex items-center justify-center text-red-400">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p className="text-sm mb-4">{error}</p>
        <button onClick={fetchCoreData} className="px-4 py-2 bg-cyan-600 rounded text-xs">Retry</button>
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

  const totalExposure = positions.reduce((s: number, p: any) => s + (p.marketValue || 0), 0);
  const exposurePct = equity > 0 ? ((totalExposure / equity) * 100).toFixed(1) : "0.0";

  const rawUniverse: string[] = Array.isArray(core.universeSymbols) ? core.universeSymbols : [];
  const filteredUniverse = rawUniverse.filter(s => s.toLowerCase().includes(universeSearch.toLowerCase()));

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
    const colors = ["text-green-400 bg-green-900/60", "text-cyan-400 bg-cyan-900/60", "text-yellow-400 bg-yellow-900/40", "text-gray-400 bg-gray-800/60", "text-red-400 bg-red-900/60"];
    return { label: labels[action] || "HOLD", color: colors[action] || colors[2] };
  };

  const topSymbols = (mlMetrics.topSymbols || []).slice(0, 8);

  const exposureDoughnut = {
    labels: ['Exposure', 'Cash'],
    datasets: [{ data: [parseFloat(exposurePct), 100 - parseFloat(exposurePct)], backgroundColor: ['#00ffff', '#111'], borderWidth: 1, cutout: '75%' }]
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 text-xs overflow-hidden relative">
      <div className="fixed inset-0 opacity-5 pointer-events-none bg-gradient-to-br from-cyan-500/10 via-purple-600/5 to-pink-500/10" />
      <div className="fixed inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#00ffff0a_1px,transparent_1px),linear-gradient(to_bottom,#00ffff0a_1px,transparent_1px)] bg-[size:30px_30px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-black/90 border-b border-cyan-500/20 px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-cyan-400" />
          <h1 className="text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">ALPHASTREAM</h1>
          <button onClick={() => setShowUniverse(!showUniverse)} className="flex items-center gap-1 px-2 py-1 bg-cyan-900/30 rounded border border-cyan-700/50">
            <Globe className="w-3 h-3" /> {universeSize}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddForm(!showAddForm)} className="p-1.5 rounded bg-purple-900/40 border border-purple-600/50"><Plus className="w-4 h-4 text-purple-300" /></button>
          <button onClick={() => setShowRemoveForm(!showRemoveForm)} className="p-1.5 rounded bg-red-900/40 border border-red-600/50"><Minus className="w-4 h-4 text-red-300" /></button>
          <button onClick={panicCloseAll} disabled={panicClosing} className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-pink-700 rounded text-xs font-bold flex items-center gap-1">
            {panicClosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />} PANIC
          </button>
          <button onClick={forceScan} disabled={scanning} className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded text-xs font-bold flex items-center gap-1">
            {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} SCAN
          </button>
        </div>
      </header>

      {message && <div className="bg-gradient-to-r from-cyan-600/80 to-purple-600/80 py-1 text-center text-xs font-bold">{message}</div>}
      {panicMessage && <div className="bg-gradient-to-r from-red-600/90 to-pink-700/90 py-1 text-center text-xs font-bold">{panicMessage}</div>}

      {/* Add/Remove Forms */}
      {showAddForm && (
        <div className="px-2 py-1 bg-gray-900/80">
          <div className="flex gap-1">
            <input value={tickerInput} onChange={e => setTickerInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTickers()} placeholder="AAPL TSLA..." className="flex-1 px-2 py-1 bg-black/70 rounded border border-cyan-700/50 text-xs" />
            <button onClick={handleAddTickers} disabled={addingTickers} className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded text-xs">{addingTickers ? '...' : 'Add'}</button>
          </div>
          {addMessage && <p className="text-center text-xs mt-1">{addMessage}</p>}
        </div>
      )}
      {showRemoveForm && (
        <div className="px-2 py-1 bg-gray-900/80">
          <div className="flex gap-1">
            <input value={removeTickerInput} onChange={e => setRemoveTickerInput(e.target.value)} placeholder="TSLA..." className="flex-1 px-2 py-1 bg-black/70 rounded border border-red-700/50 text-xs" />
            <button onClick={handleRemoveTickers} disabled={removingTickers} className="px-3 py-1 bg-red-600 rounded text-xs">{removingTickers ? '...' : 'Remove'}</button>
          </div>
          {removeMessage && <p className="text-center text-xs mt-1">{removeMessage}</p>}
        </div>
      )}

      {/* Universe Modal */}
      {showUniverse && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowUniverse(false)}>
          <div className="bg-gray-900 border border-cyan-500/50 rounded p-3 max-w-lg w-full max-h-96" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-2">
              <h3 className="font-bold text-cyan-300">Universe ({universeSize})</h3>
              <input value={universeSearch} onChange={e => setUniverseSearch(e.target.value)} placeholder="Search..." className="px-2 py-1 bg-black/70 rounded text-xs" />
            </div>
            <div className="overflow-y-auto max-h-80 grid grid-cols-6 gap-1 text-xs font-mono">
              {filteredUniverse.map(s => <div key={s} className="bg-gray-800/50 rounded px-1 py-0.5 text-center border border-gray-700/50">{s}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-2 p-2 h-full">
        {/* Left Column */}
        <div className="space-y-2">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-900/80 border border-cyan-500/30 rounded p-2">
              <Wallet className="w-5 h-5 mx-auto text-cyan-400" />
              <p className="text-lg font-bold text-cyan-300">${equity.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Equity</p>
            </div>
            <div className="bg-gray-900/80 border border-green-500/30 rounded p-2">
              <DollarSign className="w-5 h-5 mx-auto text-green-400" />
              <p className="text-lg font-bold text-green-300">${buyingPower.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Power</p>
            </div>
            <div className="bg-gray-900/80 border rounded p-2">
              <Target className={`w-5 h-5 mx-auto ${realizedDailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              <p className={`text-lg font-bold ${realizedDailyPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {realizedDailyPnL >= 0 ? '+' : ''}${Math.abs(realizedDailyPnL).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">PnL</p>
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-4 gap-1 text-center text-xs">
            <div className={`p-1 rounded ${mlConnected ? 'bg-green-900/30 border-green-600/50' : 'bg-red-900/30 border-red-600/50'}`}>
              <Cpu className="w-4 h-4 mx-auto" /> {mlConnected ? 'ML ON' : 'ML OFF'}
            </div>
            <div className={`p-1 rounded ${lossLimitHit ? 'bg-red-900/30' : 'bg-green-900/30'}`}>
              <Shield className="w-4 h-4 mx-auto" /> {lossLimitHit ? 'BREACH' : 'SAFE'}
            </div>
            <div className="p-1 rounded bg-yellow-900/30">
              <Gauge className="w-4 h-4 mx-auto" /> {exposurePct}%
            </div>
            <div className="p-1 rounded bg-cyan-900/30">
              <Clock className="w-4 h-4 mx-auto" /> {lastUpdate}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-900/80 border border-cyan-500/30 rounded p-2">
              <div className="h-20"><Line data={equityChartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} /></div>
            </div>
            <div className="bg-gray-900/80 border border-purple-500/30 rounded p-2">
              <div className="h-20"><Line data={realizedPnLChartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} /></div>
            </div>
          </div>

          {/* Neural Core */}
          <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/30 rounded p-2">
            <div className="flex items-center gap-2 mb-1"><Brain className="w-4 h-4" /> <span className="font-bold text-purple-300 text-xs">Neural Core</span></div>
            <div className="grid grid-cols-4 gap-1 text-center text-xs">
              <div><div className="font-bold text-cyan-300">{mlMetrics.activeSymbols || 0}</div>Active</div>
              <div><div className="font-bold text-purple-300">{mlMetrics.memorySize || 0}</div>Memory</div>
              <div><div className="font-bold text-yellow-300">{mlMetrics.learningSteps || 0}</div>Steps</div>
              <div><div className="font-bold text-green-300">{(mlMetrics.eps || 0).toFixed(3)}</div>ε</div>
            </div>
          </div>

          {/* Positions */}
          <div className="bg-gray-900/80 border border-cyan-500/30 rounded p-2 max-h-32 overflow-y-auto">
            <div className="font-bold text-cyan-300 text-xs mb-1">Positions ({positions.length})</div>
            {positions.length === 0 ? <p className="text-center text-gray-600 text-xs">None</p> : (
              positions.map((p: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span>{p.symbol}</span>
                  <span>{p.qty} @ ${Number(p.avg_entry_price).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          {/* Rockets */}
          <div className="bg-gray-900/80 border border-cyan-500/30 rounded p-2 max-h-48 overflow-y-auto">
            <div className="font-bold text-cyan-300 text-xs mb-1 flex justify-between">
              <span>Hot Rockets ({rockets.length})</span>
              {rockets.length > 0 && <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />}
            </div>
            {rockets.length === 0 ? <p className="text-center text-gray-600 text-xs py-4">Scanning...</p> : (
              rockets.map((r: Rocket, i: number) => {
                const action = getActionDetails(r.mlAction);
                const flashing = flashRockets.has(r.symbol);
                return (
                  <div key={i} className={`p-1.5 rounded text-xs ${flashing ? 'bg-yellow-900/30 border border-yellow-400' : 'bg-gray-800/40'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-cyan-300">{r.symbol}</span>
                        <span className="ml-2 text-gray-400">+{r.gap}% • {r.mlConfidence}%</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${action.color}`}>{action.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Logs */}
          <div className="bg-gray-900/80 border border-cyan-500/30 rounded p-2 max-h-32 overflow-y-auto font-mono text-xs">
            <div className="font-bold text-cyan-300 mb-1">Log</div>
            {logs.map((l: string, i: number) => {
              const match = l.match(/\[(.*?)\] (.*)/);
              const time = match?.[1] || '';
              const msg = match?.[2] || l;
              const isEntry = msg.includes('ENTERED');
              const isExit = msg.includes('EXIT') || msg.includes('CLOSED');
              const isDense = msg.includes('DENSE');
              return (
                <div key={i} className={`py-0.5 ${isEntry ? 'text-green-400' : isExit ? 'text-red-400' : isDense ? 'text-purple-400' : ''}`}>
                  <span className="text-cyan-500">{time}</span> {msg}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
