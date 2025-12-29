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

export default function Dashboard() {
  const [core, setCore] = useState<any>({});
  const [equityHistory, setEquityHistory] = useState<any[]>([]);
  const [realizedPnLHistory, setRealizedPnLHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  // 🔴 PANIC CLOSE ADDITION
  const [panicClosing, setPanicClosing] = useState(false);

  const CORE_URL =
    process.env.NEXT_PUBLIC_CORE_URL ||
    "https://alphastream-core-1017433009054.us-east1.run.app";

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
      setLastUpdate(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "America/New_York",
          hour: "2-digit",
          minute: "2-digit"
        })
      );

      setError(null);
    } catch {
      setError("Cannot reach AlphaStream Core — retrying...");
    } finally {
      setLoading(false);
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
    } catch {
      setMessage("Scan failed");
    } finally {
      setTimeout(() => setMessage(""), 2500);
      setScanning(false);
    }
  };

  // 🔴 PANIC CLOSE HANDLER (ADDITIVE ONLY)
  const panicCloseAll = async () => {
    if (panicClosing) return;

    const confirmed = confirm(
      "⚠️ PANIC CLOSE\n\nThis will CLOSE ALL POSITIONS immediately.\n\nContinue?"
    );
    if (!confirmed) return;

    setPanicClosing(true);
    setMessage("⚠️ PANIC CLOSING ALL POSITIONS...");

    try {
      await axios.post(`${CORE_URL}/admin/force-close`, {}, { timeout: 20000 });
      setMessage("✅ ALL POSITIONS CLOSED");
      setTimeout(() => fetchCoreData(), 1500);
    } catch {
      setMessage("❌ PANIC CLOSE FAILED");
    } finally {
      setTimeout(() => setMessage(""), 3000);
      setPanicClosing(false);
    }
  };

  useEffect(() => {
    fetchCoreData();
    const interval = setInterval(fetchCoreData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center">
        <Activity className="w-10 h-10 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex items-center justify-center">
        <AlertCircle className="w-10 h-10" />
        <p className="ml-3">{error}</p>
      </div>
    );
  }

  const equity = Number(core.equity || 0);
  const buyingPower = Number(core.buyingPower || 0);
  const realizedDailyPnL = Number(core.realizedDailyPnL || 0);
  const positions = Array.isArray(core.positions) ? core.positions : [];

  return (
    <div className="min-h-screen bg-black text-gray-100">

      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/90 border-b border-cyan-500/30">
        <div className="px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AlphaStream
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={forceScan}
              disabled={scanning}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-purple-600 rounded font-bold text-xs flex items-center gap-1.5"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              SCAN
            </button>

            {/* 🔴 PANIC CLOSE BUTTON — ADDED */}
            <button
              onClick={panicCloseAll}
              disabled={panicClosing}
              className="px-4 py-1.5 bg-red-700 hover:bg-red-600 border border-red-400 rounded font-bold text-xs flex items-center gap-1.5 animate-pulse"
            >
              {panicClosing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "☠ PANIC CLOSE"
              )}
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="bg-gradient-to-r from-red-900/80 to-purple-900/80 py-2 text-center text-xs font-bold animate-pulse">
          {message}
        </div>
      )}

      {/* ACCOUNT BAR */}
      <div className="px-3 py-2 border-b border-cyan-900/30 bg-black text-xs flex justify-between">
        <div className="flex gap-4">
          <div>
            <Wallet className="inline w-4 h-4 text-cyan-400" /> ${equity.toFixed(0)}
          </div>
          <div>
            <DollarSign className="inline w-4 h-4 text-green-400" /> ${buyingPower.toFixed(0)}
          </div>
          <div>
            <Target className={`inline w-4 h-4 ${realizedDailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            {realizedDailyPnL >= 0 ? '+' : ''}${realizedDailyPnL.toFixed(0)}
          </div>
        </div>
        <div className="opacity-70">{lastUpdate} ET</div>
      </div>

      {/* POSITIONS */}
      <div className="px-3 py-4">
        <h3 className="font-bold text-cyan-300 mb-2">
          Positions ({positions.length})
        </h3>
        {positions.length === 0 ? (
          <p className="text-gray-500">No open positions</p>
        ) : (
          <div className="space-y-2">
            {positions.map((pos: any, i: number) => (
              <div
                key={i}
                className="bg-gray-800/60 rounded p-2 flex justify-between text-xs"
              >
                <span className="font-bold">{pos.symbol}</span>
                <span>
                  {pos.qty} @ ${Number(pos.avg_entry_price).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
