'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Brain, Zap, Activity, Crown } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: "$0",
    unrealized: "+$0",
    positions: "0/3",
    mode: "LOADING",
    activeAccount: "Connecting...",
    rockets: [],
    logs: [],
    brain: { minConfidence: 0.87, riskPct: 1.5, maxPositions: 3 }
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      const d = res.data;

      setData({
        equity: d.equity || "$0",
        unrealized: d.unrealized || "+$0",
        positions: `${d.positions || 0}/3`,
        mode: d.mode || "PAPER",
        activeAccount: d.activeAccount || "Unknown",
        rockets: d.rockets || [],
        logs: d.logs || [],
        brain: d.brain || data.brain,
        winRate: d.winRate || "0.0"
      });
    } catch (e) {
      console.log("Connecting...");
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
    try { await axios.post(`${BOT_URL}/scan`); } catch {}
    setTimeout(() => setScanning(false), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  const isLive = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono text-sm">
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur border-b border-purple-800">
        <div className="max-w-3xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <h1 className="font-bold text-purple-400">AlphaStream v503</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded text-xs font-bold ${isLive ? "bg-red-600" : "bg-emerald-600"}`}>
              {isLive ? "LIVE" : "PAPER"}
            </span>
            <span className="text-cyan-400 text-xs">{data.activeAccount}</span>
          </div>
        </div>
      </header>

      <main className="pt-14 px-4 max-w-3xl mx-auto space-y-4 pb-20">
        {/* Equity */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 text-center border border-purple-700">
          <p className="text-4xl font-black">{data.equity}</p>
          <p className={`text-2xl font-bold mt-2 ${data.unrealized.startsWith('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-gray-900/80 rounded-lg p-3 border border-purple-700">
            <p className="text-xl font-bold text-purple-400">{data.positions}</p>
            <p className="text-xs text-gray-500">Pos</p>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-cyan-700">
            <p className="text-xl font-bold text-cyan-400">{data.rockets.length}</p>
            <p className="text-xs text-gray-500">Rockets</p>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-yellow-700">
            <p className="text-xl font-bold text-yellow-400">{data.winRate || "0.0"}%</p>
            <p className="text-xs text-gray-500">Win</p>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-green-700">
            <p className="text-xl font-bold text-green-400">1:2.8</p>
            <p className="text-xs text-gray-500">RR</p>
          </div>
        </div>

        {/* Rockets */}
        {data.rockets.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl p-4 border border-yellow-700">
            <h3 className="text-center text-yellow-400 font-bold text-sm mb-2">
              <Zap className="inline w-4 h-4 mr-1" />LAST ROCKETS
            </h3>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {data.rockets.slice(0, 10).map((r: string, i: number) => (
                <div key={i} className="bg-black/60 rounded p-2 text-center">
                  <div className="font-bold">{r.split(' ')[0]}</div>
                  <div className="text-green-400">{r.split(' ')[1]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Brain */}
        <div className="bg-gray-900/90 rounded-xl p-4 border border-cyan-700">
          <h3 className="text-cyan-400 font-bold text-sm mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4" />AI BRAIN
          </h3>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>Conf: {(data.brain.minConfidence || 0.87).toFixed(2)}</div>
            <div>Risk: {(data.brain.riskPct || 1.5).toFixed(1)}%</div>
            <div>Max: {data.brain.maxPositions || 3}</div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-black/90 rounded-xl p-4 border border-green-700">
          <h3 className="text-green-400 font-bold text-sm mb-2">LOGS</h3>
          <div className="bg-black/70 rounded p-3 h-48 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-gray-600">Waiting...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Force Scan */}
        <div className="text-center pt-4">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-10 py-3 text-sm font-bold rounded bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition disabled:opacity-50"
          >
            <RefreshCw className={`inline w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING" : "FORCE SCAN"}
          </button>
        </div>

        <div className="text-center py-6 text-xs text-cyan-400">
          ELITE PRINTING ACTIVE
        </div>
      </main>
    </div>
  );
}
