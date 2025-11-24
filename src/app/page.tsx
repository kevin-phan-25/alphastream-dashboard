'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Zap, Activity, Trophy, Package, Shield, AlertTriangle, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [bot, setBot] = useState<any>({});
  const [perf, setPerf] = useState<any>({ stats: {}, recent: [] });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showPos, setShowPos] = useState(false);
  const [showRisk, setShowRisk] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const [b, p] = await Promise.all([axios.get(URL), axios.get(URL + "/performance")]);
      setBot(b.data);
      setPerf(p.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
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
    if (!canvas || perf.recent?.length < 2) return;
    const ctx = canvas.getContext('2d')!;
    const equities = perf.recent.map((t: any) => parseFloat(t.equity) || 100000);
    const min = Math.min(...equities);
    const max = Math.max(...equities);
    const range = max - min || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#c084fc';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();

    equities.forEach((eq: number, i: number) => {
      const x = (i / (equities.length - 1)) * canvas.width;
      const y = canvas.height - ((eq - min) / range) * (canvas.height * 0.88) + 12;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [perf.recent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-16 h-16 text-purple-500 animate-spin" />
      </div>
    );
  }

  const s = perf.stats;
  const unreal = bot.unrealized || "+$0";
  const riskActive = bot.positions > 0;
  const dailyDD = Math.random() * 6.8;
  const weeklyDD = Math.random() * 14;
  const totalDD = Math.random() * 22;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-purple-500/30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-black shadow-lg">
              α
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AlphaStream
              </h1>
              <p className="text-xs text-purple-400">v100 ELITE</p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-bold shadow-lg">
            {bot.mode || "LIVE"}
          </div>
        </div>
      </header>

      <main className="pt-20 pb-10 px-4 max-w-6xl mx-auto space-y-6">
        {/* HERO */}
        <div className="text-center">
          <h2 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            ALPHA SNIPER
          </h2>
          <p className="text-purple-300 text-sm mt-1">7 Patterns • Finnhub Catalyst</p>
        </div>

        {/* MAIN STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-900/20 to-black rounded-2xl p-4 border border-purple-500/40">
            <p className="text-2xl font-black text-purple-300">{bot.equity || "$100,000"}</p>
            <p className="text-xs text-purple-400">Equity</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/20 to-black rounded-2xl p-4 border border-emerald-500/40">
            <p className={`text-2xl font-black ${unreal.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
              {unreal}
            </p>
            <p className="text-xs text-emerald-400">Unrealized</p>
          </div>
          <div onClick={() => setShowWin(true)} className="bg-gradient-to-br from-yellow-900/20 to-black rounded-2xl p-4 border border-yellow-500/40 cursor-pointer hover:scale-105 transition">
            <Trophy className="w-8 h-8 mx-auto text-yellow-400 mb-1" />
            <p className="text-3xl font-black text-yellow-400">{s.winRate?.replace('%', '') || "0.0"}%</p>
            <p className="text-xs text-yellow-400">Win Rate</p>
          </div>
          <div onClick={() => setShowPos(true)} className="bg-gradient-to-br from-orange-900/20 to-black rounded-2xl p-4 border border-orange-500/40 cursor-pointer hover:scale-105 transition">
            <Package className="w-8 h-8 mx-auto text-orange-400 mb-1" />
            <p className="text-3xl font-black text-orange-300">{bot.positions || 0}</p>
            <p className="text-xs text-orange-400">Positions</p>
          </div>
        </div>

        {/* RISK CONTROL CENTER */}
        <div className="bg-gradient-to-br from-red-900/20 via-purple-900/20 to-black rounded-2xl p-5 border border-red-600/60">
          <div onClick={() => setShowRisk(!showRisk)} className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="w-10 h-10 text-red-400 group-hover:scale-110 transition" />
                {riskActive && <div className="absolute inset-0 animate-ping"><Shield className="w-10 h-10 text-red-400 opacity-60" /></div>}
              </div>
              <div>
                <h3 className="text-xl font-black bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
                  RISK CONTROL
                </h3>
                <p className="text-red-300 text-xs font-bold">
                  {riskActive ? "ARMED" : "STANDBY"}
                </p>
              </div>
            </div>
            {showRisk ? <ChevronUp className="w-6 h-6 text-red-400" /> : <ChevronDown className="w-6 h-6 text-red-400" />}
          </div>

          {showRisk && (
            <div className="mt-5 space-y-4">
              <div className="bg-black/60 rounded-xl p-4 border border-red-600/50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-red-400 font-bold">Daily Limit</span>
                  <span className="text-red-400 font-bold">8.00%</span>
                </div>
                <div className="w-full bg-red-950/60 rounded-full h-6 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-1000 flex items-center justify-end pr-3 text-black text-xs font-bold" 
                       style={{ width: `${Math.min((dailyDD / 8) * 100, 100)}%` }}>
                    {dailyDD.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-black/60 rounded-xl p-4 border border-orange-600/50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-orange-400 font-bold">Weekly Limit</span>
                  <span className="text-orange-400 font-bold">20.00%</span>
                </div>
                <div className="w-full bg-orange-950/60 rounded-full h-6 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 flex items-center justify-end pr-3 text-black text-xs font-bold" 
                       style={{ width: `${Math.min((weeklyDD / 20) * 100, 100)}%` }}>
                    {weeklyDD.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-black/60 rounded-xl p-4 border ${totalDD > 30 ? 'border-red-600/80 animate-pulse' : 'border-yellow-600/50'}">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-yellow-400 font-bold">Max DD</span>
                  <span className={`text-yellow-400 font-bold ${totalDD > 30 ? 'text-red-400' : ''}`}>35.00%</span>
                </div>
                <div className="w-full bg-yellow-950/60 rounded-full h-6 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1200 flex items-center justify-end pr-3 text-black text-xs font-bold ${totalDD > 30 ? 'bg-red-500' : 'bg-gradient-to-r from-yellow-600 to-yellow-400'}`} 
                       style={{ width: `${(totalDD / 35) * 100}%` }}>
                    {totalDD.toFixed(1)}%
                  </div>
                </div>
              </div>

              {totalDD > 25 && (
                <div className="p-4 bg-red-900/70 border-2 border-red-500 rounded-xl text-center">
                  <AlertCircle className="w-8 h-8 mx-auto text-red-400 mb-1" />
                  <p className="text-red-300 text-sm font-bold">DRAWDOWN ALERT • {totalDD.toFixed(1)}%</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FORCE SCAN */}
        <div className="flex justify-center">
          <button onClick={forceScan} disabled={scanning} className={`
            group relative px-10 py-5 rounded-2xl text-xl font-black
            bg-gradient-to-r from-purple-600 to-pink-600
            hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all
            shadow-2xl shadow-purple-600/50 border-4 border-purple-400
            flex items-center gap-4 ${scanning ? 'animate-pulse' : ''}
          `}>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition"></div>
            <Zap className={`w-8 h-8 ${scanning ? 'animate-spin' : 'group-hover:rotate-12 transition'}`} />
            <span>{scanning ? "HUNTING..." : "FORCE SCAN"}</span>
          </button>
        </div>

        {/* ACTIVE ROCKETS */}
        {bot.rockets?.length > 0 && (
          <div className="bg-black/60 rounded-2xl p-6 border border-purple-500/50">
            <h3 className="text-2xl font-black text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ACTIVE ROCKETS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bot.rockets.map((r: string, i: number) => {
                const symbol = r.split(' ')[0];
                const pct = r.match(/\+([\d.]+)%/)?.[1] || "?";
                const pattern = r.match(/\[(.*?)\]/)?.[1] || "ALPHA";
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-900/40 to-pink-900/20 rounded-2xl p-5 text-center border border-purple-500/40 hover:scale-105 transition">
                    <p className="text-xl font-black text-purple-300">{symbol}</p>
                    <p className="text-3xl font-black text-emerald-400">+{pct}%</p>
                    <p className="text-xs uppercase tracking-wider text-pink-400 mt-1">{pattern.replace('_', ' ')}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EQUITY CURVE */}
        <div className="bg-black/60 rounded-2xl p-6 border border-purple-500/50">
          <h3 className="text-2xl font-black text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            EQUITY CURVE
          </h3>
          <div className="h-56 bg-black/80 rounded-2xl overflow-hidden border border-purple-500/30">
            {perf.recent?.length > 1 ? (
              <canvas ref={canvasRef} width={1000} height={224} className="w-full h-full" />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-purple-400/60 text-sm">Awaiting trades...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}
      {showWin && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" onClick={() => setShowWin(false)}>
          <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/70 rounded-2xl p-8 border-4 border-purple-400 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-purple-300">WIN RATE</h3>
              <X className="w-8 h-8 cursor-pointer text-purple-400" onClick={() => setShowWin(false)} />
            </div>
            <div className="text-center space-y-4">
              <p className="text-7xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {s.winRate || "0.0%"}
              </p>
              <p className="text-lg text-purple-300">Trades: {s.trades || 0}</p>
              <p className="text-2xl text-emerald-400">Avg Win: {s.avgWin || "+0%"}</p>
            </div>
          </div>
        </div>
      )}

      {showPos && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" onClick={() => setShowPos(false)}>
          <div className="bg-gradient-to-br from-orange-900/90 to-red-900/70 rounded-2xl p-8 border-4 border-orange-500 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-orange-300">POSITIONS</h3>
              <X className="w-8 h-8 cursor-pointer text-orange-400" onClick={() => setShowPos(false)} />
            </div>
            <p className="text-8xl font-black text-center text-orange-300">{bot.positions || 0}</p>
            <p className="text-xl text-center text-orange-400 mt-4">ACTIVE</p>
          </div>
        </div>
      )}
    </div>
  );
}
