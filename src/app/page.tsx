'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Zap, Brain, TrendingUp, AlertCircle, Shield, Activity } from 'lucide-react';

const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchData = async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        axios.get(CORE_URL, { timeout: 12000 }),
        axios.get(ML_URL, { timeout: 12000 }).catch(() => ({ data: null }))
      ]);

      setCore(cRes.data);
      setML(mRes.data);
      setError(null);
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));
    } catch (e: any) {
      console.error("Fetch error:", e);
      setError("Services unreachable — check Cloud Run status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center text-2xl flex-col gap-6">
        <Activity className="w-12 h-12 animate-pulse" />
        <div>Initializing AlphaStream AI...</div>
      </div>
    );
  }

  if (error || !core) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex items-center justify-center text-xl flex-col gap-8 px-6 text-center">
        <AlertCircle className="w-20 h-20" />
        <div>{error || "Core service down"}</div>
        <button onClick={fetchData} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-4 px-10 rounded-full transition">
          Retry Connection
        </button>
      </div>
    );
  }

  const positionsArray = core.positions ? Array.from(Object.entries(core.positions)) : [];

  return (
    <div className="min-h-screen bg-black text-gray-300 p-6 pb-32">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400">AlphaStream AI Trader</h1>
          <div className="text-sm text-gray-500">Last update: {lastUpdate} ET</div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          <div className="bg-gray-900 p-6 rounded-xl border border-purple-700">
            <div className="text-gray-400 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" /> Live Equity
            </div>
            <div className="text-4xl font-bold text-white mt-2">
              ${Number(core.equity || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-500 mt-1">Peak: ${Number(core.peakEquity || 0).toLocaleString()}</div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-green-700">
            <div className="text-gray-400 text-sm">Open Positions</div>
            <div className="text-4xl font-bold text-green-400 mt-2">{positionsArray.length}/5</div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-yellow-700">
            <div className="text-gray-400 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" /> Today's Rockets
            </div>
            <div className="text-4xl font-bold text-yellow-400 mt-2">{core.rockets?.length || 0}</div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-cyan-700">
            <div className="text-gray-400 text-sm flex items-center gap-2">
              <Brain className="w-4 h-4" /> Rainbow DQN Status
            </div>
            <div className="text-2xl font-bold text-cyan-400 mt-2">
              {ml?.status || "Active"}
            </div>
            {ml?.steps !== undefined && (
              <div className="text-sm text-gray-500 mt-1">
                Steps: {ml.steps.toLocaleString()}
              </div>
            )}
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-pink-700">
            <div className="text-gray-400 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" /> Daily Symbols
            </div>
            <div className="text-2xl font-bold text-pink-400 mt-2">{core.dailySymbols?.length || 0}</div>
          </div>
        </div>

        {/* Rockets Grid */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
            <Zap className="w-8 h-8" /> Today's Rockets ({core.rockets?.length || 0})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {core.rockets?.length > 0 ? core.rockets.map((r: any, i: number) => (
              <div key={i} className="bg-gray-900 p-5 rounded-xl border border-yellow-600 text-center hover:border-yellow-400 transition">
                <div className="font-bold text-white text-xl">{r.symbol}</div>
                <div className="text-3xl text-yellow-400 font-bold mt-2">+{r.gap}%</div>
              </div>
            )) : (
              <div className="col-span-full text-center py-16 text-gray-500 text-xl bg-gray-900 rounded-xl">
                No gappers ≥20% today — market quiet
              </div>
            )}
          </div>
        </div>

        {/* Live Positions */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-3">
            <TrendingUp className="w-8 h-8" /> Live Positions
          </h2>
          {positionsArray.length > 0 ? (
            <div className="space-y-5">
              {positionsArray.map(([symbol, p]: any, idx: number) => {
                const pnlPct = p.entry && p.current ? ((p.current - p.entry) / p.entry) * 100 : 0;
                return (
                  <div key={symbol} className="bg-gray-900 p-6 rounded-xl border border-green-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <div className="font-bold text-white text-2xl">{symbol} ×{p.qty || 0}</div>
                      <div className="text-gray-400 mt-1">
                        Entry: ${Number(p.entry || 0).toFixed(2)} → Current: ${Number(p.current || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className={`text-4xl font-bold ${pnlPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 text-xl bg-gray-900 rounded-xl border border-gray-800">
              No open positions — Rainbow DQN waiting for high-confidence gappers
            </div>
          )}
        </div>

        {/* Force Scan */}
        <button
          onClick={() => {
            axios.post(`${CORE_URL}/scan`)
              .then(() => fetchData())
              .catch(() => alert("Scan failed — check core service"));
          }}
          className="fixed bottom-10 right-10 bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-6 px-12 rounded-full flex items-center gap-4 shadow-2xl transition transform hover:scale-110 z-50 text-xl"
        >
          <RefreshCw className="w-8 h-8" />
          Force Scan Now
        </button>
      </div>
    </div>
  );
}
