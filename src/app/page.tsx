'use client';

import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Confetti from 'react-confetti';
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
  Bot
} from 'lucide-react';

// Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });

export default function Dashboard() {
  const [core, setCore] = useState<any>({});
  const [equityHistory, setEquityHistory] = useState<{ time: string; equity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [liveRockets, setLiveRockets] = useState<any[]>([]);
  const [flashRockets, setFlashRockets] = useState<Set<string>>(new Set());
  const [confettiRockets, setConfettiRockets] = useState<Set<string>>(new Set());

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 12000 });
      const data = res.data || {};
      const equity = Number(data.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore({
        ...data,
        mlConnected: data.mlConnected ?? false,
        universeSize: data.universeSize ?? (data.watchlist?.length || 0)
      });

      setEquityHistory(prev => [...prev, { time, equity }].slice(-30));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));
      setError(null);

      if (Array.isArray(data.rockets)) setLiveRockets(data.rockets);
    } catch (e) {
      console.error(e);
      setError("Cannot reach core service");
    } finally {
      setLoading(false);
    }
  };

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage("Scanning...");
    try {
      const res = await axios.post(`${CORE_URL}/scan`);
      setMessage("Triggered!");
      if (res.data?.rockets && Array.isArray(res.data.rockets)) {
        const newSymbols = res.data.rockets.map((r: any) => r.symbol);
        setFlashRockets(new Set(newSymbols));

        const buyStrongSymbols = res.data.rockets.filter((r: any) => r.mlAction === 0).map((r: any) => r.symbol);
        setConfettiRockets(new Set(buyStrongSymbols));
        setTimeout(() => setConfettiRockets(new Set()), 3000);

        setLiveRockets(res.data.rockets);
        setTimeout(() => setFlashRockets(new Set()), 2000);
      }
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setMessage("Failed");
      setTimeout(() => setMessage(""), 2500);
    } finally {
      setScanning(false);
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center gap-2 text-sm">
        <Activity className="w-5 h-5 animate-pulse" />
        <p>Connecting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-2 p-4 text-center text-sm">
        <AlertCircle className="w-6 h-6" />
        <p>{error}</p>
        <button onClick={fetchData} className="px-2 py-1 bg-cyan-600 rounded text-xs">
          Retry
        </button>
      </div>
    );
  }

  const positions = Array.isArray(core.positions) ? core.positions : [];
  const rockets = liveRockets || [];
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog : [];
  const pnl = Array.isArray(core.pnlAttribution) ? core.pnlAttribution : [];

  const equityChartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{
      data: equityHistory.map(d => d.equity),
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6,182,212,0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const getActionDetails = (action: number = 2, priority: boolean = false, confidence: number = 50) => {
    const labels = ["BUY STRONG", "BUY", "HOLD", "SKIP", "SELL"];
    const colors = ["text-green-400", "text-green-300", "text-yellow-400", "text-gray-400", "text-red-400"];
    return { label: labels[action] || "HOLD", color: colors[action] || "text-gray-400", confidence, isPriority: priority };
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'} relative text-sm`}>
      {Array.from(confettiRockets).length > 0 && <Confetti numberOfPieces={100} recycle={false} />}
      
      <div className="max-w-5xl mx-auto p-2">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-lg font-bold text-cyan-400">AlphaStream AI</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className={`${core.mlConnected ? 'text-green-400' : 'text-red-400'}`}>
              ML {core.mlConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
            {core.mlThrottle && <span className="text-yellow-400 ml-1 text-xs font-bold">ML THROTTLE ACTIVE</span>}
            <span className="text-gray-400">{lastUpdate}</span>
            <button onClick={() => setDarkMode(!darkMode)} className="p-1 rounded bg-gray-800">
              {darkMode ? <Sun className="w-3 h-3 text-yellow-400" /> : <Moon className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {message && <div className="mb-2 p-1 bg-cyan-900/50 border border-cyan-600 rounded text-center text-cyan-300 text-xs">{message}</div>}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3 text-xs">
          {[
            { icon: DollarSign, label: "Equity", value: core.equity },
            { icon: Wallet, label: "Buying Power", value: core.buyingPower },
            { icon: Zap, label: "Rockets", value: rockets.length },
            { icon: Globe, label: "Universe", value: core.universeSize },
            { icon: Bot, label: "ML Status", value: core.mlConnected ? "Online" : "Offline" },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-900/50 p-2 rounded border text-center">
              <stat.icon className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
              <div className="text-gray-400">{stat.label}</div>
              <div className="font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Equity Chart */}
        <div className="bg-gray-900/50 p-2 rounded border border-gray-700 mb-3 h-32">
          <Line data={equityChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false } } }} />
        </div>

        {/* Rockets / ML Heatmap */}
        <div className="mb-3 space-y-1">
          {rockets.map((r: any, i: number) => {
            const ml = getActionDetails(r.mlAction, r.mlPriority, r.mlConfidence);
            const flash = flashRockets.has(r.symbol);
            return (
              <div key={i} className={`bg-gray-900/60 p-1 rounded-lg border shadow-sm flex justify-between items-center ${flash ? 'animate-pulse border-purple-400' : 'border-purple-800'}`}>
                <div className="flex flex-col w-1/3">
                  <div className="font-bold">{r.symbol}</div>
                  <div className="text-gray-400 text-xs">Gap +{r.gap}% • RVOL {r.rvol} • ${r.price}</div>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className={`font-bold text-xs ${ml.color} w-16 truncate`}>{ml.label}</div>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-cyan-500" style={{ width: `${ml.confidence}%` }} />
                  </div>
                  <div className="text-gray-400 text-xs w-8 text-right">{ml.confidence}%</div>
                </div>
                {ml.isPriority && <div className="bg-green-900 text-green-300 text-xs px-2 py-0.5 rounded ml-2">HIGH PRIORITY</div>}
              </div>
            );
          })}
        </div>

        {/* PnL Attribution */}
        {pnl.length>0 && (
          <div className="mb-3 bg-gray-900/50 p-2 rounded border border-gray-700 text-xs">
            <div className="font-bold text-cyan-400 mb-1">PnL Attribution (Last 10)</div>
            <div className="grid grid-cols-5 gap-1">
              {pnl.slice(-10).map((p,i)=>(
                <div key={i} className="text-gray-200 truncate">
                  <span className="font-bold">{p.symbol}</span>: <span className={p.pnl>=0?'text-green-400':'text-red-400'}>{p.pnl.toFixed(2)}%</span> ({p.action})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Force Scan Button */}
        <button
          onClick={forceScan}
          disabled={scanning}
          className={`fixed bottom-2 left-1/2 -translate-x-1/2 w-11/12 max-w-sm py-2 rounded-full font-bold text-sm flex items-center justify-center gap-2 ${
            scanning ? 'bg-gray-700 text-gray-400' : 'bg-cyan-500 hover:bg-cyan-400 text-black'
          }`}
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {scanning ? "SCANNING..." : "FORCE SCAN"}
        </button>
      </div>
    </div>
  );
}
