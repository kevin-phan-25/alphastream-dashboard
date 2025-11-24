'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Zap, Activity, Trophy, Package, Shield, Timer, Flame, Rocket, TrendingUp } from 'lucide-react';

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
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(c => (c <= 0 ? 10 : c - 1)), 1000);
    return () => clearInterval(timer);
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
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#c084fc';
    ctx.lineCap = 'round';
    ctx.beginPath();

    values.forEach((val, i) => {
      const x = (i / (values.length - 1)) * canvas.width;
      const y = canvas.height - ((val - min) / range) * (canvas.height * 0.88) + 16;
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

  const unreal = bot.unrealized || "+$0";
  const isProfit = unreal.startsWith('+');
  const equityNum = parseFloat(bot.equity?.replace(/[$,]/g, "") || "100000");

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-purple-600/50">
        <div className="max-w-6xl mx-auto px-5 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-black shadow-2xl">
              α
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AlphaStream v100
              </h1>
              <p className="text-xs text-purple-400">ELITE AUTONOMOUS SNIPER</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-purple-300">
              <Timer className="w-4 h-4" />
              Next scan: {countdown}s
            </div>
            <div className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-sm font-bold shadow-lg">
              {bot.mode || "LIVE"} MODE
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-5 max-w-6xl mx-auto space-y-8">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
            7 ELITE PATTERNS
          </h2>
          <p className="text-purple-300 text-lg mt-2">Fully Autonomous • Real Alpaca • Live Trading</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-gradient-to-br from-purple-900/30 to-black rounded-2xl p-5 border border-purple-500/50 backdrop-blur-sm">
            <p className="text-3xl font-black text-purple-300">{bot.equity || "$100,000"}</p>
            <p className="text-sm text-purple-400">Account Equity</p>
          </div>
          <div className={`bg-gradient-to-br ${isProfit ? 'from-emerald-900/30' : 'from-red-900/30'} to-black rounded-2xl p-5 border ${isProfit ? 'border-emerald-500/50' : 'border-red-500/50'} backdrop-blur-sm`}>
            <TrendingUp className={`w-10 h-10 mx-auto mb-2 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`} />
            <p className={`text-3xl font-black ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>{unreal}</p>
            <p className="text-sm text-gray-300">Unrealized P&L</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/30 to-black rounded-2xl p-5 border border-yellow-500/50 backdrop-blur-sm">
            <Trophy className="w-12 h-12 mx-auto text-yellow-400 mb-2" />
            <p className="text-4xl font-black text-yellow-400">{perf.stats?.winRate || "0.0"}%</p>
            <p className="text-sm text-yellow-300">Win Rate</p>
          </div>
          <div className="bg-gradient-to-br from-orange-900/30 to-black rounded-2xl p-5 border border-orange-500/50 backdrop-blur-sm">
            <Package className="w-12 h-12 mx-auto text-orange-400 mb-2" />
            <p className="text-4xl font-black text-orange-300">{bot.positions || 0}</p>
            <p className="text-sm text-orange-400">Live Positions</p>
          </div>
        </div>

        {/* Active Rockets */}
        {bot.rockets?.length > 0 && (
          <div className="  className="bg-black/70 rounded-3xl p-8 border-2 border-purple-600/70 shadow-2xl">
            <h3 className="text-3xl font-black text-center mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ELITE ROCKETS DETECTED
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {bot.rockets.map((r: string, i: number) => {
                const symbol = r.split(' ')[0];
                const pct = r.match(/\+([\d.]+)%/)?.[1] || "?";
                const pattern = r.match(/\[(.*?)\]/)?.[1]?.replace(/_/g, ' ') || "ALPHA";
                const hot = parseFloat(pct) > 40;
                return (
                  <div key={i} className="relative bg-gradient-to-br from-purple-900/60 to-pink-900/40 rounded-2xl p-6 text-center border border-purple-500/70 hover:scale-105 transition-all">
                    {hot && <Flame className="absolute top-2 right-2 w-8 h-8 text-orange-400 animate-pulse" />}
                    <Rocket className="w-12 h-12 mx-auto text-purple-300 mb-3" />
                    <p className="text-2xl font-black text-purple-200">{symbol}</p>
                    <p className="text-4xl font-black text-emerald-400">+{pct}%</p>
                    <p className="text-xs uppercase tracking-widest text-pink-400 font-bold mt-2">{pattern}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Equity Curve */}
        <div className="bg-black/70 rounded-3xl p-8 border-2 border-purple-600/50 shadow-2xl">
          <h3 className="text-3xl font-black text-center mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            LIVE EQUITY CURVE
          </h3>
          <div className="h-64 bg-black/90 rounded-2xl overflow-hidden border border-purple-500/30">
            <canvas ref={canvasRef} width={1200} height={256} className="w-full h-full" />
          </div>
        </div>

        {/* Force Scan Button */}
        <div className="text-center pt-8">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="group relative px-16 py-8 rounded-3xl text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all shadow-2xl shadow-purple-600/70 border-4 border-purple-400 flex items-center gap-6 mx-auto"
          >
            {scanning ? <Activity className="w-12 h-12 animate-spin" /> : <Zap className="w-12 h-12 group-hover:rotate-12 transition" />}
            <span>{scanning ? "SNIPING LIVE..." : "FORCE ELITE SCAN"}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
