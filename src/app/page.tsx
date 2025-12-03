'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, TrendingUp, Terminal, AlertCircle } from 'lucide-react';

interface BotData {
  equity: number;
  unrealized: number;
  positions: number;
  mode: string;
  rockets: string[];
  winRate?: number;
  recent?: { equity: number }[];
  logs?: string[];
}

export default function Home() {
  const [data, setData] = useState<BotData>({
    equity: 100000,
    unrealized: 0,
    positions: 0,
    mode: "UNKNOWN",
    rockets: ["Initializing..."],
    winRate: 0,
    recent: [],
    logs: []
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // YOUR CLOUD RUN BACKEND — CHANGE ONLY IF YOU REDEPLOY
  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      setError(null);
      const [mainRes, perfRes] = await Promise.all([
        axios.get(URL, { timeout: 10000 }).catch(() => ({ data: {} })),
        axios.get(URL + "/performance", { timeout: 10000 }).catch(() => ({ data: {} }))
      ]);

      const main = mainRes.data || {};
      const perf = perfRes.data || {};

      // Force numbers — never stuck at default
      const equity = Number(main.equity) || Number(main.accountEquity) || 100000;
      const unrealized = Number(main.unrealized) || 0;
      const positions = Number(main.positions) || 0;
      const mode = main.mode || "PAPER";

      setData({
        equity,
        unrealized,
        positions,
        mode,
        rockets: Array.isArray(main.rockets) ? main.rockets : ["Scanning..."],
        winRate: perf.winRate ?? perf.stats?.winRate ?? 0,
        recent: Array.isArray(perf.recent) ? perf.recent : [],
        logs: Array.isArray(main.logs) ? main.logs.slice(-40) : []
      });
    } catch (err: any) {
      console.error("Dashboard fetch failed:", err);
      setError(`Connection failed: ${err.message}`);
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
    setError(null);
    try {
      await axios.post(`${URL}/scan`, {}, { timeout: 15000 });
      await fetchData();
    } catch (err: any) {
      setError(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  // Equity Curve — Always Safe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.recent || data.recent.length < 2) return;

    const ctx = canvas.getContext('2d')!;
    const values = data.recent.map(p => p.equity);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();

    data.recent.forEach((p, i) => {
      const x = (i / (data.recent!.length - 1)) * canvas.width;
      const y = canvas.height - ((p.equity - min) / range) * (canvas.height - 40) + 20;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [data.recent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-purple-400 text-lg">Connecting to AlphaStream...</p>
        </div>
      </div>
    );
  }

  const equity = data.equity;
  const unreal = data.unrealized;
  const winRate = Number(data.winRate || 0).toFixed(1);
  const hasLogs = data.logs && data.logs.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-b-2 border-purple-600">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            AlphaStream v100 ELITE
          </h1>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
            data.mode === "LIVE" ? "bg-red-600" : "bg-gradient-to-r from-emerald-500 to-cyan-600"
          }`}>
            {data.mode}
          </span>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-4xl mx-auto space-y-5 pb-16">
        <h2 className="text-2xl font-black text-center bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
          ELITE SNIPER ACTIVE
        </h2>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/80 border border-red-500 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/10 rounded-xl p-4 border border-purple-500 text-center">
            <p className="text-lg font-bold text-purple-400">${equity.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Equity</p>
          </div>
          <div className={`bg-white/10 rounded-xl p-4 border ${unreal >= 0 ? 'border-green-500' : 'border-red-500'} text-center`}>
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-400" />
            <p className={`text-lg font-bold ${unreal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {unreal >= 0 ? '+' : '-'}${Math.abs(unreal).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Unrealized</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-yellow-500 text-center">
            <p className="text-xl font-bold text-yellow-400">{winRate}%</p>
            <p className="text-xs text-gray-400">Win Rate</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-orange-500 text-center">
            <p className="text-xl font-bold text-orange-400">{data.positions}</p>
            <p className="text-xs text-gray-400">Positions</p>
          </div>
        </div>

        {/* Equity Curve */}
        <div className="bg-black/60 rounded-xl p-4 border border-cyan-500">
          <h3 className="text-sm font-bold text-cyan-400 text-center mb-2">LIVE EQUITY CURVE</h3>
          <canvas ref={canvasRef} width={800} height={160} className="w-full rounded-lg bg-black/40" />
        </div>

        {/* Live Logs */}
        <div className="bg-black/70 rounded-xl p-4 border border-green-500">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-bold text-green-400">LIVE BOT LOGS</h3>
          </div>
          <div className="bg-black/80 rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs text-gray-300">
            {hasLogs ? (
              data.logs!.map((log, i) => (
                <div key={i} className="py-0.5 border-b border-gray-800 last:border-0 whitespace-pre-wrap">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic">No logs yet — bot starting up...</div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Rockets Fired */}
        {data.rockets && data.rockets.length > 0 && data.rockets[0] !== "Scanning..." && (
          <div className="bg-black/60 rounded-xl p-4 border border-yellow-500">
            <h3 className="text-sm font-bold text-center text-yellow-400 mb-3">ROCKETS FIRED</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.rockets.slice(0, 6).map((r, i) => {
                const parts = r.split(' ');
                const symbol = parts[0];
                const gain = parts[1];
                const pattern = parts.slice(2).join(' ').replace(/[[\]]/g, '');
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-800 to-pink-800 rounded-lg p-3 text-center border border-yellow-500">
                    <p className="text-base font-bold">{symbol}</p>
                    <p className="text-sm text-green-400">{gain}</p>
                    {pattern && <p className="text-xs text-cyan-300">{pattern}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Force Scan */}
        <div className="text-center pt-4">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-16 py-6 text-xl font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all shadow-xl border-4 border-purple-400 flex items-center gap-4 mx-auto disabled:opacity-60"
          >
            <RefreshCw className={`w-8 h-8 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>
    </div>
  );
}
