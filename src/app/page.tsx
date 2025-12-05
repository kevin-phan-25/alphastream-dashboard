'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Zap, Brain, TrendingUp, AlertTriangle, Shield } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: 100000,
    unrealized: 0,
    positions: 0,
    mode: "LOADING",
    rockets: [],
    winRate: "0.0",
    totalTrades: 0,
    aiTrades: 0,
    brainUpdated: "Never",
    logs: []
  });

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(URL, { timeout: 10000 });
      const m = res.data;

      const equity = parseInt(m.equity.replace(/[^0-9]/g, "")) || 100000;
      const unrealized = parseInt(m.unrealized?.replace(/[^0-9-]/g, "") || "0");

      setData({
        equity,
        unrealized,
        positions: m.positions || 0,
        mode: m.mode || "PAPER",
        rockets: m.rockets || [],
        winRate: m.winRate?.replace("%", "") || "0.0",
        totalTrades: m.trades || 0,
        aiTrades: m.aiTrades || 0,
        brainUpdated: m.brainUpdated || "Never",
        logs: m.logs || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 7000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    try { await axios.post(`${URL}/scan`); } catch {}
    setTimeout(() => setScanning(false), 8000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-10 h-10 text-purple-400 animate-spin" />
      </div>
    );
  }

  const isLive = data.mode === "LIVE";
  const dailyPnL = data.unrealized;
  const dailyLimit = 2000; // 2% of $100k
  const nearLimit = Math.abs(dailyPnL) > dailyLimit * 0.8;

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur border-b border-purple-600">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              AlphaStream v200 — AI
            </h1>
            <p className="text-xs text-gray-400">Self-Learning Momentum Engine</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Brain className="w-4 h-4" /> AI Win Rate
              </div>
              <div className="text-2xl font-black text-yellow-400">{data.winRate}%</div>
            </div>
            <span className={`px-4 py-1 rounded text-sm font-bold ${isLive ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
              {data.mode}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-16 px-4 max-w-5xl mx-auto space-y-5 pb-32">
        {/* EQUITY + DAILY P&L */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-5 border border-purple-600">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-400">Account Equity</p>
              <p className="text-3xl font-black">${data.equity.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 flex items-center justify-end gap-1">
                {nearLimit && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                Daily P&L
              </p>
              <p className={`text-3xl font-black ${dailyPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                {dailyPnL >= 0 ? "+" : ""}${dailyPnL.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-900/70 rounded-lg p-4 border border-purple-600 text-center">
            <p className="text-lg font-bold">{data.totalTrades}</p>
            <p className="text-xs text-gray-400">Total Trades</p>
          </div>
          <div className="bg-gray-900/70 rounded-lg p-4 border border-cyan-600 text-center">
            <p className="text-lg font-bold">{data.positions}</p>
            <p className="text-xs text-gray-400">Live Pos</p>
          </div>
          <div className="bg-gray-900/70 rounded-lg p-4 border border-yellow-600 text-center">
            <p className="text-lg font-bold">{data.aiTrades}</p>
            <p className="text-xs text-gray-400">AI Trades</p>
          </div>
          <div className="bg-gray-900/70 rounded-lg p-4 border border-pink-600 text-center">
            <p className="text-lg font-bold">{data.rockets.length}</p>
            <p className="text-xs text-gray-400">Rockets</p>
          </div>
        </div>

        {/* AI BRAIN STATUS */}
        <div className="bg-gray-900/80 rounded-lg p-4 border border-purple-600 text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <Brain className="w-4 h-4" /> AI Brain Last Trained
          </p>
          <p className="text-sm font-mono text-purple-400">{data.brainUpdated}</p>
        </div>

        {/* LAST ROCKETS */}
        {data.rockets.length > 0 && (
          <div className="bg-gray-900/80 rounded-lg p-4 border border-yellow-600">
            <h3 className="text-sm font-bold text-yellow-400 mb-3 text-center">
              <Zap className="inline w-4 h-4 mr-1" /> LAST ROCKETS
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

        {/* LOGS */}
        <div className="bg-gray-900/90 rounded-lg p-4 border border-green-700">
          <h3 className="text-sm font-bold text-green-400 mb-2">Live Execution</h3>
          <div className="bg-black/70 rounded p-3 h-64 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-gray-600">Waiting for first rocket...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN */}
        <div className="text-center pt-4">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-16 py-6 text-xl font-bold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all border-4 border-purple-500 disabled:opacity-60"
          >
            <RefreshCw className={`inline w-7 h-7 mr-3 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>
    </div>
  );
}
