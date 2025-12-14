'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Zap, Brain, TrendingUp } from 'lucide-react';

const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = process.env.NEXT_PUBLIC_ML_URL || "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        axios.get(CORE_URL),
        axios.get(ML_URL)
      ]);
      setCore(cRes.data);
      setML(mRes.data);
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !core || !ml) return (
    <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center text-2xl">
      Loading AlphaStream...
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-gray-300 p-6">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6">AlphaStream AI Trader</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 p-6 rounded-lg border border-purple-700">
          <div className="text-gray-400 text-sm">Live Equity</div>
          <div className="text-4xl font-bold text-white">${Number(core.equity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg border border-green-700">
          <div className="text-gray-400 text-sm">Open Positions</div>
          <div className="text-4xl font-bold text-green-400">{core.positions.length}/5</div>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg border border-purple-700">
          <div className="text-gray-400 text-sm">ML Memory</div>
          <div className="text-2xl font-bold text-purple-400">{ml.trackedSymbols} symbols</div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6" /> Today's Rockets ({core.rockets.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {core.rockets.length > 0 ? core.rockets.map((r: any, i: number) => (
            <div key={i} className="bg-gray-900 p-4 rounded border border-yellow-600">
              <div className="font-bold text-white">{r.symbol}</div>
              <div className="text-2xl text-yellow-400">+{r.gap}%</div>
            </div>
          )) : (
            <div className="text-gray-500 col-span-full text-center py-8">No gappers today</div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" /> Live Positions
        </h2>
        {core.positions.length > 0 ? (
          <div className="space-y-3">
            {core.positions.map(([symbol, p]: [string, any]) => (
              <div key={symbol} className="bg-gray-900 p-4 rounded border border-green-700 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">{symbol} ×{p.qty}</div>
                  <div className="text-sm text-gray-400">Entry: ${p.entry.toFixed(2)}</div>
                </div>
                <div className={`text-2xl font-bold ${p.current > p.entry ? "text-green-400" : "text-red-400"}`}>
                  {((p.current - p.entry) / p.entry * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">No open positions</div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
          <Brain className="w-6 h-6" /> ML Top 5 Learned Symbols
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {ml.top && ml.top.length > 0 ? ml.top.map((s: any, i: number) => (
            <div key={i} className="bg-gray-900 p-3 rounded border border-purple-600 text-center">
              <div className="font-bold text-white">{s.symbol}</div>
              <div className="text-sm text-purple-400">{(s.confidence * 100).toFixed(0)}%</div>
            </div>
          )) : (
            <div className="col-span-5 text-gray-500 text-center py-4">Learning in progress...</div>
          )}
        </div>
      </div>

      <button
        onClick={() => axios.post(`${CORE_URL}/scan`).catch(console.error)}
        className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-4 px-8 rounded-full flex items-center gap-3 shadow-lg transition"
      >
        <RefreshCw className="w-6 h-6" />
        Force Scan
      </button>
    </div>
  );
}
