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

const Line = dynamic(() => import('react-chartjs-2').then(m => m.Line), {
  ssr: false,
  loading: () => <div className="h-24 flex items-center justify-center text-xs text-gray-500">Loading chart…</div>
});

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

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

// ─────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────

export default function Dashboard() {
  const [core, setCore] = useState<any>({});
  const [equityHistory, setEquityHistory] = useState<{ time: string; equity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState('');
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [liveRockets, setLiveRockets] = useState<Rocket[]>([]);
  const [flashRockets, setFlashRockets] = useState<Set<string>>(new Set());
  const [expandedRocket, setExpandedRocket] = useState<string | null>(null);
  const [rocketCharts, setRocketCharts] = useState<Record<string, ChartData>>({});

  // Manual Ticker Add States
  const [showAddTicker, setShowAddTicker] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [addSecret, setAddSecret] = useState('');
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState('');

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || 'https://alphastream-core-1017433009054.us-east1.run.app';
  const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;

  // ─────────────────────────────────────────
  // CORE FETCH
  // ─────────────────────────────────────────

  const fetchData = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 15000 });
      const data = res.data || {};

      const equityValue = Number(data.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore(data);
      setEquityHistory(prev => [...prev, { time, equity: equityValue }].slice(-30));
      setLastUpdate(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }));

      if (Array.isArray(data.rockets)) {
        const syms = data.rockets.map((r: Rocket) => r.symbol);
        setFlashRockets(new Set(syms));
        setTimeout(() => setFlashRockets(new Set()), 2500);
        setLiveRockets(data.rockets);
      } else {
        setLiveRockets([]);
      }

      setError(null);
    } catch (e) {
      setError('Cannot reach AlphaStream Core — retrying…');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // SCAN BUTTON
  // ─────────────────────────────────────────

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage('Triggering scan…');

    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 20000 });
    } catch {
      try {
        await axios.get(`${CORE_URL}/scan`, { timeout: 20000 });
      } catch {
        setMessage('Scan endpoint not responding');
        setScanning(false);
        return;
      }
    }

    setMessage('Scan triggered');
    setTimeout(fetchData, 1200);
    setTimeout(() => setMessage(''), 3000);
    setScanning(false);
  };

  // ─────────────────────────────────────────
  // MANUAL TICKER ADD
  // ─────────────────────────────────────────

  const handleAddTicker = async () => {
    if (!tickerInput.trim() || !addSecret.trim()) return;
    setAdding(true);
    setAddResult('');

    try {
      const res = await axios.post(`${CORE_URL}/admin/add-ticker`, {
        secret: addSecret,
        symbols: tickerInput.trim().toUpperCase()
      }, { timeout: 10000 });

      setAddResult(`Success: ${res.data.message}`);
      setTickerInput('');
      setTimeout(fetchData, 1000); // Refresh data
    } catch (err: any) {
      setAddResult(`Error: ${err.response?.data?.error || err.message || 'Failed'}`);
    } finally {
      setAdding(false);
      setTimeout(() => setAddResult(''), 5000);
    }
  };

  // ─────────────────────────────────────────
  // ROCKET CHART
  // ─────────────────────────────────────────

  const fetchRocketChart = async (symbol: string) => {
    if (rocketCharts[symbol] || !FINNHUB_KEY) return;

    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - 6 * 60 * 60;

      const res = await axios.get(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=1&from=${start}&to=${end}&token=${FINNHUB_KEY}`
      );

      if (res.data?.s === 'ok') {
        setRocketCharts(prev => ({
          ...prev,
          [symbol]: {
            labels: res.data.t.map((t: number) => new Date(t * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            datasets: [{
              data: res.data.c,
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6,182,212,0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 0
            }]
          }
        }));
      }
    } catch {}
  };

  const toggleRocketChart = (symbol: string) => {
    setExpandedRocket(prev => prev === symbol ? null : symbol);
    fetchRocketChart(symbol);
  };

  // ─────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 15000);
    return () => clearInterval(i);
  }, []);

  // ─────────────────────────────────────────
  // DERIVED
  // ─────────────────────────────────────────

  const equity = Number(core.equity || 0);
  const buyingPower = Number(core.buyingPower || 0);
  const dailyDrawdown = Number(core.dailyDrawdown || 0);
  const dailyDrawdownPct = dailyDrawdown !== 0
    ? ((Math.abs(dailyDrawdown) / (equity - dailyDrawdown)) * 100).toFixed(1)
    : '0.0';

  const mlConnected = core.mlHealthy === true;
  const afterHoursQueue = Array.isArray(core.afterHoursQueue) ? core.afterHoursQueue : [];
  const positions = Array.isArray(core.positions) ? core.positions : [];
  const rockets = liveRockets.length ? liveRockets : Array.isArray(core.rockets) ? core.rockets : [];
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog.slice().reverse() : [];

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-cyan-400">
        <Activity className="w-8 h-8 animate-pulse" />
        <p>Connecting to AlphaStream Core…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-red-400 gap-4">
        <AlertCircle className="w-8 h-8" />
        <p>{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-cyan-600 rounded">Retry</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 overflow-hidden">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-black/80 border-b border-cyan-900/40">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-cyan-400" />
            <span className="font-bold">AlphaStream</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddTicker(!showAddTicker)} className="p-1">
              <Plus className="w-5 h-5 text-cyan-400" />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-1">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={forceScan} disabled={scanning} className="px-3 py-1 bg-cyan-600 rounded text-sm flex items-center gap-1">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Scan
            </button>
          </div>
        </div>
      </header>

      {/* ADD TICKER FORM */}
      {showAddTicker && (
        <div className="mx-3 mt-3 p-4 bg-gray-900 rounded border border-cyan-800">
          <h3 className="text-sm font-bold mb-2">Add Tickers Manually</h3>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              placeholder="e.g. GME AMC NVDA (space separated)"
              className="px-3 py-2 bg-black border border-gray-700 rounded text-sm"
            />
            <input
              type="password"
              value={addSecret}
              onChange={(e) => setAddSecret(e.target.value)}
              placeholder="Dashboard secret"
              className="px-3 py-2 bg-black border border-gray-700 rounded text-sm"
            />
            <button
              onClick={handleAddTicker}
              disabled={adding || !tickerInput || !addSecret}
              className="px-4 py-2 bg-cyan-600 rounded text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Ticker(s)
            </button>
            {addResult && <p className={`text-xs ${addResult.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{addResult}</p>}
          </div>
        </div>
      )}

      {/* STATUS */}
      <div className="grid grid-cols-2 gap-3 my-3 px-3 text-xs">
        <div className={`p-3 rounded border ${mlConnected ? 'border-green-600' : 'border-red-600'}`}>
          ML: <b>{mlConnected ? 'ONLINE' : 'OFFLINE'}</b>
        </div>
        <div className="p-3 rounded border border-cyan-700">
          Equity: <b>${equity.toFixed(0)}</b>
        </div>
      </div>

      {/* ROCKETS */}
      <div className="space-y-3 px-3">
        {rockets.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">No rockets detected</p>
        ) : (
          rockets.map((r: Rocket) => (
            <div key={r.symbol} className="border border-gray-700 rounded overflow-hidden">
              <div onClick={() => toggleRocketChart(r.symbol)} className="p-3 flex justify-between cursor-pointer hover:bg-gray-900">
                <div>
                  <b className="text-cyan-400">{r.symbol}</b>
                  <div className="text-xs opacity-80">
                    +{Number(r.gap).toFixed(1)}% • RVOL {r.rvol ? Number(r.rvol).toFixed(2) : '–'} • Conf: {r.mlConfidence}%
                  </div>
                </div>
                {expandedRocket === r.symbol ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              {expandedRocket === r.symbol && rocketCharts[r.symbol] && (
                <div className="h-40 bg-black px-2 pb-2">
                  <Line data={rocketCharts[r.symbol]} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true } }, scales: { x: { display: false }, y: { display: false } } }} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MESSAGE */}
      {message && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-cyan-900 rounded text-sm">
          {message}
        </div>
      )}
    </div>
  );
}
