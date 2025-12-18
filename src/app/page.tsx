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

  // Add Ticker States
  const [showAddForm, setShowAddForm] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [addingTickers, setAddingTickers] = useState(false);
  const [addMessage, setAddMessage] = useState('');

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
  // SCAN BUTTON — ROBUST
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
  // ADD TICKERS
  // ─────────────────────────────────────────
  const handleAddTickers = async () => {
    if (!tickerInput.trim() || !secretInput.trim()) {
      setAddMessage('Please fill both fields');
      return;
    }
    setAddingTickers(true);
    setAddMessage('');
    try {
      const response = await axios.post(
        `${CORE_URL}/admin/add-ticker`,
        {
          secret: secretInput.trim(),
          symbols: tickerInput.trim()
        },
        { timeout: 10000 }
      );
      setAddMessage(`Success: ${response.data.message}`);
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

  // ─────────────────────────────────────────
  // ROCKET CHART
  // ─────────────────────────────────────────
  const fetchRocketChart = async (symbol: string) => {
    if (rocketCharts[symbol] || !FINNHUB_KEY) return;
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - 6 * 60 * 60; // 6 hours
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
  const universeSize = core.universeSize || 0;
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
            <span className="text-xs opacity-70">({universeSize})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-2 rounded hover:bg-gray-800 transition"
            >
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
      {showAddForm && (
        <div className="mx-3 mt-3 p-4 bg-gray-900 rounded-lg border border-cyan-800">
          <h3 className="text-sm font-bold mb-3 text-cyan-400">Add Tickers Manually</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              placeholder="GME AMC NVDA (space separated)"
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-sm"
            />
            <input
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="Secret (from DASHBOARD_SECRET)"
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-sm"
            />
            <button
              onClick={handleAddTickers}
              disabled={addingTickers}
              className="w-full py-2 bg-cyan-600 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {addingTickers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Ticker(s)
            </button>
            {addMessage && (
              <p className={`text-xs text-center ${addMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {addMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* STATUS */}
      <div className="grid grid-cols-2 gap-3 my-3 text-xs px-3">
        <div className={`p-3 rounded border ${mlConnected ? 'border-green-600' : 'border-red-600'}`}>
          ML: <b>{mlConnected ? 'ONLINE' : 'OFFLINE'}</b>
        </div>
        <div className="p-3 rounded border border-cyan-700">
          Equity: <b>${equity.toFixed(0)}</b>
        </div>
      </div>

      {/* ROCKETS */}
      <div className="space-y-3 px-3 pb-24">
        {rockets.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No rockets detected yet</p>
            <p className="text-xs mt-2">Try scanning or wait for market open</p>
          </div>
        ) : (
          rockets.map((r: Rocket) => (
            <div
              key={r.symbol}
              className={`border rounded transition-all ${
                flashRockets.has(r.symbol) ? 'border-yellow-400 bg-yellow-900/20' : 'border-gray-700'
              }`}
            >
              <div
                onClick={() => toggleRocketChart(r.symbol)}
                className="p-3 flex justify-between cursor-pointer hover:bg-gray-900 transition"
              >
                <div>
                  <b className="text-lg">{r.symbol}</b>
                  <div className="text-xs opacity-80">
                    +{r.gap}% • RVOL {r.rvol || '–'} • Conf: {r.mlConfidence}%
                    {r.mlPriority && <span className="text-yellow-400 ml-2">⚡ PRIORITY</span>}
                  </div>
                </div>
                {expandedRocket === r.symbol ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              {expandedRocket === r.symbol && rocketCharts[r.symbol] && (
                <div className="h-40 px-2 pb-2">
                  <Line
                    data={rocketCharts[r.symbol]}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false }, tooltip: { enabled: false } },
                      scales: { x: { display: false }, y: { display: false } }
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* BOTTOM MESSAGE */}
      {message && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-cyan-900/90 rounded-full text-sm backdrop-blur">
          {message}
        </div>
      )}
    </div>
  );
}
