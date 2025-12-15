'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';
import { RefreshCw, Zap, Activity, Loader2, Sun, Moon, AlertCircle, FileText } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
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
      const equity = Number(res.data.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore(res.data);
      setEquityHistory(prev => [...prev, { time, equity }].slice(-30));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));
      setError(null);
    } catch (e) {
      setError("Core service not responding — check GET / endpoint");
    } finally {
      setLoading(false);
    }
  };

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setMessage("Scanning...");
    try {
      await axios.post(`${CORE_URL}/scan`, {});
      setMessage("Scan triggered!");
      setTimeout(() => setMessage(""), 3000);
      fetchData();
    } catch {
      setMessage("Scan failed");
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setScanning(false);
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

  if (loading) return <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center gap-4"><Activity className="w-12 h-12 animate-pulse" /><p>Connecting...</p></div>;

  if (error || !core) return (
    <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <AlertCircle className="w-16 h-16" />
      <p className="text-lg">{error || "Core offline"}</p>
      <button onClick={fetchData} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 px-8 rounded-full">Retry</button>
    </div>
  );

  const positions = core.positions || [];
  const rockets = core.rockets || [];
  const logs = core.tradeLog || [];
  const watchlist = core.watchlist || [];

  const chartData = {
    labels: equityHistory.map(d => d.time),
    datasets: [{ data: equityHistory.map(d => d.equity), borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.15)', fill: true, tension: 0.4 }]
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>AlphaStream AI</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">{lastUpdate} ET</span>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-800 dark:bg-gray-200">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-gray-900/50 border border-gray-700 h-64">
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Equity", value: `$${Number(core.equity).toLocaleString()}` },
            { label: "Positions", value: positions.length },
            { label: "Rockets", value: rockets.length },
            { label: "Watchlist", value: watchlist.length },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-lg bg-gray-900/50 text-center">
              <div className="text-xs text-gray-400">{s.label}</div>
              <div className="font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* LIVE POSITIONS — NOW FIRST */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-cyan-400 flex items-center gap-2">
            <Activity className="w-5 h-5" /> Live Positions ({positions.length})
          </h2>
          {positions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-gray-900/50 rounded-xl">
              No open positions — waiting for next rocket
            </div>
          ) : (
            <div className="grid gap-3">
              {positions.map((p: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-gray-900/50 border border-gray-700 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-lg">{p.symbol}</div>
                    <div className="text-sm text-gray-400">Qty: {p.qty} @ Entry ${p.entry}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">${p.current}</div>
                    <div className={`${parseFloat(p.unrealized_plpc) >= 0 ? 'text-green-400' : 'text-red-400'} font-bold`}>
                      {p.unrealized_plpc}% P&L
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Watchlist */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2 text-cyan-400">Watchlist ({watchlist.length} tickers)</h2>
          <div className="p-4 bg-gray-900/50 rounded-xl text-sm overflow-x-auto">
            <div className="flex flex-wrap gap-2">
              {watchlist.map((t: string) => (
                <span key={t} className="px-3 py-1 bg-gray-800 rounded-full hover:bg-cyan-600 transition cursor-default" title={t}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Log */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-cyan-400 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Live Trade Log
          </h2>
          <div className="p-4 bg-gray-900/50 rounded-xl text-sm font-mono max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center">No activity yet</p>
            ) : (
              logs.map((l: any, i: number) => (
                <div key={i} className="py-1 border-b border-gray-800 last:border-0">
                  <span className="text-gray-500">{l.time}</span> {l.message}
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={forceScan}
          disabled={scanning}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-sm py-4 rounded-full font-bold text-lg shadow-2xl flex items-center justify-center gap-3 z-50 ${
            darkMode ? 'bg-cyan-500 hover:bg-cyan-400 text-black' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          {scanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
          {scanning ? "Scanning..." : "Force Scan"}
        </button>

        {message && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-green-600 text-white shadow-lg text-sm z-40">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}