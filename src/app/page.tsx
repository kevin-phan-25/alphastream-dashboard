'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Zap, Activity, Trophy, Package, Shield, AlertTriangle, X, ChevronDown, ChevronUp, TrendingUp, AlertCircle } from 'lucide-react';

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

  // Equity Curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || perf.recent?.length < 2) return;
    const ctx = canvas.getContext('2d')!;
    const equities = perf.recent.map((t: any) => parseFloat(t.equity) || 100000);
    const min = Math.min(...equities);
    const max = Math.max(...equities);
    const range = max - min || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#c084fc';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();

    equities.forEach((eq: number, i: number) => {
      const x = (i / (equities.length - 1)) * canvas.width;
      const y = canvas.height - ((eq - min) / range) * (canvas.height * 0.86) + 20;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [perf.recent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-24 h-24 text-purple-500 animate-spin" />
      </div>
    );
  }

  const s = perf.stats;
  const unreal = bot.unrealized || "+$0";
  const equity = parseFloat(bot.equity?.replace(/[$,]/g, '') || "100000");
  const riskActive = bot.positions > 0;

  // Simulated live risk values (replace with real from backend later)
  const dailyDD = Math.random() * 6.8;
  const weeklyDD = Math.random() * 14;
  const totalDD = Math.random() * 22;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-2xl border-b border-purple-500/40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 flex items-center justify-center text-3xl font-black shadow-2xl shadow-purple-600/50">
              α
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                AlphaStream
              </h1>
              <p className="text-sm text-purple-400 font-medium tracking-wider">v100 ELITE • 2025 MOMENTUM ENGINE</p>
            </div>
          </div>
          <div className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-lg font-bold shadow-2xl shadow30 shadow-purple-500/40 border border-purple-400">
            {bot.mode || "LIVE"}
          </div>
        </div>
      </header>

      <main className="pt-32 pb-16 px-6 max-w-7xl mx-auto space-y-10">

        {/* HERO */}
        <div className="text-center">
          <h2 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            ALPHA SNIPER
          </h2>
          <p className="text-purple-300 mt-3 text-xl font-medium tracking-wider">7 Proprietary Patterns • Finnhub Catalyst Engine</p>
        </div>

        {/* MAIN STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-900/30 to-black rounded-3xl p-7 border border-purple-500/50 backdrop-blur-sm">
            <p className="text-4xl font-black text-purple-300">{bot.equity || "$100,000"}</p>
            <p className="text-purple-400 text-sm mt-1">Portfolio Value</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/30 to-black rounded-3xl p-7 border ${unreal.startsWith('+') ? 'border-emerald-500/50' : 'border-red-500/50'} backdrop-blur-sm">
            <p className={`text-4xl font-black ${unreal.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
              {unreal}
            </p>
            <p className="text-emerald-400 text-sm mt-1">Unrealized P&L</p>
          </div>
          <div onClick={() => setShowWin(true)} className="bg-gradient-to-br from-yellow-900/30 to-black rounded-3xl p-7 border border-yellow-500/50 backdrop-blur-sm cursor-pointer hover:scale-105 transition">
            <Trophy className="w-12 h-12 mx-auto text-yellow-400 mb-3" />
            <p className="text-5xl font-black text-yellow-400">{s.winRate?.replace('%', '') || "0.0"}%</p>
            <p className="text-yellow-400 text-sm mt-1">Win Rate</p>
          </div>
          <div onClick={() => setShowPos(true)} className="bg-gradient-to-br from-orange-900/30 to-black rounded-3xl p-7 border border-orange-500/50 backdrop-blur-sm cursor-pointer hover:scale-105 transition">
            <Package className="w-12 h-12 mx-auto text-orange-400 mb-3" />
            <p className="text-5xl font-black text-orange-300">{bot.positions || 0}</p>
            <p className="text-orange-400 text-sm mt-1">Live Positions</p>
          </div>
        </div>

        {/* INTERACTIVE RISK CONTROL CENTER */}
        <div className="bg-gradient-to-br from-red-900/30 via-purple-900/30 to-black rounded-3xl p-8 border-2 border-red-600/70 backdrop-blur-xl shadow-2xl shadow-red-600/30">
          <div onClick={() => setShowRisk(!showRisk)} className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Shield className="w-16 h-16 text-red-400 group-hover:scale-110 transition" />
                {riskActive && <div className="absolute inset-0 animate-ping"><Shield className="w-16 h-16 text-red-400 opacity-70" /></div>}
              </div>
              <div>
                <h3 className="text-4xl font-black bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  RISK CONTROL CENTER
                </h3>
                <p className="text-red-300 font-bold tracking-wider">
                  {riskActive ? "ARMED • FULL PROTECTION" : "STANDBY • NO EXPOSURE"}
                </p>
              </div>
            </div>
            {showRisk ? <ChevronUp className="w-10 h-10 text-red-400" /> : <ChevronDown className="w-10 h-10 text-red-400" />}
          </div>

          {showRisk && (
            <div className="mt-8 space-y-7">
              {/* Daily */}
              <div className="bg-black/70 rounded-2xl p-6 border border-red-600/60">
                <div className="flex justify-between mb-3">
                  <span className="text-red-400 font-bold text-lg">Daily Loss Limit</span>
                  <span className="text-3xl font-black text-red-400">8.00%</span>
                </div>
                <div className="w-full bg-red-950/70 rounded-full h-10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-1000 flex items-center justify-end pr-4 text-black font-bold" style={{ width: `${Math.min((dailyDD / 8) * 100, 100)}%` }}>
                    {dailyDD.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Weekly */}
              <div className="bg-black/70 rounded-2xl p-6 border border-orange-600/60">
                <div className="flex justify-between mb-3">
                  <span className="text-orange-400 font-bold text-lg">Weekly Loss Limit</span>
                  <span className="text-3xl font-black text-orange-400">20.00%</span>
                </div>
                <div className="w-full bg-orange-950/70 rounded-full h-10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 flex items-center justify-end pr-4 text-black font-bold" style={{ width: `${Math.min((weeklyDD / 20) * 100, 100)}%` }}>
                    {weeklyDD.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Max DD */}
              <div className="bg-black/70 rounded-2xl p-6 border ${totalDD > 30 ? 'border-red-600/80 animate-pulse' : 'border-yellow-600/60'}">
                <div className="flex justify-between mb-3">
                  <span className="text-yellow-400 font-bold text-lg">Maximum Drawdown</span>
                  <span className={`text-3xl font-black ${totalDD > 30 ? 'text-red-400' : 'text-yellow-400'}`}>35.00%</span>
                </div>
                <div className="w-full bg-yellow-950/70 rounded-full h-10 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1500 flex items-center justify-end pr-4 text-black font-bold ${totalDD > 30 ? 'bg-red-500' : 'bg-gradient-to-r from-yellow-600 to-yellow-400'}`} style={{ width: `${(totalDD / 35) * 100}%` }}>
                    {totalDD.toFixed(1)}%
                  </div>
                </div>
              </div>

              {totalDD > 25 && (
                <div className="mt-6 p-6 bg-red-900/80 border-4 border-red-500 rounded-2xl animate-pulse text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-3" />
                  <p className="text-2xl font-black text-red-300 tracking-wider">
                    DRAWDOWN ALERT • {totalDD.toFixed(1)}% FROM PEAK • CAUTION
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FORCE SCAN */}
        <div className="flex justify-center">
          <button onClick={forceScan} disabled={scanning} className={`
            group relative px-16 py-8 rounded-3xl text-3xl font-black tracking-widest
            bg-gradient-to-r from-purple-600 to-pink-600
            hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all duration-300
            shadow-3xl shadow-purple-600/50 border-4 border-purple-400
            flex items-center gap-6 overflow-hidden ${scanning ? 'animate-pulse' : ''}
          `}>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-30 transition"></div>
            <Zap className={`w-12 h-12 ${scanning ? 'animate-spin' : 'group-hover:rotate-12 transition'}`} />
            <span>{scanning ? "HUNTING TARGETS..." : "FORCE SCAN"}</span>
          </button>
        </div>

        {/* ACTIVE ROCKETS */}
        {bot.rockets?.length > 0 && (
          <div className="bg-black/70 rounded-3xl p-10 border-2 border-purple-500/60 backdrop-blur-sm">
            <h3 className="text-4xl font-black text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ACTIVE ROCKETS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {bot.rockets.map((r: string, i: number) => {
                const symbol = r.split(' ')[0];
                const pct = r.match(/\+([\d.]+)%/)?.[1] || "?";
                const pattern = r.match(/\[(.*?)\]/)?.[1] || "ALPHA";
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-900/50 to-pink-900/30 rounded-3xl p-8 text-center border border-purple-500/50 hover:scale-110 transition">
                    <p className="text-3xl font-black text-purple-300">{symbol}</p>
                    <p className="text-5xl font-black text-emerald-400 mt-2">+{pct}%</p>
                    <p className="text-sm uppercase tracking-widest text-pink-400 mt-3 font-bold">{pattern.replace('_', ' ')}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EQUITY CURVE */}
        <div className="bg-black/70 rounded-3xl p-10 border-2 border-purple-500/60 backdrop-blur-sm">
          <h3 className="text-4xl font-black text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            LIVE EQUITY CURVE
          </h3>
          <div className="h-80 bg-black/90 rounded-3xl overflow-hidden border border-purple-500/40">
            {perf.recent?.length > 1 ? (
              <canvas ref={canvasRef} width={1200} height={320} className="w-full h-full" />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-purple-400/60 text-2xl font-medium">Awaiting first execution...</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* MODALS */}
      {showWin && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6" onClick={() => setShowWin(false)}>
          <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/70 rounded-3xl p-12 border-4 border-purple-400 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-4xl font-black text-purple-300">WIN RATE</h3>
              <X className="w-10 h-10 cursor-pointer text-purple-400 hover:text-pink-400 transition" onClick={() => setShowWin(false)} />
            </div>
            <div className="text-center space-y-6">
              <p className="text-9xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {s.winRate || "0.0%"}
              </p>
              <p className="text-2xl text-purple-300">Total Trades: {s.trades || 0}</p>
              <p className="text-3xl text-emerald-400">Avg Win: {s.avgWin || "+0%"}</p>
            </div>
          </div>
        </div>
      )}

      {showPos && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6" onClick={() => setShowPos(false)}>
          <div className="bg-gradient-to-br from-orange-900/90 to-red-900/70 rounded-3xl p-12 border-4 border-orange-500 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-4xl font-black text-orange-300">POSITIONS</h3>
              <X className="w-10 h-10 cursor-pointer text-orange-400 hover:text-red-400 transition" onClick={() => setShowPos(false)} />
            </div>
            <p className="text-9xl font-black text-center text-orange-300">{bot.positions || 0}</p>
            <p className="text-3xl text-center text-orange-400 mt-6">ACTIVE TRADES</p>
          </div>
        </div>
      )}
    </div>
  );
}
