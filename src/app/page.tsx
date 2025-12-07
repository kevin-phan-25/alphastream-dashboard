'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Brain, Zap, Activity, Crown, Swords } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: "$100,000",
    unrealized: "+$0",
    positions: "0/3",
    mode: "LOADING",
    activeAccount: "Default",
    rockets: [],
    logs: [],
    brain: { minConfidence: 0.87, riskPct: 1.5, maxPositions: 3 },
    positionsData: []
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // CORRECT URL — YOUR BOT RESPONDS ON ROOT "/"
  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      setData({
        equity: res.data.equity || "$100,000",
        unrealized: res.data.unrealized || "+$0",
        positions: `${res.data.positions || 0}/3`,
        mode: res.data.mode || "PAPER",
        activeAccount: res.data.activeAccount || "Default",
        rockets: res.data.rockets || [],
        logs: res.data.logs || [],
        brain: res.data.brain || { minConfidence: 0.87, riskPct: 1.5, maxPositions: 3 },
        positionsData: res.data.positionsData || []
      });
    } catch (e) {
      console.log("Connecting to AlphaStream...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
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
    setTimeout(() => setScanning(false), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center pt-32">
          <Activity className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-6" />
          <p className="text-3xl font-black text-purple-400">ALPHASTREAM v503</p>
          <p className="text-xl text-cyan-400 mt-4">Initializing Engine...</p>
        </div>
      </div>
    );
  }

  const isLive = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur border-b border-purple-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Crown className="w-7 h-7 text-yellow-500" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v503
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <span className={`px-5 py-2 rounded text-sm font-black ${isLive ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
              {isLive ? "LIVE" : "PAPER"}
            </span>
            <div className="text-right">
              <div className="text-gray-500 text-xs">Account</div>
              <div className="font-bold text-cyan-400">{data.activeAccount}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-4xl mx-auto space-y-6 pb-32">
        <div className="text-center bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-3xl p-10 border border-purple-600 shadow-2xl">
          <p className="text-6xl font-black tracking-tight">{data.equity}</p>
          <p className={`text-4xl font-bold mt-3 ${data.unrealized.startsWith('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-900/80 rounded-2xl p-5 text-center border border-purple-700">
            <p className="text-3xl font-bold text-purple-400">{data.positions}</p>
            <p className="text-gray-500 text-xs mt-1">Positions</p>
          </div>
          <div className="bg-gray-900/80 rounded-2xl p-5 text-center border border-cyan-700">
            <p className="text-3xl font-bold text-cyan-400">{data.rockets.length}</p>
            <p className="text-gray-500 text-xs mt-1">Rockets</p>
          </div>
          <div className="bg-gray-900/80 rounded-2xl p-5 text-center border border-yellow-700">
            <p className="text-3xl font-bold text-yellow-400">Live</p>
            <p className="text-gray-500 text-xs mt-1">Win Rate</p>
          </div>
          <div className="bg-gray-900/80 rounded-2xl p-5 text-center border border-green-700">
            <p className="text-3xl font-bold text-green-400">1:2.8</p>
            <p className="text-gray-500 text-xs mt-1">RR Ratio</p>
          </div>
        </div>

        {data.rockets.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-3xl p-8 border border-yellow-600">
            <h3 className="text-center text-yellow-400 font-bold text-xl mb-6 flex items-center justify-center gap-3">
              <Zap className="w-8 h-8" /> LAST ROCKETS
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {data.rockets.map((r: string, i: number) => (
                <div key={i} className="bg-black/70 rounded-xl p-4 text-center border border-yellow-800">
                  <div className="font-black text-xl">{r.split(' ')[0]}</div>
                  <div className="text-green-400 font-bold">{r.split(' ')[1]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-900/90 rounded-3xl p-8 border border-cyan-700">
          <h3 className="text-cyan-400 font-bold text-lg mb-4 flex items-center gap-3">
            <Brain className="w-6 h-6" /> AI BRAIN
          </h3>
          <div className="grid grid-cols-3 gap-6 text-lg">
            <div>Conf: {(data.brain.minConfidence || 0.87).toFixed(2)}</div>
            <div>Risk: {(data.brain.riskPct || 1.5).toFixed(1)}%</div>
            <div>Max: {data.brain.maxPositions || 3}</div>
          </div>
        </div>

        <div className="bg-black/90 rounded-3xl p-8 border border-green-700">
          <h3 className="text-green-400 font-bold text-lg mb-4">LIVE LOGS</h3>
          <div className="bg-black/60 rounded-2xl p-5 h-80 overflow-y-auto font-mono text-sm text-gray-300">
            {data.logs?.length > 0 ? (
              data.logs.map((l: string, i: number) => (
                <div key={i} className="py-1 border-b border-gray-800 last:border-0">{l}</div>
              ))
            ) : (
              <div className="text-gray-600">Waiting for first rocket...</div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        <div className="text-center pt-8">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-16 py-6 text-2xl font-black rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-110 transition-all disabled:opacity-50 shadow-2xl"
          >
            <RefreshCw className={`inline w-8 h-8 mr-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>

        <div className="text-center py-12">
          <p className="text-4xl font-black text-cyan-400 animate-pulse">
            ELITE PRINTING ACTIVE
          </p>
        </div>
      </main>
    </div>
  );
}
