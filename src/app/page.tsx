'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Zap, Activity, Trophy, Package, Timer, Flame, Rocket, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [bot, setBot] = useState<any>({});
  const [perf, setPerf] = useState<any>({ stats: {}, recent: [] });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const [main, performance] = await Promise.all([
        axios.get(URL, { timeout: 10000 }),
        axios.get(URL + "/performance", { timeout: 10000 })
      ]);
      setBot(main.data);
      setPerf(performance.data);
    } catch (e) {
      console.error("Connection failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 10000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => (c <= 0 ? 10 : c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${URL}/scan`).catch(() => {});
    setScanning(false);
    fetchData();
  };

  // Equity Curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !perf.recent?.length) return;
    const ctx = canvas.getContext('2d')!;
    const values = perf.recent.map((p: any) => parseFloat(p.equity || 100000));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#c084fc';
    ctx.lineCap = 'round';
    ctx.beginPath();

    values.forEach((val, i) => {
      const x = (i / (values.length - 1)) * canvas.width;
      const y = canvas.height - ((val - min) / range) * (canvas.height * 0.88) + 12;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [perf.recent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-14 h-14 text-purple-500 animate-spin" />
      </div>
    );
  }

  const unreal = bot.unrealized || "+$0";
  const isProfit = unreal.startsWith('+');

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-purple-600/40">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl font-black">
              α
            </div>
            <div>
              <h1 className="text-lg font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AlphaStream v100
              </h1>
              <p className="text-xs text-purple-400">ELITE SNIPER</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-purple-300">
              <Timer className="w-3.5 h-3.5" />
              {countdown}s
            </div>
            <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-xs font-bold">
              {bot.mode || "LIVE"}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16 pb-8 px-4 max-w-5xl mx-auto space-y-5">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            7 ELITE PATTERNS
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-900/20 to-black rounded-xl p-4 border border-purple-500/40">
            <p className="text-2xl font-black text-purple-300">{bot.equity || "$100,000"}</p>
            <p className="text-xs text-purple-400">Equity</p>
          </div>
          <div className={`bg-gradient-to-br ${isProfit ? 'from-emerald-900/20' : 'from-red-900/20'} to-black rounded-xl p-4 border ${isProfit ? 'border-emerald-500/40' : 'border-red-500/40'}`}>
            <TrendingUp className={`w-8 h-8 mx-auto mb-1 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`} />
            <p className={`text-2xl font-black ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>{unreal}</p>
            <p className="text-xs text-gray-400">P&L</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/20 to-black rounded-xl p-4 border border-yellow-500/40">
            <Trophy className="w-9 h-9 mx-auto text-yellow-400 mb-1" />
            <p className="text-3xl font-black text-yellow-400">{perf.stats?.winRate || "0.0"}%</p>
            <p className="text-xs text-yellow-400">Win Rate</p>
          </div>
          <div className="bg-gradient-to-br from-orange-900/20 to-black rounded-xl p-4 border border-orange-500/40">
            <Package className="w-9 h-9 mx-auto text-orange-400 mb-1" />
            <p className="text-3xl font-black text-orange-300">{bot.positions || 0}</p>
            <p className="text-xs text-orange-400">Positions</p>
          </div>
        </div>

        {/* Rockets */}
        {bot.rockets?.length > 0 && (
          <div className="bg-black/60 rounded-2xl p-5 border border-purple-500/50">
            <h3 className="text-xl font-black text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ELITE ROCKETS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {bot.rockets.map((r: string, i: number) => {
                const symbol = r.split(' ')[0];
                const pct = r.match(/\+([\d.]+)%/)?.[1] || "?";
                const pattern = r.match(/\[(.*?)\]/)?.[1]?.replace(/_/g, ' ') || "ALPHA";
                const hot = parseFloat(pct) > 40;
                return (
                  <div key={i} className="relative bg-gradient-to-br from-purple-900/50 to-pink-900/30 rounded-xl p-4 text-center border border-purple-500/50 hover:scale-105 transition">
                    {hot && <Flame className="absolute top-1 right-1 w-5 h-5 text-orange-400 animate-pulse" />}
                    <Rocket className="w-8 h-8 mx-auto text-purple-300 mb-1" />
                    <p className="text-lg font-black text-purple-200">{symbol}</p>
                    <p className="text-2xl font-black text-emerald-400">+{pct}%</p>
                    <p className="text-xs uppercase tracking-wider text-pink-400 font-bold">{pattern}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Equity Curve */}
        <div className="bg-black/60 rounded-2xl p-5 border border-purple-500/40">
          <h3 className="text-xl font-black text-center mb-3 text-purple-300">
            LIVE EQUITY CURVE
          </h3>
          <div className="h-48 bg-black/80 rounded-xl overflow-hidden border border-purple-500/30">
            <canvas ref={canvasRef} width={1000} height={192} className="w-full h-full" />
          </div>
        </div>

        {/* Force Scan */}
        <div className="text-center">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="group px-10 py-5 rounded-2xl text-xl font-black bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all shadow-2xl shadow-purple-600/60 border-3 border-purple-400 flex items-center gap-4 mx-auto"
          >
            {scanning ? <Activity className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8 group-hover:rotate-12 transition" />}
            <span>{scanning ? "SNIPING..." : "FORCE SCAN"}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
