'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, TrendingUp, Terminal } from 'lucide-react';

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
    mode: "PAPER",
    rockets: ["Scanning..."],
    winRate: 0,
    recent: [],
    logs: []
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // YOUR BACKEND URL — CHANGE ONLY THIS IF NEEDED
  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mainRes, perfRes] = await Promise.all([
        axios.get(URL).catch(() => ({ data: {} })),
        axios.get(URL + "/performance").catch(() => ({ data: {} }))
      ]);
      setData(prev => ({
        ...prev,
        ...mainRes.data,
        winRate: (perfRes.data as any).winRate ?? prev.winRate,
        recent: (perfRes.data as any).recent ?? prev.recent ?? []
      }));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const int = setInterval(fetchData, 9000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${URL}/scan`).catch(() => {});
    await fetchData();
    setScanning(false);
  };

  // Equity Curve — Safe & Small
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.recent || data.recent.length === 0) return;
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
        <Activity className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  const equity = Number(data.equity || 100000);
  const unreal = Number(data.unrealized || 0);
  const winRate = Number(data.winRate || 0).toFixed(1);
  const hasLogs = data.logs && data.logs.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-b-2 border-purple-600">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            AlphaStream v100
          </h1>
          <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-500 to-cyan-600">
            {data.mode}
          </span>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-4xl mx-auto space-y-5 pb-16">
        <h2 className="text-2xl font-black text-center bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
          ELITE SNIPER
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/10 rounded-xl p-4 border border-purple-500 text-center">
            <p className="text-lg font-bold text-purple-400">${equity.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Equity</p>
          </div>
          <div className={`bg-white/10 rounded-xl p-4 border ${unreal >= 0 ? 'border-green-500' : 'border-red-500'} text-center`}>
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
          <h3 className="text-sm font-bold text-cyan-400 text-center mb-2">EQUITY CURVE</h3>
          <canvas ref={canvasRef} width={800} height={160} className="w-full rounded-lg bg-black/40" />
        </div>

        {/* Logs */}
        <div className="bg-black/70 rounded-xl p-4 border border-green-500">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-bold text-green-400">LIVE LOGS</h3>
          </div>
          <div className="bg-black/80 rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs text-gray-300">
            {hasLogs ? data.logs!.map((l, i) => (
              <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">{l}</div>
            )) : (
              <div className="text-gray-500 italic">Waiting for logs...</div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Rockets */}
        {data.rockets && data.rockets.length > 0 && data.rockets[0] !== "Scanning..." && (
          <div className="bg-black/60 rounded-xl p-4 border border-yellow-500">
            <h3 className="text-sm font-bold text-center text-yellow-400 mb-3">ROCKETS FIRED</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.rockets.slice(0, 6).map((r, i) => {
                const [sym, gain, ...rest] = r.split(' ');
                const pattern = rest.join(' ').replace(/[[\]]/g, '');
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-800 to-pink-800 rounded-lg p-3 text-center border border-yellow-500">
                    <p className="text-base font-bold">{sym}</p>
                    <p className="text-sm text-green-400">{gain}</p>
                    {pattern && <p className="text-xs text-cyan-300">{pattern}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Force Scan Button */}
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
