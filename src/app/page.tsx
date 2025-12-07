'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Brain, Zap, Activity, TrendingUp, TrendingDown, Crown, Swords } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: 100000, unrealized: 0, positions: 0, mode: "LOADING",
    rockets: [], winRate: "0.0", totalTrades: 0, logs: [], brain: {}, positionsData: [], activeAccount: "Default"
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetch = async () => {
    try {
      const res = await axios.get(URL, { timeout: 8000 });
      const d = res.data;
      setData({
        equity: parseInt(d.equity?.replace(/[^0-9]/g, "") || "100000"),
        unrealized: parseInt((d.unrealized || "0").replace(/[^0-9-]/g, "")) * (d.unrealized?.includes('-') ? -1 : 1),
        positions: d.positions || 0,
        mode: d.mode || "PAPER",
        activeAccount: d.activeAccount || "Default",
        rockets: d.rockets || [],
        winRate: d.winRate?.replace("%", "") || "0.0",
        totalTrades: d.totalTrades || 0,
        logs: d.logs || [],
        brain: d.brain || {},
        positionsData: d.positionsData || []
      });
    } catch (e) { console.log("Bot sleeping..."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); const i = setInterval(fetch, 7000); return () => clearInterval(i); }, []);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    try { await axios.post(`${URL}/scan`); } catch {}
    setTimeout(() => setScanning(false), 6000);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Activity className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  const live = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur border-b border-purple-800">
        <div className="max-w-4xl mx-auto px-4 py-2 flex justify-between items-center text-xs">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-yellow-500" />
            <h1 className="font-bold text-gradient bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v400
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${live ? "bg-red-600" : "bg-emerald-600"}`}>
              {live ? "LIVE" : "PAPER"}
            </span>
            <div className="text-right">
              <div className="text-gray-500">Account</div>
              <div className="font-bold text-cyan-400 text-sm">{data.activeAccount}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-14 px-4 max-w-4xl mx-auto space-y-4 pb-32">
        {/* Equity */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 text-center border border-purple-700">
          <p className="text-3xl font-black">${data.equity.toLocaleString()}</p>
          <p className={`text-lg font-bold ${data.unrealized >= 0 ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized >= 0 ? "+" : ""}${Math.abs(data.unrealized).toLocaleString()}
          </p>
        </div>

        {/* Live Positions */}
        {data.positionsData.length > 0 && (
          <div className="bg-gray-900/90 rounded-lg p-4 border border-red-800">
            <h3 className="text-sm font-bold text-red-500 mb-2 flex items-center gap-2">
              <Swords className="w-4 h-4" /> LIVE ({data.positionsData.length})
            </h3>
            <div className="space-y-2">
              {data.positionsData.map((p: any, i: number) => {
                const pnlPct = ((p.current - p.entry) / p.entry) * 100;
                const isProfit = pnlPct >= 0;
                return (
                  <div key={i} className="bg-black/50 rounded p-2 text-xs border border-gray-800">
                    <div className="flex justify-between">
                      <div>
                        <span className="font-bold">{p.symbol}</span>
                        <span className="text-gray-500"> ×{p.qty}</span>
                      </div>
                      <div className={`font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
                        {isProfit ? "+" : ""}{pnlPct.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${p.current.toFixed(2)} now
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-gray-900/80 rounded p-2 border border-purple-700">
            <p className="font-bold">{data.totalTrades}</p>
            <p className="text-gray-500">Trades</p>
          </div>
          <div className="bg-gray-900/80 rounded p-2 border border-cyan-700">
            <p className="font-bold">{data.positions}</p>
            <p className="text-gray-500">Live</p>
          </div>
          <div className="bg-gray-900/80 rounded p-2 border border-yellow-700">
            <p className="font-bold">{data.rockets.length}</p>
            <p className="text-gray-500">Rockets</p>
          </div>
          <div className="bg-gray-900/80 rounded p-2 border border-green-700">
            <p className="font-bold text-green-400">{data.winRate}%</p>
            <p className="text-gray-500">WinRate</p>
          </div>
        </div>

        {/* Last Rockets */}
        {data.rockets.length > 0 && (
          <div className="bg-gray-900/90 rounded-lg p-3 border border-yellow-600">
            <h3 className="text-xs font-bold text-yellow-500 mb-2 text-center">
              <Zap className="inline w-3 h-3 mr-1" /> LAST ROCKETS
            </h3>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {data.rockets.slice(0, 10).map((r: string, i: number) => {
                const [sym, gain] = r.split(' ');
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-900 to-pink-900 rounded p-2 text-center">
                    <div className="font-bold">{sym}</div>
                    <div className="text-green-400">{gain}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Brain */}
        <div className="bg-gray-900/90 rounded-lg p-3 border border-cyan-700 text-xs">
          <h3 className="font-bold text-cyan-400 mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4" /> BRAIN
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>Conf: {(data.brain.minConfidence || 0.78).toFixed(2)}</div>
            <div>Risk: {((data.brain.riskPct || 0.03) * 100).toFixed(1)}%</div>
            <div>Max: {data.brain.maxPositions || 5}</div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-900/90 rounded-lg p-3 border border-green-700">
          <h3 className="text-xs font-bold text-green-400 mb-2">LOGS</h3>
          <div className="bg-black/70 rounded p-3 h-48 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-gray-600">Waiting for market...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Force Scan */}
        <div className="text-center pt-4">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-10 py-3 text-sm font-bold rounded bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition border-2 border-purple-500 disabled:opacity-60"
          >
            <RefreshCw className={`inline w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>

        {/* Victory */}
        <div className="text-center py-6 text-xs text-gray-500">
          <p className="font-black text-red-600">ELITE AUTOMATION</p>
        </div>
      </main>
    </div>
  );
}
