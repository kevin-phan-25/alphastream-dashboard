'use client';

import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { RefreshCw, Zap, Activity, Loader2, Sun, Moon, AlertCircle, DollarSign, Wallet } from 'lucide-react';

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), {
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-gray-500 text-sm">Loading...</div>
});

export default function Dashboard() {
  const [core, setCore] = useState<any>({});
  const [equityHistory, setEquityHistory] = useState<{ time: string; equity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 12000 });
      const data = res.data || {};
      const equity = Number(data.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore(data);
      setEquityHistory(prev => [...prev, { time, equity }].slice(-30));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));
      setError(null);
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
    setMessage("Triggering scan...");
    try {
      await axios.post(`${CORE_URL}/scan`);
      setMessage("Scan triggered!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Scan failed");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setScanning(false);
      fetchData(); // Refresh data after scan
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center gap-3">
        <Activity className="w-8 h-8 animate-pulse" />
        <p className="text-lg">Connecting to AlphaStream...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle className="w-12 h-12" />
        <p className="text-lg">{error}</p>
        <button onClick={fetchData} className="px-5 py-2 bg-cyan-600 rounded-lg text-sm font-medium">
          Retry
        </button>
      </div>
    );
  }

  const positions = Array.isArray(core.positions) ? core.positions : [];
  const rockets = Array.isArray(core.rockets) ? core.rockets : [];
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog : [];

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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'} transition-colors`}>
      <div className="max-w-5xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-cyan-400">AlphaStream AI</h1>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500">{lastUpdate}</span>
            <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 rounded bg-gray-800">
              {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-cyan-900/50 border border-cyan-600 rounded text-center text-cyan-300 text-sm">
            {message}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/50 p-4 rounded border border-cyan-700 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-1 text-cyan-400" />
            <div className="text-xs text-gray-400">Equity</div>
            <div className="text-lg font-bold">${Number(core.equity || 0).toLocaleString()}</div>
          </div>
          <div className="bg-gray-900/50 p-4 rounded border border-purple-700 text-center">
            <Wallet className="w-6 h-6 mx-auto mb-1 text-purple-400" />
            <div className="text-xs text-gray-400">Buying Power</div>
            <div className="text-lg font-bold">${Number(core.buyingPower || 0).toLocaleString()}</div>
          </div>
          <div className="bg-gray-900/50 p-4 rounded border border-green-700 text-center">
            <Zap className="w-6 h-6 mx-auto mb-1 text-green-400" />
            <div className="text-xs text-gray-400">Rockets</div>
            <div className="text-lg font-bold text-green-400">{rockets.length}</div>
          </div>
          <div className="bg-gray-900/50 p-4 rounded border border-yellow-700 text-center">
            <Brain className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
            <div className="text-xs text-gray-400">Positions</div>
            <div className="text-lg font-bold text-yellow-400">{positions.length}</div>
          </div>
        </div>

        {/* Equity Chart */}
        <div className="bg-gray-900/50 p-4 rounded border border-gray-700 mb-6">
          <h2 className="text-base font-bold text-cyan-400 mb-3">Equity Curve</h2>
          <div className="h-48">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-500 text-sm">Loading...</div>}>
              <Line data={equityChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false } } }} />
            </Suspense>
          </div>
        </div>

        {/* Rockets */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-yellow-400 mb-3">Today's Rockets ({rockets.length})</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {rockets.length > 0 ? rockets.map((r: any, i: number) => (
              <div key={i} className="bg-gray-900/50 p-4 rounded border border-yellow-600 text-center">
                <div className="font-medium text-sm">{r.symbol}</div>
                <div className="text-2xl text-yellow-400 font-bold">+{r.gap}%</div>
              </div>
            )) : <div className="col-span-full text-center text-gray-500 py-8 text-sm">No gappers</div>}
          </div>
        </div>

        {/* Positions */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-green-400 mb-3">Live Positions ({positions.length})</h2>
          <div className="space-y-3">
            {positions.length > 0 ? positions.map((p: any, i: number) => {
              const pnl = Number(p.unrealized_plpc || 0);
              return (
                <div key={i} className="bg-gray-900/50 p-3 rounded border border-green-700 flex justify-between items-center text-sm">
                  <div>
                    <div className="font-bold">{p.symbol} ×{p.qty}</div>
                    <div className="text-gray-400">Entry: ${Number(p.entry || p.avg_entry_price || 0).toFixed(2)}</div>
                  </div>
                  <div className={`text-xl font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
                  </div>
                </div>
              );
            }) : <div className="text-center text-gray-500 py-8 text-sm">No positions</div>}
          </div>
        </div>

        {/* Logs */}
        <div className="mb-16">
          <h2 className="text-base font-bold text-cyan-400 mb-3">Execution Log</h2>
          <div className="bg-gray-900/50 p-3 rounded text-xs font-mono max-h-64 overflow-y-auto border border-gray-800">
            {logs.length === 0 ? (
              <p className="text-center text-gray-500 py-6">No activity</p>
            ) : (
              logs.slice(-15).reverse().map((l: any, i: number) => (
                <div key={i} className="py-1.5 border-b border-gray-800 last:border-0">
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
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-10/12 max-w-xs py-3 rounded-full font-bold text-lg flex items-center justify-center gap-2 shadow-lg z-50 transition-all ${
            scanning ? 'bg-gray-700 text-gray-400' : 'bg-cyan-500 hover:bg-cyan-400 text-black'
          }`}
        >
          {scanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
          {scanning ? "SCANNING" : "FORCE SCAN"}
        </button>
      </div>
    </div>
  );
}
