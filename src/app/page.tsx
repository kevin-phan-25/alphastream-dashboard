'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Brain, Zap, Activity, Crown, Swords, Flame } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: "$100,000",
    unrealized: "+$0",
    positions: "0/3",
    mode: "LOADING",
    activeAccount: "Default",
    rockets: [],
    winRate: "0.0",
    totalTrades: 0,
    logs: [],
    brain: { minConfidence: 0.87, riskPct: 1.5, maxPositions: 3 },
    positionsData: []
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // CORRECT BOT URL — YOUR BOT IS LISTENING ON ROOT
  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      const d = res.data;

      setData({
        equity: d.equity || "$100,000",
        unrealized: d.unrealized || "+$0",
        positions: d.positions || "0/3",
        mode: d.mode || "PAPER",
        activeAccount: d.activeAccount || "Default",
        rockets: d.rockets || [],
        winRate: d.winRate || "0.0",
        totalTrades: d.totalTrades || 0,
        logs: d.logs || [],
        brain: d.brain || { minConfidence: 0.87, riskPct: 1.5, maxPositions: 3 },
        positionsData: d.positionsData || []
      });
    } catch (e) {
      console.log("Connecting to AlphaStream...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 7000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    try {
      await axios.post(`${BOT_URL}/scan`);
    } catch {}
    setTimeout(() => setScanning(false), 6000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-6" />
          <p className="text-3xl font-black text-purple-400">ALPHASTREAM v503 AWAKENING</p>
        </div>
      </div>
    );
  }

  const isLive = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20 pointer-events-none" />
      
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur-xl border-b border-purple-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Crown className="w-10 h-10 text-yellow-500" />
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v503
            </h1>
          </div>
          <div className="flex items-center gap-8">
            <span className={`px-6 py-3 rounded-full text-lg font-black ${isLive ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
              {isLive ? "LIVE FUNDED" : "PAPER"}
            </span>
            <div className="text-right">
              <div className="text-gray-400 text-sm">ACTIVE ACCOUNT</div>
              <div className="font-black text-cyan-400 text-xl">{data.activeAccount}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-28 px-6 max-w-5xl mx-auto space-y-8 pb-40">
        {/* EQUITY */}
        <div className="text-center bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-3xl p-12 border-2 border-purple-600 shadow-2xl">
          <p className="text-7xl font-black tracking-tight">{data.equity}</p>
          <p className={`text-4xl font-bold mt-4 ${data.unrealized.startsWith('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized}
          </p>
        </div>

        {/* POSITIONS */}
        {data.positionsData?.length > 0 && (
          <div className="bg-gray-900/90 rounded-3xl p-8 border-2 border-red-800">
            <h2 className="text-2xl font-black text-red-500 mb-6 flex items-center gap-4 justify-center">
              <Swords className="w-8 h-8" /> LIVE POSITIONS ({data.positionsData.length}/3)
            </h2>
            <div className="space-y-6">
              {data.positionsData.map((p: any, i: number) => {
                const pnlPct = ((p.current - p.entry) / p.entry) * 100;
                const isProfit = pnlPct >= 0;
                return (
                  <div key={i} className="bg-black/70 rounded-2xl p-6 border border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-3xl font-black">{p.symbol}</div>
                        <div className="text-gray-400">×{p.qty} @ ${p.entry.toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-black ${isProfit ? "text-green-400" : "text-red-400"}`}>
                          {isProfit ? "+" : ""}{pnlPct.toFixed(2)}%
                        </div>
                        <div className="text-2xl text-gray-300">${p.current.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ROCKETS */}
        {data.rockets.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-3xl p-8 border-2 border-yellow-600">
            <h2 className="text-3xl font-black text-yellow-500 mb-6 text-center">
              <Flame className="inline w-10 h-10 mr-3" />LAST ROCKETS
            </h2>
            <div className="grid grid-cols-5 gap-6">
              {data.rockets.slice(0, 10).map((r: string, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-black text-yellow-400">{r.split(' ')[0]}</div>
                  <div className="text-4xl font-black text-green-400">{r.split(' ')[1]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BRAIN */}
        <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 rounded-3xl p-8 border-2 border-purple-600">
          <h2 className="text-2xl font-black text-cyan-400 mb-6 text-center">
            <Brain className="inline w-8 h-8 mr-3" />AI BRAIN — FUNDED MODE
          </h2>
          <div className="grid grid-cols-3 gap-8 text-center text-xl">
            <div>
              <div className="font-black text-purple-400">{data.brain.minConfidence?.toFixed(2) || "0.87"}</div>
              <div className="text-gray-400 text-sm">Confidence Gate</div>
            </div>
            <div>
              <div className="font-black text-red-400">{(data.brain.riskPct * 100 || 1.5).toFixed(1)}%</div>
              <div className="text-gray-400 text-sm">Risk Per Trade</div>
            </div>
            <div>
              <div className="font-black text-yellow-400">{data.brain.maxPositions || 3}</div>
              <div className="text-gray-400 text-sm">Max Positions</div>
            </div>
          </div>
        </div>

        {/* LOGS */}
        <div className="bg-black/90 rounded-3xl p-8 border-2 border-green-700">
          <h2 className="text-2xl font-black text-green-400 mb-6">LIVE EXECUTION LOG</h2>
          <div className="bg-black/70 rounded-2xl p-6 h-96 overflow-y-auto font-mono text-sm text-gray-300 border border-green-900">
            {data.logs.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-center text-gray-600 py-20">Waiting for first rocket...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN */}
        <div className="text-center pt-12">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-32 py-10 text-4xl font-black rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:scale-110 transition-all shadow-2xl border-4 border-purple-900 disabled:opacity-60"
          >
            <RefreshCw className={`inline w-12 h-12 mr-6 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>

        {/* FINAL MESSAGE */}
        <div className="text-center py-20">
          <p className="text-6xl font-black text-red-600 animate-pulse">
            ELITE AUTOMATION
          </p>
        </div>
      </main>
    </div>
  );
}
