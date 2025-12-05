'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Zap } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: 100000,
    unrealized: 0,
    positions: 0,
    mode: "LOADING",
    rockets: [],
    winRate: "0.0",
    trades: 0,
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
      const winRate = m.winRate?.replace("%", "") || "0.0";

      setData({
        equity,
        unrealized,
        positions: m.positions || 0,
        mode: m.mode || "PAPER",
        rockets: m.rockets || [],
        winRate,
        totalTrades: m.trades || 0,
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
        <Activity className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/90 backdrop-blur border-b-2 border-purple-600">
        <div className="max-w-5xl mx-auto px-5 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            AlphaStream v105.3
          </h1>
          <div className="flex items-center gap-8">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${data.mode === "LIVE" ? "bg-red-600" : "bg-emerald-600"}`}>
              {data.mode}
            </span>
            <div className="text-right">
              <div className="text-xs text-gray-400">Win Rate</div>
              <div className="text-2xl font-black text-yellow-400">{data.winRate}%</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20 px-5 max-w-5xl mx-auto space-y-6 pb-32">
        {/* EQUITY CARD */}
        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl p-6 border border-purple-600 text-center">
          <p className="text-4xl font-black">${data.equity.toLocaleString()}</p>
          <p className={`text-2xl font-bold mt-2 ${data.unrealized >= 0 ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized >= 0 ? "+" : ""}{data.unrealized.toLocaleString()} unrealized
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-900/70 rounded-xl p-5 border border-purple-600 text-center">
            <p className="text-2xl font-bold">{data.totalTrades}</p>
            <p className="text-xs text-gray-400">Trades</p>
          </div>
          <div className="bg-gray-900/70 rounded-xl p-5 border border-cyan-600 text-center">
            <p className="text-2xl font-bold">{data.positions}</p>
            <p className="text-xs text-gray-400">Positions</p>
          </div>
          <div className="bg-gray-900/70 rounded-xl p-5 border border-yellow-600 text-center">
            <p className="text-2xl font-bold">{data.winRate}%</p>
            <p className="text-xs text-gray-400">Win Rate</p>
          </div>
          <div className="bg-gray-900/70 rounded-xl p-5 border border-pink-600 text-center">
            <p className="text-2xl font-bold">{data.rockets.length}</p>
            <p className="text-xs text-gray-400">Rockets Today</p>
          </div>
        </div>

        {/* LAST ROCKETS */}
        {data.rockets.length > 0 && (
          <div className="bg-gray-900/80 rounded-2xl p-6 border border-yellow-600">
            <h3 className="text-lg font-bold text-yellow-400 mb-4 text-center flex items-center justify-center gap-2">
              <Zap className="w-6 h-6" /> LAST ROCKETS
            </h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {data.rockets.slice(0, 16).map((r: string, i: number) => {
                const [sym, gain] = r.split(' ');
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-lg p-3 text-center">
                    <div className="text-sm font-bold">{sym}</div>
                    <div className="text-green-400 text-xs">{gain}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LOGS */}
        <div className="bg-gray-900/90 rounded-2xl p-5 border border-green-700">
          <h3 className="text-md font-bold text-green-400 mb-3">Live Logs</h3>
          <div className="bg-black/70 rounded-lg p-4 h-80 overflow-y-auto font-mono text-xs text-gray-300">
            {data.logs.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-gray-600">Waiting...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN */}
        <div className="text-center pt-6">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-20 py-8 text-2xl font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all border-4 border-purple-500 disabled:opacity-60"
          >
            <RefreshCw className={`inline w-8 h-8 mr-3 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>
    </div>
  );
}
