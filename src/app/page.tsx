'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Zap, Activity, Trophy, Package, RefreshCw, X } from 'lucide-react';

export default function Dashboard() {
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 11000);
    return () => clearInterval(i);
  }, []);

  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${URL}/scan`).catch(() => {});
    setScanning(false);
    fetchData();
  };

  // Equity Curve — Neon Glow
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || perf.recent?.length < 2) return;
    const ctx = canvas.getContext('2d')!;
    const equities = perf.recent.map((t: any) => parseFloat(t.equity) || 100000);
    const min = Math.min(...equities);
    const max = Math.max(...equities);
    const range = max - min || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#c084fc';

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();

    equities.forEach((eq: number, i: number) => {
      const x = (i / (equities.length - 1)) * canvas.width;
      const y = canvas.height - ((eq - min) / range) * (canvas.height * 0.86) + 18;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [perf.recent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-20 h-20 text-purple-500 animate-spin" />
      </div>
    );
  }

  const s = perf.stats;
  const unreal = bot.unrealized || "+$0";

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* NEON HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-purple-500/30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-black">
              α
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AlphaStream
              </h1>
              <p className="text-xs text-purple-400">v100 ELITE • AUTOPILOT</p>
            </div>
          </div>
          <div className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-bold shadow-lg shadow-purple-500/20">
            {bot.mode || "LIVE"}
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 max-w-5xl mx-auto space-y-8">

        {/* HERO TITLE */}
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            ALPHA SNIPER
          </h2>
          <p className="text-purple-400 mt-2 text-lg">2025 Momentum Engine</p>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-gradient-to-br from-purple-900/20 to-black rounded-2xl p-5 border border-purple-500/30 backdrop-blur-sm">
            <p className="text-3xl font-black text-purple-300">{bot.equity || "$100,000"}</p>
            <p className="text-sm text-purple-400">Portfolio Value</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/20 to-black rounded-2xl p-5 border border-emerald-500/30 backdrop-blur-sm">
            <p className={`text-3xl font-black ${unreal.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
              {unreal}
            </p>
            <p className="text-sm text-emerald-400">Unrealized P&L</p>
          </div>

          <div 
            onClick={() => setShowWin(true)}
            className="bg-gradient-to-br from-yellow-900/20 to-black rounded-2xl p-5 border border-yellow-500/30 backdrop-blur-sm cursor-pointer hover:scale-105 transition"
          >
            <Trophy className="w-10 h-10 mx-auto text-yellow-400 mb-2" />
            <p className="text-4xl font-black text-yellow-400">{s.winRate || "0.0"}%</p>
            <p className="text-sm text-yellow-400">Win Rate</p>
          </div>

          <div 
            onClick={() => setShowPos(true)}
            className="bg-gradient-to-br from-orange-900/20 to-black rounded-2xl p-5 border border-orange-500/30 backdrop-blur-sm cursor-pointer hover:scale-105 transition"
          >
            <Package className="w-10 h-10 mx-auto text-orange-400 mb-2" />
            <p className="text-4xl font-black text-orange-300">{bot.positions || 0}</p>
            <p className="text-sm text-orange-400">Live Positions</p>
          </div>
        </div>

        {/* FORCE SCAN BUTTON */}
        <div className="flex justify-center mt-8">
          <button
            onClick={forceScan}
            disabled={scanning}
            className={`
              group relative px-12 py-6 rounded-2xl text-2xl font-black tracking-wider
              bg-gradient-to-r from-purple-600 to-pink-600
              hover:from-purple-500 hover:to-pink-500
              active:scale-95 transition-all duration-300
              shadow-2xl shadow-purple-500/40 border-4 border-purple-400
              flex items-center gap-5 overflow-hidden
              ${scanning ? 'animate-pulse' : ''}
            `}
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition"></div>
            <Zap className={`w-10 h-10 ${scanning ? 'animate-spin' : 'group-hover:rotate-12 transition'}`} />
            <span>{scanning ? "HUNTING..." : "FORCE SCAN"}</span>
          </button>
        </div>

        {/* ACTIVE ROCKETS */}
        {bot.rockets?.length > 0 && (
          <div className="bg-black/60 rounded-3xl p-8 border-2 border-purple-500/50 backdrop-blur-sm">
            <h3 className="text-3xl font-black text-center mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ACTIVE ROCKETS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {bot.rockets.map((r: string, i: number) => {
                const symbol = r.split(' ')[0];
                const pct = r.match(/\+([\d.]+)%/)?.[1] || "?";
                const pattern = r.match(/\[(.*?)\]/)?.[1] || "ALPHA";
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-900/40 to-pink-900/20 rounded-2xl p-5 text-center border border-purple-500/30 hover:scale-110 transition">
                    <p className="text-2xl font-black text-purple-300">{symbol}</p>
                    <p className="text-3xl font-black text-emerald-400">+{pct}%</p>
                    <p className="text-xs uppercase tracking-wider text-pink-400 mt-1">{pattern}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EQUITY CURVE */}
        <div className="bg-black/60 rounded-3xl p-8 border-2 border-purple-500/50 backdrop-blur-sm">
          <h3 className="text-2xl font-black text-center mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            LIVE EQUITY CURVE
          </h3>
          <div className="h-64 bg-black/80 rounded-2xl overflow-hidden border border-purple-500/30">
            {perf.recent?.length > 1 ? (
              <canvas ref={canvasRef} width={1000} height={256} className="w-full h-full rounded-2xl" />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-purple-400/60 text-lg">Awaiting first execution...</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* WIN RATE MODAL */}
      {showWin && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowWin(false)}>
          <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/50 rounded-3xl p-10 border-4 border-purple-400 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-black text-purple-300">WIN RATE</h3>
              <X className="w-8 h-8 cursor-pointer text-purple-400" onClick={() => setShowWin(false)} />
            </div>
            <div className="text-center space-y-4">
              <p className="text-7xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {s.winRate || "0.0"}%
              </p>
              <p className="text-xl text-purple-300">Total Trades: {s.trades || 0}</p>
              <p className="text-2xl text-emerald-400">Avg Win: {s.avgWin || "+0"}%</p>
            </div>
          </div>
        </div>
      )}

      {/* POSITIONS MODAL */}
      {showPos && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowPos(false)}>
          <div className="bg-gradient-to-br from-orange-900/80 to-red-900/40 rounded-3xl p-10 border-4 border-orange-500 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-black text-orange-300">POSITIONS</h3>
              <X className="w-8 h-8 cursor-pointer text-orange-400" onClick={() => setShowPos(false)} />
            </div>
            <p className="text-8xl font-black text-center text-orange-300">{bot.positions || 0}</p>
            <p className="text-2xl text-center text-orange-400 mt-4">ACTIVE TRADES</p>
          </div>
        </div>
      )}
    </div>
  );
}
