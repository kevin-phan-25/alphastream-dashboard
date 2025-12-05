'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Zap, Brain } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: 100000,
    unrealized: 0,
    positions: 0,
    mode: "LOADING",
    rockets: [],
    winRate: "0.0",
    trades: 0,
    logs: [],
    aiTrades: 0,
    brainUpdated: "Never"
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
      const winRate = m.winRate?.replace("%", "") || "0.0";

      setData({
        equity,
        unrealized,
        positions: m.positions || 0,
        mode: m.mode || "PAPER",
        rockets: m.rockets || [],
        winRate,
        totalTrades: m.trades || 0,
        logs: m.logs || [],
        aiTrades: m.aiTrades || 0,
        brainUpdated: m.brainUpdated || "Never"
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

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur border-b border-purple-600">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              AlphaStream v200
            </h1>
            <p className="text-xs text-gray-400">AI-Powered Momentum Bot</p>
          </div>
          <div className="flex items-center gap-6">
            <span className={`px-3 py-1 rounded text-xs font-bold ${data.mode === "LIVE" ? "bg-red-600" : "bg-emerald-600"}`}>
              {data.mode}
            </span>
            <div className="text-right">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Brain className="w-4 h-4" /> AI Win Rate
              </div>
              <div className="text-xl font-black text-yellow-400">{data.winRate}%</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16 px-4 max-w-5xl mx-auto space-y-5 pb-32">
        {/* EQUITY */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-5 border border-purple-600 text-center">
          <p className="text-3xl font-black">${data.equity.toLocaleString()}</p>
          <p className={`text-lg font-bold mt-1 ${data.unrealized >= 0 ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized >= 0 ? "+" : ""}{data.unrealized.toLocaleString()}
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-900/70 rounded-lg p-4 border border-purple-600 text-center">
            <p className="text-lg font-bold">{data.totalTrades}</p>
            <p className="text-xs text-gray-400">Trades</p>
          </div>
          <div className="bg-gray-900/70 rounded-lg p-4 border border-cyan-600 text-center">
            <p className="text-lg font-bold">{data.positions}</p>
            <p className="text-xs text-gray-400">Live</p>
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
          <h3 className="text-sm font-bold text-green-400 mb-2">Live Logs</h3>
          <div className="bg-black/70 rounded p-3 h-64 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-gray-600">Waiting for action...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* BRAIN STATUS */}
        <div className="bg-gray-900/80 rounded-lg p-4 border border-purple-600 text-center">
          <p className="text-xs text-gray-400">AI Brain Last Updated</p>
          <p className="text-sm font-mono text-purple-400">{data.brainUpdated}</p>
        </div>

        {/* FORCE SCAN */}
        <div className="text-center pt-4">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-16 py-6 text-xl font-bold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all border-4 border-purple-500 disabled:opacity-60"
          >
            <RefreshCw className={`inline w-6 h-6 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>
    </div>
  );
}
