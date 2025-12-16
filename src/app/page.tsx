'use client';

import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { RefreshCw, Zap, Brain, Activity, Loader2, Sun, Moon, AlertCircle, DollarSign } from 'lucide-react';

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center text-gray-500">Loading chart...</div>
});

export default function Dashboard() {
  const [core, setCore] = useState<any>({});
  const [ml, setML] = useState<any>({});
  const [equityHistory, setEquityHistory] = useState<{ time: string; equity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
  const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "https://alphastream-ml-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const [coreRes, mlRes] = await Promise.all([
        axios.get(CORE_URL, { timeout: 12000 }),
        axios.get(ML_URL, { timeout: 8000 }).catch(() => ({ data: null }))
      ]);

      const coreData = coreRes.data || {};
      const equity = Number(coreData.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore(coreData);
      setML(mlRes.data || {});
      setEquityHistory(prev => [...prev, { time, equity }].slice(-30));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Connection issue — retrying");
    } finally {
      setLoading(false);
    }
  };

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage("Scanning market...");
    try {
      await axios.post(`${CORE_URL}/scan`, {});
      setMessage("Scan triggered successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Scan failed");
      setTimeout(() => setMessage(""), 4000);
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
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (loading) return (
    <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center gap-4">
      <Activity className="w-12 h-12 animate-pulse" />
      <p className="text-xl">Connecting to AlphaStream AI...</p>
    </div>
  );

  if (error || !core) return (
    <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <AlertCircle className="w-16 h-16" />
      <p className="text-lg">{error || "Services offline"}</p>
      <button onClick={fetchData} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 px-8 rounded-full">
        Retry Connection
      </button>
    </div>
  );

  const positions = Array.isArray(core.positions) ? core.positions : [];
  const rockets = Array.isArray(core.rockets) ? core.rockets : [];
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog : Array.isArray(core.logs) ? core.logs : [];

  const equityChartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{
      label: 'Equity',
      data: equityHistory.map(d => d.equity),
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6,182,212,0.15)',
      fill: true,
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: { x: { display: false }, y: { display: true } }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'} transition-colors`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Your full UI here - same as your current code, but with safe PnL */}
        {/* ... header, stats, charts, rockets, positions with safe pnl ... */}
        {/* Positions example with fix */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-green-400 mb-4">Live Positions</h2>
          <div className="space-y-4">
            {positions.length > 0 ? positions.map((p: any, i: number) => {
              const pnl = Number(p.unrealized_plpc || p.pnlPct || 0);
              return (
                <div key={i} className="bg-gray-900 dark:bg-gray-100 p-4 rounded border border-green-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="font-bold text-xl">{p.symbol} ×{p.qty}</div>
                    <div className="text-sm text-gray-400">Entry: ${Number(p.entry || p.avg_entry_price || 0).toFixed(2)}</div>
                  </div>
                  <div className={`text-3xl font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
                  </div>
                </div>
              );
            }) : (
              <div className="text-gray-500 text-center py-8">No open positions</div>
            )}
          </div>
        </div>

        {/* Logs with safe render */}
        <div className="mb-20">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Execution Log</h2>
          <div className="bg-gray-900 dark:bg-gray-100 p-4 rounded-lg text-xs font-mono max-h-96 overflow-y-auto border border-gray-800">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              logs.slice(-20).reverse().map((l: any, i: number) => (
                <div key={i} className="py-2 border-b border-gray-800 last:border-0">
                  {typeof l === 'string' ? l : `${l.time || ''} ${l.message || ''}`}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Force Scan Button */}
        <button
          onClick={forceScan}
          disabled={scanning}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-md py-5 rounded-full font-bold text-xl shadow-2xl flex items-center justify-center gap-3 z-50 transition-all ${
            scanning ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-black'
          }`}
        >
          {scanning ? <Loader2 className="w-8 h-8 animate-spin" /> : <RefreshCw className="w-8 h-8" />}
          {scanning ? "SCANNING..." : "FORCE SCAN"}
        </button>
      </div>
    </div>
  );
}
