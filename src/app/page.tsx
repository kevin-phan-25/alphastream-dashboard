'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Zap, Brain, TrendingUp, AlertCircle, Shield, Activity, Target } from 'lucide-react';

const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [nextAction, setNextAction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchData = async () => {
    try {
      const [cRes, mRes, aRes] = await Promise.all([
        axios.get(CORE_URL, { timeout: 12000 }),
        axios.get(ML_URL, { timeout: 12000 }).catch(() => ({ data: null })),
        axios.get(`${ML_URL}/next-action`, { timeout: 8000 }).catch(() => ({ data: null }))
      ]);

      setCore(cRes.data);
      setML(mRes.data);
      setNextAction(aRes.data);
      setError(null);
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));
    } catch (e: any) {
      console.error("Fetch error:", e);
      setError("Services unreachable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black text-cyan-400 flex flex-col items-center justify-center gap-4 text-xl">
      <Activity className="w-8 h-8 animate-pulse" />
      <div>Initializing AlphaStream AI...</div>
    </div>
  );

  if (error || !core) return (
    <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-4 text-lg px-4 text-center">
      <AlertCircle className="w-16 h-16" />
      <div>{error || "Core service down"}</div>
      <button onClick={fetchData} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-2 px-6 rounded-full transition">
        Retry
      </button>
    </div>
  );

  const positionsArray = core.positions ? Object.entries(core.positions) : [];

  return (
    <div className="min-h-screen bg-black text-gray-300 p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-cyan-400">AlphaStream AI Trader</h1>
          <div className="text-xs text-gray-500">Last update: {lastUpdate} ET</div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6 text-sm">
          {[{
            label: "Live Equity", value: `$${Number(core.equity || 0).toLocaleString()}`, extra: `Peak: $${Number(core.peakEquity || 0).toLocaleString()}`, icon: <Shield className="w-3 h-3" />
          },{
            label: "Open Positions", value: `${positionsArray.length}/5`, icon: null
          },{
            label: "Today's Rockets", value: core.rockets?.length || 0, icon: <Zap className="w-3 h-3" />
          },{
            label: "Rainbow DQN", value: ml?.status || "Active", extra: ml?.steps ? `Steps: ${ml.steps.toLocaleString()}` : "", icon: <Brain className="w-3 h-3" />
          },{
            label: "Daily Symbols", value: core.dailySymbols?.length || 0, icon: <Activity className="w-3 h-3" />
          },{
            label: "Next ML Action", value: nextAction?.symbol || "Waiting...", extra: nextAction?.action ? `Action: ${nextAction.action}` : "", icon: <Target className="w-3 h-3" />
          }].map((s,i) => (
            <div key={i} className="bg-gray-900 p-3 rounded-lg border border-gray-700 text-center">
              <div className="text-gray-400 flex items-center justify-center gap-1">{s.icon}{s.label}</div>
              <div className="font-bold text-white text-lg mt-1">{s.value}</div>
              {s.extra && <div className="text-gray-500 text-xs mt-0.5">{s.extra}</div>}
            </div>
          ))}
        </div>

        {/* Rockets */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-yellow-400 mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5" /> Today's Rockets ({core.rockets?.length || 0})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {core.rockets?.length > 0 ? core.rockets.map((r: any, i: number) => (
              <div key={i} className="bg-gray-900 p-2 rounded-lg border border-yellow-600 text-center hover:border-yellow-400 transition">
                <div className="font-bold text-white text-sm">{r.symbol}</div>
                <div className="text-yellow-400 font-bold text-base">+{r.gap}%</div>
              </div>
            )) : (
              <div className="col-span-full text-center py-8 text-gray-500 text-sm bg-gray-900 rounded-lg">
                No gappers ≥20% today
              </div>
            )}
          </div>
        </div>

        {/* Live Positions */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-green-400 mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Live Positions
          </h2>
          {positionsArray.length > 0 ? (
            <div className="space-y-3 text-sm">
              {positionsArray.map(([symbol, p]: any) => {
                const pnlPct = p.entry && p.current ? ((p.current - p.entry)/p.entry)*100 : 0;
                return (
                  <div key={symbol} className="bg-gray-900 p-3 rounded-lg border border-green-700 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{symbol} ×{p.qty || 0}</div>
                      <div className="text-gray-400 text-xs">
                        Entry: ${Number(p.entry||0).toFixed(2)} → ${Number(p.current||0).toFixed(2)}
                      </div>
                    </div>
                    <div className={`font-bold text-lg ${pnlPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm bg-gray-900 rounded-lg border border-gray-800">
              No open positions
            </div>
          )}
        </div>

        {/* Force Scan */}
        <button
          onClick={() => axios.post(`${CORE_URL}/scan`).then(fetchData).catch(()=>alert("Scan failed"))}
          className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 px-6 rounded-full flex items-center gap-2 shadow-lg transition transform hover:scale-105 text-sm"
        >
          <RefreshCw className="w-5 h-5" /> Force Scan
        </button>
      </div>
    </div>
  );
}
