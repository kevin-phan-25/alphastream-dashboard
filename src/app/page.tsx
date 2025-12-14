'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Zap, Brain, TrendingUp, AlertCircle, Shield, Activity, Target, Loader2 } from 'lucide-react';

const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string>("");

  const fetchData = async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        axios.get(CORE_URL, { timeout: 12000 }),
        axios.get(ML_URL, { timeout: 10000 }).catch(() => ({ data: null }))
      ]);

      setCore(cRes.data);
      setML(mRes.data);
      setError(null);
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));
    } catch (e: any) {
      console.error("Fetch error:", e);
      setError("Services unreachable — retrying...");
    } finally {
      setLoading(false);
    }
  };

  const forceScan = async () => {
    setScanning(true);
    setScanMessage("Triggering scan...");
    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 10000 });
      setScanMessage("Scan triggered!");
      setTimeout(() => setScanMessage(""), 3000);
      await fetchData();
    } catch (err) {
      setScanMessage("Scan failed");
      setTimeout(() => setScanMessage(""), 5000);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex flex-col items-center justify-center gap-6 p-4">
        <Activity className="w-16 h-16 animate-pulse" />
        <div className="text-2xl text-center">Connecting to AlphaStream AI...</div>
      </div>
    );
  }

  if (error || !core) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-8 p-6 text-center">
        <AlertCircle className="w-24 h-24" />
        <div className="text-2xl">{error || "Core service unavailable"}</div>
        <button onClick={fetchData} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-4 px-10 rounded-full text-xl transition">
          Retry Connection
        </button>
      </div>
    );
  }

  const positionsArray = core.positions ? Object.entries(core.positions) : [];

  return (
    <div className="min-h-screen bg-black text-gray-300 pb-24">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400">AlphaStream AI Trader</h1>
          <div className="text-sm text-gray-500">Last update: {lastUpdate} ET</div>
        </div>

        {/* Top Stats Grid — Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {[
            { label: "Live Equity", value: `$${Number(core.equity || 0).toLocaleString()}`, icon: <Shield className="w-5 h-5" /> },
            { label: "Positions", value: `${positionsArray.length}/5`, icon: null },
            { label: "Rockets Today", value: core.rockets?.length || 0, icon: <Zap className="w-5 h-5" /> },
            { label: "Rainbow DQN", value: ml?.status || "Active", extra: ml?.steps ? `Steps: ${ml.steps.toLocaleString()}` : "", icon: <Brain className="w-5 h-5" /> },
            { label: "Daily Symbols", value: core.dailySymbols?.length || 0, icon: <Activity className="w-5 h-5" /> },
            { label: "Risk Level", value: core.risk ? `${(core.risk * 100).toFixed(2)}%` : "2.00%", icon: <Target className="w-5 h-5" /> }
          ].map((stat, i) => (
            <div key={i} className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
              <div className="text-gray-400 text-xs flex items-center justify-center gap-1 mb-2">
                {stat.icon && stat.icon}
                {stat.label}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
              {stat.extra && <div className="text-gray-500 text-xs mt-1">{stat.extra}</div>}
            </div>
          ))}
        </div>

        {/* Rockets */}
        <div className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-3">
            <Zap className="w-7 h-7" /> Today's Rockets ({core.rockets?.length || 0})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {core.rockets?.length > 0 ? core.rockets.map((r: any, i: number) => (
              <div key={i} className="bg-gray-900 p-4 rounded-xl border border-yellow-600 text-center hover:border-yellow-400 transition">
                <div className="font-bold text-white text-base sm:text-lg">{r.symbol}</div>
                <div className="text-yellow-400 font-bold text-xl sm:text-2xl mt-1">+{r.gap}%</div>
              </div>
            )) : (
              <div className="col-span-full text-center py-12 text-gray-500 text-base sm:text-lg bg-gray-900 rounded-xl border border-gray-800">
                No gappers ≥20% today — market quiet
              </div>
            )}
          </div>
        </div>

        {/* Live Positions */}
        <div className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-green-400 mb-4 flex items-center gap-3">
            <TrendingUp className="w-7 h-7" /> Live Positions
          </h2>
          {positionsArray.length > 0 ? (
            <div className="space-y-4">
              {positionsArray.map(([symbol, p]: any) => {
                const pnlPct = p.entry && p.current ? ((p.current - p.entry) / p.entry) * 100 : 0;
                return (
                  <div key={symbol} className="bg-gray-900 p-5 rounded-xl border border-green-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="font-bold text-white text-xl sm:text-2xl">{symbol} ×{p.qty || 0}</div>
                      <div className="text-gray-400 text-sm">
                        Entry: ${Number(p.entry || 0).toFixed(2)} → Current: ${Number(p.current || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className={`text-3xl sm:text-4xl font-bold ${pnlPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 text-base sm:text-lg bg-gray-900 rounded-xl border border-gray-800">
              No open positions — Rainbow DQN waiting for high-confidence signals
            </div>
          )}
        </div>

        {/* Recent Logs */}
        <div className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-400 mb-4">Recent Logs</h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 max-h-80 overflow-y-auto text-xs sm:text-sm font-mono text-gray-300">
            {core.logs?.length > 0 ? core.logs.map((log: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0 break-words">
                {log}
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">No logs yet</div>
            )}
          </div>
        </div>

        {/* Force Scan Button */}
        <button
          onClick={forceScan}
          disabled={scanning}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 w-11/12 max-w-md sm:w-auto bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-black font-bold py-5 px-10 rounded-full flex items-center justify-center gap-3 shadow-2xl transition transform hover:scale-105 z-50 text-lg"
        >
          {scanning ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <RefreshCw className="w-8 h-8" />
          )}
          {scanning ? "Scanning..." : "Force Scan Now"}
        </button>

        {/* Scan Message */}
        {scanMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-800 text-white px-6 py-3 rounded-full shadow-lg text-sm z-40">
            {scanMessage}
          </div>
        )}
      </div>
    </div>
  );
}
