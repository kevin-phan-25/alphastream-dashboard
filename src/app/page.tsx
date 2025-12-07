'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Brain, Zap, Activity, TrendingUp, TrendingDown, Skull, Crown, Flame, Target, Shield, Swords } from 'lucide-react';

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
      const res = await axios.get(URL, { timeout: 10000 });
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
    } catch (e) { console.error("Connection lost to AlphaStream"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); const i = setInterval(fetch, 6500); return () => clearInterval(i); }, []);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    try { await axios.post(`${URL}/scan`); } catch {}
    setTimeout(() => setScanning(false), 8000);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Skull className="w-16 h-16 text-red-600 animate-pulse mx-auto mb-4" />
        <p className="text-2xl font-bold text-red-600">ALPHASTREAM AWAKENING</p>
      </div>
    </div>
  );

  const live = data.mode === "LIVE";
  const dailyPnL = data.unrealized;

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20 pointer-events-none" />
      
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur-xl border-b border-red-900/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              AlphaStream v400 — THE IMMORTAL
            </h1>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-right">
              <div className="text-gray-400">ACTIVE ACCOUNT</div>
              <div className="font-bold text-cyan-400">{data.activeAccount}</div>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold ${live ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
              {live ? "LIVE FUNDED" : "PAPER"}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 max-w-5xl mx-auto space-y-6 pb-40">
        {/* EQUITY DOMINANCE */}
        <div className="text-center bg-gradient-to-r from-red-900/40 via-purple-900/40 to-cyan-900/40 rounded-2xl p-8 border-2 border-red-600/50">
          <p className="text-6xl font-black tracking-tighter">${data.equity.toLocaleString()}</p>
          <p className={`text-3xl font-bold mt-2 ${dailyPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
            {dailyPnL >= 0 ? "+" : ""}${Math.abs(dailyPnL).toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-2">DAILY P&L — PRINTING</p>
        </div>

        {/* LIVE POSITIONS — WAR ROOM */}
        {data.positionsData.length > 0 && (
          <div className="bg-black/90 rounded-2xl p-6 border-2 border-red-800">
            <h2 className="text-xl font-black text-red-500 mb-4 flex items-center gap-3">
              <Swords className="w-6 h-6" /> LIVE KILL LIST ({data.positionsData.length})
            </h2>
            <div className="space-y-4">
              {data.positionsData.map((p: any, i: number) => {
                const pnlPct = ((p.current - p.entry) / p.entry) * 100;
                const isProfit = pnlPct >= 0;
                const minutesHeld = Math.floor((Date.now() - p.entryTime) / 60000);
                return (
                  <div key={i} className="bg-gradient-to-r from-red-900/20 to-purple-900/20 rounded-xl p-5 border border-red-700/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-2xl font-black">{p.symbol}</div>
                        <div className="text-sm text-gray-400">×{p.qty} @ ${p.entry.toFixed(2)} entry</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-black ${isProfit ? "text-green-400" : "text-red-400"}`}>
                          {isProfit ? "+" : ""}{pnlPct.toFixed(2)}%
                        </div>
                        <div className="text-lg">Now ${p.current.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs mt-3 text-gray-500">
                      <span className="text-green-400">TP ${p.tp.toFixed(2)}</span>
                      <span className="text-red-400">SL ${p.sl.toFixed(2)}</span>
                      <span>Held {minutesHeld}m</span>
                    </div>
                    <div className="mt-3 bg-gray-900 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${isProfit ? "bg-gradient-to-r from-green-500 to-cyan-500" : "bg-gradient-to-r from-red-600 to-orange-600"}`}
                        style={{ width: `${Math.min(100, Math.abs(pnlPct) * 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ROCKETS FIRED */}
        {data.rockets.length > 0 && (
          <div className="bg-black/90 rounded-2xl p-6 border-2 border-yellow-600">
            <h2 className="text-2xl font-black text-yellow-500 mb-4 flex items-center gap-3 justify-center">
              <Flame className="w-8 h-8" /> LAST ROCKETS LAUNCHED
            </h2>
            <div className="grid grid-cols-5 gap-4">
              {data.rockets.slice(0, 10).map((r: string, i: number) => {
                const [sym, gain] = r.split(' ');
                const numGain = parseFloat(gain);
                return (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-black text-yellow-400">{sym}</div>
                    <div className={`text-3xl font-black ${numGain > 50 ? "text-green-400" : "text-orange-400"}`}>
                      {gain}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI BRAIN — THE IMMORTAL MIND */}
        <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 rounded-2xl p-6 border-2 border-purple-600">
          <h2 className="text-2xl font-black text-cyan-400 mb-4 flex items-center gap-3">
            <Brain className="w-8 h-8" /> THE IMMORTAL BRAIN
          </h2>
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-black text-purple-400">{(data.brain.minConfidence || 0.78).toFixed(2)}</div>
              <div className="text-xs text-gray-400">CONFIDENCE</div>
            </div>
            <div>
              <div className="text-3xl font-black text-red-400">{((data.brain.riskPct || 0.03) * 100).toFixed(1)}%</div>
              <div className="text-xs text-gray-400">RISK PER TRADE</div>
            </div>
            <div>
              <div className="text-3xl font-black text-yellow-400">{data.brain.maxPositions || 5}</div>
              <div className="text-xs text-gray-400">MAX POSITIONS</div>
            </div>
            <div>
              <div className="text-3xl font-black text-green-400">{data.winRate}%</div>
              <div className="text-xs text-gray-400">WIN RATE</div>
            </div>
          </div>
        </div>

        {/* LIVE LOGS */}
        <div className="bg-black/90 rounded-2xl p-6 border-2 border-green-700">
          <h2 className="text-xl font-black text-green-400 mb-4">LIVE EXECUTION LOG</h2>
          <div className="bg-black/70 rounded-xl p-4 h-96 overflow-y-auto font-mono text-xs text-gray-300 border border-green-900">
            {data.logs.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0 hover:bg-green-900/20 transition">
                {l}
              </div>
            )) : <div className="text-center text-gray-600 py-8">Waiting for market open... The beast sleeps.</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN — THE RED BUTTON */}
        <div className="text-center pt-8">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="relative px-24 py-8 text-3xl font-black rounded-2xl bg-gradient-to-r from-red-600 via-purple-600 to-red-600 hover:scale-105 transition-all shadow-2xl border-4 border-red-900 disabled:opacity-60 overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-4">
              <RefreshCw className={`w-10 h-10 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? "SNIPING TARGETS..." : "FORCE SCAN — UNLEASH"}
            </span>
            <div className="absolute inset-0 bg-white/20 animate-ping" />
          </button>
        </div>

        {/* FINAL MESSAGE */}
        <div className="text-center py-12">
          <p className="text-4xl font-black text-red-600 animate-pulse">
            WARRIOR TRADING IS DEAD
          </p>
          <p className="text-xl text-gray-400 mt-4">
            You didn't beat them. You ended them.
          </p>
        </div>
      </main>
    </div>
  );
}
