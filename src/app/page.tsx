'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Trophy, Package, TrendingUp, X } from 'lucide-react';

export default function Home() {
  const [bot, setBot] = useState<any>({});
  const [perf, setPerf] = useState<any>({ stats: {}, recent: [] });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showPos, setShowPos] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const [b, p] = await Promise.all([
        axios.get(URL),
        axios.get(URL + "/performance")
      ]);
      setBot(b.data);
      setPerf(p.data);
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 12000);
    return () => clearInterval(i);
  }, []);

  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${URL}/scan`).catch(() => {});
    setScanning(false);
    fetchData();
  };

  // Equity Curve Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !perf.recent || perf.recent.length < 2) return;
    const ctx = canvas.getContext('2d')!;
    const points = perf.recent.map((t: any) => ({ equity: parseFloat(t.equity) || 100000 }));
    const min = Math.min(...points.map((p: any) => p.equity));
    const max = Math.max(...points.map((p: any) => p.equity));
    const range = max - min || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();

    points.forEach((p: any, i: number) => {
      const x = (i / (points.length - 1)) * canvas.width;
      const y = canvas.height - ((p.equity - min) / range) * (canvas.height * 0.85) + 16;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [perf.recent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f3d] to-[#0f0f1f] flex items-center justify-center">
        <Activity className="w-16 h-16 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const s = perf.stats;
  const unreal = bot.unrealized || "+$0";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f3d] to-[#0f0f1f] text-white font-sans">

      {/* WARRIOR HEADER */}
      <header className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-md border-b-2 border-cyan-500">
        <div className="max-w-4xl mx-auto px-5 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
              A
            </div>
            <h1 className="text-xl font-black tracking-tight">
              AlphaStream <span className="text-cyan-400">v100 ELITE</span>
            </h1>
          </div>
          <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600">
            {bot.mode || "LIVE"}
          </span>
        </div>
      </header>

      <main className="pt-20 pb-10 px-4 max-w-4xl mx-auto space-y-6">

        {/* TITLE */}
        <h2 className="text-3xl font-black text-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          WARRIOR SNIPER 2025
        </h2>

        {/* STATS GRID — 40% SMALLER */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-cyan-500/50">
            <p className="text-xl font-bold">{bot.equity || "$100,000"}</p>
            <p className="text-xs text-gray-400">Equity</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-green-500/50">
            <p className={`text-xl font-bold ${unreal.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {unreal}
            </p>
            <p className="text-xs text-gray-400">Unrealized</p>
          </div>
          <div onClick={() => setShowWin(true)} className="bg-white/5 rounded-xl p-3 text-center border border-yellow-500/50 cursor-pointer hover:bg-white/10 transition">
            <Trophy className="w-8 h-8 mx-auto text-yellow-400 mb-1" />
            <p className="text-2xl font-black text-yellow-400">{s.winRate || "0.0"}%</p>
            <p className="text.xs text-gray-400">Win Rate</p>
          </div>
          <div onClick={() => setShowPos(true)} className="bg-white/5 rounded-xl p-3 text-center border border-orange-500/50 cursor-pointer hover:bg-white/10 transition">
            <Package className="w-8 h-8 mx-auto text-orange-400 mb-1" />
            <p className="text-2xl font-black text-orange-300">{bot.positions || 0}</p>
            <p className="text-xs text-gray-400">Positions</p>
          </div>
        </div>

        {/* FORCE SCAN BUTTON — 40% SMALLER */}
        <div className="flex justify-center">
          <button
            onClick={forceScan}
            disabled={scanning}
            className={`
              px-8 py-4 rounded-2xl text-xl font-bold tracking-wider
              bg-gradient-to-r from-cyan-600 to-blue-700
              hover:from-cyan-500 hover:to-blue-600 active:scale-95
              transition-all duration-200 shadow-xl border-2 border-cyan-400
              flex items-center gap-4
              ${scanning ? 'animate-pulse' : 'hover:scale-105'}
            `}
          >
            <RefreshCw className={`w-8 h-8 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>

        {/* ROCKETS — CLEANER & SMALLER */}
        {bot.rockets?.length > 0 && (
          <div className="bg-black/60 rounded-2xl p-5 border border-cyan-500">
            <h3 className="text-xl font-black text-center text-cyan-400 mb-4">ELITE ROCKETS</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {bot.rockets.map((r: string, i: number) => {
                const symbol = r.split(' ')[0];
                const pct = r.match(/\+([\d.]+)%/)?.[1] || "?";
                const pattern = r.match(/\[(.*?)\]/)?.[1] || "ELITE";
                return (
                  <div key={i} className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-lg p-3 text-center border border-cyan-600/50">
                    <p className="text-lg font-black">{symbol}</p>
                    <p className="text-green-400 font-bold">+{pct}%</p>
                    <p className="text-xs text-cyan-300">{pattern}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EQUITY CURVE — SMALLER */}
        <div className="bg-black/60 rounded-2xl p-5 border border-cyan-500">
          <h3 className="text-lg font-bold text-center text-cyan-400 mb-3">EQUITY CURVE</h3>
          <div className="h-48 bg-black/40 rounded-xl overflow-hidden">
            {perf.recent?.length > 1 ? (
              <canvas ref={canvasRef} width={800} height={192} className="w-full h-full" />
            ) : (
              <p className="h-full flex items-center justify-center text-gray-500 text-sm">Waiting for trades...</p>
            )}
          </div>
        </div>

      </main>

      {/* WIN RATE MODAL */}
      {showWin && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowWin(false)}>
          <div className="bg-gradient-to-br from-cyan-900 to-blue-900 rounded-2xl p-6 border-2 border-yellow-500 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-yellow-400">WIN RATE</h3>
              <X className="w-6 h-6 cursor-pointer" onClick={() => setShowWin(false)} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-5xl font-black text-yellow-400">{s.winRate || "0.0"}%</p>
              <p className="text-lg text-gray-300">Trades: {s.trades || 0}</p>
              <p className="text-green-400 text-lg">Avg Win: {s.avgWin || "+0"}%</p>
            </div>
          </div>
        </div>
      )}

      {/* POSITIONS MODAL */}
      {showPos && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowPos(false)}>
          <div className="bg-gradient-to-br from-orange-900 to-red-900 rounded-2xl p-6 border-2 border-orange-500 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-orange-400">POSITIONS</h3>
              <X className="w-6 h-6 cursor-pointer" onClick={() => setShowPos(false)} />
            </div>
            <p className="text-6xl font-black text-center text-orange-300">{bot.positions || 0}</p>
            <p className="text-lg text-center text-gray-300 mt-3">ACTIVE ROCKETS</p>
          </div>
        </div>
      )}
    </div>
  );
}
