'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Zap, Activity, Trophy, Package, Shield, ChevronDown, ChevronUp, Timer, Flame, Rocket } from 'lucide-react';

export default function Dashboard() {
  const [bot, setBot] = useState<any>({});
  const [perf, setPerf] = useState<any>({ stats: {}, recent: [] });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showRisk, setShowRisk] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const [b, p] = await Promise.all([
        axios.get(URL, { timeout: 10000 }),
        axios.get(URL + "/performance", { timeout: 10000 })
      ]);
      setBot(b.data || {});
      setPerf(p.data || { stats: {}, recent: [] });
    } catch (e) {
      console.error("Fetch failed:", e);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !perf.recent || perf.recent.length < 2) return;
    const ctx = canvas.getContext('2d')!;
    const equities = perf.recent.map((t: any) => parseFloat(t.equity || 100000));
    const min = Math.min(...equities);
    const max = Math.max(...equities);
    const range = max - min || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#c084fc';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();

    equities.forEach((eq: number, i: number) => {
      const x = (i / (equities.length - 1)) * canvas.width;
      const y = canvas.height - ((eq - min) / range) * (canvas.height * 0.88) + 10;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [perf.recent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  const unreal = bot.unrealized || "+$0";
  const isProfit = unreal.startsWith('+');
  const dailyDD = parseFloat(bot.dailyDD) || 0;
  const weeklyDD = parseFloat(bot.weeklyDD) || 0;
  const totalDD = parseFloat(bot.totalDD) || 0;

  const [countdown, setCountdown] = useState(11);
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => (c <= 0 ? 11 : c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-purple-500/30">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl font-black shadow-lg">
              α
            </div>
            <div>
              <h1 className="text-lg font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AlphaStream
              </h1>
              <p className="text-xs text-purple-400 -mt-1">v100 ELITE</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-purple-300">
              <Timer className="w-3.5 h-3.5" />
              {countdown}s
            </div>
            <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-bold">
              {bot.mode || "LIVE"}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16 pb-8 px-4 max-w-5xl mx-auto space-y-4">
        <div className="text-center">
          <h2 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            ALPHA SNIPER
          </h2>
          <p className="text-purple-300 text-xs mt-1">7 Patterns • Institutional Risk</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-purple-900/20 to-black rounded-xl p-3 border border-purple-500/40">
            <p className="text-xl font-black text-purple-300">{bot.equity || "$100,000"}</p>
            <p className="text-xs text-purple-400">Equity</p>
          </div>
          <div className={`bg-gradient-to-br from-${isProfit ? 'emerald' : 'red'}-900/20 to-black rounded-xl p-3 border ${isProfit ? 'border-emerald-500/40' : 'border-red-500/40'}`}>
            <p className={`text-xl font-black ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>{unreal}</p>
            <p className="text-xs text-emerald-400">Unrealized</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/20 to-black rounded-xl p-3 border border-yellow-500/40">
            <Trophy className="w-6 h-6 mx-auto text-yellow-400 mb-1" />
            <p className="text-2xl font-black text-yellow-400">{perf.stats?.winRate || "0.0%"}</p>
            <p className="text-xs text-yellow-400">Win Rate</p>
          </div>
          <div className="bg-gradient-to-br from-orange-900/20 to-black rounded-xl p-3 border border-orange-500/40">
            <Package className="w-6 h-6 mx-auto text-orange-400 mb-1" />
            <p className="text-2xl font-black text-orange-300">{bot.positions ?? 0}</p>
            <p className="text-xs text-orange-400">Positions</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/25 via-purple-900/20 to-black rounded-xl p-4 border border-red-600/60">
          <div onClick={() => setShowRisk(!showRisk)} className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Shield className="w-8 h-8 text-red-400 group-hover:scale-110 transition" />
                {bot.positions > 0 && <div className="absolute inset-0 animate-ping"><Shield className="w-8 h-8 text-red-400 opacity-60" /></div>}
              </div>
              <div>
                <h3 className="text-lg font-black bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
                  RISK CONTROL
                </h3>
                <p className="text-red-300 text-xs font-bold">{bot.positions > 0 ? "ARMED" : "STANDBY"}</p>
              </div>
            </div>
            {showRisk ? <ChevronUp className="w-5 h-5 text-red-400" /> : <ChevronDown className="w-5 h-5 text-red-400" />}
          </div>

          {showRisk && (
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="bg-black/70 rounded-lg p-2.5 border border-red-600/60">
                <div className="flex justify-between mb-1"><span className="text-red-400 font-bold">Daily</span><span>8.0%</span></div>
                <div className="w-full bg-red-950/70 rounded-full h-5 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all" style={{ width: `${Math.min((dailyDD / 8) * 100, 100)}%` }} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-black font-bold">{dailyDD.toFixed(1)}%</span>
                </div>
              </div>
              <div className="bg-black/70 rounded-lg p-2.5 border border-orange-600/60">
                <div className="flex justify-between mb-1"><span className="text-orange-400 font-bold">Weekly</span><span>20.0%</span></div>
                <div className="w-full bg-orange-950/70 rounded-full h-5 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all" style={{ width: `${Math.min((weeklyDD / 20) * 100, 100)}%` }} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-black font-bold">{weeklyDD.toFixed(1)}%</span>
                </div>
              </div>
              <div className={`bg-black/70 rounded-lg p-2.5 border ${totalDD > 30 ? 'border-red-600/90 animate-pulse' : 'border-yellow-600/60'}`}>
                <div className="flex justify-between mb-1"><span className="text-yellow-400 font-bold">Max DD</span><span>35.0%</span></div>
                <div className="w-full bg-yellow-950/70 rounded-full h-5 overflow-hidden relative">
                  <div className={`absolute inset-0 rounded-full transition-all ${totalDD > 30 ? 'bg-red-500' : 'bg-gradient-to-r from-yellow-600 to-yellow-400'}`} style={{ width: `${(totalDD / 35) * 100}%` }} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-black font-bold">{totalDD.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="group relative px-8 py-3.5 rounded-xl text-lg font-black bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all shadow-2xl shadow-purple-600/60 border-3 border-purple-400 flex items-center gap-3"
          >
            {scanning ? <Activity className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 group-hover:rotate-12 transition" />}
            <span>{scanning ? "HUNTING..." : "FORCE SCAN"}</span>
          </button>
        </div>

        {bot.rockets?.length > 0 && (
          <div className="bg-black/60 rounded-xl p-4 border border-purple-500/50">
            <h3 className="text-xl font-black text-center mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ACTIVE ROCKETS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {bot.rockets.map((r: string, i: number) => {
                const symbol = r.split(' ')[0];
                const pct = r.match(/\+([\d.]+)%/)?.[1] || "?";
                const pattern = r.match(/\[(.*?)\]/)?.[1]?.replace(/_/g, ' ') || "ALPHA";
                const hot = parseFloat(pct) > 30;
                return (
                  <div key={i} className="relative bg-gradient-to-br from-purple-900/50 to-pink-900/30 rounded-xl p-4 text-center border border-purple-500/50 hover:scale-105 transition">
                    {hot && <Flame className="absolute top-1 right-1 w-5 h-5 text-orange-400 animate-pulse" />}
                    <Rocket className="w-8 h-8 mx-auto text-purple-300 mb-1" />
                    <p className="text-lg font-black text-purple-300">{symbol}</p>
                    <p className="text-2xl font-black text-emerald-400">+{pct}%</p>
                    <p className="text-xs uppercase tracking-wider text-pink-400 font-bold">{pattern}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-black/60 rounded-xl p-4 border border-purple-500/50">
          <h3 className="text-xl font-black text-center mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            LIVE EQUITY CURVE
          </h3>
          <div className="h-48 bg-black/80 rounded-xl overflow-hidden border border-purple-500/30">
            <canvas ref={canvasRef} width={1000} height={192} className="w-full h-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
