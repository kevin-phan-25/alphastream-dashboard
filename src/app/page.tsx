'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Zap, Brain, TrendingUp, AlertCircle } from 'lucide-react';

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
        axios.get(CORE_URL, { timeout: 10000 }),
        axios.get(ML_URL, { timeout: 10000 })
      ]);

      setCore(cRes.data);
      setML(mRes.data);
      setError(null);
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));
    } catch (e: any) {
      console.error("Fetch error:", e);
      const msg = e.code === 'ERR_NETWORK' || e.response?.status >= 500
        ? "Services temporarily unreachable"
        : "Invalid response from services";
      setError(msg + " — " + (e.message || "Check connection"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000); // Every 12 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center text-2xl flex-col gap-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <div>Loading AlphaStream...</div>
      </div>
    );
  }

  if (error || !core || !ml) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex items-center justify-center text-xl flex-col gap-6 px-6 text-center">
        <AlertCircle className="w-16 h-16" />
        <div>{error || "Core or ML service returned invalid data"}</div>
        <button
          onClick={fetchData}
          className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 px-8 rounded-full transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Safely extract positions (supports tuple format [[symbol, data]] or plain array)
  const positions = Array.isArray(core.positions) ? core.positions : [];

  return (
    <div className="min-h-screen bg-black text-gray-300 p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cyan-400">AlphaStream AI Trader</h1>
          <div className="text-sm text-gray-500">Last update: {lastUpdate} ET</div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg border border-purple-700">
            <div className="text-gray-400 text-sm">Live Equity</div>
            <div className="text-4xl font-bold text-white">
              ${Number(core.equity || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-green-700">
            <div className="text-gray-400 text-sm">Open Positions</div>
            <div className="text-4xl font-bold text-green-400">{positions.length}/5</div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-purple-700">
            <div className="text-gray-400 text-sm">ML Memory</div>
            <div className="text-2xl font-bold text-purple-400">{ml.trackedSymbols || 0} symbols</div>
          </div>
        </div>

        {/* Rockets */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6" /> Today's Rockets ({core.rockets?.length || 0})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {core.rockets?.length > 0 ? core.rockets.map((r: any, i: number) => (
              <div key={i} className="bg-gray-900 p-4 rounded border border-yellow-600 text-center">
                <div className="font-bold text-white text-lg">{r.symbol}</div>
                <div className="text-2xl text-yellow-400 font-bold">+{r.gap}%</div>
              </div>
            )) : (
              <div className="text-gray-500 col-span-full text-center py-12 text-lg">
                No stocks gapping ≥20% today
              </div>
            )}
          </div>
        </div>

        {/* Live Positions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" /> Live Positions
          </h2>
          {positions.length > 0 ? (
            <div className="space-y-4">
              {positions.map((item: any, idx: number) => {
                const symbol = typeof item[0] === 'string' ? item[0] : item.symbol || `Position ${idx + 1}`;
                const p = typeof item[0] === 'string' ? item[1] : item;
                const pnlPct = p.entry ? ((p.current - p.entry) / p.entry) * 100 : 0;

                return (
                  <div key={symbol} className="bg-gray-900 p-5 rounded-lg border border-green-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="font-bold text-white text-xl">{symbol} ×{p.qty || 0}</div>
                      <div className="text-sm text-gray-400">Entry: ${Number(p.entry || 0).toFixed(2)} | Current: ${Number(p.current || 0).toFixed(2)}</div>
                    </div>
                    <div className={`text-3xl font-bold ${pnlPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-12 text-lg bg-gray-900 rounded-lg border border-gray-800">
              No open positions — waiting for strong gappers
            </div>
          )}
        </div>

        {/* ML Top 5 */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6" /> ML Top 5 Learned Symbols
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {ml.top?.length > 0 ? ml.top.map((s: any, i: number) => (
              <div key={i} className="bg-gray-900 p-4 rounded-lg border border-purple-600 text-center">
                <div className="font-bold text-white text-xl">{s.symbol}</div>
                <div className="text-purple-400 text-sm mt-1">
                  {(s.confidence * 100).toFixed(0)}% confidence
                </div>
              </div>
            )) : (
              <div className="col-span-full text-gray-500 text-center py-8 text-lg">
                ML is learning — no strong patterns yet
              </div>
            )}
          </div>
        </div>

        {/* Force Scan Button */}
        <button
          onClick={() => {
            axios.post(`${CORE_URL}/scan`).then(() => {
              fetchData();
              alert("Scan triggered!");
            }).catch(() => alert("Scan request failed"));
          }}
          className="fixed bottom-8 right-8 bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-5 px-10 rounded-full flex items-center gap-3 shadow-2xl transition transform hover:scale-105 z-10"
        >
          <RefreshCw className="w-7 h-7" />
          Force Scan Now
        </button>
      </div>
    </div>
  );
}
