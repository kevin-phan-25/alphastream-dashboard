'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Trophy, Package, TrendingUp, X } from 'lucide-react';

export default function Home() {
  const [bot, setBot] = useState<any>({});
  const [perf, setPerf] = useState<any>({ stats: {}, equityCurve: [] });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showPos, setShowPos] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetch = async () => {
    try {
      const [b, p] = await Promise.all([axios.get(URL), axios.get(URL + "/performance")]);
      setBot(b.data);
      setPerf(p.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); const i = setInterval(fetch, 10000); return () => clearInterval(i); }, []);

  const scan = async () => {
    setScanning(true);
    await axios.post(`${URL}/scan`).catch(() => {});
    setScanning(false);
    fetch();
  };

  // Equity Curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || perf.equityCurve.length < 2) return;
    const ctx = canvas.getContext('2d')!;
    const pts = perf.equityCurve;
    const min = Math.min(...pts.map((p: any) => p.equity));
    const max = Math.max(...pts.map((p: any) => p.equity));
    const range = max - min || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 5;
    ctx.beginPath();
    pts.forEach((p: any, i: number) => {
      const x = (i / (pts.length - 1)) * canvas.width;
      const y = canvas.height - ((p.equity - min) / range) * canvas.height * 0.88 + 30;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [perf.equityCurve]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Activity className="w-32 h-32 text-purple-500 animate-spin" /></div>;

  const s = perf.stats;
  const unreal = bot.unrealized || "+$0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white">
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/90 border-b-4 border-purple-600">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            AlphaStream v98 ELITE
          </h1>
          <span className="px-8 py-3 rounded-full text-2xl font-black bg-gradient-to-r from-green-500 to-emerald-600">
            {bot.mode} MODE
          </span>
        </div>
      </header>

      <main className="pt-28 px-6 max-w-5xl mx-auto space-y-12">
        <h2 className="text-6xl font-black text-center bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
          ELITE SNIPER
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white/10 rounded-2xl p-6 text-center border-2 border-purple-500">
            <p className="text-4xl font-black">{bot.equity || "$100,000"}</p>
            <p className="text-gray-300">Equity</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 text-center border-2 border-green-500">
            <TrendingUp className="w-14 h-14 mx-auto text-green-400 mb-1" />
            <p className={`text-4xl font-black ${unreal.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{unreal}</p>
            <p className="text-gray-300">Unrealized</p>
          </div>
          <div onClick={() => setShowWin(true)} className="bg-white/10 rounded-2xl p-6 text-center border-2 border-yellow-500 hover:scale-110 cursor-pointer transition">
            <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-1" />
            <p className="text-5xl font-black text-yellow-400">{s.winRate || "0.0"}%</p>
            <p className="text-gray-300">Win Rate</p>
          </div>
          <div onClick={() => setShowPos(true)} className="bg-white/10 rounded-2xl p-6 text-center border-2 border-orange-500 hover:scale-110 cursor-pointer transition">
            <Package className="w-16 h-16 mx-auto text-orange-400 mb-1" />
            <p className="text-5xl font-black text-orange-300">{bot.positions || 0}</p>
            <p className="text-gray-300">Positions</p>
          </div>
        </div>

        {/* FORCE SCAN MOVED UP */}
        <div className="text-center py-10">
          <button
            onClick={scan}
            disabled={scanning}
            className="px-40 py-16 text-6xl font-black rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all shadow-2xl border-8 border-purple-400 flex items-center gap-12 mx-auto"
          >
            <RefreshCw className={`w-24 h-24 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>

        {/* Rockets */}
        {bot.rockets?.length > 0 && (
          <div className="bg-black/60 rounded-3xl p-10 border-4 border-yellow-500">
            <h3 className="text-5xl font-black text-center text-yellow-400 mb-8">ELITE ROCKETS</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
              {bot.rockets.map((r: string, i: number) => {
                const symbol = r.split('+')[0].trim();
                const pct = r.split('+')[1]?.split(' ')[0];
                const pattern = r.match(/\[(.*?)\]/)?.[1] || "ELITE";
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-700 to-pink-800 rounded-xl p-6 text-center">
                    <p className="text-4xl font-black">{symbol}</p>
                    <p className="text-3xl text-green-400">+{pct}</p>
                    <p className="text-sm font-bold text-cyan-300">{pattern}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LIVE EQUITY CURVE MOVED DOWN */}
        <div className="bg-black/60 rounded-3xl p-8 border-4 border-cyan-500">
          <h3 className="text-4xl font-black text-center text-cyan-400 mb-6">LIVE EQUITY CURVE</h3>
          <div className="h-80 bg-black/40 rounded-2xl overflow-hidden">
            {perf.equityCurve.length > 1 ? (
              <canvas ref={canvasRef} width={1000} height={320} className="w-full" />
            ) : (
              <p className="h-full flex items-center justify-center text-gray-500 text-2xl">Waiting for trades...</p>
            )}
          </div>
        </div>
      </main>

      {/* WIN RATE MODAL */}
      {showWin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowWin(false)}>
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-12 border-4 border-yellow-500 max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-4xl font-black text-yellow-400">WIN RATE</h3>
              <X className="w-10 h-10 cursor-pointer" onClick={() => setShowWin(false)} />
            </div>
            <div className="text-center space-y-4">
              <p className="text-7xl font-black text-yellow-400">{s.winRate || "0.0"}%</p>
              <p className="text-2xl text-gray-300">Total Trades: {s.trades || 0}</p>
              <p className="text-xl text-green-400">Avg Win: {s.avgWin || "+0%"}</p>
              <p className="text-xl text-red-400">Avg Loss: {s.avgLoss || "0%"}</p>
            </div>
          </div>
        </div>
      )}

      {/* POSITIONS MODAL */}
      {showPos && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowPos(false)}>
          <div className="bg-gradient-to-br from-orange-900 to-red-900 rounded-3xl p-12 border-4 border-orange-500 max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-4xl font-black text-orange-400">POSITIONS</h3>
              <X className="w-10 h-10 cursor-pointer" onClick={() => setShowPos(false)} />
            </div>
            <p className="text-8xl font-black text-center text-orange-300">{bot.positions || 0}</p>
            <p className="text-2xl text-center text-gray-300 mt-4">ACTIVE ELITE ROCKETS</p>
          </div>
        </div>
      )}
    </div>
  );
}
